import { catalogById } from "../modules/catalog.js";
const NS = "http://www.w3.org/2000/svg";
const el = (name, attributes = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, String(value));
  return node;
};
/** Render the editable SVG scene using DOM APIs, never HTML interpolation. */
export function renderScene(doc, selected, viewport, handlers) {
  const nodes = document.getElementById("nodes"),
    edges = document.getElementById("edges"),
    group = document.getElementById("viewport");
  nodes.replaceChildren();
  edges.replaceChildren();
  group.setAttribute(
    "transform",
    `translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`,
  );
  const byId = new Map(doc.nodes.map((node) => [node.id, node]));
  for (const edge of doc.edges) {
    const a = byId.get(edge.from),
      b = byId.get(edge.to);
    if (!a || !b) continue;
    const path = el("path", {
      d: `M ${a.x + 156} ${a.y + 32} C ${a.x + 190} ${a.y + 32}, ${b.x - 34} ${b.y + 32}, ${b.x} ${b.y + 32}`,
      class: `edge${selected === edge.id ? " selected" : ""}`,
      "data-edge": edge.id,
      role: "button",
      tabindex: 0,
      "aria-label": `Conexión de ${a.label} a ${b.label}`,
    });
    path.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      handlers.select(edge.id);
    });
    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handlers.select(edge.id);
      }
    });
    edges.append(path);
  }
  for (const node of doc.nodes) {
    const meta = catalogById.get(node.type);
    const g = el("g", {
      class: `node${selected === node.id ? " selected" : ""}`,
      transform: `translate(${node.x} ${node.y})`,
      "data-node": node.id,
      role: "button",
      tabindex: 0,
      "aria-label": `${node.label}, ${meta.group}. Flechas para mover; Enter para seleccionar.`,
    });
    g.append(el("rect", { width: 156, height: 64, rx: 9 }));
    const icon = el("rect", {
      x: 10,
      y: 12,
      width: 39,
      height: 39,
      rx: 7,
      fill: meta.color,
      "fill-opacity": ".18",
      stroke: "none",
    });
    g.append(icon);
    const glyph = el("text", {
      x: 29.5,
      y: 38,
      "text-anchor": "middle",
      class: "node-icon",
      fill: meta.color,
    });
    glyph.textContent = meta.glyph;
    g.append(glyph);
    const label = el("text", { x: 60, y: 38 });
    label.textContent =
      node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label;
    g.append(label);
    g.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      handlers.nodeDown(event, node.id);
    });
    g.addEventListener("keydown", (event) => handlers.nodeKey(event, node.id));
    g.addEventListener("contextmenu", (event) =>
      handlers.contextMenu(event, node.id),
    );
    nodes.append(g);
  }
}
