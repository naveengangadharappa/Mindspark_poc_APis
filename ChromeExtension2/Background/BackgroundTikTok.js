Environment.AddInstalledListener(function () {
    Storage.SetStorage('TikTokScrape', {
        tiktokAccountID: null,
        tiktokAccountName: null,
        tiktokCheckLastId: null
    });
});

let fetchTTContacts = {};
let contactFetchTTAccountID = null;
let lastTikTokUrl = null;

function onMessageTikTok(request, sender, sendResponse) {
    let now = Date.now();
    Log_WriteInfo('backgroundTikTok got request: ' + request.type);
    
    if (request.type == 'getAccountInfo') {
        Storage.GetStorage('TikTokScrape', ['tiktokAccountID', 'tiktokAccountName'], function (data) {
            sendResponse({ 
                id: data.tiktokAccountID, 
                name: data.tiktokAccountName,
            });
        });
    }
    else if (request.type == 'setAccountInfo') {
        Storage.SetStorage('TikTokScrape',
            {
                tiktokAccountID: request.id,
                tiktokAccountName: request.name,
                tiktokCheckLastId: null
            },
            function () { sendResponse(); }
        );
    }
    else if (request.type == 'setChats') {
        getServerState('TikTokScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse();
                    return;
                }

                let syncData = resp.SyncData;
                if (syncData && syncData.indexOf('conversationsLeft') != -1)
                    syncData = Json_FromString(syncData);
                else // first initialization or update legacy format
                    syncData = {
                        messages: {
                            lastSynced: getLatestSyncTimestamp(),
                            currentSync: null,
                            conversationsLeft: [],
                            conversationCursor: null
                        },
                    };

                syncData.messages.currentSync = request.currentCheck;
                syncData.messages.conversationsLeft = request.chats;
                syncData.messages.conversationCursor = null;

                let lastCheck = null;
                if (syncData.messages.conversationsLeft.length == 0) {
                    // no conversations, finished this pass
                    lastCheck = Date.now();
                    syncData.messages.lastSynced = syncData.messages.currentSync;
                    syncData.messages.currentSync = null;
                }
   
                assert(typeof syncData !== 'string'); // must not already be encoded
                syncData = Json_ToString(syncData);

                setServerState('TikTokScrape', request.accountID, lastCheck, syncData, null)
                    .then(resp => {
                        sendResponse();
                    })
                    .catch(e => {
                        Log_WriteException(e, request.type);
                        sendResponse();
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setMessages') {
        getServerState('TikTokScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse(false);
                    return;
                }

                let syncData = resp.SyncData;
                assert(syncData && syncData.indexOf('conversationsLeft') != -1);
                syncData = Json_FromString(syncData);

                startingLongRunningOperation('TikTokScrape');  // processing messages will take a while
   
// DRL FIXIT! Dominique, in my case the conversationsLeft contains "@socialattache" and the URL
// is "https://www.tiktok.com/messages/?lang=en&u=6804232433502241798" which I believe is the
// expected state when the messages have been parsed so this check does not seem correct?
/*                if (syncData.messages.conversationsLeft.length && sender.url != syncData.messages.conversationsLeft[0]) {
                    // saw this happen but not sure the circumstances, we need to retry this conversation I think
                    Log_WriteError('Conversation URL ' + sender.url+ ' doesn\'t match expected ' +
                        syncData.messages.conversationsLeft[0] + ', will try again');
                }
                else*/ if (request.cursor == null) {
                    // we've retrieved all new messages for this conversation so we can remove it from the list to check
                    syncData.messages.conversationsLeft.shift();
                    syncData.messages.conversationCursor = null;
                }
                else {
                    // we still have more messages to get from this conversation
                    syncData.messages.conversationCursor = request.cursor;
                }
   
                let hasMoreMessages = request.cursor != null;
                let lastCheck = null;
                if (request.cursor == null && syncData.messages.conversationsLeft.length == 0) {
                    // finished this pass
                    lastCheck = Date.now();
                    syncData.messages.lastSynced = syncData.messages.currentSync;
                    syncData.messages.currentSync = null;
                }
   
                assert(typeof syncData !== 'string'); // must not already be encoded
                syncData = Json_ToString(syncData);

                setServerState('TikTokScrape', request.accountID, lastCheck, syncData, request.messages)
                    .then(resp => {
                        finishedLongRunningOperation('TikTokScrape');
   
                        // if we have been scraping for too long this is a good time to break out
                        if (getSyncControlDuration('TikTokScrape') > timings.SYNC_MAX_SCRAPE_TIME) {
                            releaseSyncControl(sender.tab.id, 'TikTokScrape');
                        }
   
                        sendResponse(hasMoreMessages);
                    })
                    .catch(e => {
                        Log_WriteException(e, request.type);
                        finishedLongRunningOperation('TikTokScrape');
                        sendResponse(false);
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                finishedLongRunningOperation('TikTokScrape');
                sendResponse(false);
            });
    }
    else if (request.type == 'setPostId') {
        if (request.externalPostID === NO_EXTERNAL_ID) {
            Storage.GetStorage('TikTokScrape', 'tiktokCheckLastId', function (data) {
                assert(data.tiktokCheckLastId == null);
                Storage.SetStorage('TikTokScrape', { tiktokCheckLastId: request.postID}, function () {
                    Tabs.SetTabUrl(sender.tab.id, 'https://www.tiktok.com/@' + request.accountID);
                    lastTikTokUrl = 'https://www.tiktok.com/@' + request.accountID;
                });
            });
        }
        else {
            setServerState('TikTokScrape', request.accountID, null, null,
               [{'MessageID': request.postID, 'ExternalMessageID': request.externalPostID, 'From': request.from}])
                .then(resp => {
                    Storage.GetStorage('TikTokScrape', 'tiktokCheckLastId', function (data) {
                        assert(data.tiktokCheckLastId == null || data.tiktokCheckLastId == request.postID);
                        Storage.SetStorage('TikTokScrape', { tiktokCheckLastId: null }, function () {
                            sendResponse();
                        });
                    });
                })
                .catch(e => {
                    Log_WriteException(e, request.type);
                    sendResponse();
                });
        }
    }
    else if (request.type == 'setMessageId') {
        setServerState('TikTokScrape', request.accountID, null, null,
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
        console.log('getAction')

        let baseUrl = 'https://www.tiktok.com';

        if (!getSyncControl(sender.tab.id, 'TikTokScrape')) {
            sendResponse({action: null});
            return;
        }
    
        // retrieving contacts doesn't require any server intervention or account information
        // so we handle it here
        if (initiateContactFetch(sender, 'TikTokScrape', contactFetchTTAccountID, fetchTTContacts,
           'https://www.tiktok.com/@{contact_id}', sendResponse)) {
            return;
        }
    
        Storage.GetStorage('TikTokScrape', ['tiktokCheckLastId'], function (data) {
            console.log('Actions')
            getServerState('TikTokScrape', request.accountID, request.accountName)
                .then(resp => {
                    if (resp == null) {
                        releaseSyncControl(sender.tab.id, 'TikTokScrape');
                        sendResponse({action: null});
                        return;
                    }


                    if (resp.messages.length > 0) {
                        let post = resp.messages[0];

                        if (data.tiktokCheckLastId) {
                            let url = "https://www.tiktok.com/@" + request.accountID;
                            if (fuzzyUrlsMatch(sender.url, url)) {
                                assert(data.tiktokCheckLastId == post.Uid);
                                sendResponse({action: 'checkLastId', post: post});
                            } else {
                                Tabs.SetTabUrl(sender.tab.id, url);
                                lastTikTokUrl = 'https://www.tiktok.com/@' + request.accountID;
                            }
                        } else if (post.Type == 'tt_post') {
                            let url = 'https://www.tiktok.com/upload';
                            if (fuzzyUrlsMatch(sender.url, url)) {
                                sendResponse({action: 'makePost', post: post});
                            } else {
                                Tabs.SetTabUrl(sender.tab.id, url);
                                lastTikTokUrl = url;
                            }
                        } else if (post.Type == 'tt_msg') {
                            try {
                                // First check if the tab is the username homepage https://www.tiktok.com/@messageToThisUsername
                                // if is not will send to that page and request actions redirectToUserMessagesPage
                                // check if the lastTikTokUrl was https://www.tiktok.com/@messageToThisUsername and if this url is a messaging page
                                // then execute sendMessage
                                let toParts = post.To[0].split(/(<|>|@)/g);
                                let url = 'https://www.tiktok.com/@' + toParts[2];
                                let senderUrl = sender.url;

                                //Is checking if is on the 'https://www.tiktok.com/@messageToThisUsername' already and if is not a step ahead
                                if ((!senderUrl.includes(toParts[2]) && !senderUrl.includes('u=') && !senderUrl.includes('messages')) || !lastTikTokUrl) {
                                    Log_WriteInfo('Action(tt_msg): Opening the url on tab ' + sender.tab.id)
                                    Tabs.SetTabUrl(sender.tab.id, url);
                                    lastTikTokUrl = url;
                                } else
                                    //Is checking if is on the 'https://www.tiktok.com/@messageToThisUsername' and if is asking to redirect to the messaging page
                                if (senderUrl.includes(toParts[2]) && !senderUrl.includes('u=') && !senderUrl.includes('messages')) {
                                    Log_WriteInfo('Action(tt_msg): Sending res -> redirectToUserMessagingFromProfilePage')
                                    showSyncWindowAndTab(sender.tab.id, 2, constants.MINIMUM_TAB_WIDTH)
                                    sendResponse({action: 'redirectToUserMessagingFromProfilePage', post: post});
                                } else
                                    // Is checking if the last page was the https://www.tiktok.com/@messageToThisUsername and if is in the tiktok messages/?u=
                                if (lastTikTokUrl != null && lastTikTokUrl.includes('@' + toParts[2]) && (senderUrl.includes('u=')) && senderUrl.includes('messages')) {
                                    Log_WriteInfo('Action(tt_msg): Sending res -> sendMessage')
                                    showSyncWindowAndTab(sender.tab.id, 5, constants.MINIMUM_TAB_WIDTH)
                                    sendResponse({action: 'sendMessage', post: post});
                                }


                            } catch (e) {
                                console.log(e)
                            }
                        }

                        return;
                    }

                    contactFetchTTAccountID = resp.AccountID;
                    if (parseContactFetches(resp.commands, fetchTTContacts, sendResponse))
                        return;

                    //Sync Data
                    let syncData = resp.SyncData;
                    if (syncData && syncData.indexOf('conversationsLeft') != -1)
                        syncData = Json_FromString(syncData);
                    else // first initialization or update legacy format
                        syncData = {
                            messages: {
                                lastSynced: getLatestSyncTimestamp(),
                                currentSync: null,
                                conversationsLeft: [],
                                conversationCursor: null
                            },
                        };

                    let lastSynced = syncData.messages.lastSynced;
                    now = Date.now();
                    //End of Sync Data

                    if (UserHasFeature(UserFeaturesSyncMessages) &&
                        // it's time to scrape again
                        now - lastSynced >= timings.MESSAGES_SCRAPE_DELAY * 1000) {
                        if (syncData.messages.currentSync == null) {
                            // Start of new sync

                            if (sender.url.startsWith(baseUrl + '/messages/')) {
                                sendResponse({ action: 'getChats', lastCheck: syncData.messages.lastSynced });
                            }
                            else {
                                let url = baseUrl + '/messages/';
                                Tabs.SetTabUrl(sender.tab.id, url);
                                lastTikTokUrl = url;
                            }
                        }
                        else {
                            let username = syncData.messages.conversationsLeft[0];
                            let url = 'https://www.tiktok.com/'+username
                            if (sender.url.includes('messages') && sender.url.includes('u=')) {
                                // continue where we left off

                                let lastSynced = syncData.messages.lastSynced;
                                let cursor = syncData.messages.conversationCursor;
                                sendResponse({action: 'getMessages', lastCheck: cursor ? cursor : lastSynced,
                                    currentCheck: syncData.messages.currentSync});
                                lastTikTokUrl = null;
                            }else if(lastTikTokUrl == url && !sender.url.includes('messages')){
                                sendResponse({action: 'redirectToUserMessagingFromProfilePage'});
                            }
                            else if (lastTikTokUrl != url) {
                                Tabs.SetTabUrl(sender.tab.id, url);
                                lastTikTokUrl = url;
                            }
                            else {
                                // the conversation has been removed, skip it

                                Log_WriteError('Skipping conversation as the URL is bad: ' + url);
                                sendResponse({action: 'skipConversation', currentCheck: syncData.messages.currentSync});
                            }
                        }
                        return;
                    }


                    setServerState('TikTokScrape', request.accountID, Date.now())
                        .then(resp => {
                            releaseSyncControl(sender.tab.id, 'TikTokScrape');
                            sendResponse({action: null});
                        })
                        .catch(e => {
                            Log_WriteException(e, request.type);
                            releaseSyncControl(sender.tab.id, 'TikTokScrape');
                            sendResponse({action: null});
                        });
                })
                .catch(e => {
                    Log_WriteException(e, request.type);
                    releaseSyncControl(sender.tab.id, 'TikTokScrape');
                    sendResponse({action: null});
                });
        });
    }
    else {
        Log_WriteError("Got unrecognized request:\n" + GetVariableAsString(request));
    }
}