import Globals from './globals';
import LayersConfig from './layer-config';
import LayersGroup from './layer-group';
import LayersAdditional from './layer-additional';

import Sortable from 'sortablejs';

import ImageNotFound from '../html/img/image-not-found.png';

/**
 * Gestionnaire de couches
 * @fires addlayer
 * @fires removelayer
 * @todo N&B
 * @todo menu avancé sous forme d'une popup verticale
 * @todo icone de visibilité à modifier
 * @description 
 *      → manager    
 *      	→ instancie this.catalogue & this.switcher
 *     	→ ecouteurs sur les events 
 *	      	* addLayer
 *	      	   → this.catalogue → call this.switcher.addLayer
 *	      	   → this.switcher → call this.updateCounter
 *	      	* removeLayer
 *	      	   → this.catalogue → call this.switcher.removeLayer
 *	      	   → this.switcher → call this.updateCounter
 *      	→ loader de couches par defaut
 *         		→ call this.catalogue.addLayer
 *       
 *      → catalogue 
 *        	→ this.addLayer → call add interface → fire event addLayer
 *        	→ this.removeLayer → call remove interface → fire event removeLayer
 *      → switcher
 *        	→ this.addLayer → call addContainer & addGroup & map.addLayer → fire event addLayer
 *       	  → this.removeLayer → call removeContainer & removeGroup & map.removeLayer → fire event removeLayer
 *        	→ this.moveLayer → call moveContainer & moveGroup & map.moveLayer (TODO)
 */
class LayerSwitcher {

   /**
    * constructeur
    * @param {*} options 
    * @param {*} options.target
    */
    constructor(options) {
      this.options = options || {
        target : null
      };
  
      // TODO
      // options d'ajout de couches 
      // avec un test si la couche est déjà disponible sur la carte

      this.target = this.options.target || document.getElementById("layer-switcher");
      this.map = Globals.map

      // id unique et incremental pour faire la liaison entre le DOM et this.layers
      this.index = -1;

      /**
       * Options des couches avec position
       * {
       *   id : {
       *    title : "",
       *    quickLookUrl : "",
       *    opacity : 100,
       *    gray : 1,
       *    visibility : 1,
       *    index : 0,
       *    position : 0,
       *    type: "vector",
       *    style: "http://.../style.json"
       *   }
       * }
       */
      this.layers = {};
  
      /**
       * Interface pour les evenements
       * @example
       * event.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
       * event.addEventListener("myEvent", handler);
       */
      this.event = new EventTarget();

      this.#render();
      
    }
  
    /**
     * Rendu
     */
    #render() {
      var container = document.createElement("div");
      container.id = "lst-layer-switcher";
      container.className = "lst-layer-switcher";

      if (!container) {
        console.warn();
        return;
      }
  
      // ajout du container
      this.target.appendChild(container);

