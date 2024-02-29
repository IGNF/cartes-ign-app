import Globals from "../globals";
import DOM from "../dom";
import MapInteractivityLayers from "./map-interactivity-styles";
import featurePropertyFilter from "./feature-property-filter";

import Union from "@turf/union";
import Buffer from "@turf/buffer";
import proj4 from "proj4";
import Legend from "./legend-plan-ign";

/**
 * Interface sur l'interaction avec la carte
 * @module MapInteractivity
*/
class MapInteractivity {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
  */
  constructor (map, options) {
    this.options = options || {
      configuration: {},
      style: {},
    };

    // configuration
    this.configuration = this.options.configuration || {
      pointsource: "map-interactivity-point",
      polygonsource: "map-interactivity-polygon",
    };

    // style
    this.style = this.options.style || {
      color: "26a581",
      opacity: 0.85
    };

    this.emptyError = `
      Absence de données
    `;

    // carte
    this.map = map;

    this.#addSourcesAndLayers();

    // cleabs et type de géométrie de la donnée séléctionnée dans plan ign interactif
    this.selectedCleabs = null;
    this.selectedFeatureType = null;

    // fonction d'event avec bind
    this.handleInfoOnMap = this.#getInfoOnMap.bind(this);
    this.handleUpdateHighlightedGeom = this.#updateHighlightedGeom.bind(this);

    // annulation de la reqête fetch
    this.controller = new AbortController();

    // requête en cours d'execution ?
    this.loading = false;

    this.#listeners();

    return this;
  }

