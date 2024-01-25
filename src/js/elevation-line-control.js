import {
  Chart as ChartJS,
  ScatterController,
  LineElement,
  PointElement,
  LinearScale,
  Filler
} from 'chart.js';

ChartJS.register(
  ScatterController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
);

import maplibregl from 'maplibre-gl';
import ElevationLine from "./services/elevation-line";

import { Toast } from '@capacitor/toast';

import LoadingDark from "../css/assets/loading-darkgrey.svg";


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
    }
    this.target = this.options.target || document.getElementById("directions-elevationline");
    this.coordinates = null;    // [{lat: ..., lon: ...}, ...]
    this.elevationData = null;  // [{x: <distance>, y: <elevation}, ...]

    this.dplus = 0; // dénivelé positif
    this.dminus = 0; // dénivelé négatif

    this.unit = "m"; // unité pour la distance

    this.chart = null;

    this.loadingDom = document.createElement("div"); // div de la patience
    this.loadingDom.style.width = "100%";
    this.loadingDom.style.aspectRatio = "2 / 1";
    this.loadingDom.style.position = "absolute";
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
        borderColor: '#26a581',
        tension: 0.1,
        pointRadius: 0,
        showLine: true,
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

    const chartConfig = {
      type: 'scatter',
      data: chartData,
      options: {
        scales: {
          x: {
            max: this.elevationData.slice(-1)[0].x,
            title: {
              display: true,
              text: `Distance (${this.unit})`,
            }
          },
          y: {
            title: {
              display: true,
              text: `Altitude (m)`,
            },
            suggestedMax: suggestedMax,
            suggestedMin: suggestedMin,
          }
        }
      }
    };
    this.chart = new ChartJS(target, chartConfig);
  }

  /**
   * requête au service et construction de la donnée
   * @public
   */
  async compute() {
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
        return;
      }
      responseElevation = {elevations: [{lon: 0, lat:0, z:0}]}
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
      let currentDataPoint = {x: currentDistance, y: elevationValue}
      this.elevationData.push(currentDataPoint);
      lastLngLat = currentLngLat;
      lastZ = elevation.z;
    });

    this.dplus = Math.round(100 * this.dplus) / 100;
    this.dminus = Math.round(100 * this.dminus) / 100;

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

}

// mixins
export default ElevationLineControl;
