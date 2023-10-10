import maplibregl from "maplibre-gl";

import Globals from './globals';
import Directions from "./directions/directions";
import Isochrone from "./isochrone/isochrone";
import Position from "./my-position";
import Search from "./search";
import Compare from './compare';
import MenuDisplay from './menu-display';

const map = Globals.map;

/**
 * Ajout des contrôle à la fin du chargement de la carte
 * @see maplibregl.ScaleControl
 * @see Directions
 * @see Isochrone
 * @see Position
 * @see Compare
 * @see Search
 */
const addControls = () => {
  // on ajoute les contrôles à la fin du chargement de la carte
  map.on("load", () => {

    // contrôle de calcul d'itineraire
    Globals.directions = new Directions(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { MenuDisplay.openSearchDirections(); },
      closeSearchControlCbk : () => { MenuDisplay.closeSearchDirections(); }
    });

    // contrôle de calcul d'isochrone
    Globals.isochrone = new Isochrone(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { MenuDisplay.openSearchIsochrone(); },
      closeSearchControlCbk : () => { MenuDisplay.closeSearchIsochrone(); }
    });

    // contrôle "Où suis-je ?"
    Globals.myposition = new Position(map, {
      // callback sur l'ouverture / fermeture du panneau
      openMyPositionCbk : () => { MenuDisplay.openMyPosition(); },
      closeMyPositionCbk : () => { MenuDisplay.closeMyPosition(); },
      openIsochroneCbk : () => { MenuDisplay.openIsochrone(); }
    });

    // contrôle Recherche
    Globals.search = new Search(map, {
      // callback sur l'ouverture / fermeture du panneau
      openSearchCbk : () => { MenuDisplay.searchScreenOn(); },
      closeSearchCbk : () => { MenuDisplay.searchScreenOff(); },
    });

    // contrôle de comparaison de carte
    Globals.compare = new Compare();

    // échelle graphique
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    }), "bottom-left");
  });
}

/** ??? */
const startDrawRoute = () => {
  Globals.mapState = "drawRoute";
}

export default {
  addControls,
  startDrawRoute,
}
