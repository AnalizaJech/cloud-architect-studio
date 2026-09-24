import { catalogById } from "./catalog.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  nodeHeight,
  nodeWidth,
  nodeColor,
} from "./geometry.js";

/** @typedef {{id:string,type:string,label:string,x:number,y:number,width:number,height:number,color:string,variant:"card"|"outline"}} DiagramNode */
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
    .filter((node) => {
      if (!node || !catalogById.has(node.type) || typeof node.id !== "string")
        return false;
      const id = node.id.slice(0, 80);
      if (!id || ids.has(id)) return false;
      ids.add(id);
      return true;
    })
    .map((node) => {
      return {
        id: node.id.slice(0, 80),
        type: node.type,
        label: String(node.label ?? catalogById.get(node.type).label).slice(
          0,
          80,
        ),
        x: coordinate(node.x),
        y: coordinate(node.y),
        width: nodeWidth(node),
        height: nodeHeight(node),
        color: nodeColor(node, catalogById.get(node.type).color),
        variant: node.variant === "outline" ? "outline" : "card",
      };
    });
  const valid = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set();
  const edges = input.edges
    .slice(0, 4000)
    .filter((edge) => {
      if (
        !edge ||
        typeof edge.id !== "string" ||
        !valid.has(edge.from) ||
        !valid.has(edge.to) ||
        edge.from === edge.to
      )
        return false;
      const id = edge.id.slice(0, 80);
      if (!id || edgeIds.has(id) || valid.has(id)) return false;
      edgeIds.add(id);
      return true;
    })
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
  let x = 80;
  for (const level of sorted) {
    const column = levels.get(level);
    let y = 80;
    for (const node of column) {
      positions.set(node.id, { x, y });
      y += nodeHeight(node) + 64;
    }
    x += Math.max(...column.map(nodeWidth)) + 84;
  }
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
    ["github", "GitHub", 80, 100],
    ["argocd", "ArgoCD", 390, 100],
    ["kubernetes", "Kubernetes", 700, 100],
    ["prometheus", "Prometheus", 390, 325],
    ["grafana", "Grafana", 80, 325],
    ["postgresql", "PostgreSQL", 700, 325],
  ].map(([type, label, x, y], i) => ({
    id: `sample-${i}`,
    type,
    label,
    x,
    y,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    color: catalogById.get(type).color,
    variant: "card",
  }));
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
