import maplibregl from "maplibre-gl";

import DOM from '../dom';
import Globals from '../globals';

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
    Globals.searchResultMarker.remove()
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
 * @returns
 * @fire search
 */
async function search (text) {
  /**
   * Recherche un texte et le géocode à l'aide de look4,
   * puis va à sa position en ajoutant un marqueur
   */
  let url = new URL("https://data.geopf.fr/geocodage/completion");
  let params =
      {
        type: "StreetAddress,PositionOfInterest",
        maximumResponses: 1,
        text: text,
      };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  let responseprom = await fetch(url);
  let response = await responseprom.json()

  let geocode_result = response.results[0];

  DOM.$rech.value = Globals.search.computeLocationFullText(geocode_result);

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
async function searchAndMoveTo(text) {
  var coords = await search(text);
  moveTo(coords, 14);
}

export default {
  target,
  moveTo,
  search,
  searchAndMoveTo,
}
