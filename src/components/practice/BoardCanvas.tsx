"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { boardStorageKey } from "@/lib/board/exportBoard";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-bg1 text-sm text-muted">
        Loading board…
      </div>
    ),
  },
);

/** Default board canvas — matches --bg1 */
const BOARD_BG = "#1a1a1a";

type BoardCanvasProps = {
  problemSlug: string;
  onAnalyze?: () => void;
  analyzing?: boolean;
};

type StoredBoard = {
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

type ExcalidrawApi = {
  updateScene: (scene: {
    appState?: Partial<{ viewBackgroundColor: string; theme: string }>;
  }) => void;
  getAppState: () => { viewBackgroundColor?: string };
};

function isLightOrEmptyBg(color: unknown): boolean {
  if (typeof color !== "string" || !color.trim()) return true;
  const c = color.trim().toLowerCase();
  return (
    c === "#fff" ||
    c === "#ffffff" ||
    c === "white" ||
    c === "#fffef7" ||
    c === "transparent"
  );
}

function normalizeBg(color: unknown): string {
  return isLightOrEmptyBg(color) ? BOARD_BG : String(color);
}

/**
 * Dark Excalidraw board — defaults to app grey; user can change canvas color.
 * Persists locally per problem slug.
 */
export function BoardCanvas({
  problemSlug,
  onAnalyze,
  analyzing,
}: BoardCanvasProps) {
  const [initialData, setInitialData] = useState<StoredBoard | null>(null);
  const [ready, setReady] = useState(false);
  const [api, setApi] = useState<ExcalidrawApi | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(boardStorageKey(problemSlug));
      if (raw) {
        const parsed = JSON.parse(raw) as StoredBoard;
        const bg = normalizeBg(parsed.appState?.viewBackgroundColor);
        setInitialData({
          ...parsed,
          appState: {
            ...(parsed.appState ?? {}),
            theme: "dark",
            viewBackgroundColor: bg,
          },
        });
      } else {
        setInitialData({
          elements: [],
          appState: {
            theme: "dark",
            viewBackgroundColor: BOARD_BG,
          },
        });
      }
    } catch {
      setInitialData({
        elements: [],
        appState: {
          theme: "dark",
          viewBackgroundColor: BOARD_BG,
        },
      });
    }
    setReady(true);
  }, [problemSlug]);

  useEffect(() => {
    if (!api) return;
    const current = api.getAppState().viewBackgroundColor;
    if (isLightOrEmptyBg(current)) {
      api.updateScene({
        appState: { viewBackgroundColor: BOARD_BG, theme: "dark" },
      });
    }
  }, [api]);

  const onChange = useCallback(
    (
      elements: readonly unknown[],
      appState: Record<string, unknown>,
      files: Record<string, unknown>,
    ) => {
      try {
        const bg = normalizeBg(appState.viewBackgroundColor);
        const payload: StoredBoard = {
          elements: [...elements],
          appState: {
            viewBackgroundColor: bg,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            gridSize: appState.gridSize,
            theme: "dark",
          },
          files,
        };
        localStorage.setItem(
          boardStorageKey(problemSlug),
          JSON.stringify(payload),
        );
      } catch {
        // ignore
      }
    },
    [problemSlug],
  );

  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        changeViewBackgroundColor: true,
        clearCanvas: true,
        export: false as const,
        loadScene: false,
        saveToActiveFile: false,
        toggleTheme: false,
      },
    }),
    [],
  );

  if (!ready || !initialData) {
    return (
      <div className="flex h-full items-center justify-center bg-bg1 text-sm text-muted">
        Loading board…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg1">
      {onAnalyze ? (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Board</h2>
            <p className="text-[11px] text-muted">
              Enable Send board beside the tab to include this sketch
            </p>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analyzing}
            className="h-8 rounded-md bg-accent px-3 text-xs font-semibold text-bg0 hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>
        </header>
      ) : null}
      <div className="board-host min-h-0 flex-1 overflow-hidden">
        <Excalidraw
          theme="dark"
          initialData={{
            elements: initialData.elements as never[],
            appState: {
              ...(initialData.appState ?? {}),
              theme: "dark",
              viewBackgroundColor: normalizeBg(
                initialData.appState?.viewBackgroundColor,
              ),
            },
            files: initialData.files as never,
          }}
          excalidrawAPI={(a) => setApi(a as unknown as ExcalidrawApi)}
          onChange={onChange as never}
          UIOptions={uiOptions}
        />
      </div>
    </div>
  );
}
