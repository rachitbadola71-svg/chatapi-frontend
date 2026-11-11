'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, LogOut, Users } from 'lucide-react'
import { apiFetch, getToken, WS_BASE_URL, type ChatMessage, type Room, type RoomUser } from '@/lib/api'
import { Avatar } from '@/components/chat/avatar'
import { MessageBubble } from '@/components/chat/message-bubble'
import { Composer } from '@/components/chat/composer'

type ChatScreenProps = {
  room: Room
  username: string
  onBack: () => void
  onLogout: () => void
}

function appendUnique(list: ChatMessage[] | undefined, message: ChatMessage) {
  const current = list ?? []
  if (current.some((m) => m.id === message.id)) return current
  return [...current, message]
}

export function ChatScreen({ room, username, onBack, onLogout }: ChatScreenProps) {
  // GET /api/message/room/{roomId} — the room's message history (loaded once).
  const messagesKey = `/api/message/room/${room.id}`
  const {
    data: messages,
    error,
    isLoading,
    mutate,
  } = useSWR<ChatMessage[]>(messagesKey, (url: string) => apiFetch<ChatMessage[]>(url), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // GET /api/chatroom/{roomId}/users — members shown in the header.
  const { data: users } = useSWR<RoomUser[]>(`/api/chatroom/${room.id}/users`, (url: string) =>
    apiFetch<RoomUser[]>(url),
  )

  const [showMembers, setShowMembers] = useState(false)
  const [socketOpen, setSocketOpen] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  // Live updates: one WebSocket per open room. The cleanup closes it when the
  // user switches room, goes back, or logs out (component unmounts).
  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = new WebSocket(
      `${WS_BASE_URL}/ws?roomId=${encodeURIComponent(room.id)}&token=${encodeURIComponent(token)}`,
    )
    socket.onopen = () => setSocketOpen(true)
    socket.onclose = () => setSocketOpen(false)

    // The server pushes each new message as a JSON string shaped like a history
    // item. We parse it and append it to the SWR cache without refetching.
    socket.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data) as ChatMessage
        mutate((prev) => appendUnique(prev, incoming), { revalidate: false })
      } catch {
        // Ignore frames that are not message JSON.
      }
    }

    return () => {
      socket.onmessage = null
      socket.onclose = null
      socket.close()
    }
  }, [room.id, mutate])

  const visible = (messages ?? []).filter((m) => m.status !== 'DELETED')

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' })
  }, [visible.length])

  async function sendMessage(content: string, file: File | null) {
    // POST /api/message/send/{roomId} as multipart/form-data. We do NOT set
    // Content-Type: the browser adds it (with the boundary) for FormData.
    const form = new FormData()
    if (content) form.append('content', content)
    if (file) form.append('file', file)

    const saved = await apiFetch<ChatMessage | string>(`/api/message/send/${room.id}`, {
      method: 'POST',
      body: form,
    })
    // If the server echoes the saved message, show it immediately; the
    // WebSocket copy is de-duplicated by id.
    if (saved && typeof saved === 'object' && 'id' in saved) {
      mutate((prev) => appendUnique(prev, saved), { revalidate: false })
    }
  }

  const memberNames = (users ?? []).map((u) => u.username ?? u.email ?? `User ${u.id ?? ''}`)

  return (
    <div className="flex h-dvh flex-col bg-wa-chat">
      <header className="relative z-10 flex items-center gap-2 bg-wa-brand px-2 py-2 text-white shadow-sm sm:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to rooms"
          className="rounded-full p-2 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <Avatar name={room.chatRoomName} size="sm" />
        <button
          type="button"
          onClick={() => setShowMembers((v) => !v)}
          aria-expanded={showMembers}
          aria-controls="room-members"
          className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-left hover:bg-white/5"
        >
          <h1 className="truncate font-semibold leading-tight">{room.chatRoomName}</h1>
          <p className="truncate text-xs text-white/80">
            {socketOpen ? 'online' : 'connecting…'}
            {memberNames.length > 0 && ` · ${memberNames.length} member${memberNames.length === 1 ? '' : 's'}`}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setShowMembers((v) => !v)}
          aria-label="Show members"
          className="rounded-full p-2 transition-colors hover:bg-white/10"
        >
          <Users className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Log out</span>
          <span className="sr-only sm:hidden">Log out</span>
        </button>

        {showMembers && (
          <div
            id="room-members"
            className="absolute right-2 top-full mt-2 w-64 rounded-lg bg-white p-3 text-neutral-900 shadow-lg sm:right-4"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wa-brand">Members</p>
            {memberNames.length === 0 ? (
              <p className="text-sm text-neutral-500">No members found.</p>
            ) : (
              <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                {memberNames.map((name, i) => (
                  <li key={`${name}-${i}`} className="truncate text-sm">
                    {name}
                    {name === username && <span className="text-neutral-500"> (you)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-[8%]">
        {isLoading ? (
          <p className="mx-auto w-fit rounded-md bg-white/80 px-3 py-1 text-sm text-neutral-600">Loading messages…</p>
        ) : error ? (
          <p role="alert" className="mx-auto w-fit rounded-md bg-red-50 px-3 py-1 text-sm text-red-700">
            {error instanceof Error ? error.message : String(error)}
          </p>
        ) : visible.length === 0 ? (
          <p className="mx-auto w-fit rounded-md bg-[#fff5c4] px-3 py-1.5 text-xs text-neutral-700">
            No messages yet. Say hello!
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5" aria-live="polite">
            {visible.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMine={m.senderUsername === username}
                showSender={i === 0 || visible[i - 1].senderUsername !== m.senderUsername}
              />
            ))}
          </ul>
        )}
        <div ref={listEndRef} />
      </main>

      <Composer onSend={sendMessage} />
    </div>
  )
}
