import maplibregl from "maplibre-gl";

import DOM from "../dom";
import Globals from "../globals";
import RecentSearch from "../search-recent";

/**
 * Interface pour les evenements
 * @example
 * target.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
 * target.addEventListener("myEvent", handler);
 */
const target = new EventTarget();

/**
 * supprime le marker de la recherche
 */
function clean() {
  if (Globals.searchResultMarker != null) {
    Globals.searchResultMarker.remove();
    Globals.searchResultMarker = null;
  }
}

/**
 * deplacement sur la carte
 * @param {*} coords
 * @param {*} zoom
 * @param {*} panTo
 */
function moveTo(coords, zoom=Globals.map.getZoom(), panTo=true) {
  /**
   * Ajoute un marqueur de type adresse à la position définie par le coods, et déplace la carte au zoom demandé
   * si panTo est True
   */
  clean();
  Globals.searchResultMarker = new maplibregl.Marker({element: Globals.searchResultIcon, anchor: "bottom"})
    .setLngLat([coords.lon, coords.lat])
    .addTo(Globals.map);

  Globals.searchResultIcon.addEventListener("click", clean);

  if (panTo) {
    Globals.map.flyTo({center: [coords.lon, coords.lat], zoom: zoom});
  }
}

/**
 * recherche
 * @param {*} text
 * @param {*} coords
 * @returns
 * @fire search
 */
async function search (text, coords, save = true) {
  /**
   * Recherche un texte et le géocode à l'aide de look4,
   * puis va à sa position en ajoutant un marqueur
   */
  if (text === "") {
    return;
  }
  if (save) {
    RecentSearch.add({
      text: text,
      coordinates: {
        lat: coords.lat,
        lon: coords.lon
      }
    });
  }
  DOM.$rech.value = text;
  const geocode_result = {
    fulltext: text,
    y: coords.lat,
    x: coords.lon
  };

  target.dispatchEvent(
    new CustomEvent("search", {
      bubbles: true,
      detail: {
        text : geocode_result.fulltext,
        coordinates: {
          lat: geocode_result.y,
          lon: geocode_result.x
        }
      }
    })
  );

  return {
    lat: geocode_result.y,
    lon: geocode_result.x
  };
}

/**
 * recherche et deplacement sur la carte
 * @param {*} text
 */
async function searchAndMoveTo(text, coord = null, save = true) {
  var coords = await search(text, coord, save);
  moveTo(coords, 14);
}

export default {
  target,
  moveTo,
  search,
  searchAndMoveTo,
};
