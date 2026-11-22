// Records what the runtime asks the pill to show; see runtime-hooks.mjs.
export function mountPill() {
  globalThis.__pillLog.push({ type: 'mount' })
  return {
    update(props) {
      globalThis.__pillLog.push({ type: 'update', key: props.record?.key ?? null, autoOpenToken: props.autoOpenToken })
    },
    destroy() {
      globalThis.__pillLog.push({ type: 'destroy' })
    },
  }
}
