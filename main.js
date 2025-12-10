/**
 * Map Explorer - Scroll-driven map animation with video playback
 */

(function() {
  'use strict';

  // DOM Elements
  const mapImage = document.querySelector('.map-image');
  const iconsContainer = document.querySelector('.icons-container');
  const infoOverlay = document.querySelector('.info-overlay');
  const locationTitle = document.querySelector('.location-title');
  const locationDescription = document.querySelector('.location-description');
  const playVideoBtn = document.querySelector('.play-video-btn');
  const scrollProgress = document.querySelector('.scroll-progress');
  const scrollHint = document.querySelector('.scroll-hint');
  const videoModal = document.querySelector('.video-modal');
  const videoPlayer = document.querySelector('.video-player');
  const closeModalBtn = document.querySelector('.close-modal');

  // State
  let locations = [];
  let currentLocationIndex = -1;
  let visibleIcons = new Set();

  // Configuration
  const ZOOM_SCALE = 2.5;
  const SECTIONS = 5; // intro + 3 locations + outro

  /**
   * Load location data from JSON
   */
  async function loadLocations() {
    try {
      const response = await fetch('data/locations.json');
      const data = await response.json();
      locations = data.locations;
      createIcons();
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }

  /**
   * Create icon elements for each location
   */
  function createIcons() {
    locations.forEach((location) => {
      const icon = document.createElement('div');
      icon.className = 'location-icon';
      icon.dataset.id = location.id;
      icon.style.left = `${location.position.x}%`;
      icon.style.top = `${location.position.y}%`;
      
      icon.addEventListener('click', () => {
        showVideoModal(location.video);
      });
      
      iconsContainer.appendChild(icon);
    });
  }

  /**
   * Calculate transform values to center on a specific position
   */
  function calculateTransform(position, scale) {
    // Calculate offset to center the position in viewport
    const offsetX = (50 - position.x) * scale;
    const offsetY = (50 - position.y) * scale;
    
    return {
      scale,
      translateX: offsetX,
      translateY: offsetY
    };
  }

  /**
   * Apply transform to map
   */
  function applyMapTransform(transform) {
    mapImage.style.transform = `
      scale(${transform.scale}) 
      translate(${transform.translateX}%, ${transform.translateY}%)
    `;
  }

  /**
   * Interpolate between two values
   */
  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  /**
   * Ease in-out function for smoother transitions
   */
  function easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update UI based on scroll position
   */
  function updateOnScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollY / maxScroll;
    
    // Update scroll progress indicator
    scrollProgress.style.height = `${scrollPercent * 100}%`;
    
    // Hide scroll hint after initial scroll
    if (scrollPercent > 0.02) {
      scrollHint.classList.add('hidden');
    } else {
      scrollHint.classList.remove('hidden');
    }
    
    // Calculate which section we're in (0 to SECTIONS-1)
    const sectionProgress = scrollPercent * (SECTIONS - 1);
    const currentSection = Math.floor(sectionProgress);
    const sectionLocalProgress = sectionProgress - currentSection;
    
    // Apply easing to local progress
    const easedProgress = easeInOutCubic(sectionLocalProgress);
    
    // Handle different sections
    if (currentSection === 0) {
      // Intro section: zoom from full view to first location
      handleIntroSection(easedProgress);
    } else if (currentSection >= 1 && currentSection <= locations.length) {
      // Location sections - show one location at a time
      handleLocationSection(currentSection - 1, easedProgress);
    } else if (currentSection >= locations.length + 1) {
      // Outro section: zoom back to full view
      handleOutroSection(easedProgress);
    }
  }

  /**
   * Handle intro section animation
   */
  function handleIntroSection(progress) {
    if (locations.length === 0) return;
    
    const targetLocation = locations[0];
    const targetTransform = calculateTransform(targetLocation.position, ZOOM_SCALE);
    
    const transform = {
      scale: lerp(1, targetTransform.scale, progress),
      translateX: lerp(0, targetTransform.translateX, progress),
      translateY: lerp(0, targetTransform.translateY, progress)
    };
    
    applyMapTransform(transform);
    
    // Show first location info and icon when progress > 0.6
    if (progress > 0.6) {
      setActiveLocation(0);
      showIcon(0);
    } else {
      hideInfoOverlay();
    }
  }

  /**
   * Handle location section animations - each location gets its own section
   */
  function handleLocationSection(locationIndex, progress) {
    if (locationIndex >= locations.length) return;
    
    const currentLocation = locations[locationIndex];
    const currentTransform = calculateTransform(currentLocation.position, ZOOM_SCALE);
    
    // Stay zoomed on current location
    applyMapTransform(currentTransform);
    
    // Show current location throughout its section
    setActiveLocation(locationIndex);
    
    // Show icon for current location (with entrance animation at start)
    if (progress > 0.1) {
      showIcon(locationIndex);
    }
    
    // Also keep all previous location icons visible
    for (let i = 0; i < locationIndex; i++) {
      showIcon(i);
    }
    
    // If transitioning to next location (progress > 0.7), start panning
    if (progress > 0.7 && locationIndex < locations.length - 1) {
      const nextLocation = locations[locationIndex + 1];
      const nextTransform = calculateTransform(nextLocation.position, ZOOM_SCALE);
      
      // Map progress 0.7-1.0 to 0.0-1.0 for smooth pan transition
      const panProgress = (progress - 0.7) / 0.3;
      const easedPanProgress = easeInOutCubic(panProgress);
      
      const transform = {
        scale: ZOOM_SCALE,
        translateX: lerp(currentTransform.translateX, nextTransform.translateX, easedPanProgress),
        translateY: lerp(currentTransform.translateY, nextTransform.translateY, easedPanProgress)
      };
      
      applyMapTransform(transform);
      
      // Start hiding current location info when panning starts
      if (panProgress > 0.3) {
        hideInfoOverlay();
      }
    }
  }

  /**
   * Handle outro section animation
   */
  function handleOutroSection(progress) {
    if (locations.length === 0) return;
    
    const lastLocation = locations[locations.length - 1];
    const lastTransform = calculateTransform(lastLocation.position, ZOOM_SCALE);
    
    const transform = {
      scale: lerp(ZOOM_SCALE, 1, progress),
      translateX: lerp(lastTransform.translateX, 0, progress),
      translateY: lerp(lastTransform.translateY, 0, progress)
    };
    
    applyMapTransform(transform);
    hideInfoOverlay();
    
    // Keep all icons visible
    locations.forEach((_, index) => {
      showIcon(index);
    });
  }

  /**
   * Set active location and update UI
   */
  function setActiveLocation(index) {
    if (index < 0 || index >= locations.length) return;
    
    const location = locations[index];
    
    // Update info overlay content
    locationTitle.textContent = location.title;
    locationDescription.textContent = location.description;
    
    // Store current video URL for play button
    playVideoBtn.dataset.video = location.video;
    
    // Show info overlay
    infoOverlay.classList.add('active');
    
    // Show and activate icon
    showIcon(index);
    setActiveIcon(index);
    
    // Also show all previously visited icons
    for (let i = 0; i < index; i++) {
      showIcon(i);
    }
    
    currentLocationIndex = index;
  }

  /**
   * Hide info overlay
   */
  function hideInfoOverlay() {
    infoOverlay.classList.remove('active');
    clearActiveIcons();
  }

  /**
   * Show a specific icon
   */
  function showIcon(index) {
    const icon = iconsContainer.querySelector(`[data-id="${locations[index].id}"]`);
    if (icon && !visibleIcons.has(index)) {
      // Add entrance animation for first appearance
      icon.classList.add('visible', 'entering');
      visibleIcons.add(index);
      
      // Remove entrance animation class after it completes
      setTimeout(() => {
        icon.classList.remove('entering');
      }, 800);
    } else if (icon) {
      // Already visible, just ensure class is there
      icon.classList.add('visible');
    }
  }

  /**
   * Set a specific icon as active
   */
  function setActiveIcon(index) {
    clearActiveIcons();
    const icon = iconsContainer.querySelector(`[data-id="${locations[index].id}"]`);
    if (icon) {
      icon.classList.add('active');
    }
  }

  /**
   * Clear all active icon states
   */
  function clearActiveIcons() {
    document.querySelectorAll('.location-icon.active').forEach(icon => {
      icon.classList.remove('active');
    });
  }

  /**
   * Show video modal
   */
  function showVideoModal(videoUrl) {
    videoPlayer.querySelector('source').src = videoUrl;
    videoPlayer.load();
    videoModal.classList.add('active');
    videoPlayer.play();
  }

  /**
   * Hide video modal
   */
  function hideVideoModal() {
    videoModal.classList.remove('active');
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Scroll handler with throttling
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateOnScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Play video button
    playVideoBtn.addEventListener('click', () => {
      const videoUrl = playVideoBtn.dataset.video;
      if (videoUrl) {
        showVideoModal(videoUrl);
      }
    });

    // Close modal handlers
    closeModalBtn.addEventListener('click', hideVideoModal);
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        hideVideoModal();
      }
    });

    // Keyboard handler for modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoModal.classList.contains('active')) {
        hideVideoModal();
      }
    });
  }

  /**
   * Initialize the application
   */
  function init() {
    loadLocations().then(() => {
      initEventListeners();
      updateOnScroll(); // Initial state
    });
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
