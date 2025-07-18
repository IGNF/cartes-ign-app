/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import IsochroneDOM from "./isochrone-dom";
import Globals from "../globals";
import LayersGroup from "../layer-manager/layer-group";

import GisUtils from "../utils/gis-utils";

import { Toast } from "@capacitor/toast";


// dependance : abonnement au event du module
import Geocode from "../services/geocode";
import Location from "../services/location";
import Reverse from "../services/reverse";

import maplibregl from "maplibre-gl";

/**
 * Interface sur le contrôle isochrone
 * @module Isochrone
 */
class Isochrone {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      configuration: {},
      style: {},
      // callback
      openSearchControlCbk: null,
      closeSearchControlCbk: null,
      tempLayers: null,
    };

    // configuration
    this.configuration = this.options.configuration || {
      source: "isochrone",
      api: "https://data.geopf.fr/navigation/",
      route: "isochrone",
      template: (values) => {
        return {
          resource: "bdtopo-valhalla",
          timeUnit: "second",
          distanceUnit: values.distanceUnit,
          point: `${values.location.lon},${values.location.lat}`,
          profile: values.transport,
          costValue: values.value,
          costType: values.mode,
        };
      }
    };

    // style
    this.style = this.options.style || {
      color: "#307CCD",
      opacity: 0.15,
    };

    // target
    this.target = this.options.target;

    this.tempLayers = this.options.tempLayers || null;

    // carte
    this.map = map;

    // resultats
    this.polygon = null;
    this.center = null;

    // poi
    // on detecte la presence des POI
    // avant la creation du rendu du contrôle
    this.poi = this.#hasLayerPoi();
    // filtre spécifique d'affichage des POI
    this.filter = null;
    this.previousFilters = {};

    this.#addSourcesAndLayers();

    // rendu graphique
    this.#render();

    // annulation de la reqête fetch
    this.abortController = new AbortController();

    // requête en cours d'execution ?
    this.loading = false;

    // bind
    this.onAddWayPoint = this.onAddWayPoint.bind(this);

    // Isochrone déjà calculée ?
    this.computed = false;

    return this;
  }

  /**
   * Auto detection des POI
   * @returns
   * @todo creation des filtres
   */
  #hasLayerPoi() {
    // recherche le contrôle pour la couche POI
    var instance = Globals.poi;
    if (!instance) {
      return null;
    }

    // chargement de la config des POI
    var config = instance.config;
    if (!config) {
      return null;
    }

    // source id
    var source = instance.sources[0]; // normalement, une seule source

    // gestion des filtres
    var ids = instance.layers.map((o) => { return o.id; });

    // creation des filtres
    var filters = JSON.parse(JSON.stringify(instance.filters)); // clone
    return {
      id: source,
      config: config,
      filters: filters,
      ids: ids
    };
  }

  /**
   * creation de l'interface
   */
  #render() {
    var target = this.target || document.getElementById("isochroneWindow");
    if (!target) {
      console.warn();
      return;
    }

    var options = null;
    if (this.poi) {
      options = {};
      options.thematics = this.poi.config;
    }

    if (this.tempLayers && this.tempLayers.length > 0) {
      options.tempLayers = this.tempLayers;
    }

    var container = this.getContainer(options);
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
  async compute(settings) {
    // nettoyage de l'ancien parcours !
    this.clear();
    this.__setComputeButtonLoading();
    // Les valeurs sont à retranscrire en options du service utilisé
    // - transport
    // - mode : distance ou temps avec les valeurs
    // - location
    var transport = null;
    if (settings.transport) {
      // mettre en place les differents types de profile !
      switch (settings.transport) {
      case "Pieton":
        transport = "pedestrian";
        break;
      case "Voiture":
        transport = "car";
        break;
      default:
        transport = "pedestrian";
        break;
      }
    }

    var mode = null;
    var value = null;
    var distanceUnit = "meter";
    if (settings.mode) {
      // mettre en place le mode calcul !
      switch (settings.mode.type) {
      case "Distance":
        mode = "distance";
        value = Math.round(parseFloat(settings.mode.value, 10) * 1000); // km (saisi) vers mètres
        if (value > 50000) {
          value /= 1000;
          distanceUnit = "kilometer";
        }
        break;
      case "Temps":
        mode = "time";
        value = parseFloat(settings.mode.value);
        break;
      default:
        break;
      }
    }

    if (!mode || !value) {
      throw new Error("Exception : the method of calculation is not specified !");
    }

    var location = null;
    if (settings.location) {
      try {
        // les coordonnées sont en lon / lat en WGS84G
        var point = JSON.parse(settings.location);
        if (point) {
          location = {
            lon: point[0],
            lat: point[1]
          };
        }
      } catch (e) {
        // catching des exceptions JSON
        console.error(e);
        return;
      }
    }

    if (!location) {
      throw new Error("Exception : location is empty !");
    }

    // Exemple de requête
    // GET https://valhalla1.openstreetmap.de/isochrone?json=
    // {
    //     "locations":[
    //         {"lat":40.744014,"lon":-73.990508}
    //     ],
    //     "costing":"pedestrian",
    //     "contours":[
    //         {"time":15.0,"color":"ff0000"}
    //     ],
    //     polygons:true,
    //     show_locations:true,
    // }
    var url = this.configuration.api +
      this.configuration.route + "?" +
      new URLSearchParams(this.configuration.template({
        transport: transport,
        mode: mode,
        value: value,
        location: location,
        distanceUnit: distanceUnit,
      }));

    this.loading = true;
    var response = await fetch(url, { signal: this.abortController.signal });
    var responseJson = await response.json();
    var geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: responseJson.geometry
        }
      ]
    };
    this.loading = false;

    if (response.status !== 200) {
      throw new Error(response.message);
    }
    // affichage
    if (settings.showOutline) {
      var source = this.map.getSource(this.configuration.source);
      source.setData(geojson);
    }

    // par defaut, le 1er feature est le résultat de l'isochrone
    this.polygon = geojson.features[0];
    this.center = [location.lon, location.lat];

    // bbox
    var bbox = GisUtils.getBoundingBox(this.polygon.geometry.coordinates[0]);
    // deplacement de la carte sur l'emprise des résultats
    var padding;
    // gestion du mode paysage / écran large
    if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      var paddingLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left").slice(0, -2)) +
                  Math.min(window.innerHeight, window.innerWidth/2) + 42;
      padding = {top: 20, right: 20, bottom: 20, left: paddingLeft};
    } else {
      padding = {top: 80, right: 20, bottom: 120, left: 20};
    }

    const anyFilter = ["any"];
    let onePoiChecked = false;
    for (const [category, checked] of Object.entries(settings.poisToDisplay)) {
      if (checked) {
        anyFilter.push(this.poi.filters[category]);
        onePoiChecked = true;
      }
    }
    if (onePoiChecked) {
      this.map.once("moveend", () => {
        if (this.map.getZoom() < 11) {
          Toast.show({
            text: "Zoomez pour afficher les centres d'intérêt sélectionnés",
            duration: "long",
            position: "bottom"
          });
        }
      });
    }
    if (Location.isTrackingActive()) {
      Location.disableTracking();
    }
    this.map.fitBounds(bbox, {
      padding: padding
    });

    if (this.poi) {
      LayersGroup.addVisibilityByID(Globals.poi.id, `POI OSM isochrone$$$${Globals.poi.id}`, true);
      this.filter = ["all"];
      if (!settings.showPoisOutside) {
        this.filter.push(["within", this.polygon]);
      }

      this.filter.push(anyFilter);
      this.poi.ids.forEach( (id) => {
        // Sauvegarde de l'état des filtres initiaux
        if (!this.previousFilters[id]) {
          this.previousFilters[id] = this.map.getFilter(id);
        }
        const currentFilter = this.map.getFilter(id);
        currentFilter[currentFilter.length - 1] = this.filter;
        if (settings.showPoisOutside && id !== `POI OSM isochrone$$$${Globals.poi.id}`) {
          currentFilter[currentFilter.length - 1] = this.filter[this.filter.length - 1];
        }
        this.map.setFilter(id, currentFilter);
      });
    }

    if (this.tempLayers && this.tempLayers.length > 0) {
      settings.tempLayersToDisplay.forEach((id) => {
        if (this.map.getLayer(`${id}$$$${id}`)) {
          document.querySelector(`#${id}`).click();
        }
        document.querySelector(`#${id}`).click();
        const addLayerCallback = (e) => {
          if (e.detail.id === id) {
            this.map.setFilter(`${id}$$$${id}`, ["within", this.polygon]);
            Globals.manager.removeEventListener("addlayer", addLayerCallback);
          }
        };
        Globals.manager.addEventListener("addlayer", addLayerCallback);
      });
    }

    Globals.searchResultMarker = new maplibregl.Marker({element: Globals.searchResultIcon, anchor: "bottom"})
      .setLngLat(this.center)
      .addTo(this.map);

    Globals.currentScrollIndex = 0;
    if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      Globals.currentScrollIndex = 1;
    }
    Globals.menu.updateScrollAnchors();
    this.__unsetComputeButtonLoading();
    this.computed = true;
  }

  /**
   * ajoute la source et le layer à la carte pour affichage du tracé
   */
  #addSourcesAndLayers() {
    // ajouter la source
    this.map.addSource(this.configuration.source, {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      },
    });

    var id = this.configuration.source;
    this.map.addLayer({
      "id": this.configuration.source,
      "type": "fill",
      "source": this.configuration.source,
      "layout": {},
      "paint": {
        "fill-color": this.style.color,
        "fill-opacity": this.style.opacity
      }
    });

    this.map.addLayer({
      "id": this.configuration.source + "line",
      "type": "line",
      "source": id,
      "metadata": {
        "group": id
      },
      "layout": {},
      "paint": {
        "line-color": this.style.color,
        "line-width": 1,
      }
    });

    // HACK
    // Déplacement de l'isochrone pour qu'elle apparaisse sous les POI OSM
    this.map.moveLayer(this.configuration.source + "line", "maplibre-gl-directions-point-ORIGIN");
    this.map.moveLayer(this.configuration.source, this.configuration.source + "line");
  }

  /**
   * nettoyage du formularie
   * @public
   */
  clearForm() {
    this.dom.location.value = "";
    this.dom.location.dataset.coordinates = "";
    this.dom.distanceValue.value = "";
    this.dom.durationValueMinutes.value = "";
    this.dom.clearLocation.classList.add("d-none");
  }

  /**
   * nettoyage du tracé
   * @public
   */
  clear() {
    // stopper le fetch en cours sur le service
    if (this.loading) {
      this.abortController.abort();
      this.abortController = new AbortController();
      this.loading = false;
    }
    // supprimer la couche isochrone
    var source = this.map.getSource(this.configuration.source);
    source.setData({
      "type": "FeatureCollection",
      "features": []
    });
    // resultats
    this.polygon = null;
    this.center = null;
    if (this.filter) {
      this.poi.ids.forEach( (id) => {
        this.map.setFilter(id, this.previousFilters[id]);
      });
    }
    if (this.tempLayers && this.tempLayers.length > 0) {
      this.tempLayers.forEach((layer) => {
        if (this.map.getLayer(`${layer.id}$$$${layer.id}`)) {
          this.map.setFilter(`${layer.id}$$$${layer.id}`, null);
        }
      });
    }
    this.filter = null;
    this.previousFilters = {};
    if (Globals.searchResultMarker != null) {
      Globals.searchResultMarker.remove();
      Globals.searchResultMarker = null;
    }
    this.__unsetComputeButtonLoading();
    this.computed = false;


    document.querySelectorAll(".inputPOIFilterItem").forEach((el) => {
      var layers = LayersGroup.getGroupLayers(Globals.poi.id).filter((layer) => { return layer.metadata.thematic === el.name; });
      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        LayersGroup.addVisibilityByID(Globals.poi.id, element.id, el.checked);
      }
    });
    // Retour en mode invisible pour la couche POI au bas niveaux de zoom
    LayersGroup.addVisibilityByID(Globals.poi.id, `POI OSM isochrone$$$${Globals.poi.id}`, false);
  }

  /**
   * listener sur la carte pour recuperer les coordonnées du point
   * @param {*} e
   */
  onAddWayPoint(e) {
    console.debug(e);
    var coordinates = e.lngLat;
    Reverse.compute({
      lon : coordinates.lng,
      lat : coordinates.lat
    })
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        var coords = Reverse.getCoordinates() || {lon : coordinates.lng, lat : coordinates.lat};
        var address = Reverse.getAddress() || coords.lon.toFixed(6) + ", " + coords.lat.toFixed(6);
        var strAddress = address;
        if (typeof address !== "string") {
          strAddress = "";
          strAddress += (address.number !== "") ? address.number + " " : "";
          strAddress += (address.street !== "") ? address.street + ", " : "";
          strAddress += address.city + ", " + address.postcode;
        }
        this.dom.location.dataset.coordinates = "[" + coords.lon + "," + coords.lat + "]";
        this.dom.location.value = strAddress;
      });
  }

  /**
   * listener issu du dom sur l'interface du menu 'search'
   * @param {*} e
   * @see MenuDisplay.openSearchIsochrone()
   * @see MenuDisplay.closeSearchIsochrone()
   * @see Geocode
   */
  onOpenSearchLocation(e) {
    // contexte
    var self = this;

    // on ouvre le menu
    if (this.options.openSearchControlCbk) {
      this.options.openSearchControlCbk();
    }

    // on transmet d'où vient la demande de location
    var target = e.target;

    // les handler sur
    // - le geocodage
    // - la fermeture du menu
    // - le nettoyage des ecouteurs
    function setLocation(e) {
      // on ferme le menu
      if (e.type !== "geolocation" && self.options.closeSearchControlCbk) {
        self.options.closeSearchControlCbk();
      }
      // on enregistre dans le DOM :
      // - les coordonnées en WGS84G soit lon / lat !
      // - la reponse du geocodage
      target.dataset.coordinates = "[" + e.detail.coordinates.lon + "," + e.detail.coordinates.lat + "]";
      target.value = e.detail.text;
      self.dom.clearLocation.classList.remove("d-none");
      if (self.dom.modeDistance.checked && parseFloat(self.dom.distanceValue.value) > 0 ||
        self.dom.modeDuration.checked && parseFloat(self.dom.durationValueMinutes.value) > 0
      ) {
        self.dom.isochroneCompute.classList.remove("disabled");
      }
      // on supprime les écouteurs
      cleanListeners();
    }
    function cleanListeners() {
      Geocode.target.removeEventListener("search", setLocation);
      Location.target.removeEventListener("geolocation", setLocation);
    }

    // abonnement au geocodage
    Geocode.target.addEventListener("search", setLocation);

    // abonnement à la geolocalisation
    Location.target.addEventListener("geolocation", setLocation);

    window.addEventListener("closesearch", cleanListeners);
  }
}

// mixins
Object.assign(Isochrone.prototype, IsochroneDOM);

export default Isochrone;
