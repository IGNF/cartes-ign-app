/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { decode } from "@placemarkio/polyline";
import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";
import maplibregl from "maplibre-gl";
import DirectionsDOM from "./directions-dom";
import DirectionsResults from "./directions-results";
import DirectionsLayers from "./directions-styles";
import directionsSortableCallback from "./directions-sortable-callback";
import Globals from "../globals";

import GisUtils from "../utils/gis-utils";

// dependance : abonnement au event du module
import Geocode from "../services/geocode";
import Location from "../services/location";
import Reverse from "../services/reverse";

import ElevationLineControl from "../elevation-line-control/elevation-line-control";
import Sortable from "sortablejs";

/**
 * Interface du contrôle sur le calcul d'itineraire
 * @module Directions
 * @todo gestion de l'état du contrôle (local storage)
 * @todo monter le service IGN
 */
class Directions {
  /**
     * constructeur
     * @constructs
     * @param {*} map
     * @param {*} options
     */
  constructor (map, options) {
    this.options = options || {
      target : null,
      configuration : {},
      style : {},
      // callback
      openSearchControlCbk : null,
      closeSearchControlCbk : null
    };

    // configuration du service
    //   cf. https://project-osrm.org/docs/v5.24.0/api/#
    //   ex. https://map.project-osrm.org/
    this.configuration = this.options.configuration || {
      api: "https://data.geopf.fr/navigation/itineraire",
      profile: "pedestrian",
      optimization: "fastest",
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
      layers: DirectionsLayers.layers,
      dragThreshold: 10,
      refreshOnMove: false,
      bearings: false
    };

    // paramètres du calcul
    this.settings = null;

    // résultats du calcul
    this.results = null;

    // carte
    this.map = map;

    // objet
    this.obj = new MapLibreGlDirections(this.map, this.configuration);

    // REMOVEME: override buildRequest method
    this.obj.buildRequest = function(configuration, waypointsCoordinates, waypointsBearings = undefined) {
      let url;
      let method = "get";
      let payload = "";
      if (configuration.profile == "pedestrian") {
        configuration.optimization = "shortest";
      }
      url = `${configuration.api}?resource=bdtopo-valhalla&profile=${configuration.profile}&optimization=${configuration.optimization}&start=${waypointsCoordinates.shift()}&end=${waypointsCoordinates.pop()}&intermediates=${waypointsCoordinates.join("|")}&geometryFormat=polyline`;

      if (waypointsBearings) {
        console.debug(waypointsBearings);
      }

      return {
        method,
        url,
        payload
      };
    };
    // REMOVEME: override buildRequest method
    this.obj.fetch = async function({ method, url, payload }) {
      const response = (await (method === "get"
        ? await fetch(`${url}`, { signal: this.abortController?.signal })
        : console.debug(payload)
      ).json());

      const formatedResponse = {
        code: "Ok",
        routes: [],
        waypoints: [],
      };

      const route = {
        geometry: response.geometry,
        legs: [],
        weight_name: "routability",
        weight: this.configuration.optimization === "fastest" ? response.duration : response.distance,
        duration: response.duration,
        distance: response.distance,
      };

      for (let i = 0; i < response.portions.length; i++) {
        const portion = response.portions[i];
        if (formatedResponse.waypoints.length === 0) {
          formatedResponse.waypoints.push({
            hint: "-1",
            name: "-1",
            location: [parseFloat(portion.start.split(",")[0]), parseFloat(portion.start.split(",")[1])],
          });
        }
        formatedResponse.waypoints.push({
          hint: "" + i,
          name: "" + i,
          location: [parseFloat(portion.end.split(",")[0]), parseFloat(portion.end.split(",")[1])],
        });
        route.legs.push({
          steps: [],
          summary: "" + i,
          weight: this.configuration.optimization === "fastest" ? portion.duration : portion.distance,
          duration: portion.duration,
          distance: portion.distance,
        });
        for (let j = 0; j < portion.steps.length; j++) {
          const step = portion.steps[j];
          route.legs[i].steps.push({
            geometry: step.geometry,
            maneuver: {
              bearing_after: 0,
              bearing_before: 0,
              location: [0, 0],
              modifier: step.instruction.modifier,
              type: step.instruction.type,
            },
            mode: this.configuration.profile,
            driving_side: "right",
            name: step.attributes.name.nom_1_droite,
            intersections: [],
            weight: this.configuration.optimization === "fastest" ? step.duration : step.distance,
            duration: step.duration,
            distance: step.distance,
          });
        }
      }
      formatedResponse.routes.push(route);

      return formatedResponse;
    };
    // END REMOVEME

    // INFO sans interaction par défaut !
    // > choix d'activer via la méthode publique...
    this.obj.interactive = false;

    // Profil Altimétrique
    this.elevation = new ElevationLineControl({target: document.getElementById("directions-elevationline")});

    // rendu graphique
    this.render();

    // Source et layers de preview
    this.#addPreviewSourcesAndLayers();
    this.previewPoints = [];

    // fonction d'event avec bind
    this.handleAddWayPoint = this.#onAddWayPoint.bind(this);

    // event interactif
    this.#listeners();
  }

