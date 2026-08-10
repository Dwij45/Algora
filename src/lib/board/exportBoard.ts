/** Client-only helpers for Excalidraw board persistence + PNG export. */

export const BOARD_STORAGE_PREFIX = "problem-solver:board:";

export function boardStorageKey(slug: string): string {
  return `${BOARD_STORAGE_PREFIX}${slug}`;
}

export type BoardScene = {
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

export function readBoardScene(slug: string): BoardScene | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(boardStorageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BoardScene;
    if (!Array.isArray(parsed.elements)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function nonDeletedElements(elements: unknown[]): unknown[] {
  return elements.filter((el) => {
    if (!el || typeof el !== "object") return false;
    return !(el as { isDeleted?: boolean }).isDeleted;
  });
}

/**
 * Export board PNG as raw base64 (no data: prefix).
 * Returns null if no drawable content.
 */
export async function exportBoardPngBase64(
  slug: string,
): Promise<string | null> {
  const scene = readBoardScene(slug);
  if (!scene) return null;

  const elements = nonDeletedElements(scene.elements);
  if (elements.length === 0) return null;

  const { exportToBlob } = await import("@excalidraw/excalidraw");

  const blob = await exportToBlob({
    elements: elements as never[],
    appState: {
      ...(scene.appState ?? {}),
      exportBackground: true,
      exportWithDarkMode: true,
      exportEmbedScene: false,
    } as never,
    files: (scene.files ?? {}) as never,
    mimeType: "image/png",
    maxWidthOrHeight: 1280,
    quality: 0.85,
  });

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
