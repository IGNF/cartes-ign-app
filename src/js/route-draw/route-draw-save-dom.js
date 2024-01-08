import utils from '../unit-utils';

/**
 * DOM du contrôle du trécé d'itineraire - enregistrement de l'itinéraire
 * @mixin RouteDrawSaveDOM
 * @fixme fusionner les points intermediaires
 */
let RouteDrawSaveDOM = {

  dom : {
    container : null,
    btnReturnBack : null,
  },

  /**
   * obtenir le container principal
   * @param {*} data
   * @param {*} transport
   * @returns {DOMElement}
   * @public
   */
  getContainer (data, transport, name) {
    // nettoyage
    if (this.dom.container) {
      this.dom.container.remove();
    }
    // ajout du container principal
    var container = this.__addRouteSaveContainerDOMElement(name);
    // ajout du résumé
    container.appendChild(this.__addResultsSummaryContainerDOMElement(data, transport));

    return container;
  },

  /**
   * ajout du container principal
   * @param {*} data
   * @returns {DOMElement}
   * @private
   */
  __addRouteSaveContainerDOMElement (name) {
    var div = this.dom.container = document.createElement("div");
    div.id = "routeDrawSave";
    div.className = "";

    var header = document.createElement("p");
    header.id = "routeDrawSaveHeader";
    header.innerText = "Enregistrement de l'itinéraire";
    div.appendChild(header);

    var nameInputDiv = document.createElement("div");
    nameInputDiv.id = "routeDrawSaveNameInputDiv";
    var nameInput = document.createElement("input");
    nameInput.id = "routeDrawSaveNameInput";
    nameInput.type = "text";
    nameInput.placeholder = "Entrez le nom de l'itinéraire";
    if (name) {
      nameInput.value = name;
    }
    var nameInputSubmit = document.createElement("div");
    nameInputSubmit.innerText = "Confirmer";
    nameInputSubmit.id = "routeDrawSaveNameInputSubmit";
    nameInputDiv.appendChild(nameInput);
    nameInputDiv.appendChild(nameInputSubmit);

    div.appendChild(nameInputDiv);
    return div;
  },

  /**
   * ajoute le container le résumé du parcours
   * @param {*} data
   * @param {*} transport
   * @returns {DOMElement}
   * @private
   */
  __addResultsSummaryContainerDOMElement (data, transport) {
    var div = document.createElement("div");
    div.id = "routeDrawSummary";
    div.className = "";
    var header = document.createElement("p");
    header.innerText = "Résumé :";
    div.appendChild(header);

    var line1 = document.createElement("div");
    var line2 = document.createElement("div");

    var labelTransport = document.createElement("label");
    labelTransport.className = "routeDrawSummaryTransport lblRouteDrawSummaryTransport" + transport;
    line1.appendChild(labelTransport);

    var labelDuration = document.createElement("label");
    labelDuration.className = "routeDrawSummaryDuration";
    labelDuration.textContent = utils.convertSecondsToTime(data.duration);
    line1.appendChild(labelDuration);

    var labelDistance = document.createElement("label");
    labelDistance.className = "routeDrawSummaryDistance";
    labelDistance.textContent = utils.convertDistance(data.distance);
    line1.appendChild(labelDistance);

    var labelDPlus = document.createElement("label");
    labelDPlus.className = "routeDrawSummaryDPlus";
    labelDPlus.textContent = `${data.elevationData.dplus} m`;
    line2.appendChild(labelDPlus);

    var labelDMinus = document.createElement("label");
    labelDMinus.className = "routeDrawSummaryDMinus";
    labelDMinus.textContent = `- ${data.elevationData.dminus} m`;
    line2.appendChild(labelDMinus);

    div.appendChild(line1);
    div.appendChild(line2);

    return div;
  },
};

export default RouteDrawSaveDOM;
