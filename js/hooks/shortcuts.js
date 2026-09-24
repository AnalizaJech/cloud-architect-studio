/** Register application shortcuts while respecting focused text fields. */
export function registerShortcuts(actions) {
  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA"].includes(
      document.activeElement?.tagName,
    );
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === "z") {
      event.preventDefault();
      event.shiftKey ? actions.redo() : actions.undo();
      return;
    }
    if (mod && key === "y") {
      event.preventDefault();
      actions.redo();
      return;
    }
    if (mod && key === "n") {
      event.preventDefault();
      actions.newDocument();
      return;
    }
    if (mod && key === "s") {
      event.preventDefault();
      actions.exportJson();
      return;
    }
    if (typing) return;
    if (key === "delete" || key === "backspace") {
      event.preventDefault();
      actions.deleteSelected();
    } else if (key === "escape") actions.escape();
    else if (key === "v") actions.tool("select");
    else if (key === "h") actions.tool("hand");
    else if (key === "c") actions.tool("connect");
    else if (key === "g") actions.grid();
    else if (key === "/") {
      event.preventDefault();
      actions.search();
    } else if (key === "+" || key === "=") actions.zoom(1.2);
    else if (key === "-") actions.zoom(1 / 1.2);
  });
}
