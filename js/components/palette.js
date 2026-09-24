import { catalog } from "../modules/catalog.js";

/** Render searchable, keyboard-usable component library. */
export function renderPalette(container, query, onAdd) {
  container.replaceChildren();
  const term = query.trim().toLocaleLowerCase();
  const groups = [...new Set(catalog.map((item) => item.group))];
  for (const group of groups) {
    const items = catalog.filter(
      (item) =>
        item.group === group &&
        `${item.label} ${item.id}`.toLocaleLowerCase().includes(term),
    );
    if (!items.length) continue;
    const details = document.createElement("details");
    details.className = "palette-group";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = group;
    const count = document.createElement("span");
    count.className = "palette-count";
    count.textContent = items.length;
    summary.append(count);
    details.append(summary);
    for (const item of items) {
      const button = document.createElement("button");
      button.className = "palette-item";
      button.draggable = true;
      button.title = `Añadir ${item.label}`;
      button.dataset.type = item.id;
      const icon = document.createElement("span");
      icon.className = "palette-icon";
      icon.style.setProperty("--icon-color", item.color);
      icon.textContent = item.glyph;
      const name = document.createElement("span");
      name.textContent = item.label;
      button.append(icon, name);
      button.addEventListener("click", () => onAdd(item.id));
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "copy";
      });
      details.append(button);
    }
    container.append(details);
  }
}
