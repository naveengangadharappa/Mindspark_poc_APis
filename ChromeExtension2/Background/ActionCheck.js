// This module will help us catch two error cases:
// - we sent the client off to a URL, but the result was not the URL we requested (or in some cases we allow
//   one that is similar but we didn't get that either), which suggests the requested URL no longer exists
// - we sent the client to a URL to take some action, and we got a page reload and resent the same action,
//   and then another reload of the same URL, which suggests the client is doing something to reload the
//   page and we're not progressing which would result in an endless loop
// In both cases we must abort this action and move on to the next one.
// And this module also allows retrying setting the URL and sending the action a couple of times in order to
// allow handling a temporary unexpected scenario, such as the computer being shut down at the wrong time.

const ActionCheckInit = {
    action: null,
    url: null,
    cursor: null,
    attempts: 0 // this is used to avoid endless loop of re-attempting the same action
}

function ActionCheck_SetUrl(action, sender, url) {
    let localData = Storage.GetLocalVar('ActionCheck', ActionCheckInit);

    if (localData.action != null && localData.action !== action) {
        Log_WriteError('ActionCheck: Overriding action ' + localData.action + ' with ' + action);
        localData = Utilities_DeepClone(ActionCheckInit);
    }
    Log_WriteInfo('ActionCheck: ' + (localData.action == null ? 'Starting' : 'Continuing') + ' ' + action + ' by navigating to ' + url);
    localData.action = action;
    if (localData.url === url)
        localData.attempts++;
    else {
        localData.url = url;
        localData.cursor = null;
        localData.attempts = 0;
    }
    
    Storage.SetLocalVar('ActionCheck', localData);
    
    Tabs.SetTabUrl(sender.tab.id, url);
}

// assumes that if there is a cursor being used it is stored in the response as "lastCheck"
function ActionCheck_SendResponse(url, sendResponse, resp) {
    let localData = Storage.GetLocalVar('ActionCheck', ActionCheckInit);
    
    if (localData.action != null && localData.action !== resp.action) {
        Log_WriteError('ActionCheck: Overriding ' + localData.action + ' with ' + resp.action);
        localData = Utilities_DeepClone(ActionCheckInit);
    }
    localData.action = resp.action;
    let cursor = resp.hasOwnProperty('lastCheck') ? resp.lastCheck : null;
    if (localData.url === url) {
        if (localData.cursor === cursor) {
            localData.attempts++;
            Log_WriteInfo('ActionCheck: Retry ' + localData.attempts + ' of ' + localData.action);
        }
        else {
            Log_WriteInfo('ActionCheck: Continued attempt of ' + localData.action + ' at ' + url + ' with cursor ' + cursor);
            localData.cursor = cursor;
            localData.attempts = 1;
        }
    }
    else {
        Log_WriteInfo('ActionCheck: Initial attempt of ' + localData.action + ' at ' + url + ' with cursor ' + cursor);
        localData.url = url;
        assert(localData.cursor == null);
        localData.cursor = null;
        localData.attempts = 1;
    }

    Storage.SetLocalVar('ActionCheck', localData);

    sendResponse(resp);
}

function ActionCheck_GetUrl() {
    let localData = Storage.GetLocalVar('ActionCheck', ActionCheckInit);
    
    return localData.url;
}

function ActionCheck_OK(sender, notErrorIfContains) {
    let localData = Storage.GetLocalVar('ActionCheck', ActionCheckInit);
    
    if (localData.attempts < 3)
        return true;
    if (notErrorIfContains != undefined && sender.url.indexOf(notErrorIfContains) !== -1)
        Log_WriteInfo('ActionCheck: ' + localData.action + ' received expected but not desirable url containing "' + notErrorIfContains + '".');
    else if (localData.url == sender.url)
        Log_WriteError('ActionCheck: ' + localData.action + ' had too many retries at url "' + localData.url + '".');
    else
        Log_WriteError('ActionCheck: ' + localData.action + ' had too many retries, wanted "' + localData.url + '" but sent to "' + sender.url + '" instead.');
    return false;
}

function ActionCheck_Completed(action) {
    let localData = Storage.GetLocalVar('ActionCheck', ActionCheckInit);
    
    if (localData.action != action) {
        Log_WriteError('ActionCheck: Expected ' + localData.action + ' completing but got ' + action + ' completed instead');
        assert(0);
    }

    Log_WriteInfo('ActionCheck: Completed ' + action + ' after ' + localData.attempts + ' attempts');
    localData = Utilities_DeepClone(ActionCheckInit);

    Storage.SetLocalVar('ActionCheck', localData);
}

// could be called even if there was no action started
function ActionCheck_Aborting() {
    let localData = Storage.GetLocalVar('ActionCheck', ActionCheckInit);
    
    if (localData.action != null)
        Log_WriteInfo('ActionCheck: Aborting ' + localData.action + ' after ' + localData.attempts + ' attempts');
    
    localData = Utilities_DeepClone(ActionCheckInit);

    Storage.SetLocalVar('ActionCheck', localData);
}
