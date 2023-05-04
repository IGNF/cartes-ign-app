/* Pour la mise en cache de tuiles (mode hors ligne) -> désactivé jusqu'à mention contraire... */
const useCachedTiles = false;

export default {
  baseLayers: {
    "photos": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/jpeg"+
      "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        maxZoom : 19,
        maxNativeZoom : 19,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 0,
        useCache: useCachedTiles,
      }
    ),

    "plan-ign": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/png"+
      "&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        minNativeZoom : 3,
        maxZoom : 19,
        maxNativeZoom : 19,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 0,
        useCache: useCachedTiles,
      }
    ),

    "topo": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/jpeg"+
      "&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR.CV"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        minNativeZoom : 6,
        maxZoom : 19,
        maxNativeZoom : 16,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 0,
        useCache: useCachedTiles,
      }
    ),

    "etat-major": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/jpeg"+
      "&LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        minNativeZoom : 6,
        maxZoom : 19,
        maxNativeZoom : 15,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 0,
        useCache: useCachedTiles,
      }
    ),

    "ortho-histo": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/png"+
      "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS.1950-1965"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        minNativeZoom : 3,
        maxZoom : 19,
        maxNativeZoom : 18,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 0,
        useCache: useCachedTiles,
      }
    ),
  },

  dataLayers: {
    "cadastre": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=PCI%20vecteur" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/png"+
      "&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        maxZoom : 19,
        maxNativeZoom : 19,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256 ,// les tuiles du Géooportail font 256x256px
        zIndex: 1,
        useCache: useCachedTiles,
      }
    ),

    "drones": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/png"+
      "&LAYER=TRANSPORTS.DRONES.RESTRICTIONS"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        minNativeZoom : 3,
        maxZoom : 19,
        maxNativeZoom : 18,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 1,
        useCache: useCachedTiles,
      }
    ),

    "routes": L.tileLayer.fallback(
      "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/png"+
      "&LAYER=TRANSPORTNETWORKS.ROADS"+
      "&TILEMATRIX={z}" +
        "&TILEROW={y}" +
        "&TILECOL={x}",
      {
        minZoom : 0,
        minNativeZoom : 6,
        maxZoom : 19,
        maxNativeZoom : 18,
        attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
        tileSize : 256, // les tuiles du Géooportail font 256x256px
        zIndex: 1,
        useCache: useCachedTiles,
      }
    ),
  },
}
