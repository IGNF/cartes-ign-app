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

const getProperty = (feature, prop) => {
  return Object.prototype.hasOwnProperty.call(feature.properties, prop) ? feature.properties[prop] : "";
};

const featurePropertyFilter = (feature) => {
  let result = {
    before: "<div class='positionHtmlBefore'>",
    after: "<div class='positionHtmlAfter'>",
  };
  if (feature.source === "poi_osm") {
    let web =  getProperty(feature, "web");
    let telephone = getProperty(feature, "telephone");
    let horaire = getProperty(feature, "horaire");
    if (horaire) {
      result.after += `<p class="positionHours positionInfo">Horaire : ${horaire}</p>`;
    }
    if (web) {
      result.after += `<p class="positionWeb positionInfo"><a href="${web}" target="_blank">${web}</a></p>`;
    }
    if (telephone) {
      result.after += `<p class="positionTelephone positionInfo"><a href="tel:${telephone.replace(/\s/g, "")}">${telephone}</a></p>`;
    }
    result.after += "</div>"
    result.before = "";
    return result;
  }

  // Pour la plupart des layers bdtopo
  let toponyme = getProperty(feature, "toponyme");
  let nature = getProperty(feature, "nature");
  let nature_detaillee = getProperty(feature, "nature_detaillee");
  let usage = getProperty(feature, "usage");
  let hauteur = getProperty(feature, "hauteur");

  //  Propriétés spécifiques reservoir
  if(feature.layer["source-layer"] == "reservoir") {
    let volume = getProperty(feature, "volume");
    if (hauteur) {
      result.before += `Hauteur : ${hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    if (volume) {
      result.before = `Volume : ${volume.toLocaleString("fr-FR")} m3 <br/>`;
    }
    result.before += "</div>"
    result.after = "";
    return result;
  }

  // Propriétés spécifiques troncon_de_route
  if(feature.layer["source-layer"] == "troncon_de_route") {
    let cpx_classement_administratif = getProperty(feature, "cpx_classement_administratif");
    let cpx_numero = getProperty(feature, "cpx_numero");
    let cpx_toponyme_route_nommee = getProperty(feature, "cpx_toponyme_route_nommee");
    let cpx_toponyme_voie_verte = getProperty(feature, "cpx_toponyme_voie_verte");
    let cpx_toponyme_itineraire_cyclable = getProperty(feature, "cpx_toponyme_itineraire_cyclable");
    let nombre_de_voies = getProperty(feature, "nombre_de_voies");
    let voie_prive = getProperty(feature, "voie_prive");
    let acces_pieton = getProperty(feature, "acces_pieton");

    var routeName = `${cpx_classement_administratif} ${cpx_numero} ${cpx_toponyme_route_nommee}`;
    routeName = routeName.trim();
    if (routeName) {
      result.before += routeName + "<br/>";
    }
    else {
      if (nature && natureRouteToDisplay.includes(nature))
        result.before += `${nature}<br/>`;
    }
    if (cpx_toponyme_voie_verte)
      result.before += `${cpx_toponyme_voie_verte}<br/>`;
    if (cpx_toponyme_itineraire_cyclable)
      result.before += `${cpx_toponyme_itineraire_cyclable}<br/>`;
    if (nombre_de_voies) {
      if (nombre_de_voies == "1")
        result.before += `${nombre_de_voies} voie<br/>`;
      else
        result.before += `${nombre_de_voies} voies<br/>`;
    }
    if (voie_prive) {
      result.before += "Voie privée<br/>";
    }
    if (acces_pieton) {
      result.before += `Accès piéton : ${acces_pieton}<br/>`;
    }
    result.before += "</div>"
    result.after = "";
    return result;
  }

  //  Propriétés spécifiques batiment
  if(feature.layer["source-layer"] == "batiment") {
    // Batiment
    let nombre_de_logements = getProperty(feature, "nombre_de_logements");
    let nombre_d_etages = getProperty(feature, "nombre_d_etages");
    let date_d_apparition = getProperty(feature, "date_d_apparition");

    if(nature && !isIndifferencie(nature)) {
      result.before += `${nature}<br/>`;
    }
    if(usage && !isIndifferencie(usage)) {
      result.before += `Usage : ${usage}<br/>`;
    }
    if(nombre_de_logements) {
      result.before += `Nombre de logements : ${nombre_de_logements}<br/>`;
    }
    if(nombre_d_etages && nombre_d_etages != "0") {
      result.before += `Nombre d'étages : ${nombre_d_etages}<br/>`;
    }
    if(date_d_apparition) {
      let match = date_d_apparition.match("([0-9]+)/");
      let year = match[1] ? match[1] : "";
      result.before += `Année de construction : ${year}<br/>`;
    }
    if(hauteur) {
      result.before += `Hauteur : ${hauteur.toLocaleString("fr-FR")} mètres<br/>`;
    }
    result.before += "</div>"
    result.after = "";
    return result;
  }

  if (feature.layer["source-layer"] != "construction_ponctuelle") {
    if (nature) {
      result.before += `${nature}<br/>`;
    }
    if (hauteur) {
      result.before += `Hauteur : ${feature.properties.hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    result.before += "</div>"
    result.after = "";
    return result;
  }


  // pour toutes les couches qui restent
  if (toponyme) {
    result.before += toponyme + "<br/>";
  }
  if (nature && nature_detaillee) {
    result.before += nature + ", " + nature_detaillee + "<br/>";
  }
  else if (nature && !nature_detaillee) {
    result.before += nature + "<br/>";
  }

  result.before += "</div>"
  result.after = "";
  return result;
};

export default featurePropertyFilter;
