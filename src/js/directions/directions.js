import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
import DirectionsDOM from "./directionsDOM";

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
}

// mixins
Object.assign(Directions.prototype, DirectionsDOM);

export default Directions;