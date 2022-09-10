function sendTextToForeground() {
  let input = document.getElementById("txtSendTextToForeground");
  let value = input.value;
  if (value) {
      Messaging.SendMessageToTab(
        0,
        { type: "#SA#-background-message", value: value },
        function () {
          console.log("Value sent to foreground:", value);
          input.value = "";
        }
      );
  }
}

let syncRequestData = null;

function showRespondButton(data) {
  syncRequestData = data;
  let button = document.getElementById("btnSendSyncResponse");
  button.style.display = "block";
  console.log("Sync Request received", data);
}

function sendSyncResponseToForeground() {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "#SA#-sync", value: syncRequestData })
  );
  let button = document.getElementById("btnSendSyncResponse");
  syncRequestData = null;
  button.style.display = "none";
}

function showMessageInBackground(data) {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "#SA#-content-message", value: true })
  );
  console.log(`Value came from foreground: ${data.value || "No value"}`);
  alert(`Message from Content: ${data.value || "No value"}`);
}

function tryJsonParse(value) {
  let result = null;
  try {
    result = JSON.parse(value);
  } catch (e) {}
  return result;
}

function createWebView() {
  var button = document.getElementById("btnCreateTab");
  var url = document.getElementById("ddlTabs").value;
  console.log("Received URL: ", url);
  button.setAttribute("disabled", "disabled");
  if (url) {
    Tabs.CreateTab("2", url, false, function (response) {
      button.removeAttribute("disabled");
      let urls = [];
      Storage.GetStorage("StorageTemp", ["urls"], function (data) {
        let resultUrls = tryJsonParse(data.urls) || [];
        console.log("JSON resultUrls", resultUrls);
        if (!Array.isArray(resultUrls)) {
          if (resultUrls) {
            urls = [resultUrls] || [];
          } else {
            urls = [];
          }
        } else {
          urls = resultUrls;
        }

        urls.push(url);
        console.log("Received URLs", urls);
        Storage.SetStorage("StorageTemp", {
          urls: urls,
        });
      });
    });
  }
}

function showCurrentStorage() {
  Storage.GetStorage("StorageTemp", ["urls"], function (data) {
    let urls = tryJsonParse(data.urls) || [];
    if (urls && urls.length > 0) {
      var text = urls.join(`, `);
      console.log("Received Storage from App:", text);
      alert(`Received opened urls: ${text}`);
    } else {
      alert(`No urls found`);
    }
  });
}

function removeCurrentStorage() {
  Storage.RemoveStorage("StorageTemp", ["urls", "timerId"], function (result) {
    if (result) {
      alert("Storage removed");
    } else {
      alert("Some error occured");
    }
  });
}

function clearLog() {
  document.getElementById("logger").innerHTML = "";
}

let logTimerId = 0;

function addTimer() {
  Storage.GetStorage("StorageTemp", ["timerId"], function (data) {
    var timerId = parseInt(data.timerId) || 0;
    if (timerId > 0 && logTimerId > 0) {
      alert("Timer is already addded.");
      return;
    }

    logTimerId = timerId = Timers.AddRepeatingTimer(10, function () {
      console.log(`Timer Log: ${new Date()}`);
    });
    Storage.SetStorage("StorageTemp", { timerId: timerId }, function () {
      alert("Timer added");
    });
  });
}

function removeTimer() {
  Storage.GetStorage("StorageTemp", ["timerId"], function (data) {
    var timerId = parseInt(data.timerId) || 0;
    if (timerId !== 0) {
      Timers.RemoveRepeatingTimer(timerId);
      logTimerId = 0;
      Storage.RemoveStorage("StorageTemp", ["timerId"], function (data) {
        if (data) {
          alert("Timer Removed");
        } else {
          alert("Some error occured");
        }
      });
    } else {
      alert("Timer Not found");
    }
  });
}

function getLanguage() {
  Environment.ClientLanguages(function (languages) {
    console.log(
      "Languages: ",
      JSON.stringify(languages),
      Array.isArray(languages)
    );
    if (languages && languages.length > 0) {
      var language = languages.join(", ");
      console.log("language", language);
      console.log("Environment.ApplicationName: ", Environment.ApplicationName);
      console.log(
        "Environment.ApplicationVersion: ",
        Environment.ApplicationVersion
      );
      alert("language " + language);
    } else {
      alert("Some error occured");
    }
  });
}

function getAllStorage() {
  Storage.GetAllKeys(function (data) {
    console.log("GetAllKeys Response: ", JSON.stringify(data));
    alert(`GetAllStorage Storage Data: ${data.length}`);
  });
}

function getExtensionUrl() {
  alert(`Extension URL: ${Environment.ExtensionUrl}`);
}

function addEventListeners() {
  Tabs.AddTabCreatedListener(function (tabId) {
    let messageString = `The id of the latest tab created is ${tabId}`;
    console.log(messageString);
    alert(messageString);
  });

  Tabs.AddTabRemovedListener(function (tabId) {
    let messageString = `The tab with the id ${tabId} is removed.`;
    console.log(messageString);
    alert(messageString);
  });

  Tabs.AddWindowCreatedListener(function (windowId) {
    let messageString = `The window with id ${windowId} is added.`;
    console.log(messageString);
    alert(messageString);
  });

  Tabs.AddWindowRemovedListener(function (windowId) {
    let messageString = `The window with id ${windowId} is removed.`;
    console.log(messageString);
    alert(messageString);
  });
}

function removeDynamicTab() {
  var tabId = parseInt(document.getElementById("txtTabId").value) || 0;
  if (tabId) {
    Tabs.RemoveTab(tabId, function () {
      alert("Tab removed.");
    });
  }
}

function setTabUrl() {
  var tabId = parseInt(document.getElementById("txtTabId").value) || 0;
  if (tabId) {
    Tabs.SetTabUrl(tabId, "http://www.google.com", function () {
      alert("Tab url updated.");
    });
  }
}

function reloadTab() {
  var tabId = parseInt(document.getElementById("txtTabId").value) || 0;
  if (tabId) {
    Tabs.ReloadTab(tabId, function () {
      alert("Tab reloaded.");
    });
  }
}

function getTab() {
  var tabId = parseInt(document.getElementById("txtTabId").value) || 0;
  if (tabId) {
    Tabs.GetTab(tabId, function (tab) {
      console.log("Tab details: ", JSON.stringify(tab));
      alert("Tab details: " + encodeURIComponent(JSON.stringify(tab)));
    });
  }
}

function getAllTabs() {
  Tabs.GetAllTabs(function (allTabs) {
    console.log("All Tab details: ", JSON.stringify(allTabs));
    alert("All Tab details: " + encodeURIComponent(JSON.stringify(allTabs)));
  });
}

function getAllWindows() {
  Tabs.GetAllWindows(function (allWindows) {
    console.log("All window details: ", JSON.stringify(allWindows));
    alert(
      "All window details: " + encodeURIComponent(JSON.stringify(allWindows))
    );
  });
}
