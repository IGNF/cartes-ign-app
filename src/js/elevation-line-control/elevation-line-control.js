import {
  Chart as ChartJS,
  ScatterController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip
} from "chart.js";

ChartJS.register(
  ScatterController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip
);

import maplibregl from "maplibre-gl";
import ElevationLine from "../services/elevation-line";
import ElevationLineLayers from "./elevation-line-styles";
import Globals from "../globals";

import { Toast } from "@capacitor/toast";

import LoadingDark from "../../css/assets/loading-darkgrey.svg";


/**
 * Interface sur le contrôle profil altimétrique
 * @module ElevationLineControl
 * @todo mise en place d'une patience
 * @todo ajouter les fonctionnalités : cf. DOM
 */
class ElevationLineControl {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(options) {
    this.options = options || {
      target: null,
    };
    this.target = this.options.target || document.getElementById("directions-elevationline");
    this.coordinates = null;    // [{lat: ..., lon: ...}, ...]
    this.elevationData = null;  // [{x: <distance>, y: <elevation>}, ...]
    this.profileLngLats = [];
    this.removeCrosshair = false;

    this.dplus = 0; // dénivelé positif
    this.dminus = 0; // dénivelé négatif

    this.unit = "m"; // unité pour la distance

    this.chart = null;

    this.loadingDom = document.createElement("div"); // div de la patience
    this.loadingDom.style.width = "100%";
    this.loadingDom.style.aspectRatio = "2 / 1";
    this.loadingDom.style.position = "sticky";
    this.loadingDom.style.flexShrink = "0";
    this.loadingDom.style.marginBottom = "-50%";
    this.loadingDom.style.transform = "translate(0, -100%)";
    this.loadingDom.style.backgroundColor = "#3F4A5555";
    this.loadingDom.style.backgroundImage = "url(" + LoadingDark + ")";
    this.loadingDom.style.backgroundPosition = "center";
    this.loadingDom.style.backgroundRepeat = "no-repeat";
    this.loadingDom.style.backgroundSize = "50px";
    this.loadingDom.style.display = "none";
    this.loadingDomInDocument = false;

    return this;
  }

  /**
   * Insère une donnée pré-calculée dans le contrôle
   * @param {*} data
   * @public
   */
  setData(data) {
    this.coordinates = data.coordinates;
    this.elevationData = data.elevationData;
    this.profileLngLats = data.profileLngLats;

    this.dplus = data.dplus;
    this.dminus = data.dminus;

    this.unit = data.unit;
    this.render();
  }

