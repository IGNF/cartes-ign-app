import maplibregl from "maplibre-gl";

import DOM from './dom';
import Globals from './globals';
import Location from './services/location';
import UpdateLegend from './update-legend';
import Layers from './layer-config';

/**
 * Ecouteurs sur la carte
 */
const addListeners = () => {
  const map = Globals.map;

  // Rotation de la carte avec le mutlitouch
  map.on('rotate', () => {
    console.log(map.getBearing());
    DOM.$compassBtn.style.transform = "rotate(" + (map.getBearing() * -1) + "deg)";
    DOM.$compassBtn.classList.remove("d-none");
  });

  // Désactivation du tracking au déplacement non programmatique de la carte
  map.on('movestart', function () {
    if (Globals.movedFromCode) {
      return
    } else if (Location.isTrackingActive()){
      // De tracking a simple suivi de position
      Location.locationOnOff();
      Location.locationOnOff();
    }
  });

  // Légende en fonction du zoom
  map.on("zoomend", UpdateLegend.updateLegend);

  /**
   * Fonction de transformation coordonnées vers pixels d'une tuile
   * @param {*} lat 
   * @param {*} lng 
   * @param {*} zoom 
   * @returns 
   */
  const latlngToTilePixel = (lat, lng, zoom) => {
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

  // GetFeatureInfo
  // FIXME le mecanisme de GFI est à revoir afin de pouvoir requêter toutes les couches
  // ou la plus au dessus de la pile.
  map.on("click", (ev) => {
    let currentLayer = Globals.baseLayerDisplayed;
    if (Globals.dataLayerDisplayed !== '') {
      currentLayer = Globals.dataLayerDisplayed;
    } else if (Globals.mapState === "compare") {
      return
    }
    const layerProps = Layers.getLayerProps(currentLayer);
    let computeZoom = Math.round(map.getZoom());
    if (computeZoom > layerProps.maxNativeZoom) {
      computeZoom = layerProps.maxNativeZoom;
    } else if (computeZoom < layerProps.minNativeZoom) {
      computeZoom = layerProps.minNativeZoom;
    }

    const [ tile, tilePixel ] = latlngToTilePixel(ev.lngLat.lat, ev.lngLat.lng, computeZoom);
    fetch(
      `https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?` +
      `SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&` +
      `LAYER=${layerProps.layer}` +
      `&TILECOL=${tile.x}&TILEROW=${tile.y}&TILEMATRIX=${computeZoom}&TILEMATRIXSET=PM` +
      `&FORMAT=${layerProps.format}` +
      `&STYLE=${layerProps.style}&INFOFORMAT=text/html&I=${tilePixel.x}&J=${tilePixel.y}`
    ).then((response) => {
      if (!response.ok) {
        throw new Error("GetFeatureInfo : HTTP error");
      }
      return response.text()
    }).then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (doc.body.innerText === "\n  \n  \n") {
        throw new Error("Empty GFI");
      }
      new maplibregl.Popup({className: 'getfeatureinfoPopup'})
        .setLngLat(ev.lngLat)
        .setHTML(html)
        .addTo(map);
    }).catch((e) => {
      console.error("GetFeatureInfo", e);
      return;
    })
  });

  // map.on("data", (e) => {
  //   if (!e.isSourceLoaded)  {
  //     return;
  //   }
  //   if (!e.tile) {
  //     return;
  //   }
  //   console.debug("data", e);
  // });
}

export default {
  addListeners
}