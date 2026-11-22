// Node module hook for runtime tests: swaps the React pill for a recorder so the
// practice runtime can run without a DOM or a renderer.
const STUB = new URL('./mount-pill-stub.mjs', import.meta.url).href

export async function resolve(specifier, context, nextResolve) {
  if (specifier === './mountPill') return { url: STUB, shortCircuit: true }
  return nextResolve(specifier, context)
}
