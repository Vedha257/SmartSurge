import { useState } from 'react'
import { getPrediction } from '../../api/surgeApi'
import ShapExplainer from './ShapExplainer'
import { C, cardStyle, primaryBtn, selectStyle, inputStyle } from '../ui'

const ZONES = [
  'Airport','Back Bay','Beacon Hill','Boston Common','Downtown',
  'Fenway','Financial District','Haymarket Square','North End',
  'North Station','Northeastern University','South Station',
  'Theatre District','West End'
]

const demandColor = {
  Low: C.green, Medium: C.yellow, High: C.accent, 'Very High': C.red
}

export default function SurgePredictor() {
  const [form, setForm] = useState({
    hour_of_day: 8, day_of_week: 0, month: 6,
    weather: 'clear', distance: 2.0, cab_type: 'UberX',
    source: 'Downtown', destination: 'Airport',
    demand_proxy: 50, event_nearby: 0,
    temp: 60, rain: 0, clouds: 20, wind: 5, humidity: 0.5
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPrediction(form)
      console.log("Response:", data)
      console.log("Prediction:", data.data)

      setResult(data.data)
      console.log("Result explanations:", data.data.explanations)
    } catch {
      setError('Prediction failed — make sure a model is promoted to production')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: C.accent,
          fontFamily: C.mono, letterSpacing: '1px',
          textTransform: 'uppercase', marginBottom: '6px'
        }}>Surge Predictor</div>
        <h2 style={{
          fontSize: '22px', fontWeight: 700, color: C.text,
          margin: 0, letterSpacing: '-0.3px'
        }}>Predict surge price</h2>
        <p style={{ fontSize: '13px', color: C.textMuted, marginTop: '4px' }}>
          Configure ride parameters and get an instant surge prediction
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
        }}>
         
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>HOUR · {form.hour_of_day}:00</label>
            <input type="range" min="0" max="23"
              value={form.hour_of_day}
              onChange={e => update('hour_of_day', +e.target.value)}
              style={{ width: '100%' }} />
          </div>

          
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>DAY</label>
            <select value={form.day_of_week}
              onChange={e => update('day_of_week', +e.target.value)}
              style={selectStyle}>
              {['Monday','Tuesday','Wednesday','Thursday',
                'Friday','Saturday','Sunday'].map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
          </div>

          
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>WEATHER</label>
            <select value={form.weather}
              onChange={e => update('weather', e.target.value)}
              style={selectStyle}>
              {['clear','cloudy','rainy','stormy'].map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

         
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>DISTANCE · {form.distance} mi</label>
            <input type="range" min="0.5" max="10" step="0.5"
              value={form.distance}
              onChange={e => update('distance', +e.target.value)}
              style={{ width: '100%' }} />
          </div>

         
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>PICKUP ZONE</label>
            <select value={form.source}
              onChange={e => update('source', e.target.value)}
              style={selectStyle}>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>DROP ZONE</label>
            <select value={form.destination}
              onChange={e => update('destination', e.target.value)}
              style={selectStyle}>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>DEMAND · {form.demand_proxy} rides/hr</label>
            <input type="range" min="0" max="200"
              value={form.demand_proxy}
              onChange={e => update('demand_proxy', +e.target.value)}
              style={{ width: '100%' }} />
          </div>

         
          <div>
            <label style={{
              fontSize: '11px', color: C.textMuted, display: 'block',
              marginBottom: '6px', fontFamily: C.mono
            }}>EVENT NEARBY</label>
            <select value={form.event_nearby}
              onChange={e => update('event_nearby', +e.target.value)}
              style={selectStyle}>
              <option value={0}>No event</option>
              <option value={1}>Concert / Match / Festival</option>
            </select>
          </div>
        </div>

        <button onClick={handlePredict} disabled={loading}
          style={{ ...primaryBtn(loading), marginTop: '20px' }}>
          {loading ? '⏳ Predicting...' : '⚡ Predict Surge Price'}
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
          <div style={{
            marginTop: '20px',
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: '12px', padding: '24px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px', color: C.textMuted, marginBottom: '8px',
              fontFamily: C.mono, letterSpacing: '1px'
            }}>PREDICTED SURGE</div>
            <div style={{
              fontSize: '64px', fontWeight: 800,
              color: demandColor[result.demand_level] || C.accent,
              fontFamily: C.mono, lineHeight: 1,
              marginBottom: '16px'
            }}>
              {result.surge_multiplier}×
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '13px', padding: '5px 14px',
                background: `${demandColor[result.demand_level]}18`,
                border: `1px solid ${demandColor[result.demand_level]}40`,
                borderRadius: '20px', color: demandColor[result.demand_level],
                fontWeight: 600
              }}>{result.demand_level} demand</span>
              <span style={{
                fontSize: '13px', padding: '5px 14px',
                background: '#1E2A45', borderRadius: '20px',
                color: C.textSub
              }}>⏱ {result.wait_time} min wait</span>
            </div>
            <div style={{
              fontSize: '11px', color: C.textMuted, marginTop: '12px',
              fontFamily: C.mono
            }}>
              {result.model_type} · {result.model_version}
            </div>
          </div>
        )}
      </div>

      

      {result?.explanations?.length > 0 && (
        
        <ShapExplainer
          explanations={result.explanations}
          baseValue={result.base_value}
        />
      )}
    </div>
  )
}