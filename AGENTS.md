# Agent Guidelines for Map Show Video

## Build/Run Commands

- **Run locally**: `python3 -m http.server 8080` or `npx serve`
- **No build step**: Pure static HTML/CSS/JS
- **No tests**: Manual testing via browser DevTools

## Architecture

### Map Integration

- **Map Type**: Custom background image map (no external map library)
- **Background Image**: Custom image from `assets/background.png`
- **Location System**: Uses percentage-based positioning (x%, y%) on the background image
- **Navigation**: Click markers to view location details

### Data Structure

Location data in `data/locations.json`:

```json
{
  "mapConfig": {
    "backgroundImage": "assets/background.png",  // Path to background image
    "imageWidth": 3840,                          // Original image width (4K)
    "imageHeight": 2160                          // Original image height (4K)
  },
  "locations": [
    {
      "id": number,
      "title": "中文标题",
      "description": "中文描述",
      "position": {
        "x": number,           // Horizontal position (0-100%)
        "y": number            // Vertical position (0-100%)
      },
      "video": "url"
    }
  ]
}
```

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
- DOM manipulation: Use `createElement()`, `appendChild()`, `addEventListener()`
- Create markers and SVG paths dynamically based on location data

### CSS (styles.css)

- Mobile-first approach (base styles, then `@media (min-width: ...)`)
- CSS custom properties in `:root` for theming
- BEM-like naming: `.component-name`, `.component-name__element`, `.component-name--modifier`
- Group related selectors with comments (e.g., `/* Bottom sheet overlay */`)
- Use `transition` for state changes, `animation` with `@keyframes` for complex effects
- Custom marker styles: Target `.location-marker` for positioning and appearance
- Background image: Use `background-size: cover` and `background-position: center`

### HTML (index.html)

- Semantic HTML5 elements
- Use `data-*` attributes for JS hooks
- Include descriptive HTML comments for major sections
- Keep inline styles minimal (use classes)
- No external map libraries - pure vanilla JavaScript implementation

## Content

- **All user-facing content must be in Chinese**
- Location data in `data/locations.json`: `title` and `description` fields are in Chinese
- Coordinates use standard latitude/longitude format (经纬度)
- HTML page (`index.html`):
  - Language attribute: `lang="zh-CN"`
  - Alt text and fallback messages in Chinese
- All visible UI elements should display Chinese text

## Map Configuration Tips

- Use percentage-based positioning (0-100) for x and y coordinates
- `position.x`: Horizontal position (0% = left edge, 100% = right edge)
- `position.y`: Vertical position (0% = top edge, 100% = bottom edge)
- Markers are automatically centered on their position coordinates
- Background image should be placed in `assets/` folder
- Update `mapConfig.backgroundImage` path if using a different image
- Original image dimensions in `mapConfig` are used for reference only
