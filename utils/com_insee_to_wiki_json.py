import csv
import json

def csvToDictList(path="com_insee_wiki.csv", delimiter=",", quotechar='"'):
  rows = []
  with open(path, encoding="utf-8") as csvfile:
      reader = csv.DictReader(csvfile, delimiter=delimiter, quotechar=quotechar)
      for row in reader:
        rows.append(row)
  return rows

def dictListToDict(dictList):
  result = {}
  for dictItem in dictList:
    if dictItem["INSEE"] == "#N/A":
      continue
    result[dictItem["INSEE"]] = dictItem["Wikipedia"]
  return result

def writeJson(featureColl, path="src/js/data-layer/com_wiki.json"):
  with open(path, "w", encoding="utf-8") as file:
    json.dump(featureColl, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
  writeJson(dictListToDict(csvToDictList()))
