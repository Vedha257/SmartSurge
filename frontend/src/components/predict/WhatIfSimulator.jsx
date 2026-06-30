import { useState, useEffect, useRef } from 'react'
import { getSimulation } from '../../api/surgeApi'
import { C, cardStyle } from '../ui'

const demandColor = {
  Low: C.green, Medium: C.yellow, High: C.accent, 'Very High': C.red
}

const WEATHER_OPTIONS = [
  { val: 'clear', icon: '☀️', label: 'Clear' },
  { val: 'cloudy', icon: '☁️', label: 'Cloudy' },
  { val: 'rainy', icon: '🌧️', label: 'Rainy' },
  { val: 'stormy', icon: '⛈️', label: 'Stormy' }
]

export default function WhatIfSimulator() {
  const [params, setParams] = useState({
    hour_of_day: 8, day_of_week: 1, month: 6,
    weather: 'clear', distance: 2.0, cab_type: 'UberX',
    source: 'Downtown', destination: 'Airport',
    demand_proxy: 50, event_nearby: 0,
    temp: 60, rain: 0, clouds: 20, wind: 5, humidity: 0.5
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await getSimulation(params)
        setResult(data.data)
      } catch { }
      finally { setLoading(false) }
    }, 350)
  }, [params])

  const update = (k, v) => setParams(p => ({ ...p, [k]: v }))

  const sliders = [
    { key: 'hour_of_day', label: 'Hour of Day', min: 0, max: 23, step: 1,
      display: v => `${v}:00 ${v < 12 ? 'AM' : 'PM'}` },
    { key: 'demand_proxy', label: 'Demand (rides/hr)', min: 0, max: 200, step: 5,
      display: v => `${v} rides/hr` },
    { key: 'distance', label: 'Distance', min: 0.5, max: 10, step: 0.5,
      display: v => `${v} miles` },
    { key: 'temp', label: 'Temperature', min: 20, max: 100, step: 1,
      display: v => `${v}°F` },
    { key: 'rain', label: 'Rainfall', min: 0, max: 1, step: 0.1,
      display: v => v === 0 ? 'None' : `${v} in/hr` }
  ]

  const surgeColor = result
    ? demandColor[result.demand_level] || C.accent
    : C.textMuted

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: C.accent,
          fontFamily: C.mono, letterSpacing: '1px',
          textTransform: 'uppercase', marginBottom: '6px'
        }}>What-if Simulator</div>
        <h2 style={{
          fontSize: '22px', fontWeight: 700, color: C.text,
          margin: 0, letterSpacing: '-0.3px'
        }}>Simulate scenarios</h2>
        <p style={{ fontSize: '13px', color: C.textMuted, marginTop: '4px' }}>
          Adjust any parameter — surge price updates instantly
        </p>
      </div>

      
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '28px', textAlign: 'center'
      }}>
        <div style={{
          fontSize: '11px', color: C.textMuted, marginBottom: '8px',
          fontFamily: C.mono, letterSpacing: '1px'
        }}>LIVE SURGE</div>
        <div style={{
          fontSize: '72px', fontWeight: 800, fontFamily: C.mono,
          color: surgeColor, lineHeight: 1, marginBottom: '12px',
          transition: 'color 0.3s ease'
        }}>
          {loading
            ? '...'
            : result
              ? `${result.surge_multiplier}×`
              : '—'}
        </div>
        {result && (
          <div style={{
            fontSize: '14px', color: C.textSub
          }}>
            <span style={{ color: surgeColor, fontWeight: 600 }}>
              {result.demand_level} demand
            </span>
            {' · '}{result.wait_time} min wait
          </div>
        )}
      </div>

     
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          
          {sliders.map(({ key, label, min, max, step, display }) => (
            <div key={key}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: C.textSub }}>
                  {label}
                </span>
                <span style={{
                  fontSize: '13px', fontWeight: 700,
                  color: C.accent, fontFamily: C.mono
                }}>
                  {display(params[key])}
                </span>
              </div>
              <input type="range" min={min} max={max} step={step}
                value={params[key]}
                onChange={e => update(
                  key,
                  step < 1 ? +parseFloat(e.target.value).toFixed(1) : +e.target.value
                )}
                style={{ width: '100%' }} />
            </div>
          ))}

          
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '14px 16px',
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontSize: '13px', color: C.text, fontWeight: 500 }}>
                Event nearby
              </div>
              <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '2px' }}>
                Concert, match, or festival
              </div>
            </div>
            <button
              onClick={() => update('event_nearby', params.event_nearby ? 0 : 1)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                border: 'none', cursor: 'pointer',
                background: params.event_nearby ? C.accent : '#1E2A45',
                position: 'relative', transition: 'background 0.2s ease'
              }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'white', position: 'absolute',
                top: '3px',
                left: params.event_nearby ? '23px' : '3px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>

        
          <div>
            <div style={{
              fontSize: '11px', color: C.textMuted, marginBottom: '10px',
              fontFamily: C.mono, letterSpacing: '0.5px'
            }}>WEATHER</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px'
            }}>
              {WEATHER_OPTIONS.map(({ val, icon, label }) => (
                <button key={val} onClick={() => update('weather', val)}
                  style={{
                    padding: '10px 4px', borderRadius: '8px',
                    border: `1px solid ${params.weather === val
                      ? C.accentBorder : C.border}`,
                    background: params.weather === val
                      ? C.accentDim : C.inputBg,
                    color: params.weather === val ? C.accent : C.textMuted,
                    fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                    fontFamily: C.sans, transition: 'all 0.15s ease'
                  }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                    {icon}
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}