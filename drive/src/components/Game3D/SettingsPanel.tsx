/**
 * SettingsPanel — the one settings surface (item 4.1).
 *
 * Before this, settings were a run of loose buttons inside the pause menu: a
 * CONTROLS cycle, a mute toggle, a motion toggle and three accessibility rows,
 * with no way to set a volume, no steering sensitivity, and nowhere for tilt to
 * live. The pause menu also owned the key-capture state machine, which meant a
 * settings row could not be reused by the main menu.
 *
 * So this panel owns all of it and the pause menu renders it. The rules it keeps:
 *
 *   - **Every row reads and writes the store**, so the same panel is correct in the
 *     pause menu and (later) anywhere else.
 *   - **Nothing here is a new setting invented for the panel's sake.** Every row is
 *     a value the drive already reads; the two that are new — steering sensitivity
 *     and tilt — are new because the drive now reads them too.
 *   - **A row that cannot work is disabled, not hidden.** Tilt on a desktop build
 *     has no `DeviceOrientationEvent`; the row stays visible and says so, because a
 *     missing row reads as "this game has no tilt" rather than "this device does
 *     not".
 *   - **The numbers are the store's numbers.** Sliders show 0–100 %, and the store
 *     keeps 0–1; the conversion lives in the row, not in two places.
 */
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import {
  ACTION_LABELS,
  DRIVE_ACTIONS,
  controlsSchemeLabel,
  keyLabel,
  type DriveAction,
} from '@/input/driveInput';
import { TEXT_SIZE_LABELS } from '@/input/textSize';
import { requestTiltPermission } from '@/hooks/useTiltSteering';

const pct = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100);
const fromPct = (v: string) => Math.max(0, Math.min(1, Number(v) / 100));

