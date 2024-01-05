import { Toast } from '@capacitor/toast';
import utils from '../unit-utils';
import DomUtils from '../dom-utils';

import Sortable from 'sortablejs';

/**
 * DOM de la fenêtre de compte
 * @mixin MyAccountDOM
 */
let MyAccountDOM = {
    dom : {
        container: null,
        routeList: null,
    },

    /**
     * obtenir le container principal
     * @param {*} accountName
     * @param {*} routes
     * @returns {DOMElement}
     * @public
     */
    getContainer (accountName, routes) {
        // nettoyage
        if (this.dom.container) {
            this.dom.container.remove();
        }
        // ajout du container principal
        var container = this.__addAccountContainerDOMElement(accountName);
        // ajout des itinéraires
        this.dom.routeList = this.__addAccountRoutesContainerDOMElement(routes);
        // dragn'drop !
        Sortable.create(this.dom.routeList, {
            handle : ".handle-draggable-layer",
            draggable : ".draggable-layer",
            animation : 200,
            forceFallback : true,
        });
        container.appendChild(this.dom.routeList);

        return container;
    },

    /**
     * ajout du container principal
     * @returns {DOMElement}
     * @private
     */
    __addAccountContainerDOMElement (accountName) {
        var div = this.dom.container = document.createElement("div");
        div.id = "myAccountBody";
        div.className = "";
        var bodyHeader = document.createElement("p");
        bodyHeader.id = "myAccountHeaderName";
        var connected = true;
        if (!accountName) {
            accountName = "Non connecté";
            connected = false;
        }
        bodyHeader.innerText = accountName;
        div.appendChild(bodyHeader);

        if (!connected) {
            var notLoggedInWarn = document.createElement("p");
            notLoggedInWarn.id = "myAccountNotLoggedInWarn";
            notLoggedInWarn.innerText = "Les itinéraires enregistrés peuvent être perdus";
            div.appendChild(notLoggedInWarn);

            var logInBtn = document.createElement("div");
            logInBtn.id = "myAccountLogInBtn";
            logInBtn.innerText = "Se connecter";
            div.appendChild(logInBtn);

            logInBtn.addEventListener("click", () => {
                console.warn("GPF auth not implemented");
            })
        } else {
            var logOutBtn = document.createElement("div");
            logOutBtn.id = "myAccountLogOutBtn";
            logOutBtn.innerText = "Se déconnecter";
            div.appendChild(logOutBtn);
        }

        return div;
    },

    /**
     * ajoute le container sur les itinéraires
     * @param {*} routes
     * @returns {DOMElement}
     * @private
     */
    __addAccountRoutesContainerDOMElement (routes) {
        var divList = this.dom.container = document.createElement("div");
        divList.id = "myaccountRouteList";
        for (let i = 0; i < routes.length; i++) {
            divList.appendChild(this.__addRouteContainer(routes[i], i));
        }
        return divList;
    },

    /**
     * met à jour le container sur les itinéraires
     * @param {*} routes
     * @private
     */
    __updateAccountRoutesContainerDOMElement (routes) {
        this.dom.routeList.innerHTML = "";
        for (let i = 0; i < routes.length; i++) {
            this.dom.routeList.appendChild(this.__addRouteContainer(routes[i], i));
        }
    },

    /**
     * Ajout d'une entrée pour une route (DOM)
     * @param {*} route
     * @private
     */
    __addRouteContainer(route, index) {
        var title =  route.name || `Itinéraire de ${utils.convertDistance(route.data.distance)}`;

        // Template d'une route
        var tplContainer = `
        <div class="tools-layer-panel draggable-layer" id="route-container_ID_${index}">
          <div class="handle-draggable-layer" id="route-cross-picto_ID_${index}"></div>
          <div id="route-basic-tools_ID_${index}">
            <label class="routeDrawSummaryTransport lblRouteDrawSummaryTransport${route.transport}"></label>
            <div class="wrap-tools-layers">
              <span id="route-title_ID_${index}">${title}</span>
              <div id="route-summary-div_ID_${index}" class="tools-layer-summary">
                <label class="routeDrawSummaryDistance">${utils.convertDistance(route.data.distance)}</label>
                <label class="routeDrawSummaryDuration">${utils.convertSecondsToTime(route.data.duration)}</label>
                <label class="routeDrawSummaryDPlus">${route.data.elevationData.dplus} m</label>
              </div>
            </div>
          </div>
          <label id="route-show-advanced-tools_ID_${index}" title="Plus d'outils" class="tools-layer-advanced"></label>
          <div id="route-advanced-tools_ID_${index}" class="tools-layer-advanced-menu">
            <div id="route-share_ID_${index}" class="tools-layer-share" title="Partager l'itinéraire">Partager</div>
            <input type="checkbox" id="route-visibility_ID_${index}" checked="false" />
            <label id="route-visibility-picto_ID_${index}" for="route-visibility_ID_${index}" title="Afficher/masquer l'itinéraire'" class="tools-layer-visibility">Afficher/masquer</label>
            <div id="route-edit_ID_${index}" class="tools-layer-edit" title="Modifier l'itinéraire">Modifier</div>
            <div id="route-remove_ID_${index}" class="tools-layer-remove" title="Supprimer l'itinéraire'">Supprimer</div>
          </div>
        </div>
        `;

        // transformation du container : String -> DOM
        var container = DomUtils.stringToHTML(tplContainer.trim());

        container.querySelector(`#route-share_ID_${index}`).addEventListener("click", () => {
            // TODO
            console.log("share");
        });

        container.querySelector(`#route-visibility_ID_${index}`).addEventListener("click", () => {
            // TODO
            console.log("show");
        });

        container.querySelector(`#route-edit_ID_${index}`).addEventListener("click", () => {
            // TODO
            console.log("edit");
        });

        container.querySelector(`#route-remove_ID_${index}`).addEventListener("click", () => {
            // TODO
            console.log("delete");
        });

        if (!container) {
          console.warn();
          return;
        }
        return container;
      }
};

export default MyAccountDOM;
