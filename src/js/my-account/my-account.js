import MyAccountDOM from "./my-account-dom";
import Globals from "../globals";

/**
 * Interface sur la fenêtre du compte
 * @module MyAccount
 * @todo ajouter les fonctionnalités : cf. DOM
 */
class MyAccount {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      configuration: {},
    };

    // configuration
    // TODO client keycloak GPF
    this.configuration = this.options.configuration || {
    }

    // target
    this.target = this.options.target;

    // carte
    this.map = map;

    // nom d'utilisateur
    this.accountName = null;

    // itinéraires
    this.routes = [];

    // points de repère
    this.landmarks = [];

    // récupération des infos et rendu graphique
    this.compute().then(() => this.render());

    return this;
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    var target = this.target || document.getElementById("myaccountWindow");
    if (!target) {
      console.warn();
      return;
    }

    var container = this.getContainer(this.accountName, this.routes);
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
  }

  /**
   * récupération des informations
   * @public
   */
  async compute() {
    // TODO: patience
    // TODO: connection GPF
  }
}

// mixins
Object.assign(MyAccount.prototype, MyAccountDOM);

export default MyAccount;
