import maplibregl from "maplibre-gl";

import DOM from './dom';
import Globals from './globals';
import Location from './services/location';
import Layers from './layer-config';
// import GFI from './gfi';
import multipleGFI from './gfi';

/**
 * Ecouteurs sur la carte
 */
const addListeners = () => {
  const map = Globals.map;

  // TODO pour des zooms à niveaux entiers uniquement (utilie si POI toujouts limités à zoom 16)
  // map.on('zoom', function() {
  //   var currentZoom = map.getZoom();
  //   var roundedZoom = Math.round(currentZoom); // Round the zoom level to the nearest whole number

  //   if (currentZoom !== roundedZoom) {
  //       // Set the map's zoom level to the rounded value
  //       map.once('moveend', function() {
  //           map.setZoom(roundedZoom);
  //       });
  //   }
  // });

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
      Location.disableTracking();
    }
  });

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
    if (!Globals.interactivity.activated) {
      return;
    }
    let features = map.queryRenderedFeatures(ev.point);
    // On clique sur une feature tuile vectorielle
    let featureHTML;
    if (features.length > 0) {
      featureHTML = JSON.stringify(features[0].properties)
      if (features[0].source === "poi_osm") {
        new maplibregl.Popup({className: 'getfeatureinfoPopup'})
          .setLngLat(ev.lngLat)
          .setHTML(featureHTML)
          .addTo(map);
        return;
      }
    }

    // GFI au sens OGC
    // on ne fait pas de GFI sur les bases layers
    let currentLayers = Globals.manager.layerSwitcher.getLayersOrder().reverse();
    let layerswithzoom = currentLayers.map((layer) => {
      let computeZoom = Math.round(map.getZoom());
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
      let arr = latlngToTilePixel(ev.lngLat.lat, ev.lngLat.lng, layer[1].computeZoom);
      layer[1].tiles =  {tile: arr[0], tilePixel: arr[1]}
      return layer
    });

    multipleGFI(layersForGFI)
      .then((html) => {
        new maplibregl.Popup({className: 'getfeatureinfoPopup'})
        .setLngLat(ev.lngLat)
        .setHTML(html)
        .addTo(map);
        return;
      }).catch((err) => {
        if (featureHTML && featureHTML != '{}') {
          new maplibregl.Popup({className: 'getfeatureinfoPopup'})
          .setLngLat(ev.lngLat)
          .setHTML(featureHTML)
          .addTo(map);
        }
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
