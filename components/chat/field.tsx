'use client'

import { useId } from 'react'

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  required?: boolean
}

export function Field({ label, value, onChange, type = 'text', autoComplete, required }: FieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-wa-brand focus:ring-2 focus:ring-wa-brand/20"
      />
    </div>
  )
}
