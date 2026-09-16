/**
 * Drive shell at /drive. The card game's home (/) owns login and the dashboard;
 * this page assumes a signed-in student and drops her straight into Quiet Roads.
 */
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/authContext'
import ZombieRoadWarrior from '@/components/ZombieRoadWarrior'
import { useGameStore } from '@/stores/gameStore'
import { useQRStore } from '@/stores/qrStore'
import { QuietRoads } from '@/systems/QuietRoadsBridge'
import { DriveSync } from '@/systems/DriveSync'
import { useProgress } from '@react-three/drei'

function Shell() {
  const { loading, user, error } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    let alive = true
    // Pull the server save (if any) before the story starts, then keep it in sync.
    DriveSync.hydrate().finally(() => {
      if (!alive) return
      const hasSave = !!useQRStore.getState().checkpoint
      QuietRoads.start(!hasSave)
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
          <div style={{ marginBottom: 20 }}>Kent, before first light…</div>
          <BootProgress />
        </div>
      </Center>
    )
  return (
    <ZombieRoadWarrior
      onExit={() => {
        DriveSync.flush().finally(() => {
          useGameStore.getState().setPhase('menu')
          window.location.href = '/'
        })
      }}
    />
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121010', color: '#ede7dc', fontFamily: '"Segoe UI", system-ui, sans-serif', fontSize: 16, letterSpacing: '0.04em' }}>
      {children}
    </div>
  )
}

/**
 * BootProgress — covers the preload window: the 10.5 MB Beetle and the highway
 * models stream while the auth check and save hydrate run. useProgress reads the
 * same global loader store the in-canvas LoadingScreen uses; this one mounts
 * earlier, before any Canvas exists. Item-count based, so the Beetle owns the tail.
 */
function BootProgress() {
  const { active, progress } = useProgress()
  const show = active || (progress > 0 && progress < 100)
  if (!show) return null
  return (
    <div style={bootStyles.wrap}>
      <div style={bootStyles.track}>
        <div style={{ ...bootStyles.fill, width: `${progress}%` }} />
      </div>
      <div style={bootStyles.pct}>{Math.round(progress)}%</div>
    </div>
  )
}

const bootStyles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', alignItems: 'center', gap: 10 },
  track: { width: 220, height: 6, background: '#2a2326', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', background: 'linear-gradient(90deg, #F28DB2, #39ff14)', borderRadius: 3, transition: 'width 0.2s' },
  pct: { fontSize: 11, letterSpacing: '0.12em', color: '#8a8f99', minWidth: 34, textAlign: 'right' },
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
