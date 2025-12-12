# Agent Guidelines for Map Show Video

## Build/Run Commands

- **Run locally**: `python3 -m http.server 8080` or `npx serve`
- **No build step**: Pure static HTML/CSS/JS with Leaflet.js CDN
- **No tests**: Manual testing via browser DevTools

## Architecture

### Map Integration

- **Map Library**: Leaflet.js (v1.9.4) loaded via CDN
- **Map Tiles**: OpenStreetMap tiles (free, no API key required)
- **Location System**: Uses real-world latitude/longitude coordinates
- **Navigation**: Smooth flyTo animations between locations

### Data Structure

Location data in `data/locations.json`:

```json
{
  "mapConfig": {
    "center": [lat, lng],      // Map center coordinates
    "initialZoom": 13,         // Zoom level for overview
    "focusZoom": 16            // Zoom level when focused on location
  },
  "locations": [
    {
      "id": number,
      "title": "中文标题",
      "description": "中文描述",
      "coordinates": {
        "lat": number,         // Latitude (纬度)
        "lng": number          // Longitude (经度)
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
- Leaflet API: Use `L.map()`, `L.marker()`, `L.divIcon()`, `map.flyTo()`

### CSS (styles.css)

- Mobile-first approach (base styles, then `@media (min-width: ...)`)
- CSS custom properties in `:root` for theming
- BEM-like naming: `.component-name`, `.component-name__element`, `.component-name--modifier`
- Group related selectors with comments (e.g., `/* Bottom sheet overlay */`)
- Use `transition` for state changes, `animation` with `@keyframes` for complex effects
- Leaflet overrides: Target `.location-marker` for custom marker styles

### HTML (index.html)

- Semantic HTML5 elements
- Use `data-*` attributes for JS hooks
- Include descriptive HTML comments for major sections
- Keep inline styles minimal (use classes)
- Leaflet CSS and JS loaded from CDN in correct order (CSS in head, JS before main.js)

## Content

- **All user-facing content must be in Chinese**
- Location data in `data/locations.json`: `title` and `description` fields are in Chinese
- Coordinates use standard latitude/longitude format (经纬度)
- HTML page (`index.html`):
  - Language attribute: `lang="zh-CN"`
  - Alt text and fallback messages in Chinese
- All visible UI elements should display Chinese text

## Map Configuration Tips

- Default coordinates use Beijing area as example (39.9042, 116.4074)
- Adjust `mapConfig.center` to your desired map center
- Adjust `mapConfig.initialZoom` (lower = more zoomed out, higher = more zoomed in)
- Adjust `mapConfig.focusZoom` for close-up view of individual locations
- Use tools like latlong.net or OpenStreetMap to find coordinates
