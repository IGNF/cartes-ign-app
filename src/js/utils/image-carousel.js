/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "../globals";
import { Share } from "@capacitor/share";
import fileUtils from "./file-utils";

/**
 * Modular Image Carousel Component
 * @module ImageCarousel
 */
class ImageCarousel {
  /**
   * Initialize the carousel
   * @param {HTMLElement} container - The container element where the carousel will be inserted
   * @param {string[]} imageSources - Array of image URLs
   * @param {Object} options - Optional configuration
   * @param {Function} options.onImageClick - Callback when an image is clicked (deprecated, overlay is now default)
   * @param {string} options.imageTitle - Title attribute for images
   * @param {string[]} options.imageCredits - Array of credit strings (one per image)
   * @param {number} options.fixedHeight - Fixed height for the carousel
   * @param {string} options.backButtonState - Back button state when overlay is open (defaults to "imageOverlay")
   * @param {string} options.newsId - News ID for sharing links
   * @param {string} options.shareActivated - is share btn present on overlay
   */

  _overlay = document.getElementsByTagName("img-overlay")[0];

  constructor(container, imageSources = [], options = {}) {
    if (!container) {
      throw new Error("Container element is required");
    }
    if (!Array.isArray(imageSources) || imageSources.length === 0) {
      console.warn("ImageCarousel: No images provided");
      return;
    }

    this.container = container;
    this.imageSources = imageSources;
    this.onImageClick = options.onImageClick || null;
    this.imageTitle = options.imageTitle || "";
    this.imageCredits = options.imageCredits || [];
    this.noMargins = options.noMargins || false;
    this.fixedHeight = options.fixedHeight || null;
    this.squareWidth = options.squareWidth || null;
    this.backButtonState = options.backButtonState || "imageOverlay";
    this.newsId = options.newsId || null;
    this.shareActivated = options.shareActivated === undefined ? true : options.shareActivated;
    this.creditsInCarousel = options.creditsInCarousel === undefined ? false : options.creditsInCarousel;

    if (this.fixedHeight) {
      this.container.style.height = `${this.fixedHeight}px`;
    }
    if (this.squareWidth) {
      this.container.style.setProperty("--width", this.squareWidth + "px");
    }

    this.current = 0;
    this.isDragging = false;
    this.startX = 0;
    this.track = null;
    this.divDots = null;
    this.isSingleImage = imageSources.length === 1;
    this.slideWidths = []; // Store individual slide widths
    this.slideOffsets = []; // Store cumulative offsets for each slide

    this._createMarkup();
    this._attachEventListeners();
    this._waitForImagesToLoad();
  }

