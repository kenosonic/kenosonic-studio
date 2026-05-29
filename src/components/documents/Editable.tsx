import React, { useLayoutEffect, useRef } from 'react'

type EditableTag = 'span' | 'p' | 'h3' | 'h4'

interface EditableProps {
  value: string
  onSave: (value: string) => void
  tag?: EditableTag
  style?: React.CSSProperties
  className?: string
}

/**
 * contentEditable wrapper that bypasses React's reconciler for DOM content.
 * React never manages children of this element — useLayoutEffect sets textContent
 * directly, and skips the update while the user has focus to protect in-progress edits.
 */
export function Editable({ value, onSave, tag = 'span', style, className }: EditableProps) {
  const ref = useRef<HTMLElement>(null)
  const editingRef = useRef(false)

  useLayoutEffect(() => {
    if (ref.current && !editingRef.current) {
      ref.current.textContent = value
    }
  }, [value])

  const sharedProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true as const,
    onFocus: () => { editingRef.current = true },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      editingRef.current = false
      onSave(e.currentTarget.innerText)
    },
    style,
    className,
  }

  if (tag === 'p') return <p ref={ref as React.RefObject<HTMLParagraphElement>} {...sharedProps} />
  if (tag === 'h3') return <h3 ref={ref as React.RefObject<HTMLHeadingElement>} {...sharedProps} />
  if (tag === 'h4') return <h4 ref={ref as React.RefObject<HTMLHeadingElement>} {...sharedProps} />
  return <span ref={ref as React.RefObject<HTMLSpanElement>} {...sharedProps} />
}
