import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Viewer3D from './components/Viewer3D.jsx'
import './App.css'

export default function App() {
  const [floorData, setFloorData] = useState(null)
  const [status, setStatus] = useState({ msg: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showRoof, setShowRoof] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  async function handleUpload(file) {
    if (!file) return

    setIsLoading(true)
    setFloorData(null)
    setStatus({ msg: '', type: '' })

    const formData = new FormData()
    formData.append('file', file)

    const API_URL = import.meta.env.VITE_API_URL

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setStatus({ msg: data.error || 'Upload failed', type: 'error' }) // standardizing 'error' type for your css
      } else {
        setFloorData(data)
        setStatus({ msg: '3D model ready!', type: 'success' }) // standardizing 'success' type for your css

        // auto close sidebar on successful architecture parsing
        setSidebarOpen(false)
      }
    } catch (err) {
      setStatus({ msg: 'Cannot reach Flask server.', type: 'error' })
    }

    setIsLoading(false)
  }

  return (
    <div className="app-layout">

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Kept un-nested from conditional block so CSS transform slide transitions work */}
      <Sidebar
        onUpload={handleUpload}
        status={status}
        isLoading={isLoading}
        floorData={floorData}
        showRoof={showRoof}
        setShowRoof={setShowRoof}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="viewer-wrapper">
        <Viewer3D
          floorData={floorData}
          showRoof={showRoof}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

    </div>
  )
}