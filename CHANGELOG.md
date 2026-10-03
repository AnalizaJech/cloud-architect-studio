# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [2.0.0] - Unreleased

### Changed

- Migrated the interface and diagram canvas to React, TypeScript, Vite and React Flow.
- Redesigned the workbench, library, inspector and controls with a responsive visual system.
- Added a GitHub Actions build for static GitHub Pages deployment and generated offline PWA assets.
- Preserved the version 1 diagram format, existing browser storage and all seven export options.
- Added 33 locally hosted technology SVGs to the library, nodes and self-contained image exports.
- Removed the React Flow attribution widget from the canvas and documented its use in the README.
- Deferred the export engine until requested and removed an empty minimap.
- Enabled connections directly from selection mode, added four larger connection targets per node, and made the in-progress line visible.
- Persisted chosen connector sides while keeping older diagram files compatible.

## [1.1.0] - 2026-09-24

### Fixed

- Restored clicks on the sample button and zoom controls by excluding canvas overlays from pointer capture.
- Improved service worker navigation freshness for subsequent GitHub Pages releases.

### Added

- Original SVG pictograms throughout the editor and standalone SVG exports.
- Larger nodes with wrapped labels, provider context and variable-size connectors.
- Inspector controls for node dimensions, accent colors, outline style and duplication.
- Readable initial view on narrow screens; all document actions remain available on mobile.

## [1.0.0] - 2026-09-24

### Added

- Static cloud diagram editor with 33 provider and platform components.
- Drag and drop, click to place, connections, inspector, auto layout, grid, snap, pan, zoom and keyboard shortcuts.
- Undo/redo, IndexedDB autosave, JSON import and seven export options.
- Offline PWA shell, responsive dark interface and project documentation.
