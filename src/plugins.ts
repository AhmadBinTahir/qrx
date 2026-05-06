import type { Middleware, Renderer } from "./types.js";

const middlewareStack: Middleware[] = [];
const rendererRegistry = new Map<string, Renderer>();

export function useMiddleware(mw: Middleware): void {
  middlewareStack.push(mw);
}

export async function runMiddleware<T>(initial: T, run: (mw: Middleware, current: T) => Promise<T>): Promise<T> {
  let state = initial;
  for (const mw of middlewareStack) {
    state = await run(mw, state);
  }
  return state;
}

export function registerRenderer(renderer: Renderer): void {
  rendererRegistry.set(renderer.name, renderer);
}

export function getRenderer(name: string): Renderer | undefined {
  return rendererRegistry.get(name);
}

export function listRenderers(): string[] {
  return Array.from(rendererRegistry.keys());
}

export function clearMiddleware(): void {
  middlewareStack.length = 0;
}
