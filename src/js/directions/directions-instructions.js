import instructions from "./instructions.json";

const exist = (tag) => {
  return (instructions[tag]) ? true : false;
};

const unique = (tag)=> {
  return (exist(tag) && instructions[tag].unique) ? true : false;
};

const traduction = (tag) => {
  return (exist(tag)) ? instructions[tag].value : "## " + tag + " ##";
};

const description = (instruction) => {
  console.debug(instruction);
  var msg = "";
  if (instruction.maneuver.type) {
    msg += traduction(instruction.maneuver.type);
  }
  if (instruction.maneuver.modifier) {
    msg += traduction(instruction.maneuver.modifier);
    if (unique(instruction.maneuver.modifier)) {
      msg = traduction(instruction.maneuver.modifier);
    }
  }
  if (instruction.maneuver.exit) {
    msg += " " + instruction.maneuver.exit + "e sortie";
  }
  if (instruction.name === "Valeur non renseignée") {
    instruction.name = "";
  }
  if (instruction.name) {
    msg += " sur ";
    msg += instruction.name;
  }
  if (instruction.ref) {
    msg += " ( ";
    msg += instruction.ref;
    msg += " )";
  }
  return msg;
};

const guidance = (instruction) => {
  var iconName = "arrow"; // par defaut
  if (instruction.maneuver.type) {
    iconName = (exist(instruction.maneuver.type)) ? instructions[instruction.maneuver.type].icon : "arrow";
  }
  if (instruction.maneuver.modifier && !iconName.includes("point")) {
    iconName = (exist(instruction.maneuver.modifier)) ? instructions[instruction.maneuver.modifier].icon : "arrow";
  }

  var IconClass = "lblDirectionsDetailsItemGuidance-" + iconName;
    
  return IconClass;
};

class Instruction  {
  constructor (o) {
    // step = {
    //     distance
    //     driving_side
    //     duration
    //     name
    //     ref
    //     mode
    //     maneuver: {
    //         modifier
    //         type
    //     }
    // }
    this.guidance = guidance(o); // depart, arrivé ou étape, droite, gauche, tout droit...
    this.desc = description(o);
  }

  getDescription() {
    return this.desc;
  }

  getGuidance() {
    return this.guidance;
  }

  isStep() {
    var step = true;
    if (this.guidance.includes("point")) {
      step = false;
    }
    return step;
  }
}

export default Instruction;