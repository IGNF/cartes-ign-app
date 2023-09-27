import Globals from './globals';
import DOM from './dom';
import Location from './location';
import Geocode from './geocode';
import MenuDisplay from './menu-display';

/**
 * Barre de recherche et géocodage
 *
 * @todo impl. la redirection vers sms
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
      recentSearches: "resultsRechRecent",
      searchResults: "resultsRech",
    };

    // ajout des listeners
    // Recherche du 1er résultat de l'autocomplétion si appui sur entrée
    document.getElementById(id.searchInput).addEventListener("keyup", (event) => {
      if (event.key === 'Enter' || event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        DOM.$resultDiv.hidden = true;
        DOM.$resultDiv.innerHTML = "";
        Geocode.searchAndMoveTo(DOM.$rech.value);
        this.hide();
      } else if (DOM.$rech.value !== ""){
        let resultStr = "";
        this.suggest().then( () => {
          if (this.autocompletion_results.length > 0){
            for (let i = 0 ; i < this.autocompletion_results.length; i++) {
              resultStr += `<p class='autocompresult' fulltext='${this.autocompletion_results[i].fulltext}'>
              <em class='autocompkind'>${this.autocompletion_results[i].kind}</em><br/>
              ${this.autocompletion_results[i].fulltext} </p>` ;
            }
            DOM.$resultDiv.innerHTML = resultStr;
            DOM.$resultDiv.hidden = false;
          }
        });
      } else if (DOM.$rech.value === "") {
        DOM.$resultDiv.hidden = true;
        DOM.$resultDiv.innerHTML = "";
      }
    });

    document.getElementById(id.searchInput).addEventListener("click", () => {
      DOM.$rech.value = "";
      DOM.$resultDiv.hidden = true;
      DOM.$resultDiv.innerHTML = "";
    });

    // on clique sur "Ma position"
    document.getElementById(id.myLoc).addEventListener("click", (e) => {
    // on realise une geolocalisation
    Location.getLocation()
      .then((result) => {
        DOM.$rech.value = "Ma position";
        if (Globals.backButtonState === "searchDirections") {
          setTimeout(MenuDisplay.openDirections, 150);
        } else if (Globals.backButtonState === "searchIsochrone") {
          setTimeout(MenuDisplay.openIsochrone, 150);
        } else {
          Location.moveTo(result.coordinates, Globals.map.getZoom(), true, false);
          setTimeout(MenuDisplay.searchScreenOff, 150);
        }
      });
    }, true);
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
    let url = new URL("https://wxs.ign.fr/calcul/geoportail/geocodage/rest/0.1/completion");
    let params =
        {
          type: "StreetAddress,PositionOfInterest",
          maximumResponses: 10,
          text: location,
        };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    let signal = Globals.signal;
    let responseprom = await fetch(url, {signal});
    let response = await responseprom.json()
    this.autocompletion_results = [];
    for (let i = 0 ; i < response.results.length; i++) {
      let elem = response.results[i];
      let kind = elem.kind;
      if (kind === null) {
        kind = "adresse";
      }
      this.autocompletion_results.push({
        fulltext: this.computeLocationFullText(elem),
        kind: kind
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
    this.autocompletion_results = []
  }

}

export default Search;
