/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";
import DOM from "./dom";
import Location from "./services/location";

import jsUtils from "./utils/js-utils";

/**
 * Barre de recherche et géocodage
 */
class Search {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      // callback
      openSearchCbk: null,
      closeSearchCbk: null,
    };

    this.autocompletion_results = [];
    // carte
    this.map = map;

    // target
    this.target = this.options.target;

    this.#addEvents();

    return this;
  }

  /**
   * ajout des évènements
   * @private
   */
  #addEvents() {
    var id = {
      searchInput: "lieuRech",
      myLoc: "myGeoLocation",
      selectOnMap: "selectOnMap",
      recentSearches: "resultsRechRecent",
      searchResults: "resultsRech",
      clearSearch: "clearSearch"
    };

    document.getElementById(id.searchInput).addEventListener("keyup", jsUtils.debounce( (event) => {
      if (event.key === "Enter" || event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        if (DOM.$resultsRechRecent.hidden) {
          DOM.$resultDiv.firstChild.click();
        } else {
          DOM.$resultsRechRecent.querySelector(".recentresult").click();
        }
      } else {
        this.#suggestAndDisplay();
      }
    }, 300));

    document.getElementById(id.searchInput).addEventListener("textInput", jsUtils.debounce(() => {
      setTimeout( () => {
        this.#suggestAndDisplay();
      }, 100);
    }, 300));

    document.getElementById(id.searchInput).addEventListener("click", () => {
      DOM.$resultDiv.hidden = true;
      DOM.$resultDiv.innerHTML = "";
      if (Globals.searchResultMarker != null) {
        Globals.searchResultMarker.remove();
        Globals.searchResultMarker = null;
      }
    });

    document.getElementById(id.selectOnMap).addEventListener("click", (e) => {
      if (Globals.backButtonState === "searchDirections") {
        e.target.classList.add("autocompresultselected");
        setTimeout(() => {
          Globals.menu.open("selectOnMapDirections");
        }, 250);
      } else if (Globals.backButtonState === "searchIsochrone") {
        e.target.classList.add("autocompresultselected");
        setTimeout(() => {
          Globals.menu.open("selectOnMapIsochrone");
        }, 250);
      } else if (Globals.backButtonState === "searchLandmark") {
        e.target.classList.add("autocompresultselected");
        setTimeout(() => {
          Globals.menu.open("selectOnMapLandmark");
        }, 250);
      }
    }, true);

    document.getElementById(id.myLoc).addEventListener("click", (e) => {
      DOM.$rech.value = "Ma position";
      e.target.classList.add("autocompresultselected");
      if (Globals.backButtonState === "searchDirections") {
        setTimeout(() => {
          this.hide();
          Globals.menu.open("directions");
        }, 250);
      } else if (Globals.backButtonState === "searchIsochrone") {
        setTimeout(() => {
          this.hide();
          Globals.menu.open("isochrone");
        }, 250);
      } else if (Globals.backButtonState === "searchLandmark") {
        setTimeout(() => {
          this.hide();
          Globals.menu.open("landmark");
        }, 250);
      } else {
        setTimeout(() =>{
          this.hide();
        }, 250);
      }
      // on realise une geolocalisation
      Location.getLocation()
        .then((result) => {
          Location.moveTo(result.coordinates, Globals.map.getZoom(), true, true);
        }, true);
    });
    document.getElementById(id.clearSearch).addEventListener("click", () => {
      DOM.$rech.value = "";
      if (Globals.searchResultMarker != null) {
        Globals.searchResultMarker.remove();
        Globals.searchResultMarker = null;
      }
    });

    document.getElementById(id.searchInput).addEventListener("focus", function () {
      if (Globals.backButtonState === "default") {
        Globals.search.show();
      }
    });
  }

  #suggestAndDisplay() {
    if (DOM.$rech.value !== ""){
      let resultStr = "";
      this.suggest().then( () => {
        if (this.autocompletion_results.length > 0){
          for (let i = 0 ; i < this.autocompletion_results.length; i++) {
            resultStr += this.computeAutocompResultHTML(this.autocompletion_results[i]);
          }
          DOM.$resultDiv.innerHTML = resultStr;
          DOM.$resultDiv.hidden = false;
          DOM.$resultsRechRecent.hidden = true;
        }
      }).catch( (err) => {
        if (err.name === "AbortError") {
          return;
        }
      });
    } else if (DOM.$rech.value === "") {
      DOM.$resultsRechRecent.hidden = false;
      DOM.$resultDiv.hidden = true;
      DOM.$resultDiv.innerHTML = "";
    }
  }

  /**
   *  Autocompletion
   *  @private
   */
  async suggest() {
    /**
     * Ajoute des suggestions en dessous de la barre de recherche en fonction de ce qui est tapé
     * à l'aide de look4
     */
    Globals.controller.abort();
    Globals.controller = new AbortController();
    Globals.signal = Globals.controller.signal;
    let location = DOM.$rech.value;
    let url = new URL("https://data.geopf.fr/geocodage/completion");
    let params = {
      type: "StreetAddress,PositionOfInterest",
      maximumResponses: 10,
      text: location,
    };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    let signal = Globals.signal;
    let responseprom = await fetch(url, {signal});
    let response = await responseprom.json();
    if (response.status !== "OK") {
      return;
    }
    this.autocompletion_results = [];
    for (let i = 0 ; i < response.results.length; i++) {
      let elem = response.results[i];
      let splitedText = this.computeLocationFullText(elem).split(",");
      let city = "";
      if (splitedText.length > 1){
        city = splitedText[1].trim();
      } else {
        city = elem.poiType.slice(-1)[0].charAt(0).toUpperCase() + elem.poiType.slice(-1)[0].slice(1);
      }
      this.autocompletion_results.push({
        fulltext: this.computeLocationFullText(elem),
        firsttext: splitedText[0],
        city: city,
        lng: elem.x,
        lat: elem.y,
      });
    }
    const coordResult = this.#computeCoordsSearch(location);
    if (coordResult.coord) {
      this.autocompletion_results.push({
        fulltext: coordResult.coord + ", Coordonnées",
        firsttext: coordResult.coord,
        city: "Coordonnées",
        lng: coordResult.lon,
        lat: coordResult.lat,
      });
    }
    // Seulement les valeurs uniques
    this.autocompletion_results = this.autocompletion_results
      .filter((val, idx, s) => s.indexOf(val) === idx)
      .slice(0,9);
  }

  /**
   * Fonction récupérée de look4. Permet de repérer des coordonnées à partir du texte en entrée. Renvoie un objet de type position
   *
   * @param inputRequest {String} texte en entrée
   */

  #computeCoordsSearch(inputRequest) {
    var toparse = inputRequest;
    /*
      Transformation string en objet position
      - support degrès décimaux et sexa en °'" et dms
      - par défault lat puis lon sauf si une coordonnée est suffixée d'un point cardianal (NSEOnseoWw)
    */

    toparse = toparse.toLowerCase();
    toparse = toparse.replace("coordonnées : ", "");

    var tryparse = function (toparse) {
      var lat, lon;

      if (toparse.match(/[d°]/) === null || toparse.match(/[d°]/g).length != 2) {
        toparse = toparse.replace(/(-?[0-9.]+)[ ]*[d°]?/g, "$1°");
      }

      // DMS
      toparse = toparse.replace("d", "°");
      toparse = toparse.replace("m", "'");
      toparse = toparse.replace("s", "\"");
      toparse = toparse.replace("w", "o");
      toparse = toparse.replace(/ +/g, "");

      var parts = toparse.match(/-?[0-9]+\.?[0-9]*[°'"]?/g);
      if (!parts) {
        // si rien ne match, on sort
        return {};
      }
      var coord = [200.0, 200.0];
      var sign = [1, 1];
      var ind = -1;
      parts.forEach(function(part) {
        if (part.match("°") !== null) {
          ind++;
          coord[ind] = parseFloat(part.replace("°", ""));
          if (coord[ind] < 0) {
            sign[ind] = -1;
            coord[ind] *= -1;
          }
        } else if (part.match("'") !== null) {
          coord[ind] += parseFloat(part.replace("'", "")) / 60;
        } else if (part.match("\"") !== null) {
          coord[ind] += parseFloat(part.replace("\"", "")) / 3600;
        }
      });
      var sens = true; //lat lon
      parts = toparse.match(/°[^nseo°]*([nseo]?)/g);
      if (parts !== null) {
        if (parts.length != 2) {
          return {};
        }
        if (parts[0].match(/[ns]/) !== null) {
          if (parts[0].match("s") !== null) {
            sign[0] = -1;
          }
        } else if (parts[0].match(/[eo]/) !== null) {
          sens = false;
          if (parts[0].match("o") !== null) {
            sign[0] = -1;
          }
        }
        if (parts[1].match(/[ns]/) !== null) {
          sens = false;
          if (parts[1].match("s") !== null) {
            sign[1] = -1;
          }
        } else if (parts[1].match(/[eo]/) !== null) {
          if (parts[1].match("o") !== null) {
            sign[1] = -1;
          }
        }
      }

      if (coord[0] == 200 || coord[1] == 200) {
        return {};
      }

      if (sens) {
        lat = coord[0] * sign[0];
        lon = coord[1] * sign[1];
      } else {
        lon = coord[0] * sign[0];
        lat = coord[1] * sign[1];
      }

      if (lat > 90 || lat < -90) {
        return {};
      }
      if (lon > 180 || lon < -180) {
        return {};
      }
      return { lat: lat, lon: lon };
    };

    var coord = {};
    coord = tryparse(toparse);

    if (coord.lat === undefined || coord.lon === undefined) {
      coord = tryparse(toparse.replace(/\./g, " ").replace(/,/g, "."));
    }
    if (coord.lat === undefined || coord.lon === undefined) {
      return {};
    }
    var lat = coord.lat;
    var lon = coord.lon;
    var str = lat + " " + lon; //str = lat lon en décimal pour compatibilité Google
    return { coord: str, lon: lon, lat: lat };
  }


  /**
   * Retourne le texte complet du resultat de l'autocompletion
   * @param {*} locationResult
   * @returns
   * @public
   */
  computeLocationFullText(locationResult) {
    return locationResult.fulltext;
  }

  /**
   * calcule l'affichage d'un résultat d'autocompletion
   * @public
   */
  computeAutocompResultHTML(autocompresult) {
    return `<p class="autocompresult" fulltext="${autocompresult.fulltext}" data-coordinates='{"lon":${autocompresult.lng},"lat":${autocompresult.lat}}'>
    ${autocompresult.firsttext}<br/>
    <em class='autocompcity'>${autocompresult.city}</em></p>
    ` ;
  }

  /**
   * affiche le menu
   * @public
   */
  show() {
    if (this.options.openSearchCbk) {
      this.options.openSearchCbk();
    }
  }

  /**
   * ferme le menu
   * @public
   */
  hide() {
    if (this.options.closeSearchCbk) {
      this.options.closeSearchCbk();
    }
  }

  /**
   * clean des resultats
   * @public
   */
  clear() {
    this.autocompletion_results = [];
  }

}

export default Search;
