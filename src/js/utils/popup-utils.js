import MapLibreGL from "maplibre-gl";

// Mode offline
let popup = null;
function showOnlinePopup(content, map) {
  // on supprime la popup
  if (popup) {
    popup.remove();
    popup = null;
  }

  window.onCloseonlinePopup = () => {
    popup.remove();
  };

  // centre de la carte
  var center = map.getCenter();
  // position de la popup
  var popupOffsets = {
    "bottom": [0, 100],
  };
  // ouverture d'une popup
  popup = new MapLibreGL.Popup({
    offset: popupOffsets,
    className: "onlinePopup",
    closeOnClick: true,
    closeOnMove: true,
    closeButton: false
  })
    .setLngLat(center)
    .setHTML(content)
    .setMaxWidth("300px")
    .addTo(map);
  // HACK: déplacement de la popup à la racine du body pour qu'elle puisse d'afficher au dessus de tout
  var popupEl = document.querySelectorAll(".onlinePopup")[0];
  document.body.appendChild(popupEl);
}

function showEditoPopup(content, map) {
  let editoPopup;
  window.onCloseeditoPopup = () => {
    editoPopup.remove();
  };

  // centre de la carte
  var center = map.getCenter();
  // position de la popup
  var popupOffsets = {
    "bottom": [0, 100],
  };
  // ouverture d'une popup
  editoPopup = new MapLibreGL.Popup({
    offset: popupOffsets,
    className: "editoPopup",
    closeOnClick: true,
    closeOnMove: true,
    closeButton: false
  })
    .setLngLat(center)
    .setHTML(content)
    .setMaxWidth("300px")
    .addTo(map);
  // HACK: déplacement de la popup à la racine du body pour qu'elle puisse d'afficher au dessus de tout
  var popupEl = document.querySelectorAll(".editoPopup")[0];
  document.body.appendChild(popupEl);
}

export default {
  showOnlinePopup,
  showEditoPopup,
};
