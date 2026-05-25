import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function snapToWall(pos, walls, horizontal) {
  if (!walls?.length) return pos
  let best = null, bestDist = Infinity
  for (const wall of walls) {
    const [wx, , wz] = wall.position
    const [wsX, , wsZ] = wall.size
    if ((wsX > wsZ) !== horizontal) continue
    const dist = horizontal ? Math.abs(pos[2] - wz) : Math.abs(pos[0] - wx)
    if (dist < bestDist) { bestDist = dist; best = wall }
  }
  if (!best) return pos
  const [wx, , wz] = best.position
  const isH = best.size[0] > best.size[2]
  return isH ? [pos[0], 0, wz] : [wx, 0, pos[2]]
}

export default function DoorGLB({ position, horizontal, walls }) {
  const { scene } = useGLTF('/models/door.glb')

  const matchedWall = useMemo(() => {
    if (!walls?.length) return null
    let best = null, bestDist = Infinity
    for (const wall of walls) {
      const [wx, , wz] = wall.position
      const [wsX, , wsZ] = wall.size
      const isH = wsX > wsZ
      if (isH !== horizontal) continue
      const dist = horizontal ? Math.abs(position[2] - wz) : Math.abs(position[0] - wx)
      if (dist < bestDist) { bestDist = dist; best = wall }
    }
    return best
  }, [walls, position, horizontal])

  const cloned = useMemo(() => {
    const c = scene.clone(true)

    const wallHeight = matchedWall?.size?.[1] ?? 2.98
    const wallThickness = matchedWall
      ? (horizontal ? matchedWall.size[2] : matchedWall.size[0])
      : 0.18

    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    c.position.set(-center.x, -box.min.y, -center.z)
    c.scale.set((wallThickness * 8) / size.x, wallHeight / size.y, 0.9 / size.z)

    // 🔥 ONLY CHANGE: COLOR FIX
    c.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone()

        // darker wood/metal tone (clean realistic look)
        child.material.color = new THREE.Color('#1f1f1f')

        child.material.roughness = 0.85
        child.material.metalness = 0.15
      }
    })

    return c
  }, [scene, matchedWall, horizontal])

  const snapped = useMemo(
    () => snapToWall(position, walls, horizontal),
    [position, walls, horizontal]
  )

  return (
    <group position={[snapped[0], 0.58, snapped[2]]} rotation={[0, horizontal ? Math.PI / 2 : 0, 0]}>
      <primitive object={cloned} />
    </group>
  )
}

useGLTF.preload('/models/door.glb')