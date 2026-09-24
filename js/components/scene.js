import { catalogById } from "../modules/catalog.js";
import {
  edgePath,
  labelLines,
  nodeColor,
  nodeHeight,
  nodeWidth,
} from "../modules/geometry.js";
import { createIcon } from "./icons.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (name, attributes = {}) => {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  return element;
};

/** Render the editable scene using DOM APIs so labels never become HTML. */
export function renderScene(doc, selected, viewport, handlers) {
  const nodes = document.getElementById("nodes");
  const edges = document.getElementById("edges");
  const group = document.getElementById("viewport");
  nodes.replaceChildren();
  edges.replaceChildren();
  group.setAttribute(
    "transform",
    `translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`,
  );

  const byId = new Map(doc.nodes.map((node) => [node.id, node]));
  for (const edge of doc.edges) {
    const source = byId.get(edge.from);
    const target = byId.get(edge.to);
    if (!source || !target) continue;
    const wrapper = svg("g", {
      class: `edge-group${selected === edge.id ? " selected" : ""}`,
      "data-edge": edge.id,
      role: "button",
      tabindex: 0,
      "aria-label": `Conexión de ${source.label} a ${target.label}`,
    });
    const route = edgePath(source, target);
    wrapper.append(svg("path", { d: route, class: "edge" }));
    wrapper.append(svg("path", { d: route, class: "edge-hit" }));
    wrapper.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      handlers.select(edge.id);
    });
    wrapper.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handlers.select(edge.id);
      }
    });
    edges.append(wrapper);
  }

  for (const node of doc.nodes) {
    const meta = catalogById.get(node.type);
    if (!meta) continue;
    const width = nodeWidth(node);
    const height = nodeHeight(node);
    const color = nodeColor(node, meta.color);
    const lines = labelLines(node.label, width);
    const minimal = node.variant === "outline";
    const element = svg("g", {
      class: `node${selected === node.id ? " selected" : ""}${minimal ? " outline" : ""}`,
      transform: `translate(${node.x} ${node.y})`,
      "data-node": node.id,
      role: "button",
      tabindex: 0,
      "aria-label": `${node.label}, ${meta.group}. Flechas para mover; Enter para seleccionar.`,
    });
    element.append(
      svg("rect", { class: "node-body", width, height, rx: minimal ? 7 : 12 }),
    );
    element.append(
      svg("rect", {
        class: "node-icon-bg",
        x: 14,
        y: (height - 48) / 2,
        width: 48,
        height: 48,
        rx: 9,
        fill: color,
        "fill-opacity": minimal ? "0.08" : "0.16",
      }),
    );
    const icon = createIcon(meta.icon, 27);
    icon.setAttribute("x", "24.5");
    icon.setAttribute("y", String((height - 27) / 2));
    icon.setAttribute("color", color);
    element.append(icon);
    const label = svg("text", { class: "node-label", x: 78 });
    const firstY = height / 2 - (lines.length === 2 ? 11 : 4);
    lines.forEach((line, index) => {
      const span = svg("tspan", { x: 78, y: firstY + index * 17 });
      span.textContent = line;
      label.append(span);
    });
    element.append(label);
    const provider = svg("text", {
      class: "node-provider",
      x: 78,
      y: height / 2 + 25,
    });
    provider.textContent = meta.group;
    element.append(provider);
    element.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      handlers.nodeDown(event, node.id);
    });
    element.addEventListener("keydown", (event) =>
      handlers.nodeKey(event, node.id),
    );
    element.addEventListener("contextmenu", (event) =>
      handlers.contextMenu(event, node.id),
    );
    nodes.append(element);
  }
}
