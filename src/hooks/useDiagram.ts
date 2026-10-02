import { useCallback, useEffect, useRef, useState } from "react";
import {
  arrangeDocument,
  createId,
  emptyDocument,
  loadDocument,
  safeDocument,
  saveDocument,
  type DiagramDocument,
  type DiagramNode,
} from "../model";

/** Own document history and persistence independently from the canvas renderer. */
export function useDiagram() {
  const [document, setDocument] = useState<DiagramDocument>(emptyDocument);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const undoStack = useRef<DiagramDocument[]>([]);
  const redoStack = useRef<DiagramDocument[]>([]);
  const current = useRef(document);
  const dragStart = useRef<DiagramDocument | null>(null);
  const [, refreshHistory] = useState(0);

  useEffect(() => {
    current.current = document;
  }, [document]);
  useEffect(() => {
    let active = true;
    loadDocument()
      .then((value) => {
        if (active && value) setDocument(safeDocument(value));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      saveDocument(document)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 500);
    return () => clearTimeout(timer);
  }, [document, ready]);

  const commit = useCallback((next: DiagramDocument) => {
    undoStack.current.push(current.current);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    current.current = next;
    setDocument(next);
    refreshHistory((n) => n + 1);
  }, []);
  const replace = useCallback((next: DiagramDocument) => {
    undoStack.current = [];
    redoStack.current = [];
    current.current = next;
    setDocument(next);
    refreshHistory((n) => n + 1);
  }, []);
  const updateNode = useCallback(
    (id: string, patch: Partial<DiagramNode>) => {
      commit({
        ...current.current,
        nodes: current.current.nodes.map((node) =>
          node.id === id ? { ...node, ...patch } : node,
        ),
      });
    },
    [commit],
  );
  const addNode = useCallback(
    (type: string, x: number, y: number, color: string, label: string) => {
      const id = createId();
      commit({
        ...current.current,
        nodes: [
          ...current.current.nodes,
          {
            id,
            type,
            label,
            x,
            y,
            width: 210,
            height: 88,
            color,
            variant: "card",
          },
        ],
      });
      return id;
    },
    [commit],
  );
  const beginGesture = useCallback(() => {
    dragStart.current = current.current;
  }, []);
  const moveNode = useCallback((id: string, x: number, y: number) => {
    const next = {
      ...current.current,
      nodes: current.current.nodes.map((n) =>
        n.id === id ? { ...n, x, y } : n,
      ),
    };
    current.current = next;
    setDocument(next);
  }, []);
  const endGesture = useCallback(() => {
    if (dragStart.current && dragStart.current !== current.current) {
      undoStack.current.push(dragStart.current);
      redoStack.current = [];
      refreshHistory((n) => n + 1);
    }
    dragStart.current = null;
  }, []);
  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(current.current);
    current.current = previous;
    setDocument(previous);
    refreshHistory((n) => n + 1);
  }, []);
  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(current.current);
    current.current = next;
    setDocument(next);
    refreshHistory((n) => n + 1);
  }, []);
  const layout = useCallback(
    () => commit(arrangeDocument(current.current)),
    [commit],
  );
  return {
    document,
    ready,
    saveState,
    commit,
    replace,
    updateNode,
    addNode,
    beginGesture,
    moveNode,
    endGesture,
    undo,
    redo,
    layout,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}
