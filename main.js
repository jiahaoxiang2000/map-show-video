/**
 * Map Explorer - Click-based navigation with real map data
 */

(function () {
  "use strict";

  // DOM Elements
  const infoOverlay = document.querySelector(".info-overlay");
  const locationTitle = document.querySelector(".location-title");
  const locationDescription = document.querySelector(".location-description");
  const videoPlayer = document.querySelector(".video-player");
  const currentLocationSpan = document.querySelector(".current-location");
  const totalLocationsSpan = document.querySelector(".total-locations");

  // State
  let map = null;
  let mapConfig = {};
  let locations = [];
  let markers = [];
  let travelPath = null;
  let currentLocationIndex = -1; // -1 = no location selected

  /**
   * Initialize Leaflet map
   */
  function initMap() {
    // Create map with OpenStreetMap tiles
    map = L.map("map", {
      center: mapConfig.center,
      zoom: mapConfig.initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
      keyboard: true,
      attributionControl: true,
    });

    // Use OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
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
      totalLocationsSpan.textContent = locations.length;
      initMap();
      createMarkers();
      updateCounter();
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  }

  /**
   * Create custom icon for markers
   */
  function createCustomIcon(isActive = false) {
    const iconSize = isActive ? [48, 48] : [40, 40];
    return L.divIcon({
      className: isActive ? "location-marker active" : "location-marker",
      iconSize: iconSize,
      iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
      html: '<div class="marker-inner"></div>',
    });
  }

  /**
   * Create travel path connecting all locations
   */
  function createTravelPath() {
    // Extract coordinates from locations in order
    const pathCoordinates = locations.map((location) => [
      location.coordinates.lat,
      location.coordinates.lng,
    ]);

    // Create polyline with custom styling
    travelPath = L.polyline(pathCoordinates, {
      color: "#3B82F6",
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1,
      dashArray: "10, 5",
    }).addTo(map);
  }

  /**
   * Create marker elements for each location
   */
  function createMarkers() {
    // First create the travel path
    createTravelPath();

    // Then create markers on top
    locations.forEach((location, index) => {
      const marker = L.marker(
        [location.coordinates.lat, location.coordinates.lng],
        {
          icon: createCustomIcon(false),
        },
      ).addTo(map);

      marker.locationIndex = index;

      // Add click handler to marker
      marker.on("click", () => {
        showLocationDetails(index);
      });

      markers.push(marker);
    });
  }

  /**
   * Clear all active marker states
   */
  function clearActiveMarkers() {
    markers.forEach((marker) => {
      marker.setIcon(createCustomIcon(false));
      const element = marker.getElement();
      if (element) {
        element.classList.remove("active");
      }
    });
  }

  /**
   * Set a specific marker as active
   */
  function setActiveMarker(index) {
    clearActiveMarkers();
    if (markers[index]) {
      markers[index].setIcon(createCustomIcon(true));
      const element = markers[index].getElement();
      if (element) {
        element.classList.add("active");
      }
    }
  }

  /**
   * Show location details when marker is clicked
   */
  function showLocationDetails(index) {
    if (index < 0 || index >= locations.length) return;

    currentLocationIndex = index;
    const location = locations[index];

    // Calculate offset to show marker above the overlay
    // Get map container height
    const mapHeight = map.getContainer().clientHeight;
    // Overlay takes approximately 70vh (70% of viewport height)
    // We want to offset the center upward by about 20% of map height
    const pixelOffset = mapHeight * 0.3;

    // Convert pixel offset to lat/lng offset
    const targetPoint = map.project(
      [location.coordinates.lat, location.coordinates.lng],
      mapConfig.focusZoom,
    );
    targetPoint.y += pixelOffset;
    const targetLatLng = map.unproject(targetPoint, mapConfig.focusZoom);

    // Fly to the offset location
    map.flyTo(targetLatLng, mapConfig.focusZoom, {
      duration: 0.8,
    });

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
    }, 400);

    updateCounter();
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
    map.flyTo(mapConfig.center, mapConfig.initialZoom, {
      duration: 0.8,
    });
    updateCounter();
  }

  /**
   * Update location counter display
   */
  function updateCounter() {
    currentLocationSpan.textContent = Math.max(0, currentLocationIndex + 1);
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
    map.on("click", (e) => {
      // Only trigger if overlay is active (a location is selected)
      if (infoOverlay.classList.contains("active")) {
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
