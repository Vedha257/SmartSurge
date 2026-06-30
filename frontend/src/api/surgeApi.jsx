import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'


export const ingestDataset = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axios.post(`${BASE_URL}/pipeline/ingest`, formData)
  return res.data
}

export const validateDataset = async (datasetId) => {
  const res = await axios.post(`${BASE_URL}/pipeline/validate/${datasetId}`)
  return res.data
}

export const engineerFeatures = async (datasetId) => {
  const res = await axios.post(`${BASE_URL}/pipeline/engineer/${datasetId}`)
  return res.data
}

export const trainModels = async (datasetId) => {
  const res = await axios.post(`${BASE_URL}/pipeline/train/${datasetId}`)
  return res.data
}

export const getEvaluation = async (datasetId) => {
  const res = await axios.get(`${BASE_URL}/pipeline/evaluate/${datasetId}`)
  return res.data
}

export const getRegistry = async () => {
  const res = await axios.get(`${BASE_URL}/pipeline/registry`)
  return res.data
}

export const promoteModel = async (registryId) => {
  const res = await axios.post(`${BASE_URL}/pipeline/promote/${registryId}`)
  return res.data
}

export const rollbackModel = async () => {
  const res = await axios.post(`${BASE_URL}/pipeline/rollback`)
  return res.data
}

export const getPrediction = async (inputData) => {
  const res = await axios.post(`${BASE_URL}/predict`, inputData)
  return res.data
}

export const getSimulation = async (inputData) => {
  const res = await axios.post(`${BASE_URL}/simulate`, inputData)
  return res.data
}

export const getMonitorStats = async (datasetId) => {
  const res = await axios.get(`${BASE_URL}/monitor/stats/${datasetId}`)
  return res.data
}

export const runDriftDetection = async (datasetId) => {
  const res = await axios.post(`${BASE_URL}/monitor/drift/${datasetId}`)
  return res.data
}

export const getSurgeTrend = async () => {
  const res = await axios.get(`${BASE_URL}/monitor/trend`)
  return res.data
}

export const getPredictionLog = async () => {
  const res = await axios.get(`${BASE_URL}/monitor/predictions`)
  return res.data
}

export const runFullPipeline = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axios.post(`${BASE_URL}/pipeline/run-full`, formData)
  return res.data
}