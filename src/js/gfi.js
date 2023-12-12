const emptyError = `
 Absence de données
`;
async function multipleGFI(layerArray) {
  let GFIArray = layerArray.reverse()
  let promisesArray = GFIArray.map((layer) => {
    const response = fetch(
      `https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?` +
      `SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&` +
      `LAYER=${layer[0].split('$')[0]}` +
      `&TILECOL=${layer[1].tiles.tile.x}&TILEROW=${layer[1].tiles.tile.y}&TILEMATRIX=${layer[1].computeZoom}&TILEMATRIXSET=PM` +
      `&FORMAT=${layer[1].format}` +
      `&STYLE=${layer[1].style}&INFOFORMAT=text/html&I=${layer[1].tiles.tilePixel.x}&J=${layer[1].tiles.tilePixel.y}`
    ).then((response => { return response.text()})
    , 
    () => {
      throw new Error("GetFeatureInfo : HTTP error");
    })
    .then((res) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(res, "text/html");
      if (doc.body.innerText === "\n  \n  \n") {
        throw new Error(emptyError);
      }
      const xml = parser.parseFromString(res, "text/xml");
      if (xml.getElementsByTagName('ExceptionReport').length > 0) {
        const serializer = new XMLSerializer();
        const xmlStr = serializer.serializeToString(doc);
        throw new Error(xmlStr);
      }
      return res;
    })
    return response;
  })

  let responsesArray = Promise.allSettled(promisesArray);
  let response = (await responsesArray).find(r => r.status == "fulfilled");
  return response.value;
}


export default multipleGFI
// export default GFI