const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')
const ACCESS_KEY = 'jobtrack-access-token'
const REFRESH_KEY = 'jobtrack-refresh-token'

export function saveTokens(tokens) {
  sessionStorage.setItem(ACCESS_KEY, tokens.access)
  sessionStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}

export function hasSession() {
  return Boolean(sessionStorage.getItem(ACCESS_KEY) && sessionStorage.getItem(REFRESH_KEY))
}

async function decodeResponse(response) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload?.detail || payload?.error
    const fieldErrors = payload && typeof payload === 'object' && !detail
      ? Object.entries(payload).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`).join('; ')
      : ''
    throw new Error(fieldErrors || detail || 'The API request failed.')
  }
  return payload
}

async function refreshAccessToken() {
  const refresh = sessionStorage.getItem(REFRESH_KEY)
  if (!refresh) return false

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!response.ok) {
      clearTokens()
      return false
    }
    const tokens = await response.json()
    saveTokens({ access: tokens.access, refresh: tokens.refresh || refresh })
    return true
  } catch {
    return false
  }
}

async function request(path, options = {}, requiresAuth = true, retried = false) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  }
  if (requiresAuth) {
    const access = sessionStorage.getItem(ACCESS_KEY)
    if (access) headers.Authorization = `Bearer ${access}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(`Cannot reach JobTrack API at ${API_BASE_URL}. Start the Django backend and check VITE_API_BASE_URL.`)
  }

  if (requiresAuth && response.status === 401 && !retried) {
    if (await refreshAccessToken()) return request(path, options, requiresAuth, true)
    clearTokens()
    window.dispatchEvent(new Event('jobtrack:session-expired'))
  }

  return decodeResponse(response)
}

export async function registerAccount({ name, email, password }) {
  const result = await request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }, false)
  saveTokens(result)
  return result.user
}

export async function loginAccount({ email, password }) {
  const result = await request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false)
  saveTokens(result)
  return result.user
}

export function getCurrentUser() {
  return request('/auth/me/')
}

export function logoutAccount() {
  clearTokens()
}

export function getApplications() {
  return request('/applications/')
}

export function createApplication(application) {
  return request('/applications/', {
    method: 'POST',
    body: JSON.stringify(application),
  })
}

export function updateApplication(id, application) {
  return request(`/applications/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: JSON.stringify(application),
  })
}

export function deleteApplication(id) {
  return request(`/applications/${encodeURIComponent(id)}/`, { method: 'DELETE' })
}
