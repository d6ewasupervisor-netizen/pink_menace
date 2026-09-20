/**
 * useTouchControls — Multi-touch + keyboard + gamepad input for vehicle control
 *
 * Touch layout:
 *   Top 60%:    Steering zone (horizontal drag)
 *   Bot-left:   Brake
 *   Bot-right:  Gas (throttle)
 *
 * Gamepad (Standard mapping):
 *   Left stick X:  Steering (with dead zone)
 *   Right trigger:  Throttle (analog)
 *   Left trigger:   Brake (analog)
 *   A button:       Throttle (digital fallback)
 *   B / X button:   Brake (digital fallback)
 *   Start:          Pause
 *   D-pad L/R:      Steering (digital fallback)
 */
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';

// ─── Touch layout ─────────────────────────────────────────────────────────────
// Left  50 % of screen  → STEER (position-based, no dragging required)
// Right 50 % of screen  → upper 65 % = THROTTLE, lower 35 % = BRAKE
//
// Steering formula: steer = (relX - STEER_CENTER) / STEER_HALF
//   relX = 0 (far left)  → −1.0 (full left)
//   relX = 0.25 (centre of left zone) → 0.0 (straight)
//   relX = 0.5 (boundary) → +1.0 (full right)
const STEER_ZONE_RIGHT = 0.50; // left half is the steer zone
const STEER_CENTER     = 0.25; // midpoint of steer zone
const STEER_HALF       = 0.25; // half-width → maps zone to −1..+1
const BRAKE_SPLIT_Y    = 0.65; // within right zone: above = throttle, below = brake

const GAMEPAD_DEAD_ZONE = 0.12;
const GAMEPAD_POLL_INTERVAL = 16;

interface ActiveTouch {
  zone: 'steer' | 'brake' | 'throttle';
  /** Current normalised X within the element (updated on move). */
  relX: number;
  startX: number;
  startY: number;
}

