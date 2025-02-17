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
    tabsHeaderWrapper: null,
    routeNumber: null,
    routeTabHeader: null,
    routeTab: null,
    routeList: null,
    landmarkNumber: null,
    landmarkTabHeader: null,
    landmarkTab: null,
    landmarkList: null,
    compareLandmarkNumber: null,
    compareLandmarkTabHeader: null,
    compareLandmarkTab: null,
    compareLandmarkList: null,
    offlineMapNumber: null,
    offlineMapTabHeader: null,
    offlineMapTab: null,
    offlineMapList: null,
    tabsMenuBtn: null,
  },

  /**
   * obtenir le container principal
   * @param {*} accountName
   * @param {*} routes
   * @returns {DOMElement}
   * @public
   */
  getContainer(accountName, routes, landmarks, compareLandmarks, offlineMaps) {
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
    // ajout des points de repères RLT
    this.dom.compareLandmarkList = this.__addAccountCompareLandmarksContainerDOMElement(compareLandmarks);
    // ajout des cartes téléchargées
    this.dom.offlineMapList = this.__addAccountOfflineMapsContainerDOMElement(offlineMaps);
    this.dom.routeTab.appendChild(this.dom.routeList);
    this.dom.landmarkTab.appendChild(this.dom.landmarkList);
    this.dom.compareLandmarkTab.appendChild(this.dom.compareLandmarkList);
    this.dom.offlineMapTab.appendChild(this.dom.offlineMapList);

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

    return div;
  },

  /**
   * ajout du container des onglets
   * @returns {DOMElement}
   * @private
   */
  __addTabsContainerDOMElement() {
    var tplContainer = `
    <div class="tabs-wrap">
      <div class="tabs-menu-btn" tabindex="10" title="Sélectionner un onglet"></div>
      <div class="tabs-wrap-tabs">
      <input class="tabs-input" name="myaccount-tabs" type="radio" id="myaccount-routes-tab" checked="checked"/>
      <label class="tabs-label" for="myaccount-routes-tab">Itinéraires <span id="myaccount-routes-number">0</span></label>
      <input class="tabs-input" name="myaccount-tabs" type="radio" id="myaccount-offline-maps-tab"/>
      <label class="tabs-label" for="myaccount-offline-maps-tab">Cartes téléchargées <span id="myaccount-offline-maps-number">0</span></label>
      <input class="tabs-input" name="myaccount-tabs" type="radio" id="myaccount-landmarks-tab"/>
      <label class="tabs-label" for="myaccount-landmarks-tab">Points de repère <span id="myaccount-landmarks-number">0</span></label>
      <input class="tabs-input" name="myaccount-tabs" type="radio" id="myaccount-compare-landmarks-tab"/>
      <label class="tabs-label" for="myaccount-compare-landmarks-tab">Repères Comparer <span id="myaccount-compare-landmarks-number">0</span></label>
    </div>
      <div class="tabs-wrap-content">
      <div class="tabs-content" id="myaccount-routes"><div id="myAccountImportBtnRoutes">Importer</div></div>
      <div class="tabs-content" id="myaccount-offline-maps"><div id="myAccountDownloadMapBtn">Télécharger une carte</div><div id="myAccountOfflineTotalSize">Espace total des cartes enregistrées : <span id="myAccountOfflineTotalSizeSpan">0</span> Mo</div></div>
      <div class="tabs-content" id="myaccount-landmarks"><div id="myAccountImportBtnLandmarks">Importer</div></div>
      <div class="tabs-content" id="myaccount-compare-landmarks"></div>
      </div>
    </div>`;
    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());
    container.querySelector("#myAccountImportBtnRoutes").addEventListener("click", () => { this.importFile(); });
    container.querySelector("#myAccountImportBtnLandmarks").addEventListener("click", () => { this.importFile(); });
    container.querySelector("#myAccountDownloadMapBtn").addEventListener("click", () => { this.downloadMap(); });
    this.dom.tabsHeaderWrapper = container.querySelector(".tabs-wrap-tabs");
    this.dom.routeTabHeader = container.querySelector("#myaccount-routes-tab");
    this.dom.routeTab = container.querySelector("#myaccount-routes");
    this.dom.routeNumber = container.querySelector("#myaccount-routes-number");
    this.dom.landmarkTabHeader = container.querySelector("#myaccount-landmarks-tab");
    this.dom.landmarkTab = container.querySelector("#myaccount-landmarks");
    this.dom.landmarkNumber = container.querySelector("#myaccount-landmarks-number");
    this.dom.compareLandmarkTabHeader = container.querySelector("#myaccount-compare-landmarks-tab");
    this.dom.compareLandmarkTab = container.querySelector("#myaccount-compare-landmarks");
    this.dom.compareLandmarkNumber = container.querySelector("#myaccount-compare-landmarks-number");
    this.dom.offlineMapTabHeader = container.querySelector("#myaccount-offline-maps-tab");
    this.dom.offlineMapTab = container.querySelector("#myaccount-offline-maps");
    this.dom.offlineMapNumber = container.querySelector("#myaccount-offline-maps-number");
    this.dom.offlineMapSizeSpan = container.querySelector("#myAccountOfflineTotalSizeSpan");

    this.dom.tabsMenuBtn = container.querySelector(".tabs-menu-btn");
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
    var divList = document.createElement("div");
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
   * ajoute le container sur les points de repère RLT
   * @param {*} compareLandmarks
   * @returns {DOMElement}
   * @private
   */
  __addAccountCompareLandmarksContainerDOMElement(compareLandmarks) {
    var divList = document.createElement("div");
    divList.id = "myaccountCompareLandmarksList";
    for (let i = 0; i < compareLandmarks.length; i++) {
      divList.appendChild(this.__addCompareLandmarkContainer(compareLandmarks[i]));
    }
    this.dom.compareLandmarkNumber.innerText = compareLandmarks.length;
    return divList;
  },

  /**
   * met à jour le container sur les points de repère RLT
   * @param {*} compareLandmarks
   * @private
   */
  __updateAccountCompareLandmarksContainerDOMElement(compareLandmarks) {
    this.dom.compareLandmarkList.innerHTML = "";
    for (let i = 0; i < compareLandmarks.length; i++) {
      this.dom.compareLandmarkList.appendChild(this.__addCompareLandmarkContainer(compareLandmarks[i]));
    }
    this.dom.compareLandmarkNumber.innerText = compareLandmarks.length;
  },

  /**
   * ajoute le container sur les cartes téléchargées
   * @param {*} offlineMaps
   * @returns {DOMElement}
   * @private
   */
  __addAccountOfflineMapsContainerDOMElement(offlineMaps) {
    var divList = document.createElement("div");
    divList.id = "myaccountOfflineMapsList";
    let totalSize = 0;
    for (let i = 0; i < offlineMaps.length; i++) {
      divList.appendChild(this.__addOfflineMapContainer(offlineMaps[i]));
      totalSize += offlineMaps[i].size;
    }
    this.dom.offlineMapSizeSpan.innerText = totalSize.toFixed(2);
    this.dom.offlineMapNumber.innerText = offlineMaps.length;
    return divList;
  },

  /**
   * met à jour le container sur les cartes téléchargées
   * @param {*} offlineMaps
   * @private
   */
  __updateAccountOfflineMapsContainerDOMElement(offlineMaps) {
    this.dom.offlineMapList.innerHTML = "";
    let totalSize = 0;
    for (let i = 0; i < offlineMaps.length; i++) {
      this.dom.offlineMapList.appendChild(this.__addOfflineMapContainer(offlineMaps[i]));
      totalSize += offlineMaps[i].size;
    }
    this.dom.offlineMapSizeSpan.innerText = totalSize.toFixed(2);
    this.dom.offlineMapNumber.innerText = offlineMaps.length;
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
        <label id="route-show-advanced-tools_ID_${routeId}" title="Plus d'outils" class="tools-layer-advanced" role="button" tabindex="0"></label>
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
            class: "tools-layer-download",
            text: "Télecharger le plan",
            value: "download",
          },
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
        if (value === "download") {
          this.downloadRoute(route);
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

    // Template d'un PR
    var tplContainer = `
      <div class="tools-layer-panel draggable-layer ${invisibleClass}" id="landmark-container_ID_${landmarkId}">
        <div class="handle-draggable-layer" id="landmark-cross-picto_ID_${landmarkId}"></div>
        <div id="landmark-basic-tools_ID_${landmarkId}">
          <label class="landmarkSummaryIcon landmarkSummaryIcon${landmark.properties.icon}" style="background-color:${landmark.properties.color}"></label>
          <div class="wrap-tools-layers">
            <span id="landmark-title_ID_${landmarkId}">${title}</span>
          </div>
        </div>
        <label id="landmark-show-advanced-tools_ID_${landmarkId}" title="Plus d'outils" class="tools-layer-advanced" role="button" tabindex="0"></label>
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
      if (landmark.properties.visible) {
        this.toggleShowLandmark(landmark);
      }
      container.classList.remove("invisible");
      this.toggleShowLandmark(landmark);
    });

    if (!container) {
      console.warn();
      return;
    }
    return container;
  },

  /**
   * Ajout d'une entrée pour un point de repère RLT (DOM)
   * @param {*} compareLandmark
   * @private
   */
  __addCompareLandmarkContainer(compareLandmark) {
    var title = compareLandmark.properties.accroche;
    var landmarkId = compareLandmark.id;

    var invisibleClass = compareLandmark.properties.visible ? "" : "invisible";

    // Template d'un repère comparer
    var tplContainer = `
      <div class="tools-layer-panel draggable-layer ${invisibleClass}" id="compare-landmark-container_ID_${landmarkId}">
        <div class="handle-draggable-layer" id="compare-landmark-cross-picto_ID_${landmarkId}"></div>
        <div id="compare-landmark-basic-tools_ID_${landmarkId}">
          <label class="compareLandmarkSummaryIcon compareLandmarkSummaryIcon${compareLandmark.properties.color}"></label>
          <div class="wrap-tools-layers">
            <span id="compare-landmark-title_ID_${landmarkId}">${title}</span>
          </div>
        </div>
        <label id="compare-landmark-show-advanced-tools_ID_${landmarkId}" title="Plus d'outils" class="tools-layer-advanced" role="button" tabindex="0"></label>
      </div>
      `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());

    // Event listener vide pour gestion du touch
    container.querySelector(".handle-draggable-layer").addEventListener("click", () => { });

    container.querySelector(`#compare-landmark-show-advanced-tools_ID_${landmarkId}`).addEventListener("click", () => {
      const invisibleClass = compareLandmark.properties.visible ? "" : " invisible";
      ActionSheet.show({
        options: [
          {
            class: "tools-layer-share",
            text: "Partager",
            value: "share",
          },
          {
            class: `tools-layer-visibility${invisibleClass}`,
            text: compareLandmark.properties.visible ? "Masquer de la carte" : "Afficher sur la carte",
            value: "visibility",
          },
          {
            class: "tools-layer-edit",
            text: "Modifier",
            value: "edit",
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
          if (compareLandmark.properties.visible) {
            container.classList.add("invisible");
          } else {
            container.classList.remove("invisible");
          }
          this.toggleShowLandmark(compareLandmark);
        }
        if (value === "share") {
          this.shareCompareLandmark(compareLandmark);
        }
        if (value === "edit") {
          this.editCompareLandmark(compareLandmark);
        }
        if (value === "delete") {
          this.deleteCompareLandmark(landmarkId);
        }
      });
    });

    // Au clic sur le PR = l'afficher
    container.querySelector(`#compare-landmark-basic-tools_ID_${landmarkId}`).addEventListener("click", () => {
      if (compareLandmark.properties.visible) {
        this.toggleShowLandmark(compareLandmark);
      }
      container.classList.remove("invisible");
      this.toggleShowLandmark(compareLandmark);
    });

    if (!container) {
      console.warn();
      return;
    }
    return container;
  },

  /**
   * Ajout d'une entrée pour une carte téléchargée (DOM)
   * @param {*} offlineMap
   * @private
   */
  __addOfflineMapContainer(offlineMap) {
    var title = offlineMap.name;
    var offlineMapId = offlineMap.id;

    // Template d'une carte téléchargée
    var tplContainer = `
      <div class="tools-layer-panel draggable-layer" id="offline-map-container_ID_${offlineMapId}">
        <div class="handle-draggable-layer" id="offline-map-cross-picto_ID_${offlineMapId}"></div>
        <div id="offline-map-basic-tools_ID_${offlineMapId}">
          <label class="offlineMapSummaryIcon"></label>
          <div class="wrap-tools-layers">
            <span id="offline-map-title_ID_${offlineMapId}">${title}</span>
            <div id="route-summary-div_ID_${offlineMapId}" class="tools-layer-summary">
              <label class="offlineMapSummarySize">${Math.round(offlineMap.size * 100) / 100} Mo, </label>
              <label class="offlineMapSummaryDate">téléchargée le ${(new Date(offlineMap.timestamp)).toLocaleDateString("fr-FR")}</label>
            </div>
          </div>
        </div>
        <label id="offline-map-show-advanced-tools_ID_${offlineMapId}" title="Plus d'outils" class="tools-layer-advanced" role="button" tabindex="0"></label>
      </div>
      `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());

    // Event listener vide pour gestion du touch
    container.querySelector(".handle-draggable-layer").addEventListener("click", () => { });

    container.querySelector(`#offline-map-show-advanced-tools_ID_${offlineMapId}`).addEventListener("click", () => {
      ActionSheet.show({
        options: [
          {
            class: "tools-layer-edit",
            text: "Renommer",
            value: "rename",
          },
          {
            class: "tools-layer-remove confirm-needed",
            text: "Supprimer",
            value: "delete",
            confirmCallback: () => {
              Toast.show({
                text: "Confirmez la suppression de la carte",
                duration: "short",
                position: "bottom"
              });
            }
          },
        ],
        timeToHide: 50,
      }).then( (value) => {
        if (value === "rename") {
          this.renameOfflineMap(offlineMap);
        }
        if (value === "delete") {
          this.deleteOfflineMap(offlineMapId);
          Toast.show({
            text: "Suppression en cours...",
            duration: "short",
            position: "bottom"
          });
        }
      });
    });

    // Au clic sur la carte : zoomer sur l'emprise

    container.querySelector(`#offline-map-basic-tools_ID_${offlineMapId}`).addEventListener("click", () => {
      // Place le plan IGN au dessus de la pile des couches
      const planIgnLayerBtn = document.getElementById("PLAN.IGN.INTERACTIF$TMS");
      do {
        planIgnLayerBtn.click();
      } while (!planIgnLayerBtn.classList.contains("selectedLayer"));
      this.hide();
      this.map.fitBounds([[offlineMap.boundingBox.minLng, offlineMap.boundingBox.minLat], [offlineMap.boundingBox.maxLng, offlineMap.boundingBox.maxLat]]);
    });

    if (!container) {
      console.warn();
      return;
    }
    return container;
  }
};

export default MyAccountDOM;
