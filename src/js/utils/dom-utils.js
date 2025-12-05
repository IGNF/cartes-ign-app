/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Fonctions utilitaires
 */
let domUtils = {
  stringToHTML: (str) => {

    var support = function () {
      if (!window.DOMParser) return false;
      var parser = new DOMParser();
      try {
        parser.parseFromString("x", "text/html");
      } catch (err) {
        return false;
      }
      return true;
    };

    // If DOMParser is supported, use it
    if (support()) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(str, "text/html");
      return doc.body.firstChild;
    }

    // Otherwise, fallback to old-school method
    var dom = document.createElement("div");
    dom.innerHTML = str;
    return dom;

  },

  horizontalParentScrollend: (event) => {
    var maxScrollLeft = event.target.scrollWidth - event.target.clientWidth;
    var reverseScrollArrow = function () {
      if (event.target.scrollLeft <= maxScrollLeft - 10) {
        event.target.lastElementChild.classList.remove("reverse");
        event.target.removeEventListener("scroll", reverseScrollArrow);
      }
    };
    if (event.target.scrollLeft >= maxScrollLeft - 10) {
      event.target.lastElementChild.classList.add("reverse");
      event.target.addEventListener("scroll", reverseScrollArrow);
    }
  },

  horizontalParentScroll: (event, scrollRatio = 0.8) => {
    var maxScrollLeft = event.target.parentElement.scrollWidth - event.target.parentElement.clientWidth;
    if (event.target.parentElement.scrollLeft >= maxScrollLeft - 10) {
      event.target.parentElement.scrollTo({
        left: 0,
        top: 0,
        behavior : "smooth",
      });
      return;
    }
    var scrollByValue = Math.min(event.target.parentElement.offsetWidth * scrollRatio, maxScrollLeft - event.target.parentElement.scrollLeft);
    event.target.parentElement.scrollBy({
      left: scrollByValue,
      top: 0,
      behavior : "smooth",
    });
  },

  horizontalParentScrollLeft: (event, scrollRatio = 0.8) => {
    var maxScrollLeft = event.target.parentElement.scrollWidth - event.target.parentElement.clientWidth;
    if (event.target.parentElement.scrollLeft <= 10) {
      event.target.parentElement.scrollTo({
        left: maxScrollLeft,
        top: 0,
        behavior : "smooth",
      });
      return;
    }
    var scrollByValue = Math.min(event.target.parentElement.offsetWidth * scrollRatio, event.target.parentElement.scrollLeft);
    event.target.parentElement.scrollBy({
      left: scrollByValue * -1,
      top: 0,
      behavior : "smooth",
    });
  }

};

export default domUtils;
