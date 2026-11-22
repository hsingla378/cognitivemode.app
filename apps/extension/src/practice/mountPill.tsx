import { createRoot } from 'react-dom/client'
import { createShadowHost } from '../content/shadowHost'
import PracticePill from './PracticePill'
import type { PracticePillProps } from './PracticePill'

const HOST_ID = 'cognitive-mode-pill'
// Bottom-left: GeeksforGeeks keeps its Submit button bottom-right.
const HOST_CSS =
  'position: fixed !important; left: 16px !important; bottom: 56px !important; z-index: 2147483646 !important; pointer-events: none !important;'

export interface PillController {
  update: (props: PracticePillProps) => void
  destroy: () => void
}

export function mountPill(): PillController {
  const shadowHost = createShadowHost(HOST_ID, HOST_CSS)
  const root = createRoot(shadowHost.app)

  return {
    update(props) {
      // Keyed by problem so an open log panel or message never carries over to the next problem.
      root.render(<PracticePill key={props.record?.key ?? 'none'} {...props} />)
    },
    destroy() {
      root.unmount()
      shadowHost.destroy()
    },
  }
}
