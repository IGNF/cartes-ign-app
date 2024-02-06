import json

PROPS_TO_CONVERT = [
  "fill-color",
  "fill-outline-color",
  "line-color"
]

def stopsToStep(stops):
  step = ["step", ["zoom"]]
  for i in range(len(stops["stops"])):
    if i != 0:
      step.append(stops["stops"][i][0])
    step.append(stops["stops"][i][1])
  return step

def allStopsToStep(style):
  for layer in style["layers"]:
    if "paint" not in layer:
      continue
    for prop in PROPS_TO_CONVERT:
      if prop in layer["paint"] and isinstance(layer["paint"][prop], dict):
        layer["paint"][prop] = stopsToStep(layer["paint"][prop])

def convertFileStopsToStep(path):
  with open(path, encoding="utf-8") as file:
    style = json.load(file)
  allStopsToStep(style)
  with open(path, "w", encoding="utf-8", newline="") as file:
    json.dump(style, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
  convertFileStopsToStep("plan-ign-interactif-style.json")