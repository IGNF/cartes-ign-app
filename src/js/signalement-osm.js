import Globals from "./globals";

/**
 * Permet d'effectuer un signalement d'anomalie sur les données
 */
class SignalementOSM {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
    };

    // carte
    this.map = map;
    this.data = {
      location: null,
    };
    return this;
  }

  setLocation(location) {
    this.data.location = location;
    document.getElementById("osmNoteLink").href = `https://www.openstreetmap.org/note/new#map=19/${location.lat}/${location.lon}`;
  }

  /**
   * affiche le menu
   * @public
   */
  show() {
    Globals.menu.open("signalementOSM");
  }

  /**
   * ferme le menu
   * @public
   */
  hide() {
    Globals.menu.close("signalementOSM");
  }

  /**
   * clean du formulaire
   * @public
   */
  clear() {
    this.data = {
      location: null,
    };
  }

}

export default SignalementOSM;
