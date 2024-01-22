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
    // https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json?
    //  lon=1.136383|1.12&
    //  lat=45.95352|49.9&
    //  indent=false&
    //  resource: ign_rge_alti_wld&
    //  sampling=500

    clear();

    controller = new AbortController();
    const lonStr = coordinateList.map( (coord) => coord[0]).join("|");
    const latStr = coordinateList.map( (coord) => coord[1]).join("|");

    let url = new URL("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json");
    let params = {
        lon: lonStr,
        lat: latStr,
        indent: "false",
        sampling: 500,
        resource: "ign_rge_alti_wld",
    };

    const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify(params),
        headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
        },
    });
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
    if (!results.elevations) {
      return [];
    }
    return results.elevations;
};

const clear = () => {
    controller.abort();
    console.log("cleared");
    results = null;
};

export default {
    target,
    compute,
    getElevationLine,
    clear,
};
