import { catalogById } from "../modules/catalog.js";
import {
  edgePath,
  labelLines,
  nodeColor,
  nodeHeight,
  nodeWidth,
} from "../modules/geometry.js";
import { technologyIcons } from "../modules/technology-icons.js";
import { escapeXml, download } from "../utils/escape.js";

/** Bounds shared by raster and vector output. */
function bounds(nodes) {
  if (!nodes.length) return { x: 0, y: 0, width: 800, height: 480 };
  const minX = Math.min(...nodes.map((n) => n.x)) - 50,
    minY = Math.min(...nodes.map((n) => n.y)) - 50;
  return {
    x: minX,
    y: minY,
    width: Math.max(
      400,
      Math.max(...nodes.map((n) => n.x + nodeWidth(n))) + 50 - minX,
    ),
    height: Math.max(
      260,
      Math.max(...nodes.map((n) => n.y + nodeHeight(n))) + 50 - minY,
    ),
  };
}
/** Produce a standalone SVG with no external resources. */
function technologyMarkup(type, index, x, y, size) {
  const icon = technologyIcons[type];
  if (!icon) return "";
  const prefix = `technology-${index}-`;
  const body = icon.body
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`)
    .replace(/\bhref="#([^"]+)"/g, (_, id) => `href="#${prefix}${id}"`);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${icon.viewBox}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

export function toSvg(doc) {
  const b = bounds(doc.nodes),
    byId = new Map(doc.nodes.map((n) => [n.id, n]));
  const edges = doc.edges
    .map((e) => {
      const source = byId.get(e.from),
        target = byId.get(e.to);
      if (!source || !target) return "";
      return `<path d="${edgePath(source, target, e.fromHandle, e.toHandle)}" fill="none" stroke="#91a1ad" stroke-width="2" marker-end="url(#arrow)"/>`;
    })
    .join("");
  const nodes = doc.nodes
    .map((n, index) => {
      const meta = catalogById.get(n.type);
      if (!meta) return "";
      const width = nodeWidth(n),
        height = nodeHeight(n);
      const color = nodeColor(n, meta.color);
      const lines = labelLines(n.label, width);
      const firstY = height / 2 - (lines.length === 2 ? 11 : 4);
      const label = lines
        .map(
          (line, index) =>
            `<tspan x="78" y="${firstY + index * 17}">${escapeXml(line)}</tspan>`,
        )
        .join("");
      const fill = n.variant === "outline" ? "#171e25" : "#202b34";
      const dash = n.variant === "outline" ? ' stroke-dasharray="5 3"' : "";
      const iconBackground = ["port", "github", "kafka"].includes(n.type) ? "#f3f6f7" : color;
      return `<g transform="translate(${n.x} ${n.y})"><rect width="${width}" height="${height}" rx="${n.variant === "outline" ? 7 : 12}" fill="${fill}" stroke="${color}" stroke-width="1.5"${dash}/><rect x="14" y="${(height - 48) / 2}" width="48" height="48" rx="9" fill="${iconBackground}" fill-opacity="${iconBackground === color ? ".16" : "1"}"/>${technologyMarkup(n.type, index, 23, (height - 30) / 2, 30)}<text x="78" fill="#f2f4f0" font-size="14" font-weight="600" font-family="sans-serif">${label}</text><text x="78" y="${height / 2 + 25}" fill="#91a0ac" font-size="10" font-family="sans-serif">${escapeXml(meta.group)}</text></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(b.width)}" height="${Math.ceil(b.height)}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#91a1ad"/></marker></defs><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="#11161d"/>${edges}${nodes}</svg>`;
}
/** Convert graph to Mermaid flowchart source. */
export function toMermaid(doc) {
  const ids = new Map(doc.nodes.map((n, i) => [n.id, `n${i}`]));
  return (
    [
      "flowchart LR",
      ...doc.nodes.map(
        (n) =>
          `  ${ids.get(n.id)}["${n.label.replace(/["\\\n\r]/g, " ").slice(0, 80)}"]`,
      ),
      ...doc.edges.map((e) => `  ${ids.get(e.from)} --> ${ids.get(e.to)}`),
    ].join("\n") + "\n"
  );
}
/** Convert graph to PlantUML component diagram source. */
export function toPlantUml(doc) {
  const ids = new Map(doc.nodes.map((n, i) => [n.id, `n${i}`]));
  return (
    [
      "@startuml",
      "left to right direction",
      "skinparam backgroundColor #ffffff",
      ...doc.nodes.map(
        (n) =>
          `component "${n.label.replace(/["\n\r]/g, " ").slice(0, 80)}" as ${ids.get(n.id)}`,
      ),
      ...doc.edges.map((e) => `${ids.get(e.from)} --> ${ids.get(e.to)}`),
      "@enduml",
    ].join("\n") + "\n"
  );
}
/** Export importable uncompressed mxGraphModel XML. */
export function toDrawio(doc) {
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="Cloud Architect Studio"><diagram name="${escapeXml(doc.title)}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${doc.nodes.map((n) => `<mxCell id="${escapeXml(n.id)}" value="${escapeXml(n.label)}" style="rounded=${n.variant === "outline" ? 0 : 1};whiteSpace=wrap;html=0;fillColor=#202a34;fontColor=#ffffff;strokeColor=${nodeColor(n, catalogById.get(n.type)?.color ?? "#52606b")};" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${nodeWidth(n)}" height="${nodeHeight(n)}" as="geometry"/></mxCell>`).join("")}${doc.edges
    .filter((e) => byId.has(e.from) && byId.has(e.to))
    .map(
      (e) =>
        `<mxCell id="${escapeXml(e.id)}" edge="1" parent="1" source="${escapeXml(e.from)}" target="${escapeXml(e.to)}" style="endArrow=classic;"><mxGeometry relative="1" as="geometry"/></mxCell>`,
    )
    .join("")}</root></mxGraphModel></diagram></mxfile>`;
}
/** Route requested export. PDF uses the native print dialog to retain vector quality. */
export async function exportDocument(doc, format) {
  const name = (
    doc.title
      .trim()
      .replace(/[^\p{L}\p{N}-]+/gu, "-")
      .replace(/^-|-$/g, "") || "diagram"
  ).toLowerCase();
  if (format === "json")
    return download(
      JSON.stringify(doc, null, 2),
      `${name}.json`,
      "application/json",
    );
  if (format === "svg")
    return download(toSvg(doc), `${name}.svg`, "image/svg+xml");
  if (format === "mermaid")
    return download(toMermaid(doc), `${name}.mmd`, "text/plain");
  if (format === "plantuml")
    return download(toPlantUml(doc), `${name}.puml`, "text/plain");
  if (format === "drawio")
    return download(toDrawio(doc), `${name}.drawio`, "application/xml");
  const svg = toSvg(doc);
  if (format === "png") {
    const image = new Image(),
      url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth * 2;
      canvas.height = image.naturalHeight * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      ctx.drawImage(image, 0, 0);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      download(blob, `${name}.png`, "image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  if (format === "pdf") {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.setAttribute("title", "Vista de impresión del diagrama");
    document.body.append(frame);
    const printDoc = frame.contentDocument;
    printDoc.open();
    printDoc.write(
      `<!doctype html><html><head><title>${escapeXml(doc.title)}</title><style>@page{size:landscape;margin:8mm}body{margin:0}svg{max-width:100%;max-height:95vh}</style></head><body>${svg}</body></html>`,
    );
    printDoc.close();
    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 60000);
    }, 200);
  }
}
