import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDocument,
  sampleDocument,
  autoLayout,
} from "../js/modules/document.js";
import { toSvg, toDrawio } from "../js/services/export.js";
import { catalog } from "../js/modules/catalog.js";
import { technologyIcons } from "../js/modules/technology-icons.js";
import { existsSync } from "node:fs";
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  edgePath,
  preferredPorts,
} from "../js/modules/geometry.js";

test("legacy diagrams receive safe geometry and provider defaults", () => {
  const doc = normalizeDocument({
    version: 1,
    title: "Legacy",
    nodes: [{ id: "n1", type: "aws-ec2", label: "EC2", x: 10, y: 20 }],
    edges: [],
  });
  assert.equal(doc.nodes[0].width, DEFAULT_WIDTH);
  assert.equal(doc.nodes[0].height, DEFAULT_HEIGHT);
  assert.equal(doc.nodes[0].color, "#ff9900");
  assert.equal(doc.nodes[0].variant, "card");
});

test("import clamps dimensions and rejects unsafe color input", () => {
  const doc = normalizeDocument({
    version: 1,
    title: "Imported",
    nodes: [
      {
        id: "n1",
        type: "github",
        label: "GitHub",
        x: 0,
        y: 0,
        width: 10000,
        height: -5,
        color: '" onload="alert(1)',
        variant: "outline",
      },
    ],
    edges: [],
  });
  assert.equal(doc.nodes[0].width, 420);
  assert.equal(doc.nodes[0].height, 72);
  assert.equal(doc.nodes[0].color, "#e7e7e7");
  assert.equal(doc.nodes[0].variant, "outline");
});

test("exports preserve customized dimensions and SVG icons", () => {
  const doc = sampleDocument();
  doc.nodes[0].width = 280;
  doc.nodes[0].color = "#b39afa";
  const svg = toSvg(doc);
  const drawio = toDrawio(doc);
  assert.match(svg, /width="280"/);
  assert.match(svg, /stroke="#b39afa"/);
  assert.match(svg, /<path d="/);
  assert.match(svg, /<svg x="23"[^>]*viewBox=/);
  assert.match(drawio, /width="280"/);
  assert.match(drawio, /strokeColor=#b39afa/);
});

test("every catalog entry has a local technology icon and embedded export artwork", () => {
  assert.equal(catalog.length, 33);
  for (const item of catalog) {
    assert.ok(technologyIcons[item.id], `Missing embedded icon: ${item.id}`);
    assert.ok(
      existsSync(new URL(`../public/icons/technologies/${item.id}.svg`, import.meta.url)),
      `Missing local SVG: ${item.id}`,
    );
  }
});

test("layout and connectors account for variable node size", () => {
  const doc = sampleDocument();
  doc.nodes[0].width = 400;
  const arranged = autoLayout(doc);
  assert.ok(arranged.nodes[1].x >= arranged.nodes[0].x + 400);
  assert.match(edgePath(doc.nodes[0], doc.nodes[1]), /^M /);
});

test("four-sided ports persist safely and guide SVG connector anchors", () => {
  const doc = sampleDocument();
  doc.edges[0].fromHandle = "bottom";
  doc.edges[0].toHandle = "top";
  const restored = normalizeDocument(doc);
  assert.equal(restored.edges[0].fromHandle, "bottom");
  assert.equal(restored.edges[0].toHandle, "top");
  assert.equal(preferredPorts(doc.nodes[0], doc.nodes[1]).source, "right");
  const startX = doc.nodes[0].x + doc.nodes[0].width / 2;
  const startY = doc.nodes[0].y + doc.nodes[0].height;
  assert.ok(edgePath(doc.nodes[0], doc.nodes[1], "bottom", "top").startsWith(`M ${startX} ${startY}`));
  assert.match(toSvg(restored), new RegExp(`M ${startX} ${startY} C`));
  doc.edges[0].fromHandle = "javascript:alert(1)";
  assert.equal(normalizeDocument(doc).edges[0].fromHandle, undefined);
});

test("import rejects IDs that collide after length normalization", () => {
  const prefix = "x".repeat(80);
  const doc = normalizeDocument({
    version: 1,
    title: "Collision",
    nodes: [
      { id: `${prefix}a`, type: "github", label: "First", x: 0, y: 0 },
      { id: `${prefix}b`, type: "gitlab", label: "Second", x: 20, y: 20 },
    ],
    edges: [],
  });
  assert.equal(doc.nodes.length, 1);
});
