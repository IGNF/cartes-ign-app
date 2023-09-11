import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
import DirectionsDOM from "./directionsDOM";

import MenuDisplay from "../menu-display";
import Geocode from "../geocode";

class Directions {
    /**
     * constructeur
     * @param {*} map 
     * @param {*} options 
     */
    constructor (map, options) {
        this.options = options || {
            target : null,
            configuration : {},
            style : {} // TODO
        };

        // TODO style
        // cf. https://maplibre.org/maplibre-gl-directions/#/examples/restyling

        // configuration du service
        var configuration = this.options.configuration || {
            api: "https://router.project-osrm.org/route/v1",
            profile: "driving",
            requestOptions: {},
            requestTimeout: null,
            makePostRequest: false,
            sourceName: "maplibre-gl-directions",
            pointsScalingFactor: 1,
            linesScalingFactor: 1,
            sensitiveWaypointLayers: [
                "maplibre-gl-directions-waypoint", 
                "maplibre-gl-directions-waypoint-casing"
            ],
            sensitiveSnappointLayers: [
                "maplibre-gl-directions-snappoint", 
                "maplibre-gl-directions-snappoint-casing"
            ],
            sensitiveRoutelineLayers: [
                "maplibre-gl-directions-routeline", 
                "maplibre-gl-directions-routeline-casing"
            ],
            sensitiveAltRoutelineLayers: [
                "maplibre-gl-directions-alt-routeline", 
                "maplibre-gl-directions-alt-routeline-casing"
            ],
            dragThreshold: 10,
            refreshOnMove: false,
            bearings: false
        };

        // objet
        this.obj = new MapLibreGlDirections(map, configuration);
        // sans interaction par défaut !
        this.obj.interactive = false;
        // rendu graphique
        this.render();
    }

    /**
     * creation de l'interface
     * @public
     */
    render () {
        var target = this.options.target || document.getElementById("directionsWindow");
        if (!target) {
            console.warn();
            return;
        }

        var container = this.getContainer();
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
        // TODO
        // Les valeurs sont à retranscrire en param du service
        // - transport : ex. voiture vers profile driving
        // - computation : fastest vers ???
        // - locations : coordinates vers waypoints
    }

    /**
     * activation du mode interaction
     * @param {*} status 
     * @public
     */
    interactive (status) {
        this.obj.interactive = status;
    }

    /**
     * nettoyage du tracé
     * @public
     */
    clear () {
        this.obj.clear();
    }

    //////////////////////////////////////////
    // listeners dom / contrôle search
    /////////////////////////////////////////
    onOpenSearchDirections (e) {
        // on ouvre le menu
        MenuDisplay.openSearchDirections();
        // on procede à un nettoyage des resultats déjà selectionnés
        var selected = document.getElementsByClassName("autocompresultselected");
        for (let index = 0; index < selected.length; index++) {
            const element = selected[index];
            element.className = "autocompresult";
        }
        // on transmet d'où vient la demande de location : 
        // - point de départ,
        // - arrivée,
        // - étape
        var target = e.target;

        // handler sur le geocodage
        function setLocation (e) {
            // on enregistre dans le DOM :
            // - les coordonnées 
            // - la reponse du geocodage
            target.dataset.coordinates = "[" + e.detail.coordinates.lat + "," + e.detail.coordinates.lon + "]";
            target.value = e.detail.text;
            cleanListeners();
        }
        // handler sur la fermeture du menu
        function cleanLocation (e) {
            target.dataset.coordinates = "";
            target.value = "";
            cleanListeners();
        }
        // handler sur le nettoyage des ecouteurs
        function cleanListeners () {
            closeSearchDirections.removeEventListener("click", cleanLocation);
            Geocode.target.removeEventListener("search", setLocation)
        }

        // abonnement au geocodage
        Geocode.target.addEventListener("search", setLocation);

        // abonnement au bouton de fermeture du menu
        var closeSearchDirections = document.getElementById("closeSearch");
        if (closeSearchDirections) {
            closeSearchDirections.addEventListener("click", cleanLocation);
        }
    }

}

// mixins
Object.assign(Directions.prototype, DirectionsDOM);

export default Directions;