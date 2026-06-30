import { C, cardStyle } from '../ui'

export default function ShapExplainer({ explanations, baseValue }) {
  if (!explanations?.length) return null
  const maxAbs = Math.max(...explanations.map(e => Math.abs(e.shap_value)))

  return (
    <div style={cardStyle}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: C.accent,
        fontFamily: C.mono, letterSpacing: '1px',
        textTransform: 'uppercase', marginBottom: '4px'
      }}>SHAP Explainability</div>
      <div style={{
        fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '4px'
      }}>Why this surge?</div>
      <div style={{
        fontSize: '13px', color: C.textMuted, marginBottom: '20px'
      }}>
        Base surge: <span style={{
          fontFamily: C.mono, color: C.text
        }}>{baseValue}×</span> — feature contributions below
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {explanations.map(item => {
          const pct = maxAbs > 0 ? Math.abs(item.shap_value) / maxAbs * 100 : 0
          const pos = item.shap_value > 0
          return (
            <div key={item.feature}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '5px'
              }}>
                <span style={{ fontSize: '13px', color: C.textSub }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '13px', fontWeight: 700, fontFamily: C.mono,
                  color: pos ? C.red : C.green
                }}>
                  {pos ? '+' : ''}{item.shap_value}×
                </span>
              </div>
              <div style={{
                height: '5px', background: '#1E2A45',
                borderRadius: '3px', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: pos
                    ? 'linear-gradient(90deg, #F87171, #EF4444)'
                    : 'linear-gradient(90deg, #34D399, #10B981)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: '16px', display: 'flex', gap: '16px',
        fontSize: '11px', color: C.textMuted
      }}>
        <span>🔴 increases surge</span>
        <span>🟢 reduces surge</span>
      </div>
    </div>
  )
}