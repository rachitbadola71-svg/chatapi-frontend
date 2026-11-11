export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.trim().slice(0, 2).toUpperCase() || '?'
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-wa-brand/70 font-semibold text-white ${
        size === 'sm' ? 'size-9 text-xs' : 'size-11 text-sm'
      }`}
    >
      {initials}
    </span>
  )
}
