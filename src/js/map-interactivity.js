import Globals from "./globals";

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
        linesource: "map-interactivity-line",
        pointsource: "map-interactivity-point",
        polygonsource: "map-interactivity-point",
    }

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

    this.#listeners();

    return this;
  }

  #listeners() {
    this.map.on("click", (ev) => {this.#getInfoOnMap(ev); });
  }

  #getInfoOnMap(ev) {
    if (!Globals.interactivityIndicator.shown) {
      return;
    }
    if (Globals.backButtonState === "position") {
      Globals.menu.close("position");
    }
    let features = this.map.queryRenderedFeatures(ev.point);
    // On clique sur une feature tuile vectorielle
    let featureHTML;
    if (features.length > 0) {
      console.log(features)
      featureHTML = JSON.stringify(features[0].properties);
      if (features[0].source === "poi_osm") {
        let featureName = features[0].properties.texte;
        Globals.position.compute(ev.lngLat, featureName, featureHTML).then(() => {
          Globals.menu.open("position");
        });
        return;
      }
    }

    // GFI au sens OGC
    // on ne fait pas de GFI sur les bases layers
    let currentLayers = Globals.manager.layerSwitcher.getLayersOrder().reverse();
    let layerswithzoom = currentLayers.map((layer) => {
      let computeZoom = Math.round(this.map.getZoom());
      if (computeZoom > layer[1].maxNativeZoom) {
        layer[1].computeZoom = layer[1].maxNativeZoom;
        return layer
      } else if (computeZoom < layer[1].minNativeZoom) {
        layer[1].computeZoom = layer[1].minNativeZoom;
        return layer
      }
      else {
        layer[1].computeZoom = computeZoom;
        return layer;
      }
    });

    let layersForGFI = layerswithzoom.map((layer) => {
      let arr = this.#latlngToTilePixel(ev.lngLat.lat, ev.lngLat.lng, layer[1].computeZoom);
      layer[1].tiles =  {tile: arr[0], tilePixel: arr[1]}
      return layer
    });

    this.#multipleGFI(layersForGFI)
      .then((resp) => {
        Globals.position.compute(ev.lngLat, resp.layer, resp.html).then(() => {
          Globals.menu.open("position");
        });
        return;
      }).catch((err) => {
        if (featureHTML && featureHTML != '{}') {
          Globals.position.compute(ev.lngLat, features[0].sourceLayer, featureHTML).then(() => {
            Globals.menu.open("position");
          });
        }
        return;
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
    return [tile, tilePixel]
  }

  async #multipleGFI(layerArray) {
    let GFIArray = layerArray.filter(layer => layer[1].visibility == true)

    // On récupère la liste des indices des layers non requêtables
    let indexbase = []
    for (var index = 0; index < layerArray.length; index++) {
      if(layerArray[index][1].visibility && layerArray[index][1].base)
        {
          indexbase.push(index)
        }
    }

    let promisesArray = GFIArray.map((layer) => {
      const response = fetch(
        `https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?` +
        `SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&` +
        `LAYER=${layer[0].split('$')[0]}` +
        `&TILECOL=${layer[1].tiles.tile.x}&TILEROW=${layer[1].tiles.tile.y}&TILEMATRIX=${layer[1].computeZoom}&TILEMATRIXSET=PM` +
        `&FORMAT=${layer[1].format}` +
        `&STYLE=${layer[1].style}&INFOFORMAT=text/html&I=${layer[1].tiles.tilePixel.x}&J=${layer[1].tiles.tilePixel.y}`
      ).then((response => {return response.text()})
      ,
      () => {
        throw new Error("GetFeatureInfo : HTTP error");
      })
      .then((res) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res, "text/html");
        if (doc.body.innerText === "\n  \n  \n") {
          throw new Error(emptyError);
        }
        const xml = parser.parseFromString(res, "text/xml");
        if (xml.getElementsByTagName('ExceptionReport').length > 0) {
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
      const isAboveThreshold = (v) => v > i;
      // on ne retourne une infobulle que si la couche n'est pas recouverte par une couche non requêtable
      if (indexbase.every(isAboveThreshold)) {
        const result = {
          layer: layerArray[i][1].title,
          html: response.value,
        };
        return result;
      }
      else {
        throw new Error("Under non requestable layer");
      }
    }
    else {
      throw new Error(emptyError);
    }
  }
}


export default MapInteractivity;
