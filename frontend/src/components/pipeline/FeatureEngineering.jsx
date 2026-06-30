import { useState } from 'react'
import { engineerFeatures } from '../../api/surgeApi'
import { C, cardStyle, primaryBtn } from '../ui'

export default function FeatureEngineering({ datasetId, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleEngineer = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await engineerFeatures(datasetId)
      setResult(data.data)
      onComplete(data.data.engineered_file)
    } catch {
      setError('Feature engineering failed')
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
      }}>Stage 03 · Feature Engineering</div>
      <div style={{
        fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '4px'
      }}>Engineer features</div>
      <div style={{
        fontSize: '13px', color: C.textMuted, marginBottom: '20px'
      }}>
        Transform raw columns into ML-ready signals
      </div>

      <button onClick={handleEngineer} disabled={loading}
        style={primaryBtn(loading)}>
        {loading ? '⏳ Engineering features...' : 'Engineer Features →'}
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
          {/* Shape comparison */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            gap: '12px', alignItems: 'center', marginBottom: '16px'
          }}>
            <div style={{
              background: C.inputBg, border: `1px solid ${C.border}`,
              borderRadius: '8px', padding: '12px', textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px', color: C.textMuted,
                fontFamily: C.mono, marginBottom: '4px'
              }}>BEFORE</div>
              <div style={{
                fontSize: '16px', fontWeight: 700,
                color: C.textSub, fontFamily: C.mono
              }}>
                {result.original_shape.rows.toLocaleString()} × {result.original_shape.cols}
              </div>
            </div>
            <div style={{ fontSize: '18px', color: C.accent }}>→</div>
            <div style={{
              background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              borderRadius: '8px', padding: '12px', textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px', color: C.accent,
                fontFamily: C.mono, marginBottom: '4px'
              }}>AFTER</div>
              <div style={{
                fontSize: '16px', fontWeight: 700,
                color: C.accent, fontFamily: C.mono
              }}>
                {result.engineered_shape.rows.toLocaleString()} × {result.engineered_shape.cols}
              </div>
            </div>
          </div>

          <div style={{
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '14px'
          }}>
            <div style={{
              fontSize: '11px', color: C.textMuted, marginBottom: '10px',
              fontFamily: C.mono, letterSpacing: '0.5px'
            }}>FEATURES CREATED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.features_created.map(f => (
                <span key={f} style={{
                  fontSize: '11px', padding: '4px 9px',
                  background: C.accentDim,
                  border: `1px solid ${C.accentBorder}`,
                  borderRadius: '4px', color: C.accent,
                  fontFamily: C.mono
                }}>{f}</span>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '12px', display: 'flex',
            alignItems: 'center', gap: '6px',
            fontSize: '13px', color: C.green
          }}>
            <span>✓</span>
            Target: <strong style={{ fontFamily: C.mono, color: C.text }}>
              {result.target_variable}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}