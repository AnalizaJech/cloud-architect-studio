# Contributing

Thanks for improving Cloud Architect Studio.

1. Open an issue describing the change and the user benefit.
2. Fork the repository and create a focused branch.
3. Keep domain operations independent of the DOM. Add or update JSDoc for public functions.
4. Test desktop and 360px mobile layout, keyboard use, import/export, and offline behavior.
5. Open a pull request with screenshots for visual changes and clear reproduction steps for bug fixes.

Run `npm ci`, `npm run dev`, `npm test` and `npm run build` before opening a pull request. GitHub Pages serves only the generated `dist/` files; Node is needed for development and CI, not in the browser. Keep the v1 document format compatible with existing saved diagrams. Justify new dependencies in the pull request.
