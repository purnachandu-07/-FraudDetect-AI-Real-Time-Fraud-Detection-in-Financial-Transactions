import api from './api'

export const getTransactions = (params = {}) => api.get('/api/transactions/', { params })
export const getTransactionStats = () => api.get('/api/transactions/stats')
export const getTransactionTrend = (days = 7) => api.get('/api/transactions/trend', { params: { days } })
export const simulateTransaction = (modelName = 'xgboost', forceFraud = false) =>
  api.post('/api/transactions/simulate', null, { params: { model_name: modelName, force_fraud: forceFraud } })
export const submitManualTransaction = (data) => api.post('/api/transactions/manual', data)
