/* Pour la mise en cache de tuiles (mode hors ligne) -> désactivé jusqu'à mention contraire... */
const useCachedTiles = false;

export default {
  orthoLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  roadsLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  planLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  parcelLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  cartesLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/jpeg"+
    "&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  ),

  dronesLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  topoLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  etatmajorLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),

  orthoHistoLyr: L.tileLayer.fallback(
    "https://wxs.ign.fr/essentiels/geoportail/wmts?" +
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
    useCache: useCachedTiles,
    }
  ),
}
