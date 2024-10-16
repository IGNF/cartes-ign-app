import csv
import json

NEW_MODE_TO_OLD_MODE = {
  "vSlider": "vSlider",
  "hSlider": "hSlider",
  "split-h": "vSlider",
  "split-v": "hSlider",
}

NEW_LAYER_TO_OLD_LAYER = {
  "1": "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
  "7": "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950",
  "8": "GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40",
  "9": "BNF-IGNF_GEOGRAPHICALGRIDSYSTEMS.CASSINI",
  "10": "ORTHOIMAGERY.ORTHOPHOTOS",
  "16": "ORTHOIMAGERY.ORTHOPHOTOS2011-2015",
  "17": "ORTHOIMAGERY.ORTHOPHOTOS2006-2010",
  "18": "ORTHOIMAGERY.ORTHOPHOTOS2000-2005",
  "19": "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965",
  "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2": "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
  "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950": "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950",
  "GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40": "GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40",
  "GEOGRAPHICALGRIDSYSTEMS.CASSINI": "BNF-IGNF_GEOGRAPHICALGRIDSYSTEMS.CASSINI",
  "ORTHOIMAGERY.ORTHOPHOTOS": "ORTHOIMAGERY.ORTHOPHOTOS",
  "ORTHOIMAGERY.ORTHOPHOTOS2011-2015": "ORTHOIMAGERY.ORTHOPHOTOS2011-2015",
  "ORTHOIMAGERY.ORTHOPHOTOS2006-2010": "ORTHOIMAGERY.ORTHOPHOTOS2006-2010",
  "ORTHOIMAGERY.ORTHOPHOTOS2000-2005": "ORTHOIMAGERY.ORTHOPHOTOS2000-2005",
  "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965": "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965",
}

def csvToDictList(path="poi_rlt.csv", delimiter=",", quotechar='"'):
  rows = []
  with open(path, encoding="utf-8") as csvfile:
      reader = csv.DictReader(csvfile, delimiter=delimiter, quotechar=quotechar)
      for row in reader:
        if len(row["lien url RLT"].split("/")) < 3:
          continue
        rows.append(row)
  return rows

def urlToProperties(url):
  urlParams = url.split("/")[-1].split("?")[-1].split("&")
  return {param.split("=")[0]: param.split("=")[1] for param in urlParams}

def rowToFeature(row):
  urlParams = urlToProperties(row["lien url RLT"])
  if not "x" in urlParams:
    urlParams["x"] = urlParams["lon"]
    urlParams["y"] = urlParams["lat"]
  result = {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [urlParams["x"], urlParams["y"]]
    },
    "properties": {
      "zoom": urlParams["z"],
      "layer1": NEW_LAYER_TO_OLD_LAYER[urlParams["layer1"]],
      "layer2": NEW_LAYER_TO_OLD_LAYER[urlParams["layer2"]],
      "mode": NEW_MODE_TO_OLD_MODE[urlParams["mode"]],
      "commune": row["Commune (1er et 2ème volet)"],
      "departement": row["Département (1er et 2ème volet)"],
      "accroche": row["Accroche (1er volet)"],
      "theme": row["Thème (2ème volet)"],
      "text": row["Texte explicatif (2ème volet)"],
    }
  }
  return result

def dictListToFeatureCollection(dictList):
  featureList = [rowToFeature(row) for row in dictList]
  result = {
    "type": "FeatureCollection",
    "features": featureList
  }
  return result

def writeGeojson(featureColl, path="src/js/data-layer/poi_rlt.json"):
  with open(path, "w", encoding="utf-8") as file:
    json.dump(featureColl, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
  writeGeojson(dictListToFeatureCollection(csvToDictList()))
