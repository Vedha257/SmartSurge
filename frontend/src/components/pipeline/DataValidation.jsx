import { useState } from 'react'
import { validateDataset } from '../../api/surgeApi'
import { C, cardStyle, primaryBtn } from '../ui'

export default function DataValidation({ datasetId, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const scoreColor = (s) =>
    s >= 80 ? C.green : s >= 60 ? C.yellow : C.red

  const handleValidate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await validateDataset(datasetId)
      setResult(data.data)
      if (data.data.quality_score >= 60) onComplete()
    } catch {
      setError('Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const checks = result ? [
    {
      label: 'Schema',
      detail: result.schema_passed
        ? 'All required columns present'
        : `Missing: ${result.missing_columns?.join(', ')}`,
      passed: result.schema_passed
    },
    {
      label: 'Missing values',
      detail: `${result.total_missing_pct}% overall`,
      passed: result.total_missing_pct < 20
    },
    {
      label: 'Duplicates',
      detail: `${result.duplicate_count?.toLocaleString()} rows`,
      passed: result.duplicate_count < 50000
    }
  ] : []

  return (
    <div style={cardStyle}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: C.accent,
        fontFamily: C.mono, letterSpacing: '1px',
        textTransform: 'uppercase', marginBottom: '4px'
      }}>
        Stage 02 · Validation
      </div>
      <div style={{
        fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '4px'
      }}>Validate dataset</div>
      <div style={{
        fontSize: '13px', color: C.textMuted, marginBottom: '20px'
      }}>
        Run quality checks before feature engineering
      </div>

      <button onClick={handleValidate} disabled={loading}
        style={primaryBtn(loading)}>
        {loading ? '⏳ Validating...' : 'Run Validation →'}
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
         
          <div style={{
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: '10px', padding: '20px', textAlign: 'center',
            marginBottom: '14px'
          }}>
            <div style={{
              fontSize: '11px', color: C.textMuted, marginBottom: '6px',
              fontFamily: C.mono, letterSpacing: '1px'
            }}>QUALITY SCORE</div>
            <div style={{
              fontSize: '52px', fontWeight: 800,
              color: scoreColor(result.quality_score),
              fontFamily: C.mono, lineHeight: 1
            }}>
              {result.quality_score}
              <span style={{ fontSize: '22px', color: C.textMuted }}>/100</span>
            </div>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checks.map(check => (
              <div key={check.label} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: '8px'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: check.passed ? C.green : C.red
                }}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, color: C.text
                  }}>{check.label}</div>
                  <div style={{
                    fontSize: '12px', color: C.textMuted
                  }}>{check.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '12px', padding: '10px 14px',
            background: result.quality_score >= 60
              ? C.greenDim : 'rgba(248,113,113,0.08)',
            border: `1px solid ${result.quality_score >= 60
              ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)'}`,
            borderRadius: '8px', fontSize: '13px',
            color: result.quality_score >= 60 ? C.green : C.red
          }}>
            {result.recommendation}
          </div>
        </div>
      )}
    </div>
  )
}