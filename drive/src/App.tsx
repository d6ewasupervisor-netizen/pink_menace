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
  if (loading || !ready) return <Center>Kent, before first light…</Center>
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

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
