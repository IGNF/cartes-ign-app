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
        elem.classList.add(option.class);
      }
      elem.classList.add(elementClass);
      elem.innerText = option.text;
      elem.addEventListener("click", (e) => {

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
        }, 600);
      });
      div.appendChild(elem);
    }
    return div;
  }

  async show(settings) {
    this.settings = settings || {
      style: "list", // can be "buttons", "list", "custom"
      options: [], // {class: "", text: "", value: ""}
      title: "",
      content: "", // dom element if "custom" style
    };

    this._title = this.settings.title || "";
    this._options = this.settings.options || [];
    this._style = this.settings.style || "list";
    this._content = this.settings.content || "";

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
    }, 500);
  }
}

// singleton
const actionSheet = new ActionSheet();

export default actionSheet;
