import { vi } from "vitest";
import type { GoDaddyClient } from "../../src/client.js";

export function mockClient(
  getImpl: (...args: Parameters<GoDaddyClient["get"]>) => ReturnType<GoDaddyClient["get"]>,
  postImpl?: (path: string, body: unknown) => Promise<unknown>,
  putImpl?: (path: string, body: unknown) => Promise<unknown>,
  patchImpl?: (path: string, body: unknown) => Promise<unknown>,
  deleteImpl?: (path: string) => Promise<unknown>
): GoDaddyClient {
  return {
    get: vi.fn(getImpl),
    post: vi.fn(postImpl ?? (async () => ({}))),
    put: vi.fn(putImpl ?? (async () => ({}))),
    patch: vi.fn(patchImpl ?? (async () => ({}))),
    delete: vi.fn(deleteImpl ?? (async () => ({})))
  } as unknown as GoDaddyClient;
}
