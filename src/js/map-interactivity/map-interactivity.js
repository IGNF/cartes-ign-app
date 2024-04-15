import Globals from "../globals";
import DOM from "../dom";
import MapInteractivityLayers from "./map-interactivity-styles";
import featurePropertyFilter from "./feature-property-filter";
import gfiRules from "./gfi-rules";
import colorFromSymbo from "./color-from-symbo";

import Union from "@turf/union";
import Buffer from "@turf/buffer";
import proj4 from "proj4";
import Legend from "./legend-plan-ign";

import LoadingGreen from "../../css/assets/loading-green.svg";


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
      selectedsource: "map-interactivity-selected-poi",
    };

    // style
    this.style = this.options.style || {
      color: getComputedStyle(document.body).getPropertyValue("--dark-green"),
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
    this.map.once("click", this.handleInfoOnMap);
  }

  #getInfoOnMap(ev) {
    if (Globals.backButtonState === "routeDraw") {
      this.map.once("click", this.handleInfoOnMap);
      return;
    }
    if (Globals.backButtonState.split("-")[0] === "position") {
      DOM.$backTopLeftBtn.click();
    }
    let features = this.map.queryRenderedFeatures(ev.point);
    // On clique sur une feature tuile vectorielle
    let featureHTML = null;
    if (features.length > 0 && features[0].source === "location-precision"){
      features.shift();
    }
    if (features.length > 0 && Globals.interactivityIndicator.pii && (features[0].source === "bdtopo" || features[0].source === "poi_osm")) {
      featureHTML = featurePropertyFilter(features[0]);
      if (features[0].source === "poi_osm") {
        const source = this.map.getSource(this.configuration.selectedsource);
        features[0].properties.opacity = 0.6;
        features[0].properties.radiusRatio = 0;
        features[0].properties.color = colorFromSymbo[features[0].properties.symbo];
        source.setData({
          "type": "FeatureCollection",
          "features": [features[0]]
        });
        let intervalId = setInterval(() => {
          if (features[0].properties.radiusRatio >= 1) {
            clearInterval(intervalId);
          }
          features[0].properties.radiusRatio += 0.1;
          source.setData({
            "type": "FeatureCollection",
            "features": [features[0]]
          });
        }, 20);
        const deselectPoiCallback = () => {
          clearInterval(intervalId);
          source.setData({
            "type": "FeatureCollection",
            "features": []
          });
        };
        Globals.position.compute({
          lngLat: ev.lngLat,
          text: Legend(features, Math.floor(this.map.getZoom())),
          html: featureHTML.before,
          html2: featureHTML.after,
          hideCallback: deselectPoiCallback,
        }).then(() => {
          Globals.menu.open("position");
        });
        this.map.once("click", this.handleInfoOnMap);
        return;
      }
    }
    if (!Globals.interactivityIndicator.shown) {
      this.map.once("click", this.handleInfoOnMap);
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

    let layersForGFI = layerswithzoom.filter( layer => layer[1].interactive ).map((layer) => {
      let arr = this.#latlngToTilePixel(ev.lngLat.lat, ev.lngLat.lng, layer[1].computeZoom);
      layer[1].tiles =  {tile: arr[0], tilePixel: arr[1]};
      layer[1].clickCoords = ev.lngLat;
      return layer;
    });

    this.#multipleGFI(layersForGFI)
      .then(async (resp) => {
        this.loading = false;
        DOM.$mapCenter.style.removeProperty("background-image");
      DOM.$mapCenter.style.removeProperty("background-size");
      DOM.$mapCenter.classList.add("d-none");
        try {
          this.#highlightGFI(resp.geometry);
        } catch (e) {
          console.warn(e);
        }
        await Globals.position.compute({
          lngLat: ev.lngLat,
          text: resp.title,
          html: resp.html,
          html2: resp.html2
        });
        Globals.menu.open("position");
        this.map.once("click", this.handleInfoOnMap);
        return;
      }).catch(async () => {
        this.loading = false;
        DOM.$mapCenter.style.removeProperty("background-image");
        DOM.$mapCenter.style.removeProperty("background-size");
        DOM.$mapCenter.classList.add("d-none");
        if (featureHTML !== null) {
          this.#clearSources();
          await Globals.position.compute({
            lngLat: ev.lngLat,
            text: Legend(features, Math.floor(this.map.getZoom())),
            html: featureHTML.before,
            html2: featureHTML.after
          });
          Globals.menu.open("position");
          this.selectedCleabs = features[0].properties.cleabs;
          this.selectedFeatureType = features[0].geometry.type;
          this.#updateHighlightedGeom();
          this.map.on("move", this.handleUpdateHighlightedGeom);
        }
        this.map.once("click", this.handleInfoOnMap);
        return;
      });
  }

  // Met à jour la gémétrie highlightée au moment de la séléction et du déplacement de la carte.
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

    if (["Point", "MultiPoint"].includes(this.selectedFeatureType)) {
      source = this.map.getSource(this.configuration.pointsource);
    } else if (["LineString", "MultiLineString"].includes(this.selectedFeatureType)) {
      union[0] = Buffer(toFuse[0], 5, {units: "meters"});
      for (let i = 1; i <= toFuse.length - 1; i++) {
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
    DOM.$mapCenter.style.backgroundImage = `url(${LoadingGreen})`;
    DOM.$mapCenter.style.backgroundSize = "75px";
    DOM.$mapCenter.classList.remove("d-none");

    let GFIArray = layerArray.filter(layer => layer[1].visibility === true);
    GFIArray = GFIArray.filter(layer => layer[1].base === false);

    // On récupère la liste des indices des layers non requêtables
    let indexbase = [];
    for (var index = 0; index < layerArray.length; index++) {
      if (layerArray[index][1].visibility && layerArray[index][1].base) {
        indexbase.push(index);
      }
    }
    GFIArray = GFIArray.filter(layer => GFIArray.indexOf(layer) < Math.min(...indexbase));

    // check si le pixel de la couche est transparent, si oui, l'enlever de GFI Array (pas de GFI)
    const layersToRemove = [];
    let pixelValuePromiseArray = GFIArray.map((layer) => {
      // Les entités dans ces couches sont transparentes, et donc pixels transparents à ne pas ignorer
      if (["CADASTRALPARCELS.PARCELLAIRE_EXPRESS", "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST"].includes(layer[0].split("$")[0])) {
        return;
      }
      let tileUrl = "https://data.geopf.fr/wmts?" +
      "SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&" +
      `LAYER=${layer[0].split("$")[0]}` +
      `&TILECOL=${layer[1].tiles.tile.x}&TILEROW=${layer[1].tiles.tile.y}&TILEMATRIX=${layer[1].computeZoom}&TILEMATRIXSET=PM` +
      `&FORMAT=${layer[1].format}` +
      `&STYLE=${layer[1].style}`;
      if (layer[0].split(":").slice(-1)[0] === "WMS") {
        // https://wiki.openstreetmap.org/wiki/Zoom_levels
        const resolution = 40075016.686 * Math.cos(layer[1].clickCoords.lat * Math.PI/180) / Math.pow(2, layer[1].computeZoom + 6);
        const clickMercatorCoords = proj4(proj4.defs("EPSG:4326"), proj4.defs("EPSG:3857"), [layer[1].clickCoords.lng, layer[1].clickCoords.lat]);
        // https://gis.stackexchange.com/questions/79201/lat-long-values-in-a-wms-getfeatureinfo-request
        const bottomLeft = [clickMercatorCoords[0] - 50 * resolution, clickMercatorCoords[1] - 50 * resolution];
        const topRight = [clickMercatorCoords[0] + 50 * resolution, clickMercatorCoords[1] + 50 * resolution];
        tileUrl = "https://data.geopf.fr/wms-v/ows?" +
        "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&" +
        `LAYERS=${layer[0].split("$")[0]}` +
        `&QUERY_LAYERS=${layer[0].split("$")[0]}` +
        "&CRS=EPSG:3857" +
        `&BBOX=${bottomLeft[0]},${bottomLeft[1]},${topRight[0]},${topRight[1]}` +
        "&WIDTH=101&HEIGHT=101" +
        "&FORMAT=image/png";
      }

      const response = fetch(tileUrl).then((result) => {
        if (!result.ok) {
          layersToRemove.push(layer);
          return false;
        }
        return result.blob();
      }).then((blob) => {
        if (!blob) {
          return;
        }
        return new Promise( (resolve) => {
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            let pixelData;
            if (layer[0].split(":").slice(-1)[0] === "WMS") {
              pixelData = ctx.getImageData(50, 50, 1, 1).data;
            } else {
              pixelData = ctx.getImageData(layer[1].tiles.tilePixel.x, layer[1].tiles.tilePixel.y, 1, 1).data;
            }
            const pixelValue = pixelData[3]; // Assuming grayscale, adjust accordingly
            if (pixelValue === 0) {
              layersToRemove.push(layer);
            }
            resolve();
          };
          img.src = URL.createObjectURL(blob);
        });
      }).catch((err) => {
        console.error(err);
      });

      return response;
    });

    const pixelValueStatus = Promise.allSettled(pixelValuePromiseArray);
    await pixelValueStatus;
    GFIArray = GFIArray.filter(layer => !layersToRemove.includes(layer));
    // END: check des pixels transparents

    let promisesArray = GFIArray.map((layer) => {
      let gfiURL = "https://data.geopf.fr/wmts?" +
        "SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&" +
        `LAYER=${layer[0].split("$")[0]}` +
        `&TILECOL=${layer[1].tiles.tile.x}&TILEROW=${layer[1].tiles.tile.y}&TILEMATRIX=${layer[1].computeZoom}&TILEMATRIXSET=PM` +
        `&FORMAT=${layer[1].format}` +
        `&STYLE=${layer[1].style}&INFOFORMAT=application/json&I=${layer[1].tiles.tilePixel.x}&J=${layer[1].tiles.tilePixel.y}`;
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
        "&INFO_FORMAT=application/json&I=50&J=50";
      }
      const response = fetch(
        gfiURL,
        { signal: this.controller.signal }
      ).then((response => {return response.json();}), () => {
        throw new Error("GetFeatureInfo : HTTP error");
      }).then((res) => {
        if (gfiRules[layer[0]]) {
          return gfiRules.parseGFI(gfiRules[layer[0]], res, layer[1].computeZoom);
        } else {
          let html = "<div>";
          for (const [key, value] of Object.entries(res.features[0].properties)) {
            html += `<p>${key}: ${value}</p>`;
          }
          html += "</div>";
          return {
            title: layer[1].title,
            html: html,
            geometry: res.features[0].geometry,
          };
        }
      });
      return response;
    });

    let responsesArray = Promise.allSettled(promisesArray);
    let response = (await responsesArray).find(r => r.status == "fulfilled");
    if (response) {
      return response.value;
    }
    else {
      throw new Error(this.emptyError);
    }
  }

  /**
   * Ajoute à la carte la géométrie de la feature cliquée dans un GFI
   * @param {*} gfiGeom
   */
  #highlightGFI(gfiGeom) {
    this.#clearSources();
    let source;

    if (["Point", "MultiPoint"].includes(gfiGeom.type)) {
      source = this.map.getSource(this.configuration.pointsource);
    } else if (["LineString", "MultiLineString"].includes(gfiGeom.type)) {
      source = this.map.getSource(this.configuration.polygonsource);
    } else {
      source = this.map.getSource(this.configuration.polygonsource);
    }
    this.#convertCoords(gfiGeom.coordinates);
    source.setData(gfiGeom);
  }

  /**
   * Convertit les coordonnées d'une feature GFI de webmarcator à WGS 84 de manière recursive
   * @param {*} array geometry.coordinates
   */
  #convertCoords(array) {
    if (typeof array[0] !== "number") {
      array.forEach(elem => this.#convertCoords(elem));
      return;
    }
    const convertedCoords = proj4(proj4.defs("EPSG:3857"), proj4.defs("EPSG:4326"), array);
    array[0] = convertedCoords[0];
    array[1] = convertedCoords[1];
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

    this.map.addSource(this.configuration.selectedsource, {
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

    MapInteractivityLayers["selected-poi"].source = this.configuration.selectedsource;
    MapInteractivityLayers["selected-poi-symbol"].source = this.configuration.selectedsource;
    this.map.addLayer(MapInteractivityLayers["selected-poi"]);
    this.map.addLayer(MapInteractivityLayers["selected-poi-symbol"]);
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
      DOM.$mapCenter.style.removeProperty("background-image");
      DOM.$mapCenter.style.removeProperty("background-size");
      DOM.$mapCenter.classList.add("d-none");
    }
    this.#clearSources();
  }
}

export default MapInteractivity;
