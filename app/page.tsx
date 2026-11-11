'use client'

import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { clearSession, getStoredUsername, getToken, type Room } from '@/lib/api'
import { AuthScreen } from '@/components/chat/auth-screen'
import { RoomsScreen } from '@/components/chat/rooms-screen'
import { ChatScreen } from '@/components/chat/chat-screen'

export default function Page() {
  const { mutate } = useSWRConfig()
  const [ready, setReady] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)

  // Restore an existing session from localStorage after hydration.
  useEffect(() => {
    if (getToken()) setUsername(getStoredUsername() ?? '')
    setReady(true)
  }, [])

  function logout() {
    clearSession()
    setRoom(null)
    setUsername(null)
    // Drop all cached API data so the next user starts clean.
    mutate(() => true, undefined, { revalidate: false })
  }

  if (!ready) return <div className="min-h-dvh bg-wa-panel" />

  if (username === null) {
    return <AuthScreen onLoggedIn={setUsername} />
  }

  if (room) {
    // key={room.id} remounts the chat on room change, which closes the old socket.
    return (
      <ChatScreen key={room.id} room={room} username={username} onBack={() => setRoom(null)} onLogout={logout} />
    )
  }

  return <RoomsScreen username={username} onOpenRoom={setRoom} onLogout={logout} />
}
