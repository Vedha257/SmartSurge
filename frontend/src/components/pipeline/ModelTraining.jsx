import { useState } from 'react'
import { trainModels } from '../../api/surgeApi'
import { C, cardStyle, primaryBtn } from '../ui'

export default function ModelTraining({ datasetId, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleTrain = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await trainModels(datasetId)
      setResult(data.data)
      onComplete(data.data)
    } catch {
      setError('Training failed — check backend logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: C.accent,
        fontFamily: C.mono, letterSpacing: '1px',
        textTransform: 'uppercase', marginBottom: '4px'
      }}>Stage 04 · Model Training</div>
      <div style={{
        fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '4px'
      }}>Train models</div>
      <div style={{
        fontSize: '13px', color: C.textMuted, marginBottom: '20px'
      }}>
        Train XGBoost and Random Forest · ~5–10 minutes
      </div>

      <button onClick={handleTrain} disabled={loading}
        style={primaryBtn(loading)}>
        {loading ? '⏳ Training... this may take a few minutes' : 'Train Models →'}
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

          
          {result.already_trained && (
            <div style={{
              padding: '12px 14px', borderRadius: '8px',
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.2)',
              fontSize: '13px', color: C.blue, marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span>ℹ️</span>
              {result.message}
            </div>
          )}

         
          {!result.already_trained && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px', marginBottom: '14px'
            }}>
              {[
                { label: 'Train samples', value: result.train_samples?.toLocaleString() || '—' },
                { label: 'Val samples', value: result.val_samples?.toLocaleString() || '—' }
              ].map(m => (
                <div key={m.label} style={{
                  background: C.inputBg, border: `1px solid ${C.border}`,
                  borderRadius: '8px', padding: '12px', textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px', fontWeight: 700,
                    color: C.blue, fontFamily: C.mono
                  }}>{m.value}</div>
                  <div style={{
                    fontSize: '11px', color: C.textMuted, marginTop: '2px'
                  }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}

         
          {result.models.map(model => (
            <div key={model.model_type} style={{
              border: `1px solid ${model.model_type === result.best_model
                ? C.accentBorder : C.border}`,
              background: model.model_type === result.best_model
                ? C.accentDim : C.inputBg,
              borderRadius: '10px', padding: '16px', marginBottom: '10px'
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '14px', fontWeight: 700, color: C.text
                }}>{model.model_type}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px',
                    background: '#1E2A45', borderRadius: '4px',
                    color: C.textMuted, fontFamily: C.mono
                  }}>{model.version}</span>
                  {model.model_type === result.best_model && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px',
                      background: C.accent, borderRadius: '4px',
                      color: 'white', fontWeight: 600
                    }}>best ★</span>
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px', textAlign: 'center'
              }}>
                {[
                  { label: 'MAE', value: model.mae, color: C.green },
                  { label: 'RMSE', value: model.rmse, color: C.blue },
                  { label: 'R²', value: model.r2, color: C.yellow }
                ].map(m => (
                  <div key={m.label}>
                    <div style={{
                      fontSize: '20px', fontWeight: 700,
                      color: m.color, fontFamily: C.mono
                    }}>{m.value}</div>
                    <div style={{
                      fontSize: '11px', color: C.textMuted, marginTop: '2px'
                    }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {model.training_time > 0 && (
                <div style={{
                  fontSize: '11px', color: C.textMuted, marginTop: '10px',
                  fontFamily: C.mono
                }}>
                  {model.training_time}s training time
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}