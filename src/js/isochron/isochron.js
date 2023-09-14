import IsochronDOM from "./isochron-dom";
import MenuDisplay from "../menu-display";
import DOM from "../dom";

/**
 * Interface sur le contrôle isochrone
 * @module Isochron
 * @todo ajouter les fonctionnalités : cf. DOM
 */
class Isochron {
    /**
     * constructeur
     * @constructs
     * @param {*} map 
     * @param {*} options 
     */
    constructor (map, options) {
        this.options = options || {
            target : null
        };

        // target
        this.target = this.options.target;

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
        var target = this.target || DOM.$isochronWindow;
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
     * requête au service
     * @param {*} settings
     * @public
     */
    compute (settings) {
        console.log(settings);
        // nettoyage de l'ancien parcours !
        this.clear();
        // Les valeurs sont à retranscrire en options du service utilisé
        // - transport
        // - type : distance ou temps
        // - location
        if (settings.transport) {
            // TODO mettre en place les differents types de profile !
            switch (settings.transport) {
                case "Pieton":
                case "Voiture":
                    break;
            
                default:
                    break;
            }
        }
        if (settings.type) {
            // TODO mettre en place le mode calcul !
            switch (settings.type) {
                case "Distance":
                    break;
                case "Temps":
                    break;
            
                default:
                    break;
            }
        }
        if (settings.location) {
            try {
                // les coordonnées sont en lon / lat en WGS84G
                var point = JSON.parse(settings.location);
                if (point) {
                    // TODO...
                }
            } catch (e) {
                // catching des exceptions JSON
                console.error(e);
                return;
            }
        }

        // TODO ...
    }

    /**
     * activation du mode interaction
     * @param {*} status 
     * @public
     */
    interactive (status) {
        // TODO...
    }

    /**
     * nettoyage du tracé
     * @public
     */
    clear () {
        // TODO...
    }

}

// mixins
Object.assign(Isochron.prototype, IsochronDOM);

export default Isochron;