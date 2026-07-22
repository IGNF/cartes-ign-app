/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Fonctions utilitaires
 */
let jsUtils = {
  // see https://grafikart.fr/tutoriels/debounce-throttle-642
  debounce(callback, delay) {
    var timer;
    return function() {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout( function(){
        callback.apply(context, args);
      }, delay);
    };
  },

  // see https://stackoverflow.com/a/73775602
  download(filename, text, mimetype="application/json") {
    var element = document.createElement("a");
    element.setAttribute("href", `data:${mimetype};charset=utf-8,` + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  },

  sortArrayByAnotherArray(arrToSort, arrReference, property) {
    arrToSort.sort( (a, b) => {
      let indexA = arrReference.findIndex( item => item === a[property] );
      let indexB = arrReference.findIndex( item => item === b[property] );
      return indexA - indexB;
    });
  },

  getSafeAreaInset(side) {
    if (!["top", "bottom", "left", "right"].includes(side)) {
      return 0;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const inset = parseFloat(rootStyles.getPropertyValue(`--safe-area-inset-${side}`).trim());
    if (Number.isFinite(inset)) {
      return inset;
    }

    // Match CSS fallback: var(--safe-area-inset-*, env(safe-area-inset-*, 0px)).
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.setProperty(
      `padding-${side}`,
      `var(--safe-area-inset-${side}, env(safe-area-inset-${side}, 0px))`
    );

    const parent = document.body ?? document.documentElement;
    parent.appendChild(probe);

    const computedInset = parseFloat(getComputedStyle(probe).getPropertyValue(`padding-${side}`));
    parent.removeChild(probe);
    return Number.isFinite(computedInset) ? computedInset : 0;
  }
};

export default jsUtils;
