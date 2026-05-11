import React from 'react'

type Variant = 'dark' | 'orange' | 'outline' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base = 'inline-flex items-center gap-2 font-body font-medium text-[10px] uppercase tracking-[0.12em] rounded-ks transition-colors duration-150 cursor-pointer disabled:opacity-40'

const variants: Record<Variant, string> = {
  dark:    'bg-ks-void text-white border border-ks-void hover:bg-ks-lava hover:border-ks-lava',
  orange:  'bg-ks-lava text-white border border-ks-lava hover:bg-[#d95e00]',
  outline: 'bg-transparent text-ks-lava border border-ks-lava hover:bg-ks-lava hover:text-white',
  ghost:   'bg-transparent text-ks-silver border-none hover:text-ks-ink',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-5 py-3',
}

export function Button({ variant = 'dark', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