export function SettingsPanel({ onDone }: { onDone?: () => void }) {
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);

  const controlsScheme = useGameStore((s) => s.controlsScheme);
  const cycleControlsScheme = useGameStore((s) => s.cycleControlsScheme);
  const steeringSensitivity = useGameStore((s) => s.steeringSensitivity);
  const setSteeringSensitivity = useGameStore((s) => s.setSteeringSensitivity);

  const tiltSteering = useGameStore((s) => s.tiltSteering);
  const tiltInvert = useGameStore((s) => s.tiltInvert);
  const setTiltSteering = useGameStore((s) => s.setTiltSteering);
  const setTiltInvert = useGameStore((s) => s.setTiltInvert);
  const calibrateTilt = useGameStore((s) => s.calibrateTilt);
  const tiltNeutral = useGameStore((s) => s.tiltNeutral);

  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const setReducedMotion = useGameStore((s) => s.setReducedMotion);
  const textSize = useGameStore((s) => s.textSize);
  const cycleTextSize = useGameStore((s) => s.cycleTextSize);
  const colorblindHud = useGameStore((s) => s.colorblindHud);
  const setColorblindHud = useGameStore((s) => s.setColorblindHud);

  const binds = useGameStore((s) => s.binds);
  const rebindAction = useGameStore((s) => s.rebindAction);
  const resetAction = useGameStore((s) => s.resetAction);
  const resetAllBinds = useGameStore((s) => s.resetAllBinds);

  const [keysOpen, setKeysOpen] = useState(false);
  const [capturing, setCapturing] = useState<DriveAction | null>(null);
  const [tiltNote, setTiltNote] = useState<string | null>(null);

  // Rebinding is a capture: the next keydown writes that action, Esc cancels.
  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { setCapturing(null); return; }
      rebindAction(capturing, e.key === ' ' ? ' ' : e.key);
      setCapturing(null);
    };
    // Capture phase so the pause key's own handler does not also fire.
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [capturing, rebindAction]);

  /**
   * Turning tilt on asks the device first. On iOS 13+ the sensor is behind a
   * permission prompt that only a user gesture may raise, so the click IS the
   * gesture — ask, then write the store only if it was granted. A refusal leaves
   * the row off and says why, rather than switching a sensor on that never fires.
   */
  const handleTilt = useCallback(async () => {
    if (tiltSteering) { setTiltSteering(false); setTiltNote(null); return; }
    const granted = await requestTiltPermission();
    setTiltSteering(granted);
    setTiltNote(granted ? null : 'the device refused its motion sensor');
  }, [tiltSteering, setTiltSteering]);

  const handleCalibrate = useCallback(() => {
    const saved = calibrateTilt();
    setTiltNote(
      saved
        ? `straight = roll ${saved.roll.toFixed(0)}° / pitch ${saved.pitch.toFixed(0)}°`
        : 'hold the phone as you will drive it, then press again',
    );
  }, [calibrateTilt]);

  const calibrated = tiltNeutral.roll !== 0 || tiltNeutral.pitch !== 0;

  return (
    <div style={styles.panel} data-settings>
      <Section label="SOUND">
        <Row label="SOUND">
          <button style={styles.stepBtn} onClick={toggleMute} aria-pressed={!isMuted}>
            {isMuted ? '🔇 OFF' : '🔊 ON'}
          </button>
        </Row>
        <Slider label="SFX" value={pct(sfxVolume)} onChange={(v) => setSfxVolume(fromPct(v))} />
        <Slider label="MUSIC" value={pct(musicVolume)} onChange={(v) => setMusicVolume(fromPct(v))} />
      </Section>

      <Section label="STEERING">
        <Row label="CONTROLS">
          <button style={styles.stepBtn} onClick={cycleControlsScheme}>
            {controlsSchemeLabel(controlsScheme)} ▸
          </button>
        </Row>
        <Slider
          label="SENSITIVITY"
          value={Math.round(steeringSensitivity * 100)}
          min={50}
          max={200}
          step={10}
          suffix="%"
          onChange={(v) => setSteeringSensitivity(Number(v) / 100)}
        />
        <Row label="TILT (phone roll)">
          <button
            style={styles.stepBtn}
            onClick={handleTilt}
            aria-pressed={tiltSteering}
            data-tilt-toggle
          >
            {tiltSteering ? 'ON' : 'OFF'}
          </button>
        </Row>
        {tiltSteering && (
          <>
            <Row label="TILT REVERSE">
              <button style={styles.stepBtn} onClick={() => setTiltInvert(!tiltInvert)} aria-pressed={tiltInvert}>
                {tiltInvert ? 'ON' : 'OFF'}
              </button>
            </Row>
            <Row label={calibrated ? 'STRAIGHT · SET' : 'STRAIGHT · NOT SET'}>
              <button style={styles.stepBtn} onClick={handleCalibrate} data-tilt-calibrate>
                SET STRAIGHT
              </button>
            </Row>
          </>
        )}
        {tiltNote && <p style={styles.note} data-tilt-note>{tiltNote}</p>}
      </Section>

      <Section label="ACCESSIBILITY">
        <Row label="MOTION">
          <button style={styles.stepBtn} onClick={() => setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion}>
            {reducedMotion ? 'STEADY CAM' : 'ON'}
          </button>
        </Row>
        <Row label="TEXT SIZE">
          <button style={styles.stepBtn} onClick={cycleTextSize}>
            {TEXT_SIZE_LABELS[textSize]} ▸
          </button>
        </Row>
        <Row label="COLORBLIND HUD">
          <button
            style={styles.stepBtn}
            onClick={() => setColorblindHud(!colorblindHud)}
            aria-pressed={colorblindHud}
          >
            {colorblindHud ? 'ON — ✓ PASS  ✕ MISS' : 'OFF'}
          </button>
        </Row>
      </Section>

      <Section label="KEYS">
        <Row label="KEYS">
          <button style={styles.stepBtn} onClick={() => setKeysOpen((v) => !v)}>
            {keysOpen ? 'HIDE' : 'CHANGE'}
          </button>
        </Row>
        {keysOpen && (
          <div style={styles.bindPanel}>
            {capturing && (
              <div style={styles.captureHint}>
                PRESS A KEY FOR {ACTION_LABELS[capturing].toUpperCase()} · ESC CANCELS
              </div>
            )}
            {DRIVE_ACTIONS.map((action) => (
              <div key={action} style={styles.bindRow}>
                <span style={styles.label}>{ACTION_LABELS[action]}</span>
                <button style={styles.bindKey} onClick={() => setCapturing(action)}>
                  {binds[action].map(keyLabel).join(' / ')}
                </button>
                <button style={styles.bindReset} onClick={() => resetAction(action)}>↺</button>
              </div>
            ))}
            <button style={styles.wideBtn} onClick={resetAllBinds}>RESET ALL KEYS</button>
          </div>
        )}
      </Section>

      {onDone && (
        <button style={{ ...styles.wideBtn, ...styles.doneBtn }} onClick={onDone}>
          DONE
        </button>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.section} role="group" aria-label={label}>
      <p style={styles.sectionLabel}>{label}</p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  suffix = '%',
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div style={styles.row}>
      <label style={styles.label} htmlFor={`setting-${label}`}>{label}</label>
      <div style={styles.sliderWrap}>
        <input
          id={`setting-${label}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.slider}
        />
        <span style={styles.sliderValue}>{value}{suffix}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 },
  section: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: 10,
    background: 'var(--qr-glass, rgba(20,17,16,0.86))', border: '1px solid var(--qr-stroke, #3a3230)',
    borderRadius: 'var(--qr-radius, 12px)',
  },
  sectionLabel: {
    color: 'var(--qr-dim, #9a9186)', fontSize: 10, letterSpacing: '0.14em', fontWeight: 800, margin: 0,
  },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 40 },
  label: { color: 'var(--qr-dim, #9a9186)', fontSize: 12, letterSpacing: '0.06em' },
  stepBtn: {
    background: '#241f1d', color: 'var(--qr-text, #ede7dc)', border: '1px solid var(--qr-stroke, #3a3230)',
    borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36,
  },
  wideBtn: {
    borderRadius: 8, padding: '0.7rem', fontWeight: 700, fontSize: 13, cursor: 'pointer',
    border: '1px solid var(--qr-stroke, #3a3230)', background: '#1b1716', color: 'var(--qr-text, #ede7dc)',
    minHeight: 44, letterSpacing: '0.03em',
  },
  doneBtn: { background: 'linear-gradient(90deg, #9a3d4d, #c45a68)', color: '#f4eee6', border: 'none' },
  sliderWrap: { display: 'flex', alignItems: 'center', gap: 8, flex: '0 1 60%' },
  slider: { flex: 1, minWidth: 90, accentColor: '#c45a68', height: 28, cursor: 'pointer' },
  sliderValue: { color: 'var(--qr-text, #ede7dc)', fontSize: 12, fontWeight: 700, minWidth: 38, textAlign: 'right' },
  note: { color: 'var(--qr-accent, #c45a68)', fontSize: 11, letterSpacing: '0.06em', margin: '2px 0 0' },
  bindPanel: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: 10, marginBottom: 4,
    background: '#141110', border: '1px solid var(--qr-stroke, #3a3230)', borderRadius: 8,
  },
  bindRow: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  bindKey: {
    flex: 1, background: '#241f1d', color: 'var(--qr-text, #ede7dc)', border: '1px solid var(--qr-stroke, #3a3230)',
    borderRadius: 6, padding: '6px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 34,
  },
  bindReset: {
    background: 'transparent', color: 'var(--qr-dim, #9a9186)', border: '1px solid var(--qr-stroke, #3a3230)',
    borderRadius: 6, padding: '6px 9px', fontSize: 12, cursor: 'pointer', minHeight: 34,
  },
  captureHint: {
    color: 'var(--qr-accent, #c45a68)', fontSize: 11, letterSpacing: '0.08em', textAlign: 'center', paddingBottom: 4,
  },
};
