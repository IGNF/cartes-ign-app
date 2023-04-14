import * as Autocomp from './autocomplete';
import DOM from './dom';
import Globals from './globals';

const map = Globals.map;

/* Recherche et positionnnement */
function cleanResults() {
  /**
   * Enlève le marqueur adresse
   */
  if (Globals.adressMarkerLayer != null) {
    map.removeLayer(Globals.adressMarkerLayer);
    Globals.adressMarkerLayer = null;
  }
}


async function rechercheEtPosition(text) {
  /**
   * Recherche un texte et le géocode à l'aide de look4, puis va à sa position en ajoutant un marqueur
   */
  let url = new URL("https://wxs.ign.fr/calcul/geoportail/geocodage/rest/0.1/completion");
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

  DOM.$rech.value = Autocomp.computeLocationFullText(geocode_result);

  let coords = {
    lat: geocode_result.y,
    lon: geocode_result.x
  };
  _goToAddressCoords(coords, 14);
}

function _goToAddressCoords(coords, zoom=map.getZoom(), panTo=true) {
  /**
   * Ajoute un marqueur de type adresse à la position définie par le coods, et déplace la carte au zoom demandé
   * si panTo est True
   */
  cleanResults();
  Globals.adressMarkerLayer = L.featureGroup().addTo(map);
  let markerLayer = L.featureGroup([L.marker(
    [coords.lat, coords.lon],
    {
      icon:	Globals.gpMarkerIcon2
    }
  )]);

  Globals.adressMarkerLayer.addLayer(markerLayer);
  if (panTo) {
    Globals.movedFromCode = true;
    map.setView(new L.LatLng(coords.lat, coords.lon), zoom);
    Globals.movedFromCode = false;
  }
}

export {
  cleanResults,
  rechercheEtPosition
}
