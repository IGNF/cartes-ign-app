/**
 * Fonctions utilitaires
 */
let domUtils = {
  stringToHTML: (str) => {

    var support = function () {
      if (!window.DOMParser) return false;
      var parser = new DOMParser();
      try {
        parser.parseFromString("x", "text/html");
      } catch (err) {
        return false;
      }
      return true;
    };

    // If DOMParser is supported, use it
    if (support()) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(str, "text/html");
      return doc.body.firstChild;
    }

    // Otherwise, fallback to old-school method
    var dom = document.createElement("div");
    dom.innerHTML = str;
    return dom;

  },

  horizontalParentScroll: (event) => {
    event.target.parentElement.scrollBy({
      left: event.target.parentElement.offsetWidth * 0.8,
      top: 0,
      behavior : "smooth",
    });
  }

};

export default domUtils;
