import json

with open("www/data/plan-ign-interactif-style.json") as file:
  style1 = json.load(file)

with open("PlanIGNetPOI-Test11-Geoplateforme.json") as file:
  style2 = json.load(file)

differences = []
style1_ids = []
style2_ids = []
for layer in style1["layers"]:
  if layer["source"] == "plan_ign":
    style1_ids.append(layer["id"])
for layer in style2["layers"]:
  if layer["source"] == "plan_ign":
    style2_ids.append(layer["id"])

for layerid in style1_ids:
  if layerid not in style2_ids:
    differences.append("only in app: " + layerid)

for layerid in style2_ids:
  if layerid not in style1_ids:
    differences.append("only in newfile: " + layerid)

print(differences)
