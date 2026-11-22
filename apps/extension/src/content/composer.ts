import { PROMPT_MARKER } from '../practice/prompt.ts'

const MARKER_WAIT_MS = 300

export function getComposerText(input: HTMLElement): string {
  if (input instanceof HTMLTextAreaElement) {
    return input.value.trim()
  }
  return (input.innerText ?? input.textContent ?? '').trim()
}

function hasMarker(input: HTMLElement): boolean {
  return getComposerText(input).includes(PROMPT_MARKER)
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

// Some editors (Quill) apply pasted text a tick later, so poll briefly before falling back.
async function waitForMarker(input: HTMLElement): Promise<boolean> {
  const deadline = performance.now() + MARKER_WAIT_MS
  while (performance.now() < deadline) {
    if (hasMarker(input)) return true
    await nextFrame()
  }
  return hasMarker(input)
}

// React-controlled textareas ignore direct `.value =` writes; the prototype setter plus an
// input event is what React's onChange listens for.
function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

function placeCaretAtEnd(editor: HTMLElement): void {
  editor.focus()
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function dispatchPaste(editor: HTMLElement, text: string): void {
  const data = new DataTransfer()
  data.setData('text/plain', text)
  editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
}

/**
 * Appends text to the chat composer through the editor's own input handling (ProseMirror,
 * Lexical and Quill keep their own document model, so writing to the DOM directly would be
 * discarded). Resolves true only when the marker is visibly in the composer afterwards.
 */
export async function appendToComposer(input: HTMLElement, text: string): Promise<boolean> {
  if (input instanceof HTMLTextAreaElement) {
    setTextareaValue(input, `${input.value}${text}`)
    return waitForMarker(input)
  }

  placeCaretAtEnd(input)
  dispatchPaste(input, text)
  if (await waitForMarker(input)) return true

  placeCaretAtEnd(input)
  document.execCommand('insertText', false, text)
  return waitForMarker(input)
}
