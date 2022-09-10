Messaging.AddContentMessageListener();

function invokeCreatedTabCallbacks(tabId) {
    // console.log("invokeCreatedTabCallbacks called");
    Messaging.SendMessageToBackground({type: '#SA#-invokeCreatedTabCallbacks', value: tabId}, function (result) {
        // console.log("invokeCreatedTabCallbacks, Result:", result);
        // alert('Callbacks called.');
    });
}