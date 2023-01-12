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
  let url = new URL("https://wxs.ign.fr/calcul/geoportail/geocodage/rest/0.1/completion");
  let params =
      {
        type: "StreetAddress,PositionOfInterest",
        maximumResponses: 5,
        text: location,
      };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  let signal = Globals.signal;
  let responseprom = await fetch(url, {signal});
  let response = await responseprom.json()
  Globals.autocompletion_results = [];
  for (let i = 0 ; i < response.results.length; i++) {
    let elem = response.results[i];
    Globals.autocompletion_results.push(computeLocationFullText(elem));
  }
  // Seulement les valeurs uniques
  Globals.autocompletion_results = Globals.autocompletion_results
    .filter((val, idx, s) => s.indexOf(val) === idx)
    .slice(0,5);
}

function computeLocationFullText(locationResult) {
  return locationResult.fulltext;
}

export {
  suggest,
  computeLocationFullText
}
