import maplibregl from "maplibre-gl";

import Globals from './globals';
import Directions from "./directions/directions";
import Isochrone from "./isochrone/isochrone";
import Position from "./position";
import Search from "./search";
import Compare from './compare';
import POI from './poi';
import RouteDraw from './route-draw/route-draw';

/**
 * Ajout des contrôle à la fin du chargement de la carte
 * @see maplibregl.ScaleControl
 * @see Directions
 * @see Isochrone
 * @see Position
 * @see Compare
 * @see Search
 * @see POI
 * @see RouteDraw
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
    Globals.position = new Position(map, {
      tracking : true, // activation du tracking !
      // callback sur l'ouverture / fermeture du panneau
      openPositionCbk : () => { Globals.menu.open("position"); },
      closePositionCbk : () => { Globals.menu.close("position"); },
      openIsochroneCbk : () => { Globals.menu.open("isochrone"); },
      openDirectionsCbk : () => { Globals.menu.open("directions"); },
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

    // contrôle filtres POI
    Globals.poi = new POI(map, {});
    Globals.poi.load() // promise !
    .then(() => {
      // opérations possibles aprés le chargement des POI
      console.debug("layer POI loaded !");
    })
    .catch((e) => {
      // on ne capture pas les exceptions
      console.error(e);
    });

    // contrôle tracé d'itinéraire
    Globals.routeDraw = new RouteDraw(map, {});
  });
}

export default {
  addControls,
}
