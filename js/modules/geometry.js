/** Shared node geometry. All coordinates are expressed in logical SVG pixels. */
export const DEFAULT_WIDTH = 210;
export const DEFAULT_HEIGHT = 88;
export const MIN_WIDTH = 160;
export const MAX_WIDTH = 420;
export const MIN_HEIGHT = 72;
export const MAX_HEIGHT = 220;

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

/** Route a smooth connector between the nearest sides of two variable-size nodes. */
export function edgePath(source, target) {
  const ax = source.x + nodeWidth(source) / 2;
  const ay = source.y + nodeHeight(source) / 2;
  const bx = target.x + nodeWidth(target) / 2;
  const by = target.y + nodeHeight(target) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sign = Math.sign(dx) || 1;
    const x1 = ax + (sign * nodeWidth(source)) / 2;
    const x2 = bx - (sign * nodeWidth(target)) / 2;
    const bend = Math.max(36, Math.abs(x2 - x1) * 0.45);
    return `M ${x1} ${ay} C ${x1 + sign * bend} ${ay}, ${x2 - sign * bend} ${by}, ${x2} ${by}`;
  }
  const sign = Math.sign(dy) || 1;
  const y1 = ay + (sign * nodeHeight(source)) / 2;
  const y2 = by - (sign * nodeHeight(target)) / 2;
  const bend = Math.max(36, Math.abs(y2 - y1) * 0.45);
  return `M ${ax} ${y1} C ${ax} ${y1 + sign * bend}, ${bx} ${y2 - sign * bend}, ${bx} ${y2}`;
}
