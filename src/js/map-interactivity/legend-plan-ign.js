import LayerSwitcher from "../layer-manager/layer-switcher";
import globals from "../globals";
class Legend {

    constructor(features) {
        this.layername = this.#beautifyLayerName(features[0].sourceLayer);
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
        var f = features.filter(f =>
            f.source == "plan_ign" &&
            f.layer.id != "bckgrd" &&
            !f.layer.layout.hasOwnProperty("text-field")
            );
        this.featuresForLegend = [];
        const style = globals.manager.layerSwitcher.layers["PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"].style;
        if (f.length > 0) {
            this.featuresForLegend = style.filter((elem) => {
                if (elem.id == f[0].layer.id) {
                    return elem;
                }
                if (f[0].layer.metadata.hasOwnProperty("legend-group")
                    && elem.hasOwnProperty('metadata')
                    && elem.metadata.hasOwnProperty("legend-group")
                    && f[0].layer.metadata["legend-group"] == elem.metadata["legend-group"]) {
                        return elem;
               }
            })
        }
    }

    #beautifyLayerName(layername) {
        var result = layername.replaceAll("_", " ");
        result = result.charAt(0).toUpperCase() + result.slice(1);
        return result;
    };

    #getLegend(svg, layername) {
        const html = `<div class="divLegendContainer"><div>${svg}</div><div class="divLegendDescription">${layername}</div></div>`
        return html;
    }

    #hextoRGBA(hex, opacity) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        if (!hex) {
            throw new Error("Invalid format");
        }
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        rgb = rgb ? {
            r : parseInt(rgb[1], 16),
            g : parseInt(rgb[2], 16),
            b : parseInt(rgb[3], 16)
        } : null;
        var result = rgb ? "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + opacity + ")" : null;
        return result;
    }

    #getMapboxPropAtZoom(feature, prop, zoom, defaultValue) {
        if (feature.paint.hasOwnProperty(prop)) {
            let p = feature.paint[prop];
            if (p.hasOwnProperty("stops")) {
                for (let i = p.stops.length - 1; i >= 0; i--){
                    if (zoom >= i)
                        return p.stops[i][1];
                }
            }
            if (Array.isArray(p)
                && p[0] == 'step'
                && p[1][0] == 'zoom') {
                let steps = p.slice(2);
                let response = steps[0];
                for (let i = 0; i > steps.length; i++){
                    if (i % 2 == 0)
                        response = steps[i];
                    if (i % 2 == 1
                        && steps[i] > zoom)
                            break;
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

    #MapBoxStyleToSVG(features, zoom) {
        var height = 24;
        const width = 36;
        const multiplicator = 2;

        features.forEach(f => {
            if (f.type == 'line') {
                const lineWidth = this.#getMapboxPropAtZoom(f, "line-width", zoom, 1) * multiplicator;
                height = lineWidth > height ? lineWidth : height;
            }
            if (f.type == 'circle') {
                const circleStrokeWidth = this.#getMapboxPropAtZoom(f, "circle-stroke-width", zoom, 1);
                const radius = this.#getMapboxPropAtZoom(f, "circle-radius", zoom, 0);
                height = circleStrokeWidth + radius > height ? circleStrokeWidth + radius : height;
            }
        })

        const x = 0;
        const y = height/2;

        var shape = "";
        features.forEach(f => {
            if (f.type == 'text') {
                shape += `<text x="180" y="60">Un texte</text>`
            }
            // TODO CAS DU FILL PATTERN
            if (f.type == 'fill') {
                const fillcolor = this.#getMapboxPropAtZoom(f, "fill-color", zoom, "#FFFFFF");
                const strokecolor = this.#getMapboxPropAtZoom(f, "fill-outline-color", zoom, "#FFFFFF");
                const strokeopacity = this.#getMapboxPropAtZoom(f, "line-opacity", zoom, 1);
                const fillopacity = this.#getMapboxPropAtZoom(f, "ffill-opacity", zoom, 1);
                shape += `<rect \
                    width="100%" \
                    height="100%" \
                    fill="${fillcolor}" \
                    stroke="${strokecolor}" \
                    stroke-opacity="${strokeopacity}" \
                    opacity="${fillopacity}"/>`
            }
            if (f.type == 'line') {
                const strokecolor = this.#getMapboxPropAtZoom(f, "line-color", zoom, "#FFFFFF");
                const lineWidth = this.#getMapboxPropAtZoom(f, "line-width", zoom, 1);
                const opacity = this.#getMapboxPropAtZoom(f, "line-opacity", zoom, 1);
                let dA = this.#getMapboxPropAtZoom(f, "line-dasharray", zoom, []);
                let dashArr = '';
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
                    ${dashArr}"/>`
            }
            if (f.type == 'circle') {
                const circleStrokeWidth = this.#getMapboxPropAtZoom(f, "circle-stroke-width", zoom, 1);
                const strokeOpacity = this.#getMapboxPropAtZoom(f, "circle-stroke-opacity", zoom, 1);
                const circleStroke = this.#getMapboxPropAtZoom(f, "circle-stroke-color", zoom, "#FFFFFF");
                const circleFill = this.#getMapboxPropAtZoom(f, "circle-color", zoom, "#FFFFFF");
                const radius = this.#getMapboxPropAtZoom(f, "circle-radius", zoom, 0);
                shape += `<circle\
                    cx="${width / 2}"\
                    cy="${height / 2}"\
                    r="${radius}"\
                    y2="${y}"\
                    stroke="${circleStroke}"\
                    fill="${circleFill}"\
                    stroke-width="${circleStrokeWidth}"\
                    stroke-opacity="${strokeOpacity}"/>`
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

    getLegend(zoom) {
        let legend = '';
        let svg = '';
        if (this.featuresForLegend) {
            svg = this.#MapBoxStyleToSVG(this.featuresForLegend, zoom);
            legend = this.#getLegend(svg, this.layername);
        }
        return legend;
    }
}

export default Legend;