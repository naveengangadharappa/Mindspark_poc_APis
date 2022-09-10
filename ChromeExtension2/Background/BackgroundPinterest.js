Environment.AddInstalledListener(function () {
    Storage.SetStorage('PinterestScrape', {
        pinterestAccountID: null,
        pinterestAccountName: null,
        pinterestAccountUsername: null
    });
});

let fetchPIContacts = {};
let contactFetchPIAccountID = null;

function onMessagePinterest(request, sender, sendResponse) {
    Log_WriteInfo('backgroundPinterest got request: ' + request.type);
   
    if (request.type == 'getAccountInfo') {
        Storage.GetStorage('PinterestScrape', ['pinterestAccountID', 'pinterestAccountName', 'pinterestAccountUsername'], function (data) {
            sendResponse({ 
                id: data.pinterestAccountID, 
                name: data.pinterestAccountName,
                username: data.pinterestAccountUsername
            });
        });
    }
    else if (request.type == 'setAccountInfo') {
        Storage.SetStorage('PinterestScrape',
            {
                pinterestAccountID: request.id,
                pinterestAccountName: request.name,
                pinterestAccountUsername: request.username,
            },
            function () { sendResponse(); }
        );
    }
    else if (request.type == 'setMessages') {
        setServerState('PinterestScrape', request.accountID, request.currentCheck, request.syncData, request.messages)
            .then(resp => {
                // DRL FIXIT? With Pinterest we get all the messages in one chunk, so when we send
                // them to the server that's the end of our run.
                releaseSyncControl(sender.tab.id, 'PinterestScrape');
                sendResponse(false);
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse(false);
            });
    }
    else if (request.type == 'setPostId') {
        setServerState('PinterestScrape', request.accountID, null, null,
           [{'MessageID': request.postID, 'ExternalMessageID': request.externalPostID, 'From': request.from}])
            .then(resp => {
                sendResponse();
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setMessageId') {
        setServerState('PinterestScrape', request.accountID, null, null,
           [{'MessageID': request.messageID, 'ExternalMessageID': request.externalMessageID, 'From': request.from}])
            .then(resp => {
                sendResponse();
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'getAction') {
        if (!getSyncControl(sender.tab.id, 'PinterestScrape')) {
            sendResponse({action: null});
            return;
        }
   
        // retrieving contacts doesn't require any server intervention or account information
        // so we handle it here
        if (initiateContactFetch(sender, 'PinterestScrape', contactFetchPIAccountID, fetchPIContacts,
            'https://www.pinterest.com/{contact_id}/_created', sendResponse)) {
            return;
        }
   
        let url = 'https://www.pinterest.com';
        if (!fuzzyUrlsMatch(sender.url, url)) {
            Tabs.SetTabUrl(sender.tab.id, url);
            return;
        }
   
        getServerState('PinterestScrape', request.accountID, request.accountName)
            .then(resp => {
                if (resp == null) {
                    releaseSyncControl(sender.tab.id, 'PinterestScrape');
                    sendResponse({action: null});
                    return;
                }

                var lastSynced = resp.LastSynced;
                if (lastSynced != null)
                    lastSynced = stringToTimestamp(lastSynced);
              
                if (UserHasFeature(UserFeaturesSyncMessages) && resp.messages.length > 0) {
                    let message = resp.messages[0];
  
                    if (message.Type == 'pint_post') {
                       sendResponse({
                          action: 'makePost',
                          post: message });
                       return;
                    }
                    else if (message.Type == 'pint_msg') {
                       sendResponse({
                          action: 'sendMessage',
                          message: message
                       });
                       return;
                    }
                    else {
                        Log_WriteError("Unexpected Pinterest message type " + message.Type);
                    }
                }
   
                contactFetchPIAccountID = resp.AccountID;
                if (parseContactFetches(resp.commands, fetchPIContacts, sendResponse))
                    return;

                let now = Date.now();
                if (UserHasFeature(UserFeaturesSyncMessages) &&
                    // it's time to scrape again
                    now - lastSynced >= timings.MESSAGES_SCRAPE_DELAY * 1000) {
                    sendResponse({
                        action: 'getMessages',
                        lastCheck: lastSynced,
                        lastMessageIds: resp.SyncData
                    });
                    return;
                }
   
   
               setServerState('PinterestScrape', request.accountID, now)
                   .then(resp => {
                       releaseSyncControl(sender.tab.id, 'PinterestScrape');
                       sendResponse({action: null});
                   })
                   .catch(e => {
                       Log_WriteException(e, request.type);
                       releaseSyncControl(sender.tab.id, 'PinterestScrape');
                       sendResponse({action: null});
                   });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                releaseSyncControl(sender.tab.id, 'PinterestScrape');
                sendResponse({action: null});
            });
    }
    else {
       Log_WriteError("Got unrecognized request:\n" + GetVariableAsString(request));
    }
}