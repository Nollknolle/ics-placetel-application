const axios = require("axios");
const { clipboard, ipcRenderer } = require("electron");

const cfg = require(`C:\\users\\${
  require("os").userInfo().username
}\\.ics-placetel-config.json`);

let div = document.getElementById("Status");
let refreshTimestamp = document.getElementById("timestamp");
let token = document.getElementById("token");
let debug = document.getElementById("debug");
let shortcut = document.getElementById("shortcut");
let nebenstelle = document.getElementById("nebenstelle");

window.addEventListener("DOMContentLoaded", () => {
  updateUser();
  nebenstelle.textContent = cfg.placetel_data.si_id;
  token.textContent = "exists";
  shortcut.textContent = cfg.shortcut_key;
  setInterval(() => {
    updateUser();
  }, 10 * 1000);
});

function updateUser() {
  axios
    .get("https://api.placetel.de/v2/call_center_agents", {
      headers: {
        Authorization: `Bearer ${cfg.placetel_data.api_token}`,
      },
    })
    .then(function (response) {
      let content = "";
      for (const user of response.data) {
        switch (user.status) {
          case "offline":
            content += `<b>${user.name}:</b>  <button type="button" id="changeState" onClick="updateState(event)" class="btn btn-link"><span class="badge bg-danger" state="offline" placetel-id=${user.id} >${user.status}</span></button><br />`;
            break;
          case "online":
            content += `<b>${user.name}:</b>  <button type="button" id="changeState" onClick="updateState(event)" class="btn btn-link"><span placetel-id=${user.id} state="online" class="badge bg-success">${user.status}</span></button><br />`;
            break;
          default:
            content += `<b>${user.name}:</b> <span class="badge bg-warning">${user.status}</span><br />`;
            break;
        }
        div.innerHTML = content;

        var today = new Date();
        refreshTimestamp.innerHTML = `Last refresh: ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
      }
    })
    .catch(function (error) {
      div.textContent = error.response.data.error;
    });
}

async function updateState(event) {
  if (event.target.attributes["state"].value === "offline") {
    var data = JSON.stringify({
      status: "online",
    });
  } else {
    var data = JSON.stringify({
      status: "offline",
    });
  }

  var config = {
    method: "put",
    url: `https://api.placetel.de/v2/call_center_agents/${event.target.attributes["placetel-id"].value}`,
    headers: {
      Authorization: `Bearer ${cfg.placetel_data.api_token}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config).catch(function (error) {
    div.textContent = error.response.data.error;
  });

  setTimeout(() => {
    updateUser();
  }, 1000);
}

ipcRenderer.on("dialkey", () => {
  const text = clipboard.readText();
  if (nebenstelle.textContent != "") {
    var data = JSON.stringify({
      sipuid: nebenstelle.textContent,
      target: text,
      from_name: "ics it-systems GmbH",
    });

    var config = {
      method: "post",
      url: "https://api.placetel.de/v2/calls",
      headers: {
        Authorization: `Bearer ${cfg.placetel_data.api_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        debug.innerHTML = "Dialed: " + text;
        new Notification("Erfolgreich!", {
          body: "Dialed: " + text,
        });
      })
      .catch(function (error) {
        console.log(error);
        debug.innerHTML = `[${error.response.status}] ${error.response.data.error}`;
      });
  } else {
    debug.innerHTML = "Nebenstelle leer.";
  }
});