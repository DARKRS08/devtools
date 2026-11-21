# DARK DEVTOOLS — project notes

## Design tokens

Theme values live in `src/styles/tokens.css`. Keep the palette dark-first, purple accent restrained, spacing aligned to the 4/8px rhythm, and corners within the 6/8/12px scale. Use system font fallbacks; do not add external font or analytics requests.

## Folder rules

- `src/data/tools.ts` is the source of truth for tool titles, route slugs, descriptions, categories and related links.
- Keep category counts derived from the registry instead of duplicating totals.
- Keep reusable UI in `src/components`, hook state in `src/hooks`, and pure transformations in `src/tools/engine.ts` or `src/utils`.
- Isolate expensive or potentially blocking user input processing in a worker.
- Tool inputs/generated secrets are component state only. Never add them to localStorage, URLs, logs or telemetry.
- Markdown HTML must be DOMPurify-sanitized before preview; the HTML Playground must remain in a `sandbox="allow-scripts"` iframe without `allow-same-origin`.

## Add-tool checklist

1. Add a complete registry entry and valid related IDs.
2. Add a processing case and user-friendly invalid-input behavior.
3. Add controls and an example to the shared workspace.
4. Add unit tests for success cases and meaningful edge cases.
5. Verify copy, reset, keyboard use, narrow layout, and no console errors.
6. Run typecheck, lint, tests and production build.
7. Update `PROGRESS.md`; do not mark a tool tested until it was actually tested.

## Accessibility and QA checklist

- Use labels, keyboard-operable controls, visible focus, semantic headings and role-alert errors.
- Do not use color as the only status indicator; honor reduced-motion preferences.
- Test direct route loads, empty/invalid values, generated output, copy feedback, favorites storage fallback, 360px width and browser console.
- Keep claims and privacy copy tied to actual behavior. Do not deploy without explicit authorization.
