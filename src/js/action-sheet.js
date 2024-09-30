/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * Action sheet custom pour suivre les besoins de  la maquette
 * @module ActionSheet
 */
class ActionSheet extends EventTarget {

  _target = document.getElementsByTagName("action-sheet")[0];
  _targetWrapper = document.getElementById("sheetContent");
  _targetContent = document.getElementById("sheetOptions");
  _closeElem = document.getElementById("sheetClose");
  _shown = false;

  constructor() {
    super();
    return this;
  }

  /**
   * Ajout des écouteurs d'évènement
   */
  _listeners() {
    this._closeElem.addEventListener("click", () => {
      /**
       * Evenement "closeSheet"
       * @event closeSheet
       * @type {*}
       */
      this.dispatchEvent(
        new CustomEvent("closeSheet", {
          bubbles: true,
        })
      );
    });
  }

  _createHtml() {
    if (this._title !== "") {
      const actionTitle = document.createElement("p");
      actionTitle.classList.add("actionSheet-title");
      actionTitle.innerText = this._title;
      this._targetContent.appendChild(actionTitle);
    }
    if (this._options.length > 0 || this._style === "custom") {
      let optionsHtml;
      if (this._style === "list") {
        optionsHtml = this._createListHtml(this._options);
      } else if (this._style === "custom") {
        optionsHtml = this._content;
      } else {
        optionsHtml = this._createButtonsHtml(this._options);
      }
      this._targetContent.appendChild(optionsHtml);
    }
  }

  _clearHtml() {
    this._targetContent.innerHTML = "";
    this._content = "";
  }

  _createListHtml(options) {
    return this._createGenericOptionsHtml(options, "actionSheet-list", "actionSheet-list-option");
  }

  _createButtonsHtml(options) {
    return this._createGenericOptionsHtml(options, "actionSheet-buttons", "actionSheet-buttons-button");
  }

  _createGenericOptionsHtml(options, wrapperClass, elementClass) {
    const div = document.createElement("div");
    div.classList.add(wrapperClass);
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const elem = document.createElement("div");
      if (option.class) {
        option.class.split(" ").forEach( (cssClass) => {
          elem.classList.add(cssClass);
        });
      }
      elem.classList.add(elementClass);
      elem.innerText = option.text;
      let hasBeenClicked = false;
      elem.addEventListener("click", (e) => {

        if (elem.classList.contains("confirm-needed")) {
          if (!hasBeenClicked) {
            hasBeenClicked = true;
            if (option.confirmCallback) {
              option.confirmCallback();
            }
            return;
          }
        }

        if (wrapperClass === "actionSheet-buttons") {
          e.target.style.color = "white";
          e.target.style.backgroundColor = "var(--dark-green)";
        }
        setTimeout(() => {
          /**
           * Evenement "optionSelect"
           * @event optionSelect
           * @type {*}
           * @property {*} value -
           */
          this.dispatchEvent(
            new CustomEvent("optionSelect", {
              bubbles: true,
              detail: {
                value: option.value
              }
            })
          );
        }, this._timeToHide);
      });
      div.appendChild(elem);
    }
    return div;
  }

  async show(settings) {
    // Si on demande l'ouverture de l'ActionSheet alors qu'elle est ouverte, on attend qu'elle se ferme.
    if (this._shown) {
      await new Promise((resolve) => {
        this.addEventListener("hideSheet", () => {
          resolve(null);
        });
      });
    }

    this._shown = true;
    this.settings = settings || {
      style: "list", // can be "buttons", "list", "custom"
      options: [], // {class: "", text: "", value: "", confirmCallback: null}
      title: "",
      content: "", // dom element if "custom" style
      timeToHide: 600, // ms, time after option select to hide
    };

    this._title = this.settings.title || "";
    this._options = this.settings.options || [];
    this._style = this.settings.style || "list";
    this._content = this.settings.content || "";
    this._timeToHide = this.settings.timeToHide || 600;

    this._listeners();
    this._createHtml();

    this._target.classList.remove("d-none");
    setTimeout( () => {
      this._targetWrapper.style.transform = "unset";
    }, 10);

    const result = await new Promise((resolve) => {
      this.addEventListener("optionSelect", (e) => {
        resolve(e.detail.value);
      });
      this.addEventListener("closeSheet", () => {
        resolve(null);
      });
    });
    this.hide();
    return result;
  }

  hide() {
    this._targetWrapper.style.removeProperty("transform");
    setTimeout( () => {
      this._target.classList.add("d-none");
      this._clearHtml();
      this._shown = false;
      /**
       * Evenement "hideSheet"
       * @event hideSheet
       * @type {*}
       * @property {*} value -
       */
      this.dispatchEvent(
        new CustomEvent("hideSheet", {
          bubbles: true,
        })
      );
    }, 500);
  }
}

// singleton
const actionSheet = new ActionSheet();

export default actionSheet;
