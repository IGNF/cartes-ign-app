import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
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
    this.points = null;
    this.coordinates = null;    // [{lat: ..., lon: ...}, ...]
    this.elevationData = null;  // {distances: [1, 10, ...], elevations: [15.3, 18.6, ...]}

    this.chart = null;
    return this;
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    var target = this.target || document.getElementById("elevation-line-canvas");
    if (!target) {
      console.warn();
      return;
    }

    const chartLabels = this.elevationData.distances;
    const chartData = {
      labels: chartLabels,
      datasets: [{
        data: this.elevationData.elevations,
        fill: false,
        borderColor: '#26a581',
        tension: 0.1
      }]
    };

    const chartConfig = {
      type: 'line',
      data: chartData,
    };

    this.chart = new ChartJS(document.getElementById('elevation-line-canvas'), chartConfig);
  }

  /**
   * requête au service et construction de la donnée
   * @public
   */
  async compute() {
    this.elevationData = {distances: [], elevations:[]};

    const responseElevation = await ElevationLine.compute(this.coordinates);
    let lastLngLat = null;
    responseElevation.elevations.forEach( (elevation) => {
      let currentLngLat = maplibregl.LngLat(elevation.lon, elevation.lat);
      if (lastLngLat == null) {
        this.elevationData.distances.push(0);
      } else {
        this.elevationData.distances.push(currentLngLat.distanceTo(lastLngLat));
      }
      lastLngLat = currentLngLat;
      this.elevationData.elevations.push(elevation.z);
    });

    this.render();
  }

  /**
   * nettoyage du tracé
   * @public
   */
  clear() {

  }

}

// mixins
Object.assign(ElevationLineControl.prototype, ElevationLineControlDOM);

export default ElevationLineControl;
