import json

PROPERTIES_TO_CHANGE = [
  "line-width"
]

def changeZoomLevels(style, offset=-2):
  for layer in style["layers"]:
    if "paint" not in layer:
      continue
    for prop in layer["paint"]:
      if not (prop in PROPERTIES_TO_CHANGE):
        continue
      if isinstance(layer["paint"][prop], dict) and "stops" in layer["paint"][prop]:
        for stop in layer["paint"][prop]["stops"]:
          stop[0] += offset
      if isinstance(layer["paint"][prop], list) and layer["paint"][prop][0] == "step":
        for i in range(3, len(layer["paint"][prop])):
          if i % 2 == 1:
            layer["paint"][prop][i] += offset

def changeFileZooms(path):
  with open(path, encoding="utf-8") as file:
    style = json.load(file)
  changeZoomLevels(style)
  with open(path, "w", encoding="utf-8", newline="") as file:
    json.dump(style, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
  changeFileZooms("www/data/plan-ign-interactif-style.json")
