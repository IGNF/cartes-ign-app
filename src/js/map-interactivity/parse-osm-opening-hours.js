const days = {
  "Lu": "lundi",
  "Ma": "mardi",
  "Me": "mercredi",
  "Je": "jeudi",
  "Ve": "vendredi",
  "Sa": "samedi",
  "Di": "dimanche",
};

/**
 *  Convertit un horaire OSM brut en horaire plus sympathique
 * @param {String} horaire Horaire OSM de type : "Lu-Ve 07:00-21:00/ Di 08:00-20:00"
 * @returns String horaire formaté plus joliment
 */
function parseOsmOpeningHours(horaire) {
  const result = [];
  // cas où les différents jours sont séparés par des virgules
  if (horaire.match(/, ?[A-Z]/g)) {
    horaire = horaire.replace(/, ?L/g, "/ L");
    horaire = horaire.replace(/, ?M/g, "/ M");
    horaire = horaire.replace(/, ?J/g, "/ J");
    horaire = horaire.replace(/, ?V/g, "/ V");
    horaire = horaire.replace(/, ?S/g, "/ S");
    horaire = horaire.replace(/, ?D/g, "/ D");
  }
  const horaireSplit = horaire.split("/").map((el) => el.trim());
  for (let a = 0; a < horaireSplit.length; a++) {
    if (horaireSplit[a].match(/, /g)) {
      horaireSplit[a] = horaireSplit[a].replace(/, /g, ",");
    }
    if (horaireSplit[a].match(/ ?- ?/g)) {
      horaireSplit[a] = horaireSplit[a].replace(/ ?- ?/g, "-");
    }
    const daySplit = horaireSplit[a].split(" ");
    if (daySplit[0].includes("-")) {
      const daysNames = daySplit[0].split("-");
      result.push(`du ${days[daysNames[0]]} au ${days[daysNames[1]]} `);
    } else if (daySplit[0].includes(",")) {
      const daysNames = daySplit[0].split(",");
      for (let i = 0; i < daysNames.length; i++) {
        if (i === daysNames.length - 1) {
          result.push(` et ${days[daysNames[i]]} `);
        } else {
          result.push(days[daysNames[i]]);
        }
        if (i !== daysNames.length - 2) {
          result.push(", ");
        }
      }
    } else {
      result.push(`le ${days[daySplit[0]]} `);
    }
    const hourSplit = daySplit[1].split(",");
    for (let i = 0; i < hourSplit.length; i++) {
      const hourRange = hourSplit[i].split("-");
      if (i === hourSplit.length - 1 && i > 0) {
        result.push(` et de ${hourRange[0]} à ${hourRange[1]}`);
      } else {
        result.push(`de ${hourRange[0]} à ${hourRange[1]}`);
      }
    }
    if (horaireSplit.length >= 2 && a === horaireSplit.length - 2) {
      result.push(" et ");
    } else if (horaireSplit.length > 2 && a < horaireSplit.length - 1) {
      result.push(", ");
    }
  }
  const resultString = result.join("");
  if (resultString.includes("undefined")) {
    return horaire;
  }
  return resultString[0].toUpperCase() + resultString.slice(1);
}

export default parseOsmOpeningHours;
