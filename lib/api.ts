// Change this one constant to point the app at a different Spring Boot server.
export const API_BASE_URL = 'http://localhost:8080'

// The WebSocket URL is derived from the REST base URL (http -> ws, https -> wss).
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

const TOKEN_KEY = 'chat_token'
const USERNAME_KEY = 'chat_username'

export type Room = { id: number; chatRoomName: string }

export type MessageStatus = 'ACTIVE' | 'PINNED' | 'DELETED'

export type ChatMessage = {
  id: number
  content: string | null
  status: MessageStatus
  createdAt: string
  editCount: number
  senderId: number
  senderUsername: string
  fileName: string | null
  originalFileName: string | null
}

export type RoomUser = {
  id?: number
  username?: string
  email?: string
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUsername() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USERNAME_KEY)
}

export function saveSession(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

/**
 * Shared fetch wrapper for every REST call.
 * - Prefixes the path with API_BASE_URL.
 * - Adds "Authorization: Bearer <token>" when a token is stored, so the
 *   Spring Boot security filter can identify the user.
 * - Only sets Content-Type: application/json for plain-object bodies. For
 *   FormData we leave it unset so the browser adds the multipart boundary.
 * - The server returns errors as plain text, so we throw that text as-is.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; json?: unknown; body?: FormData; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', json, body, auth = true } = options
  const headers: Record<string, string> = {}

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`
  if (json !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : body,
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(text || `Request failed (${res.status})`)
  }

  // Successful replies may be JSON or plain text (e.g. the join endpoint).
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

/**
 * Files are protected by the Authorization header, so <img src="/api/files/x">
 * would fail. Instead we fetch the bytes with the header, wrap them in a Blob,
 * and hand back an object URL that <img>/<audio>/<video> can use as src.
 */
export async function fetchFileObjectUrl(fileName: string): Promise<string> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(fileName)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error((await res.text()) || 'Could not load file')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export type MediaKind = 'image' | 'audio' | 'video' | 'file'

export function mediaKindFromName(name: string | null | undefined): MediaKind {
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'oga'].includes(ext)) return 'audio'
  if (ext === 'mp4') return 'video'
  return 'file'
}