  /**
   * Récupère la donnée du contrôle
   * @param {*} data
   * @public
   */
  getData() {
    return {
      coordinates: this.coordinates,
      elevationData: this.elevationData,
      dplus: this.dplus,
      dminus: this.dminus,
      unit: this.unit,
      profileLngLats: this.profileLngLats,
    };
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    this.#unsetLoading();
    if (this.chart != null) {
      this.clear();
    }
    var target = this.target;
    if (!target) {
      console.warn();
      return;
    }

    const chartData = {
      datasets: [{
        data: this.elevationData,
        fill: false,
        borderWidth: 3,
        borderColor: getComputedStyle(document.body).getPropertyValue("--dark-green"),
        tension: 0.1,
        pointRadius: 0,
        showLine: true,
        hoverRadius: 0,
      }]
    };

    const allElevations = this.elevationData.map( (elevation) => elevation.y );
    const maxElevation = Math.max(...allElevations);
    const minElevation = Math.min(...allElevations);

    let suggestedMin = minElevation;
    let suggestedMax = maxElevation;
    if (maxElevation - minElevation < 10) {
      suggestedMin = ((maxElevation - minElevation) / 2 ) - 5 + minElevation;
      suggestedMax = ((maxElevation - minElevation) / 2 ) + 5 + minElevation;
    }

    // Merci https://stackoverflow.com/a/74443361
    const plugin = {
      id: "crosshair",
      defaults: {
        width: 1,
        color: getComputedStyle(document.body).getPropertyValue("--dark-grey"),
        dash: [3, 3],
      },
      afterInit: (chart) => {
        chart.crosshair = {
          x: 0,
          y: 0,
        };
      },
      afterEvent: (chart, args) => {
        const {inChartArea} = args;
        const point = this.chart.getElementsAtEventForMode(args.event, "index", { intersect: false }, true)[0];
        if (!this.removeCrosshair && args.event.type !== "click" && point) {
          const x = point.element.x;
          const y = point.element.y;
          Globals.map.getSource("elevation-line-location").setData({
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": this.profileLngLats[point.element.$context.index]
            }
          });
          chart.crosshair = {x, y, draw: inChartArea};
          chart.draw();
        } else {
          chart.crosshair = {x: 0, y: 0, draw: null};
          Globals.map.getSource("elevation-line-location").setData({
            type: "FeatureCollection",
            features: [],
          });
          chart.draw();
        }
      },
      beforeDatasetsDraw: (chart, _, opts) => {
        const {ctx} = chart;
        const {top, bottom, left, right} = chart.chartArea;
        const {x, y, draw} = chart.crosshair;
        if (!draw) return;

        ctx.save();

        ctx.beginPath();
        ctx.lineWidth = opts.width;
        ctx.strokeStyle = opts.color;
        ctx.setLineDash(opts.dash);
        ctx.moveTo(x, bottom);
        ctx.lineTo(x, top);
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

        ctx.restore();
      }
    };

