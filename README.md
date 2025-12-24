# Map show video

A static web application that displays an interactive map with location markers. Users can click markers to view video content associated with each location.

## Features

- Custom background image map (no external map library)
- Percentage-based marker positioning
- Chinese language interface
- Pure HTML/CSS/JavaScript (no build step)
- Video display per location
- Mobile-first responsive design

## Getting Started

Run locally:
```bash
python3 -m http.server 8080
# or
npx serve
```

Open your browser to `http://localhost:8080`

## Project Structure

```
assets/          # Static assets (background image, icons)
data/            # Location data (locations.json)
index.html       # Main HTML page
main.js          # Core JavaScript logic
styles.css       # Styles
```

## Data Format

Location data is stored in `data/locations.json` with percentage-based coordinates for marker positioning on the background image.
