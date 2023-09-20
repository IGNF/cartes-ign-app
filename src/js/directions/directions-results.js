import DirectionsResultsDOM from "./directions-results-dom";
import MenuDisplay from "../menu-display";

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
        MenuDisplay.openResultsDirections();
    }

    /**
     * ferme le menu des résultats du calcul
     * @public
     */
    hide () {
        MenuDisplay.closeResultsDirections();
    }

}

// mixins
Object.assign(DirectionsResults.prototype, DirectionsResultsDOM);

export default DirectionsResults;