Environment.AddInstalledListener(function () {
    Storage.SetStorage('InstagramScrape', {
        igAccounts: {},
        igLastAccountsCheck: null
    });
});

function getOldestCheckedAccount(accounts) {
    let result = null;
   
    for (let accountID in accounts) {
        // DRL FIXIT! This was added to track down a bug, remove once it no longer goes off.
        if (!Utilities_IsInteger(accounts[accountID].lastCheck)) {
            Log_WriteError('Found string lastCheck instead of timestamp for account ' + accountID);
            accounts[accountID].lastCheck = 0;
        }
        if (result == null || accounts[accountID].lastCheck < result.lastCheck) {
            result = accounts[accountID];
        }
    }
    
    return result;
}

let fetchIGContacts = {};
let contactFetchIGAccountID = null;

function onMessageInstagram(request, sender, sendResponse) {
    Log_WriteInfo('backgroundInstagram got request: ' + request.type);
    
    if (request.type == 'setAccounts') {
        Storage.GetStorage('InstagramScrape', ['igAccounts'], function (data) {
            for (let accountID of request.accounts) {
                if (!data.igAccounts.hasOwnProperty(accountID)) {
                    data.igAccounts[accountID] = {
                        accountID: accountID,
                        accountName: null,
                        checkedChats: [],
                        syncData: null,    // this is JSON encoded: {recipient: {timestamp: 0, messageCount: 0}}
                        lastCheck: 0,
                        currentTab: PRIMARY_TAB
                    };
                }
            }
            data.igLastAccountsCheck = Date.now();
            Storage.SetStorage('InstagramScrape', {
                   igAccounts: data.igAccounts,
                   igLastAccountsCheck: data.igLastAccountsCheck
                },
                function () { sendResponse(); }
            );
        });
    }
    else if (request.type == 'setAccountInfo') {
        Storage.GetStorage('InstagramScrape', ['igAccounts'], function (data) {
            if (!data.igAccounts.hasOwnProperty(request.id)) {
                assert(0); // the account should have already been added
                sendResponse(null);
                return;
            }
      
            data.igAccounts[request.id].accountName = request.name;
            Storage.SetStorage('InstagramScrape', {
                    igAccounts: data.igAccounts
                },
                function () { sendResponse(); }
            );
        });
    }
    else if (request.type == 'getAction') {
        if (!getSyncControl(sender.tab.id, 'InstagramScrape')) {
            sendResponse({action: null});
            return;
        }
    
        if (fuzzyUrlsMatch(sender.url, 'https://www.instagram.com/challenge')) {
            // Instagram has flagged the account!
            // Let's remove the tab and it'll be recreated once the user resolves the issue and revisits IG.
            removeTab(sender.tab.id);
            return;
        }
   
        // retrieving contacts doesn't require any server intervention or account information
        // so we handle it here
        if (initiateContactFetch(sender, 'InstagramScrape', contactFetchIGAccountID, fetchIGContacts,
            'https://www.instagram.com/{contact_id}', sendResponse)) {
            return;
        }
    
        Storage.GetStorage('InstagramScrape', ['igAccounts', 'igLastAccountsCheck'], function (data) {
            // if we have any known accounts waiting for info let's request it, and do it from the inbox
            for (let accountID in data.igAccounts) {
                if (data.igAccounts[accountID].accountName == null) {
                    let url = "https://www.instagram.com/direct/inbox";
                    if (fuzzyUrlsMatch(sender.url, url)) {
                        sendResponse({action: 'getAccountInfo', accountID: accountID});
                    }
                    else {
                        Tabs.SetTabUrl(sender.tab.id, url);
                    }
                    return;
                }
            }
   
            // if it's been a while since we've checked for new accounts let's do that
            let now = Date.now();
            if (data.igLastAccountsCheck == null || now - data.igLastAccountsCheck > SecondsPerMinute * 20 * 1000) {
                let url = "https://www.instagram.com/direct/inbox";
                if (fuzzyUrlsMatch(sender.url, url)) {
                    sendResponse({action: 'getAccounts'});
                }
                else {
                    Tabs.SetTabUrl(sender.tab.id, url);
                }
                return;
            }
    
            let account = getOldestCheckedAccount(data.igAccounts);
            if (account == null) {
                releaseSyncControl(sender.tab.id, 'InstagramScrape');
                sendResponse({action: null});
                return;
            }
    
            getServerState('InstagramScrape', account.accountID, account.accountName)
                .then(resp => {
                    if (resp == null) {
                        // if there's an error or the account hasn't been added yet we want to go to
                        // the next account instead of staying stuck on this one
                        data.igAccounts[account.accountID].lastCheck = now;
                        Storage.SetStorage('InstagramScrape', { igAccounts: data.igAccounts },
                            function () {
                                releaseSyncControl(sender.tab.id, 'InstagramScrape');
                                sendResponse({action: null});
                            }
                        );
                        return;
                    }
    
                    if (UserHasFeature(UserFeaturesSyncMessages) && resp.messages.length > 0) {
                        // we only process the first message, and we'll get any other messages on the next request
                        let message = resp.messages[0];
    
                        if (message.Type == 'ig_msg') {
                            let url = "https://www.instagram.com/direct/inbox";
                            if (fuzzyUrlsMatch(sender.url, url)) {
                                sendResponse({action: 'sendMessage', accountID: account.accountID, message: message});
                            }
                            else {
                                Tabs.SetTabUrl(sender.tab.id, url);
                            }
                            return;
                        }
                        else if (message.Type == 'ig_post') {
                            let url = "https://business.facebook.com/creatorstudio";
                            if (fuzzyUrlStartsWith(sender.url, url)) {
                                sendResponse({action: 'makePost', accountID: account.accountID, accountName: account.accountName, post: message});
                            }
                            else {
                                Tabs.SetTabUrl(sender.tab.id, url);
                            }
                            return;
                        }
                        else {
                           Log_WriteError("Unexpected Instagram message type " + message.Type);
                        }
                    }
    
                    contactFetchIGAccountID = resp.AccountID;
                    if (parseContactFetches(resp.commands, fetchIGContacts, sendResponse))
                        return;
    
// DRL In our processing here we want to use the latest value so that we cycle through the accounts otherwise we'll
// stick to the same account, and also I think it's best to use the server value here?
//                    if (account.syncData == null) {
//                        // we are a new browser extension instance so get the state from the server
                        account.syncData = resp.SyncData;
//                    }
   
                    data.igAccounts[account.accountID] = account;
    
                    Storage.SetStorage('InstagramScrape', {
                        igAccounts: data.igAccounts
                    },
                    function () {
                        var lastSynced = resp.LastSynced;
                        if (lastSynced != null)
                            lastSynced = stringToTimestamp(lastSynced);
    
                        if (UserHasFeature(UserFeaturesSyncMessages) &&
                            // it's time to scrape again
                            now - lastSynced >= timings.MESSAGES_SCRAPE_DELAY * 1000) {
                            let url = null;
                            let urlNot = null;
                            if (account.currentTab == PRIMARY_TAB) {
                                url = 'https://www.instagram.com/direct/inbox/';
                                urlNot = 'https://www.instagram.com/direct/inbox/general/';
                            }
                            else {
                                url = 'https://www.instagram.com/direct/inbox/general/';
                            }
                            if (fuzzyUrlStartsWith(sender.url, url) &&
                                (urlNot == null || !fuzzyUrlStartsWith(sender.url, urlNot))) {
                                sendResponse({
                                    action: 'getNextChat',
                                    accountID: account.accountID,
                                    checkedChats: account.checkedChats,
                                    syncData: account.syncData,
                                    currentTab: account.currentTab
                                });
                            }
                            else {
                                Tabs.SetTabUrl(sender.tab.id, url);
                            }
                            return;
                        }
    
                        setServerState('InstagramScrape', account.accountID, now)
                           .then(resp => {
                               releaseSyncControl(sender.tab.id, 'InstagramScrape');
                               sendResponse({action: null});
                           })
                           .catch(e => {
                               Log_WriteException(e, request.type);
                               releaseSyncControl(sender.tab.id, 'InstagramScrape');
                               sendResponse({action: null});
                           });
                    });
                })
                .catch(e => {
                    Log_WriteException(e, request.type);
                    releaseSyncControl(sender.tab.id, 'InstagramScrape');
                    sendResponse({action: null});
                });
        });
    }
    else if (request.type == 'setMessageId') {
        setServerState('InstagramScrape', request.accountID, null, null,
           [{'MessageID': request.messageID, 'ExternalMessageID': request.externalMessageID, 'From': request.from}])
            .then(resp => {
                sendResponse();
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setPostId') {
        setServerState('InstagramScrape', request.accountID, null, null,
                [{'MessageID': request.postID, 'ExternalMessageID': request.externalPostID, 'From': request.from}])
            .then(resp => sendResponse())
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'sendConversation') {
        Storage.GetStorage('InstagramScrape', ['igAccounts'], function (data) {
            data.igAccounts[request.accountID].checkedChats = request.checkedChats;
            data.igAccounts[request.accountID].syncData = request.syncData;
           
            Storage.SetStorage('InstagramScrape',
            {
                igAccounts: data.igAccounts
            },
            function () {
               
                // the server just wants a list of messages but we accumulate them per conversation
                let messages = [];
                for (let conversation of request.conversations) {
                    messages = messages.concat(conversation.messages);
                }

                setServerState('InstagramScrape', request.accountID, Date.now(), request.syncData, messages)
                    .then(resp => sendResponse())
                    .catch(e => {
                        Log_WriteException(e, request.type);
                        sendResponse();
                    });
            });
        });
    }
    else if (request.type == 'parsedFinalChat') {
        Storage.GetStorage('InstagramScrape', ['igAccounts'], function (data) {
            // DRL FIXIT? I think we could optimize here to check the general tab less frequently, so that
            // most of the time we're sitting at the primary tab with no need to update the page. Then we
            // only infrequently switch to the general tab requiring a page update.
            data.igAccounts[request.accountID].currentTab =
               data.igAccounts[request.accountID].currentTab == PRIMARY_TAB ? GENERAL_TAB : PRIMARY_TAB;
            data.igAccounts[request.accountID].checkedChats = [];
    
            let now = Date.now();
            
            // let's update the tab URL so it's settled and ready for the next check
            if (data.igAccounts[request.accountID].currentTab == PRIMARY_TAB) {
                // when we get back to the primary tab this indicates we're done with the sync run
                data.igAccounts[request.accountID].lastCheck = now;
                Tabs.SetTabUrl(sender.tab.id, 'https://www.instagram.com/direct/inbox/');
            }
            else {
                Tabs.SetTabUrl(sender.tab.id, 'https://www.instagram.com/direct/inbox/general/');
            }

            Storage.SetStorage('InstagramScrape',
            {
                igAccounts: data.igAccounts
            },
            function () {
                // when we get back to the primary tab this indicates we're done with the sync run
                if (data.igAccounts[request.accountID].currentTab == PRIMARY_TAB)
                {
                    setServerState('InstagramScrape', request.accountID, now)
                        .then(resp => {
                            releaseSyncControl(sender.tab.id, 'InstagramScrape');
                            sendResponse(false);
                        })
                        .catch(e => {
                            Log_WriteException(e, request.type);
                            releaseSyncControl(sender.tab.id, 'InstagramScrape');
                            sendResponse(false);
                        });
                }
                else
                    sendResponse(true);   // more messages to parse
            });
        });
    }
    else {
        Log_WriteError("Got unrecognized request:\n" + GetVariableAsString(request));
    }
}