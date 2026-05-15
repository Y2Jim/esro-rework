const app = document.getElementById("app");
const bootScreen = document.getElementById("boot-screen");
const mainScreen = document.getElementById("main-screen");
const bootLog = document.getElementById("boot-log");
const mainLog = document.getElementById("log");
const bootPrompt = document.getElementById("boot-prompt");
const statusText = document.getElementById("status-text");

let bootReady = false;
let typing = false;

function setVisible(state) {
  if (state) {
    app.classList.remove("hidden");
  } else {
    app.classList.add("hidden");
    bootReady = false;
    typing = false;
    bootLog.innerHTML = "";
    mainLog.innerHTML = "";
    bootPrompt.classList.add("hidden");
    showPanel("boot");
  }
}

function showPanel(panel) {
  if (panel === "boot") {
    bootScreen.classList.add("active");
    mainScreen.classList.remove("active");
    return;
  }

  if (panel === "main") {
    bootScreen.classList.remove("active");
    mainScreen.classList.add("active");
  }
}

function addLine(text) {
  const line = document.createElement("div");
  line.innerHTML = "> " + text;
  mainLog.appendChild(line);
  mainLog.scrollTop = mainLog.scrollHeight;
}

function typeLine(text, target = bootLog) {
  const line = document.createElement("div");
  target.appendChild(line);
  let i = 0;
  function type() {
    if (i < text.length) {
      line.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, 15);
    } else {
      target.scrollTop = target.scrollHeight;
    }
  }
  type();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeLine(target, text, speed = 16, cssClass = "") {
  const line = document.createElement("div");
  line.className = `log-line ${cssClass}`.trim();
  target.appendChild(line);

  let built = "> ";
  for (const ch of text) {
    built += ch;
    line.textContent = built;
    target.scrollTop = target.scrollHeight;
    await wait(speed);
  }
}

async function playBoot(lines) {
  if (typing) return;

  typing = true;
  bootReady = false;
  bootLog.innerHTML = "";
  bootPrompt.classList.add("hidden");
  showPanel("boot");

  for (const line of lines) {
    await typeLine(bootLog, line.text, line.speed || 14, line.className || "");
    await wait(line.pause || 120);
  }

  bootReady = true;
  typing = false;
  bootPrompt.classList.remove("hidden");
}

function sendNui(eventName, data = {}) {
  fetch(`https://gum-esro/${eventName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(data)
  });
}

document.addEventListener("keydown", (e) => {
  if (app.classList.contains("hidden")) return;

  if (bootReady && (e.key === "Enter" || e.key === " ")) {
    showPanel("main");
    addLine(mainLog, "terminal ready", "purple");
    sendNui("bootContinue");
    return;
  }

  if (e.key === "Escape") {
    sendNui("close");
  }
});

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.onclick = () => {
    const menu = btn.dataset.menu;

    if (menu === "close") {
      sendNui("close");
      return;
    }

    addLine(`opening ${menu}`);
    sendNui("menu", { menu });
  };
});

window.addEventListener("message", async (event) => {
  const data = event.data;

  if (data.type) {
    if (data.type === "boot") {
      setVisible(true);
      typeLine("connecting to relay...");
      setTimeout(() => typeLine("loading shard directories..."), 300);
      setTimeout(() => {
        typeLine("terminal ready");
        setTimeout(() => showPanel("main"), 200);
      }, 600);
    }
    if (data.type === "log") {
      addLine(data.text);
    }
    if (data.type === "status") {
      statusText.textContent = data.text;
    }
    return;
  }

  if (!data || !data.action) return;

  switch (data.action) {
    case "show":
      setVisible(true);
      break;

    case "hide":
      setVisible(false);
      break;

    case "boot":
      setVisible(true);
      typeLine("connecting to relay...");
      setTimeout(() => typeLine("loading shard directories..."), 300);
      setTimeout(() => {
        typeLine("terminal ready");
        setTimeout(() => showPanel("main"), 200);
      }, 600);
      break;

    case "mainLog":
      addLine(data.text || "");
      break;

    case "status":
      statusText.textContent = data.text || "idle";
      break;

    case "switchMain":
      showPanel("main");
      break;
  }
});