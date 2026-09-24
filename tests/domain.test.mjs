import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDocument,
  sampleDocument,
  autoLayout,
} from "../js/modules/document.js";
import { toSvg, toDrawio } from "../js/services/export.js";
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  edgePath,
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
  assert.match(drawio, /width="280"/);
  assert.match(drawio, /strokeColor=#b39afa/);
});

test("layout and connectors account for variable node size", () => {
  const doc = sampleDocument();
  doc.nodes[0].width = 400;
  const arranged = autoLayout(doc);
  assert.ok(arranged.nodes[1].x >= arranged.nodes[0].x + 400);
  assert.match(edgePath(doc.nodes[0], doc.nodes[1]), /^M /);
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
