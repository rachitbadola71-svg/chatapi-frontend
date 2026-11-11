import { Pin } from 'lucide-react'
import type { ChatMessage } from '@/lib/api'
import { Attachment } from '@/components/chat/attachment'

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, isMine, showSender }: { message: ChatMessage; isMine: boolean; showSender: boolean }) {
  return (
    <li className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[80%] rounded-lg px-2.5 pb-1.5 pt-1.5 shadow-sm sm:max-w-[65%] ${
          isMine ? 'rounded-tr-none bg-wa-out' : 'rounded-tl-none bg-white'
        }`}
      >
        {!isMine && showSender && (
          <p className="mb-0.5 text-xs font-semibold text-wa-brand">{message.senderUsername}</p>
        )}

        {message.fileName && (
          <div className="mb-1">
            <Attachment fileName={message.fileName} originalFileName={message.originalFileName} />
          </div>
        )}

        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-900">{message.content}</p>
        )}

        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-neutral-500">
          {message.status === 'PINNED' && (
            <>
              <Pin className="size-3" aria-hidden="true" />
              <span className="sr-only">Pinned</span>
            </>
          )}
          {message.editCount > 0 && <span>edited</span>}
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        </p>
      </div>
    </li>
  )
}