  /**
   * Create the carousel DOM structure
   * @private
   */
  _createMarkup() {
    // Container
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("newsfeedItemImageContainer");
    if (this.fixedHeight) {
      imageContainer.classList.add("fixedHeight");
    }
    if (this.squareWidth) {
      imageContainer.classList.add("squareWidth");
    }
    if (this.noMargins) {
      imageContainer.classList.add("noMargins");
    }
    if (this.isSingleImage) {
      imageContainer.classList.add("singleImage");
    }

    // Slides container
    const divSlides = document.createElement("div");
    divSlides.classList.add("newsFeedImageSlidesContainer");

    this.track = document.createElement("div");
    this.track.classList.add("newsFeedImageSlidesTrack");
    divSlides.appendChild(this.track);
    imageContainer.appendChild(divSlides);

    // Add carousel class and navigation buttons if multiple images
    imageContainer.classList.add("carousel");
    if (!this.isSingleImage) {
      this._createNavigationButtons(imageContainer);
      // Dots container
      this.divDots = document.createElement("div");
      this.divDots.classList.add("newsFeedImageDotsContainer");
      imageContainer.appendChild(this.divDots);
    }

    // Add images
    this.imageSources.forEach((imageSrc, index) => {
      // Create wrapper for image and credits
      const slideWrapper = document.createElement("div");
      slideWrapper.classList.add("newsfeedItemSlide");

      const imgElem = document.createElement("img");
      imgElem.classList.add("newsfeedItemImg");
      imgElem.setAttribute("title", this.imageTitle);
      imgElem.setAttribute("src", imageSrc);
      slideWrapper.appendChild(imgElem);

      // Add credits if provided
      if (this.imageCredits[index] && this.imageCredits[index] !== "" && this.creditsInCarousel) {
        const creditsElem = document.createElement("p");
        creditsElem.classList.add("newsfeedItemImageCredits");
        creditsElem.innerText = `Crédits : ${this.imageCredits[index]}`;
        slideWrapper.classList.add("withCredits");
        slideWrapper.appendChild(creditsElem);
      }

      this.track.appendChild(slideWrapper);

      if (!this.isSingleImage) {
        // Create dot
        const dotElem = document.createElement("button");
        if (index === 0) dotElem.classList.add("active");
        dotElem.tabIndex = -1;
        this.divDots.appendChild(dotElem);
      }

      // Image click handler
      imgElem.addEventListener("click", () => {
        if (this.onImageClick) {
          this.onImageClick(imageSrc, index);
        } else {
          this._handleImageClick(imageSrc, this.imageTitle, this.newsId, this.imageCredits[index]);
        }
      });
    });

    this.container.appendChild(imageContainer);
  }

  /**
   * Calculate and store individual slide widths and cumulative offsets
   * @private
   */
  _updateSlideMetrics() {
    this.slideWidths = [];
    this.slideOffsets = [0];

    const slides = this.track.querySelectorAll(".newsfeedItemSlide");
    let cumulativeOffset = 0;

    slides.forEach((slide, index) => {
      const width = slide.offsetWidth + 12;
      this.slideWidths.push(width);
      if (index < slides.length - 1) {
        cumulativeOffset += width;
        this.slideOffsets.push(cumulativeOffset);
      }
    });
  }

