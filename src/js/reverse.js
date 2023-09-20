import Globals from './globals';

/** resultats des services */
let results;

/** gestion annulation du fetch */
let controller = new AbortController();

/**
 * Interface pour les evenements
 * @example
 * target.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
 * target.addEventListener("myEvent", handler);
 */
const target = new EventTarget();

/**
 * service
 * @param {*} coordinates 
 * @returns 
 */
const compute = async (coordinates) => {
    clear();

    controller = new AbortController();

    let url = new URL("https://wxs.ign.fr/calcul/geoportail/geocodage/rest/0.1/reverse");
    let params = {
        index: "address",
        searchgeom: `{"type":"Circle","coordinates":[${coordinates.lon},${coordinates.lat}],"radius":100}`,
        lon: coordinates.lon,
        lat: coordinates.lat
    };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    var response = await fetch(url, { signal : controller.signal });
    var geojson = await response.json();

    if (response.status !== 200) {
        throw new Error(response.message);
    }

    var address = {
        number : geojson.features[0].properties.housenumber,
        street : geojson.features[0].properties.street,
        citycode : geojson.features[0].properties.citycode,
        city : geojson.features[0].properties.city
    };
    
    results = {
        coordinates : {
            lon : geojson.features[0].geometry.coordinates[0],
            lat : geojson.features[0].geometry.coordinates[1]
        },
        address : address,
        elevation : "..."
    };

    target.dispatchEvent(
        new CustomEvent("reverse", {
            bubbles: true,
            detail: results
        })
    );

    return results;
};

/** 
 * obtenir les coordonnées
 * @example
 * { lon lat }
 */
const getCoordinates = () => {
    return results.coordinates;
};

/** 
 * obtenir l'adresse
 * @example
 * { number  street  citycode  city }
 */
const getAddress = () => {
    return results.address;
};

/** 
 * obtenir l'altitude
 */
const getElevation = () => {
    return results.elevation;
};

const clear = () => {
    controller.abort();
    results = null;
};

export default {
    target,
    compute,
    getCoordinates,
    getAddress,
    getElevation
};