/**
 *
 * @param {feature} feature maplibre issue de tuile vecteur
 * @returns chaine de caractère HTML qui décrit la feature
 */

const natureRouteToDisplay = ["Autoroute", "Bretelle", "Chemin",
  "Piste cyclable", "Sentier", "Rue piétonne", "Escalier"];

const isIndifferencie = (prop) => {
  if (prop == "Indifférenciée" || prop == "Indifférencié") return true;
  else return false;
};

const featurePropertyFilter = (feature) => {
  let result = "";
  if (feature.source === "poi_osm") {
    Object.entries(feature.properties).forEach((prop) => {
      if (prop[0] !== "symbo" && prop[0] !== "texte") {
        if (prop[0] === "web") {
          result = result + `site web : <a href="${prop[1]}" target="_blank">${prop[1]}</a> <br />`;
        } else if (prop[0] === "telephone") {
          result = result + `téléphone : <a href="tel:${prop[1].replace(/\s/g, "")}">${prop[1]}</a> <br />`;

        } else {
          result = result + `${prop[0]} : ${prop[1]} <br />`;
        }
      }
    });
    return result;
  }

  //Attribut toponyme en priorité
  if (feature.properties.hasOwnProperty('toponyme')) {
    result = result + feature.properties.toponyme + "<br/>";
  }

  // Attributs des routes
  if(feature.layer["source-layer"] == "troncon_de_route") {
    let cpx_classement_administratif = feature.properties.hasOwnProperty('cpx_classement_administratif') ? feature.properties.cpx_classement_administratif : "";
    let cpx_numero = feature.properties.hasOwnProperty('cpx_numero') ? feature.properties.cpx_numero : "";
    let cpx_toponyme_route_nommee = feature.properties.hasOwnProperty('cpx_toponyme_route_nommee') ? feature.properties.cpx_toponyme_route_nommee : "";
    var routeName = `${cpx_classement_administratif} ${cpx_numero} ${cpx_toponyme_route_nommee} <br/>`
    routeName = routeName.trim();
    if (routeName != "") {
      result = result + routeName;
    }
    else {
      if (feature.properties.hasOwnProperty('nature') 
      && natureRouteToDisplay.includes(feature.properties.nature))
        result = result + `${feature.properties.nature} <br />`;
    }

  }
  var nature = ""
    if (feature.layer["source-layer"] != "batiment") {
    var nature = ""
    if (feature.properties.hasOwnProperty("nature")) {
      nature += feature.properties.nature;
    }
    if (feature.properties.hasOwnProperty("nature_detaillee")) {
      nature = nature != "" ? nature + ", " + feature.properties.nature_detaillee : feature.properties.nature_detaillee;
    }
  }
  if (nature != "") {
    result = result + nature + "<br/>";
  }


  Object.entries(feature.properties).forEach((prop) => {
    // Batiment
    if(feature.layer["source-layer"] == "batiment") {
      if(prop[0] == "nature" && !isIndifferencie(prop[1])) {
        result = result + `Nature : ${prop[1]} <br />`;
      }
      if(prop[0] == "usage_1" && !isIndifferencie(prop[1])) {
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
