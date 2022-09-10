Environment.AddInstalledListener(function () {
    Storage.SetStorage('TwitterScrape', {
        twitterAccountID: null,
        twitterAccountName: null,
        twitterAccountUsername: null
    });
});

let fetchTWContacts = {};
let contactFetchTWAccountID = null;

function onMessageTwitter(request, sender, sendResponse) {
    Log_WriteInfo('backgroundTwitter got request: ' + request.type);
   
    if (request.type == 'getAccountInfo') {
        Storage.GetStorage('TwitterScrape', ['twitterAccountID', 'twitterAccountName', 'twitterAccountUsername'], function (data) {
            sendResponse({ 
                id: data.twitterAccountID, 
                name: data.twitterAccountName,
                username: data.twitterAccountUsername
            });
        });
    }
    else if (request.type == 'setAccountInfo') {
        Storage.SetStorage('TwitterScrape',
            {
                twitterAccountID: request.id,
                twitterAccountName: request.name,
                twitterAccountUsername: request.username,
            },
            function () { sendResponse(); }
        );
    }
    else if (request.type == 'setMessages') {
        setServerState('TwitterScrape', request.accountID, request.currentCheck, null, request.messages)
            .then(resp => {
                // DRL FIXIT? With Twitter we get all the messages in one chunk, so when we send
                // them to the server that's the end of our run.
                releaseSyncControl(sender.tab.id, 'TwitterScrape');
                sendResponse(false);
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse(false);
            });
    }
    else if (request.type == 'setPostId') {
        setServerState('TwitterScrape', request.accountID, null, null,
           [{'MessageID': request.postID, 'ExternalMessageID': request.externalPostID, 'From': request.from}])
            .then(resp => {
                sendResponse();
            })
            .catch(error => {
                Log_WriteError("Error handling setPostId(): " + error);
                sendResponse();
            });
    }
    else if (request.type == 'setMessageId') {
        setServerState('TwitterScrape', request.accountID, null, null,
           [{'MessageID': request.messageID, 'ExternalMessageID': request.externalMessageID, 'From': request.from}])
            .then(resp => {
                sendResponse();
            })
            .catch(error => {
                Log_WriteError("Error handling setMessageId(): " + error);
                sendResponse();
            });
    }
    else if (request.type == 'getAction') {
        if (!getSyncControl(sender.tab.id, 'TwitterScrape')) {
            sendResponse({action: null});
            return;
        }
    
        // retrieving contacts doesn't require any server intervention or account information
        // so we handle it here
        if (initiateContactFetch(sender, 'TwitterScrape', contactFetchTWAccountID, fetchTWContacts,
           'https://twitter.com/{contact_id}', sendResponse)) {
            return;
        }
   
        let url = 'https://twitter.com';
        if (!fuzzyUrlsMatch(sender.url, url)) {
            Tabs.SetTabUrl(sender.tab.id, url);
            return;
        }
   
        getServerState('TwitterScrape', request.accountID, request.accountName)
            .then(resp => {
                if (resp == null) {
                    releaseSyncControl(sender.tab.id, 'TwitterScrape');
                    sendResponse({action: null});
                    return;
                }

                if (UserHasFeature(UserFeaturesSyncMessages) && resp.messages.length > 0) {
                    let message = resp.messages[0];
    
                    if (message.Type == 'twit_post') {
                        sendResponse({
                            action: 'makePost',
                            post: message });
                        return;
                    }
                    else if (message.Type == 'twit_msg') {
                        sendResponse({
                            action: 'sendMessage',
                            message: message
                        });
                        return;
                    }
                    else {
                        Log_WriteError("Unexpected Twitter message type " + message.Type);
                    }
                }
    
                contactFetchTWAccountID = resp.AccountID;
                if (parseContactFetches(resp.commands, fetchTWContacts, sendResponse))
                    return;

                var lastSynced = resp.LastSynced;
                if (lastSynced != null)
                    lastSynced = stringToTimestamp(lastSynced);

                let now = Date.now();
                if (UserHasFeature(UserFeaturesSyncMessages) &&
                    // it's time to scrape again
                    now - lastSynced >= timings.MESSAGES_SCRAPE_DELAY * 1000) {
                    sendResponse({
                        action: 'getMessages',
                        lastCheck: lastSynced,
                    });
                    return;
                }
    
    
                setServerState('TwitterScrape', request.accountID, now)
                   .then(resp => {
                       releaseSyncControl(sender.tab.id, 'TwitterScrape');
                       sendResponse({action: null});
                   })
                   .catch(error => {
                       Log_WriteError("Error setting final server state in getAction(): " + error);
                       releaseSyncControl(sender.tab.id, 'TwitterScrape');
                       sendResponse({action: null});
                   });
            })
            .catch(error => {
                Log_WriteError("Error handling getAction(): " + error);
                releaseSyncControl(sender.tab.id, 'TwitterScrape');
                sendResponse({action: null});
            });
    }
    else {
       Log_WriteError("Got unrecognized request:\n" + GetVariableAsString(request));
    }
}