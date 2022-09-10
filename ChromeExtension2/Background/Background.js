Log_SetGroupName('ChromeExtension');
Log_SetPrefix('background');

Environment.AddDisplayMainMenuListener(function(tab) {
    let isLoggedIn = isSocialAttacheLoggedIn() ? 'true' : 'false';
    Tabs.ExecuteScriptInTab(tab.id, "displayMainMenu(" + isLoggedIn + ");");
});

Log_WriteInfo("XXX Background.js");
Messaging.ListenNativeAppMessages();
Messaging.AddBackgroundMessageListener(function (request, sender, sendResponse) {
    if (request.type == 'logging') {
        Log_Write(request.severity, request.msg);
        sendResponse();
        return; // don't log the logging
    }
    else if (request.type == 'getTabID') {
        sendResponse(sender.tab.id);
        return; // don't count this as activity
    }
    
    Log_WriteInfo('Tab ' + getTabNameNoCheck(sender.tab.id) + ' sent request: ' + request.type);
    
    // NOTE: skip cases where the tab isn't scraping yet in case it gets stuck after the setup
    if (request.type != 'getCookies' && request.type != 'initTab' && request.type != 'checkSocialAttacheLogin')
        updateTabActivity(sender.tab.id);
    
    if (request.type == 'getAction') {
        // if the tab has a queued action we return it first
        let nextAction = popTabNextAction(sender.tab.id);
        if (nextAction != null) {
            sendResponse(nextAction);
            return true;
        }
        if (getTabName(sender.tab.id) == null) {
            // augmentation script has no other code below so just return no action
            sendResponse({action: null});
            return true;
        }
    }
    
    if (request.type == 'ping') {
        // updateTabActivity() already called above
        sendResponse();
    }
    else if (request.type == 'throttled')
    {
        pauseSyncFor(sender.tab.id, request.dataName, request.delay);
        sendResponse({action: null});
    }
    else if (request.type == 'getCookies') {
        sendResponse(GetCookies());
    }
    else if (request.type == 'getBrandInfos') {
        getBrandNames()
           .then(resp => sendResponse({brandNames: resp, brandID: getBrandID()}))
           .catch(error => {
               Log_WriteError("Error handling getBrandNames(): " + error);
               sendResponse(null);
           });
    }
    else if (request.type == 'getBrandID') {
        sendResponse(getBrandID());
    }
    else if (request.type == 'setBrandID') {
        setBrandID(request.brandID);
        sendResponse();
    }
    else if (request.type == 'isBrowserTabIdle') {
        Tabs.IsTabIdle(sender.tab.id, function (isIdle) {
            sendResponse(isIdle);
        });
    }
    else if (request.type == 'initTab') {
        initTab(sender.tab.id, request.syncDataName)
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling initTab(): " + error);
                sendResponse(null);
            });
    }
    else if (request.type == 'showSyncWindowAndTab') {
        sendResponse(showSyncWindowAndTab(sender.tab.id, request.focusedSecondsOrBool));
    }
    else if (request.type == 'checkSocialAttacheLogin') {
        checkSocialAttacheLogin()
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling checkSocialAttacheLogin(): " + error);
                sendResponse(false);
            });
    }
    else if (request.type == 'checkDataSource') {
        checkDataSource(request.sourceName)
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling checkDataSource(): " + error);
                sendResponse(false);
            });
    }
    else if (request.type == 'linkDataSource') {
        linkDataSource(request.sourceName)
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling linkDataSource(): " + error);
                sendResponse(false);
            });
    }
    else if (request.type == 'getAccountId') {
        getSyncAccountID(request.dataName)
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling getAccountId(): " + error);
                sendResponse(null);
            });
    }
    else if (request.type == 'getContactInfos') {
        getContactInfos(request.protocol)
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling getContactInfos(" + request.protocol + "): " + error);
                sendResponse(null);
            });
    }
    else if (request.type == 'reloadContactInfo') {
        reloadContactInfo(request.contactID);
        sendResponse();
    }
    else if (request.type == 'reloadSearchFilters') {
        reloadSearchFilters();
        sendResponse();
    }
    else if (request.type == 'getContactTags') {
        getContactTags()
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling getContactTags(): " + error);
                sendResponse(null);
            });
    }
    else if (request.type == 'getGroupInfos') {
        getGroupInfos()
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling getGroupInfos(): " + error);
                sendResponse(null);
            });
    }
    else if (request.type == 'getSearchFilterNames') {
        getSearchFilterNames()
           .then(resp => sendResponse(resp))
           .catch(error => {
               Log_WriteError("Error handling getSearchFilterNames(): " + error);
               sendResponse(null);
           });
    }
    else if (request.type == 'getSearchFilter') {
        getSearchFilter(request.filterID)
           .then(resp => sendResponse(resp))
           .catch(error => {
               Log_WriteError("Error handling getSearchFilter(): " + error);
               sendResponse(null);
           });
    }
    else if (request.type == 'getHelpItems') {
        getHelpItems()
            .then(resp => sendResponse(resp))
            .catch(error => {
                Log_WriteError("Error handling getHelpItems(): " + error);
                sendResponse(null);
            });
    }
    else if (request.type == 'markHelpItemRead') {
        markHelpItemRead(request.path)
            .then(resp => sendResponse())
            .catch(error => {
                Log_WriteError("Error handling markHelpItemRead(): " + error);
                sendResponse();
            });
    }
    else if (request.type == 'setServerState') {
        setServerState(request.dataName, request.accountID, request.currentCheck, request.syncData, request.messages, request.contact, request.command)
            .then(resp => sendResponse(true))
            .catch(error => {
                Log_WriteError("Error handling setServerState(): " + error);
                sendResponse(false);
            });
    }
    else if (request.type == 'scraperException') {
        // if the client had an exception we will release sync control (if he had it) in order to
        // allow other syncs to process so this one doesn't hold things up in an endless exception loop
        Log_WriteInfo('Releasing sync control due to ' + request.dataName + ' exception');
        releaseSyncControl(sender.tab.id, request.dataName);
        sendResponse();
    }
    else if (request.type == 'savePost') {
        if (Form_RootUri == null) {
            sendResponse({
                status: 'success',
                data: {Name: request.post.Name}
            });
            return true;
        }
    
        let replaceValues = {
            'content_Name': {
                'Type': 'string',
                'Value': {'en-US': request.post.Name}
            },
            'content_Body': {
                'Type': request.post.Type,
                'Value': {'en-US': request.post.Body}
            },
            'content_Attachments': {
                'Type': 'resource[]',
                'Value': {'en-US': request.post.Attachments}
            },
            'content_Buttons': {
                'Type': 'button[]',
                'Value': {'en-US': request.post.Buttons}
            }
        };

        ajax.post(
           Form_RootUri + '/v2/Posts/Folders/Uploads',
           {
               'ReplaceValues': Json_ToString(replaceValues),
               'Fields': 'Name' // we want these in the response
           },
           function(data, httpCode) {
               if (data == null || httpCode == 0) {
                   sendResponse({
                       status: 'error',
                       message: Str('The server is not available, please try again later.')
                   });
                   return;
               }
               data = JSON.parse(data);
               sendResponse(data);
           }
        );
    }
    else if (request.type == 'getBlob') {
        fetch(request.url)
           .then(response => response.blob())
           .then(data => {
               let reader = new FileReader();
               reader.addEventListener("load", function () {
                   sendResponse(reader.result);
               }, false);
               reader.readAsDataURL(data);
           })
           .catch(error => {
               Log_WriteError("Error getting blob \"" + request.url + "\": " + error);
               sendResponse();
           });
    }
    else if (request.type == 'getFinalUrl') {
        getFinalUrl(request.url)
            .then(response => {
                sendResponse(response);
            })
            .catch(error => {
                Log_WriteError("Error getting final url \"" + request.url + "\": " + error);
                sendResponse(request.url);
            });
    }
    else if (request.type == 'userTryingBranding') {
        userTryingBranding();
        sendResponse();
    }
    else if (request.type == 'userTryingLogin') {
        userTryingLogin();
        sendResponse();
    }
    else if (request.type == 'userRefusedLogin') {
        userRefusedLogin();
        sendResponse();
    }
    else if (request.type == 'linkDataSourceRefused') {
        linkDataSourceRefused(request.sourceName);
        sendResponse();
    }
    else if (request.type == 'createTab') {
        _massageQueueItems(sender.tab.id, request.queuedActions);
        _processClientRequestParameters(sender, request.params)
           .then(params => {
               createTab(request.tabName, request.method, request.url, params, request.forScraping, false, request.queuedActions)
                  .then(tabID => {
                      sendResponse(tabID);
                  })
                  .catch(error => {
                      Log_WriteError("Error opening tab \"" + request.tabName + "\": " + error);
                      sendResponse(null);
                  });
           })
           .catch(error => {
               Log_WriteError("Error parsing params for opening tab \"" + request.tabName + "\": " + error);
               sendResponse(null);
           });
    }
    else if (request.type == 'removeTab') {
        Tabs.RemoveTab(sender.tab.id, function() {
            sendResponse(null);
        });
    }
    else if (request.type == 'pushAction') {
        // the action is the JSON object to be returned by getAction later
        _massageQueueItem(sender.tab.id, request.action);
        sendResponse(pushTabNextAction(request.tabID ? request.tabID : sender.tab.id, request.action));
    }
    else if (request.type == 'GET' || request.type == 'HEAD' || request.type == 'POST') {
        // I had issues with CORS when making some requests from the front end content scripts so I instead
        // make them from the background script and send them through our proxy, unless it's for our API.
        let proxyUrl = request.url;
        if (Form_RootUri != null && Url_GetDomain(proxyUrl).toLowerCase() != Url_GetDomain(Form_RootUri).toLowerCase())
            proxyUrl = Form_RootUri + '/v2/Proxy?url=' + encodeURIComponent(proxyUrl);
    
        if (request.type == 'GET')
            ajax.get(proxyUrl, request.params, function(data, httpCode, headers) {
                sendResponse({data: data, httpCode: httpCode, headers: headers});
            }, true, request.timeout);
        else if (request.type == 'HEAD')
            ajax.head(proxyUrl, request.params, function(data, httpCode, headers) {
                sendResponse({data: data, httpCode: httpCode, headers: headers});
            }, true, request.timeout);
        else if (request.type == 'POST')
            ajax.post(proxyUrl, request.params, function(data, httpCode, headers) {
                sendResponse({data: data, httpCode: httpCode, headers: headers});
            }, true, request.timeout);
        else
            assert(0);
    }
    else {
        let syncDataName = getTabName(sender.tab.id);
        
        if (syncDataName == 'FacebookScrape') {
            onMessageFacebook(request, sender, sendResponse);
        }
        else if (syncDataName == 'InstagramScrape') {
            onMessageInstagram(request, sender, sendResponse);
        }
        else if (syncDataName == 'PinterestScrape') {
            onMessagePinterest(request, sender, sendResponse);
        }
        else if (syncDataName == 'TikTokScrape') {
            onMessageTikTok(request, sender, sendResponse);
        }
        else if (syncDataName == 'TwitterScrape') {
            onMessageTwitter(request, sender, sendResponse);
        }
        else {
            // since we got a message from a content script we do not recognize, the scenario is likely
            // that somehow the tab didn't get added to the TabManager properly so what we'll do is
            // remove the tab and hopefully it's a scraper tab and will get recreated properly
            Log_WriteError("Unrecognized data name \"" + syncDataName + "\" for tab " + getTabNameNoCheck(sender.tab.id) + ", removing tab!");
            removeTab(sender.tab.id);
            sendResponse();
        }
    }
    return true;    // this tells the caller that we want to use the sendResponse() mechanism later
});

// these methods are a bit of a hack but the avoid a round trip from the content script to request its tab ID
function _massageQueueItem(tabID, item) {
    if (item && item.hasOwnProperty('originalTabID') && item.originalTabID == BACKGROUND_PROVIDED_TAB_ID)
        item.originalTabID = tabID;
}
function _massageQueueItems(tabID, queueItems) {
    if (queueItems == null)
        return;
    for (let item of queueItems) {
        _massageQueueItem(tabID, item);
    }
}
async function _captureTab(windowID) {
    return new Promise((resolve, reject) =>
    {
        Tabs.CaptureWindow(windowID, function(data) {
            resolve(data);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}
async function _processClientRequestParameters(sender, params) {
    for (let name in params) {
        if (params[name] == '%TAB_CAPTURE%') {
            params[name] = await _captureTab(sender.tab.windowId);
        }
        else if (params[name] == '%LOG_FILE%') {
            params[name] = Log_GetLogFile();
        }
    }
    return params;
}
