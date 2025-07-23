/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

// cached-map-extensions.js
import * as tilebelt from "@mapbox/tilebelt";
import { bounds } from "@mapbox/geo-viewport";
import ErrorStackParser from "error-stack-parser";
import Point from "@mapbox/point-geometry";

export class CachedMapExtensions {
  constructor(maplibreglMap) {
    this.map = maplibreglMap;
    this.precache_worker = undefined;

    // Attach the context function
    this.map._context = this._context.bind(this.map);
    this.map._precache = this._precache.bind(this.map);
  }

  // --- Méthodes à attacher ---
  attachAll() {
    this.map.cachedPanTo = this.cachedPanTo.bind(this.map);
    this.map.cachedZoomTo = this.cachedZoomTo.bind(this.map);
    this.map.cachedJumpTo = this.cachedJumpTo.bind(this.map);
    this.map.cachedEaseTo = this.cachedEaseTo.bind(this.map);
    this.map.cachedFitBounds = this.cachedFitBounds.bind(this.map);
    this.map.cachedFlyTo = this.cachedFlyTo.bind(this.map);
  }

  cachedPanTo(lnglat, options) {
    const o = Object.assign({}, options, { type: "pan", center: lnglat }, this._context.call(this, options));
    this._precache(o);
    if (!!options.run) return this.panTo(point, options);
  }

  cachedZoomTo(zoom, options) {
    const o = Object.assign({}, options, { type: "zoom", zoom: zoom }, this._context.call(this, options));
    this._precache(o);
    if (!!options.run) return this.zoomTo(zoom, options);
  }

  cachedJumpTo(options) {
    const o = Object.assign({}, options, { type: "jump" }, this._context.call(this, options));
    this._precache(o);
    if (!!options.run) return this.jumpTo(o);
  }

  cachedEaseTo(options) {
    const o = Object.assign({}, options, { type: "ease" }, this._context.call(this, options));
    this._precache(o);
    if (!!options.run) return this.easeTo(o);
  }

  cachedFitBounds(options) {
    const o = Object.assign({}, options, { type: "fitBounds" }, this._context.call(this, options));
    this._precache(o);
    if (!!options.run) return this.fitBounds(o);
  }

  cachedFlyTo(options) {
    options.type = "fly";
    const o = Object.assign({}, options, { type: "fly" }, this._context.call(this, options));
    this._precache(o);
    if (!!options.run) return this.flyTo(o);
  }

  _context(options) {
    const _sources = Object.entries(this.getStyle().sources)
      .filter(s => ["vector", "raster"].includes(s[1].type) && (s[1].url || s[1].tiles))
      .map(s => this.getSource(s[0]).tiles[0]);

    const _dimensions = [this.getCanvas().width, this.getCanvas().height];
    const _tilesize = this.transform.tileSize;
    const sc = this.getCenter();
    let zmin = Math.min(this.getZoom(), options.zoom);

    if (options.type == "fly") {
      const offsetAsPoint = Point.convert(options.offset || [0, 0]);
      const pointAtOffset = this.transform.centerPoint.add(offsetAsPoint);
      const locationAtOffset = this.transform.pointLocation(pointAtOffset);
      const center = new this.constructor.LngLat(...options.center);
      this._normalizeCenter(center);
      const from = this.transform.project(locationAtOffset);
      const delta = this.transform.project(center).sub(from);
      const rho = options.curve || 1.42;
      const u1 = delta.mag();
      const wmax = 2 * rho * rho * u1;
      const zd = this.getZoom() + this.transform.scaleZoom(1 / wmax);
      zmin = Math.floor(Math.max(Math.min(zmin + zd, options.minZoom || zmin + zd), 0));
    }

    return {
      sources: _sources,
      dimensions: _dimensions,
      tilesize: _tilesize,
      startCenter: [sc.lng, sc.lat],
      startZoom: this.getZoom(),
      zmin: zmin
    };
  }

