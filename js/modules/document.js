import { catalogById } from "./catalog.js";

/** @typedef {{id:string,type:string,label:string,x:number,y:number}} DiagramNode */
/** @typedef {{id:string,from:string,to:string}} DiagramEdge */
/** @typedef {{version:1,title:string,nodes:DiagramNode[],edges:DiagramEdge[]}} DiagramDocument */

/** Create an empty versioned diagram. */
export const createDocument = () => ({
  version: 1,
  title: "Arquitectura sin título",
  nodes: [],
  edges: [],
});
/** Generate a collision-resistant ID for local objects. */
export const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
/** Clamp a numeric coordinate to a safe drawing range. */
const coordinate = (value) =>
  Math.max(
    -100000,
    Math.min(100000, Number.isFinite(Number(value)) ? Number(value) : 0),
  );

/** Validate and normalize untrusted JSON before it reaches state. */
export function normalizeDocument(input) {
  if (
    !input ||
    typeof input !== "object" ||
    input.version !== 1 ||
    !Array.isArray(input.nodes) ||
    !Array.isArray(input.edges)
  )
    throw new Error("Formato de diagrama no compatible");
  const ids = new Set();
  const nodes = input.nodes
    .slice(0, 2000)
    .filter(
      (node) =>
        node &&
        catalogById.has(node.type) &&
        typeof node.id === "string" &&
        !ids.has(node.id),
    )
    .map((node) => {
      ids.add(node.id);
      return {
        id: node.id.slice(0, 80),
        type: node.type,
        label: String(node.label ?? catalogById.get(node.type).label).slice(
          0,
          80,
        ),
        x: coordinate(node.x),
        y: coordinate(node.y),
      };
    });
  const valid = new Set(nodes.map((node) => node.id));
  const edges = input.edges
    .slice(0, 4000)
    .filter(
      (edge) =>
        edge &&
        typeof edge.id === "string" &&
        valid.has(edge.from) &&
        valid.has(edge.to) &&
        edge.from !== edge.to,
    )
    .map((edge) => ({
      id: edge.id.slice(0, 80),
      from: edge.from,
      to: edge.to,
    }));
  return {
    version: 1,
    title: String(input.title ?? "Arquitectura sin título").slice(0, 80),
    nodes,
    edges,
  };
}

/** Arrange nodes by graph depth, with stable fallback for cycles. */
export function autoLayout(document) {
  const depth = new Map(document.nodes.map((node) => [node.id, 0]));
  for (let i = 0; i < document.nodes.length; i++) {
    let changed = false;
    for (const edge of document.edges) {
      const next = Math.min(document.nodes.length, depth.get(edge.from) + 1);
      if (next > depth.get(edge.to)) {
        depth.set(edge.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const levels = new Map();
  for (const node of document.nodes) {
    const level = depth.get(node.id);
    if (!levels.has(level)) levels.set(level, []);
    levels.get(level).push(node);
  }
  const sorted = [...levels.keys()].sort((a, b) => a - b);
  const positions = new Map();
  sorted.forEach((level, column) =>
    levels
      .get(level)
      .forEach((node, row) =>
        positions.set(node.id, { x: 80 + column * 230, y: 80 + row * 120 }),
      ),
  );
  return {
    ...document,
    nodes: document.nodes.map((node) => ({
      ...node,
      ...positions.get(node.id),
    })),
  };
}

/** An editable sample diagram for first use. */
export function sampleDocument() {
  const nodes = [
    ["github", "GitHub", 80, 180],
    ["argocd", "ArgoCD", 320, 180],
    ["kubernetes", "Kubernetes", 560, 180],
    ["prometheus", "Prometheus", 800, 100],
    ["grafana", "Grafana", 1040, 100],
    ["postgresql", "PostgreSQL", 800, 300],
  ].map(([type, label, x, y], i) => ({ id: `sample-${i}`, type, label, x, y }));
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [2, 5],
  ].map(([from, to], i) => ({
    id: `edge-${i}`,
    from: `sample-${from}`,
    to: `sample-${to}`,
  }));
  return { version: 1, title: "Plataforma cloud", nodes, edges };
}
