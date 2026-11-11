'use client'

import { useRef, useState } from 'react'
import { Paperclip, SendHorizontal, X } from 'lucide-react'

export function Composer({ onSend }: { onSend: (content: string, file: File | null) => Promise<void> }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend = !sending && (text.trim().length > 0 || file !== null)

  async function submit() {
    if (!canSend) return
    setSending(true)
    setError(null)
    try {
      await onSend(text.trim(), file)
      setText('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <footer className="bg-wa-panel px-2 py-2 sm:px-4">
      {error && (
        <p role="alert" className="mb-2 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm shadow-sm">
          <Paperclip className="size-4 shrink-0 text-wa-brand" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              setFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            aria-label="Remove attachment"
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex items-end gap-2"
      >
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label
          htmlFor="file-input"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black/5"
        >
          <Paperclip className="size-5" aria-hidden="true" />
          <span className="sr-only">Attach a file</span>
        </label>

        <label htmlFor="message-input" className="sr-only">
          Message
        </label>
        <textarea
          id="message-input"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Type a message"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-lg bg-white px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-wa-brand/20"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-wa-brand px-4 text-sm font-medium text-white transition-colors hover:bg-wa-brand-dark disabled:opacity-50"
        >
          <SendHorizontal className="size-4" aria-hidden="true" />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </footer>
  )
}
