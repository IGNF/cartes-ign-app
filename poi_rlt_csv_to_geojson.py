import csv
import json

def csvToDictList(path="poi_rlt.csv", delimiter=";", quotechar='"'):
  rows = []
  with open(path, encoding="utf-8") as csvfile:
      reader = csv.DictReader(csvfile, delimiter=delimiter, quotechar=quotechar)
      for row in reader:
        if len(row["URL"].split("/")) < 3:
          continue
        rows.append(row)
  return rows

def urlToProperties(url):
  urlParams = url.split("/")[-1].split("?")[-1].split("&")
  return {param.split("=")[0]: param.split("=")[1] for param in urlParams}

def rowToFeature(row):
  urlParams = urlToProperties(row["URL"])
  result = {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [urlParams["x"], urlParams["y"]]
    },
    "properties": {
      "zoom": urlParams["z"],
      "layer1": urlParams["layer1"],
      "layer2": urlParams["layer2"],
      "mode": urlParams["mode"],
      "commune": row["Commune"],
      "departement": row["Département"],
      "theme": row["Thème"],
      "sousTheme": row["Sous-thème"],
      "text": row["Texte explicatif"],
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