  #listeners() {
    this.map.on("click", this.handleInfoOnMap);
  }

  #getInfoOnMap(ev) {
    if (Globals.backButtonState === "routeDraw") {
      return;
    }
    if (Globals.backButtonState.split("-")[0] === "position") {
      DOM.$backTopLeftBtn.click();
    }
    let features = this.map.queryRenderedFeatures(ev.point);
    // TODO: Patience
    this.map.off("click", this.handleInfoOnMap);
    // On clique sur une feature tuile vectorielle
    let featureHTML = null;
    if (features.length > 0 && features[0].source === "location-precision"){
      features.shift();
    }
    if (features.length > 0 && (features[0].source === "bdtopo" || features[0].source === "poi_osm")) {
      featureHTML = featurePropertyFilter(features[0]);
      if (features[0].source === "poi_osm") {
        Globals.position.compute(ev.lngLat, Legend(features, Math.floor(this.map.getZoom())), featureHTML).then(() => {
          Globals.menu.open("position");
        });
        this.map.on("click", this.handleInfoOnMap);
        return;
      }
    }
    if (!Globals.interactivityIndicator.shown) {
      this.map.on("click", this.handleInfoOnMap);
      return;
    }

    // GFI au sens OGC
    // on ne fait pas de GFI sur les bases layers
    let currentLayers = Globals.manager.layerSwitcher.getLayersOrder().reverse();
    let layerswithzoom = currentLayers.map((layer) => {
      let computeZoom = Math.round(this.map.getZoom()) + 1;
      if (computeZoom > layer[1].maxNativeZoom) {
        layer[1].computeZoom = layer[1].maxNativeZoom;
        return layer;
      } else if (computeZoom < layer[1].minNativeZoom) {
        layer[1].computeZoom = layer[1].minNativeZoom;
        return layer;
      }
      else {
        layer[1].computeZoom = computeZoom;
        return layer;
      }
    });

    let layersForGFI = layerswithzoom.map((layer) => {
      let arr = this.#latlngToTilePixel(ev.lngLat.lat, ev.lngLat.lng, layer[1].computeZoom);
      layer[1].tiles =  {tile: arr[0], tilePixel: arr[1]};
      layer[1].clickCoords = ev.lngLat;
      return layer;
    });

    this.#multipleGFI(layersForGFI)
      .then((resp) => {
        this.loading = false;
        Globals.position.compute(ev.lngLat, resp.layer, resp.html).then(() => {
          Globals.menu.open("position");
        });
        this.map.on("click", this.handleInfoOnMap);
        return;
      }).catch(() => {
        this.loading = false;
        if (featureHTML !== null) {
          this.#clearSources();
          Globals.position.compute(ev.lngLat, Legend(features, Math.floor(this.map.getZoom())), featureHTML).then(() => {
            Globals.menu.open("position");
            this.selectedCleabs = features[0].properties.cleabs;
            this.selectedFeatureType = features[0].geometry.type;
            this.#updateHighlightedGeom();
            this.map.on("move", this.handleUpdateHighlightedGeom);
          });
        }
        this.map.on("click", this.handleInfoOnMap);
        return;
      });
  }

  // Met à jour la gémétrie highlightée au moment de la séléction et du dpélacement de la carte.
  #updateHighlightedGeom() {
    let source;
    const mapFeatures = this.map.queryRenderedFeatures();
    let toFuse = [];
    mapFeatures.forEach(feat => {
      if (feat.source === "bdtopo" && feat.properties.cleabs === this.selectedCleabs) {
        toFuse.push(feat);
      }
    });
    if (toFuse.length == 0) {
      return;
    }
    let union = [toFuse[0]];

    if (this.selectedFeatureType == "Point") {
      source = this.map.getSource(this.configuration.pointsource);
    } else if (this.selectedFeatureType == "LineString") {
      union[0] = Buffer(toFuse[0], 5, {units: "meters"});
      console.log(toFuse);
      for (let i = 1; i <= toFuse.length - 1; i++) {
        console.log(i);
        union[0] = Union(union[0], Buffer(toFuse[i], 5, {units: "meters"}), {properties: union.properties});
      }
      source = this.map.getSource(this.configuration.polygonsource);
    } else {
      for (let i = 1; i <= toFuse.length - 1; i++) {
        union[0] = Union(union[0], toFuse[i], {properties: union.properties});
      }
      source = this.map.getSource(this.configuration.polygonsource);
    }
    source.setData({
      "type": "FeatureCollection",
      "features": union,
    });
  }

  /**
   * Fonction de transformation coordonnées vers pixels d'une tuile
   * @param {*} lat
   * @param {*} lng
   * @param {*} zoom
   * @returns
  */
  #latlngToTilePixel(lat, lng, zoom) {
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const fullXTile = (lng + 180) / 360 * Math.pow(2, zoom);
    const fullYTile = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    const tile = {
      x: Math.floor(fullXTile),
      y: Math.floor(fullYTile),
    };
    const tilePixel = {
      x: Math.floor((fullXTile - tile.x) * 256),
      y: Math.floor((fullYTile - tile.y) * 256),
    };
    return [tile, tilePixel];
  }

  async #multipleGFI(layerArray) {
    this.loading = true;

    let GFIArray = layerArray.filter(layer => layer[1].visibility == true);
    GFIArray = GFIArray.filter(layer => layer[1].base == false);

    // On récupère la liste des indices des layers non requêtables
    let indexbase = [];
    for (var index = 0; index < layerArray.length; index++) {
      if(layerArray[index][1].visibility && layerArray[index][1].base)
      {
        indexbase.push(index);
      }
    }
    GFIArray = GFIArray.filter(layer => GFIArray.indexOf(layer) < Math.min(...indexbase));

    let promisesArray = GFIArray.map((layer) => {
      let gfiURL = "https://data.geopf.fr/wmts?" +
        "SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&" +
        `LAYER=${layer[0].split("$")[0]}` +
        `&TILECOL=${layer[1].tiles.tile.x}&TILEROW=${layer[1].tiles.tile.y}&TILEMATRIX=${layer[1].computeZoom}&TILEMATRIXSET=PM` +
        `&FORMAT=${layer[1].format}` +
        `&STYLE=${layer[1].style}&INFOFORMAT=text/html&I=${layer[1].tiles.tilePixel.x}&J=${layer[1].tiles.tilePixel.y}`;
      if (layer[0].split(":").slice(-1)[0] === "WMS") {
        // https://wiki.openstreetmap.org/wiki/Zoom_levels
        const resolution = 40075016.686 * Math.cos(layer[1].clickCoords.lat * Math.PI/180) / Math.pow(2, layer[1].computeZoom + 6);
        const clickMercatorCoords = proj4(proj4.defs("EPSG:4326"), proj4.defs("EPSG:3857"), [layer[1].clickCoords.lng, layer[1].clickCoords.lat]);
        // https://gis.stackexchange.com/questions/79201/lat-long-values-in-a-wms-getfeatureinfo-request
        const bottomLeft = [clickMercatorCoords[0] - 50 * resolution, clickMercatorCoords[1] - 50 * resolution];
        const topRight = [clickMercatorCoords[0] + 50 * resolution, clickMercatorCoords[1] + 50 * resolution];
        gfiURL = "https://data.geopf.fr/wms-v/ows?" +
        "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&" +
        `LAYERS=${layer[0].split("$")[0]}` +
        `&QUERY_LAYERS=${layer[0].split("$")[0]}` +
        "&CRS=EPSG:3857" +
        `&BBOX=${bottomLeft[0]},${bottomLeft[1]},${topRight[0]},${topRight[1]}` +
        "&WIDTH=101&HEIGHT=101" +
        "&INFO_FORMAT=text/html&I=50&J=50";
      }
      const response = fetch(
        gfiURL,
        { signal: this.controller.signal }
      ).then((response => {return response.text();})
        ,
        () => {
          throw new Error("GetFeatureInfo : HTTP error");
        })
        .then((res) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(res, "text/html");
          if (!doc.body.innerText.trim()) {
            throw new Error(this.emptyError);
          }
          const xml = parser.parseFromString(res, "text/xml");
          if (xml.getElementsByTagName("ExceptionReport").length > 0) {
            const serializer = new XMLSerializer();
            const xmlStr = serializer.serializeToString(doc);
            throw new Error(xmlStr);
          }
          return res;
        });
      return response;
    });

    let responsesArray = Promise.allSettled(promisesArray);
    let response = (await responsesArray).find(r => r.status == "fulfilled");
    if (response) {
      let i = (await responsesArray).indexOf(response);
      const result = {
        layer: layerArray[i][1].title,
        html: response.value,
      };
      return result;
    }
    else {
      throw new Error(this.emptyError);
    }
  }


  /**
  * ajoute la source et le layer à la carte pour affichage du tracé
  */
  #addSourcesAndLayers() {
    this.map.addSource(this.configuration.pointsource, {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      },
    });
    this.map.addSource(this.configuration.polygonsource, {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      },
    });
    MapInteractivityLayers["point"].source = this.configuration.pointsource;
    this.map.addLayer(MapInteractivityLayers["point"]);
    MapInteractivityLayers["polygon"].source = this.configuration.polygonsource;
    this.map.addLayer(MapInteractivityLayers["polygon"]);
    MapInteractivityLayers["polygon-outline"].source = this.configuration.polygonsource;
    this.map.addLayer(MapInteractivityLayers["polygon-outline"]);
  }

  /**
   * Supprime les donnés dans les sources
   */
  #clearSources() {
    this.map.off("move", this.handleUpdateHighlightedGeom);
    this.map.getSource(this.configuration.pointsource).setData({
      "type": "FeatureCollection",
      "features": []
    });
    this.map.getSource(this.configuration.polygonsource).setData({
      "type": "FeatureCollection",
      "features": []
    });
  }

  /**
     * nettoyage de la mise en surbrillance
     * @public
     */
  clear () {
    if (this.loading) {
      this.controller.abort();
      this.controller = new AbortController();
      this.loading = false;
    }
    this.#clearSources();
  }
}

export default MapInteractivity;
