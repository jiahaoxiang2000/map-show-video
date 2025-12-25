/**
 * Map Explorer - Click-based navigation with custom background image
 */

(function () {
  "use strict";

  // DOM Elements
  const infoOverlay = document.querySelector(".info-overlay");
  const videoPlayer = document.querySelector(".video-player");
  const videoCloseBtn = document.querySelector(".video-close-btn");
  const videoLoading = document.querySelector(".video-loading");
  const mapElement = document.getElementById("map");
  const introVideoBtn = document.getElementById("intro-video-btn");
  const outroVideoBtn = document.getElementById("outro-video-btn");

  // State
  let mapConfig = {};
  let locations = [];
  let markers = [];
  let introVideoConfig = null;
  let outroVideoConfig = null;
  let currentLocationIndex = -1; // -1 = no location selected
  let backgroundBounds = { left: 0, top: 0, width: 0, height: 0 };
  let hls = null; // HLS.js instance

  /**
   * Set viewport height CSS variable for mobile browsers
   * Fixes issues with dynamic address bars on iOS/Android
   */
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * Check if device is in portrait orientation
   */
  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Update background image - always use horizontal background
   */
  function updateBackgroundImage() {
    // Always use horizontal background
    const bgImage = mapConfig.backgroundImageHorizontal;
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
      updateIntroButtonPosition();
      updateOutroButtonPosition();
    });
    
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        setViewportHeight();
        updateBackgroundImage();
        calculateBackgroundBounds();
        updateMarkerPositions();
        updateIntroButtonPosition();
        updateOutroButtonPosition();
      }, 200);
    });
  }

  /**
   * Calculate the actual bounds of the background image
   * when using background-size: contain
   */
  function calculateBackgroundBounds() {
    let containerWidth, containerHeight;
    
    // In portrait mode, the container is rotated, so swap dimensions
    if (isPortrait()) {
      containerWidth = window.innerHeight;
      containerHeight = window.innerWidth;
    } else {
      containerWidth = mapElement.offsetWidth;
      containerHeight = mapElement.offsetHeight;
    }
    
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
    
    // Debug: log background bounds
    console.log('Background bounds:', backgroundBounds);
    console.log('Container:', containerWidth, 'x', containerHeight);
    console.log('Image aspect:', imageAspect, 'Container aspect:', containerAspect);
  }

  /**
   * Get position for current orientation
   * Always use horizontal position since we always use horizontal background
   */
  function getPositionForOrientation(location) {
    return location.positionHorizontal;
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
      introVideoConfig = data.introVideo;
      outroVideoConfig = data.outroVideo;
      initMap();
      createMarkers();
      updateIntroButtonPosition();
      updateOutroButtonPosition();
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  }

  /**
   * Create transparent marker elements for each location
   * The red buttons are already drawn on the background image,
   * so we only create invisible clickable areas over them
   */
  function createMarkers() {
    locations.forEach((location, index) => {
      const marker = document.createElement("div");
      marker.classList.add("location-marker");
      marker.dataset.index = index;
      marker.title = location.title; // Tooltip on hover
      
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
   * Also scales marker size proportionally to background image size
   */
  function updateMarkerPositions() {
    // Calculate scale factor based on background width relative to original image
    const scaleFactor = backgroundBounds.width / mapConfig.imageWidth;
    
    // Base marker size (for original image size)
    const baseWidth = 200;
    const baseHeight = 56;
    
    // Scaled marker size
    const markerWidth = baseWidth * scaleFactor;
    const markerHeight = baseHeight * scaleFactor;
    
    markers.forEach((marker, index) => {
      const location = locations[index];
      const position = getPositionForOrientation(location);
      const pos = getActualPosition(position.x, position.y);
      marker.style.left = `${pos.x}px`;
      marker.style.top = `${pos.y}px`;
      marker.style.width = `${markerWidth}px`;
      marker.style.height = `${markerHeight}px`;
      marker.style.borderRadius = `${markerHeight / 2}px`;
    });
  }

  /**
   * Update intro button position based on background bounds
   * Square transparent button with "花絮" text
   */
  function updateIntroButtonPosition() {
    if (!introVideoBtn || !introVideoConfig) return;
    
    const position = introVideoConfig.positionHorizontal;
    const pos = getActualPosition(position.x, position.y);
    
    // Scale button size based on background - make it square (2x larger)
    const scaleFactor = backgroundBounds.width / mapConfig.imageWidth;
    const baseSize = 160; // Square size (doubled from 80)
    const baseFontSize = 22; // Label font size
    
    const size = baseSize * scaleFactor;
    const fontSize = baseFontSize * scaleFactor;
    
    introVideoBtn.style.left = `${pos.x}px`;
    introVideoBtn.style.top = `${pos.y}px`;
    introVideoBtn.style.width = `${size}px`;
    introVideoBtn.style.height = `${size}px`;
    introVideoBtn.style.borderRadius = `${size * 0.15}px`; // Slightly rounded corners
    
    // Update label font size
    const label = introVideoBtn.querySelector('.intro-label');
    if (label) {
      label.style.fontSize = `${fontSize}px`;
    }
  }

  /**
   * Update outro button position based on background bounds
   * Rectangular transparent button (800x100)
   */
  function updateOutroButtonPosition() {
    if (!outroVideoBtn || !outroVideoConfig) return;
    
    const position = outroVideoConfig.positionHorizontal;
    const pos = getActualPosition(position.x, position.y);
    
    // Scale button size based on background - rectangular 800x100
    const scaleFactor = backgroundBounds.width / mapConfig.imageWidth;
    const baseWidth = 800;
    const baseHeight = 100;
    
    const width = baseWidth * scaleFactor;
    const height = baseHeight * scaleFactor;
    
    outroVideoBtn.style.left = `${pos.x}px`;
    outroVideoBtn.style.top = `${pos.y}px`;
    outroVideoBtn.style.width = `${width}px`;
    outroVideoBtn.style.height = `${height}px`;
    outroVideoBtn.style.borderRadius = `${height * 0.15}px`; // Slightly rounded corners
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
   * Show loading indicator
   */
  function showLoading() {
    if (videoLoading) {
      videoLoading.classList.add("active");
    }
  }

  /**
   * Hide loading indicator
   */
  function hideLoading() {
    if (videoLoading) {
      videoLoading.classList.remove("active");
    }
  }

  /**
   * Load and play video (supports both HLS .m3u8 and regular MP4)
   */
  function loadVideo(videoUrl) {
    // Destroy previous HLS instance if exists
    if (hls) {
      hls.destroy();
      hls = null;
    }

    videoPlayer.removeAttribute("controls");

    const isHLS = videoUrl.includes('.m3u8');

    if (isHLS) {
      // HLS stream
      if (Hls.isSupported()) {
        // Use HLS.js for browsers that don't support HLS natively
        hls = new Hls({
          startLevel: -1, // Auto quality selection
          capLevelToPlayerSize: true
        });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(videoPlayer);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoPlayer.play().catch((error) => {
            console.log("Autoplay prevented:", error);
            videoPlayer.setAttribute("controls", "");
            hideLoading();
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            hideLoading();
          }
        });
      } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari has native HLS support
        videoPlayer.src = videoUrl;
        videoPlayer.play().catch((error) => {
          console.log("Autoplay prevented:", error);
          videoPlayer.setAttribute("controls", "");
          hideLoading();
        });
      } else {
        console.error("HLS is not supported in this browser");
        hideLoading();
      }
    } else {
      // Regular MP4
      videoPlayer.src = videoUrl;
      videoPlayer.load();
      videoPlayer.play().catch((error) => {
        console.log("Autoplay prevented:", error);
        videoPlayer.setAttribute("controls", "");
        hideLoading();
      });
    }
  }

  /**
   * Show location video when marker is clicked
   * Video fills the page overlay and always plays in landscape orientation
   */
  function showLocationDetails(index) {
    if (index < 0 || index >= locations.length) return;

    currentLocationIndex = index;
    const location = locations[index];

    // Set marker as active
    setActiveMarker(index);

    // Hide both buttons
    if (introVideoBtn) {
      introVideoBtn.style.display = "none";
    }
    if (outroVideoBtn) {
      outroVideoBtn.style.display = "none";
    }

    // Show loading indicator
    showLoading();

    // Setup video event handlers
    // Hide loading when video has enough data to start playing (streaming)
    videoPlayer.oncanplay = () => {
      hideLoading();
    };

    // 'loadeddata' fires when first frame is available
    videoPlayer.onloadeddata = () => {
      hideLoading();
    };

    // Show loading again if video is waiting for more data (buffering)
    videoPlayer.onwaiting = () => {
      showLoading();
    };

    // Hide loading when video resumes playing after buffering
    videoPlayer.onplaying = () => {
      hideLoading();
    };

    // Also hide loading on error (to prevent stuck loading)
    videoPlayer.onerror = () => {
      hideLoading();
      console.error("Video loading error");
    };

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

    // Load and play the video
    loadVideo(location.video);

    // Show the overlay
    setTimeout(() => {
      infoOverlay.classList.add("active");
    }, 100);
  }

  /**
   * Show the intro video (花絮)
   */
  function showIntroVideo() {
    if (!introVideoConfig || !introVideoConfig.video) {
      console.error("Intro video config not found");
      return;
    }

    // Clear any active marker
    clearActiveMarkers();
    currentLocationIndex = -1;

    // Hide both buttons
    if (introVideoBtn) {
      introVideoBtn.style.display = "none";
    }
    if (outroVideoBtn) {
      outroVideoBtn.style.display = "none";
    }

    // Show loading indicator
    showLoading();

    // Setup video event handlers
    videoPlayer.oncanplay = () => {
      hideLoading();
    };

    videoPlayer.onloadeddata = () => {
      hideLoading();
    };

    videoPlayer.onwaiting = () => {
      showLoading();
    };

    videoPlayer.onplaying = () => {
      hideLoading();
    };

    videoPlayer.onerror = () => {
      hideLoading();
      console.error("Intro video loading error");
    };

    videoPlayer.onclick = () => {
      if (!videoPlayer.hasAttribute("controls")) {
        videoPlayer.setAttribute("controls", "");
      }
    };

    videoPlayer.onended = () => {
      hideInfoOverlay();
    };

    // Load and play intro video from config
    console.log("Loading intro video:", introVideoConfig.video);
    loadVideo(introVideoConfig.video);

    // Show the overlay
    setTimeout(() => {
      infoOverlay.classList.add("active");
    }, 100);
  }

  /**
   * Show the outro video (片尾)
   */
  function showOutroVideo() {
    if (!outroVideoConfig || !outroVideoConfig.video) {
      console.error("Outro video config not found");
      return;
    }

    // Clear any active marker
    clearActiveMarkers();
    currentLocationIndex = -1;

    // Hide both buttons
    if (introVideoBtn) {
      introVideoBtn.style.display = "none";
    }
    if (outroVideoBtn) {
      outroVideoBtn.style.display = "none";
    }

    // Show loading indicator
    showLoading();

    // Setup video event handlers
    videoPlayer.oncanplay = () => {
      hideLoading();
    };

    videoPlayer.onloadeddata = () => {
      hideLoading();
    };

    videoPlayer.onwaiting = () => {
      showLoading();
    };

    videoPlayer.onplaying = () => {
      hideLoading();
    };

    videoPlayer.onerror = () => {
      hideLoading();
      console.error("Outro video loading error");
    };

    videoPlayer.onclick = () => {
      if (!videoPlayer.hasAttribute("controls")) {
        videoPlayer.setAttribute("controls", "");
      }
    };

    videoPlayer.onended = () => {
      hideInfoOverlay();
    };

    // Load and play outro video from config
    console.log("Loading outro video:", outroVideoConfig.video);
    loadVideo(outroVideoConfig.video);

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
    
    // Hide loading indicator
    hideLoading();
    
    // Destroy HLS instance if exists
    if (hls) {
      hls.destroy();
      hls = null;
    }
    
    // Pause and reset video when hiding overlay
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.src = ''; // Clear video source

    // Clean up video event handlers
    videoPlayer.onended = null;
    videoPlayer.oncanplay = null;
    videoPlayer.onloadeddata = null;
    videoPlayer.onwaiting = null;
    videoPlayer.onplaying = null;
    videoPlayer.onerror = null;

    // Reset to overview
    currentLocationIndex = -1;
    clearActiveMarkers();

    // Show both buttons again
    if (introVideoBtn) {
      introVideoBtn.style.display = "flex";
    }
    if (outroVideoBtn) {
      outroVideoBtn.style.display = "flex";
    }
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Close button click - back to main page
    videoCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hideInfoOverlay();
    });

    // Close overlay when clicking anywhere on the overlay (except video and close button)
    infoOverlay.addEventListener("click", (e) => {
      // Don't close if clicking on video controls or close button
      if (!e.target.closest(".video-player") && !e.target.closest(".video-close-btn")) {
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

    // Intro video button click
    if (introVideoBtn) {
      introVideoBtn.addEventListener("click", () => {
        showIntroVideo();
      });
    }

    // Outro video button click
    if (outroVideoBtn) {
      outroVideoBtn.addEventListener("click", () => {
        showOutroVideo();
      });
    }
  }



  /**
   * Initialize the application
   */
  function init() {
    loadLocations().then(() => {
      initEventListeners();
      
      // Show intro button immediately
      if (introVideoBtn && introVideoConfig) {
        introVideoBtn.style.display = "flex";
        updateIntroButtonPosition();
      }

      // Show outro button immediately
      if (outroVideoBtn && outroVideoConfig) {
        outroVideoBtn.style.display = "flex";
        updateOutroButtonPosition();
      }
    });
  }

  // Start app when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
