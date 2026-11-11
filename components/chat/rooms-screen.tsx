'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Hash, LogOut, MessageCircle, Plus, LogIn, ChevronRight } from 'lucide-react'
import { apiFetch, type Room } from '@/lib/api'
import { Avatar } from '@/components/chat/avatar'

type RoomsScreenProps = {
  username: string
  onOpenRoom: (room: Room) => void
  onLogout: () => void
}

export function RoomsScreen({ username, onOpenRoom, onLogout }: RoomsScreenProps) {
  // GET /api/chatroom/mine — rooms the current user has joined.
  const mine = useSWR<Room[]>('/api/chatroom/mine', (url: string) => apiFetch<Room[]>(url))
  // GET /api/chatroom — every room on the server, so users can discover rooms.
  const all = useSWR<Room[]>('/api/chatroom', (url: string) => apiFetch<Room[]>(url))

  const [joinId, setJoinId] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const myIds = new Set((mine.data ?? []).map((r) => r.id))
  const otherRooms = (all.data ?? []).filter((r) => !myIds.has(r.id))

  async function joinRoom(roomId: number | string) {
    // PUT /api/users/join/{roomId} — no body; the server replies with plain text.
    const reply = await apiFetch<string>(`/api/users/join/${roomId}`, { method: 'PUT' })
    await mine.mutate()
    return reply
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinId.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const reply = await joinRoom(joinId.trim())
      setMessage({ kind: 'ok', text: typeof reply === 'string' && reply ? reply : 'Joined room.' })
      setJoinId('')
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoomName.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      // POST /api/chatroom — create the room, then join it right away.
      const room = await apiFetch<Room>('/api/chatroom', {
        method: 'POST',
        json: { chatRoomName: newRoomName.trim() },
      })
      await joinRoom(room.id)
      await all.mutate()
      setNewRoomName('')
      onOpenRoom(room)
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleJoinAndOpen(room: Room) {
    setBusy(true)
    setMessage(null)
    try {
      await joinRoom(room.id)
      onOpenRoom(room)
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-wa-panel">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-wa-brand px-4 py-3 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-6" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Chats</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/80 sm:inline">{username}</span>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <form onSubmit={handleJoin} className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm">
            <label htmlFor="join-id" className="text-sm font-medium text-neutral-700">
              Join by room ID
            </label>
            <div className="flex gap-2">
              <input
                id="join-id"
                inputMode="numeric"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="e.g. 3"
                className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-wa-brand focus:ring-2 focus:ring-wa-brand/20"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex items-center gap-1 rounded-md bg-wa-brand px-3 text-sm font-medium text-white hover:bg-wa-brand-dark disabled:opacity-60"
              >
                <LogIn className="size-4" aria-hidden="true" />
                Join
              </button>
            </div>
          </form>

          <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm">
            <label htmlFor="new-room" className="text-sm font-medium text-neutral-700">
              Create a room
            </label>
            <div className="flex gap-2">
              <input
                id="new-room"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-wa-brand focus:ring-2 focus:ring-wa-brand/20"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex items-center gap-1 rounded-md bg-wa-brand px-3 text-sm font-medium text-white hover:bg-wa-brand-dark disabled:opacity-60"
              >
                <Plus className="size-4" aria-hidden="true" />
                Create
              </button>
            </div>
          </form>
        </div>

        {message && (
          <p
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={`rounded-md px-3 py-2 text-sm ${
              message.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-wa-out text-wa-brand-dark'
            }`}
          >
            {message.text}
          </p>
        )}

        <RoomList
          title="My rooms"
          rooms={mine.data}
          isLoading={mine.isLoading}
          error={mine.error}
          emptyText="You haven't joined any rooms yet."
          onSelect={onOpenRoom}
        />

        {otherRooms.length > 0 && (
          <RoomList
            title="Other rooms"
            rooms={otherRooms}
            isLoading={false}
            error={all.error}
            emptyText=""
            onSelect={handleJoinAndOpen}
            actionLabel="Join"
          />
        )}
      </main>
    </div>
  )
}

type RoomListProps = {
  title: string
  rooms: Room[] | undefined
  isLoading: boolean
  error: unknown
  emptyText: string
  onSelect: (room: Room) => void
  actionLabel?: string
}

function RoomList({ title, rooms, isLoading, error, emptyText, onSelect, actionLabel }: RoomListProps) {
  return (
    <section aria-labelledby={`${title}-heading`} className="overflow-hidden rounded-lg bg-white shadow-sm">
      <h2
        id={`${title}-heading`}
        className="border-b border-neutral-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-wa-brand"
      >
        {title}
      </h2>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-neutral-500">Loading…</p>
      ) : error ? (
        <p role="alert" className="px-4 py-6 text-sm text-red-700">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : !rooms || rooms.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => onSelect(room)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-wa-panel"
              >
                <Avatar name={room.chatRoomName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">{room.chatRoomName}</p>
                  <p className="flex items-center gap-0.5 text-xs text-neutral-500">
                    <Hash className="size-3" aria-hidden="true" />
                    {room.id}
                  </p>
                </div>
                {actionLabel ? (
                  <span className="rounded-full bg-wa-brand/10 px-3 py-1 text-xs font-medium text-wa-brand">
                    {actionLabel}
                  </span>
                ) : (
                  <ChevronRight className="size-4 text-neutral-400" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
