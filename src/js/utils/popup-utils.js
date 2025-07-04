/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import MapLibreGL from "maplibre-gl";

// Mode offline
let popup = {
  popup: null
};
let editoPopup = {
  popup: null
};

function showPopup(content, map, className, closeMethodName, object) {
  // on supprime la popup
  if (object.popup) {
    object.popup.remove();
    object.popup = null;
  }

  window[closeMethodName] = () => {
    object.popup.remove();
  };

  // centre de la carte
  var center = map.getCenter();
  // position de la popup
  var popupOffsets = {
    "bottom": [0, 100],
  };
  // ouverture d'une popup
  object.popup = new MapLibreGL.Popup({
    offset: popupOffsets,
    className: className,
    closeOnClick: true,
    closeOnMove: false,
    closeButton: false
  })
    .setLngLat(center)
    .setHTML(content)
    .setMaxWidth("300px")
    .addTo(map);
  // HACK: déplacement de la popup à la racine du body pour qu'elle puisse d'afficher au dessus de tout
  var popupEl = document.querySelectorAll(`.${className}`)[0];
  document.body.appendChild(popupEl);
  document.documentElement.style.setProperty("--popup-transform", popupEl.style.transform);
}

function showOnlinePopup(content, map) {
  showPopup(content, map, "onlinePopup", "onCloseonlinePopup", popup);
}


function showEditoPopup(content, map) {
  showPopup(content, map, "editoPopup", "onCloseeditoPopup", editoPopup);
}

export default {
  showOnlinePopup,
  showEditoPopup,
  showPopup,
};
