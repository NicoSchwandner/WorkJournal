import { vi } from "vitest";

/** Register a global mock for `fs` with harmless defaults. */
export function mockFsSafeDefaults() {
  vi.mock("fs", async () => {
    const actual: typeof import("fs") = await vi.importActual("fs");
    const dirent = (): import("fs").Dirent => ({ name: "", isDirectory: () => true } as unknown as import("fs").Dirent);

    return {
      ...actual,
      readdirSync: vi.fn(() => [] as import("fs").Dirent[]),
      existsSync: vi.fn(() => false),
      statSync: vi.fn(() => ({ isDirectory: () => true })),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
      readFileSync: vi.fn(),
      rmSync: vi.fn(),
      copyFileSync: vi.fn(),
    };
  });
}
