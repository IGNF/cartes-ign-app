import IsochroneDOM from "./isochrone-dom";
import Globals from "../globals";

// dependance : abonnement au event du module
import Geocode from "../services/geocode";
import Location from "../services/location";
import Reverse from "../services/reverse";

/**
 * Interface sur le contrôle isochrone
 * @module Isochrone
 * @todo mise en place d'une patience
 * @todo ajouter les fonctionnalités : cf. DOM
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
      closeSearchControlCbk: null
    };

    // configuration
    this.configuration = this.options.configuration || {
      source: "isochrone",
      api: "https://valhalla1.openstreetmap.de/",
      route: "isochrone",
      key: "json",
      template: (values) => {
        return `{
                  "locations":[
                      { "lat" : ${values.location.lat}, "lon" : ${values.location.lon} }
                  ],
                  "costing" : "${values.transport}",
                  "contours" : [
                      { "${values.mode}" : ${values.value}, "color" : "${values.style.color}" }
                  ],
                  "polygons" : true,
                  "show_locations" : true
              }`
      }
    }

    // style
    this.style = this.options.style || {
      color: "26a581",
      opacity: 0.85
    };

    // target
    this.target = this.options.target;

    // carte
    this.map = map;

    // rendu graphique
    this.render();

    // annulation de la reqête fetch
    this.controller = new AbortController();

    // requête en cours d'execution ?
    this.loading = false;

    // bind
    this.onAddWayPoint = this.onAddWayPoint.bind(this);

    return this;
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    var target = this.target || document.getElementById("isochroneWindow");
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
  async compute(settings) {
    console.log(settings);
    // nettoyage de l'ancien parcours !
    this.clear();
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
          transport = "auto";
          break;

        default:
          transport = "auto";
          break;
      }
    }

    var mode = null;
    var value = null;
    if (settings.mode) {
      // mettre en place le mode calcul !
      switch (settings.mode.type) {
        case "Distance":
          mode = "distance";
          value = Math.round(parseFloat(settings.mode.value, 10) * 1000) / 1000; // km arrondi au mètre
          break;
        case "Temps":
          mode = "time";
          value = parseFloat(settings.mode.value) / 60; // secondes -> minutes
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
      this.configuration.key + "=" +
      encodeURIComponent(this.configuration.template({
        transport: transport,
        mode: mode,
        value: value,
        location: location,
        style: {
          color: this.style.color
        }
      }));

    this.loading = true;
    var response = await fetch(url, { signal: this.controller.signal });
    var geojson = await response.json();
    this.loading = false;

    if (response.status !== 200) {
      throw new Error(response.message);
    }

    if (settings.showOutline) {
      this.map.addSource(this.configuration.source, {
        "type": "geojson",
        "data": geojson
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

    function getBoundingBox(data) {
      var bounds = {};
      for (var i = 0; i < data.length; i++) {
        var lon = data[i][0];
        var lat = data[i][1];
        bounds.xMin = bounds.xMin < lon ? bounds.xMin : lon;
        bounds.xMax = bounds.xMax > lon ? bounds.xMax : lon;
        bounds.yMin = bounds.yMin < lat ? bounds.yMin : lat;
        bounds.yMax = bounds.yMax > lat ? bounds.yMax : lat;
      }

      return [[bounds.xMin, bounds.yMin], [bounds.xMax, bounds.yMax]];
    }

    // par defaut, le 1er feature devrait être le résultat...
    var points = geojson.features[0].geometry.coordinates[0];
    var bbox = getBoundingBox(points);
    this.map.fitBounds(bbox, {
      padding: 20
    });
    Globals.currentScrollIndex = 0;
    Globals.menu.updateScrollAnchors();
  }

  /**
   * nettoyage du tracé
   * @public
   */
  clear() {
    // on stoppe le fetch en cours sur le service
    if (this.loading) {
      this.controller.abort();
      this.controller = new AbortController();
      this.loading = false;
    }

    if (this.map.getLayer(this.configuration.source)) {
      this.map.removeLayer(this.configuration.source);
    }
    if (this.map.getSource(this.configuration.source)) {
      this.map.removeSource(this.configuration.source);
    }
  }

  /**
   * activation du mode interaction
   * @param {*} status
   * @public
   */
  interactive(status) {
    if (status) {
      this.map.on("click", this.onAddWayPoint);
    } else {
      this.map.off("click", this.onAddWayPoint);
    }
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
    .then(() => {
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
    })
    .catch(() => {})
    .finally(() => {});
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
      // on supprime les écouteurs
      cleanListeners();
    }
    function cleanLocation(e) {
      target.dataset.coordinates = "";
      target.value = "";
      cleanListeners();
    }
    function cleanListeners() {
      var close = document.getElementById("closeSearch");
      if (close) {
        close.removeEventListener("click", cleanLocation);
      }
      Geocode.target.removeEventListener("search", setLocation);
      Location.target.removeEventListener("geolocation", setLocation);
    }

    // abonnement au geocodage
    Geocode.target.addEventListener("search", setLocation);

    // abonnement à la geolocalisation
    Location.target.addEventListener("geolocation", setLocation);

    // abonnement au bouton de fermeture du menu
    var close = document.getElementById("closeSearch");
    if (close) {
      close.removeEventListener("click", cleanLocation);
    }
  }

}

// mixins
Object.assign(Isochrone.prototype, IsochroneDOM);

export default Isochrone;
