// let tag = document.querySelector('.bp9cbjyn.rq0escxv.j83agx80.byvelhso.hv4rvrfc.dati1w0a').parentElement.parentElement;
let tag = null;
// DRL FIXIT? What is this selector??
tag = document.querySelector('.bp9cbjyn.rq0escxv.j83agx80.byvelhso.hv4rvrfc.dati1w0a');
if (tag) {
    tag = tag.parentElement;
    if (tag) {
        tag = tag.parentElement;
    }
}

async function sendTextToBackground() {
    let input = document.getElementById("txtSendTextToBackground");
    let value = input.value;
    if (value) {
        Messaging.SendMessageToBackground({ type: '#SA#-content-message', value: value }, function () {
            console.log("Value sent to background:", value);
            //  let messageButton = document.getElementById("btnMessageButton");
            //  messageButton.setAttribute("disabled", "disabled");
            input.value = "";
        });
    }
}

async function sendSyncCall() {
    console.log("Promise call start");
    alert("Promise start");
    let syncButton = document.getElementById("btnSyncButton");
    syncButton.style.display = "none";

    let statusText = document.getElementById("lblSyncStatusText");
    statusText.innerHTML = "Sync Request sent, waiting for response . . .";
    Messaging.SendMessageToBackground({ type: '#SA#-sync', value: new Date() }, function (response) {
        if (response) {
            let syncButton = document.getElementById("btnSyncButton");
            syncButton.style.display = "block";

            let statusText = document.getElementById("lblSyncStatusText");
            statusText.innerHTML = "";

            alert("Request sent on: " + new Date(response.value) + " and Response received on " + new Date() + ".");
        }
        else {
            alert("Some error occured!");
        }

        alert("Promise complete");
    });
}

function addMessageButton() {
    if (document.getElementById("btnMessageButton")) {
        return;
    }
    
    let messageButton = document.createElement("button");
    messageButton.name = "messageButton"
    messageButton.innerHTML = "Click to send text to background";
    messageButton.onclick = sendTextToBackground;
    messageButton.setAttribute("id", "btnMessageButton");

    let input = document.createElement("input");
    input.Type = "Text";
    input.maxLength = 50;
    input.placeHolder = "Enter text here";
    input.setAttribute("id", "txtSendTextToBackground");

    let syncButton = document.createElement("button");
    syncButton.name = "syncButton"
    syncButton.innerHTML = "Click to send a sync call";
    syncButton.onclick = sendSyncCall;
    syncButton.setAttribute("id", "btnSyncButton");

    let syncStatusText = document.createElement("label");
    syncStatusText.innerHTML = "";
    syncStatusText.setAttribute("id", "lblSyncStatusText");

    let div = document.createElement("div");
    div.id = "dvTempButtons";
    div.append(input);
    div.append(messageButton);
    div.append(syncButton);
    div.append(syncStatusText);
    document.getElementsByTagName("body")[0].prepend(div);
    if (tag) {
        tag.append(div);
    }
}

function showMessageInContent(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: '#SA#-background-message', value: true }));
    console.log(`Value came from Background: ${data.value || "No value"}`);
    alert(`Message from Content: ${data.value || "No value"}`);
}

setTimeout(function () { addMessageButton(); }, 2000);