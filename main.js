/**
 * Map Explorer - Click-based navigation with custom background image
 */

(function () {
  "use strict";

  // DOM Elements
  const infoOverlay = document.querySelector(".info-overlay");
  const locationTitle = document.querySelector(".location-title");
  const locationDescription = document.querySelector(".location-description");
  const videoPlayer = document.querySelector(".video-player");
  const mapElement = document.getElementById("map");

  // State
  let mapConfig = {};
  let locations = [];
  let markers = [];
  let currentLocationIndex = -1; // -1 = no location selected
  let backgroundBounds = { left: 0, top: 0, width: 0, height: 0 };

  /**
   * Set viewport height CSS variable for mobile browsers
   * Fixes issues with dynamic address bars on iOS/Android
   */
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * Initialize custom background map
   */
  function initMap() {
    // Set background image from config
    mapElement.style.backgroundImage = `url('${mapConfig.backgroundImage}')`;
    
    // Set initial viewport height
    setViewportHeight();
    
    // Calculate background bounds on load and resize
    calculateBackgroundBounds();
    
    // Handle resize and orientation change
    window.addEventListener('resize', () => {
      setViewportHeight();
      calculateBackgroundBounds();
      updateMarkerPositions();
    });
    
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        setViewportHeight();
        calculateBackgroundBounds();
        updateMarkerPositions();
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
      createMarkers();
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
      
      const markerInner = document.createElement("div");
      markerInner.classList.add("marker-inner");
      marker.appendChild(markerInner);
      
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
      const pos = getActualPosition(location.position.x, location.position.y);
      marker.style.left = `${pos.x}px`;
      marker.style.top = `${pos.y}px`;
    });
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
   * Show location details when marker is clicked
   */
  function showLocationDetails(index) {
    if (index < 0 || index >= locations.length) return;

    currentLocationIndex = index;
    const location = locations[index];

    // Set marker as active
    setActiveMarker(index);

    // Update info overlay
    locationTitle.textContent = location.title;
    locationDescription.textContent = location.description;

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
    // Close overlay when clicking the handle
    const infoHandle = document.querySelector(".info-handle");
    if (infoHandle) {
      infoHandle.addEventListener("click", hideInfoOverlay);
    }

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
