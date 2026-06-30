import { useState } from 'react'
import { ingestDataset } from '../../api/surgeApi'
import { C, cardStyle, primaryBtn } from '../ui'

export default function DataIngestion({ onComplete }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [drag, setDrag] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const data = await ingestDataset(file)
      setResult(data.data)
      onComplete(data.data.dataset_id)
    } catch {
      setError('Upload failed — check that cab_rides.csv is selected')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={cardStyle} className={result ? 'stage-glow' : ''}>
      
      <div style={{
        fontSize: '11px', fontWeight: 600, color: C.accent,
        fontFamily: C.mono, letterSpacing: '1px',
        textTransform: 'uppercase', marginBottom: '4px'
      }}>
        Stage 01 · Data Ingestion
      </div>
      <div style={{
        fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '4px'
      }}>Upload dataset</div>
      <div style={{
        fontSize: '13px', color: C.textMuted, marginBottom: '20px'
      }}>
        Upload cab_rides.csv to initialize the pipeline
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          setFile(e.dataTransfer.files[0])
        }}
        style={{
          border: `2px dashed ${drag ? C.accent : C.border}`,
          borderRadius: '10px',
          padding: '28px',
          textAlign: 'center',
          marginBottom: '16px',
          background: drag ? C.accentDim : 'transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={() => document.getElementById('file-inp').click()}
      >
        <input id="file-inp" type="file" accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files[0])} />
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
        <div style={{ fontSize: '13px', color: C.textSub, fontWeight: 500 }}>
          {file ? file.name : 'Drop file here or click to browse'}
        </div>
        <div style={{ fontSize: '11px', color: C.textMuted, marginTop: '4px' }}>
          CSV format · cab_rides.csv
        </div>
      </div>

      <button onClick={handleUpload} disabled={!file || loading}
        style={primaryBtn(loading || !file)}>
        {loading ? '⏳ Uploading...' : 'Ingest Dataset →'}
      </button>

      {error && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '8px', fontSize: '13px', color: C.red
        }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          {/* Metrics row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
            marginBottom: '14px'
          }}>
            {[
              { label: 'Rows', value: result.rows.toLocaleString() },
              { label: 'Columns', value: result.columns },
              { label: 'Dataset', value: `#${result.dataset_id}` }
            ].map(m => (
              <div key={m.label} className="metric-card" style={{
                background: C.inputBg, border: `1px solid ${C.border}`,
                borderRadius: '8px', padding: '12px', textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px', fontWeight: 700, color: C.accent,
                  fontFamily: C.mono
                }}>{m.value}</div>
                <div style={{
                  fontSize: '11px', color: C.textMuted, marginTop: '2px'
                }}>{m.label}</div>
              </div>
            ))}
          </div>

         
          <div style={{
            background: C.inputBg, borderRadius: '8px',
            border: `1px solid ${C.border}`, padding: '12px'
          }}>
            <div style={{
              fontSize: '11px', color: C.textMuted, marginBottom: '8px',
              fontFamily: C.mono, letterSpacing: '0.5px'
            }}>DETECTED COLUMNS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.column_names.map(col => (
                <span key={col} style={{
                  fontSize: '11px', padding: '3px 8px',
                  background: '#1E2A45', borderRadius: '4px',
                  color: C.textSub, fontFamily: C.mono
                }}>{col}</span>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: C.green
          }}>
            <span>✓</span> Ingestion complete
          </div>
        </div>
      )}
    </div>
  )
}