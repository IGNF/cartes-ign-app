import { PbfWriter } from "pbf";

const vectorTileExtent = 4096;
const zigzag = (value) => value < 0 ? -value * 2 - 1 : value * 2;

function makeGeometry(type, centerX, centerY) {
  if (type === 1) {
    return [9, zigzag(centerX), zigzag(centerY)];
  }

  if (type === 2) {
    const startX = Math.max(0, centerX - 700);
    const endX = Math.min(vectorTileExtent, centerX + 700);
    return [9, zigzag(startX), zigzag(centerY), 10, zigzag(endX - startX), 0];
  }

  const left = Math.max(0, centerX - 600);
  const right = Math.min(vectorTileExtent, centerX + 600);
  const top = Math.max(0, centerY - 600);
  const bottom = Math.min(vectorTileExtent, centerY + 600);
  return [
    9, zigzag(left), zigzag(top),
    26, zigzag(right - left), 0, 0, zigzag(bottom - top), zigzag(left - right), 0,
    15,
  ];
}

function writeValue(value, pbf) {
  pbf.writeStringField(1, value);
}

function writeFeature(feature, pbf) {
  pbf.writeVarintField(1, 1);
  pbf.writePackedVarint(2, feature.tags);
  pbf.writeVarintField(3, feature.type);
  pbf.writePackedVarint(4, feature.geometry);
}

function writeLayer(layer, pbf) {
  const properties = Object.entries(layer.properties);
  pbf.writeStringField(1, layer.name);
  pbf.writeMessage(2, writeFeature, {
    tags: properties.flatMap((_, index) => [index, index]),
    type: layer.type,
    geometry: layer.geometry,
  });
  properties.forEach(([key]) => pbf.writeStringField(3, key));
  properties.forEach(([, value]) => pbf.writeMessage(4, writeValue, value));
  pbf.writeVarintField(5, vectorTileExtent);
  pbf.writeVarintField(15, 2);
}

export function encodeVectorTile({ center, zoom, tileX, tileY, layers }) {
  const worldTiles = 2 ** zoom;
  const longitudeTile = (center.longitude + 180) / 360 * worldTiles;
  const latitudeRadians = center.latitude * Math.PI / 180;
  const latitudeTile = (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2 * worldTiles;
  const localX = Math.round((longitudeTile - tileX) * vectorTileExtent);
  let localY = Math.round((latitudeTile - tileY) * vectorTileExtent);

  if (localY < 0 || localY > vectorTileExtent) {
    localY = Math.round((latitudeTile - (worldTiles - 1 - tileY)) * vectorTileExtent);
  }

  const pbf = new PbfWriter();
  if (localX >= 0 && localX <= vectorTileExtent && localY >= 0 && localY <= vectorTileExtent) {
    for (const layer of layers) {
      pbf.writeMessage(3, writeLayer, {
        name: layer.name,
        type: layer.geometryType,
        properties: layer.properties,
        geometry: makeGeometry(layer.geometryType, localX, localY),
      });
    }
  }
  return pbf.finish();
}
