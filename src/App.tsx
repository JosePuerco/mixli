import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { MotionConfig } from 'motion/react'
import { BottomNav } from './components/nav/BottomNav'
import { ZutatenScreen } from './screens/ZutatenScreen'
import { MixenScreen } from './screens/MixenScreen'
import { MueslisScreen } from './screens/MueslisScreen'
import { MehrScreen } from './screens/MehrScreen'

export function App() {
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLElement>(null)

  // Beim Tab-Wechsel oben beginnen, wie in nativen Apps.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    // reducedMotion="user": Bei „Bewegung reduzieren“ schaltet Motion Animationen ab.
    <MotionConfig reducedMotion="user">
      <div className="relative mx-auto flex h-full max-w-lg flex-col overflow-hidden">
        <main ref={scrollRef} className="screen-scroll flex-1 overflow-y-auto px-screen">
          <Routes>
            <Route path="/zutaten" element={<ZutatenScreen />} />
            <Route path="/mixen" element={<MixenScreen />} />
            <Route path="/muesli" element={<MueslisScreen />} />
            <Route path="/mehr" element={<MehrScreen />} />
            <Route path="*" element={<Navigate to="/zutaten" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </MotionConfig>
  )
}
