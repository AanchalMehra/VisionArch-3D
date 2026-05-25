// Sidebar.jsx
import { useState, useRef } from 'react'
import { Upload, Zap, Loader2, CheckCircle, XCircle, Eye, DoorOpen, AppWindow, Home } from 'lucide-react'
import './Sidebar.css'

function Toggle({ label, icon, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-left">
        {icon}
        <span className="toggle-label">{label}</span>
      </div>
      <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </div>
    </div>
  )
}

export default function Sidebar({
  onUpload, status, isLoading, floorData,
  showDoors, setShowDoors,
  showWindows, setShowWindows,
  showRoof, setShowRoof,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const stats = floorData?.stats

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
            <h2>VisionArch 3D</h2>
          </div>
     
      <div className="sidebar-scroll">

        <section className="sidebar-section">
          <p className="section-label">Floor Plan</p>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <img src={preview} className="preview-img" alt="preview" />
            ) : (
              <div className="upload-placeholder">
                <Upload size={24} strokeWidth={1.5} color="#475569" />
                <p className="upload-text">Drop floor plan here</p>
                <p className="upload-sub">PNG, JPG, JPEG</p>
              </div>
            )}
          </div>
          {selectedFile && <p className="file-name">{selectedFile.name}</p>}
        </section>

        <section className="sidebar-section">
          <button
            className="generate-btn"
            onClick={() => onUpload(selectedFile)}
            disabled={!selectedFile || isLoading}
          >
            {isLoading
              ? <><Loader2 size={15} className="spin" /> Analysing…</>
              : <> Generate 3D Image</>
            }
          </button>
          {status.msg && (
            <div className={`status-badge ${status.type}`}>
              {status.msg}
            </div>
          )}
        </section>

        {stats && (
          <section className="sidebar-section">
            <p className="section-label">Results</p>
            <div className="stats-list">
              <div className="stat-row"><span>Walls</span><span>{stats.walls}</span></div>
              <div className="stat-row"><span>Doors</span><span>{stats.doors}</span></div>
              <div className="stat-row"><span>Windows</span><span>{stats.windows}</span></div>
            </div>
          </section>
        )}

        {floorData && (
          <section className="sidebar-section">
            <p className="section-label">Visibility</p>
            <div className="toggles">
    
              <Toggle label="Roof"   icon={<Home size={14} />}       checked={showRoof}    onChange={setShowRoof} />
            </div>
          </section>
        )}

      </div>

  
    </aside>
  )
}