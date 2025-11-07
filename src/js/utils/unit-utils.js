/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Fonctions utilitaires
 */
let utils = {
  /**
   * convert distance in meters or kilometers
   * @param {Number} distance - distance in meters
   * @returns {String} distance in km
   * @private
   */
  convertDistance (distance) {
    var d = "";

    var distanceKm = Math.round(10 * distance / 1000) / 10;
    if (distanceKm < 1) {
      d = Math.round(distance) + " m"; // arrondi !
    } else {
      if (distanceKm > 100) {
        distanceKm = Math.round(distanceKm);
      }
      d = distanceKm + " km";
    }

    return d;
  },

  /**
   * convert seconds to time : HH:MM:SS
   * @param {Number} duration - duration in seconds
   * @returns {String} time in hours/minutes/seconds
   * @private
   */
  convertSecondsToTime (duration, secondsWanted=false) {
    var time = "";

    duration = Math.round(duration);
    var hours = Math.floor(duration / (60 * 60));

    var divisor4minutes = duration % (60 * 60);
    var minutes = Math.floor(divisor4minutes / 60);

    var divisor4seconds = divisor4minutes % 60;
    var seconds = Math.ceil(divisor4seconds);
    if (!seconds) {
      seconds = "00";
    }

    if (hours) {
      time = hours + "h ";
    }
    time += minutes + " min";
    if (secondsWanted) {
      time += " " + seconds + " s";
    }
    return time;
  }

};

export default utils;
