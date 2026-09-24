const NS = "http://www.w3.org/2000/svg";

/** Original line icon paths, shared by UI, canvas and standalone SVG export. */
export const paths = Object.freeze({
  cursor: "M5 3 19 12 12.4 13.2 9.2 20 5 3Z",
  hand: "M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v5c0 4-2.5 6-6.5 6H12c-2 0-3-1-4-2l-4-4a1.8 1.8 0 0 1 2.6-2.5L8 14",
  connect: "M5 12h5m4 0h5M10 9v6m4-6v6M4 5l3-2 3 2M14 19l3 2 3-2",
  undo: "M9 7 5 11l4 4M5 11h9a5 5 0 0 1 0 10",
  redo: "m15 7 4 4-4 4m4-4h-9a5 5 0 0 0 0 10",
  layout: "M3 4h7v6H3zM14 4h7v6h-7zM3 14h7v6H3zM14 14h7v6h-7z",
  grid: "M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16",
  snap: "M12 3v18M3 12h18M7 7l10 10M17 7 7 17M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  help: "M9 9a3 3 0 1 1 5 2.3c-1.2.9-2 1.4-2 3.2M12 18h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M5 5l14 14M19 5 5 19",
  chevron: "m6 9 6 6 6-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16 16l5 5",
  plus: "M12 4v16M4 12h16",
  minus: "M4 12h16",
  fit: "M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5",
  download: "M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3",
  upload: "M12 18V5m-5 5 5-5 5 5M4 18v3h16v-3",
  filePlus: "M13 3H5v18h14V9l-6-6Zm0 0v6h6M8 15h8m-4-4v8",
  sparkle: "m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z",
  arrowUpRight: "M5 19 19 5M8 5h11v11",
  copy: "M8 8h12v12H8zM4 16V4h12",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v8m4-8v8",
  check: "M4 12l5 5L20 6",
  server: "M4 4h16v7H4zM4 13h16v7H4zM7 7h.01M7 16h.01M11 7h6M11 16h6",
  bucket: "M4 7h16l-2 13H6L4 7ZM7 7V4h10v3M8 12h8",
  function: "M15 3c-4 0-5 3-5 6v10c0 2-1 2-3 2M6 12h12M15 3h2",
  database:
    "M4 6c0-2 3.6-3 8-3s8 1 8 3v12c0 2-3.6 3-8 3s-8-1-8-3V6Zm0 0c0 2 3.6 3 8 3s8-1 8-3M4 12c0 2 3.6 3 8 3s8-1 8-3",
  network: "M12 3v6M4 21v-6h16v6M4 15v-4h16v4M12 9v2M2 21h4M10 21h4M18 21h4",
  storage: "M4 4h16v16H4zM8 4v16M4 9h16M4 15h16",
  analytics: "M4 19V5M4 19h16M8 15l3-4 3 2 5-7M18 6h1v4",
  git: "M7 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 9v6a4 4 0 0 0 4 4h4M17 15V6M14 9l3-3 3 3",
  cluster:
    "M12 2 20 7v10l-8 5-8-5V7l8-5ZM4 7l8 5 8-5M12 12v10M8 5l8 14M16 5 8 19",
  container: "M3 8h18v11H3zM6 5h4v3M12 5h4v3M6 12h2m2 0h2m2 0h2m2 0h2M6 16h12",
  blocks: "M4 4h7v7H4zM13 4h7v7h-7zM8 13h8v7H8z",
  deploy:
    "M4 5h9M13 5l-2-2m2 2-2 2M20 19h-9M11 19l2-2m-2 2 2 2M5 9a7 7 0 0 0 10 10M19 15A7 7 0 0 0 9 5",
  workflow: "M4 5h5v5H4zM15 14h5v5h-5zM9 7h5a4 4 0 0 1 4 4v3M6.5 10v9h8.5",
  portal: "M3 4h18v16H3zM3 9h18M7 14h5M7 17h10",
  stream: "M4 6h4c3 0 3 4 6 4h6M4 12h4c3 0 3 4 6 4h6M4 18h4c3 0 3-4 6-4h6",
  cache:
    "M4 4h16v16H4zM8 8h8v8H8zM2 9h2M2 15h2M20 9h2M20 15h2M9 2v2m6-2v2M9 20v2m6-2v2",
  documentDb: "M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7",
  queue: "M4 6h16M4 12h16M4 18h10M17 15l3 3-3 3M7 4v4M11 10v4",
  chart: "M4 19V5M4 19h16M7 15l4-5 3 2 5-7",
  flame:
    "M12 2c3 4 2 6 0 8 4-1 6 2 6 5a6 6 0 0 1-12 0c0-3 2-5 3-6 0 3 2 4 3 4-1-4-1-7 0-11Z",
  logs: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  traces: "M3 12h4l3-7 4 14 3-7h4",
  telemetry:
    "M12 3v18M3 12h18M6 6l12 12M18 6 6 18M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0",
});

/** Create an inline SVG icon that inherits the surrounding text color. */
export function createIcon(name, size = 18) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", paths[name] ?? paths.blocks);
  svg.append(path);
  return svg;
}

/** Return standalone path markup for image exports. Keys come from the catalog. */
export function iconMarkup(name, x, y, size, color) {
  const path = paths[name] ?? paths.blocks;
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></g>`;
}

/** Replace declarative icon slots after module load without HTML injection. */
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((slot) => {
    slot.replaceChildren(
      createIcon(slot.dataset.icon, Number(slot.dataset.iconSize) || 18),
    );
  });
}
