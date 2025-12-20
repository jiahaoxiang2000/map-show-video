/**
 * Map Explorer - Click-based navigation with custom background image
 */

(function () {
  "use strict";

  // DOM Elements
  const infoOverlay = document.querySelector(".info-overlay");
  const videoPlayer = document.querySelector(".video-player");
  const mapElement = document.getElementById("map");
  const roadSvg = document.getElementById("road-svg");

  // State
  let mapConfig = {};
  let locations = [];
  let markers = [];
  let currentLocationIndex = -1; // -1 = no location selected
  let backgroundBounds = { left: 0, top: 0, width: 0, height: 0 };
  let roadPaths = [];

  /**
   * Set viewport height CSS variable for mobile browsers
   * Fixes issues with dynamic address bars on iOS/Android
   */
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * Get the appropriate background image based on screen orientation
   */
  function getBackgroundImageByOrientation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Landscape mode (wider than tall) - use horizontal background
    if (width > height) {
      return mapConfig.backgroundImageHorizontal;
    }
    // Portrait mode (taller than wide) - use vertical background
    else {
      return mapConfig.backgroundImageVertical;
    }
  }

  /**
   * Update background image based on current orientation
   */
  function updateBackgroundImage() {
    const bgImage = getBackgroundImageByOrientation();
    mapElement.style.backgroundImage = `url('${bgImage}')`;
  }

  /**
   * Initialize custom background map
   */
  function initMap() {
    // Set initial background image based on orientation
    updateBackgroundImage();
    
    // Set initial viewport height
    setViewportHeight();
    
    // Calculate background bounds on load and resize
    calculateBackgroundBounds();
    
    // Handle resize and orientation change
    window.addEventListener('resize', () => {
      setViewportHeight();
      updateBackgroundImage();
      calculateBackgroundBounds();
      updateMarkerPositions();
      updateRoadPaths();
    });
    
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        setViewportHeight();
        updateBackgroundImage();
        calculateBackgroundBounds();
        updateMarkerPositions();
        updateRoadPaths();
      }, 200);
    });
  }

  /**
   * Calculate the actual bounds of the background image
   * when using background-size: contain
   */
  function calculateBackgroundBounds() {
    const containerWidth = mapElement.offsetWidth;
    const containerHeight = mapElement.offsetHeight;
    const containerAspect = containerWidth / containerHeight;
    const imageAspect = mapConfig.imageWidth / mapConfig.imageHeight;

    let bgWidth, bgHeight, bgLeft, bgTop;

    if (containerAspect > imageAspect) {
      // Container is wider than image - fit to height
      bgHeight = containerHeight;
      bgWidth = bgHeight * imageAspect;
      bgLeft = (containerWidth - bgWidth) / 2;
      bgTop = 0;
    } else {
      // Container is taller than image - fit to width
      bgWidth = containerWidth;
      bgHeight = bgWidth / imageAspect;
      bgLeft = 0;
      bgTop = (containerHeight - bgHeight) / 2;
    }

    backgroundBounds = {
      left: bgLeft,
      top: bgTop,
      width: bgWidth,
      height: bgHeight
    };
  }

  /**
   * Get position for current orientation
   */
  function getPositionForOrientation(location) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Landscape mode - use horizontal position
    if (width > height) {
      return location.positionHorizontal;
    }
    // Portrait mode - use vertical position
    else {
      return location.positionVertical;
    }
  }

  /**
   * Convert percentage position to actual pixel position
   */
  function getActualPosition(percentX, percentY) {
    return {
      x: backgroundBounds.left + (percentX / 100) * backgroundBounds.width,
      y: backgroundBounds.top + (percentY / 100) * backgroundBounds.height
    };
  }

  /**
   * Load location data from JSON
   */
  async function loadLocations() {
    try {
      const response = await fetch("data/locations.json");
      const data = await response.json();
      mapConfig = data.mapConfig;
      locations = data.locations;
      initMap();
      initSvgFilters();
      createMarkers();
      createRoadPaths();
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  }

  /**
   * Create marker elements for each location
   */
  function createMarkers() {
    locations.forEach((location, index) => {
      const marker = document.createElement("div");
      marker.classList.add("location-marker");
      marker.dataset.index = index;
      
      // Create icon image
      const markerIcon = document.createElement("img");
      markerIcon.classList.add("marker-icon");
      markerIcon.src = location.icon;
      markerIcon.alt = location.title;
      marker.appendChild(markerIcon);
      
      // Add click handler
      marker.addEventListener("click", () => {
        showLocationDetails(index);
      });
      
      mapElement.appendChild(marker);
      markers.push(marker);
    });
    
    updateMarkerPositions();
  }

  /**
   * Update marker positions based on current background bounds
   */
  function updateMarkerPositions() {
    markers.forEach((marker, index) => {
      const location = locations[index];
      const position = getPositionForOrientation(location);
      const pos = getActualPosition(position.x, position.y);
      marker.style.left = `${pos.x}px`;
      marker.style.top = `${pos.y}px`;
    });
  }

  /**
   * Create artistic red road paths between markers
   * Uses watercolor-style curves with subtle variation
   */
  function createRoadPaths() {
    if (locations.length < 2) return;

    // Clear existing paths
    roadSvg.innerHTML = '';
    roadPaths = [];

    // Get all marker positions
    const positions = markers.map((marker, index) => {
      const location = locations[index];
      const position = getPositionForOrientation(location);
      return getActualPosition(position.x, position.y);
    });

    // Create artistic path connecting all markers in order
    for (let i = 0; i < positions.length - 1; i++) {
      const start = positions[i];
      const end = positions[i + 1];

      // Calculate mid point for curve
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Add organic curve with slight variation
      // Use perpendicular offset for natural river-like flow
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Perpendicular vector for curve
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // Curve offset based on distance (more distance = more curve)
      const curveStrength = Math.min(distance * 0.15, 80);
      const variation = (Math.random() - 0.5) * 20; // Random variation for organic feel
      
      const controlX = midX + perpX * (curveStrength + variation);
      const controlY = midY + perpY * (curveStrength + variation);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const pathData = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
      
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", "#E07856");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("opacity", "0.8");
      path.setAttribute("filter", "url(#road-shadow)");
      
      roadSvg.appendChild(path);
      roadPaths.push(path);
    }

    // Update SVG size to match map
    updateRoadSvgSize();
  }

  /**
   * Update road paths when positions change
   */
  function updateRoadPaths() {
    if (roadPaths.length === 0) {
      createRoadPaths();
      return;
    }

    const positions = markers.map((marker, index) => {
      const location = locations[index];
      const position = getPositionForOrientation(location);
      return getActualPosition(position.x, position.y);
    });

    roadPaths.forEach((path, index) => {
      const start = positions[index];
      const end = positions[index + 1];

      // Recalculate artistic curve
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      const curveStrength = Math.min(distance * 0.15, 80);
      const variation = (Math.random() - 0.5) * 20;
      
      const controlX = start.x + dx / 2 + perpX * (curveStrength + variation);
      const controlY = start.y + dy / 2 + perpY * (curveStrength + variation);

      const pathData = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
      path.setAttribute("d", pathData);
    });

    updateRoadSvgSize();
  }

  /**
   * Update SVG dimensions to match map container
   */
  function updateRoadSvgSize() {
    const containerWidth = mapElement.offsetWidth;
    const containerHeight = mapElement.offsetHeight;
    
    roadSvg.setAttribute("width", containerWidth);
    roadSvg.setAttribute("height", containerHeight);
    roadSvg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
  }

  /**
   * Initialize SVG filters for watercolor-style effects
   */
  function initSvgFilters() {
    // Clear existing defs
    const existingDefs = roadSvg.querySelector('defs');
    if (existingDefs) {
      existingDefs.remove();
    }

    // Create defs with filters
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Shadow filter for subtle depth
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "road-shadow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    
    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("in", "SourceAlpha");
    feGaussianBlur.setAttribute("stdDeviation", "2");
    feGaussianBlur.setAttribute("result", "blur");
    
    const feOffset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
    feOffset.setAttribute("in", "blur");
    feOffset.setAttribute("dx", "0");
    feOffset.setAttribute("dy", "2");
    feOffset.setAttribute("result", "offsetBlur");
    
    const feFlood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
    feFlood.setAttribute("flood-color", "#000000");
    feFlood.setAttribute("flood-opacity", "0.3");
    feFlood.setAttribute("result", "shadowColor");
    
    const feComposite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
    feComposite.setAttribute("in", "shadowColor");
    feComposite.setAttribute("in2", "offsetBlur");
    feComposite.setAttribute("operator", "in");
    feComposite.setAttribute("result", "shadowBlur");
    
    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode1.setAttribute("in", "shadowBlur");
    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feOffset);
    filter.appendChild(feFlood);
    filter.appendChild(feComposite);
    filter.appendChild(feMerge);
    
    defs.appendChild(filter);
    roadSvg.insertBefore(defs, roadSvg.firstChild);
  }

  /**
   * Clear all active marker states
   */
  function clearActiveMarkers() {
    markers.forEach((marker) => {
      marker.classList.remove("active");
    });
  }

  /**
   * Set a specific marker as active
   */
  function setActiveMarker(index) {
    clearActiveMarkers();
    if (markers[index]) {
      markers[index].classList.add("active");
    }
  }

  /**
   * Show location video when marker is clicked
   */
  function showLocationDetails(index) {
    if (index < 0 || index >= locations.length) return;

    currentLocationIndex = index;
    const location = locations[index];

    // Set marker as active
    setActiveMarker(index);

    // Load and autoplay video without controls initially
    videoPlayer.querySelector("source").src = location.video;
    videoPlayer.removeAttribute("controls");
    videoPlayer.load();
    videoPlayer.play().catch((error) => {
      // Autoplay might be blocked by browser, show controls so user can play manually
      console.log("Autoplay prevented:", error);
      videoPlayer.setAttribute("controls", "");
    });

    // Show controls when user taps/clicks on video
    videoPlayer.onclick = () => {
      if (!videoPlayer.hasAttribute("controls")) {
        videoPlayer.setAttribute("controls", "");
      }
    };

    // Auto close overlay when video ends
    videoPlayer.onended = () => {
      hideInfoOverlay();
    };

    // Show the overlay
    setTimeout(() => {
      infoOverlay.classList.add("active");
    }, 100);
  }

  /**
   * Hide info overlay
   */
  function hideInfoOverlay() {
    infoOverlay.classList.remove("active");
    // Pause and reset video when hiding overlay
    videoPlayer.pause();
    videoPlayer.currentTime = 0;

    // Reset to overview
    currentLocationIndex = -1;
    clearActiveMarkers();
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Close overlay when clicking anywhere on the overlay (except video controls)
    infoOverlay.addEventListener("click", (e) => {
      // Don't close if clicking on video controls
      if (!e.target.closest(".video-player")) {
        hideInfoOverlay();
      }
    });

    // Prevent video clicks from closing overlay
    videoPlayer.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Close overlay on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && infoOverlay.classList.contains("active")) {
        e.preventDefault();
        hideInfoOverlay();
      }
    });

    // Click on map (non-marker area) returns to startup state
    mapElement.addEventListener("click", (e) => {
      // Only trigger if overlay is active and click is not on a marker
      if (infoOverlay.classList.contains("active") && !e.target.closest(".location-marker")) {
        hideInfoOverlay();
      }
    });
  }

  /**
   * Initialize the application
   */
  function init() {
    loadLocations().then(() => {
      initEventListeners();
    });
  }

  // Start app when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