export function useTouchControls() {
  const activeTouch = useRef<Map<number, ActiveTouch>>(new Map());
  const gamepadActive = useRef(false);
  const lastPausePress = useRef(0);
  const startPressedRef = useRef(false);

  useEffect(() => {
    const store = () => useGameStore.getState();
    const maybeEnterDriving = (controls: { steering: number; throttle: number; brake: number }) => {
      const phase = store().phase;
      const hasMovementIntent =
        Math.abs(controls.steering) > 0.05 || controls.throttle > 0.05 || controls.brake > 0.05;
      if ((phase === 'menu' || phase === 'paused') && hasMovementIntent) {
        store().setPhase(phase === 'paused' ? store().prePausePhase : 'driving');
      }
    };

    // ── Keyboard ─────────────────────────────────────────────────────────────
    const keys = new Set<string>();

    function applyKeyboard() {
      // keyboard active
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      const fwd = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
      // Space is the emergency brake — it brakes but never engages reverse.
      // S / ArrowDown is the regular back-pedal that can also reverse from a stop.
      const back = keys.has('ArrowDown') || keys.has('s') || keys.has('S');
      const eBrake = keys.has(' ');

      const sensitivity = store().steeringSensitivity;
      const steering = left ? -1 * sensitivity : right ? 1 * sensitivity : 0;

      const controls = {
        steering: Math.max(-1, Math.min(1, steering)),
        throttle: fwd ? 1 : 0,
        brake: (back || eBrake) ? 1 : 0,
        emergencyBrake: eBrake,
      };
      store().setControls(controls);
      maybeEnterDriving(controls);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (e.key === 'h' || e.key === 'H') useQRHud.getState().setHorn(true);
      if (e.key === 'Shift') useQRHud.getState().setRun(true);
      applyKeyboard();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key);
      if (e.key === 'h' || e.key === 'H') useQRHud.getState().setHorn(false);
      if (e.key === 'Shift') useQRHud.getState().setRun(false);
      applyKeyboard();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ── Touch ─────────────────────────────────────────────────────────────────
    function getZone(clientX: number, clientY: number, el: HTMLElement): ActiveTouch['zone'] {
      const rect = el.getBoundingClientRect();
      const relX = (clientX - rect.left) / rect.width;
      const relY = (clientY - rect.top) / rect.height;
      if (relX < STEER_ZONE_RIGHT) return 'steer';
      return relY < BRAKE_SPLIT_Y ? 'throttle' : 'brake';
    }

    function getRelX(clientX: number, el: HTMLElement): number {
      const rect = el.getBoundingClientRect();
      return (clientX - rect.left) / rect.width;
    }

    function applyTouch() {
      const entries = [...activeTouch.current.values()];
      const hasBrake    = entries.some((t) => t.zone === 'brake');
      const hasThrottle = entries.some((t) => t.zone === 'throttle');
      const steerEntry  = entries.find((t) => t.zone === 'steer');
      const sensitivity = store().steeringSensitivity;

      // Position-based steering: where your thumb sits in the left zone
      // determines the angle — no drag distance required.
      let steer = 0;
      if (steerEntry) {
        steer = Math.max(-1, Math.min(1, (steerEntry.relX - STEER_CENTER) / STEER_HALF));
      }

      const controls = {
        steering: Math.max(-1, Math.min(1, steer * sensitivity)),
        throttle: hasThrottle ? 1 : 0,
        brake: hasBrake ? 1 : 0,
        emergencyBrake: false,
      };
      store().setControls(controls);
      maybeEnterDriving(controls);
    }

    // Taps on UI (quiz answers, dialogue box, cards, horn, menus) are not driving input.
    // A touch that starts on UI must be left alone on ALL three events: preventDefault on
    // touchend is what suppresses the synthesized click, and on touchmove it blocks scrolling
    // inside the card overlay. This is why taps worked with a mouse and not on a phone.
    function isUiTouch(e: TouchEvent): boolean {
      const target = e.target as HTMLElement | null;
      return !!(target && target.closest && target.closest('button, a, input, select, textarea, [data-ui]'));
    }

    function onTouchStart(e: TouchEvent) {
      if (isUiTouch(e)) return;
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      for (const touch of Array.from(e.changedTouches)) {
        const zone = getZone(touch.clientX, touch.clientY, el);
        activeTouch.current.set(touch.identifier, {
          zone,
          relX: getRelX(touch.clientX, el),
          startX: touch.clientX,
          startY: touch.clientY,
        });
      }
      applyTouch();
    }

    function onTouchMove(e: TouchEvent) {
      if (isUiTouch(e)) return;
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      for (const touch of Array.from(e.changedTouches)) {
        const data = activeTouch.current.get(touch.identifier);
        if (data) {
          // Update relX so position-based steer tracks the moving thumb
          data.relX = getRelX(touch.clientX, el);
          // If the thumb slides into the other zone while held, reclassify it
          // (e.g. gas thumb drifts left into the steer zone — prevent hijacking)
          // We intentionally DON'T reclassify: initial zone is sticky per touch.
        }
      }
      applyTouch();
    }

    function onTouchEnd(e: TouchEvent) {
      if (isUiTouch(e)) return;
      e.preventDefault();
      for (const touch of Array.from(e.changedTouches)) {
        activeTouch.current.delete(touch.identifier);
      }
      if (activeTouch.current.size === 0 && keys.size === 0) {
        applyIdleControls();
      } else {
        applyTouch();
      }
    }

    const container = document.getElementById('game-touch-area');
    if (container) {
      container.addEventListener('touchstart', onTouchStart, { passive: false });
      container.addEventListener('touchmove', onTouchMove, { passive: false });
      container.addEventListener('touchend', onTouchEnd, { passive: false });
      container.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }

    // ── Gamepad ───────────────────────────────────────────────────────────────
    function applyDeadZone(value: number): number {
      return Math.abs(value) < GAMEPAD_DEAD_ZONE ? 0 : value;
    }

    function applyIdleControls() {
      store().setControls({ steering: 0, throttle: 0, brake: 0, emergencyBrake: false });
    }

    function hasActiveTouchInput() {
      return activeTouch.current.size > 0;
    }

    function pollGamepad() {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let pad: Gamepad | null = null;

      // Find first connected gamepad
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          pad = gp;
          break;
        }
      }

      if (!pad) {
        gamepadActive.current = false;
        startPressedRef.current = false;
        if (keys.size > 0) {
          applyKeyboard();
        } else if (!hasActiveTouchInput()) {
          applyIdleControls();
        }
        return;
      }

      const kbLeft = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      const kbRight = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      const kbForward = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
      const kbBack = keys.has('ArrowDown') || keys.has('s') || keys.has('S') || keys.has(' ');

      // Standard gamepad mapping:
      // axes[0] = left stick X, axes[1] = left stick Y
      // buttons[0] = A, buttons[1] = B, buttons[2] = X, buttons[3] = Y
      // buttons[4] = LB, buttons[5] = RB
      // buttons[6] = LT (analog trigger), buttons[7] = RT (analog trigger)
      // buttons[9] = Start/Menu
      // buttons[12] = D-Up, buttons[13] = D-Down, buttons[14] = D-Left, buttons[15] = D-Right

      const stickX = applyDeadZone(pad.axes[0] ?? 0);

      // Triggers — some gamepads report as axes[2]/axes[5], others as buttons[6]/buttons[7]
      let triggerThrottle = 0;
      let triggerBrake = 0;

      // Try button values first (standard mapping)
      if (pad.buttons[7]) {
        triggerThrottle = pad.buttons[7].value; // RT
      }
      if (pad.buttons[6]) {
        triggerBrake = pad.buttons[6].value; // LT
      }

      // Digital fallbacks
      const aButton = pad.buttons[0]?.pressed ?? false;  // A = throttle
      const bButton = pad.buttons[1]?.pressed ?? false;  // B = brake
      const xButton = pad.buttons[2]?.pressed ?? false;  // X = brake alt

      // D-pad steering fallback
      const dpadLeft = pad.buttons[14]?.pressed ?? false;
      const dpadRight = pad.buttons[15]?.pressed ?? false;

      // Combine inputs
      const throttle = Math.max(triggerThrottle, aButton ? 1 : 0);
      const brake = Math.max(triggerBrake, bButton || xButton ? 1 : 0);
      let steering = stickX;
      if (dpadLeft) steering = -1;
      if (dpadRight) steering = 1;

      // Merge keyboard + gamepad so a connected pad with slight stick drift
      // cannot suppress keyboard throttle/brake.
      const kbThrottle = kbForward ? 1 : 0;
      const kbBrake = kbBack ? 1 : 0;
      if (kbLeft || kbRight) steering = kbLeft ? -1 : 1;

      // Only treat real stick/pedal input as gamepad driving. (Any-button checks
      // cause phantom "input" on some drivers and overwrite keyboard with zeros.)
      const eps = 0.02;
      const hasMovementInput =
        Math.abs(steering) > eps ||
        Math.max(throttle, kbThrottle) > eps ||
        Math.max(brake, kbBrake) > eps;

      if (hasMovementInput) {
        gamepadActive.current = true;
        const sensitivity = store().steeringSensitivity;
        const controls = {
          steering: Math.max(-1, Math.min(1, steering * sensitivity)),
          throttle: Math.min(1, Math.max(throttle, kbThrottle)),
          brake: Math.min(1, Math.max(brake, kbBrake)),
          emergencyBrake: keys.has(' '), // honour spacebar even when gamepad is active
        };
        store().setControls(controls);
        maybeEnterDriving(controls);
      } else {
        gamepadActive.current = false;
        if (keys.size > 0) {
          applyKeyboard();
        } else if (!hasActiveTouchInput()) {
          applyIdleControls();
        }
      }

      // Pause button (Start/Menu) — debounced
      const startButton = pad.buttons[9]?.pressed ?? false;
      const now = Date.now();
      if (startButton && !startPressedRef.current && now - lastPausePress.current > 300) {
        lastPausePress.current = now;
        store().togglePause();
      }
      startPressedRef.current = startButton;
    }

    // Poll gamepad at ~60fps
    const gamepadInterval = setInterval(pollGamepad, GAMEPAD_POLL_INTERVAL);

    // Gamepad connection events (for HUD notification)
    const onGamepadConnected = (e: GamepadEvent) => {
      gamepadActive.current = true;
      console.log(`Gamepad connected: ${e.gamepad.id}`);
    };
    const onGamepadDisconnected = () => {
      gamepadActive.current = false;
      startPressedRef.current = false;
    };

    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      clearInterval(gamepadInterval);
      if (container) {
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
        container.removeEventListener('touchend', onTouchEnd);
        container.removeEventListener('touchcancel', onTouchEnd);
      }
    };
  }, []);
}
