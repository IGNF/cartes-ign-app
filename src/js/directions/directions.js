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
        // cf. https://project-osrm.org/docs/v5.24.0/api/#
        // ex. https://map.project-osrm.org/
        this.configuration = this.options.configuration || {
            api: "https://routing.openstreetmap.de/routed-foot/route/v1/driving/",
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
        // map
        this.map = map;
        // objet
        this.obj = new MapLibreGlDirections(this.map, this.configuration);
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
        // Les valeurs sont à retranscrire en options du service utilisé
        // - transport : ex. voiture vers l'option 'profile:driving'
        // - computation
        // - locations
        if (settings.transport) {
            // TODO mettre en place les diffrents types de profile selon le service utilisé !
            switch (settings.transport) {
                case "Pieton":
                case "Voiture":
                    this.configuration.profile = "driving";
                    break;
            
                default:
                    break;
            }
        }
        if (settings.computation) {
            // TODO mettre en place le mode calcul quand le service le permet !
        }
        if (settings.locations && settings.locations.length) {
            // les coordonnées sont en lon / lat en WGS84G
            var start = JSON.parse(settings.locations[0]);
            var end = JSON.parse(settings.locations[settings.locations.length - 1]);
            if (start && end) {
                this.obj.addWaypoint(start);
                this.obj.addWaypoint(end);
                this.map.fitBounds([start, end]); // FIXME utiliser le tracé !
            }
        }
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

        // les handler sur 
        // - le geocodage
        // - la fermeture du menu
        // - le nettoyage des ecouteurs
        function setLocation (e) {
            // on enregistre dans le DOM :
            // - les coordonnées en WGS84G soit lon / lat !
            // - la reponse du geocodage
            target.dataset.coordinates = "[" + e.detail.coordinates.lon + "," + e.detail.coordinates.lat + "]";
            target.value = e.detail.text;
            cleanListeners();
        }
        function cleanLocation (e) {
            target.dataset.coordinates = "";
            target.value = "";
            cleanListeners();
        }
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