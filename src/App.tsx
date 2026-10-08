import { Navigate, Route, Routes, useLocation } from 'react-router'
import { MotionConfig } from 'motion/react'
import { BottomNav } from './components/nav/BottomNav'
import { ZutatenScreen } from './screens/ZutatenScreen'
import { ZutatNeuScreen } from './screens/ZutatNeuScreen'
import { ZutatBearbeitenScreen } from './screens/ZutatBearbeitenScreen'
import { MixenScreen } from './screens/MixenScreen'
import { MueslisScreen } from './screens/MueslisScreen'
import { MuesliDetailScreen } from './screens/MuesliDetailScreen'
import { MehrScreen } from './screens/MehrScreen'
import { KomponentenScreen } from './screens/KomponentenScreen'

/** Ganzseitige Abläufe (Zutat anlegen/bearbeiten, Müsli-Detail) zeigen keine Navigation. */
const FLOW_PATH = /^\/(zutaten|muesli)\/.+/

export function App() {
  const { pathname } = useLocation()
  return (
    // reducedMotion="user": Bei „Bewegung reduzieren“ schaltet Motion Animationen ab.
    <MotionConfig reducedMotion="user">
      {/* Feste App-Hülle in Bildschirmhöhe. Jeder Screen scrollt in sich (<Screen>), die Navigation bleibt stehen. */}
      <div className="relative mx-auto h-dvh max-w-lg overflow-hidden">
        <Routes>
          <Route path="/zutaten" element={<ZutatenScreen />} />
          <Route path="/zutaten/neu" element={<ZutatNeuScreen />} />
          <Route path="/zutaten/:id" element={<ZutatBearbeitenScreen />} />
          <Route path="/mixen" element={<MixenScreen />} />
          <Route path="/muesli" element={<MueslisScreen />} />
          <Route path="/muesli/:id" element={<MuesliDetailScreen />} />
          <Route path="/mehr" element={<MehrScreen />} />
          {/* Übersicht der UI-Bausteine zum Prüfen auf dem Handy, nicht in der Navigation verlinkt. */}
          <Route path="/komponenten" element={<KomponentenScreen />} />
          <Route path="*" element={<Navigate to="/zutaten" replace />} />
        </Routes>
        {!FLOW_PATH.test(pathname) && <BottomNav />}
      </div>
    </MotionConfig>
  )
}