  /**
     * creation de l'interface principale
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

    // dragn'drop !
    Sortable.create(document.getElementById("divDirectionsLocationsList"), {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      filter: ".hidden",
      // Call event function on drag and drop
      onEnd: directionsSortableCallback,
    });
  }

  /**
     * requête au service
     * @param {*} settings
     * @public
     */
  compute (settings) {
    // nettoyage de l'ancien parcours !
    this.obj.clear();
    // Les valeurs sont à retranscrire en options du service utilisé
    // - transport : ex. voiture vers l'option 'profile:driving'
    // - computation
    // - locations
    if (settings.transport) {
      // mettre en place les differents types de profile si le service le permet !
      switch (settings.transport) {
      case "Pieton":
        this.configuration.profile = "pedestrian";
        break;
      case "Voiture":
        this.configuration.profile = "car";
        break;
      default:
        break;
      }
    }
    if (settings.computation) {
      // mettre en place le mode calcul si le service le permet !
      var code = settings.computation;
      var message = "";
      switch (code) {
      case "Shortest":
        this.configuration.optimization = "shortest";
        message = "Itinéraire le plus court";
        break;
      case "Fastest":
        this.configuration.optimization = "fastest";
        message = "Itinéraire le plus rapide";
        break;
      default:
        break;
      }
      settings.computation = {
        code : code,
        message : message
      };
    }
    this.settings = settings;
    if (settings.locations && settings.locations.length) {
      try {
        // les coordonnées sont en lon / lat en WGS84G
        var points = [];
        var point = null;
        for (let index = 0; index < settings.locations.length; index++) {
          if (settings.locations[index]) {
            point = JSON.parse(settings.locations[index]);
            points.push(point);
            this.obj.addWaypoint(point);
          }
        }
      } catch (e) {
        // catching des exceptions JSON
        console.error(e);
        return;
      }
    }
  }

