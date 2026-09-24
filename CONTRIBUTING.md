# Contributing

Thanks for improving Cloud Architect Studio.

1. Open an issue describing the change and the user benefit.
2. Fork the repository and create a focused branch.
3. Keep domain operations independent of the DOM. Add or update JSDoc for public functions.
4. Test desktop and 360px mobile layout, keyboard use, import/export, and offline behavior.
5. Open a pull request with screenshots for visual changes and clear reproduction steps for bug fixes.

The app has no mandatory build step. Use a local static server such as `python -m http.server 8000` for testing. Please keep new dependencies exceptional and justify them in the pull request.
