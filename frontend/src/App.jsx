import { useState, useEffect } from 'react'
import axios from 'axios'
import DataIngestion from './components/pipeline/DataIngestion'
import DataValidation from './components/pipeline/DataValidation'
import FeatureEngineering from './components/pipeline/FeatureEngineering'
import ModelTraining from './components/pipeline/ModelTraining'
import ModelRegistry from './components/pipeline/ModelRegistry'
import SurgePredictor from './components/predict/SurgePredictor'
import WhatIfSimulator from './components/predict/WhatIfSimulator'
import DriftMonitor from './components/monitor/DriftMonitor'
import AutoPipeline from './components/pipeline/AutoPipeline'
import { C } from './components/ui'

const TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: '⚙️' },
  { id: 'predictor', label: 'Predict', icon: '⚡' },
  { id: 'simulator', label: 'Simulate', icon: '🎛' },
  { id: 'monitor', label: 'Monitor', icon: '📡' }
]

const STAGES = [
  { id: 1, label: 'Ingest' },
  { id: 2, label: 'Validate' },
  { id: 3, label: 'Engineer' },
  { id: 4, label: 'Train' },
  { id: 5, label: 'Registry' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('pipeline')
  const [pipelineMode, setPipelineMode] = useState('auto')
  const [datasetId, setDatasetId] = useState(null)
  const [manualDatasetId, setManualDatasetId] = useState(null)
  const [validationPassed, setValidationPassed] = useState(false)
  const [engineeringDone, setEngineeringDone] = useState(false)
  const [trainingDone, setTrainingDone] = useState(false)
  const [modelPromoted, setModelPromoted] = useState(false)

  useEffect(() => {
    const fetchLatestDataset = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const res = await axios.get(`${API_BASE}/pipeline/latest-dataset`)
        if (res.data.dataset_id) {
          setDatasetId(res.data.dataset_id)
        }
      } catch (e) {
        console.log('No dataset found yet')
      }
    }
    fetchLatestDataset()
  }, [])

  const currentStage = !manualDatasetId ? 1
    : !validationPassed ? 2
    : !engineeringDone ? 3
    : !trainingDone ? 4
    : !modelPromoted ? 5
    : 6

  return (
    <div style={{ background: '#0A0F1E', minHeight: '100vh' }}>

      <nav style={{
        background: '#0D1426',
        borderBottom: '1px solid #1E2A45',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: 'white',
            fontFamily: 'JetBrains Mono, monospace'
          }}>S</div>
          <div>
            <div style={{
              fontSize: '15px', fontWeight: 700, color: '#F1F5F9',
              letterSpacing: '-0.3px'
            }}>SmartSurge</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              ML Pipeline Platform
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s ease',
                background: activeTab === tab.id
                  ? 'rgba(249, 115, 22, 0.15)'
                  : 'transparent',
                color: activeTab === tab.id ? '#F97316' : '#64748B',
                outline: activeTab === tab.id
                  ? '1px solid rgba(249,115,22,0.3)'
                  : 'none'
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-pulse" style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: modelPromoted ? '#10B981' : '#F97316'
          }} />
          <span style={{ fontSize: '12px', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
            {modelPromoted ? 'model · production' : `stage ${currentStage}/5`}
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}
        className="tab-content">

        {activeTab === 'pipeline' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: C.accent,
                fontFamily: C.mono, letterSpacing: '1px',
                textTransform: 'uppercase', marginBottom: '8px'
              }}>ML Pipeline</div>
              <h1 style={{
                fontSize: '24px', fontWeight: 700, color: C.text,
                margin: 0, letterSpacing: '-0.5px'
              }}>Build your pricing model</h1>
              <p style={{
                fontSize: '14px', color: C.textMuted, marginTop: '6px'
              }}>
                Complete each stage to train and deploy a surge prediction model
              </p>
            </div>

            <div style={{
              display: 'flex', gap: '8px', marginBottom: '24px',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '10px', padding: '6px'
            }}>
              {[
                { id: 'auto', label: '⚡ Auto Pipeline', desc: 'One click — all stages run automatically' },
                { id: 'manual', label: '🔧 Manual Pipeline', desc: 'Control each stage individually' }
              ].map(mode => (
                <button key={mode.id} onClick={() => {
                  setPipelineMode(mode.id)
                  if (mode.id === 'manual') {
                    setManualDatasetId(null)
                    setValidationPassed(false)
                    setEngineeringDone(false)
                    setTrainingDone(false)
                    setModelPromoted(false)
                  }
                }}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: '8px',
                    border: 'none', cursor: 'pointer',
                    background: pipelineMode === mode.id ? C.accentDim : 'transparent',
                    outline: pipelineMode === mode.id
                      ? `1px solid ${C.accentBorder}` : 'none',
                    transition: 'all 0.15s ease', textAlign: 'left'
                  }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: pipelineMode === mode.id ? C.accent : C.textSub
                  }}>{mode.label}</div>
                  <div style={{
                    fontSize: '11px', color: C.textMuted, marginTop: '2px'
                  }}>{mode.desc}</div>
                </button>
              ))}
            </div>

            {pipelineMode === 'manual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <DataIngestion
                  onComplete={(id) => {
                    setManualDatasetId(id)
                    setDatasetId(id)
                    setValidationPassed(false)
                    setEngineeringDone(false)
                    setTrainingDone(false)
                    setModelPromoted(false)
                  }}
                />
                {manualDatasetId && (
                  <DataValidation
                    datasetId={manualDatasetId}
                    onComplete={() => setValidationPassed(true)}
                  />
                )}
                {validationPassed && (
                  <FeatureEngineering
                    datasetId={manualDatasetId}
                    onComplete={() => setEngineeringDone(true)}
                  />
                )}
                {engineeringDone && (
                  <ModelTraining
                    datasetId={manualDatasetId}
                    onComplete={() => setTrainingDone(true)}
                  />
                )}
                {trainingDone && (
                  <ModelRegistry
                    onPromoted={() => setModelPromoted(true)}
                  />
                )}
                {modelPromoted && (
                  <div style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '12px', padding: '24px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚀</div>
                    <div style={{
                      fontSize: '16px', fontWeight: 700, color: C.green,
                      marginBottom: '4px'
                    }}>Pipeline complete</div>
                    <div style={{ fontSize: '13px', color: C.textMuted }}>
                      Model is live · Switch to Predict tab
                    </div>
                  </div>
                )}
              </div>
            )}

            {pipelineMode === 'auto' && (
              <AutoPipeline
                onComplete={(id) => {
                  setDatasetId(id)
                  setValidationPassed(true)
                  setEngineeringDone(true)
                  setTrainingDone(true)
                  setModelPromoted(true)
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'predictor' && <SurgePredictor />}
        {activeTab === 'simulator' && <WhatIfSimulator />}
        {activeTab === 'monitor' && datasetId && (
          <DriftMonitor datasetId={datasetId} />
        )}
        {activeTab === 'monitor' && !datasetId && (
          <EmptyState
            icon="📡"
            title="No pipeline data"
            description="Run the pipeline first to enable drift monitoring"
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description }) {
  return (
    <div style={{
      background: '#0D1426', border: '1px solid #1E2A45',
      borderRadius: '12px', padding: '48px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{
        fontSize: '15px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px'
      }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#475569' }}>{description}</div>
    </div>
  )
}