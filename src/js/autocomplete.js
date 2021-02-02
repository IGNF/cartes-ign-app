import DOM from './dom';
import Globals from './globals';

/* Autocompletion */
async function suggest() {
  /**
   * Ajoute des suggestions en dessous de la barre de recherche en fonction de ce qui est tapé
   * à l'aide de look4
   */
  Globals.controller.abort();
  Globals.controller = new AbortController();
  Globals.signal = Globals.controller.signal;
  let location = DOM.$rech.value;
  let url = new URL("https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/look4/user/search");
  let params =
      {
        indices: "locating",
        method: "prefix",
        types: "address,position,toponyme,w3w",
        nb: 15,
        "match[fulltext]": location,
      };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  let signal = Globals.signal;
  let responseprom = await fetch(url, {signal});
  let response = await responseprom.json()
  Globals.autocompletion_results = [];
  for (let i = 0 ; i < response.features.length; i++) {
    let elem = response.features[i];
    Globals.autocompletion_results.push(computeLocationFullText(elem));
  }
  // Seulement les valeurs uniques
  Globals.autocompletion_results = Globals.autocompletion_results
    .filter((val, idx, s) => s.indexOf(val) === idx)
    .slice(0,5);
}

function computeLocationFullText(locationResult) {
  var properties = locationResult.properties;
  var fullText = "";

  if (properties._type === "position" && properties.coord) {
      fullText = "Coordonnées : " + properties.coord;
  } else if (properties._type === "w3w" && properties.w3w) {
      fullText = "what3words : " + properties.w3w;
  } else {
      if (properties.nyme) {
          fullText += properties.nyme + ", ";
      }
      if (properties.street) {
          fullText += properties.number + " " + properties.street + ", ";
      }
      fullText += properties.postalCode + " " + properties.city;
  }

  return fullText;
}

export {
  suggest,
  computeLocationFullText
}