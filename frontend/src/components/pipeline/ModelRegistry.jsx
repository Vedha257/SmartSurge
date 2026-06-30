import { useState, useEffect } from 'react'
import { getRegistry, promoteModel, rollbackModel } from '../../api/surgeApi'
import { C, cardStyle, primaryBtn } from '../ui'

const statusColor = {
  production: { bg: 'rgba(16,185,129,0.1)', text: '#10B981', border: 'rgba(16,185,129,0.25)' },
  staging: { bg: 'rgba(251,191,36,0.1)', text: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  experimental: { bg: '#1E2A45', text: '#64748B', border: '#1E2A45' }
}

export default function ModelRegistry({ onPromoted }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchRegistry = async () => {
    setLoading(true)
    try {
      const data = await getRegistry()
      setModels(data.data.models)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRegistry() }, [])

  const handlePromote = async (id, version) => {
    try {
      await promoteModel(id)
      setMessage(`${version} promoted to production`)
      fetchRegistry()
      onPromoted()
    } catch {
      setMessage('Promotion failed')
    }
  }

  const handleRollback = async () => {
    try {
      const data = await rollbackModel()
      setMessage(data.data.message)
      fetchRegistry()
    } catch {
      setMessage('Rollback failed')
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '20px'
      }}>
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 600, color: C.accent,
            fontFamily: C.mono, letterSpacing: '1px',
            textTransform: 'uppercase', marginBottom: '4px'
          }}>Stage 05 · Model Registry</div>
          <div style={{
            fontSize: '17px', fontWeight: 700, color: C.text
          }}>Version & promote</div>
        </div>
        <button onClick={handleRollback} style={{
          background: '#1E2A45', border: 'none', borderRadius: '6px',
          padding: '7px 14px', color: C.textSub, fontSize: '12px',
          cursor: 'pointer', fontFamily: C.sans
        }}>↩ Rollback</button>
      </div>

      {message && (
        <div style={{
          marginBottom: '14px', padding: '10px 14px',
          background: 'rgba(96,165,250,0.08)',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: '8px', fontSize: '13px', color: C.blue
        }}>{message}</div>
      )}

      {loading ? (
        <div style={{ fontSize: '13px', color: C.textMuted }}>
          Loading registry...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {models.map(model => {
            const sc = statusColor[model.status]
            return (
              <div key={model.registry_id} style={{
                background: C.inputBg, border: `1px solid ${C.border}`,
                borderRadius: '10px', padding: '16px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '8px', marginBottom: '6px'
                  }}>
                    <span style={{
                      fontSize: '14px', fontWeight: 700, color: C.text
                    }}>{model.model_type}</span>
                    <span style={{
                      fontSize: '11px', padding: '2px 7px',
                      background: '#1E2A45', borderRadius: '4px',
                      color: C.textMuted, fontFamily: C.mono
                    }}>{model.version}</span>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px',
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      borderRadius: '4px', color: sc.text,
                      fontWeight: 600
                    }}>{model.status}</span>
                  </div>
                  <div style={{
                    display: 'flex', gap: '16px',
                    fontSize: '12px', color: C.textMuted,
                    fontFamily: C.mono
                  }}>
                    <span>MAE {model.mae}</span>
                    <span>RMSE {model.rmse}</span>
                    <span>R² {model.r2}</span>
                  </div>
                </div>

                {model.status !== 'production' ? (
                  <button onClick={() => handlePromote(model.registry_id, model.version)}
                    style={{
                      background: 'linear-gradient(135deg, #F97316, #EA580C)',
                      border: 'none', borderRadius: '7px',
                      padding: '8px 16px', color: 'white',
                      fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: C.sans
                    }}>Promote</button>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', color: C.green, fontWeight: 600
                  }}>
                    <div className="status-pulse" style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: C.green
                    }} />
                    Live
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}