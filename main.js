let windowSize = 5;
let totalPackets = 10;
let timeout = 10;

let simulationPaused = false;

let packetSpeed = 20;
let packetSendQueue = {"next" : 0, "prev" : false, "priority" : []};

let states = {};
let oldStates = {};

let anims = {};

let windowPositionFactor = 37;
let windowStartingPosition = 66;
let windowCurrentPosition = 0; // packet number
let windowPositions = [];

let selectedPacket = false;

function ELE(id) {
  return document.getElementById(id);
}

function initSimulation(total) {
  totalPackets = total ? total : totalPackets;

  let swin = document.getElementById("swindow");
  swin.style.position = "absolute";
  swin.style.top = "66px";

  let srec = document.getElementById("srec");
  srec.style.position = "absolute";
  srec.style.top = "66px";

  for (let i = 0; i < totalPackets; i++) {
    windowPositions[i] = windowStartingPosition + windowPositionFactor * i;

    if (i > -1)
      document.getElementById(
        "sender"
      ).innerHTML += ` <div class="packet" onclick="packetSelect('ps-${i}')" id="ps-${i}"><span class="num">${i}</span></div>`;

    document.getElementById(
      "receiver"
    ).innerHTML += ` <div class="packet" onclick="packetSelect('pr-${i}')" id="pr-${i}"><span class="num">${i}</span></div>`;

    changeColor("ps-" + i);
    changeColor("pr-" + i);
  }
}

function changeColor(id, state) {
  let ele = document.getElementById(id);

  if(!id.includes("p")) return;
  console.log(id);
  if (!ele) console.log(id + " : packet does not exist");

  switch (state) {
    case "sending":
      ele.style.background = "skyblue";
      break;
    case "selected":
      ele.style.background = "lime";
      break;
    case "received":
      ele.style.background = "red";
      break;
    case "ack":
      ele.style.background = "yellow";
      break;
    case "ackrec":
      ele.style.background = "blue";
      break;
    case "idle" : 
      ele.style.background = "white";
      break;
    case "paused" : 

    if(oldStates[id] == "sending")  ele.style.background = "skyblue";
    if(oldStates[id] == "ackrec")  ele.style.background = "blue";
    if(oldStates[id] == "received")  ele.style.background = "red";
    if(oldStates[id] == "ack")  ele.style.background = "yellow";
      break;
    default:
      ele.style.background = "white";
      break;
  }
}

function updateState(id, state) {
  let ele = document.getElementById(id);
  if (!ele) return;
  if (states[id] && states[id] != "selected") oldStates[id] = states[id];
  states[id] = state;
  changeColor(id, state);
}

function clearAll() {
  document.getElementById(
    "simulation"
  ).innerHTML = `      <div id="sender" class="sender">

    <h2 class="title"> Sender </h2>

    <div id="bw"> </div>

    <div id="swindow" class="window">

    </div>

    <div id="aw"> </div>

</div>

<div>
        
</div>


<div id="receiver" class="receiver">


    <h2 class="title"> Receiver </h2>
    <div id="srec" class="window">

    </div>

</div>`;
}

function updateWindow(packet,rec) {
  console.log(packet);
  if(states["ps-" + packet] == "ackrec") return console.log("I dont look back once im done with it");
  let swin = rec ? document.getElementById("srec") : document.getElementById("swindow");
  let from = parseInt(swin.style.top);
  console.log(swin.style.top);

  let to = parseInt(windowPositions[packet]);

  windowCurrentPosition = packet;

  console.log(from +" - " +to);
  anims[rec ? "srec" : "swindow"] = setInterval(
    () => {
      if (from == to) return clearInterval(anims[rec ? "srec" : "swindow"]);
      if (to > from) from += 1;
      if (from > to) from -= 1;
      swin.style.top = from + "px";
    },
    5,
    10
  );

  //swin.style.top = windowPositions[packet] + "px"
}

// UTILSS

function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
  };
}

function idToNum(str) {
  var splitString = str.split("");
  var reverseArray = splitString.reverse();
  var joinArray = reverseArray.join("");
  return parseInt(joinArray);
}


function numToId(num,rec) {
  if(rec) return "pr-" + num;
  return "ps-" + num;
}
// UTILSS END

// PACKET RELATED FUNCTIONS

function packetSend(id, opp) {
if(simulationPaused) return;
  if(!id) {
    id = numToId(packetSendQueue.next)
  }

  if(idToNum(id) > windowCurrentPosition + 4) return console.log("Cannot send that packet");
  if(states[id] && states[id] != "paused") return console.log("Packet is already in sending state")
  let ele = ELE(id);
  ele.style.position = "relative";

  updateState(id, "sending");
  if(packetSendQueue.prev == idToNum(id) - 1 || !packetSendQueue.prev) {
  packetSendQueue.prev = packetSendQueue.next;
  packetSendQueue.next += 1;
  }
  let px = parseInt(ele.style.left) ? parseInt(ele.style.left) : 0;
  anims[id] = setInterval(
    () => {
      px += 1;
      let opp = getOffset(ELE(id.replace("s", "r")));
      let our = getOffset(ele);

      if (Math.round(opp.left) == Math.round(our.left)) {
        updateState(id.replace("s", "r"), "received");
        updateWindow(idToNum(id) + 1,true);
        updateState(id, "ack");
        clearInterval(anims[id]);
        packetResend(id);
        // updateWindow(5);
        return;
      }
      ele.style.left = px + "px";
    },
    packetSpeed,
    10
  );
}

function packetResend(id, opp) {
  let ele = ELE(id);
  ele.style.position = "relative";

  updateState(id, "ack");

  let px = parseInt(ele.style.left);
  anims[id] = setInterval(
    () => {
      px -= 1;
      let opp = getOffset(ELE(id.replace("s", "r")));
      let our = getOffset(ele);

      if (parseInt(ele.style.left) <= 0) {
        updateState(id, "ackrec");
        updateWindow(idToNum(id) + 1);
        return clearInterval(anims[id]);
      }
      ele.style.left = px + "px";
    },
    packetSpeed,
    10
  );
}

function packetSelect(id) {
  console.log(selectedPacket);
  if (selectedPacket == id) {
    updateState(selectedPacket, oldStates[selectedPacket]);
    selectedPacket = false;
    return;
  }
  if (selectedPacket) updateState(selectedPacket, oldStates[selectedPacket]);
  selectedPacket = id;
  updateState(id, "selected");
}

function packetStop(id) {
  updateState(id,"paused")
  clearInterval(anims[id]);
}

function packetResume(id) {
  console.log(id + oldStates[id])
  if (states[id] == "paused" && oldStates[id] == "sending" ) packetSend(id);
  if (states[id] == "paused" && oldStates[id] == "ack") packetResend(id);
  if(states[id] == "paused" && oldStates[id] == "ackrec") updateState(id,"ackrec") 
}


function packetKill(id) {

  let ele = ELE(id);
  ele.style.left = "0px";
}

// PACKET RELATED FUNCTIONS END

function pauseSimulation() {
  if(simulationPaused) return;
  document.getElementById("pauseID").style.display = "none";
  document.getElementById("resumeID").style.display = "block";

  let keys = Object.keys(anims);
  anims.paused = [];
  keys.forEach((key) => {
    packetStop(key);
    anims.paused.push(key);
  });
  simulationPaused = true;
}

function resumeSimulation() {
  if(!simulationPaused) return;
  document.getElementById("resumeID").style.display = "none";
  document.getElementById("pauseID").style.display = "block";


  simulationPaused = false;
  anims.paused.forEach((anim) => {
    packetResume(anim);
  });
}

initSimulation();
