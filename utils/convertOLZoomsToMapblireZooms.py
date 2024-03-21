import json

def converZoomsLayers(style):
  for layer in style["layers"]:
    # if "minzoom" in layer and layer["source"] == "plan_ign" and layer["minzoom"] != 0:
      # layer["minzoom"] -= 1
    if "maxzoom" in layer:
      layer["maxzoom"] += 1

    if "paint" not in layer:
      continue
    for prop in layer["paint"]:
      if isinstance(layer["paint"][prop], dict) and "stops" in layer["paint"][prop]:
        for stop in layer["paint"][prop]["stops"]:
          stop[0] += 1
      if isinstance(layer["paint"][prop], list) and layer["paint"][prop][0] == "step":
        for i in range(3, len(layer["paint"][prop])):
          if i % 2 == 1:
            layer["paint"][prop][i] -= 1

def convertFileZooms(path):
  with open(path, encoding="utf-8") as file:
    style = json.load(file)
  converZoomsLayers(style)
  with open(path, "w", encoding="utf-8", newline="") as file:
    json.dump(style, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
  convertFileZooms("www/data/plan-ign-interactif-style.json")
