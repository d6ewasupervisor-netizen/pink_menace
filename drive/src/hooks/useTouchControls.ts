/**
 * useTouchControls — keyboard + gamepad. Sticks live in TouchOverlay.
 *
 * Stick / key / pad merge through driveInput so the 16 ms gamepad poll
 * cannot zero a live thumb stick.
 */
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useQRHud } from '@/stores/qrHud';
import {
  getStickAxes,
  liveKeys,
  mergeDriveInput,
  setLivePad,
} from '@/input/driveInput';

const GAMEPAD_DEAD_ZONE = 0.12;
const GAMEPAD_POLL_INTERVAL = 16;

function applyDeadZone(value: number): number {
  return Math.abs(value) < GAMEPAD_DEAD_ZONE ? 0 : value;
}

export function flushDriveInput() {
  const store = useGameStore.getState();
  const controls = mergeDriveInput(store.steeringSensitivity);
  store.setControls(controls);
  const hasMovement =
    Math.abs(controls.steering) > 0.05 || controls.throttle > 0.05 || controls.brake > 0.05;
  const phase = store.phase;
  if ((phase === 'menu' || phase === 'paused') && hasMovement) {
    store.setPhase(phase === 'paused' ? store.prePausePhase : 'driving');
  }
}

export function useTouchControls() {
  const lastPausePress = useRef(0);
  const startPressedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      liveKeys.add(e.key);
      if (e.key === 'h' || e.key === 'H') useQRHud.getState().setHorn(true);
      if (e.key === 'Shift') useQRHud.getState().setRun(true);
      flushDriveInput();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      liveKeys.delete(e.key);
      if (e.key === 'h' || e.key === 'H') useQRHud.getState().setHorn(false);
      if (e.key === 'Shift') useQRHud.getState().setRun(false);
      flushDriveInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function pollGamepad() {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let pad: Gamepad | null = null;
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          pad = gp;
          break;
        }
      }

      if (!pad) {
        startPressedRef.current = false;
        setLivePad(null);
        if (liveKeys.size > 0 || getStickAxes().active) {
          flushDriveInput();
        } else {
          useGameStore.getState().setControls({
            steering: 0,
            throttle: 0,
            brake: 0,
            emergencyBrake: false,
          });
        }
        return;
      }

      const stickX = applyDeadZone(pad.axes[0] ?? 0);
      let triggerThrottle = pad.buttons[7]?.value ?? 0;
      let triggerBrake = pad.buttons[6]?.value ?? 0;
      const aButton = pad.buttons[0]?.pressed ?? false;
      const bButton = pad.buttons[1]?.pressed ?? false;
      const xButton = pad.buttons[2]?.pressed ?? false;
      const dpadLeft = pad.buttons[14]?.pressed ?? false;
      const dpadRight = pad.buttons[15]?.pressed ?? false;

      let steering = stickX;
      if (dpadLeft) steering = -1;
      if (dpadRight) steering = 1;

      const throttle = Math.max(triggerThrottle, aButton ? 1 : 0);
      const brake = Math.max(triggerBrake, bButton || xButton ? 1 : 0);

      const eps = 0.02;
      const hasPadMotion =
        Math.abs(steering) > eps || throttle > eps || brake > eps;

      setLivePad(hasPadMotion ? { steer: steering, throttle, brake } : null);
      if (hasPadMotion || liveKeys.size > 0 || getStickAxes().active) {
        flushDriveInput();
      } else {
        useGameStore.getState().setControls({
          steering: 0,
          throttle: 0,
          brake: 0,
          emergencyBrake: false,
        });
      }

      const startButton = pad.buttons[9]?.pressed ?? false;
      const now = Date.now();
      if (startButton && !startPressedRef.current && now - lastPausePress.current > 300) {
        lastPausePress.current = now;
        useGameStore.getState().togglePause();
      }
      startPressedRef.current = startButton;
    }

    const gamepadInterval = setInterval(pollGamepad, GAMEPAD_POLL_INTERVAL);

    const onGamepadConnected = (e: GamepadEvent) => {
      console.log(`Gamepad connected: ${e.gamepad.id}`);
    };
    const onGamepadDisconnected = () => {
      startPressedRef.current = false;
      setLivePad(null);
    };

    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      clearInterval(gamepadInterval);
    };
  }, []);
}
