'use client'

import { useEffect, useState } from 'react'
import { Lock, Pin } from 'lucide-react'
import type { ChatMessage } from '@/lib/api'
import { Attachment } from '@/components/chat/attachment'
import { decryptText, PREFIX } from '@/lib/crypto' // the unlock helper + the "locked" sticker text

function formatTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({
                                  message,
                                  isMine,
                                  showSender,
                                  roomKey,
                              }: {
    message: ChatMessage
    isMine: boolean
    showSender: boolean
    roomKey: CryptoKey // the room's key, passed down from chat-screen.tsx
}) {
    const isLocked = !!message.content && message.content.startsWith(PREFIX) // does it carry the e2e sticker?
    const [opened, setOpened] = useState<string | null>(null) // the readable text, once unlocked
    const [failed, setFailed] = useState(false) // true when the key is wrong

    useEffect(() => {
        if (!isLocked || !message.content) return // old plain message: nothing to open
        let cancelled = false // avoids updating after the bubble is gone
        decryptText(message.content, roomKey).then((text) => {
            if (cancelled) return
            if (text === null) setFailed(true) // wrong key: show the lock label
            else {
                setOpened(text) // right key: show the real text
                setFailed(false)
            }
        })
        return () => {
            cancelled = true
        }
    }, [message.content, isLocked, roomKey])

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

                {message.content && !isLocked && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-900">{message.content}</p>
                )}
                {isLocked && opened !== null && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-900">{opened}</p>
                )}
                {isLocked && opened === null && failed && (
                    <p className="flex items-center gap-1 text-sm italic text-neutral-500">
                        <Lock className="size-3.5" aria-hidden="true" />
                        Locked message (wrong passphrase)
                    </p>
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