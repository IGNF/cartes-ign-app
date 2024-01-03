import { Toast } from '@capacitor/toast';

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
        routes.forEach(route => {
          // do something
        });
        return divList;
    },

    /**
     * met à jour le container sur les itinéraires
     * @param {*} routes
     * @private
     */
    __updateAccountRoutesContainerDOMElement (routes) {
      this.dom.routeList.innerHTML = "";
      routes.forEach(route => {
        // do something
      });
  },
};

export default MyAccountDOM;
