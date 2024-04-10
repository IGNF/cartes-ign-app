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
}

export default {
  showOnlinePopup,
};
