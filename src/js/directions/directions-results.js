import DirectionsResultsDOM from "./directions-results-dom";
import Globals from "../globals";

/**
 * Interface sur les resultats du calcul d'itineraire
 * @module DirectionsResults
 */
class DirectionsResults {
  /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
  constructor (map, target, options) {
    this.options = options || {
      duration : "",
      distance : "",
      transport : "",
      computation : "",
      instructions : [] // [ routes[0].legs ] : [distance, duration, [steps], summary]
    };

    // target
    this.target = target;

    // carte
    this.map = map;

    // rendu graphique
    this.render();

    return this;
  }

  /**
   * creation de l'interface
   * @public
   */
  render () {
    var target = this.target || document.getElementById("directionsResultsWindow");
    if (!target) {
      console.warn();
      return;
    }

    var container = this.getContainer(this.options);
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
  }

  /**
     * affiche le menu des résultats du calcul
     * @public
     */
  show () {
    Globals.menu.open("directionsResults");
  }

  /**
     * ferme le menu des résultats du calcul
     * @public
     */
  hide () {
    Globals.menu.close("directionsResults");
  }

  /**
     * listener issu du dom sur la visualisation des détails du parcours
     * @param {*} e
     * @fixme trouver une solution full css !
     */
  toggleDisplayDetails(e) {
    // INFO
    // l'affichage ne peut pas être realisé en CSS only
    // (car ils ne sont pas issus du même parent)
    // input[id="directionsShowDetail"]:checked + label + #directionsListDetails {
    //     display: block;
    // }
    var div = document.getElementById("directionsListDetails");
    if (e.target.checked) {
      div.style.display = "flex";
      Globals.currentScrollIndex = 2;
      Globals.menu.updateScrollAnchors();
    } else {
      div.style.display = "none";
    }
  }

}

// mixins
Object.assign(DirectionsResults.prototype, DirectionsResultsDOM);

export default DirectionsResults;
