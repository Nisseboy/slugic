//Global variables
let currentGate;
let currentGateName;
let unit;
let sizeDivisions = 30;
let step = 4;

//Defining DOM Elements
const mainElem = document.getElementsByClassName("main")[0];
const footerElem = document.getElementsByClassName("footer")[0];

const selectionElem = document.getElementsByClassName("selection")[0];

const themeSwitcherElem = document.getElementsByClassName("theme-switcher")[0];


//The settings menu
themeSwitcherElem.onclick = e => {
  document.body.classList.toggle("light-theme");
  themeSwitcherElem.classList.toggle("fa-sun");
  themeSwitcherElem.classList.toggle("fa-moon");
}

//Sizing
function resize() {
  unit = mainElem.getBoundingClientRect().height / sizeDivisions;
  document.body.style.setProperty("--unit", unit + "px");
}
resize();
window.onresize = resize;



//Loading gates
//TODO: load gates
if (Object.keys(gates.custom).length == 0) {
  currentGate = new Gate("computer", ["a", "b", "c", "c"], ["a", "b", "c"]);
  currentGateName = "computer";

  for (let i = 0; i < 5; i++) {
    let x = Math.floor(Math.random() * sizeDivisions);
    let y = Math.floor(Math.random() * sizeDivisions);
    let types = Object.keys(gates.all);
    let type = types[Math.floor(Math.random() * types.length)];

    let gate = {
      x,
      y,
      type,
      id: generateID()
    }

    currentGate.gates[gate.id] = gate;
  }

  gates.custom[currentGateName] = currentGate;
  gates.all[currentGateName] = currentGate;
}


//Drawing the gates
let drawnGates = {};
let drawnGatesInFooter = {};

function draw() {
  //Adding and moving placed gates
  for (let i in currentGate.gates) {
    let gate = currentGate.gates[i];
    let gateType = gates.all[gate.type];
    if (drawnGates[i]) {
      drawnGates[i].style.left = `calc(var(--unit) * ${gate.x})`;
      drawnGates[i].style.top = `calc(var(--unit) * ${gate.y})`;
      continue;
    } else {
      
    }
    let gateElem = document.createElement("div");

    let inputLen = gateType.inputs.length;
    let outputLen = gateType.outputs.length;
    let gateHeight = Math.max(inputLen, outputLen) * 0.75;

    gateElem.className = "gate";
    gateElem.style.left = `calc(var(--unit) * ${gate.x})`;
    gateElem.style.top = `calc(var(--unit) * ${gate.y})`;
    gateElem.innerText = gate.type;
    gateElem.style.setProperty("--name-length", Math.ceil(gate.type.length / 2) * 2);
    gateElem.style.setProperty("--num-inputs", inputLen);
    gateElem.style.setProperty("--num-outputs", outputLen);
    gateElem.style.backgroundColor = gateType.color;

    let plugHolderLeft = document.createElement("div");
    plugHolderLeft.className = "plug-holder left";
    for (let j in gateType.inputs) {
      let plug = document.createElement("div");
      plug.className = "plug";

      let baseY = gateHeight / inputLen * (j * 1 + 0.5);
      let finalY;
      if (baseY > gateHeight / 2) {
        finalY = Math.ceil(baseY * step) / step;
      } else {
        finalY = Math.floor(baseY * step) / step;
      }
      plug.style.top = `calc(${finalY - 0.25} * var(--unit))`;

      plugHolderLeft.appendChild(plug);
    }

    let plugHolderRight = document.createElement("div");
    plugHolderRight.className = "plug-holder right";
    for (let j in gateType.outputs) {
      let plug = document.createElement("div");
      plug.className = "plug";
      
      let baseY = gateHeight / outputLen * (j * 1 + 0.5);
      let finalY;
      if (baseY > gateHeight / 2) {
        finalY = Math.ceil(baseY * step) / step;
      } else {
        finalY = Math.floor(baseY * step) / step;
      }
      plug.style.top = `calc(${finalY - 0.25} * var(--unit))`;

      plugHolderRight.appendChild(plug);
    }

    gateElem.prepend(plugHolderLeft);
    gateElem.appendChild(plugHolderRight);
    mainElem.appendChild(gateElem);

    gateElem.dataset.id = gate.id;

    gateElem.addEventListener("mousedown", e => {
      if (e.button == 0) {
        startDrag(e, gate)
      }
      else if (e.button == 2) {
        delete currentGate.gates[i];
        draw();
      }
    });

    drawnGates[i] = gateElem;
    gate.elem = gateElem;
  }

  //Removing deleted gates
  for (let i in drawnGates) {
    if (!currentGate.gates[i]) {
      drawnGates[i].remove();
      delete drawnGates[i];
    }
  }

  //Placing gates in footer
  for (let i in gates.all) {
    if (drawnGatesInFooter[i]) {
      continue;
    }
    let gateType = gates.all[i];

    let gateElem = document.createElement("div");
    gateElem.className = "gate in-footer";
    gateElem.style.backgroundColor = gateType.color;
    gateElem.style.setProperty("--name-length", Math.ceil(i.length / 2) * 2);
    gateElem.innerText = i;


    footerElem.appendChild(gateElem);
    drawnGatesInFooter[i] = gateElem;
  }
}

