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
    this.target = this.options.target;
    this.coordinates = null;    // [{lat: ..., lon: ...}, ...]
    this.elevationData = null;  // [{x: <distance>, y: <elevation}, ...]

    this.unit = "m"; // unité pour la distance

    this.chart = null;
    return this;
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    if (this.chart != null) {
      this.clear();
    }
    var target = this.target || document.getElementById("directions-elevationline");
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
    this.elevationData = [];

    const responseElevation = await ElevationLine.compute(this.coordinates);
    let lastLngLat = null;
    let currentDistance = 0;
    this.unit = "m";
    responseElevation.elevations.forEach( (elevation) => {
      let currentLngLat = new maplibregl.LngLat(elevation.lon, elevation.lat);
      if (lastLngLat != null) {
        currentDistance += currentLngLat.distanceTo(lastLngLat);
      }
      let elevationValue = elevation.z;
      if (elevationValue == -99999) {
        elevationValue = 0;
      }
      let currentDataPoint = {x: currentDistance, y: elevationValue}
      this.elevationData.push(currentDataPoint);
      lastLngLat = currentLngLat;
    });

    if (currentDistance > 2000) {
      this.unit = "km";
      this.elevationData.forEach((elevation) => {
        elevation.x = elevation.x / 1000;
      });
    }

    this.render();
  }

  /**
   * remplissage des coordonnées pour le calcul de profil atlimétrique
   * @param coordinates [{lat: ..., lon: ...}, ...]
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
    this.chart.destroy();
  }

}

// mixins
export default ElevationLineControl;
