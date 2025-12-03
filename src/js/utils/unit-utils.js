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
  convertDistance (distance, precision=1) {
    var d = "";
    const factor = 10 ** precision;
    var distanceKm = Math.round((factor * distance / 1000)) / factor;

    if (distanceKm < 1) {
      d = Math.round(distance) + " m"; // arrondi !
    } else {
      if (distanceKm > 100) {
        distanceKm = Math.round(distanceKm);
      }
      d = distanceKm.toLocaleString() + " km";
    }

    return d;
  },

  /**
   * convert seconds to time : HH:MM:SS
   * @param {Number} duration - duration in seconds
   * @returns {String} time in hours/minutes/seconds
   * @private
   */
  convertSecondsToTime (duration, secondsWanted=false, format="HH h MM min SS s") {
    var time = "";
    var timeDots = "";

    duration = Math.round(duration);
    var hours = Math.floor(duration / (60 * 60));

    var divisor4minutes = duration % (60 * 60);
    var minutes = Math.floor(divisor4minutes / 60);

    var divisor4seconds = divisor4minutes % 60;
    var seconds = Math.ceil(divisor4seconds);
    if (!seconds) {
      seconds = 0;
    }

    if (hours) {
      time = hours + "h ";
      timeDots = (hours < 10 ? "0" + hours : hours) + ":";
    }
    time += minutes + " min";
    timeDots += (minutes < 10 ? "0" + minutes : minutes);
    if (secondsWanted) {
      time += " " + seconds + " s";
      timeDots += ":" + (seconds < 10 ? "0" + seconds : seconds);
    }
    if (format === "HH:MM:SS") {
      return timeDots;
    }
    return time;
  }

};

export default utils;
