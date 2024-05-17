/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

const poiLegendRules = [
  {
    "subclass": "aerodrome",
    "libelle": "Aérodrome",
  },
  {
    "subclass": "arts_centre",
    "libelle": "Centre culturel",
  },
  {
    "subclass": "atm",
    "libelle": "Distributeur automatique de billets",
  },
  {
    "subclass": "bar",
    "libelle": "Bar, bistrot",
  },
  {
    "subclass": "bicycle_rental",
    "libelle": "Location de vélos, y compris Velib'",
  },
  {
    "subclass": "cafe",
    "libelle": "Café",
  },
  {
    "subclass": "casino",
    "libelle": "Casino",
  },
  {
    "subclass": "charging_station",
    "libelle": "Borne de recharge pour véhicules électriques",
  },
  {
    "subclass": "cinema",
    "libelle": "Cinéma",
  },
  {
    "subclass": "college",
    "libelle": "Enseignement supérieur",
  },
  {
    "subclass": "conference_centre",
    "libelle": "Centre de conférence",
  },
  {
    "subclass": "courthouse",
    "libelle": "Palais de justice",
  },
  {
    "subclass": "drinking_water",
    "libelle": "Source d'eau potable",
  },
  {
    "subclass": "events_venue",
    "libelle": "Lieu de réception",
  },
  {
    "subclass": "fast_food",
    "libelle": "Restauration rapide",
  },
  {
    "subclass": "ferry_terminal",
    "libelle": "Terminal de ferry",
  },
  {
    "subclass": "fire_station",
    "libelle": "Caserne de pompier",
  },
  {
    "subclass": "fuel",
    "libelle": "Station-service",
  },
  {
    "subclass": "grave_yard",
    "libelle": "Cimetière",
  },
  {
    "subclass": "cemetery",
    "libelle": "Cimetière",
  },
  {
    "subclass": "hospital",
    "libelle": "Hôpital",
  },
  {
    "subclass": "library",
    "libelle": "Bibliothèque publique",
  },
  {
    "subclass": "marketplace",
    "libelle": "Place de marché",
  },
  {
    "class": "amenity",
    "subclass": "monastery",
    "libelle": "Monastère",
  },
  {
    "subclass": "parking",
    "libelle": "Parking",
  },
  {
    "subclass": "pharmacy",
    "libelle": "Pharmacie",
  },
  {
    "subclass": "police",
    "libelle": "Poste de police, Gendarmerie",
  },
  {
    "subclass": "post_office",
    "libelle": "Bureau de poste",
  },
  {
    "subclass": "prison",
    "libelle": "Etablissement pénitencier",
  },
  {
    "subclass": "pub",
    "libelle": "Pub",
  },
  {
    "subclass": "recycling",
    "libelle": "Point de collecte pour le recyclage",
  },
  {
    "subclass": "restaurant",
    "libelle": "Restaurant",
  },
  {
    "subclass": "school",
    "libelle": "Ecole, collège ou lycée",
  },
  {
    "subclass": "toilets",
    "libelle": "Toilettes",
  },
  {
    "subclass": "townhall",
    "libelle": "Mairie",
  },
  {
    "subclass": "university",
    "libelle": "Université",
  },
  {
    "subclass": "place_of_worship",
    "libelle": "Edifice religieux",
  },
  {
    "subclass": "bus_stop",
    "libelle": "Arrêt de bus",
  },
  {
    "subclass": "rest_area",
    "libelle": "Aire de repos",
  },
  {
    "subclass": "services",
    "libelle": "Aire de services",
  },
  {
    "subclass": "aqueduct",
    "libelle": "Aqueduc",
  },
  {
    "subclass": "archaeological_site",
    "libelle": "Site archéologique",
  },
  {
    "subclass": "battlefield",
    "libelle": "Champ de bataille",
  },
  {
    "subclass": "building",
    "libelle": "Bâtiment historique",
  },
  {
    "subclass": "castle",
    "libelle": "Château",
  },
  {
    "subclass": "church",
    "libelle": "Bâtiment religieux",
  },
  {
    "subclass": "fort",
    "libelle": "Fort militaire",
  },
  {
    "class": "historic",
    "subclass": "monastery",
    "libelle": "Monastère",
  },
  {
    "subclass": "monument",
    "libelle": "Monument",
  },
  {
    "subclass": "ruins",
    "libelle": "Ruines",
  },
  {
    "class": "historic",
    "subclass": "tower",
    "libelle": "Tour historique",
  },
  {
    "subclass": "golf_course",
    "libelle": "Terrain de golf",
  },
  {
    "subclass": "marina",
    "libelle": "Port de plaisance, marina",
  },
  {
    "subclass": "pitch",
    "libelle": "Terrain de sport",
  },
  {
    "subclass": "picnic_table",
    "libelle": "Table de pique-nique",
  },
  {
    "subclass": "sports_centre",
    "libelle": "Centre sportif",
  },
  {
    "subclass": "sports_hall",
    "libelle": "Salle de sport",
  },
  {
    "subclass": "stadium",
    "libelle": "Stade",
  },
  {
    "subclass": "swimming_pool",
    "libelle": "Piscine",
  },
  {
    "subclass": "communications_tower",
    "libelle": "Tour de télécommunications",
  },
  {
    "subclass": "lighthouse",
    "libelle": "Phare",
  },
  {
    "subclass": "observatory",
    "libelle": "Observatoire",
  },
  {
    "subclass": "telescope",
    "libelle": "Télescope",
  },
  {
    "subclass": "cave_entrance",
    "libelle": "Entrée de grotte",
  },
  {
    "subclass": "peak",
    "libelle": "Sommet",
  },
  {
    "subclass": "saddle",
    "libelle": "Col de montagne",
  },
  {
    "subclass": "government",
    "libelle": "Administration",
  },
  {
    "class": "public_transport",
    "subclass": "station",
    "libelle": "Station, Gare",
  },
  {
    "class": "railway",
    "subclass": "station",
    "libelle": "Gare ferroviaire",
  },
  {
    "subclass": "aquarium",
    "libelle": "Aquarium",
  },
  {
    "subclass": "alpine_hut",
    "libelle": "Refuge de montagne",
  },
  {
    "subclass": "camp_site",
    "libelle": "Camping",
  },
  {
    "subclass": "hostel",
    "libelle": "Auberge de jeunesse",
  },
  {
    "subclass": "hotel",
    "libelle": "Hôtel",
  },
  {
    "subclass": "information",
    "libelle": "Office de tourisme, Point d'information",
  },
  {
    "subclass": "motel",
    "libelle": "Motel",
  },
  {
    "subclass": "museum",
    "libelle": "Musée",
  },
  {
    "subclass": "picnic_site",
    "libelle": "Aire de pique-nique",
  },
  {
    "subclass": "theme_park",
    "libelle": "Parc d'attraction",
  },
  {
    "subclass": "viewpoint",
    "libelle": "Point de vue",
  },
  {
    "subclass": "wilderness_hut",
    "libelle": "Refuge non gardé",
  },
  {
    "subclass": "zoo",
    "libelle": "Parc zoologique",
  },
  {
    "subclass": "dam",
    "libelle": "Barrage",
  },
  {
    "subclass": "waterfall",
    "libelle": "Chute d'eau, Cascade",
  },
  {
    "subclass": "bakery",
    "libelle": "Boulangerie",
  },
  {
    "subclass": "supermarket",
    "libelle": "Supermarché, Hypermarché",
  },
  {
    "subclass": "convenience",
    "libelle": "Alimentation générale",
  },
  {
    "subclass": "greengrocer",
    "libelle": "Primeur",
  },
  {
    "subclass": "pastry",
    "libelle": "Pâtisserie",
  },
  {
    "subclass": "mall",
    "libelle": "Centre commercial, galerie marchande",
  },
  {
    "subclass": "department_store",
    "libelle": "Grand magasin",
  },
  {
    "subclass": "frozen_food",
    "libelle": "Produits surgelés",
  },
  {
    "subclass": "theatre",
    "libelle": "Théâtre",
  },
  {
    "subclass": "bank",
    "libelle": "Banque",
  },
  {
    "subclass": "clothes",
    "libelle": "Boutique de vêtements",
  },
  {
    "subclass": "hairdresser",
    "libelle": "Coiffeur",
  },
  {
    "subclass": "horse_riding",
    "libelle": "Centre équestre",
  },
  {
    "subclass": "horse_racing",
    "libelle": "Hippodrome",
  },
  {
    "subclass": "christian",
    "libelle": "Edifice chrétien",
  },
  {
    "subclass": "jewish",
    "libelle": "Edifice judaïque",
  },
  {
    "subclass": "muslim",
    "libelle": "Edifice musulman",
  },
  {
    "subclass": "car_repair",
    "libelle": "Garage automobile",
  }
];

export default poiLegendRules;
