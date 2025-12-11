/**
 * Map Explorer - Scroll-based step navigation
 */

(function () {
  "use strict";

  // DOM Elements
  const mapImage = document.querySelector(".map-image");
  const iconsContainer = document.querySelector(".icons-container");
  const infoOverlay = document.querySelector(".info-overlay");
  const locationTitle = document.querySelector(".location-title");
  const locationDescription = document.querySelector(".location-description");
  const videoPlayer = document.querySelector(".video-player");
  const currentLocationSpan = document.querySelector(".current-location");
  const totalLocationsSpan = document.querySelector(".total-locations");

  // State
  let locations = [];
  let currentLocationIndex = -1; // -1 = intro view (full map)
  let maxVisitedIndex = -1; // Track the furthest location visited
  let isTransitioning = false;
  let scrollAccumulator = 0;
  const SCROLL_THRESHOLD = 50; // Amount of scroll needed to trigger navigation

  // Configuration
  const ZOOM_SCALE = 1;
  const TRANSITION_DURATION = 800; // ms

  /**
   * Load location data from JSON
   */
  async function loadLocations() {
    try {
      const response = await fetch("data/locations.json");
      const data = await response.json();
      locations = data.locations;
      totalLocationsSpan.textContent = locations.length;
      createIcons();
      updateCounter();
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  }

  /**
   * Create icon elements for each location
   */
  function createIcons() {
    locations.forEach((location) => {
      const icon = document.createElement("div");
      icon.className = "location-icon";
      icon.dataset.id = location.id;
      icon.style.left = `${location.position.x}%`;
      icon.style.top = `${location.position.y}%`;

      iconsContainer.appendChild(icon);
    });
  }

  /**
   * Calculate transform values to center on a specific position
   */
  function calculateTransform(position, scale) {
    // Calculate offset to center the position in viewport
    const offsetX = (50 - position.x) * scale;
    const offsetY = (25 - position.y) * scale;

    return {
      scale,
      translateX: offsetX,
      translateY: offsetY,
    };
  }

  /**
   * Apply transform to map
   */
  function applyMapTransform(transform) {
    const transformValue = `
      scale(${transform.scale}) 
      translate(${transform.translateX}%, ${transform.translateY}%)
    `;
    mapImage.style.transform = transformValue;
    iconsContainer.style.transform = transformValue;
  }

  /**
   * Show a specific icon with entrance animation
   */
  function showIcon(index, withAnimation = true) {
    const icon = iconsContainer.querySelector(
      `[data-id="${locations[index].id}"]`,
    );
    if (icon) {
      icon.classList.add("visible");

      if (withAnimation && !icon.classList.contains("has-entered")) {
        icon.classList.add("entering");
        icon.classList.add("has-entered");

        // Remove entrance animation class after it completes
        setTimeout(() => {
          icon.classList.remove("entering");
        }, 800);
      }
    }
  }

  /**
   * Hide a specific icon
   */
  function hideIcon(index) {
    const icon = iconsContainer.querySelector(
      `[data-id="${locations[index].id}"]`,
    );
    if (icon) {
      icon.classList.remove("visible", "active");
    }
  }

  /**
   * Hide all icons
   */
  function hideAllIcons() {
    document.querySelectorAll(".location-icon").forEach((icon) => {
      icon.classList.remove("visible", "active");
    });
  }

  /**
   * Set a specific icon as active
   */
  function setActiveIcon(index) {
    clearActiveIcons();
    const icon = iconsContainer.querySelector(
      `[data-id="${locations[index].id}"]`,
    );
    if (icon) {
      icon.classList.add("active");
    }
  }

  /**
   * Clear all active icon states
   */
  function clearActiveIcons() {
    document.querySelectorAll(".location-icon.active").forEach((icon) => {
      icon.classList.remove("active");
    });
  }

  /**
   * Navigate to a specific location
   */
  function goToLocation(index) {
    if (isTransitioning) return;

    // Validate index bounds
    if (index < -1 || index >= locations.length) return;

    isTransitioning = true;

    // Update current location
    currentLocationIndex = index;

    // Update max visited index
    if (index > maxVisitedIndex) {
      maxVisitedIndex = index;
    }

    // If index is -1, show full map view with all visited icons
    if (index === -1) {
      applyMapTransform({ scale: 1, translateX: 0, translateY: 0 });
      hideInfoOverlay();
      clearActiveIcons();

      // Show all visited location icons
      hideAllIcons();
      for (let i = 0; i <= maxVisitedIndex; i++) {
        showIcon(i, false);
      }

      updateCounter();
      setTimeout(() => {
        isTransitioning = false;
      }, TRANSITION_DURATION);
      return;
    }

    // Calculate and apply transform for specific location
    const location = locations[index];
    const transform = calculateTransform(location.position, ZOOM_SCALE);
    applyMapTransform(transform);

    // Hide all icons first, then show only current one
    hideAllIcons();
    showIcon(index, true);
    setActiveIcon(index);

    // Update info overlay
    setTimeout(() => {
      locationTitle.textContent = location.title;
      locationDescription.textContent = location.description;

      // Load and autoplay video without controls initially
      videoPlayer.querySelector("source").src = location.video;
      videoPlayer.removeAttribute('controls');
      videoPlayer.load();
      videoPlayer.play().catch(error => {
        // Autoplay might be blocked by browser, show controls so user can play manually
        console.log('Autoplay prevented:', error);
        videoPlayer.setAttribute('controls', '');
      });
      
      // Show controls when user taps/clicks on video
      videoPlayer.onclick = () => {
        if (!videoPlayer.hasAttribute('controls')) {
          videoPlayer.setAttribute('controls', '');
        }
      };

      infoOverlay.classList.add("active");
      isTransitioning = false;
    }, TRANSITION_DURATION / 2);

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
  }

  /**
   * Update location counter display
   */
  function updateCounter() {
    currentLocationSpan.textContent = Math.max(0, currentLocationIndex + 1);
  }

  /**
   * Navigate to next location
   */
  function goToNext() {
    // If at last location, go back to full map view
    if (currentLocationIndex === locations.length - 1) {
      goToLocation(-1);
    } else if (currentLocationIndex < locations.length - 1) {
      goToLocation(currentLocationIndex + 1);
    }
  }

  /**
   * Navigate to previous location
   */
  function goToPrevious() {
    if (currentLocationIndex > -1) {
      goToLocation(currentLocationIndex - 1);
    }
  }

  /**
   * Handle wheel/scroll event for navigation
   */
  function handleScroll(event) {
    // Prevent default scrolling
    event.preventDefault();

    // Don't accumulate scroll during transitions
    if (isTransitioning) {
      scrollAccumulator = 0;
      return;
    }

    // Get scroll delta (normalized across different browsers/devices)
    let delta = 0;
    if (event.deltaY) {
      delta = event.deltaY;
    } else if (event.wheelDelta) {
      delta = -event.wheelDelta;
    } else if (event.detail) {
      delta = event.detail * 40;
    }

    // Accumulate scroll delta
    scrollAccumulator += delta;

    // Check if we've reached the threshold
    if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
      if (scrollAccumulator > 0) {
        // Scrolling down = next location
        goToNext();
      } else {
        // Scrolling up = previous location
        goToPrevious();
      }

      // Reset accumulator
      scrollAccumulator = 0;
    }
  }

  /**
   * Handle touch events for mobile swipe
   */
  let touchStartY = 0;
  let touchEndY = 0;

  function handleTouchStart(event) {
    // Don't handle touches on the info overlay
    if (event.target.closest(".info-overlay")) {
      return;
    }
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    // Don't handle touches on the info overlay
    if (event.target.closest(".info-overlay")) {
      return;
    }
    touchEndY = event.touches[0].clientY;
  }

  function handleTouchEnd(event) {
    // Don't handle touches on the info overlay
    if (event.target.closest(".info-overlay")) {
      touchStartY = 0;
      touchEndY = 0;
      return;
    }

    if (isTransitioning) return;

    const deltaY = touchStartY - touchEndY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swiped up = next location
        goToNext();
      } else {
        // Swiped down = previous location
        goToPrevious();
      }
    }

    // Reset touch positions
    touchStartY = 0;
    touchEndY = 0;
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Wheel event for desktop scroll
    window.addEventListener("wheel", handleScroll, { passive: false });

    // Touch events for mobile swipe
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      // Navigate with arrow keys
      if (!isTransitioning) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          goToNext();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          goToPrevious();
        }
      }
    });
  }

  /**
   * Initialize the application
   */
  function init() {
    loadLocations().then(() => {
      initEventListeners();
      // Start at intro view (full map)
      goToLocation(-1);
    });
  }

  // Start app when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
