# Architecture — Cloud Architect Studio

## Scope and constraints

Cloud Architect Studio is a static, client-only application. `index.html` is the entry point and every asset is served by a relative URL so the same build works at a GitHub Pages project path. No build step or server API is required.

## Layers

1. **Domain (`js/modules/`)** — diagram schema, catalog and graph operations. Data is plain JSON and has no DOM dependency.
2. **Application (`js/services/`)** — commands/history, persistence and export adapters. Export formats consume the same document snapshot.
3. **Presentation (`js/components/`, `js/hooks/`, `js/app.js`)** — DOM rendering, pointer/keyboard interactions, dialogs and notifications.
4. **Platform (`js/utils/`)** — escaping, IDs, downloads and feature detection.

Dependency direction: presentation → application → domain. The domain never imports presentation or browser storage.

## Document contract

```json
{
  "version": 1,
  "title": "Untitled architecture",
  "nodes": [
    { "id": "n1", "type": "aws-ec2", "label": "EC2", "x": 120, "y": 80 }
  ],
  "edges": [{ "id": "e1", "from": "n1", "to": "n2" }]
}
```

Coordinates are logical pixels. The viewport transform is independent of document data. History stores bounded JSON snapshots for predictable undo/redo. Import validates the document shape and filters unsupported node types and dangling edges.

## Rendering and interaction

The canvas uses one SVG scene for nodes, edges and grid. Pointer events translate screen coordinates into logical coordinates. The palette uses native drag and drop on desktop and click-to-place on touch or keyboard. Node dragging commits one history entry on release. Connection mode links two selected nodes. Auto layout uses layered graph placement with a cycle fallback.

## Persistence and offline

Autosave writes to IndexedDB, falling back to localStorage when IndexedDB is unavailable. The service worker precaches the app shell and serves cached resources offline. A service worker requires HTTPS or localhost, which GitHub Pages provides.

## Export boundaries

SVG is the canonical visual export. PNG rasterizes that SVG. PDF uses the browser print dialog with an SVG print sheet. Draw.io, Mermaid and PlantUML are generated from the graph model. Text exports prioritize round-trip readability; Draw.io exports valid `mxGraphModel` XML.

## Security and accessibility

All user text is inserted with DOM `textContent` or escaped in serialized XML/text formats. No HTML from documents is evaluated. A restrictive CSP allows only same-origin scripts/styles. Controls expose labels, focus states and keyboard operations. Motion is reduced when requested.

## Performance target

The dependency-free app aims for Lighthouse ≥95 on a production GitHub Pages deployment. This is a target, not a measured result; test with the published URL because local Lighthouse scores vary by device and network.
