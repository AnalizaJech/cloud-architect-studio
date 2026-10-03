/** Shared node geometry. All coordinates are expressed in logical SVG pixels. */
export const DEFAULT_WIDTH = 210;
export const DEFAULT_HEIGHT = 88;
export const MIN_WIDTH = 160;
export const MAX_WIDTH = 420;
export const MIN_HEIGHT = 72;
export const MAX_HEIGHT = 220;
export const PORTS = ["left", "right", "top", "bottom"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Resolve dimensions for old documents and newly customized nodes. */
export const nodeWidth = (node) =>
  clamp(Number(node.width) || DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH);
export const nodeHeight = (node) =>
  clamp(Number(node.height) || DEFAULT_HEIGHT, MIN_HEIGHT, MAX_HEIGHT);

/** Normalize color safely before it is used in an SVG attribute. */
export function nodeColor(node, fallback) {
  return /^#[0-9a-f]{6}$/i.test(node.color ?? "") ? node.color : fallback;
}

/** Split a label into at most two readable lines for the available node width. */
export function labelLines(label, width) {
  const text = String(label).trim();
  const capacity = Math.max(8, Math.floor((width - 93) / 7.2));
  if (text.length <= capacity) return [text];
  const words = text.split(/\s+/);
  let first = "";
  while (
    words.length &&
    (first ? `${first} ${words[0]}` : words[0]).length <= capacity
  ) {
    first = first ? `${first} ${words.shift()}` : words.shift();
  }
  if (!first) first = text.slice(0, capacity);
  const rest = text.slice(first.length).trim();
  if (!rest) return [first];
  return [
    first,
    rest.length > capacity ? `${rest.slice(0, capacity - 1)}…` : rest,
  ];
}

/** Choose the nearest cardinal ports for diagrams saved before explicit ports existed. */
export function preferredPorts(source, target) {
  const ax = source.x + nodeWidth(source) / 2;
  const ay = source.y + nodeHeight(source) / 2;
  const bx = target.x + nodeWidth(target) / 2;
  const by = target.y + nodeHeight(target) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { source: "right", target: "left" }
      : { source: "left", target: "right" };
  }
  return dy >= 0
    ? { source: "bottom", target: "top" }
    : { source: "top", target: "bottom" };
}

/** Return the contact point and outward direction of a cardinal port. */
function portAnchor(node, port) {
  const x = node.x + nodeWidth(node) / 2;
  const y = node.y + nodeHeight(node) / 2;
  if (port === "left") return { x: node.x, y, dx: -1, dy: 0 };
  if (port === "right") return { x: node.x + nodeWidth(node), y, dx: 1, dy: 0 };
  if (port === "top") return { x, y: node.y, dx: 0, dy: -1 };
  return { x, y: node.y + nodeHeight(node), dx: 0, dy: 1 };
}

/** Route a vector connector through chosen ports, retaining legacy auto-routing. */
export function edgePath(source, target, sourcePort, targetPort) {
  const preferred = preferredPorts(source, target);
  const from = portAnchor(source, PORTS.includes(sourcePort) ? sourcePort : preferred.source);
  const to = portAnchor(target, PORTS.includes(targetPort) ? targetPort : preferred.target);
  const bend = Math.max(36, Math.hypot(to.x - from.x, to.y - from.y) * 0.4);
  return `M ${from.x} ${from.y} C ${from.x + from.dx * bend} ${from.y + from.dy * bend}, ${to.x + to.dx * bend} ${to.y + to.dy * bend}, ${to.x} ${to.y}`;
}
