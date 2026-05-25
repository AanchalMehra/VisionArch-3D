import { useMemo } from 'react'
import * as THREE from 'three'

export default function WindowGLB({ position, size, horizontal, walls }) {

  const matchedWall = useMemo(() => {
    if (!walls?.length) return null
    let best = null, bestDist = Infinity

    for (const wall of walls) {
      const [wx, , wz] = wall.position
      const [wsX, , wsZ] = wall.size
      const isH = wsX > wsZ
      if (isH !== horizontal) continue

      const dist = horizontal
        ? Math.abs(position[2] - wz)
        : Math.abs(position[0] - wx)

      if (dist < bestDist) {
        bestDist = dist
        best = wall
      }
    }
    return best
  }, [walls, position, horizontal])

  const snapped = useMemo(() => {
    if (!matchedWall) return position
    const [wx, , wz] = matchedWall.position
    const isH = matchedWall.size[0] > matchedWall.size[2]
    return isH ? [position[0], 0, wz] : [wx, 0, position[2]]
  }, [matchedWall, position])

  const rotY = useMemo(() => {
    if (!matchedWall) return horizontal ? 0 : Math.PI / 2
    const isH = matchedWall.size[0] > matchedWall.size[2]
    return isH ? 0 : Math.PI / 2
  }, [matchedWall, horizontal])

  const windowWidth = horizontal ? size[0] : size[2]
  const windowHeight = size[1] || 1.2

  // 🔥 CHANGE #1: make window MUCH taller
  const visualHeight = windowHeight * 0.8

  // 🔥 CHANGE #2: thicker glass
  const glassDepth = 1.2

  // 🔥 CHANGE #3: thicker frame
  const frameDepth = 1.3

  const glassMat = new THREE.MeshStandardMaterial({
  color: '#68abd8',
  transparent: true,
  opacity: 0.35,
  roughness: 0,
  metalness: 0,
  depthWrite: false,   // 🔥 CRITICAL FIX
  side: THREE.DoubleSide,
})

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#111',
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.DoubleSide,
  }), [])

  return (
    <group
      position={[
        snapped[0],
        visualHeight / 0.8,   // 📍 window goes higher automatically
        snapped[2]
      ]}
      rotation={[0, rotY, 0]}
    >

      {/* GLASS */}
      <mesh>
        <boxGeometry args={[windowWidth, visualHeight, glassDepth]} />
        <primitive object={glassMat} attach="material" />
      </mesh>

      {/* FRAME TOP (⬆ more above happens here) */}
      <mesh position={[0, visualHeight * 0.5, 0]}>
        <boxGeometry args={[windowWidth + 0.15, 0.22, frameDepth]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* FRAME BOTTOM (⬇ more below happens here) */}
      <mesh position={[0, -visualHeight * 0.5, 0]}>
        <boxGeometry args={[windowWidth + 0.15, 0.22, frameDepth]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* LEFT FRAME */}
      <mesh position={[-windowWidth * 0.5, 0, 0]}>
        <boxGeometry args={[0.22, visualHeight, frameDepth]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* RIGHT FRAME */}
      <mesh position={[windowWidth * 0.5, 0, 0]}>
        <boxGeometry args={[0.22, visualHeight, frameDepth]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

    </group>
  )
}