// ce fichier doit disparaitre quand les classes LayerManager et MyAccount seront en place

import DOM from './dom';
import Globals from './globals';

// Ouverture/fermeture des fentres infos et légende
function openLegend(){
  // DOM.$defaultMenu.classList.add("d-none");
  DOM.$legendWindow.classList.remove("d-none");
  Globals.backButtonState = 'legend';
}

function closeLegend(){
  DOM.$legendWindow.classList.add("d-none");
  // DOM.$defaultMenu.classList.remove("d-none");
  openCat();
}

function openInfos(){
  // DOM.$defaultMenu.classList.add("d-none");
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
