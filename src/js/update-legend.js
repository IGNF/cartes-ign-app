/**
 * Gestion additionnel sur les informations des couches
 * @todo ...
 */
import Globals from './globals';
import Texts from './texts';

const map = Globals.map;

/* Légende en fonction du zoom */
function updateLegend() {
  let zoomLvl = map.getZoom();
  // Je n'avais pas prévu autant de légendes différentes en fonction du zoom pour plan ign v2...
  if (zoomLvl <= 7) {
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.seven;
  } else if (zoomLvl <= 8){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.eight;
  } else if (zoomLvl <= 9){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.nine;
  } else if (zoomLvl <= 10){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.ten;
  } else if (zoomLvl <= 11){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.eleven;
  } else if (zoomLvl <= 12){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.twelve;
  } else if (zoomLvl <= 13){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.thirteen;
  } else if (zoomLvl <= 14){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.fourteen;
  } else if (zoomLvl <= 15){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.fifteen;
  } else if (zoomLvl <= 16){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.sixteen;
  } else if (zoomLvl <= 18){
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.eighteen;
  } else {
    Texts.legendImgs["plan-ign"] = Texts.planIGNLegendImgs.nineteen;
  }

}

export default {updateLegend};
