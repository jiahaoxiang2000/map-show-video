# Agent Guidelines for Map Show Video

## Build/Run Commands
- **Run locally**: `python3 -m http.server 8080` or `npx serve`
- **No build step**: Pure static HTML/CSS/JS
- **No tests**: Manual testing via browser DevTools

## Code Style

### JavaScript (main.js)
- Use IIFE pattern with `'use strict'`
- Declare all DOM elements at top of scope with `const`
- Use JSDoc comments (`/** ... */`) for all functions
- Use `const` for immutable values, `let` for mutable state
- camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants
- Arrow functions for callbacks, regular functions for named utilities
- Early returns for guard clauses
- Async/await for promises, with try/catch error handling

### CSS (styles.css)
- Mobile-first approach (base styles, then `@media (min-width: ...)`)
- CSS custom properties in `:root` for theming
- BEM-like naming: `.component-name`, `.component-name__element`, `.component-name--modifier`
- Group related selectors with comments (e.g., `/* Bottom sheet overlay */`)
- Use `transition` for state changes, `animation` with `@keyframes` for complex effects

### HTML (index.html)
- Semantic HTML5 elements
- Use `data-*` attributes for JS hooks
- Include descriptive HTML comments for major sections
- Keep inline styles minimal (use classes)
