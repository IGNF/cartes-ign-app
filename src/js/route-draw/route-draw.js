import RouteDrawDOM from "./route-draw-dom";
import Globals from "../globals";
import ElevationLineControl from "../elevation-line-control";
import DOM from '../dom';

import Reverse from "../services/reverse";

import MapLibreGL from "maplibre-gl";

/**
 * Interface sur le tracé d'itinéraire
 * @module RouteDraw
 */
class RouteDraw {
    /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
    constructor (map, options) {
        this.options = options || {
            target: null,
            configuration: {},
            style: {},
            transport: null,
            mode: null,
        };

        // configuration
        this.configuration = this.options.configuration || {
            source: "route-draw",
            api: "https://wxs.ign.fr/calcul/geoportail/itineraire/rest/1.0.0/route?resource=bdtopo-osrm&getSteps=false&timeUnit=second&",
            template: (values) => {
                return `start=${values.start.lng},${values.start.lat}&end=${values.end.lng},${values.end.lat}&profile=${values.profile}`
            }
        }

        // style
        this.style = this.options.style || {
            color: "26a581",
            opacity: 0.85
        };

        this.transport = this.options.transport || "pedestrian"; // one of "pedestrian", "car"

        this.data = {
            duration: 0,
            distance: 0,
            dplus: 0,
            dminus: 0,
            // point: GeoJSON feature point with properties: "name"
            points: [],
            // step: GeoJSON feature linestring with properties: "start_name", "end_name", "duration", "distance", "dplus", "dminus"
            steps: [],
        }

        // mode: libre 0 ou guidé 1
        this.mode = this.options.mode || 1;

        // target
        this.target = this.options.target;

        // carte
        this.map = map;

        // rendu graphique
        this.render();

        // Profil Altimétrique
        this.elevation = new ElevationLineControl({target: document.getElementById("routedraw-elevationline")});

        // fonction d'event avec bind
        this.boundOnAddWayPoint = this.#onAddWayPoint.bind(this);

        // annulation de la reqête fetch
        this.controller = new AbortController();

        // requête en cours d'execution ?
        this.loading = false;

        return this;
    }

    /**
     * activation du contrôle
     * @public
     */
    activate() {
        this.#listeners()
    }

    /**
     * creation de l'interface
     * @public
     */
    render () {
        var target = this.target || document.getElementById("routeDrawWindow");
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
     * enregistrement de l'itinéraire
     * @param {*} settings
     * @public
     */
    compute (settings) {

    }

    /**
     * ajout d'ecouteurs pour la saisie interactive
     */
    #listeners() {
        this.map.on("click", this.boundOnAddWayPoint);

        // this.obj.on("addwaypoint", (e) => { this.#onAddWayPoint(e); });
        // this.obj.on("cancellast", (e) => { this.#onCancelLast(e); });
        // this.obj.on("restorenext", (e) => { this.#onRestoreNext(e); });
        // this.obj.on("deletepoint", (e) => { this.#onDeletePoint(e); });
    }

