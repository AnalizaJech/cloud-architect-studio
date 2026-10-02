import { catalogById } from "../js/modules/catalog.js";
import {
  createDocument,
  normalizeDocument,
  sampleDocument,
  autoLayout,
  createId,
} from "../js/modules/document.js";
import { loadDocument, saveDocument } from "../js/services/storage.js";
import { paths } from "../js/components/icons.js";

/** Stable on-disk format shared with the original editor. */
export type DiagramNode = {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  variant: "card" | "outline";
};
export type DiagramEdge = { id: string; from: string; to: string };
export type DiagramDocument = {
  version: 1;
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};
export type CatalogItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  group: string;
};
export {
  catalogById,
  createId,
  paths,
  loadDocument,
  saveDocument,
};
/** Load the heavier, self-contained export engine only on demand. */
export async function exportDocument(doc: DiagramDocument, format: string) {
  const service = await import("../js/services/export.js");
  return service.exportDocument(doc, format);
}
export const emptyDocument = (): DiagramDocument =>
  createDocument() as DiagramDocument;
export const exampleDocument = (): DiagramDocument =>
  sampleDocument() as DiagramDocument;
export const arrangeDocument = (doc: DiagramDocument): DiagramDocument =>
  autoLayout(doc) as DiagramDocument;
export const safeDocument = (value: unknown): DiagramDocument =>
  normalizeDocument(value) as DiagramDocument;