draw();


//Dragging objects (They must have x, y, elem properties)
let dragged = [];
function startDrag(e, object) {
  let coords = getCoords(e);
  if (!e.ctrlKey && !object.elem.classList.contains("selected")) {
    clearSelected();
  }
  object.elem.classList.add("selected");

  dragged = [];
  getSelected().forEach((elem, i) => {
    //TODO: make this compatible with all object tpyes
    let ob = currentGate.gates[elem.dataset.id];
    dragged.push({
      offset: {
        x: ob.x - coords.x / unit,
        y: ob.y - coords.y / unit,
      },
      object: ob
    });
  });

  document.addEventListener("mousemove", whileDrag);
  document.addEventListener("mouseup", stopDrag);
  
  whileDrag(e);

  e.stopPropagation();
}
function whileDrag(e) {
  let coords = getCoords(e);
  dragged.forEach((object, i) => {
    object.object.x = Math.floor((coords.x / unit + object.offset.x) * 4) / 4;
    object.object.y = Math.floor((coords.y / unit + object.offset.y) * 4) / 4;
  });

  draw();
}
function stopDrag(e) {
  document.removeEventListener("mousemove", whileDrag);
  document.removeEventListener("mouseup", stopDrag);
}


//Selection field
mainElem.addEventListener("mousedown", startSelect);
let reselect = [];
let selectStart = {};
function startSelect(e) {
  if (e.button != 0)
    return;
  let coords = getCoords(e);
  selectStart = coords;

  reselect = [];
  if (e.ctrlKey) {
    reselect = getSelected();
  }

  document.addEventListener("mousemove", whileSelect);
  document.addEventListener("mouseup", stopSelect);
  selectionElem.style.display = "block";
  
  whileSelect(e);

  e.stopPropagation();
}
function whileSelect(e) {
  let coords = getCoords(e);

  let x1 = Math.min(selectStart.x, coords.x);
  let x2 = Math.max(selectStart.x, coords.x);
  let y1 = Math.min(selectStart.y, coords.y);
  let y2 = Math.max(selectStart.y, coords.y);

  selectionElem.style.left = x1 + "px";
  selectionElem.style.top = y1 + "px";
  selectionElem.style.width = x2 - x1 + "px";
  selectionElem.style.height = y2 - y1 + "px";

  clearSelected();
  let mainbox = mainElem.getBoundingClientRect();
  getElements().forEach((elem, i) => {
    let box = elem.getBoundingClientRect();
    if (
      x1 < box.x + box.width - mainbox.x &&
      x2 > box.x - mainbox.x &&
      y1 < box.y + box.height - mainbox.y &&
      y2 > box.y - mainbox.y
    ) {
      elem.classList.add("selected");
    }
  });
}
function stopSelect(e) {
  selectionElem.style.display = "none";
  document.removeEventListener("mousemove", whileSelect);
  document.removeEventListener("mouseup", stopSelect);
}


//Removes all selected gates on Delete or Backspace
document.addEventListener("keydown", e => {
  if (e.key == "Delete" || e.key == "Backspace") {
    getSelected().forEach(elem => {
      removeFromID(elem.dataset.id);
    });
  }
});

//Prevents context menu
document.oncontextmenu = e => {
  return false;
}


mainElem.addEventListener("mousemove", e => {
  let coords = getCoords(e);
  let {x, y} = toGrid(coords);
  document.getElementsByClassName("marker")[0].style.left = x + "px";
  document.getElementsByClassName("marker")[0].style.top = y + "px";
});

//Snaps a coordinate to nearest grid point
function toGrid(pos) {
  let uds = unit/step;
  let x = Math.floor(pos.x / uds) * uds;
  let y = Math.floor(pos.y / uds) * uds;

  return {x, y};
}

//From a mouse event, returns the coordinates on the main element
function getCoords(e) {
  let box = mainElem.getBoundingClientRect();
  return {
    x: e.clientX - box.x,
    y: e.clientY - box.y,
  };
}

//Returns array of all selected elements
function getSelected() {
  return Array.from(document.getElementsByClassName("selected"));
}
//Removes selected class from all elements
function clearSelected() {
  getSelected().forEach(element => {
    element.classList.remove("selected");
  });
}

//Returns array of all elements
function getElements() {
  return Array.from(document.getElementsByClassName("gate"));
}

//Returns object from id
function fromID(id) {
  return currentGate.gates[id];
}

//Removes object from id
function removeFromID(id) {
  if (currentGate.gates[id]) {
    delete currentGate.gates[id];
    draw();
  }
}