// INFO
// ce fichier doit disparaitre quand la classe LayerSwitcher sera en place

import DOM from './dom';
import Globals from './globals';

// Ouverture/fermeture des fentres infos et légende
function openLegend(){
  DOM.$legendWindow.classList.remove("d-none");
  Globals.backButtonState = 'legend';
}

function closeLegend(){
  DOM.$legendWindow.classList.add("d-none");
  openCat();
}

function openInfos(){
  DOM.$infoWindow.classList.remove("d-none");
  Globals.backButtonState = 'infos';
}

function closeInfos(){
  DOM.$infoWindow.classList.add("d-none");
  openCat();
}


export default {
  openLegend,
  closeLegend,
  openInfos,
  closeInfos,
};
