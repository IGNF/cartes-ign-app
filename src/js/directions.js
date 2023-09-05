// import maplibregl from "maplibregl";
import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";

class Directions {
    /**
     * constructeur
     * @param {*} map 
     * @param {*} options 
     */
    constructor (map, options) {
        this.options = options || {
            target : null
        };

        // TODO style
        // cf. https://maplibre.org/maplibre-gl-directions/#/examples/restyling

        // TODO configuration du service
        // cf. https://github.com/maplibre/maplibre-gl-directions/blob/0371666/src/directions/types.ts
        var configuration = {
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
        // le container est fournit dans les params
        var target = this.options.target || document.getElementById("directionsWindow");
        if (!target) {
            // TODO message...
            return;
        }

        /**
         * transforme un texte html en dom
         * @param {*} str 
         * @returns dom
         * @private
         * @inner
         */
        function stringToHTML (str) {

            var support = function () {
                if (!window.DOMParser) return false;
                var parser = new DOMParser();
                try {
                    parser.parseFromString('x', 'text/html');
                } catch(err) {
                    return false;
                }
                return true;
            };
        
            // If DOMParser is supported, use it
            if (support()) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(str, 'text/html');
                return doc.body;
            }
        
            // Otherwise, fallback to old-school method
            var dom = document.createElement('div');
            dom.innerHTML = str;
            return dom;
        
        }

        var strContainer = `
            <div id="directionsPanel" class="directionsPanel">
                <!-- todo -->
            </div>
        `;
        
        // Ex.
        // <div class="Point">
        //     <div id="Point_A" class="" style="">
        //         <label id="PointLabel_A" for="PointOrigin_A">Départ</label>
        //         <input id="PointOrigin_A" class="Visible" type="text" placeholder="Saisir une adresse" autocomplete="off">
        //         <input id="PointCoords_A" class="Hidden" type="text">
        //         <input id="PointPointer_A" type="checkbox">
        //         <label id="PointImg_A" for="PointPointer_A" class="Img" title="Pointer un lieu sur la carte"></label>
        //     </div>
        //     <div id="AutoCompleteList_A" class="AutoCompleteList"></div>
        // </div>

        var container = stringToHTML(strContainer);
        if (!container) {
            // TODO message...
            return;
        }
        
        // ajout du container
        target.appendChild(container.firstChild);
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

export default Directions;