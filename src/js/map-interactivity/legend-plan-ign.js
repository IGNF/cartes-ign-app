import globals from "../globals";
import poiLegendRule from "./poi-legend-rules";

function beautifyLayerName(feature, source) {
  // POI OSM
  if (source == "poi_osm") {
    let featureRule = poiLegendRule.filter((l) => {
      let classMatches = true;
      if (l.class) {
        classMatches = l.class == feature.properties.class;
      }
      const subclassMatches = l.subclass == feature.properties.subclass;
      return subclassMatches && classMatches;
    });
    let legend = [];

    let texte = Object.hasOwnProperty.call(feature.properties, "texte") ? feature.properties.texte : "";
    let symbo = Object.hasOwnProperty.call(feature.properties, "symbo") ? feature.properties.symbo : "";
    if (texte) {
      legend.push(texte);
    }
    if (symbo && featureRule.length > 0) {
      symbo = Object.hasOwnProperty.call(featureRule[0], "libelle") ? featureRule[0].libelle : symbo;
      if (!texte) {
        legend.push(symbo);
      }
      if (symbo !== "" && texte) {
        legend.push(`<p class="positionSubTitle">${symbo} - Source : OpenStreetMap</p>`);
      } else {
        legend.push("<p class=\"positionSubTitle\">Source : OpenStreetMap</p>");
      }
    } else {
      legend.push("<p class=\"positionSubTitle\">Source : OpenStreetMap</p>");
    }
    return legend.join("");
  }
  // PLAN IGN
  else {
    let legend = [];
    if (Object.hasOwnProperty.call(feature.properties, "texte") && feature.properties.texte) {
      legend.push(feature.properties.texte);
    } else if (Object.hasOwnProperty.call(feature.layer, "metadata") && Object.hasOwnProperty.call(feature.layer.metadata, "legend-title")) {
      legend.push(feature.layer.metadata["legend-title"]);
    }
    if (legend.length > 0) {
      legend.push("<p class=\"positionSubTitle\">Source : BD Topo® - IGN</p>");
    }
    return legend.join("");
  }
}

function getMapboxPropAtZoom(feature, prop, zoom, defaultValue) {
  if (Object.hasOwnProperty.call(feature.paint, prop)) {
    let p = feature.paint[prop];
    // cas des stops récupère la propriété au bon niveau de zoom
    if (Object.hasOwnProperty.call(p, "stops")) {
      for (let i = p.stops.length - 1; i >= 0; i--) {
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
      for (let i = 0; i < steps.length; i++) {
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
  let lineHeight = 0;

  features.forEach(f => {
    if (f.type == "line") {
      const lineWidth = getMapboxPropAtZoom(f, "line-width", zoom, 1) * multiplicator;
      lineHeight += lineWidth;
    }
    if (f.type == "circle") {
      const circleStrokeWidth = getMapboxPropAtZoom(f, "circle-stroke-width", zoom, 1);
      const radius = getMapboxPropAtZoom(f, "circle-radius", zoom, 0);
      height = circleStrokeWidth + radius > height ? circleStrokeWidth + radius : height;
    }
    if (f.type == "symbol" && Object.hasOwnProperty.call(f.layout, "icon-image")) {
      let symbol = f.source == "poi_osm" ? globals.poi.getFeatureFillPattern(f) : f.layout["icon-image"];
      height = sprite.json[symbol].height;
      width = sprite.json[symbol].width;
    }
  });
  if (lineHeight > 0) height = lineHeight;

  const x = 0;
  const y = height / 2;

  var shape = "";
  features.forEach(f => {
    if (f.type == "symbol" && Object.hasOwnProperty.call(f.layout, "icon-image")) {
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

  const source = features.length > 0 ? features[0].source : "";
  let legend = "";
  let svg = "";
  var layername = "";

  // Légende pour POI
  if (source == "poi_osm") {
    let featurePOI = features.filter(feat => {
      if (source == "poi_osm" && feat.source == "poi_osm" && feat.layer.type === "symbol") {
        return feat;
      }
    }).map(feat => {
      feat.layer["properties"] = feat.properties;
      return feat.layer;
    });
    layername = featurePOI.length > 0 ? beautifyLayerName(featurePOI[0], source) : "";
    if (featurePOI) {
      svg = MapBoxStyleToSVG(featurePOI, zoom);
      legend = getLegend(svg, layername);
    }
    return legend;
  }


  // PLAN IGN et BDTOPO
  let stylePLANIGN = [];
  if (source == "plan_ign" || source == "bdtopo") {
    stylePLANIGN = globals.manager.layerSwitcher.layers["PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"].style;
  }

  var FeaturesBDTOPO = features.filter(feat => feat.source == "bdtopo");
  if (FeaturesBDTOPO.length == 0) {
    return legend;
  }

  var FeaturesPLANIGN = features.filter(feat => {
    if (source == "plan_ign" || source == "bdtopo") {
      if (feat.source == "plan_ign" && feat.layer.id.split("$$$")[0] !== "bckgrd") {
        // Dans le cas où c'est un symbole textuel et pas une icone on n'affichera pas de légende.
        if (feat.layer.type == "symbol" && !Object.hasOwnProperty.call(feat.layer.layout, "icon-image")){
          return;
        }
        // les aplats zone bati ne sont jamais représentés dans la bdtopo
        if (feat.layer.id == "zone batie") {
          return;
        }

        // Exceptions à la règle suivante qui évite les désynchronisations
        if (feat.sourceLayer == "toponyme_bati_ponc" && FeaturesBDTOPO[0].sourceLayer == "equipement_de_transport") {
          return feat;
        }
        if (
          feat.sourceLayer == "bati_ponc"
          && ["construction_ponctuelle", "detail_hydrographique"].some(name => FeaturesBDTOPO[0].sourceLayer == name)
        ) {
          return feat;
        }

        // pour éviter les désynchronisation Bdtopo PLANIGN  on prend feature de plan ign si correspond au type de feature bdtopo sélectionnée.
        if (feat.layer.type != FeaturesBDTOPO[0].layer.type) {
          return;
        }

        return feat;
      }
    }
  });
  if (FeaturesPLANIGN.length == 0) {
    return legend;
  }

  /**
   *  Cas où 1er élément dans bdtopo est entité dans une ZA
   *  mais 1er élément dans planIGN est ZA
   *
   *  */
  if (FeaturesPLANIGN[0].sourceLayer == "bati_zai") {
    if (FeaturesBDTOPO[0].sourceLayer != "zone_d_activite_ou_d_interet") FeaturesPLANIGN.shift();
  }

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
  var featuresForLegend = [];
  featuresForLegend = stylePLANIGN.filter((elem) => {
    if (elem.id == FeaturesPLANIGN[0].layer.id) {
      return elem;
    }
    if (Object.hasOwnProperty.call(FeaturesPLANIGN[0].layer.metadata, "legend-group")
      && Object.hasOwnProperty.call(elem, "metadata")
      && Object.hasOwnProperty.call(elem.metadata, "legend-group")
      && FeaturesPLANIGN[0].layer.metadata["legend-group"] == elem.metadata["legend-group"]) {
      return elem;
    }
  });

  layername = FeaturesPLANIGN.length > 0 ? beautifyLayerName(FeaturesPLANIGN[0], source) : "";
  if (featuresForLegend) {
    svg = MapBoxStyleToSVG(featuresForLegend, zoom);
    legend = getLegend(svg, layername);
  }
  return legend;
}

export default Legend;