      // dragn'drop !
      Sortable.create(container, {
        handle : ".handle-draggable-layer",
        draggable : ".draggable-layer",
        animation : 200,
        forceFallback : true,
        // Call event function on drag and drop
        onEnd : (evt) => {
          var index = evt.item.id.substring(evt.item.id.lastIndexOf("_") + 1);
          var id = this.#getId(parseInt(index, 10));
          this.#setPosition(id, evt.newDraggableIndex, evt.oldDraggableIndex);
        }
      });
    }
  
    /**
     * Obtenir le nom de la couche à partir de son numero d'indexe
     * @param {*} index 
     * @returns 
     */
    #getId(index) {
      var id = null;
      for (const key in this.layers) {
        if (Object.hasOwnProperty.call(this.layers, key)) {
          const i = this.layers[key].index;
          if (i === index) {
            id = key;
            break;
          }
        }
      }
      return id;
    }

    /**
     * Obtenir le numero d'indexe à partir du nom de la couche
     * @param {*} id 
     * @returns 
     */
    #getIndex(id) {
      return this.layers[id].index;
    }

    /**
     * Position de la couche dans le gestionnaire
     * @param {*} id 
     * @param {*} newIndex 
     * @param {*} oldIndex 
     * @fixme vecteur tuilé
     */
    #setPosition(id, newIndex, oldIndex) {
      // position : 
      // * ordre natif à mapbox 
      // > cad même position dans le fichier de style !
      // idx pos style 
      //  0   0   0 la couche de fonds
      //  1   1   1 la couche intermediaire
      //  2   2   2 la couche la plus au dessus
      
      // Mais on prévoit un ordre inversé dans le gestionnaire !
      // idx pos style
      //  0   2   2 la couche la plus au dessus
      //  1   1   1 la couche intermediaire
      //  2   0   0 la couche de fonds

      // [
      //   id1 → pos3
      //   id2 → pos2 < newPosition : 2 --> id2 pos-- 1
      //   id3 → pos1 |  id3 pos-- 0
      //   id3 → pos1 |  id3 pos-- 0     oldPosition < newPosition
      //   id3 → pos1 |  id3 pos-- 0
      //   id4 → pos0 ^ oldPosition : 0 --> id4 newPosition 2
      // ]
      // [
      //   id1 → pos3
      //   id2 → pos2 ˇ oldPosition : 2 --> id2 newPosition 0
      //   id3 → pos1 |  id3 pos++ 2
      //   id3 → pos1 |  id3 pos++ 2     oldPosition > newPosition
      //   id3 → pos1 |  id3 pos++ 2
      //   id4 → pos0 < newPosition : 0 --> id4 pos++ 1
      // ]
      var maxPosition = Object.keys(this.layers).length - 1;
      var newPosition = maxPosition - newIndex;
      var oldPosition = maxPosition - oldIndex;
      var direction = 1; // sens de deplacement (vers le haut ou bas)
      this.layers[id].position = newPosition;
      if (typeof oldIndex !== "undefined") {
        for (const e in this.layers) {
          if (Object.hasOwnProperty.call(this.layers, e)) {
            const o = this.layers[e];
            if (oldPosition < newPosition) {
              direction = 1; // deplacement vers le haut
              if (o.position > oldPosition && o.position <= newPosition && e !== id) {
                o.position--; // on decremente de +1 la position des couches situées en dessous + celle que l'on replace
              }
            } else if (oldPosition > newPosition) {
              direction = 0; // deplacement vers le bas
              if (o.position < oldPosition && o.position >= newPosition && e !== id) {
                o.position++; // on incremente de +1 la position des couches situées au dessus + celle que l'on replace
              }
            } else {}
          }
        }
        // INFO
        // les couches raster possedent un seul style, 
        // on associe donc position dans le style et position dans le gestionnaire.
        // pour le vecteur tuilé, il faut determiner le nombre de styles pour chaque position.
        const getIndexLayer = (pos) => {
          var index = 0;
          if (pos === 0) {
            index = 0;
          } else {
            const entries = Object.entries(this.layers);
            for (let i = 0; i < pos; i++) {
              const id = entries.find((e) => { return e[1].position === i })[0];
              index += LayersGroup.getGroupLayers(id).length;
            }
          }
          return index;
        };
        var beforeIdx = getIndexLayer(newPosition) + direction;
        var beforeId = this.map.getStyle().layers[beforeIdx].id;
        LayersGroup.moveGroup(id, beforeId);
      }
    }

    /**
     * Mise à jour des positions dans le gestionnaire
     * lors de l'ajout ou suppression d'une couche
     */
    #updatePosition() {
      // on transforme un obj -> array
      // puis, on trie ce tableau : [0, 1, 4, 5, 7]
      // et, on redefinie les positions avec une suite consecutive : [0, 1, 2, 3, 4]
      const entries = Object.entries(this.layers);
      entries.sort((a, b) => {
        return a[1].position - b[1].position;
      });
      entries.forEach((e, pos) => {
        this.layers[e[0]].position = pos;
      });
      
    }

    /**
     * Opacité de la couche
     * @param {*} id 
     * @param {*} value 
     * @todo vecteur tuilé
     */
    #setOpacity(id, value) {
      this.layers[id].opacity = value;
      // mise à jour de la couche (style)
      var type = this.layers[id].type;
      if (type === "raster") {
        this.map.setPaintProperty(id, "raster-opacity", value / 100);
      } else if (type === "vector") {
        LayersGroup.addOpacity(id, value / 100);
      } else {
        throw new Error(`Type not yet implemented or unknow : ${type}`);
      }
    }

    /**
     * Visualisation de la couche
     * @param {*} id 
     * @param {*} value 
     */
    #setVisibility(id, value) {
      this.layers[id].visibility = value;
      // mise à jour de la couche (style)
      var type = this.layers[id].type;
      if (type === "raster") {
        this.map.setLayoutProperty(id, "visibility", (value) ? "visible" : "none");
      } else if (type === "vector") {
        LayersGroup.addVisibility(id, value);
      } else {
        throw new Error(`Type not yet implemented or unknow : ${type}`);
      }
    }

    /**
     * Affichage du N&B
     * @param {*} id 
     * @param {*} value
     * @todo not yet implemented !
     */
    #setColor(id, value) {
      this.layers[id].gray = value;
      // INFO
      // mise à jour de la couche via une property du style, 
      // mais, il n'existe pas de fonctionnalité pour le N&B
      // ex. this.map.setPaintProperty(id, "raster-contrast", (value) ? 1 : 0);
      var type = this.layers[id].type;
      if (type === "raster") {
        // TODO
      } else if (type === "vector") {
        LayersGroup.addGray(id, value);
      } else {
        throw new Error(`Type not yet implemented or unknow : ${type}`);
      }
    }

    /**
     * Ajout des ecouteurs pour une couche
     * @description les ecouteurs disparaissent en supprimant le DOM
     */
    #addListeners(id, shadow) {
      var index = this.#getIndex(id);

      // outils avancés
      shadow.getElementById(`visibility_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        this.#setVisibility(id, e.target.checked);
      });
      shadow.getElementById(`remove_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        this.removeLayer(id);
      });
      shadow.getElementById(`info_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        var text = document.getElementById("informationsText");
        var p = LayersConfig.getLayerProps(id);
        text.innerHTML = p.desc;
        var img = document.getElementById("informationsImg");
        img.src = LayersAdditional.getLegend(id.split("$")[0]);
        Globals.menu.open("informations");
      });
      shadow.getElementById(`color_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        this.#setColor(id, e.target.checked);
      });

      // opacité des couches
      shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("change", (e) => {
        var id = this.#getId(index);
        this.#setOpacity(id, e.target.value);
        // mise à jour du DOM
        var container = document.getElementById("opacity-value-middle_ID_" + index);
        container.innerHTML = e.target.value + "%";
      });
      shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("input", (e) => {
        var id = this.#getId(index);
        this.#setOpacity(id, e.target.value);
        // mise à jour du DOM
        var container = document.getElementById("opacity-value-middle_ID_" + index);
        container.innerHTML = e.target.value + "%";
      });

      // ouverture des options avancées
      shadow.getElementById(`show-advanced-tools_ID_${index}`).addEventListener("click", (e) => {});

      // drag'n drop des couches
      shadow.getElementById(`cross-picto_ID_${index}`).addEventListener("click", (e) => {});
    }

    /**
     * Ajout d'une entrée pour une couche (DOM)
     * @param {*} id 
     */
    #addLayerContainer(id) {
      var quickLookUrl = this.layers[id].quickLookUrl || ImageNotFound;
      var opacity = this.layers[id].opacity;
      var gray = this.layers[id].gray;
      var visibility = this.layers[id].visibility;
      var title =  this.layers[id].title || id.split("$")[0];
      
      var index = this.#getIndex(id);

      // Template d'une couche
      var tplContainer = `
      <div class="tools-layer-panel draggable-layer" id="container_ID_${index}">
        <div class="handle-draggable-layer" id="cross-picto_ID_${index}"></div>
        <div id="basic-tools_ID_${index}">
          <div id="thumbnail_ID_${index}">
            <img class="tools-layer-quickLookUrl" src="${quickLookUrl}"/>
          </div>
          <div class="wrap-tools-layers">
            <span id="title_ID_${index}">${title}</span>
            <div id="opacity-range-div_ID_${index}" class="tools-layer-opacity">
              <!-- before:: & after:: 0% / 100% -->
              <input id="opacity-value-range_ID_${index}" type="range" value=${opacity}>
            </div>
            <div id="opacity-middle-div_ID_${index}" class="tools-layer-opacity">
              <span id="opacity-value-middle_ID_${index}">${opacity}%</span>
            </div>
          </div>
        </div>
        <input type="checkbox" id="show-advanced-tools_ID_${index}" />
        <label id="show-advanced-tools-picto_ID_${index}" for="show-advanced-tools_ID_${index}" title="Plus d'outils" class="tools-layer-advanced"></label>
        <div id="advanced-tools_ID_${index}">
          <!-- N&B, visibility, info, remove -->
          <input type="checkbox" id="color_ID_${index}" checked="${gray}" />
          <label id="color-picto_ID_${index}" for="color_ID_${index}" title="Couleur/NB" class="tools-layer-color"></label>
          <input type="checkbox" id="visibility_ID_${index}" checked="${visibility}" />
          <label id="visibility-picto_ID_${index}" for="visibility_ID_${index}" title="Afficher/masquer la couche" class="tools-layer-visibility"></label>
          <div id="info_ID_${index}" class="tools-layer-info" title="Informations de la couche"></div>
          <div id="remove_ID_${index}" class="tools-layer-remove" title="Supprimer la couche"></div>
        </div>
      </div>
      `;

      const stringToHTML = (str) => {

        var support = function () {
          if (!window.DOMParser) return false;
          var parser = new DOMParser();
          try {
            parser.parseFromString('x', 'text/html');
          } catch (err) {
            return false;
          }
          return true;
        };
  
        // If DOMParser is supported, use it
        if (support()) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(str, 'text/html');
          return doc.body.firstChild;
        }
  
        // Otherwise, fallback to old-school method
        var dom = document.createElement('div');
        dom.innerHTML = str;
        return dom;
  
      };
  
      // transformation du container : String -> DOM
      var container = stringToHTML(tplContainer.trim());
  
      if (!container) {
        console.warn();
        return;
      }
  
      // ajout du shadow DOM
      const shadow = container.attachShadow({ mode: "open" });
      shadow.innerHTML = tplContainer.trim();

      if (!shadow) {
        console.warn();
        return;
      }

      // ajout des écouteurs
      this.#addListeners(id, shadow);

      var target = document.getElementById("lst-layer-switcher");
      var theFirstChild = target.firstChild;
      target.insertBefore(shadow, theFirstChild);
    }

    /**
     * Suppression d'une entrée pour une couche (DOM)
     * @param {*} id 
     */
    #removeLayerContainer(id) {
      var index = this.#getIndex(id);
      var container = document.getElementById("container_ID_" + index);
      container.remove();
    }

    /**
     * Ajout de la couche
     * @param {*} id 
     * @returns 
     */
    #addLayerMap(id) {
      var promise = null;
      
      var type = this.layers[id].type;
      var style = [];
      if (type === "raster") {
        style.push({
          id : id,
          source : id,
          type : "raster"
        });
      } else if (type === "vector") {
        style = this.layers[id].style; // url
      } else {
        throw new Error(`Type not yet implemented or unknown : ${type}`);
      }
      // HACK 
      // on positionne toujours le style avant ceux du calcul d'itineraires (directions)
      // afin que le calcul soit toujours la couche visible du dessus !
      var layerIndexBefore = this.map.getStyle().layers.findIndex((l) => l.source === "maplibre-gl-directions");
      var layerIdBefore = (layerIndexBefore !== -1) ? this.map.getStyle().layers[layerIndexBefore].id : null;
      
      if (Array.isArray(style)) {
        // Raster
        promise = new Promise((resolve, reject) => {
          LayersGroup.addGroup(id, style, layerIdBefore);
          resolve();
        });
      } else {
        // Vecteur
        promise = fetch(style)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.map.setSprite(data.sprites);
          this.map.setGlyphs(data.glyphs);
          return data;
        })
        .then((data) => {
          // on modifie la source des styles pour être conforme à celle déjà pré-enregistrée 
          var layers = data.layers.map((layer) => {
            layer.source = id;
            return layer;
          });
          LayersGroup.addGroup(id, layers, layerIdBefore);
        });
      }

      return promise;
    }

    /**
     * Suppression de la couche
     * @param {*} id 
     */
    #removeLayerMap(id) {
      LayersGroup.removeGroup(id);
    }

    /**
     * Ajout d'une couche dans le gestionnaire
     * @param {*} id 
     * @fires addlayer
     * @public
     * @todo determiner la position dans la liste des styles
     */
    addLayer(id) {
      var props = LayersConfig.getLayerProps(id);
      this.index++;
      var options = {
          title : props.title,
          quickLookUrl : LayersAdditional.getQuickLookUrl(id.split("$")[0]),
          style: props.style,
          type: props.type,
          opacity : 100,
          gray : false,
          visibility : true,
          position : this.index // par défaut, cf. #updatePosition()
      };
      this.layers[id] = options;
      this.layers[id].index = this.index;
      this.#updatePosition();
      this.#addLayerContainer(id);
      this.#addLayerMap(id)
      .then(() => {
        /**
         * Evenement "addlayer"
         * @event addlayer
         * @type {*}
         * @property {*} id -
         * @property {*} options -
         */
        this.event.dispatchEvent(
          new CustomEvent("addlayer", {
            bubbles: true,
            detail: {
              id : id,
              options : this.layers[id]
            }
          })
        );
      })
      .catch((e) => {
        throw e;
      });

    }

    /**
     * Supprime une couche du gestionnaire
     * @param {*} id 
     * @fires removelayer
     * @public
     */
    removeLayer(id) {
      this.#removeLayerMap(id);
      this.#removeLayerContainer(id);
      delete this.layers[id];
      this.#updatePosition();

      /**
       * Evenement "removelayer"
       * @event removelayer
       * @type {*}
       * @property {*} id -
       */
      this.event.dispatchEvent(
        new CustomEvent("removelayer", {
          bubbles: true,
          detail: {
            id : id
          }
        })
      );
    }

}

export default LayerSwitcher;