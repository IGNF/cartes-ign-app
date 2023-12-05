/** resultats du service */
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
 * @fire elevation
 */
const compute = async (coordinateList) => {
    // ex. request
    // https://wxs.ign.fr/calcul/alti/rest/elevationLine.json?
    //  lon=1.136383|1.12&
    //  lat=45.95352|49.9&
    //  indent=false&
    //  sampling=500

    clear();

    controller = new AbortController();
    const lonStr = coordinateList.map( (coord) => coord[0]).join("|");
    const latStr = coordinateList.map( (coord) => coord[1]).join("|");

    let url = new URL("https://wxs.ign.fr/calcul/alti/rest/elevationLine.json");
    let params = {
        indent: false,
        sampling: 500,
        lon: lonStr,
        lat: latStr
    };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url, { signal : controller.signal });
    results = await response.json();

    if (response.status !== 200) {
        throw new Error(response.message);
    }

    // ex. response
    // {"elevations": [{"lon": 0.2367,"lat": 48.0551,"z": 96.53,"acc": 2.5},{"lon": 2.157,"lat": 46.6077,"z": 208.77,"acc": 2.5},{"lon": 4.3907,"lat": 43.91,"z": 182.68,"acc": 2.5}]}

    target.dispatchEvent(
        new CustomEvent("elevationLine", {
            bubbles: true,
            detail: results
        })
    );

    return results;
};

/**
 * obtenir la valeur Z
 * @example
 * { lon lat }
 */
const getElevationLine = () => {
    return results.elevations;
};

const clear = () => {
    controller.abort();
    results = null;
};

export default {
    target,
    compute,
    getElevationLine,
    clear,
};
