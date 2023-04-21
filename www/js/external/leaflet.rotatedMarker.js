L.RotatedMarker = L.Marker.extend({
  options: {
    rotationAngle: 0,
    rotationOrigin: "",
  },

  initialize: function (latlng, options) {
    L.Marker.prototype.initialize.call(this);

    L.Util.setOptions(this, options);
    this._latlng = L.latLng(latlng);

    var iconOptions = this.options.icon && this.options.icon.options;
    var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
    if (iconAnchor) {
      iconAnchor = iconAnchor[0] + "px " + iconAnchor[1] + "px";
    }

    this.options.rotationOrigin =
      this.options.rotationOrigin || iconAnchor || "center center";
    this.options.rotationAngle = this.options.rotationAngle || 0;

    // Ensure marker keeps rotated during dragging
    this.on("drag", function (e) {
      e.target._applyRotation();
    });
  },

  onRemove: function (map) {
    L.Marker.prototype.onRemove.call(this, map);
  },

  _setPos: function (pos) {
    L.Marker.prototype._setPos.call(this, pos);
    this._applyRotation();
  },

  _applyRotation: function () {
    if (this.options.rotationAngle) {
      let $markerRotate = document.getElementById("markerRotate")
      $markerRotate.style.transformOrigin =
        this.options.rotationOrigin;
      $markerRotate.style.transform =
        " rotateZ(" + this.options.rotationAngle + "deg)";
    }
  },

  setRotationAngle: function (angle) {
    this.options.rotationAngle = angle;
    this.update();
    return this;
  },

  setRotationOrigin: function (origin) {
    this.options.rotationOrigin = origin;
    this.update();
    return this;
  },
});

L.rotatedMarker = function (latlng, options) {
  return new L.RotatedMarker(latlng, options);
};