    const chartConfig = {
      type: "scatter",
      data: chartData,
      options: {
        scales: {
          x: {
            max: this.elevationData.slice(-1)[0].x,
            title: {
              display: true,
              text: `Distance (${this.unit})`,
            },
          },
          y: {
            title: {
              display: true,
              text: "Altitude (m)",
            },
            suggestedMax: suggestedMax,
            suggestedMin: suggestedMin,
          }
        },
        plugins: {
          crosshair: {
            color: getComputedStyle(document.body).getPropertyValue("--dark-grey"),
          },
          tooltip: {
            mode: "index",
            position: "average",
            intersect: false,
            backgroundColor: "#FFFA",
            borderColor: getComputedStyle(document.body).getPropertyValue("--dark-grey"),
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: (context) => {
                let distanceText = Math.round(context.parsed.x);
                if (this.unit === "km") {
                  distanceText = Math.round(context.parsed.x * 100) / 100;
                }
                return `Altitude : ${context.parsed.y.toLocaleString()} m
Distance du départ : ${distanceText} ${this.unit}`;
              },
              labelTextColor: () => {
                return getComputedStyle(document.body).getPropertyValue("--dark-grey");
              }
            }
          }
        },
        hover: {
          mode: "index",
          intersect: false,
        },
      },
      plugins: [plugin],
    };
    ChartJS.defaults.font.size = 12;
    ChartJS.defaults.font.family = "Open Sans Semibold";
    this.chart = new ChartJS(target, chartConfig);
    // Add touchend event listener for mobile devices
    target.addEventListener("touchend", () => {
      // Remove the vertical line and update the chart
      this.removeCrosshair = true;
      this.chart.tooltip.opacity = 0;
      this.chart.crosshair = {x: 0, y: 0, draw: null};
      Globals.map.getSource("elevation-line-location").setData({
        type: "FeatureCollection",
        features: [],
      });
      this.chart.draw();
      const self = this;
      // HACK: disable hover effect for 0.1 seconds
      setTimeout(() => {self.removeCrosshair = false;}, 100);
    });
  }

  /**
   * requête au service et construction de la donnée
   * @param {float} totalDistance Distance totale réelle de l'itinéraire (différente de celle calculée à cause du sampling)
   * @public
   */
  async compute(totalDistance = 0) {
    this.#setLoading();
    // Gestion du cas où pas assez de coordonnées sont présentes
    if (this.coordinates.length < 2) {
      this.setData({
        coordinates: this.coordinates,
        elevationData: [{x: 0, y: 0}],
        dplus: 0,
        dminus: 0,
        unit: "m",
      });
      return;
    }
    this.elevationData = [];
    this.profileLngLats = [];
    this.dplus = 0;
    this.dminus = 0;
    let responseElevation;
    try {
      responseElevation = await ElevationLine.compute(this.coordinates);
    } catch(err) {
      if (!err.message.includes("The user aborted a request.")) {
        Toast.show({
          text: "Erreur lors du calcul de profil altimétrique",
          duration: "short",
          position: "bottom"
        });
      } else {
        return true;
      }
      responseElevation = {elevations: [{lon: 0, lat:0, z:0}]};
    }
    let lastLngLat = null;
    let lastZ = null;
    let currentDistance = 0;
    this.unit = "m";
    responseElevation.elevations.forEach( (elevation) => {
      let currentLngLat = new maplibregl.LngLat(elevation.lon, elevation.lat);
      if (lastLngLat != null) {
        currentDistance += currentLngLat.distanceTo(lastLngLat);
        if (elevation.z > lastZ) {
          this.dplus += elevation.z - lastZ;
        } else {
          this.dminus += lastZ - elevation.z;
        }
      }
      let elevationValue = elevation.z;
      if (elevationValue == -99999) {
        elevationValue = 0;
      }
      let currentDataPoint = {x: currentDistance, y: elevationValue};
      this.elevationData.push(currentDataPoint);
      this.profileLngLats.push([currentLngLat.lng, currentLngLat.lat]);
      lastLngLat = currentLngLat;
      lastZ = elevation.z;
    });

    this.dplus = Math.round(100 * this.dplus) / 100;
    this.dminus = Math.round(100 * this.dminus) / 100;

    if (totalDistance) {
      // Ratio entre la distance totale réelle de l'itinéraire et la distance calculée (différente à cause du sampling)
      const ratio = totalDistance / currentDistance;
      this.elevationData.forEach((elevation) => {
        elevation.x = Math.round(elevation.x * ratio);
      });
    }

    if (currentDistance > 2000) {
      this.unit = "km";
      this.elevationData.forEach((elevation) => {
        elevation.x = elevation.x / 1000;
      });
    }
    this.render();
  }

  /**
   * Active la patience le temps que la requête se termine
   * @private
   */
  #setLoading() {
    if (!this.loadingDomInDocument) {
      this.target.after(this.loadingDom);
      this.loadingDomInDocument = true;
    }
    this.loadingDom.style.removeProperty("display");
  }

  /**
   * Désactive la patience
   * @private
   */
  #unsetLoading() {
    this.loadingDom.style.display = "none";
  }

  /**
   * remplissage des coordonnées pour le calcul de profil atlimétrique
   * @param coordinates [[lon, lat], [lon, lat]]
   * @public
   */
  setCoordinates(coordinates) {
    this.coordinates = coordinates;
  }


  /**
   * nettoyage du tracé
   * @public
   */
  clear() {
    ElevationLine.clear();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  /**
   * Ajout des sources et des couches associées au contrôle
   * @public
   */
  addSourcesAndLayers() {
    // Comme le contrôle est appelé 2 fois (Tracé ET calcul d'iti), on s'assure de n'ajouter qu'une
    // seule fois la source et les layers
    if (!Globals.map.getSource("elevation-line-location")) {
      Globals.map.addSource("elevation-line-location", {
        "type": "geojson",
        "data": {
          type: "FeatureCollection",
          features: [],
        }
      });
      Globals.map.addLayer(ElevationLineLayers["point-casing"]);
      Globals.map.addLayer(ElevationLineLayers["point"]);
    }
  }

}

// mixins
export default ElevationLineControl;