  /**
     * ajout d'ecouteurs pour la saisie interactive
     */
  #listeners() {
    this.obj.on("addwaypoint", this.handleAddWayPoint);
    // events
    this.obj.on("fetchroutesstart", () => {
      this.__setComputeButtonLoading();
    });
    this.obj.on("fetchroutesend", (e) => {
      this.__unsetComputeButtonLoading();
      // affichage du menu du parcours :
      // - résumé
      // - détails
      // on transmet les données (en fonction du service) au composant DOM
      // pour l'affichage :
      // ex.
      // e.data.routes[0] : {
      //    distance,
      //    duration,
      //    geometry,
      //    legs[]
      //  }
      if (e.data.code === "Ok") {
        this.#removePreview();
        this.results = new DirectionsResults(this.map, null, {
          duration : e.data.routes[0].duration || "",
          distance : e.data.routes[0].distance || "",
          transport : this.settings.transport,
          computation : this.settings.computation.message,
          instructions : e.data.routes[0].legs
        });
        this.results.show();
        let routeCoordinates = [];
        decode(e.data.routes[0].geometry).forEach( (lnglat) => {
          routeCoordinates.push([lnglat[0], lnglat[1]]);
        });
        var padding;
        // gestion du mode paysage / écran large
        if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
          var paddingLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left").slice(0, -2)) +
                      Math.min(window.innerHeight, window.innerWidth/2) + 42;
          padding = {top: 20, right: 20, bottom: 20, left: paddingLeft};
        } else {
          padding = {top: 80, right: 20, bottom: 120, left: 20};
        }
        if (routeCoordinates.length > 1) {
          const bounds = routeCoordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]));
          if (Location.isTrackingActive()) {
            Location.disableTracking();
          }
          this.map.fitBounds(bounds, {
            padding: padding,
          });
        }
        if (this.configuration.profile !== "car") {
          this.elevation.target = document.getElementById("directions-elevationline");
          this.elevation.loadingDomInDocument = false;
          this.elevation.setCoordinates(routeCoordinates);
          this.elevation.compute(e.data.routes[0].distance).then( () => {
            const newDuration = GisUtils.getHikeTimeScarfsRule(this.results.options.distance, this.elevation.dplus, Globals.walkingSpeed);
            this.results.updateDuration(newDuration);
          });
        }
      }
    });
  }

  /**
     * ecouteur lors de l'ajout d'un point avec addWayPoint()
     * @see https://maplibre.org/maplibre-gl-directions/api/interfaces/MapLibreGlDirectionsWaypointEventData.html
     * @param {*} e
     * @returns
     */
  #onAddWayPoint(e) {
    var index = e.data.index;
    if (!e.originalEvent) {
      return;
    }
    var coordinates = e.originalEvent.lngLat;
    Reverse.compute({
      lon : coordinates.lng,
      lat : coordinates.lat
    }).then(() => {
    }).catch(() => {
    }).finally(() => {
      var target = null;
      var coords = Reverse.getCoordinates() || {lon : coordinates.lng, lat : coordinates.lat};
      var address = Reverse.getAddress() || coords.lon.toFixed(6) + ", " + coords.lat.toFixed(6);
      var strAddress = address;
      if (typeof address !== "string") {
        strAddress = "";
        strAddress += (address.number !== "") ? address.number + " " : "";
        strAddress += (address.street !== "") ? address.street + ", " : "";
        strAddress += address.city + ", " + address.postcode;
      }
      // start
      if (index === 0) {
        target = document.getElementById("directionsLocation_start");
      }
      // end
      if (index === 1) {
        target = document.getElementById("directionsLocation_end");
      }
      // step
      if (index > 1) {
        target = document.getElementById("directionsLocation_step_" + (index - 1));
        target.parentNode.parentNode.classList.remove("hidden");
      }
      // on ajoute les resultats dans le contrôle
      if (target) {
        target.dataset.coordinates = "[" + coords.lon + "," + coords.lat + "]";
        target.value = strAddress;
      }
    });
  }

  /**
   * ajoute la source et le layer à la carte pour affichage du preview
   */
  #addPreviewSourcesAndLayers() {
    this.map.addSource("directions-preview", {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });

    DirectionsLayers.previewLayers["directions-preview-point-casing"].source = "directions-preview";
    DirectionsLayers.previewLayers["directions-preview-point"].source = "directions-preview";
    DirectionsLayers.previewLayers["directions-preview-point-ORIGIN"].source = "directions-preview";
    DirectionsLayers.previewLayers["directions-preview-point-DESTINATION"].source = "directions-preview";
    this.map.addLayer(DirectionsLayers.previewLayers["directions-preview-point-casing"]);
    this.map.addLayer(DirectionsLayers.previewLayers["directions-preview-point"]);
    this.map.addLayer(DirectionsLayers.previewLayers["directions-preview-point-ORIGIN"]);
    this.map.addLayer(DirectionsLayers.previewLayers["directions-preview-point-DESTINATION"]);
  }

  #removePreview() {
    this.map.getSource("directions-preview").setData({
      type: "FeatureCollection",
      features: []
    });
    this.previewPoints = [];
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
    this.obj.off("addwaypoint", this.handleAddWayPoint);
    var locations = document.querySelectorAll(".inputDirectionsLocations");
    for (let index = 0; index < locations.length; index++) {
      const element = locations[index];
      element.value = "";
      element.dataset.coordinates = "";
    }
    this.#removePreview();
    document.querySelectorAll(".lblDirectionsLocationsRemoveImg").forEach( (elem) => elem.click());
    this.__unsetComputeButtonLoading();
    this.dom.buttonCompute.classList.add("disabled");
  }

  ////////////////////////////////////////////
  // autres méthodes...
  ////////////////////////////////////////////
  /**
     * listener issu du dom sur l'interface du menu 'search'
     * @param {*} e
     * @see MenuDisplay.openSearchDirections()
     * @see MenuDisplay.closeSearchDirections
     * @see Geocode
     */
  onOpenSearchLocation (e) {
    // contexte
    var self = this;

    // on ouvre le menu
    if (this.options.openSearchControlCbk) {
      this.options.openSearchControlCbk();
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
      // on ferme le menu
      if (e.type !== "geolocation" && self.options.closeSearchControlCbk) {
        self.options.closeSearchControlCbk();
      }
      // on enregistre dans le DOM :
      // - les coordonnées en WGS84G soit lon / lat !
      // - la reponse du geocodage
      target.dataset.coordinates = "[" + e.detail.coordinates.lon + "," + e.detail.coordinates.lat + "]";
      if (e.type === "reverse") {
        var strAddress = e.detail.address;
        if (typeof e.detail.address !== "string") {
          strAddress = "";
          strAddress += (e.detail.address.number !== "") ? e.detail.address.number + " " : "";
          strAddress += (e.detail.address.street !== "") ? e.detail.address.street + ", " : "";
          strAddress += e.detail.address.city + ", " + e.detail.address.postcode;
        }
        target.value = strAddress;
      } else {
        target.value = e.detail.text.split(",")[0];
      }

      const inputList = Array.from(document.querySelectorAll(".inputDirectionsLocations"));
      let index = 0;
      for (let i = 0; i < inputList.length; i++) {
        index = i;
        if (inputList[i].id === target.id) {
          break;
        }
      }
      let category = "";
      if (index === 0) {
        category = "ORIGIN";
      }
      if (index === inputList.length - 1) {
        category = "DESTINATION";
      }
      self.map.getSource("directions-preview").updateData({
        add: [{
          type: "Feature",
          id: index,
          geometry: {
            type: "Point",
            coordinates: [e.detail.coordinates.lon, e.detail.coordinates.lat]
          },
          properties: {
            type: "SNAPPOINT",
            waypointProperties: {
              category: category,
            }
          }
        }]
      });

      self.previewPoints.push([e.detail.coordinates.lon, e.detail.coordinates.lat]);

      if (self.previewPoints.length > 1) {
        let padding;
        if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
          var paddingLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left").slice(0, -2)) +
                      Math.min(window.innerHeight, window.innerWidth/2) + 42;
          padding = {top: 20, right: 20, bottom: 20, left: paddingLeft};
        } else {
          padding = {top: 80, right: 20, bottom: window.innerHeight/2 + 20, left: 20};
        }
        const bounds = self.previewPoints.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(self.previewPoints[0], self.previewPoints[0]));
        if (Location.isTrackingActive()) {
          Location.disableTracking();
        }
        self.map.fitBounds(bounds, {
          padding: padding,
        });
        self.dom.buttonCompute.classList.remove("disabled");
      } else if (self.previewPoints.length === 1) {
        if (self.dom.inputArrival.value == "Ma position" || self.dom.inputDeparture.value == "Ma position") {
          self.dom.buttonCompute.classList.remove("disabled");
        }
      }

      // on supprime les écouteurs
      cleanListeners();
    }
    function cleanListeners () {
      Geocode.target.removeEventListener("search", setLocation);
      Location.target.removeEventListener("geolocation", setLocation);
      Reverse.target.removeEventListener("reverse", setLocation);
    }

    // abonnement au geocodage
    Geocode.target.addEventListener("search", setLocation);

    // abonnement à la geolocalisation
    Location.target.addEventListener("geolocation", setLocation);

    // abonnement au reverse
    Reverse.target.addEventListener("reverse", setLocation);

    window.addEventListener("closesearch", cleanListeners);
  }
}

// mixins
Object.assign(Directions.prototype, DirectionsDOM);

export default Directions;
