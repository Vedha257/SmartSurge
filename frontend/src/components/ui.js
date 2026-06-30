// Shared design tokens for consistent styling
export const C = {
  bg: '#0A0F1E',
  card: '#0D1426',
  cardBorder: '#1E2A45',
  cardHover: '#111827',
  accent: '#F97316',
  accentDim: 'rgba(249,115,22,0.12)',
  accentBorder: 'rgba(249,115,22,0.25)',
  blue: '#60A5FA',
  green: '#10B981',
  greenDim: 'rgba(16,185,129,0.1)',
  red: '#F87171',
  yellow: '#FBBF24',
  text: '#F1F5F9',
  textSub: '#94A3B8',
  textMuted: '#475569',
  border: '#1E2A45',
  inputBg: '#0A0F1E',
  mono: 'JetBrains Mono, monospace',
  sans: 'Inter, sans-serif'
}

export const stageBadgeStyle = (num) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#F97316',
  letterSpacing: '0.5px',
  fontFamily: 'JetBrains Mono, monospace',
  marginBottom: '12px'
})

export const cardStyle = {
  background: '#0D1426',
  border: '1px solid #1E2A45',
  borderRadius: '12px',
  padding: '24px'
}

export const inputStyle = {
  width: '100%',
  background: '#0A0F1E',
  border: '1px solid #1E2A45',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#F1F5F9',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none'
}

export const selectStyle = {
  ...inputStyle,
  cursor: 'pointer'
}

export const primaryBtn = (loading) => ({
  width: '100%',
  background: loading ? '#1E2A45' : 'linear-gradient(135deg, #F97316, #EA580C)',
  border: 'none',
  borderRadius: '8px',
  padding: '11px 20px',
  color: loading ? '#475569' : 'white',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s ease',
  letterSpacing: '0.1px'
})

export const metricCard = (value, label, color = '#F97316') => ({
  background: '#0A0F1E',
  border: '1px solid #1E2A45',
  borderRadius: '8px',
  padding: '14px',
  textAlign: 'center'
})