import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white border border-hairline border-ks-rule text-ks-ink text-[13px] px-3 py-2.5 rounded-ks focus:outline-none focus:border-ks-lava transition-colors placeholder:text-ks-ghost ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-ks-silver">{hint}</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-white border border-hairline border-ks-rule text-ks-ink text-[13px] px-3 py-2.5 rounded-ks focus:outline-none focus:border-ks-lava transition-colors ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function Textarea({ label, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-white border border-hairline border-ks-rule text-ks-ink text-[13px] px-3 py-2.5 rounded-ks focus:outline-none focus:border-ks-lava transition-colors resize-none placeholder:text-ks-ghost ${className}`}
        {...props}
      />
      {hint && <p className="text-[11px] text-ks-silver">{hint}</p>}
    </div>
  )
}
