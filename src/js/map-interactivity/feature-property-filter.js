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
  let result = [];
  if (feature.source === "poi_osm") {
    let web =  getProperty(feature, "web");
    let telephone = getProperty(feature, "telephone");
    let horaire = getProperty(feature, "horaire");
    if (web) {
      result += `Site web : <a href="${web}" target="_blank">${web}</a>  <br/>`;
    }
    if (telephone) {
      result += `Téléphone : <a href="tel:${telephone.replace(/\s/g, "")}">${telephone}</a>  <br/>`;
    }
    if (horaire) {
      result += `Horaire : ${horaire} <br/>`;
    }
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
      result += `Hauteur : ${hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    if (volume) {
      result = `Volume : ${volume.toLocaleString("fr-FR")} m3 <br/>`;
    }
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
      result += routeName + "<br/>";
    }
    else {
      if (nature && natureRouteToDisplay.includes(nature))
        result += `${nature}  <br/>`;
    }
    if (cpx_toponyme_voie_verte)
      result += `${cpx_toponyme_voie_verte} <br/>`;
    if (cpx_toponyme_itineraire_cyclable)
      result += `${cpx_toponyme_itineraire_cyclable} <br/>`;
    if (nombre_de_voies) {
      if (nombre_de_voies == "1")
        result += `${nombre_de_voies} voie <br/>`;
      else
        result += `${nombre_de_voies} voies <br/>`;
    }
    if (voie_prive) {
      result += "Voie privée <br/>";
    }
    if (acces_pieton) {
      result += `Accès piéton : ${acces_pieton} <br/>`;
    } 

    return result;
  }

  //  Propriétés spécifiques batiment
  if(feature.layer["source-layer"] == "batiment") {
    // Batiment
    let nombre_de_logements = getProperty(feature, "nombre_de_logements");
    let nombre_d_etages = getProperty(feature, "nombre_d_etages");
    let date_d_apparition = getProperty(feature, "date_d_apparition");

    if(nature && !isIndifferencie(nature)) {
      result += `${nature}  <br/>`;
    }
    if(usage && !isIndifferencie(usage)) {
      result += `Usage : ${usage}  <br/>`;
    }
    if(nombre_de_logements) {
      result += `Nombre de logements : ${nombre_de_logements}  <br/>`;
    }
    if(nombre_d_etages && nombre_d_etages != "0") {
      result += `Nombre d'étages : ${nombre_d_etages}  <br/>`;
    }
    if(date_d_apparition) {
      result += `Date de construction : ${date_d_apparition.toLocaleString()}  <br/>`;
    }
    if(hauteur) {
      result += `Hauteur : ${hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }

    return result;
  }

  if (feature.layer["source-layer"] != "construction_ponctuelle") {
    if (nature) {
      result += `${nature}  <br/>`;
    }
    if (hauteur) {
      result += `Hauteur : ${feature.properties.hauteur.toLocaleString("fr-FR")} mètres  <br/>`;
    }
    return result;
  }


  // pour toutes les couches qui restent
  if (toponyme) {
    result += toponyme + "<br/>";
  }
  if (nature && nature_detaillee) {
    result += nature + ", " + nature_detaillee + "<br/>";
  }
  else if (nature && !nature_detaillee) {
    result += nature + "<br/>";
  }
  
  
  return result;
};

export default featurePropertyFilter;
