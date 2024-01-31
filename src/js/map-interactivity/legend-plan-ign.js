import globals from "../globals";
import poiLegendRule from "./poi-legend-rules";

function beautifyLayerName(feature, source) {
  // POI OSM
  if (source == "poi_osm") {
    let featureRule = poiLegendRule.filter(l => l.subclass == feature.properties.symbo);
    let legend = [];

    // Pas de règles spécifiées
    if (featureRule.length == 0) {
      if (Object.prototype.hasOwnProperty.call(feature.properties, "texte") && feature.properties.texte) legend.push(feature.properties.texte);
      else legend.push(feature.properties.symbo);
    }
    // En cas de règle
    else {
      legend = featureRule[0].affichage.map(rule =>
      {
        let noTexte = false;
        if (rule == "texte") {
          if (!feature.properties.texte) noTexte = true;
          else return feature.properties.texte;
        }
        if (rule == "symbo" || noTexte) {
          if (!featureRule[0].libelle) return feature.properties.symbo;
          else return featureRule[0].libelle;
        }
      });
    }
    return legend.join("<br/>");
  }
  // PLAN IGN
  else{
    if (Object.prototype.hasOwnProperty.call(feature.layer.hasOwnProperty, "metadata")
        && Object.prototype.hasOwnProperty.call(feature.layer.metadata, "legend-title"))
      return feature.layer.metadata["legend-title"];
  }
  return "";
}

function getMapboxPropAtZoom(feature, prop, zoom, defaultValue) {
  if (Object.prototype.hasOwnProperty.call( feature.paint.hasOwnProperty, prop)) {
    let p = feature.paint[prop];
    // cas des stops récupère la propriété au bon niveau de zoom
    if (Object.prototype.hasOwnProperty.call(p, "stops")) {
      for (let i = p.stops.length - 1; i >= 0; i--){
        if (zoom >= i)
          return p.stops[i][1];
      }
    }
    // cas des steps récupère la propriété au bon niveau de zoom
    if (Array.isArray(p)
            && p[0] == "step"
            && p[1][0] == "zoom") {
      let steps = p.slice(2);
      let response = steps[0];
      for (let i = 0; i < steps.length; i++){
        if (i % 2 == 0) response = steps[i];
        if (i % 2 == 1 && steps[i] > zoom) break;
      }
      return response;
    }
    else {
      return p;
    }
  }
  else {
    return defaultValue;
  }
}

function MapBoxStyleToSVG(features, zoom) {
  const sprite = globals.poi.getSprite();
  var height = 24;
  var width = 36;
  const multiplicator = 2;
  features.forEach(f => {
    if (f.type == "line") {
      const lineWidth = getMapboxPropAtZoom(f, "line-width", zoom, 1) * multiplicator;
      height = lineWidth > height ? lineWidth : height;
    }
    if (f.type == "circle") {
      const circleStrokeWidth = getMapboxPropAtZoom(f, "circle-stroke-width", zoom, 1);
      const radius = getMapboxPropAtZoom(f, "circle-radius", zoom, 0);
      height = circleStrokeWidth + radius > height ? circleStrokeWidth + radius : height;
    }
    if (f.type == "symbol" && Object.prototype.hasOwnProperty.call(f.layout, "icon-image")) {
      let symbol = f.source == "poi_osm" ? globals.poi.getFeatureFillPattern(f) : f.layout["icon-image"];
      height = sprite.json[symbol].height;
      width = sprite.json[symbol].width;
    }
  });

  const x = 0;
  const y = height/2;

  var shape = "";
  features.forEach(f => {
    if (f.type == "symbol" && Object.prototype.hasOwnProperty.call(f.layout, "icon-image")) {
      let symbol = f.source == "poi_osm" ? globals.poi.getFeatureFillPattern(f) : f.layout["icon-image"];
      shape += `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none'\
            width='${width}'\
            height='${height}'\
            x='0' y='0'\
            viewBox='${sprite.json[symbol].x} ${sprite.json[symbol].y} ${sprite.json[symbol].width} ${sprite.json[symbol].height}'>
            <image\
            width="${sprite.size.w}px"\
            height="${sprite.size.h}px"\
            xlink:href="${sprite.url}.png"/></svg>`;
    }
    if (f.type == "fill") {
      // fill-patern
      if (getMapboxPropAtZoom(f, "fill-pattern", zoom, "")) {
        const fillPattern = getMapboxPropAtZoom(f, "fill-pattern", zoom, "");
        shape += `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none'\
                    width='${width}'\
                    height='${height}'\
                    x='0' y='0'\
                    viewBox='${sprite.json[fillPattern].x} ${sprite.json[fillPattern].y} ${sprite.json[fillPattern].width} ${sprite.json[fillPattern].height}'>
                    <image\
                    width="${sprite.size.w}px"\
                    height="${sprite.size.h}px"\
                    xlink:href="${sprite.url}.png"/></svg>`;
      }
      else {
        const fillcolor = getMapboxPropAtZoom(f, "fill-color", zoom, "#FFFFFF");
        const strokecolor = getMapboxPropAtZoom(f, "fill-outline-color", zoom, "#FFFFFF");
        const strokeopacity = getMapboxPropAtZoom(f, "line-opacity", zoom, 1);
        const fillopacity = getMapboxPropAtZoom(f, "ffill-opacity", zoom, 1);
        shape += `<rect\
                    width="100%"\
                    height="100%"\
                    fill="${fillcolor}"\
                    stroke="${strokecolor}"\
                    stroke-opacity="${strokeopacity}"\
                    opacity="${fillopacity}"/>`;
      }
    }
    if (f.type == "line") {
      const strokecolor = getMapboxPropAtZoom(f, "line-color", zoom, "#FFFFFF");
      const lineWidth = getMapboxPropAtZoom(f, "line-width", zoom, 1);
      const opacity = getMapboxPropAtZoom(f, "line-opacity", zoom, 1);
      let dA = getMapboxPropAtZoom(f, "line-dasharray", zoom, []);
      let dashArr = "";
      if (dA.length > 0) {
        dA = dA.map((x) => x * lineWidth).join(" ");
        if (dA) {
          dashArr = `stroke-dasharray="${dA}"`;
        }
      }
      shape += `<line\
                x1=${x}"\
                y1="${y}"\
                x2="${x + width}"\
                y2="${y}"\
                stroke="${strokecolor}"\
                stroke-width="${lineWidth * multiplicator}"\
                stroke-opacity="${opacity}"\
                ${dashArr}"/>`;
    }
    if (f.type == "circle") {
      const circleStrokeWidth = getMapboxPropAtZoom(f, "circle-stroke-width", zoom, 1);
      const strokeOpacity = getMapboxPropAtZoom(f, "circle-stroke-opacity", zoom, 1);
      const circleStroke = getMapboxPropAtZoom(f, "circle-stroke-color", zoom, "#FFFFFF");
      const circleFill = getMapboxPropAtZoom(f, "circle-color", zoom, "#FFFFFF");
      const radius = getMapboxPropAtZoom(f, "circle-radius", zoom, 0);
      shape += `<circle\
                cx="${width / 2}"\
                cy="${height / 2}"\
                r="${radius}"\
                y2="${y}"\
                stroke="${circleStroke}"\
                fill="${circleFill}"\
                stroke-width="${circleStrokeWidth}"\
                stroke-opacity="${strokeOpacity}"/>`;
    }
  });

  let svg = `<svg style='display:inline; transform:translate(0px, 3px)' \
        xmlns='http://www.w3.org/2000/svg' \
        version='1.1' \
        preserveAspectRatio='none' \
        width="${width}" \
        height="${height}" \
        > \
        ${shape}\
        </svg>`;

  return svg;
}

