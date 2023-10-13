import DirectionsResultsDOM from "./directions-results-dom";
import Globals from "../globals";

/**
 * Interface sur les resultats du calcul d'itineraire
 * @module DirectionsResults
 * @todo ajouter les fonctionnalités : cf. DOM
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
            instructions : []
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

}

// mixins
Object.assign(DirectionsResults.prototype, DirectionsResultsDOM);

export default DirectionsResults;