import Globals from "./globals";
import DOM from "./dom";
import Location from "./services/location";
import State from "./state";

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
      closeSearch: "closeSearch"
    };

    document.getElementById(id.searchInput).addEventListener("keyup", (event) => {
      if (event.key === "Enter" || event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        DOM.$resultDiv.firstChild.click();
      } else if (DOM.$rech.value !== ""){
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
    });

    document.getElementById(id.searchInput).addEventListener("click", () => {
      DOM.$rech.value = "";
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
    document.getElementById(id.closeSearch).addEventListener("click", () => {
      State.onBackKeyDown();
    });

    document.getElementById(id.searchInput).addEventListener("focus", function () {
      if (Globals.backButtonState === "default") {
        Globals.search.show();
      }
    });
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
    let params =
        {
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
        city: city
      });
    }
    // Seulement les valeurs uniques
    this.autocompletion_results = this.autocompletion_results
      .filter((val, idx, s) => s.indexOf(val) === idx)
      .slice(0,9);
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
    return `<p class='autocompresult' fulltext='${autocompresult.fulltext}'>
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
    DOM.$resultsRechRecent.hidden = false;
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
