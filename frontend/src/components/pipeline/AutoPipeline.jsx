import { useState } from 'react'
import { runFullPipeline } from '../../api/surgeApi'
import { C } from '../ui'

const STAGE_LABELS = {
  ingestion: 'Data Ingestion',
  validation: 'Data Validation',
  feature_engineering: 'Feature Engineering',
  training: 'Model Training',
  evaluation: 'Evaluation',
  registry: 'Model Registry'
}

const STAGE_ICONS = {
  ingestion: '📂',
  validation: '✅',
  feature_engineering: '⚙️',
  training: '🧠',
  evaluation: '📊',
  registry: '🚀'
}

export default function AutoPipeline({ onComplete }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stages, setStages] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [drag, setDrag] = useState(false)

  const handleRun = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setStages([])
    setSummary(null)

    try {
      const data = await runFullPipeline(file)
      if (data.data.stages) {
        setStages(data.data.stages)
      }
      if (data.data.success) {
        setSummary(data.data.summary)
        onComplete(data.data.dataset_id)
      } else {
        setError(data.data.error || 'Pipeline failed')
      }
    } catch (err) {
      setError('Pipeline failed — check backend logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: '12px', padding: '24px'
    }}>
      
      <div style={{
        fontSize: '11px', fontWeight: 600, color: C.accent,
        fontFamily: C.mono, letterSpacing: '1px',
        textTransform: 'uppercase', marginBottom: '4px'
      }}>Auto Pipeline</div>
      <div style={{
        fontSize: '17px', fontWeight: 700, color: C.text,
        marginBottom: '4px'
      }}>Run complete pipeline</div>
      <div style={{
        fontSize: '13px', color: C.textMuted, marginBottom: '20px'
      }}>
        Upload dataset → all 6 stages run automatically → model deployed
      </div>

     
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '4px', marginBottom: '20px',
        overflowX: 'auto', padding: '4px 0'
      }}>
        {Object.entries(STAGE_LABELS).map(([key, label], i) => {
          const stage = stages.find(s => s.stage === key)
          const status = stage?.status
          const isActive = loading && !stage
            && stages.length === i

          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '4px', minWidth: '70px'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px',
                  background: status === 'complete'
                    ? 'rgba(16,185,129,0.15)'
                    : status === 'failed'
                      ? 'rgba(248,113,113,0.15)'
                      : isActive
                        ? C.accentDim
                        : '#1E2A45',
                  border: `1px solid ${status === 'complete'
                    ? 'rgba(16,185,129,0.3)'
                    : status === 'failed'
                      ? 'rgba(248,113,113,0.3)'
                      : isActive
                        ? C.accentBorder
                        : C.border}`,
                  transition: 'all 0.3s ease'
                }}>
                  {status === 'complete' ? '✓'
                    : status === 'failed' ? '✗'
                    : STAGE_ICONS[key]}
                </div>
                <span style={{
                  fontSize: '9px', color: status === 'complete'
                    ? C.green : status === 'failed'
                      ? C.red : C.textMuted,
                  textAlign: 'center', lineHeight: 1.2,
                  fontFamily: C.mono
                }}>{label.split(' ')[0]}</span>
              </div>
              {i < Object.keys(STAGE_LABELS).length - 1 && (
                <div style={{
                  width: '20px', height: '2px',
                  background: status === 'complete' ? C.green : '#1E2A45',
                  marginBottom: '16px',
                  transition: 'background 0.3s ease',
                  flexShrink: 0
                }} />
              )}
            </div>
          )
        })}
      </div>

     
      {!loading && !summary && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              setFile(e.dataTransfer.files[0])
            }}
            onClick={() => document.getElementById('auto-file').click()}
            style={{
              border: `2px dashed ${drag ? C.accent : C.border}`,
              borderRadius: '10px', padding: '20px',
              textAlign: 'center', marginBottom: '14px',
              background: drag ? C.accentDim : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}>
            <input id="auto-file" type="file" accept=".csv"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])} />
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>📂</div>
            <div style={{
              fontSize: '13px', color: C.textSub, fontWeight: 500
            }}>
              {file ? file.name : 'Drop cab_rides.csv here or click to browse'}
            </div>
          </div>

          <button onClick={handleRun} disabled={!file}
            style={{
              width: '100%',
              background: file
                ? 'linear-gradient(135deg, #F97316, #EA580C)'
                : '#1E2A45',
              border: 'none', borderRadius: '8px',
              padding: '12px 20px',
              color: file ? 'white' : C.textMuted,
              fontSize: '14px', fontWeight: 700,
              fontFamily: C.sans, cursor: file ? 'pointer' : 'not-allowed',
              letterSpacing: '0.2px'
            }}>
            ⚡ Run Complete Pipeline
          </button>
        </>
      )}

     
      {loading && (
        <div style={{
          background: C.inputBg, border: `1px solid ${C.border}`,
          borderRadius: '10px', padding: '20px', textAlign: 'center'
        }}>
          <div style={{
            fontSize: '24px', marginBottom: '10px',
            animation: 'spin 1s linear infinite'
          }}>⚙️</div>
          <div style={{
            fontSize: '14px', fontWeight: 600, color: C.text,
            marginBottom: '4px'
          }}>Pipeline running...</div>
          <div style={{ fontSize: '12px', color: C.textMuted }}>
            Training takes 5–10 minutes. Don't close this tab.
          </div>

          
          {stages.length > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'left' }}>
              {stages.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 0',
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: '13px'
                }}>
                  <span style={{
                    color: s.status === 'complete' ? C.green : C.red
                  }}>
                    {s.status === 'complete' ? '✓' : '✗'}
                  </span>
                  <span style={{ color: C.textSub }}>
                    {STAGE_LABELS[s.stage]}
                  </span>
                  {s.result && s.result.quality_score && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '11px',
                      color: C.textMuted, fontFamily: C.mono
                    }}>
                      score: {s.result.quality_score}/100
                    </span>
                  )}
                  {s.result && s.result.best_model && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '11px',
                      color: C.textMuted, fontFamily: C.mono
                    }}>
                      best: {s.result.best_model}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

     
      {error && (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '8px', fontSize: '13px', color: C.red,
          marginTop: '12px'
        }}>{error}</div>
      )}

      {summary && (
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px', padding: '20px', marginTop: '4px'
        }}>
          <div style={{
            fontSize: '16px', fontWeight: 700, color: C.green,
            marginBottom: '12px', display: 'flex',
            alignItems: 'center', gap: '8px'
          }}>
            🚀 Pipeline complete
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '10px', marginBottom: '12px'
          }}>
            {[
              { label: 'Stages completed', value: `${summary.completed}/6` },
              { label: 'Best model', value: summary.best_model },
              { label: 'Version', value: summary.best_version },
              { label: 'Status', value: 'In production' }
            ].map(m => (
              <div key={m.label} style={{
                background: C.inputBg, border: `1px solid ${C.border}`,
                borderRadius: '8px', padding: '10px'
              }}>
                <div style={{
                  fontSize: '14px', fontWeight: 700,
                  color: C.green, fontFamily: C.mono
                }}>{m.value}</div>
                <div style={{
                  fontSize: '11px', color: C.textMuted, marginTop: '2px'
                }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: '12px', color: C.textMuted, fontStyle: 'italic'
          }}>
            {summary.message}
          </div>
        </div>
      )}
    </div>
  )
}