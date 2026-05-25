import { useMemo } from 'react'

function splitWallAroundDoors(wall, doors) {
  const [wx, wy, wz] = wall.position
  const [wsX, wsY, wsZ] = wall.size
  const rotY = wall.rotation?.[1] ?? 0
  const isDiagonal = Math.abs(rotY % (Math.PI / 2)) > 0.26  // ~15 deg threshold
  const isH = wsX > wsZ
  const SNAP = 0.8, GAP = 1.1

  // Diagonal walls — no splitting, just return as-is
  if (isDiagonal) {
    return [{ position: [wx, wy, wz], size: [wsX, wsY, wsZ], rotation: rotY }]
  }

  const myDoors = doors.filter(d => {
    if ((d.horizontal ?? (d.size[0] > d.size[2])) !== isH) return false
    const dist = isH ? Math.abs(d.position[2] - wz) : Math.abs(d.position[0] - wx)
    return dist < SNAP
  })

  if (!myDoors.length) return [{ position: [wx, wy, wz], size: [wsX, wsY, wsZ], rotation: 0 }]

  const segments = []

  if (isH) {
    const sorted = [...myDoors].sort((a, b) => a.position[0] - b.position[0])
    let cursor = wx - wsX / 2
    for (const d of sorted) {
      const gapStart = d.position[0] - GAP / 2
      const gapEnd   = d.position[0] + GAP / 2
      if (gapStart > cursor + 0.05) {
        const w = gapStart - cursor
        segments.push({ position: [cursor + w / 2, wy, wz], size: [w, wsY, wsZ], rotation: 0 })
      }
      cursor = gapEnd
    }
    const wallEnd = wx + wsX / 2
    if (wallEnd > cursor + 0.05) {
      const w = wallEnd - cursor
      segments.push({ position: [cursor + w / 2, wy, wz], size: [w, wsY, wsZ], rotation: 0 })
    }
  } else {
    const sorted = [...myDoors].sort((a, b) => a.position[2] - b.position[2])
    let cursor = wz - wsZ / 2
    for (const d of sorted) {
      const gapStart = d.position[2] - GAP / 2
      const gapEnd   = d.position[2] + GAP / 2
      if (gapStart > cursor + 0.05) {
        const h = gapStart - cursor
        segments.push({ position: [wx, wy, cursor + h / 2], size: [wsX, wsY, h], rotation: 0 })
      }
      cursor = gapEnd
    }
    const wallEnd = wz + wsZ / 2
    if (wallEnd > cursor + 0.05) {
      const h = wallEnd - cursor
      segments.push({ position: [wx, wy, cursor + h / 2], size: [wsX, wsY, h], rotation: 0 })
    }
  }

  return segments.length
    ? segments
    : [{ position: [wx, wy, wz], size: [wsX, wsY, wsZ], rotation: 0 }]
}

function WallSegment({ position, size, rotation }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[Math.max(size[0], 0.22), Math.max(size[1], 0.5), Math.max(size[2], 0.22)]} />
      <meshStandardMaterial color="#d1d5db" />
    </mesh>
  )
}

export default function Walls({ walls, doors }) {
  const segments = useMemo(
    () => walls.flatMap(w => splitWallAroundDoors(w, doors)),
    [walls, doors]
  )
  return <>{segments.map((seg, i) => <WallSegment key={i} {...seg} />)}</>
}