function getLegend(svg, layername) {
  const html = `<div class="divLegendContainer"><div>${svg}</div><div class="divLegendDescription">${layername}</div></div>`;
  return html;
}

function Legend(features, zoom) {

  const stylePLANIGN = globals.manager.layerSwitcher.layers["PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"].style;
  const source = features.length > 0 ? features[0].source : "";
  let legend = "";
  let svg = "";

  var f = features.filter(feat => {
    if (source == "plan_ign" || source == "bdtopo") {
      if (feat.source == "plan_ign" && feat.layer.id != "bckgrd") {
        // Dans le cas où c'est un symbole textuel et pas une icone on n'affichera pas de légende.
        if(feat.layer.type == "symbol" && !Object.prototype.hasOwnProperty.call(feat.layer.layout, "icon-image")) return;
        return feat;
      }
    }
    if (source == "poi_osm") {
      if (feat.source == "poi_osm") return feat;
    }
  });

  if (f.length == 0) return legend;

  /**
     *  Cas où 1er élément dans bdtopo est entité dans une ZA
     *  mais 1er élément dans planIGN est ZA
     *
     *  */
  if (f[0].source == "plan_ign" && f[0].sourceLayer == "bati_zai") {
    if (features[0].sourceLayer != "zone_d_activite_ou_d_interet") f= f.filter(feat => feat.sourceLayer != "bati_zai");
  }

  var featuresForLegend = [];
  /**
     * Gestion des groupes de légende pour PALN IGN:
     *
     * Dans le style, les éléments qui ont le même nom de groupe,
     * contenu dans cette balise,
     *
     * { "metadata" : { "legend-group" : "group-name"}}
     *
     * sont utilisés pour générer le svg de légende.
     *
     */
  if ((source == "plan_ign" || "bdtopo") && f.length > 0) {
    featuresForLegend = stylePLANIGN.filter((elem) => {
      if (elem.id == f[0].layer.id) {
        return elem;
      }
      if (Object.prototype.hasOwnProperty.call(f[0].layer.metadata, "legend-group")
                && Object.prototype.hasOwnProperty.call(elem, "metadata")
                && Object.prototype.hasOwnProperty.call(elem.metadata, "legend-group")
                && f[0].layer.metadata["legend-group"] == elem.metadata["legend-group"]) {
        return elem;
      }
    });
  }

  if (source == "poi_osm") featuresForLegend = f.map(feat => {
    feat.layer["properties"] = feat.properties;
    return feat.layer;
  });

  var layername = f.length > 0 ? beautifyLayerName(f[0], source) : "";
  if (featuresForLegend) {
    svg = MapBoxStyleToSVG(featuresForLegend, zoom);
    legend = getLegend(svg, layername);
  }
  return legend;
}

/**
         * PROBLEME
         * La premiere feature bdtopo n'est pas systématiquement
         * La premiere feature de planIGN.
         * gestion des line dasharray
         * group de légendes : 2 line / 1 line et 1 fill
         *
         * Pour le titre des batiments public aller chercher dans 2e feature de la bdtopo
         * type "zone_d_activite_ou_d_interet"
         * afficher le toponyme
         *
         * CAS à gérer :
         *  -on clique sur la chapelle de l EHPAD de la louvière.
         *  -on clique sur la mairie d'aurillac
         *  -préfecture du Cantal
         *  -forme sous un toponyme
         *
         *  */

export default Legend;
