(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./node_modules/@capacitor/geolocation/dist/esm/web.js":
/*!*************************************************************!*\
  !*** ./node_modules/@capacitor/geolocation/dist/esm/web.js ***!
  \*************************************************************/
/*! exports provided: GeolocationWeb, Geolocation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GeolocationWeb", function() { return GeolocationWeb; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Geolocation", function() { return Geolocation; });
/* harmony import */ var _capacitor_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @capacitor/core */ "./node_modules/@capacitor/core/dist/index.js");

class GeolocationWeb extends _capacitor_core__WEBPACK_IMPORTED_MODULE_0__["WebPlugin"] {
    async getCurrentPosition(options) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(pos => {
                resolve(pos);
            }, err => {
                reject(err);
            }, Object.assign({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }, options));
        });
    }
    async watchPosition(options, callback) {
        const id = navigator.geolocation.watchPosition(pos => {
            callback(pos);
        }, err => {
            callback(null, err);
        }, Object.assign({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }, options));
        return `${id}`;
    }
    async clearWatch(options) {
        window.navigator.geolocation.clearWatch(parseInt(options.id, 10));
    }
    async checkPermissions() {
        if (typeof navigator === 'undefined' || !navigator.permissions) {
            throw this.unavailable('Permissions API not available in this browser');
        }
        const permission = await window.navigator.permissions.query({
            name: 'geolocation',
        });
        return { location: permission.state, coarseLocation: permission.state };
    }
    async requestPermissions() {
        throw this.unimplemented('Not implemented on web.');
    }
}
const Geolocation = new GeolocationWeb();

//# sourceMappingURL=web.js.map

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvQGNhcGFjaXRvci9nZW9sb2NhdGlvbi9kaXN0L2VzbS93ZWIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQTRDO0FBQ3JDLDZCQUE2Qix5REFBUztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWEsaUJBQWlCLDJEQUEyRDtBQUN6RixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxTQUFTLGlCQUFpQiwyREFBMkQ7QUFDckYsa0JBQWtCLEdBQUc7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUN1QjtBQUN2QiwrQiIsImZpbGUiOiIwLmluZGV4LmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdlYlBsdWdpbiB9IGZyb20gJ0BjYXBhY2l0b3IvY29yZSc7XG5leHBvcnQgY2xhc3MgR2VvbG9jYXRpb25XZWIgZXh0ZW5kcyBXZWJQbHVnaW4ge1xuICAgIGFzeW5jIGdldEN1cnJlbnRQb3NpdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKHBvcyA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShwb3MpO1xuICAgICAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0sIE9iamVjdC5hc3NpZ24oeyBlbmFibGVIaWdoQWNjdXJhY3k6IGZhbHNlLCB0aW1lb3V0OiAxMDAwMCwgbWF4aW11bUFnZTogMCB9LCBvcHRpb25zKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyB3YXRjaFBvc2l0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGlkID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24ocG9zID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHBvcyk7XG4gICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCBlcnIpO1xuICAgICAgICB9LCBPYmplY3QuYXNzaWduKHsgZW5hYmxlSGlnaEFjY3VyYWN5OiBmYWxzZSwgdGltZW91dDogMTAwMDAsIG1heGltdW1BZ2U6IDAgfSwgb3B0aW9ucykpO1xuICAgICAgICByZXR1cm4gYCR7aWR9YDtcbiAgICB9XG4gICAgYXN5bmMgY2xlYXJXYXRjaChvcHRpb25zKSB7XG4gICAgICAgIHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwYXJzZUludChvcHRpb25zLmlkLCAxMCkpO1xuICAgIH1cbiAgICBhc3luYyBjaGVja1Blcm1pc3Npb25zKCkge1xuICAgICAgICBpZiAodHlwZW9mIG5hdmlnYXRvciA9PT0gJ3VuZGVmaW5lZCcgfHwgIW5hdmlnYXRvci5wZXJtaXNzaW9ucykge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy51bmF2YWlsYWJsZSgnUGVybWlzc2lvbnMgQVBJIG5vdCBhdmFpbGFibGUgaW4gdGhpcyBicm93c2VyJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGVybWlzc2lvbiA9IGF3YWl0IHdpbmRvdy5uYXZpZ2F0b3IucGVybWlzc2lvbnMucXVlcnkoe1xuICAgICAgICAgICAgbmFtZTogJ2dlb2xvY2F0aW9uJyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7IGxvY2F0aW9uOiBwZXJtaXNzaW9uLnN0YXRlLCBjb2Fyc2VMb2NhdGlvbjogcGVybWlzc2lvbi5zdGF0ZSB9O1xuICAgIH1cbiAgICBhc3luYyByZXF1ZXN0UGVybWlzc2lvbnMoKSB7XG4gICAgICAgIHRocm93IHRoaXMudW5pbXBsZW1lbnRlZCgnTm90IGltcGxlbWVudGVkIG9uIHdlYi4nKTtcbiAgICB9XG59XG5jb25zdCBHZW9sb2NhdGlvbiA9IG5ldyBHZW9sb2NhdGlvbldlYigpO1xuZXhwb3J0IHsgR2VvbG9jYXRpb24gfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXdlYi5qcy5tYXAiXSwic291cmNlUm9vdCI6IiJ9