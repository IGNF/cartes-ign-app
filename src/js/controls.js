import maplibregl from "maplibre-gl";

import Globals from './globals';
import Directions from "./directions/directions";
import Isochrone from "./isochrone/isochrone";
import Position from "./my-position";
import Search from "./search";
import Compare from './compare';

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
  const map = Globals.map;
  // on ajoute les contrôles à la fin du chargement de la carte
  map.on("load", () => {

    // contrôle de calcul d'itineraire
    Globals.directions = new Directions(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { Globals.menu.open("searchDirections"); },
      closeSearchControlCbk : () => { Globals.menu.close("searchDirections"); }
    });

    // contrôle de calcul d'isochrone
    Globals.isochrone = new Isochrone(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { Globals.menu.open("searchIsochrone"); },
      closeSearchControlCbk : () => { Globals.menu.close("searchIsochrone"); }
    });

    // contrôle "Où suis-je ?"
    Globals.myposition = new Position(map, {
      tracking : true, // activation du tracking !
      // callback sur l'ouverture / fermeture du panneau
      openMyPositionCbk : () => { Globals.menu.open("myposition"); },
      closeMyPositionCbk : () => { Globals.menu.close("myposition"); },
      openIsochroneCbk : () => { Globals.menu.open("isochrone"); }
    });

    // contrôle Recherche
    Globals.search = new Search(map, {
      // callback sur l'ouverture / fermeture du panneau
      openSearchCbk : () => { Globals.menu.open("search"); },
      closeSearchCbk : () => { Globals.menu.close("search"); },
    });

    // contrôle de comparaison de carte
    Globals.compare = new Compare();

    // échelle graphique
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: 'metric'
    }), "bottom-left");
  });
}

/**
 * ???
 * @fixme ???
 */
const startDrawRoute = () => {
  Globals.mapState = "drawRoute";
}

export default {
  addControls,
  startDrawRoute,
}