    /**
     * ecouteur lors de l'ajout d'un point avec addWayPoint()
     * @param {*} e
     * @returns
     */
    async #onAddWayPoint(e) {
        // On empêche l'intéraction tant que les opérations ne sont pas terminées
        // TODO: Patience
        this.map.off("click", this.boundOnAddWayPoint);
        var coordinates = e.lngLat;
        var bResponse = false;
        var length = this.data.points.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [coordinates.lng, coordinates.lat]
            },
            properties: {
                name: ""
            }
        })
        try {
            await Reverse.compute({
                lon : coordinates.lng,
                lat : coordinates.lat
            })
            bResponse = true;
        } catch(err) {
            bResponse = false;
        } finally {
            var a = (bResponse) ? Reverse.getAddress() : coordinates.lng.toFixed(6) + ", " + coordinates.lat.toFixed(6);
            var address = a;
            if (bResponse) {
                if (a.street) {
                    address = a.street + ", "
                }
                address += a.city + ", " + a.postcode;
            }
            // on ajoute les resultats dans le tableau (avec la length récupérée avant la promesse pour gérer l'asynchrone)
            this.data.points[length - 1].geometry.coordinates = [coordinates.lng, coordinates.lat];
            this.data.points[length - 1].properties.name = address;

            // Pas d'autre étape s'il n'y a qu'un point
            if (this.data.points.length < 2) {
                if (Globals.backButtonState === "routeDraw") {
                    this.map.on("click", this.boundOnAddWayPoint);
                }
                return
            }

            // saisie libre
            var previousPoint = this.data.points[length - 2];
            if (this.mode === 0) {
                var distance = new MapLibreGL.LngLat(coordinates.lng, coordinates.lat).distanceTo(new MapLibreGL.LngLat(...previousPoint.geometry.coordinates));
                var duration = distance / (4 / 3.6); // 4 km/h divisé par 3.6 pour m/s
                if (this.data.steps.length > 0) {
                    var allCoordinates = this.data.steps.map((step) => step.geometry.coordinates).flat();
                    allCoordinates.push([coordinates.lng, coordinates.lat]);
                } else {
                    allCoordinates = [previousPoint.geometry.coordinates, [coordinates.lng, coordinates.lat]];
                }
                var stepCoords = [
                    previousPoint.geometry.coordinates,
                    [coordinates.lng, coordinates.lat]
                ];
            // saisie guidée
            } else if (this.mode === 1) {
                var url = this.configuration.api +
                this.configuration.template({
                    start: {lng: previousPoint.geometry.coordinates[0], lat: previousPoint.geometry.coordinates[1]},
                    end: coordinates,
                    profile: this.transport,
                });
                this.loading = true;
                try {
                    var response = await fetch(url, { signal: this.controller.signal });
                    var json = await response.json();
                } catch (err) {
                    this.loading = false;
                    // TODO "Erreur lors de l'ajout du point"
                    this.map.on("click", this.boundOnAddWayPoint);
                }
                this.loading = false;
                // TODO REMOVE ME IMPORTANT à supprimer après passage en POST GPF
                if (json.geometry.coordinates.length > 110) {
                    var gcd = function(a, b) {
                        if (b < 0.0000001) return a;
                        return gcd(b, Math.floor(a % b));
                    };

                    let proportionToRemove = ((json.geometry.coordinates.length - 110) / json.geometry.coordinates.length).toFixed(2);
                    var len = proportionToRemove.toString().length - 2;
                    var denominator = Math.pow(10, len);
                    var numerator = proportionToRemove * denominator;
                    var divisor = gcd(numerator, denominator);
                    numerator /= divisor;
                    denominator /= divisor;
                    let newrouteCoords = []
                    for (let i=0; i<json.geometry.coordinates.length; i++) {
                        let demPort = i%denominator;
                        if (demPort >= numerator) {
                            newrouteCoords.push(json.geometry.coordinates[i])
                        }
                    }
                    json.geometry.coordinates = newrouteCoords;
                }
                // END REMOVEME
                if (this.data.steps.length > 0) {
                    var allCoordinates = this.data.steps.map((step) => step.geometry.coordinates).flat();
                    allCoordinates.push(...json.geometry.coordinates);
                } else {
                    allCoordinates = json.geometry.coordinates;
                }
                this.data.points[length - 1].geometry.coordinates = allCoordinates.slice(-1)[0];
                var stepCoords = json.geometry.coordinates;
                var distance = json.distance;
                var duration = json.duration;
            }

            this.elevation.setCoordinates(allCoordinates);
            var lastDPlus = this.elevation.dplus;
            var lastDMinus = this.elevation.dminus;
            try {
                await this.elevation.compute();
            } catch(err) {
                // TODO "Erreur lors de l'ajout du point"
                this.map.on("click", this.boundOnAddWayPoint);
            }
            var step = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: stepCoords
                },
                properties: {
                    start_name: previousPoint.properties.name,
                    end_name: address,
                    duration: duration,
                    distance: distance,
                    dplus: this.elevation.dplus - lastDPlus,
                    dminus: this.elevation.dminus - lastDMinus,
                }
            }
            this.data.steps.push(step);
            this.data.distance += distance;
            this.data.duration += distance / (4 / 3.6);
            this.data.dplus = this.elevation.dplus;
            this.data.dminus = this.elevation.dminus;
            this.__updateRouteInfo(this.data);

            // Affichage et réactivation de l'intéractivité si on est toujours dans le tracé d'itinéraire
            if (Globals.backButtonState === "routeDraw") {
                var source = this.map.getSource(this.configuration.source);
                if (source) {
                    source.setData({
                        type: "FeatureCollection",
                        features: this.data.steps,
                    });
                } else {
                    this.#addSourceAndLayer();
                }

                this.map.on("click", this.boundOnAddWayPoint);
            }
        }
    }

    /**
     * ajoute la source et le layer à la carte pour affichage du tracé
     */
    #addSourceAndLayer() {
        this.map.addSource(this.configuration.source, {
            "type": "geojson",
            "data": {
                type: "FeatureCollection",
                features: this.data.steps,
            }
        });

        this.map.addLayer({
            "id": this.configuration.source,
            "type": "line",
            "source": this.configuration.source,
            "layout": {},
            "paint": {
              "line-color": "#" + this.style.color,
              "line-opacity": this.style.opacity,
              "line-width": 5,
            }
        });
    }

    /**
     * togle entre saisie libre et guidée
     * @public
     */
    toggleMode() {
        if (this.mode == 0) {
            this.mode = 1;
            DOM.$routeDrawMode.innerText = "Saisie guidée";
            return;
        }
        this.mode = 0;
        DOM.$routeDrawMode.innerText = "Saisie libre";
    }

    /**
     * nettoyage du tracé
     * @public
     */
    clear () {
        this.map.off("click", this.boundOnAddWayPoint);
        this.elevation.clear();
        if (this.loading) {
            this.controller.abort();
            this.controller = new AbortController();
            this.loading = false;
        }
        this.options.steps = [];
        if (this.map.getLayer(this.configuration.source)) {
            this.map.removeLayer(this.configuration.source);
        }
        if (this.map.getSource(this.configuration.source)) {
            this.map.removeSource(this.configuration.source);
        }
    }

    /**
     * affiche le menu des résultats du calcul
     * @public
     */
    show () {
        Globals.menu.open("routeDraw");
    }

    /**
     * ferme le menu des résultats du calcul
     * @public
     */
    hide () {
        Globals.menu.close("routeDraw");
    }

}

// mixins
Object.assign(RouteDraw.prototype, RouteDrawDOM);

export default RouteDraw;
