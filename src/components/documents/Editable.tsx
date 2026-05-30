import React, { useLayoutEffect, useRef } from 'react'

type EditableTag = 'span' | 'p' | 'h3' | 'h4'

interface EditableProps {
  value: string
  onSave: (value: string) => void
  tag?: EditableTag
  style?: React.CSSProperties
  className?: string
  html?: boolean
}

/**
 * contentEditable wrapper that bypasses React's reconciler for DOM content.
 * React never manages children of this element — useLayoutEffect sets textContent
 * directly, and skips the update while the user has focus to protect in-progress edits.
 *
 * Pass html={true} to preserve rich formatting (bold, italic, line breaks).
 * In that mode, innerHTML is used for both reading and writing.
 */
export function Editable({ value, onSave, tag = 'span', style, className, html = false }: EditableProps) {
  const ref = useRef<HTMLElement>(null)
  const editingRef = useRef(false)

  useLayoutEffect(() => {
    if (ref.current && !editingRef.current) {
      if (html) {
        ref.current.innerHTML = value
      } else {
        ref.current.textContent = value
      }
    }
  }, [value, html])

  const sharedProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true as const,
    onFocus: () => { editingRef.current = true },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      editingRef.current = false
      onSave(html ? e.currentTarget.innerHTML : e.currentTarget.innerText)
    },
    style,
    className,
  }

  if (tag === 'p') return <p ref={ref as React.RefObject<HTMLParagraphElement>} {...sharedProps} />
  if (tag === 'h3') return <h3 ref={ref as React.RefObject<HTMLHeadingElement>} {...sharedProps} />
  if (tag === 'h4') return <h4 ref={ref as React.RefObject<HTMLHeadingElement>} {...sharedProps} />
  return <span ref={ref as React.RefObject<HTMLSpanElement>} {...sharedProps} />
}
