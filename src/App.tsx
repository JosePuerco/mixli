import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import { BottomNav } from './components/nav/BottomNav'
import { isFlowPath, screenChange, screenIn, type ScreenChange } from './design/motion'
import { ZutatenScreen } from './screens/ZutatenScreen'
import { ZutatNeuScreen } from './screens/ZutatNeuScreen'
import { ZutatBearbeitenScreen } from './screens/ZutatBearbeitenScreen'
import { MixenScreen } from './screens/MixenScreen'
import { MueslisScreen } from './screens/MueslisScreen'
import { MuesliDetailScreen } from './screens/MuesliDetailScreen'
import { MehrScreen } from './screens/MehrScreen'
import { KomponentenScreen } from './screens/KomponentenScreen'

export function App() {
  const location = useLocation()
  const { pathname } = location
  const reduceMotion = useReducedMotion()

  // Art des Wechsels beim Rendern festhalten (Muster „vorherigen Wert in State merken“ aus der React-Doku).
  const [prevPath, setPrevPath] = useState(pathname)
  const [change, setChange] = useState<ScreenChange>('fade')
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    setChange(screenChange(prevPath, pathname))
  }

  const routes = (
    <Routes location={location}>
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
  )

  return (
    // reducedMotion="user": Bei „Bewegung reduzieren“ schaltet Motion Animationen ab.
    <MotionConfig reducedMotion="user">
      {/* Feste App-Hülle in Bildschirmhöhe. Jeder Screen scrollt in sich (<Screen>), die Navigation bleibt stehen. */}
      <div className="relative mx-auto h-dvh max-w-lg overflow-hidden">
        {reduceMotion ? (
          // Bei „Bewegung reduzieren“ wechselt der Screen sofort (MotionConfig würde das Einblenden behalten).
          routes
        ) : (
          // Neuer Screen legt sich über den alten (bg-background, damit nichts durchscheint), siehe screenIn.
          <AnimatePresence initial={false}>
            <motion.div key={pathname} className="absolute inset-0 bg-background" {...screenIn(change)}>
              {routes}
            </motion.div>
          </AnimatePresence>
        )}
        {/* Ganzseitige Abläufe (Zutat anlegen/bearbeiten, Müsli-Detail) zeigen keine Navigation. */}
        <AnimatePresence initial={false}>{!isFlowPath(pathname) && <BottomNav />}</AnimatePresence>
      </div>
    </MotionConfig>
  )
}