  /**
   * Wait for all images to load before calculating metrics
   * @private
   */
  _waitForImagesToLoad() {
    const images = this.track.querySelectorAll("img");
    let loadedCount = 0;

    if (images.length === 0) {
      return;
    }

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        // Use requestAnimationFrame to ensure layout is computed
        requestAnimationFrame(() => {
          this._updateSlideMetrics();
        });
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        // Image is already cached/loaded, but schedule callback for next frame
        requestAnimationFrame(onImageLoad);
      } else {
        img.addEventListener("load", onImageLoad, { once: true });
        img.addEventListener("error", onImageLoad, { once: true });
      }
    });
  }

  /**
   * Create navigation buttons (previous/next)
   * @private
   */
  _createNavigationButtons(imageContainer) {
    const beforeElem = document.createElement("div");
    beforeElem.classList.add("newsFeedImagesBefore");
    imageContainer.appendChild(beforeElem);
    beforeElem.appendChild(document.createElement("div"));
    beforeElem.addEventListener("click", () => this.goToSlide(this.current - 1));

    const afterElem = document.createElement("div");
    afterElem.classList.add("newsFeedImagesAfter");
    imageContainer.appendChild(afterElem);
    afterElem.appendChild(document.createElement("div"));
    afterElem.addEventListener("click", () => this.goToSlide(this.current + 1));
  }

  /**
   * Attach event listeners for drag/swipe support
   * @private
   */
  _attachEventListeners() {
    if (this.isSingleImage || !this.track) return;

    this.track.addEventListener("mousedown", (e) => this._dragStart(e));
    this.track.addEventListener("touchstart", (e) => this._dragStart(e), { passive: true });

    this.track.addEventListener("mousemove", (e) => this._dragging(e));
    this.track.addEventListener("touchmove", (e) => this._dragging(e), { passive: true });

    this.track.addEventListener("mouseup", (e) => this._dragEnd(e));
    this.track.addEventListener("mouseleave", (e) => this._dragEnd(e));
    this.track.addEventListener("touchend", (e) => this._dragEnd(e));
  }

  /**
   * Handle drag start
   * @private
   */
  _dragStart(e) {
    this.isDragging = true;
    this.startX = e.touches ? e.touches[0].clientX : e.clientX;
    this.track.style.transition = "none";
  }

  /**
   * Handle dragging movement
   * @private
   */
  _dragging(e) {
    if (!this.isDragging) return;

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - this.startX;

    const containerWidth = parseFloat(
      window.getComputedStyle(this.container.firstChild).width.replace("px", "")
    );
    const slideWidth = this.slideWidths[this.current] || 0;
    const slideOffset = this.slideOffsets[this.current] || 0;

    // Calculate base translation for current slide
    let baseTranslateX;
    if (slideWidth < containerWidth) {
      baseTranslateX = -(slideOffset + (slideWidth - containerWidth) / 2);
    } else {
      baseTranslateX = -slideOffset;
    }

    this.track.style.transform = `translateX(${dx + baseTranslateX}px)`;
  }

  /**
   * Handle drag end
   * @private
   */
  _dragEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    this.track.style.transition = "transform 0.45s ease";

    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x - this.startX;

    // threshold to switch slide
    if (dx > 60) {
      this.goToSlide(this.current - 1);
    } else if (dx < -60) {
      this.goToSlide(this.current + 1);
    } else {
      this.goToSlide(this.current);
    }
  }

  /**
   * Navigate to a specific slide
   * @param {number} index - Slide index to go to
   */
  goToSlide(index) {
    const total = this.imageSources.length;
    if (index < 0) {
      index = total - 1;
    }
    if (index >= total) {
      index = 0;
    }
    index = Math.max(0, Math.min(index, total - 1));
    this.current = index;

    const containerWidth = parseFloat(
      window.getComputedStyle(this.container).width.replace("px", "")
    );
    const slideWidth = this.slideWidths[index] || 0;
    const slideOffset = this.slideOffsets[index] || 0;

    // Calculate translation
    let translateX;
    if (slideWidth < containerWidth) {
      // If slide is smaller than container, center it
      translateX = -(slideOffset + (slideWidth - containerWidth) / 2);
    } else {
      // If slide is larger or equal, just scroll to it
      translateX = -slideOffset;
    }

    if (index === 0) {
      translateX = 0;
    }
    if (index === total - 1) {
      translateX = -(this.track.scrollWidth - this.track.offsetWidth);
    }

    this.track.style.transform = `translateX(${translateX}px)`;

    // Update dots
    if (this.divDots) {
      [...this.divDots.children].forEach((d, i) =>
        d.classList.toggle("active", i === this.current)
      );
    }
  }

  /**
   * Go to next slide
   */
  next() {
    this.goToSlide(this.current + 1);
  }

  /**
   * Go to previous slide
   */
  previous() {
    this.goToSlide(this.current - 1);
  }

  /**
   * Get current slide index
   * @returns {number}
   */
  getCurrentIndex() {
    return this.current;
  }

  /**
   * Get current image source
   * @returns {string}
   */
  getCurrentImage() {
    return this.imageSources[this.current];
  }

  /**
   * Get current image credits
   * @returns {string}
   */
  getCurrentImageCredits() {
    if (this.imageCredits.length === 0) {
      return "";
    }
    return this.imageCredits[this.current];
  }

  /**
   * Handle image click - open overlay with default behavior
   * @private
   */
  _handleImageClick(imageSrc, title, newsId, imageCredits) {
    this._updateOverlayImage(imageSrc, title, newsId, imageCredits);
    this._openOverlay();
  }

  /**
   * Update overlay image and handlers
   * @private
   */
  _updateOverlayImage(imageSrc, title, newsId, credits="") {
    const overlayImage = this._overlay.querySelector("#imgOverlayImage");
    if (!overlayImage) return;

    overlayImage.src = imageSrc;
    overlayImage.title = title;
    if (credits !== "") {
      this._overlay.querySelector("#imgOverlayCredits").innerText = "Crédits photo : " + credits;
    } else {
      this._overlay.querySelector("#imgOverlayCredits").innerText = "";
    }

    if (!this.isSingleImage) {
      this._overlay.querySelector("#imgOverlayPreviousBtn").classList.remove("d-none");
      this._overlay.querySelector("#imgOverlayNextBtn").classList.remove("d-none");
    } else {
      this._overlay.querySelector("#imgOverlayPreviousBtn").classList.add("d-none");
      this._overlay.querySelector("#imgOverlayNextBtn").classList.add("d-none");
    }

    // Setup share button
    const shareBtn = this._overlay.querySelector("#imgOverlayShareBtn");
    if (shareBtn) {
      if (this.shareActivated) {
        shareBtn.classList.remove("d-none");
      } else {
        shareBtn.classList.add("d-none");
        return;
      }
      // Remove existing listeners by cloning
      const newShareBtn = shareBtn.cloneNode(true);
      shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
      newShareBtn.addEventListener("click", () => {
        let cachedFileUri;
        fileUtils.cacheImageFromUrl(imageSrc).then((uri) => {
          cachedFileUri = uri;
          Share.share({
            title: title,
            text: `Ouvre la carte « ${title} » dans l'application Cartes IGN : https://cartes-ign.ign.fr${newsId ? `?newsid=${newsId}` : ""}`,
            url: uri,
            dialogTitle: "Partager l'image",
          }).finally(() => {
            if (cachedFileUri) {
              fileUtils.deleteCachedFile(cachedFileUri);
            }
          });
        });
      });
    }
  }

  /**
   * Setup overlay event handlers for current instance
   * @private
   */
  _setupOverlayHandlers() {
    if (!this._overlay) {
      console.warn("ImageCarousel: img-overlay element not found");
      return;
    }

    // Close button - remove old listeners and attach new one
    const closeBtn = this._overlay.querySelector("#imgOverlayClose");
    if (closeBtn) {
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      newCloseBtn.addEventListener("click", () => {
        this._closeOverlay();
      });
    }

    // Previous button - only if multiple images
    const prevBtn = this._overlay.querySelector("#imgOverlayPreviousBtn");
    if (prevBtn && !this.isSingleImage) {
      const newPrevBtn = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      newPrevBtn.addEventListener("click", () => {
        newPrevBtn.classList.add("highlight");
        this.previous();
        this._updateOverlayImage(this.getCurrentImage(), this.imageTitle, this.newsId, this.getCurrentImageCredits());
        setTimeout(() => newPrevBtn.classList.remove("highlight"), 200);
      });
    }

    // Next button - only if multiple images
    const nextBtn = this._overlay.querySelector("#imgOverlayNextBtn");
    if (nextBtn && !this.isSingleImage) {
      const newNextBtn = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
      newNextBtn.addEventListener("click", () => {
        newNextBtn.classList.add("highlight");
        this.next();
        this._updateOverlayImage(this.getCurrentImage(), this.imageTitle, this.newsId, this.getCurrentImageCredits());
        setTimeout(() => newNextBtn.classList.remove("highlight"), 200);
      });
    }
  }

  /**
   * Open overlay
   * @private
   */
  _openOverlay() {
    if (this._overlay) {
      // Setup button handlers for this instance before opening
      this._setupOverlayHandlers();
      this._overlay.classList.remove("d-none");
      Globals.backButtonState = "imageOverlay";
    }
  }

  /**
   * Close overlay
   * @private
   */
  _closeOverlay() {
    if (this._overlay) {
      this._overlay.classList.add("d-none");
      Globals.backButtonState = this.backButtonState || "newsfeed";

    }
  }
}

export default ImageCarousel;
