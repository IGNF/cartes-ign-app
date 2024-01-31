/**
 *
 * @param {feature} feature maplibre issue de tuile vecteur
 * @returns chaine de caractère HTML qui décrit la feature
 */

const natureRouteToDisplay = ["Autoroute", "Bretelle", "Chemin",
  "Piste cyclable", "Sentier", "Rue piétonne", "Escalier"];

const isIndifferencie = (prop) => {
  if (prop == "Indifférenciée" || prop == "Indifférencié") return true;
  return false;
};

const featurePropertyFilter = (feature) => {
  let result = "";
  if (feature.source === "poi_osm") {
    Object.entries(feature.properties).forEach((prop) => {
      if (prop[0] !== "symbo" && prop[0] !== "texte") {
        result = result + `${prop[0]} : ${prop[1]} <br />`;
      }
    });
    return result;
  }
  let nature = "";
  if (Object.prototype.hasOwnProperty.call(feature.properties, "nature")) {
    nature = feature.properties.nature;
  }

  Object.entries(feature.properties).forEach((prop) => {
    // Troncon de route
    if(feature.layer["source-layer"] == "troncon_de_route") {
      // Autoroute
      if(prop[0] == "cpx_classement_administratif" && nature == "Type autoroutier") {
        result = result + `${prop[1]} <br />`;
      }
      // Contenu dans natureRouteToDisplay
      if(prop[0] == "nature" && natureRouteToDisplay.includes(nature)) {
        result = result + `${prop[1]} <br />`;
      }
    }
    // Voies Ferrées
    if (feature.layer["source-layer"] == "troncon_de_voie_ferree"){
      if(prop[0] == "nature") {
        result = result + `${prop[1]} <br />`;
      }
    }
    // Le reste
    if(feature.layer["source-layer"] == "construction_lineaire"
    || feature.layer["source-layer"] == "construction_surfacique"
    || feature.layer["source-layer"] == "construction_ponctuelle"
    || feature.layer["source-layer"] == "equipement_de_transport"
    || feature.layer["source-layer"] == "pylone"
    || feature.layer["source-layer"] == "reservoir"
    || feature.layer["source-layer"] == "plan_d_eau"
    || feature.layer["source-layer"] == "cimetiere"
    || feature.layer["source-layer"] == "zone_de_vegetation"
    || feature.layer["source-layer"] == "zone_d_estran"
    || feature.layer["source-layer"] == "cimetiere"
    || feature.layer["source-layer"] == "ligne_orographique"
    || feature.layer["source-layer"] == "cours_d_eau"
    || feature.layer["source-layer"] == "surface_hydrographique"
    || feature.layer["source-layer"] == "parc_ou_reserve"
    || feature.layer["source-layer"] == "zone_d_activite_ou_d_interet"
      || feature.layer["source-layer"] == "terrain_de_sport") {
      if(prop[0] == "nature") {
        result = result + `${prop[1]} <br />`;
      }
      if(prop[0] == "nature_detaillee") {
        result = result + `${prop[1]} <br />`;
      }

    }

    // Batiment
    if(feature.layer["source-layer"] == "batiment") {
      if(prop[0] == "nature" && isIndifferencie(prop[0])) {
        result = result + `Nature : ${prop[1]} <br />`;
      }
      if(prop[0] == "usage_1" && isIndifferencie(prop[0])) {
        result = result + `Usage : ${prop[1]} <br />`;
      }
      if(prop[0] == "nombre_de_logements" && prop[0] != "") {
        result = result + `Nombre de logements : ${prop[1]} <br />`;
      }
      if(prop[0] == "nombre_d_etages" && prop[0] != "" && prop[0] != "0") {
        result = result + `Nombre d'étages : ${prop[1]} <br />`;
      }
      if(prop[0] == "hauteur" && prop[0] != "") {
        result = result + `Hauteur : ${prop[1].toLocaleString("fr-FR")} mètres <br />`;
      }

    }

  });

  return result;
};

export default featurePropertyFilter;
