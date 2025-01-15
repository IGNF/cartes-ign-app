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
  }
};

export default jsUtils;
