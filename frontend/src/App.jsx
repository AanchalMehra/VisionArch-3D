import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Viewer3D from './components/Viewer3D.jsx'
import './App.css'

export default function App() {
  const [floorData, setFloorData] = useState(null)
  const [status, setStatus] = useState({ msg: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)

  const [showDoors, setShowDoors] = useState(true)
  const [showWindows, setShowWindows] = useState(true)
  const [showRoof, setShowRoof] = useState(false)
 

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
    if (!res.ok) {
      throw new Error('Upload failed')
    }

    const data = await res.json()

    if (data.error) {
      setStatus({ msg: data.error, type: 'err' })
    } else {
      setFloorData(data)
      setStatus({ msg: '3D model ready!', type: 'ok' })
    }
  } catch (err) {
    setStatus({ msg: 'Cannot reach Flask server.', type: 'err' })
  }

  setIsLoading(false)
}

  return (
    <div className="app-layout">
       {isLoading&&(
        <div className="loading-overlay">
         <div className="loading-spinner" />
        </div>
       )}
      <Sidebar
        onUpload={handleUpload}
        status={status}
        isLoading={isLoading}
        floorData={floorData}
        showDoors={showDoors}     setShowDoors={setShowDoors}
        showWindows={showWindows} setShowWindows={setShowWindows}
        showRoof={showRoof}       setShowRoof={setShowRoof}
      />
      <Viewer3D
        floorData={floorData}
        showDoors={showDoors}
        showWindows={showWindows}
        showRoof={showRoof}
      />
    </div>
  )
}