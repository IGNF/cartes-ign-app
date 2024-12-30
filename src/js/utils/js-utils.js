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
      console.log(delay);
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout( function(){
        callback.apply(context, args);
      }, delay);
    };
  }
};

export default jsUtils;
