/**
 * Mapbox GL Layer Group Management Plugin
 * ISC License - Copyright (c) 2017, Mapbox
 * https://github.com/mapbox/mapbox-gl-layer-groups.git
 */
import Globals from './globals';

/**
 * Add a layer group to the map.
 *
 * @param {string} id The id of the new group
 * @param {Array<Object>} layers The Mapbox style spec layers of the new group
 * @param {string} [beforeId] The layer id or group id after which the group
 *     will be inserted. If ommitted the group is added to the bottom of the
 *     style.
 */
const addGroup = (id, layers, beforeId) => {
    var beforeLayerId = normalizeBeforeId(beforeId);
    for (var i = 0; i < layers.length; i++) {
        addLayerToGroup(id, layers[i], beforeLayerId, true);
    }
};

/**
 * Add a single layer to an existing layer group.
 *
 * @param {string} groupId The id of group
 * @param {Object} layer The Mapbox style spec layer
 * @param {string} [beforeId] An existing layer id after which the new layer
 *     will be inserted. If ommitted the layer is added to the bottom of
 *     the group.
 */
const addLayerToGroup = (groupId, layer, beforeId, ignoreBeforeIdCheck) => {
    if (beforeId && !ignoreBeforeIdCheck && (!isLayer(beforeId) || getLayerGroup(beforeId) !== groupId)) {
        throw new Error('beforeId must be the id of a layer within the same group');
    } else if (!beforeId && !ignoreBeforeIdCheck) {
        beforeId = getLayerIdFromIndex(getGroupFirstLayerId(groupId) - 1);
    }

    var groupedLayer = Object.assign({}, layer, {metadata: Object.assign({}, layer.metadata || {}, {group: groupId})});
    Globals.map.addLayer(groupedLayer, beforeId);
};

/**
 * Remove a layer group and all of its layers from the map.
 *
 * @param {string} id The id of the group to be removed.
 */
const removeGroup = (id) => {
    var layers = Globals.map.getStyle().layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].metadata && layers[i].metadata.group === id) {
            Globals.map.removeLayer(layers[i].id);
        }
    }
};

/**
 * Remove a layer group and all of its layers from the map.
 *
 * @param {string} id The id of the group to be removed.
 */
const moveGroup = (id, beforeId) => {
    var beforeLayerId = normalizeBeforeId(beforeId);

    var layers = Globals.map.getStyle().layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].metadata && layers[i].metadata.group === id) {
            Globals.map.moveLayer(layers[i].id, beforeLayerId);
        }
    }
};

/**
 * Get the id of the first layer in a group.
 *
 * @param {string} id The id of the group.
 * @returns {string}
 */
const getGroupFirstLayerId = (id) => {
    return getLayerIdFromIndex(getGroupFirstLayerIndex(id));
};

/**
 * Get the id of the last layer in a group.
 *
 * @param {string} id The id of the group.
 * @returns {string}
 */
const getGroupLastLayerId = (id) => {
    return getLayerIdFromIndex(getGroupLastLayerIndex(id));
};

const getGroupLayers = (id) => {
    var data = [];
    var layers = Globals.map.getStyle().layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.metadata && layer.metadata.group === id) {
            data.push(layer);
        }
    }
    return data;
};

/**
 * Modify opacity
 * 
 * @param {string} id  The id of the group to be modified 
 * @param {*} value
 */
const addOpacity = (id, value) => {
    var layers = Globals.map.getStyle().layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.metadata && layer.metadata.group === id) {
            if (layer.type === 'symbol')  {
                Globals.map.setPaintProperty(layer.id, `icon-opacity`, value);
                Globals.map.setPaintProperty(layer.id, `text-opacity`, value);
            } else {
                Globals.map.setPaintProperty(layer.id, `${layer.type}-opacity`, value);
            }
        }
    }
};

/**
 * Modify visibility
 * 
 * @param {string} id  The id of the group to be modified 
 * @param {*} value
 */
const addVisibility = (id, value) => {
    var layers = Globals.map.getStyle().layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].metadata && layers[i].metadata.group === id) {
            Globals.map.setLayoutProperty(layers[i].id, "visibility", (value) ? "visible" : "none");
        }
    }
};

/**
 * Modify color
 * 
 * @param {string} id The id of the group to be modified
 * @param {*} value
 */
const addGray = (id, value) => {};

const getGroupFirstLayerIndex = (id) => {
    var layers = Globals.map.getStyle().layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].metadata && layers[i].metadata.group === id) return i;
    }
    return -1;
};

const getGroupLastLayerIndex = (id) => {
    var layers = Globals.map.getStyle().layers;
    var i = getGroupFirstLayerIndex(id);
    if (i === -1) return -1;
    while (i < layers.length && (layers[i].id === id || layers[i].metadata.group === id)) i++;
    return i - 1;
};

const getLayerIdFromIndex = (index) => {
    if (index === -1) return undefined;
    var layers = Globals.map.getStyle().layers;
    return layers[index] && layers[index].id;
};

const getLayerGroup = (id) => {
    var metadata = Globals.map.getLayer(id).metadata;
    if (metadata) {
        return metadata.group;
    }
};

const isLayer = (id) => {
    return !!Globals.map.getLayer(id);
};

const normalizeBeforeId = (beforeId) => {
    if (beforeId && !isLayer(beforeId)) {
        return getGroupFirstLayerId(beforeId);
    } else if (beforeId && getLayerGroup(beforeId)) {
        return getGroupFirstLayerId(getLayerGroup(beforeId));
    } else {
        return beforeId;
    }
};

export default {
    addGroup,
    removeGroup,
    moveGroup,
    getGroupFirstLayer: getGroupFirstLayerId,
    getGroupLastLayer: getGroupLastLayerId,
    getGroupLayers,
    addOpacity,
    addVisibility,
    addGray
};