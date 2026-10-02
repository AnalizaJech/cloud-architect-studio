import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "public/icons/technologies");
const icons = {};
for (const name of readdirSync(directory).filter((file) => file.endsWith(".svg"))) {
  const xml = readFileSync(path.join(directory, name), "utf8").trim();
  const rootTag = xml.match(/<svg\b([^>]*)>/i);
  const viewBox = rootTag?.[1].match(/viewBox="([^"]+)"/i)?.[1];
  if (!rootTag || !viewBox || /<script\b|<foreignObject\b|\bon\w+\s*=|(?:https?:)?\/\//i.test(xml.replace(/xmlns(?::\w+)?="[^"]+"/g, ""))) {
    throw new Error(`Unsafe or incomplete icon: ${name}`);
  }
  const body = xml.slice(rootTag.index + rootTag[0].length, xml.lastIndexOf("</svg>"));
  icons[name.slice(0, -4)] = { viewBox, body };
}
writeFileSync(
  path.join(root, "js/modules/technology-icons.js"),
  `// Generated from vetted local SVG artwork. See docs/ICONS.md.\nexport const technologyIcons = ${JSON.stringify(icons)};\n`,
);
console.log(`Embedded ${Object.keys(icons).length} SVG icons for offline exports.`);
