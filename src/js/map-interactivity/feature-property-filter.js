/**
 *
 * @param {feature} feature maplibre issue de tuile vecteur
 * @returns chaine de caractère HTML qui décrit la feature
 */
const featurePropertyFilter = (feature) => {
  let result = ``;
  Object.entries(feature.properties).forEach((prop) => {
    result = result + `${prop[0]} : ${prop[1]} <br />`
  })

  return result;
}

export default featurePropertyFilter;
