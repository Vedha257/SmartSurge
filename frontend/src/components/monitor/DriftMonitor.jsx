import { useState, useEffect } from 'react'
import {
  getMonitorStats, runDriftDetection,
  getSurgeTrend, getPredictionLog
} from '../../api/surgeApi'
import { C, cardStyle } from '../ui'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'



const severityColor = {
  High: { bg: 'rgba(248,113,113,0.08)', text: '#F87171', border: 'rgba(248,113,113,0.2)' },
  Medium: { bg: 'rgba(251,191,36,0.08)', text: '#FBBF24', border: 'rgba(251,191,36,0.2)' },
  Low: { bg: 'rgba(96,165,250,0.08)', text: '#60A5FA', border: 'rgba(96,165,250,0.2)' }
}

const demandColor = {
  Low: C.green, Medium: C.yellow, High: C.accent, 'Very High': C.red
}

export default function DriftMonitor({ datasetId }) {
  const [stats, setStats] = useState(null)
  const [driftResult, setDriftResult] = useState(null)
  const [trend, setTrend] = useState([])
  const [predLog, setPredLog] = useState([])
  const [driftLoading, setDriftLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [datasetId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, t, l] = await Promise.all([
        getMonitorStats(datasetId),
        getSurgeTrend(),
        getPredictionLog()
      ])
      setStats(s.data)
      setTrend(t.data.trend)
      setPredLog(l.data)
    } finally {
      setLoading(false)
    }
  }

  const handleDriftCheck = async () => {
    setDriftLoading(true)
    try {
      const res = await runDriftDetection(datasetId)
      setDriftResult(res.data)
      const s = await getMonitorStats(datasetId)
      setStats(s.data)
    } finally {
      setDriftLoading(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px', color: C.textMuted }}>
      Loading monitor data...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: C.accent,
          fontFamily: C.mono, letterSpacing: '1px',
          textTransform: 'uppercase', marginBottom: '6px'
        }}>Drift Monitor</div>
        <h2 style={{
          fontSize: '22px', fontWeight: 700, color: C.text,
          margin: 0, letterSpacing: '-0.3px'
        }}>Model health</h2>
        <p style={{ fontSize: '13px', color: C.textMuted, marginTop: '4px' }}>
          Monitor production model performance and input drift over time
        </p>
      </div>

      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
        }}>
          {[
            { label: 'Total predictions', value: stats.total_predictions.toLocaleString(), color: C.blue },
            { label: 'Production model', value: `${stats.production_model.model_type} ${stats.production_model.version}`, color: C.green },
            { label: 'Drift alerts', value: stats.active_drift_alerts, color: stats.active_drift_alerts > 0 ? C.red : C.green },
            { label: 'Model RMSE', value: stats.production_model.rmse || '—', color: C.yellow }
          ].map(card => (
            <div key={card.label} className="metric-card" style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '10px', padding: '16px'
            }}>
              <div style={{
                fontSize: '22px', fontWeight: 800,
                color: card.color, fontFamily: C.mono, marginBottom: '4px'
              }}>{card.value}</div>
              <div style={{
                fontSize: '12px', color: C.textMuted
              }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      
      {trend.length > 0 && (
        <div style={cardStyle}>
          <div style={{
            fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '16px'
          }}>Surge prediction trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" />
              <XAxis dataKey="index"
                tick={{ fontSize: 10, fill: C.textMuted }}
                axisLine={{ stroke: C.border }}
                tickLine={false} />
              <YAxis domain={[0.9, 'auto']}
                tick={{ fontSize: 10, fill: C.textMuted }}
                axisLine={{ stroke: C.border }}
                tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: '8px', fontSize: '12px', color: C.text
                }}
                formatter={v => [`${v}×`, 'Surge']}
                labelFormatter={l => `#${l}`}
              />
              <Line type="monotone" dataKey="surge"
                stroke={C.accent} strokeWidth={2}
                dot={{ r: 3, fill: C.accent, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.accent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

     
      <div style={cardStyle}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px'
        }}>
          <div>
            <div style={{
              fontSize: '14px', fontWeight: 700, color: C.text
            }}>Input drift detection</div>
            <div style={{
              fontSize: '12px', color: C.textMuted, marginTop: '2px'
            }}>KS test · recent predictions vs training data</div>
          </div>
          <button onClick={handleDriftCheck} disabled={driftLoading}
            style={{
              background: driftLoading ? '#1E2A45' : 'linear-gradient(135deg, #F97316, #EA580C)',
              border: 'none', borderRadius: '8px',
              padding: '9px 18px', color: driftLoading ? C.textMuted : 'white',
              fontSize: '13px', fontWeight: 600, cursor: driftLoading ? 'not-allowed' : 'pointer',
              fontFamily: C.sans
            }}>
            {driftLoading ? 'Checking...' : 'Run Drift Check'}
          </button>
        </div>

        

        {driftResult && (
          <div>
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
              background: driftResult.status === 'complete'
                ? C.greenDim : 'rgba(251,191,36,0.08)',
              border: `1px solid ${driftResult.status === 'complete'
                ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)'}`,
              fontSize: '13px',
              color: driftResult.status === 'complete' ? C.green : C.yellow
            }}>
              {driftResult.status === 'complete'
                ? `✓ Checked ${driftResult.features_checked} features — ${driftResult.total_alerts} drift alerts`
                : driftResult.message}
            </div>

            {driftResult.drift_alerts?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {driftResult.drift_alerts.map(alert => {
                  const sc = severityColor[alert.severity]
                  return (
                    <div key={alert.feature} style={{
                      padding: '12px 14px', borderRadius: '8px',
                      background: sc.bg, border: `1px solid ${sc.border}`
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '6px'
                      }}>
                        <span style={{
                          fontSize: '13px', fontWeight: 600, color: sc.text,
                          textTransform: 'capitalize'
                        }}>
                          {alert.feature.replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, color: sc.text,
                          padding: '2px 8px', background: sc.bg,
                          border: `1px solid ${sc.border}`, borderRadius: '4px'
                        }}>{alert.severity}</span>
                      </div>
                      <div style={{
                        display: 'flex', gap: '16px',
                        fontSize: '11px', color: sc.text, opacity: 0.75,
                        fontFamily: C.mono
                      }}>
                        <span>KS {alert.ks_statistic}</span>
                        <span>train avg {alert.training_mean}</span>
                        <span>recent avg {alert.recent_mean}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : driftResult.status === 'complete' && (
              <div style={{
                padding: '12px 14px', borderRadius: '8px',
                background: C.greenDim,
                border: 'rgba(16,185,129,0.2)',
                fontSize: '13px', color: C.green
              }}>
                ✓ No significant drift — model inputs look healthy
              </div>
            )}
          </div>
        )}

        {!driftResult && (
          <div style={{ fontSize: '13px', color: C.textMuted }}>
            Click "Run Drift Check" to compare recent prediction inputs
            against training data distributions
          </div>
        )}
      </div>

      
      <div style={cardStyle}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px', fontWeight: 700, color: C.text
          }}>Prediction log</div>
          <button onClick={loadAll} style={{
            background: 'none', border: 'none',
            color: C.accent, fontSize: '12px', cursor: 'pointer',
            fontFamily: C.sans
          }}>↻ Refresh</button>
        </div>

        {predLog.length === 0 ? (
          <div style={{ fontSize: '13px', color: C.textMuted }}>
            No predictions yet — make some predictions first
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', 'Model', 'Surge', 'Demand', 'Time'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 12px',
                      fontSize: '11px', color: C.textMuted,
                      fontFamily: C.mono, letterSpacing: '0.5px',
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predLog.map(pred => (
                  <tr key={pred.id} style={{
                    borderBottom: `1px solid ${C.border}`
                  }}>
                    <td style={{
                      padding: '10px 12px', fontSize: '12px',
                      color: C.textMuted, fontFamily: C.mono
                    }}>#{pred.id}</td>
                    <td style={{
                      padding: '10px 12px', fontSize: '12px',
                      color: C.textSub, fontFamily: C.mono
                    }}>{pred.model_version}</td>
                    <td style={{
                      padding: '10px 12px', fontSize: '13px',
                      fontWeight: 700, color: C.accent, fontFamily: C.mono
                    }}>{pred.predicted_surge}×</td>
                    <td style={{
                      padding: '10px 12px', fontSize: '12px',
                      fontWeight: 600,
                      color: demandColor[pred.demand_level] || C.textSub
                    }}>{pred.demand_level}</td>
                    <td style={{
                      padding: '10px 12px', fontSize: '11px',
                      color: C.textMuted, fontFamily: C.mono
                    }}>
                      {new Date(pred.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}