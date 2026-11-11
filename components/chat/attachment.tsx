'use client'

import useSWR from 'swr'
import { FileText, Download } from 'lucide-react'
import { fetchFileObjectUrl, mediaKindFromName } from '@/lib/api'

export function Attachment({ fileName, originalFileName }: { fileName: string; originalFileName: string | null }) {
  const displayName = originalFileName ?? fileName
  const kind = mediaKindFromName(originalFileName ?? fileName)

  // Fetch the file with the Authorization header and cache the resulting blob URL.
  const { data: src, error, isLoading } = useSWR(['file', fileName], () => fetchFileObjectUrl(fileName), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  })

  if (isLoading) {
    return <div className="h-32 w-56 max-w-full animate-pulse rounded-md bg-black/5" aria-label="Loading attachment" />
  }

  if (error || !src) {
    return <p className="text-xs text-red-700">Could not load {displayName}</p>
  }

  if (kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- src is a runtime blob: URL
      <img src={src} alt={displayName} className="max-h-72 w-auto max-w-full rounded-md object-contain" />
    )
  }

  if (kind === 'audio') {
    return <audio controls src={src} className="w-64 max-w-full" aria-label={displayName} />
  }

  if (kind === 'video') {
    return <video controls src={src} className="max-h-72 max-w-full rounded-md" aria-label={displayName} />
  }

  return (
    <a
      href={src}
      download={displayName}
      className="flex items-center gap-2 rounded-md bg-black/5 px-3 py-2 text-sm text-neutral-800 hover:bg-black/10"
    >
      <FileText className="size-5 shrink-0 text-wa-brand" aria-hidden="true" />
      <span className="truncate">{displayName}</span>
      <Download className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
    </a>
  )
}