  _precache(o) {
    if (typeof window !== "undefined" && this.precache_worker == undefined) {
      const _imported = ErrorStackParser.parse(new Error("not an actual error!"))[0].fileName;
      const target = `
        importScripts('${_imported}');
        let controller;
        let signal;
        onmessage = function (o){
          if (controller !== undefined && controller.signal !== undefined && !controller.signal.aborted){
            controller.abort();               
          }
          if (o.data.abort){
            postMessage({t: Date.now(), e: true});
            return;
          }
          controller = new AbortController();
          signal = controller.signal;     
          let _func = ${precache_function.toString()};
          _func.apply(null, [o.data]);
        }`;
      const mission = URL.createObjectURL(new Blob([target], { type: "text/javascript" }));
      this.precache_worker = new Worker(mission);
      this.precache_worker.onmessage = e => {
        this.precache_worker.time1 = e.data.t;
        if (!!o.debug) console.log(`Precaching time: ${this.precache_worker.time1 - this.precache_worker.time0}ms`);
      };
    }

    delete this.precache_worker.time1;
    this.once("moveend", e => {
      if (this.precache_worker.time1 == undefined) {
        this.precache_worker.postMessage({ abort: true });
        if (!!o.debug) console.log("🔶 Movement has finished before preloading");
      } else {
        if (!!o.debug) console.log(`🔚 Movement ends ${(this.precache_worker.time1) ? Date.now() - this.precache_worker.time1 : undefined} ms after precaching`);
      }
    });

    this.precache_worker.time0 = Date.now();
    this.precache_worker.postMessage(o);
  }
}

// Fonctions globales à exporter si utilisées ailleurs
export const precache_function = (o) => {
  const finalbbox = bounds(o.center, o.zoom, o.dimensions, o.tilesize);

  const bboxtiles = (bbox, zoom) => {
    const sw = tilebelt.pointToTile(bbox[0], bbox[1], zoom);
    const ne = tilebelt.pointToTile(bbox[2], bbox[3], zoom);
    const result = [];
    for (let x = sw[0] - 1; x < ne[0] + 2; x++) {
      for (let y = ne[1] - 1; y < sw[1] + 2; y++) {
        result.push([x, y, zoom]);
      }
    }
    return result;
  };

  const diagonaltiles = (p1, p2, zoom) => {
    const [x0, y0] = tilebelt.pointToTile(p1[0], p1[1], zoom);
    const [x1, y1] = tilebelt.pointToTile(p2[0], p2[1], zoom);
    const [dx, dy] = [Math.abs(x1 - x0), Math.abs(y1 - y0)];
    const [sx, sy] = [x0 < x1 ? 1 : -1, y0 < y1 ? 1 : -1];
    let err = (dx > dy ? dx : -dy) / 2;
    let [x, y] = [x0, y0];
    let tt = [];
    while (x !== x1 || y !== y1) {
      tt.push([x, y, zoom], ...tilebelt.getSiblings([x, y, zoom]));
      let e2 = err;
      if (e2 > -dx) { err -= dy; x += sx; }
      if (e2 < dy) { err += dx; y += sy; }
    }
    tt.push([x1, y1, zoom], ...tilebelt.getSiblings([x1, y1, zoom]));
    return [...new Set(tt)];
  };

  let tz;
  let tiles = [...diagonaltiles(o.startCenter, o.center, o.zmin)];
  if (o.type == "fly") {
    tiles.push(...diagonaltiles(o.startCenter, o.center, o.zmin - 1), ...diagonaltiles(o.startCenter, o.center, o.zmin + 1));
  }

  for (let z = o.zoom; z > o.zmin - 1; z--) {
    const tt = bboxtiles(finalbbox, z);
    tiles.push(...tt);
    tz = tt.length;
  }

  tiles = [...new Set(tiles)];
  const urls = tiles.map(t => o.sources.map(s =>
    s.replace("{x}", t[0]).replace("{y}", t[1]).replace("{z}", t[2])
  )).flat();

  Promise.all(urls.map(u => fetch(u, { signal })))
    .then(d => {
      if (!!o.debug) console.log(`Estimated gain: ${Math.round(900 * tz / 6)}ms`);
      if (!!o.debug) console.log(`Prefetched ${urls.length} tiles at zoom levels [${o.zmin} - ${o.zoom}]`);
      postMessage({ t: Date.now(), e: false });
    })
    .catch(e => {
      if (!!o.debug && e.name !== "AbortError") console.log("🔴 Precache error");
    });
};
