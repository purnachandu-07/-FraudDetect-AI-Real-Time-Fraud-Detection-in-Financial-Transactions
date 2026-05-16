import api from './api'

export const getAlerts = (params = {}) => api.get('/api/alerts/', { params })
export const getAlertStats = () => api.get('/api/alerts/stats')
export const updateAlert = (id, status) => api.patch(`/api/alerts/${id}`, { status })
