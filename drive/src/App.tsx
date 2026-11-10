/**
 * Drive shell at /drive. The card game's home (/) owns login and the dashboard;
 * this page assumes a signed-in student and opens the act list.
 *
 * THE ENTRY CHUNK IS THE SHELL (item 2.3). Everything below — auth, the boot screen,
 * stores, DriveSync — is the chunk that paints first; the 3D stack (three, R3F,
 * rapier, postprocessing, the Kent world, the car) is a second chunk fetched as soon
 * as this module evaluates, in parallel with the auth check and the save hydrate, and
 * mounted when it arrives. `useProgress` used to be imported here from drei, which
 * dragged three.js into the shell for a progress bar — the bar is CSS now, and the
 * shell's own bytes are a fraction of the game's.
 */
import { Suspense, lazy, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/authContext'
import { useGameStore } from '@/stores/gameStore'
import { DriveSync } from '@/systems/DriveSync'
import { QuietRoads } from '@/systems/QuietRoadsBridge'
import { installCrashReport } from '@/lib/crashReport'

const ZombieRoadWarrior = lazy(() => import('@/components/ZombieRoadWarrior'))

function Shell() {
  const { loading, user, error } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    let alive = true
    // Pull the server save (if any) before the story starts, then keep it in sync.
    installCrashReport()
    DriveSync.hydrate().finally(() => {
      if (!alive) return
      // Quiet Roads is the only student surface. Resuming drops straight into the
      // current checkpoint scene (or the Act I cold open for a new run) — no menu.
      useGameStore.getState().setWorldMode('kent')
      QuietRoads.start(false)
      DriveSync.begin()
      setReady(true)
    })
    return () => { alive = false }
  }, [loading, user])

  if (error) return <Center>{error}</Center>
  if (loading || !ready)
    return (
      <Center>
        <div>
          <div style={{ marginBottom: 8, color: '#c45a68', letterSpacing: '0.16em' }}>PINK MENACE</div>
          <div style={{ marginBottom: 20, color: '#9a9186' }}>Quiet Roads</div>
          <BootProgress />
        </div>
      </Center>
    )
  return (
    <Suspense
      fallback={
        <Center>
          <div>
            <div style={{ marginBottom: 8, color: '#c45a68', letterSpacing: '0.16em' }}>PINK MENACE</div>
            <div style={{ marginBottom: 20, color: '#9a9186' }}>Quiet Roads</div>
            <BootProgress />
          </div>
        </Center>
      }
    >
      <ZombieRoadWarrior
        onExit={() => {
          QuietRoads.stop()
          DriveSync.flush().finally(() => {
            window.location.href = '/'
          })
        }}
      />
    </Suspense>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121010', color: '#ede7dc', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 16, letterSpacing: '0.04em' }}>
      {children}
    </div>
  )
}

/**
 * BootProgress — the shell's own "something is happening" line, drawn before the 3D
 * chunk exists and while the auth check and save hydrate run.
 *
 * It is deliberately dumb and side-effect free: an indeterminate sweep, no library, no
 * three.js. It used to be drei's `useProgress` reading the GLB loader's item count,
 * which put three.js in the entry chunk for a bar. The real progress bar still exists
 * inside the canvas (LoadingScreen) once the 3D chunk has arrived, and it is the one
 * that owns the model bytes now.
 */
function BootProgress() {
  return (
    <div style={bootStyles.wrap} data-boot-progress>
      <div style={bootStyles.track}>
        <div className="boot-sweep" style={bootStyles.fill} />
      </div>
      <style>{`
        @keyframes boot-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(320%); } }
        .boot-sweep { animation: boot-sweep 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .boot-sweep { animation: none; width: 100% !important; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

const bootStyles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', alignItems: 'center', gap: 10 },
  track: { width: 220, height: 6, background: '#2a2326', borderRadius: 3, overflow: 'hidden' },
  fill: { width: '30%', height: '100%', background: 'linear-gradient(90deg, #9a3d4d, #c45a68)', borderRadius: 3 },
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
