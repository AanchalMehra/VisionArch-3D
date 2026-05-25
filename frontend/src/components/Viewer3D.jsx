import { useLoader } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import Walls from './viewer/Walls'
import DoorGLB from './viewer/DoorGLB'
import WindowGLB from './viewer/WindowGLB'
import './Viewer3D.css'

const SCENE = 20.0

function Floor() {
  const texture = useLoader(
    THREE.TextureLoader,
    'https://threejs.org/examples/textures/hardwood2_diffuse.jpg'
  )

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[SCENE, SCENE]} />
      <meshStandardMaterial map={texture} roughness={0.9} metalness={0.0} />
    </mesh>
  )
}

function Scene({ floorData, showRoof }) {
  const { walls = [], openings = [] } = floorData || {}

  const doors = openings.filter(o => o.type === 'door')
  const windows = openings.filter(o => o.type === 'window')

  return (
    <>
      <PerspectiveCamera makeDefault position={[18, 18, 18]} fov={45} />
      <OrbitControls />

      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <Environment preset="apartment" />

      <Floor />

      <Walls walls={walls} doors={doors} />

      {/* Automatically render doors if data is available */}
      {doors.map((op, i) => (
        <DoorGLB
          key={i}
          position={op.position}
          horizontal={op.horizontal ?? (op.size[0] > op.size[2])}
          walls={walls}
        />
      ))}

      {/* Automatically render windows if data is available */}
      {windows.map((op, i) => (
        <WindowGLB
          key={i}
          position={op.position}
          size={op.size}
          horizontal={op.horizontal ?? (op.size[0] > op.size[2])}
          walls={walls}
        />
      ))}

      {showRoof && walls.length > 0 && (() => {
        const xs = walls.map(w => w.position[0])
        const zs = walls.map(w => w.position[2])

        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minZ = Math.min(...zs)
        const maxZ = Math.max(...zs)

        const height = walls[0].size[1]

        return (
          <mesh position={[
            (minX + maxX) / 2,
            height + 0.05,
            (minZ + maxZ) / 2
          ]}>
            <boxGeometry args={[maxX - minX, 0.1, maxZ - minZ]} />
            <meshStandardMaterial color="#caced4" transparent opacity={0.6} />
          </mesh>
        )
      })()}
    </>
  )
}

export default function Viewer3D({
  floorData,
  showRoof,
  sidebarOpen,
  setSidebarOpen
}) {
  return (
    <div className={`viewer-container ${!sidebarOpen ? 'full' : ''}`}>

      {/* Reopen sidebar button when it is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="open-sidebar-btn"
        >
          Open Panel
        </button>
      )}

      <Canvas shadows>
        <Scene
          floorData={floorData}
          showRoof={showRoof}
        />
      </Canvas>
    </div>
  )
}