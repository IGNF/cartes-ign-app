/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { Toast } from "@capacitor/toast";

import ActionSheet from "../action-sheet";
import utils from "../utils/unit-utils";
import DomUtils from "../utils/dom-utils";

/**
 * DOM de la fenêtre de compte
 * @mixin MyAccountDOM
 */
let MyAccountDOM = {
  dom: {
    container: null,
    routeNumber: null,
    routeTab: null,
    routeList: null,
    landmarkNumber: null,
    landmarkTab: null,
    landmarkList: null,
    importBtn: null,
  },

  /**
   * obtenir le container principal
   * @param {*} accountName
   * @param {*} routes
   * @returns {DOMElement}
   * @public
   */
  getContainer(accountName, routes, landmarks) {
    // nettoyage
    if (this.dom.container) {
      this.dom.container.remove();
    }
    // ajout du container principal
    var container = this.__addAccountContainerDOMElement(accountName);
    container.appendChild(this.__addTabsContainerDOMElement());
    // ajout des itinéraires
    this.dom.routeList = this.__addAccountRoutesContainerDOMElement(routes);
    // ajout des points de repères
    this.dom.landmarkList = this.__addAccountLandmarksContainerDOMElement(landmarks);
    this.dom.routeTab.appendChild(this.dom.routeList);
    this.dom.landmarkTab.appendChild(this.dom.landmarkList);

    // this.dom.importBtn = this.__addImportBtn();
    // container.appendChild(this.dom.importBtn);

    return container;
  },

  /**
   * ajout du container principal
   * @returns {DOMElement}
   * @private
   */
  __addAccountContainerDOMElement(accountName) {
    var div = this.dom.container = document.createElement("div");
    div.id = "myAccountBody";
    div.className = "";
    var bodyHeader = document.createElement("p");
    bodyHeader.id = "myAccountHeaderName";
    // var connected = true;
    if (!accountName) {
      accountName = "Mes enregistrements";
      // connected = false;
    }
    bodyHeader.innerText = accountName;
    div.appendChild(bodyHeader);

    // INFO: pour le compte GPF
    // if (!connected) {
    //   var logInBtn = document.createElement("div");
    //   logInBtn.id = "myAccountLogInBtn";
    //   logInBtn.innerText = "Se connecter";
    //   div.appendChild(logInBtn);

    //   logInBtn.addEventListener("click", () => {
    //     console.warn("GPF auth not implemented");
    //   });
    // } else {
    //   var logOutBtn = document.createElement("div");
    //   logOutBtn.id = "myAccountLogOutBtn";
    //   logOutBtn.innerText = "Se déconnecter";
    //   div.appendChild(logOutBtn);
    // }

    // REMOVEME when account ready
    this.dom.importBtn = this.__addImportBtn();

    div.appendChild(this.dom.importBtn);

    return div;
  },

  /**
   * ajout du bouton d'import
   * @returns {DOMElement}
   * @private
   */
  __addImportBtn() {
    var btn = document.createElement("div");
    btn.id = "myAccountImportBtn";
    btn.innerText = "Importer";

    btn.addEventListener("click", () => { this.importFile(); });
    return btn;
  },

  /**
   * ajout du container des onglets
   * @returns {DOMElement}
   * @private
   */
  __addTabsContainerDOMElement() {
    var tplContainer = `
    <div class="layer-tabs-wrap">
      <input class="layer-tabs-input" name="myaccount-tabs" type="radio" id="myaccount-routes-tab" checked="checked"/>
      <label class="layer-tabs-label" for="myaccount-routes-tab">Mes itinéraires <span id="myaccount-routes-number">0</span></label>
      <input class="layer-tabs-input" name="myaccount-tabs" type="radio" id="myaccount-landmarks-tab"/>
      <label class="layer-tabs-label" for="myaccount-landmarks-tab">Mes points de repère <span id="myaccount-landmarks-number">0</span></label>
      <div class="layer-tabs-content" id="myaccount-routes"></div>
      <div class="layer-tabs-content" id="myaccount-landmarks"></div>
    </div>`;
    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());
    this.dom.routeTab = container.querySelector("#myaccount-routes");
    this.dom.routeNumber = container.querySelector("#myaccount-routes-number");
    this.dom.landmarkTab = container.querySelector("#myaccount-landmarks");
    this.dom.landmarkNumber = container.querySelector("#myaccount-landmarks-number");
    return container;
  },

  /**
   * ajoute le container sur les itinéraires
   * @param {*} routes
   * @returns {DOMElement}
   * @private
   */
  __addAccountRoutesContainerDOMElement(routes) {
    var divList = document.createElement("div");
    divList.id = "myaccountRouteList";
    for (let i = 0; i < routes.length; i++) {
      divList.appendChild(this.__addRouteContainer(routes[i]));
    }
    this.dom.routeNumber.innerText = routes.length;
    return divList;
  },

  /**
   * met à jour le container sur les itinéraires
   * @param {*} routes
   * @private
   */
  __updateAccountRoutesContainerDOMElement(routes) {
    this.dom.routeList.innerHTML = "";
    for (let i = 0; i < routes.length; i++) {
      this.dom.routeList.appendChild(this.__addRouteContainer(routes[i]));
    }
    this.dom.routeNumber.innerText = routes.length;
  },

  /**
   * ajoute le container sur les points de repère
   * @param {*} landmarks
   * @returns {DOMElement}
   * @private
   */
  __addAccountLandmarksContainerDOMElement(landmarks) {
    var divList = this.dom.container = document.createElement("div");
    divList.id = "myaccountLandmarksList";
    for (let i = 0; i < landmarks.length; i++) {
      divList.appendChild(this.__addLandmarkContainer(landmarks[i]));
    }
    this.dom.landmarkNumber.innerText = landmarks.length;
    return divList;
  },

  /**
   * met à jour le container sur les points de repère
   * @param {*} landmarks
   * @private
   */
  __updateAccountLandmarksContainerDOMElement(landmarks) {
    this.dom.landmarkList.innerHTML = "";
    for (let i = 0; i < landmarks.length; i++) {
      this.dom.landmarkList.appendChild(this.__addLandmarkContainer(landmarks[i]));
    }
    this.dom.landmarkNumber.innerText = landmarks.length;
  },

  /**
   * Ajout d'une entrée pour une route (DOM)
   * @param {*} route
   * @private
   */
  __addRouteContainer(route) {
    var title = route.name;
    var routeId = route.id;

    var invisibleClass = route.visible ? "" : "invisible";

    // Template d'une route
    var tplContainer = `
      <div class="tools-layer-panel draggable-layer ${invisibleClass}" id="route-container_ID_${routeId}">
        <div class="handle-draggable-layer" id="route-cross-picto_ID_${routeId}"></div>
        <div id="route-basic-tools_ID_${routeId}">
          <label class="routeDrawSummaryTransport lblRouteDrawSummaryTransport${route.transport}"></label>
          <div class="wrap-tools-layers">
            <span id="route-title_ID_${routeId}">${title}</span>
            <div id="route-summary-div_ID_${routeId}" class="tools-layer-summary">
              <label class="routeDrawSummaryDistance">${utils.convertDistance(route.data.distance)}</label>
              <label class="routeDrawSummaryDuration">${utils.convertSecondsToTime(route.data.duration)}</label>
              <label class="routeDrawSummaryDPlus">${route.data.elevationData.dplus} m</label>
            </div>
          </div>
        </div>
        <label id="route-show-advanced-tools_ID_${routeId}" title="Plus d'outils" class="tools-layer-advanced"></label>
      </div>
      `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());

    // Event listener vide pour gestion du touch
    container.querySelector(".handle-draggable-layer").addEventListener("click", () => { });

    container.querySelector(`#route-show-advanced-tools_ID_${routeId}`).addEventListener("click", () => {
      const invisibleClass = route.visible ? "" : " invisible";
      ActionSheet.show({
        options: [
          {
            class: "tools-layer-share",
            text: "Partager",
            value: "share",
          },
          {
            class: `tools-layer-visibility${invisibleClass}`,
            text: route.visible ? "Masquer de la carte" : "Afficher sur la carte",
            value: "visibility",
          },
          {
            class: "tools-layer-edit",
            text: "Modifier",
            value: "edit",
          },
          {
            class: "tools-layer-export",
            text: "Exporter",
            value: "export",
          },
          {
            class: "tools-layer-remove confirm-needed",
            text: "Supprimer",
            value: "delete",
            confirmCallback: () => {
              Toast.show({
                text: "Confirmez la suppression de l'itinéraire",
                duration: "short",
                position: "bottom"
              });
            }
          },
        ],
        timeToHide: 50,
      }).then( (value) => {
        if (value === "visibility") {
          if (route.visible) {
            container.classList.add("invisible");
          } else {
            container.classList.remove("invisible");
          }
          this.toggleShowRoute(route);
        }
        if (value === "share") {
          this.shareRoute(route);
        }
        if (value === "edit") {
          this.editRoute(route);
        }
        if (value === "export") {
          this.exportRoute(route);
        }
        if (value === "delete") {
          this.deleteRoute(routeId);
        }
      });
    });

    // Au clic sur l'itinéraire = l'afficher
    container.querySelector(`#route-basic-tools_ID_${routeId}`).addEventListener("click", () => {
      this.showRouteDetails(route);
    });

    if (!container) {
      console.warn();
      return;
    }
    return container;
  },

  /**
   * Ajout d'une entrée pour un point de repère (DOM)
   * @param {*} landmark
   * @private
   */
  __addLandmarkContainer(landmark) {
    var title = landmark.properties.title;
    var landmarkId = landmark.id;

    var invisibleClass = landmark.properties.visible ? "" : "invisible";

    // Template d'une route
    var tplContainer = `
      <div class="tools-layer-panel draggable-layer ${invisibleClass}" id="landmark-container_ID_${landmarkId}">
        <div class="handle-draggable-layer" id="landmark-cross-picto_ID_${landmarkId}"></div>
        <div id="landmark-basic-tools_ID_${landmarkId}">
          <label class="landmarkSummaryIcon landmarkSummaryIcon${landmark.properties.icon}" style="background-color:${landmark.properties.color}"></label>
          <div class="wrap-tools-layers">
            <span id="landmark-title_ID_${landmarkId}">${title}</span>
          </div>
        </div>
        <label id="landmark-show-advanced-tools_ID_${landmarkId}" title="Plus d'outils" class="tools-layer-advanced"></label>
      </div>
      `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());

    // Event listener vide pour gestion du touch
    container.querySelector(".handle-draggable-layer").addEventListener("click", () => { });

    container.querySelector(`#landmark-show-advanced-tools_ID_${landmarkId}`).addEventListener("click", () => {
      const invisibleClass = landmark.properties.visible ? "" : " invisible";
      ActionSheet.show({
        options: [
          {
            class: "tools-layer-share",
            text: "Partager",
            value: "share",
          },
          {
            class: `tools-layer-visibility${invisibleClass}`,
            text: landmark.properties.visible ? "Masquer de la carte" : "Afficher sur la carte",
            value: "visibility",
          },
          {
            class: "tools-layer-edit",
            text: "Modifier",
            value: "edit",
          },
          {
            class: "tools-layer-export",
            text: "Exporter",
            value: "export",
          },
          {
            class: "tools-layer-remove confirm-needed",
            text: "Supprimer",
            value: "delete",
            confirmCallback: () => {
              Toast.show({
                text: "Confirmez la suppression du point de repère",
                duration: "short",
                position: "bottom"
              });
            }
          },
        ],
        timeToHide: 50,
      }).then( (value) => {
        if (value === "visibility") {
          if (landmark.properties.visible) {
            container.classList.add("invisible");
          } else {
            container.classList.remove("invisible");
          }
          this.toggleShowLandmark(landmark);
        }
        if (value === "share") {
          this.shareLandmark(landmark);
        }
        if (value === "edit") {
          this.editLandmark(landmark);
        }
        if (value === "export") {
          this.exportLandmark(landmark);
        }
        if (value === "delete") {
          this.deleteLandmark(landmarkId);
        }
      });
    });

    // Au clic sur le PR = l'afficher
    container.querySelector(`#landmark-basic-tools_ID_${landmarkId}`).addEventListener("click", () => {
      if (!landmark.properties.visible) {
        this.toggleShowLandmark(landmark);
      }
    });

    if (!container) {
      console.warn();
      return;
    }
    return container;
  }
};

export default MyAccountDOM;
