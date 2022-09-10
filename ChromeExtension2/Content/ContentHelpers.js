let SkinsUrl = Environment.GetAssetUrl('v2/Skins/');
let ImagesUrl = Environment.GetAssetUrl('Images/');

window.addEventListener('message', function(event) {
    if (event.data && event.data.action  == 'ClosePopUp') {
        ClosePopUp();
    }
});

let unloading = false;
window.addEventListener('beforeunload', function (event) {
   unloading = true;
});

function srchPath(scraper, item) {
    if (!elementPaths.hasOwnProperty(scraper) || !elementPaths[scraper].hasOwnProperty(item))
        throw new Error('Missing from Constants.js: elementPaths.' + scraper + '.' + item);
    return elementPaths[scraper][item];
}

function srchPathPG(item) {
    return srchPath('Pages', item);
}

function srchPathFBM(item) {
    return srchPath('FacebookMsgs', item);
}

function srchPathFBP(item) {
    return srchPath('FacebookPosts', item);
}

function srchPathFBGP(item) {
    return srchPath('FacebookGroupPosts', item);
}

function srchPathFBPF(item){
    return srchPath('FacebookProfile', item);
}

function srchPathFBG(item) {
    return srchPath('FacebookGroups', item);
}

function srchPathIGM(item) {
    return srchPath('InstagramMsgs', item);
}

function srchPathIGP(item) {
    return srchPath('InstagramPosts', item);
}

function srchPathPIS(item) {
    return srchPath('PinterestScrape', item);
}

function srchPathTTP(item) {
    return srchPath('TikTokScrape', item);
}

function srchPathTTM(item){
    return srchPath('TikTokMessages', item);
}

function srchPathTWS(item) {
    return srchPath('TwitterScrape', item);
}

function keywordFBP(item) {
    return localizedKeyword('FacebookPosts', item);
}

function keywordFBM(item) {
    return localizedKeyword('FacebookMsgs', item);
}

function keywordFBG(item) {
    return localizedKeyword('FacebookGroups', item);
}

function keywordFBPF(item) {
    return localizedKeyword('FacebookProfiles', item);
}

function keywordIGM(item) {
    return localizedKeyword('InstagramMsgs', item);
}

function keywordPIS(item) {
    return localizedKeyword('PinterestScrape', item);
}

function keywordTWS(item) {
    return localizedKeyword('TwitterScrape', item);
}


let pageLanguage = null;
function getLanguage(){
    pageLanguage = getPageLanguage();
    return getBaseLang(pageLanguage);
}

function getBaseLang(pageLanguage) {
    return pageLanguage.split('-')[0];
}

function getPageLanguage() {
    if (pageLanguage == null) {
        pageLanguage = document.documentElement.lang;
        if (pageLanguage == null || pageLanguage == undefined || pageLanguage == '') {
            pageLanguage = navigator.language || navigator.userLanguage;
            if (pageLanguage == null || pageLanguage == undefined || pageLanguage == '')
            {
                Log_WriteError('Page language and browser language not specified for ' + location.href);
                pageLanguage = 'en-US';
            }
            else
               Log_WriteWarning('Page language not specified for ' + location.href + ' using browser language ' + pageLanguage);
        }
    }
    return pageLanguage;
}

function localizedKeywordItem(item, label) {
    pageLanguage = getPageLanguage();
    
    let baseLang = getBaseLang(pageLanguage);
    
    let lang = null;
    if (item.hasOwnProperty(pageLanguage))
        lang = pageLanguage;
    else if (item.hasOwnProperty(baseLang))
        lang = baseLang;
    else {
        lang = Utilities_ArrayFirstKey(item);
        Log_WriteError(label + ' is missing language ' + pageLanguage);
    }

    return item[lang];
}

function localizedKeyword(scraper, item) {
    if (!localizedKeywords.hasOwnProperty(scraper) || !localizedKeywords[scraper].hasOwnProperty(item))
        throw new Error('Missing from Constants.js: localizedKeywords.' + scraper + '.' + item);
    return localizedKeywordItem(localizedKeywords[scraper][item], 'Scraper ' + scraper + ' keyword "' + item + '"');
}

// NOTE: this method may take up to a minute when the tab is not active, regardless of the seconds requested!
async function sleep(seconds) {
    let startTimeInMs = Date.now();
    let delay = seconds * 1000;
//console.log(DateAndTime_Now().ToFormat('%/D %:T') + ' sleeping for ' + delay + ' ms');
    await new Promise(function(resolve) {
        setTimeout(function() {
            try
            {
                resolve();
            }
            catch (e)
            {
                Log_WriteException(e);
            }
        }, delay)
    })
       .catch(e => { Log_WriteException(e); throw e; });
//console.log(DateAndTime_Now().ToFormat('%/D %:T') + ' finished sleeping');
    let elapsed = Date.now() - startTimeInMs;
    if (elapsed > delay * 1.5) {
        if (elapsed > 65000) // it seems in the background our timers can wait up to a minute regardless of the requested delay!
            Log_WriteWarning('sleep(' + delay + 'ms) took ' + elapsed + 'ms which is far too long!');
        else
            Log_WriteWarning('sleep(' + delay + 'ms) took ' + elapsed + 'ms which is too long!');
    }
}

async function insertText(elem, text) {
    if (text == null || text == '') // the clipboard doesn't copy an empty string so skip this otherwise
        return;                     // we'll paste whatever happened to be on the clipboard
    let oldText = MyClipboard.GetClipboardText();
    MyClipboard.CopyTextToClipboard(text);
    elem.focus();
    if (elem.nodeName == 'INPUT' || elem.nodeName == 'TEXTAREA')
        elem.select();
    document.execCommand('paste');
    await sleep(0.3);
    if (elem.nodeName == 'INPUT' || elem.nodeName == 'TEXTAREA')
        document.getSelection().removeAllRanges();
    if (oldText == null || oldText == '')
       oldText = ' ';   // if we don't have anything to put into the clipboard it fails
    MyClipboard.CopyTextToClipboard(oldText);
}

function pressNonButton(object, options)
{
   var pos = Utilities_GetOffset(object);
   var event = object.ownerDocument.createEvent('MouseEvents'),
      options = options || {},
      opts = { // These are the default values, set up for un-modified left clicks
         type: 'click',
         canBubble: true,
         cancelable: true,
         view: object.ownerDocument.defaultView,
         detail: 1,
         screenX: pos.x, //The coordinates within the entire page
         screenY: pos.y,
         clientX: pos.x, //The coordinates within the viewport
         clientY: pos.y,
         ctrlKey: false,
         altKey: false,
         shiftKey: false,
         metaKey: false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
         button: 0, //0 = left, 1 = middle, 2 = right
         relatedTarget: null,
      };
   
   //Merge the options with the defaults
   for (var key in options) {
      if (options.hasOwnProperty(key)) {
         opts[key] = options[key];
      }
   }
   
   //Pass in the options
   event.initMouseEvent(
      opts.type,
      opts.canBubble,
      opts.cancelable,
      opts.view,
      opts.detail,
      opts.screenX,
      opts.screenY,
      opts.clientX,
      opts.clientY,
      opts.ctrlKey,
      opts.altKey,
      opts.shiftKey,
      opts.metaKey,
      opts.button,
      opts.relatedTarget
   );
   
   //Fire the event
   object.dispatchEvent(event);
}

function dataURItoBlob(dataURI) {
    let byteString = atob(dataURI.split(',')[1]);
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    let blob = new Blob([ab], {type: mimeString});
    return blob;
}


async function uploadAttachment(elem, attach) {
    let startTimeInMs = Date.now();

    let blob = await getImageBlob(attach.URL);
    let ext = attach.Type.split('/')[1];
    let mimetype = attach.Type;
    let file = new File([blob], 'file.' + ext, {type: mimetype});
    let list = new DataTransfer();
    list.items.add(file);
    elem.files = list.files;
   
    let endTimeInMs = Date.now();

// DRL Need to see if this is still an issue. Now the syncing tab is in the foreground but the window may not be.
//    // DRL FIXIT! I found that on Twitter the upload didn't succeed while the tab was in the background
//    // so I added this workaround but we need a better solution that won't impact the user.
//    await reqPushToActiveTab();
   
    elem.dispatchEvent(new Event('change', {bubbles:true}));

    // allow enough time for the object to be uploaded (twice as long as it took to
    // upload to browser) and some time to process it
    let delay = ((endTimeInMs - startTimeInMs) * 2 / 1000) + 5;
    await sleep(delay);

//    await reqPopFromActiveTab();
}


async function getMimeType(url) {
    return new Promise( (resolve, reject) => {
        if (url == '#') {
           assert(0);   // let's try to track down when we get this, could be scraping error?
           resolve(null);
        }
        
        // optimization
        if (url.startsWith('https://socialattache.com/Main.php')) {
            resolve('text/html');
        }
        
        if (url.startsWith('data:')) {
           // this is a data URL so the MIME type is in the string as in:
           //    data:image/gif;base64,R0lGODlhAQABAID...
           resolve(url
              .split(',')[0]     // remove the data
              .split(':')[1]     // remove the protocol
              .split(';')[0]);   // remove any parameters after the MIME type
           return;
        }
   
        Messaging.SendMessageToBackground({ type: 'HEAD', url: url, params: {}, timeout: 10000}, function(resp) {
            if (resp == null) {
                resolve(null);
                return;
            }
   
            if (resp.httpCode != 200) {
                if (resp.httpCode != 401 && resp.httpCode != 403 && resp.httpCode != 404)
                    Log_WriteError("Got " + resp.httpCode + " response for " + url + " to get MIME type");
                resolve(null);
                return;
            }
           
            resolve(
                (
                    resp.headers.hasOwnProperty('Content-Type')
                        ? resp.headers['Content-Type']
                        : resp.headers['content-type']
                ).split(';')[0]
            );
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetBrandInfos() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getBrandInfos'}, function(data) {
                resolve(data);
            }
        )})
        .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetBrandID(brandID) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'setBrandID', brandID: brandID}, function(data) {
                resolve(data);
            }
        )})
        .catch(e => { Log_WriteException(e); throw e; });
}


// should be called during long operations to tell background we're still alive so we don't
// get reloaded, won't ping more than once per 1/2 minute
let lastPing = 0;
function reqPing() {
    let now = Date.now();
    if (now - lastPing >= timings.SYNC_PROCESSING_PING_DELAY * 1000) {
        console.log('Pinging');
        Messaging.SendMessageToBackground({type: 'ping'}, function() {});
        lastPing = now;
    }
}

async function reqGetTabID() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getTabID'}, function(data) {
               resolve(data);
           }
        )})
       .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetAction(accountID, accountName) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getAction', accountID: accountID, accountName: accountName}, function(data) {
            Log_WriteInfo('Processing action: ' + GetVariableAsString(data));
            resolve(data);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

// the request is the JSON object to be retuned later by reqGetAction above
// the tabID may be set to null in order for the current tab to be used
async function reqPushAction(tabID, action) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ tabID: tabID, type: 'pushAction', action: action }, function(resp) {
            Log_WriteInfo('Pushed action: ' + GetVariableAsString(action));
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

// pushes a message to be displayed the next time reqGetAction() is called, which could be a different page by then
// the tabID may be set to null in order for the current tab to be used
async function reqPushDisplayMessage(tabID, message, messageType, displayType, timeoutSeconds, icon) {
    return reqPushAction(tabID, {
            action: 'displayMessage',
            message: message,
            messageType: messageType,
            displayType: displayType,
            timeoutSeconds: timeoutSeconds,
            icon: icon
        });
}

// the tabID may be set to null in order for the current tab to be used
async function reqPushDisplayEmbeddedItemForm(tabID, form, itemName1, itemValue1, itemName2, itemValue2, itemName3, itemValue3, itemName4, itemValue4,
    itemName5, itemValue5, itemName6, itemValue6, itemName7, itemValue7, itemName8, itemValue8) {
    return reqPushAction(tabID, {
            action: 'displayEmbeddedItemForm',
            form: form,
            params: [itemName1, itemValue1, itemName2, itemValue2, itemName3, itemValue3, itemName4, itemValue4,
                itemName5, itemValue5, itemName6, itemValue6, itemName7, itemValue7, itemName8, itemValue8]
        });
}

// this is used when the site we are scraping has throttled/blocked the account for a while
// - the dataName is something like "FacebookScrape"
// - the delay is the amount of time before we should try scraping again
async function reqSetThrottled(dataName, delay) {
    Log_WriteError(dataName + ' is throttled at: ' + window.location.href);
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'throttled',
            dataName: dataName,
            delay: delay
        }, function() {
            resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetPostId(accountID, postID, externalPostID, from, errorMessage) {
    if (errorMessage)
        Log_WriteError('Error sending post ' + postID + ': ' + errorMessage);
    else
        Log_WriteInfo('Sent post ' + postID);
   
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setPostId',
            accountID: accountID,
            postID: postID,
            externalPostID: externalPostID,
            from: from,
            errorMessage: errorMessage
        }, function() {
            resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetMessageId(accountID, messageID, externalMessageID, from, errorMessage) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setMessageId',
            accountID: accountID,
            messageID: messageID,
            externalMessageID: externalMessageID,
            from: from,
            errorMessage: errorMessage
        }, function() {
            resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqCommandCompleted(dataName, accountID, syncCommandID, errorMessage) {
    return reqSetServerState(dataName, accountID, null, null, null, null, {
        SyncCommandID: syncCommandID,
        ErrorMessage: errorMessage
    });
}

async function reqUserTryingBranding() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({type: 'userTryingBranding'}, function() {
            resolve();
        });
    })
       .catch(e => { Log_WriteException(e); throw e; });
}

async function reqUserTryingLogin() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({type: 'userTryingLogin'}, function() {
            resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqUserRefusedLogin() {
    // there are some cases where the dialog being displayed will be closed automatically
    // and the cancel event will be fired, so we need to ignore those
   
    // page is being refreshed or changing location
    if (unloading)
       return;
    
    // the window is losing focus
    if (!document.hasFocus())
       return;
    
    // the tab is losing focus
    if (window.outerHeight == window.innerHeight)
       return;
    
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({type: 'userRefusedLogin'}, function() {
           resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqLinkDataSourceRefused(sourceName) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({type: 'linkDataSourceRefused', sourceName: sourceName}, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

// contact is a single vCard, command is a structure with SyncCommandID and ErrorMessage
async function reqSetServerState(dataName, accountID, currentCheck, syncData, messages, contact, command) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setServerState',
            dataName: dataName,
            accountID: accountID,
            currentCheck: currentCheck,
            syncData: syncData,
            messages: messages,
            contact: contact,
            command: command
        }, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function _sendPost(dataName, post, resolve) {
    Messaging.SendMessageToBackground({
        type: 'setServerState',
        dataName: dataName,
        accountID: null,  // not provided for sending a post
        currentCheck: null,
        syncData: null,
        messages: [post],
        contact: null
    }, function(result) {
        ClearMessage();

        if (!result)
            DisplayMessage(Str('There was an error sending the post to the server.'), 'error');
        
        resolve(result);
    });
}

async function reqSendPost(dataName, post) {
    return new Promise( (resolve, reject) => {
        if (post.message)
        {
// DRL FIXIT! Our yes/no dialog seems to be broken!
//        DisplayYesNoMessage(post.message, 'warning', function() {
//            _uploadPost(post);
//        });
            if (confirm(post.message))
                _sendPost(dataName, post, resolve);
            else {
                // a warning
                ClearMessage();
                resolve(false);
            }
        }
        else
            _sendPost(dataName, post, resolve);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSendContact(dataName, accountID, syncCommandID, contact, errorMessage) {
    assert(syncCommandID != null);
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setServerState',
            dataName: dataName,
            accountID: accountID,
            currentCheck: null,
            syncData: null,
            messages: null,
            contact: contact,
            command: {
                SyncCommandID: syncCommandID,
                ErrorMessage: errorMessage
            }
        }, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

function _uploadPost(post) {
    DisplayMessage(Str('Downloading post...'), 'busy');
    Messaging.SendMessageToBackground({ type: 'savePost', post: post}, function(resp) {
        if (resp == null) {
            DisplayMessage(Str('Post wasn\'t downloaded!'), 'error');
            return;
        }
   
        if (resp.status == 'success')
            DisplayMessage(Str('Downloaded as: <0>', resp.data.Name), 'success', null, timings.UPLOAD_SUCCESS_MESSAGE_DELAY);
        else
            DisplayMessage(Str('Post wasn\'t downloaded: <0>', resp.message), 'error');
    });
}

// the post contains optional replaceValues (on success) and an optional message (a warning if the replaceValues are non-null)
function savePost(post) {
    if (post.message) {
        if (post.Body == null) {
            // an error
            DisplayMessage(post.message, 'error');
        }
        else {
            // a warning
            ClearMessage();
// DRL FIXIT! Our yes/no dialog seems to be broken!
//          DisplayYesNoMessage(post.message, 'warning', function() {
//              _uploadPost(post);
//          });
            if (confirm(post.message))
                _uploadPost(post);
        }
    }
    else
        _uploadPost(post);
}

async function reqShowSyncWindowAndTab(focusedSecondsOrBool) {
    return new Promise( (resolve, reject) =>
    {
        Messaging.SendMessageToBackground({type: 'showSyncWindowAndTab', focusedSecondsOrBool: focusedSecondsOrBool}, function(success) {
            if (checkSendMessageHadError('showSyncWindowAndTab')) {
                resolve(false);
                return;
            }

            resolve(success);
        });
    })
    .catch(error => {
        Log_WriteError("Error in reqShowSyncWindowAndTab(): " + error);
        throw error;
    });
}

// syncDataName should be null for user controlled tab
// returns true if the script can use this tab, otherwise it must not use it
async function contentScriptInit(syncDataName) {
    Log_WriteInfo("Current page: " + window.location.href);
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'initTab', syncDataName: syncDataName}, function(resp) {
            let label = null;
            if (syncDataName == null)
                label = 'the user';
            else
                label = syncDataName + ' scraping';
   
            if (resp == null) {
                Log_WriteInfo('I am NOT for ' + label + '!');
                resolve(false);
                return;
            }
           
            Log_SetPrefix(syncDataName == null ? 'Augmentation' : syncDataName);
            Log_WriteInfo('I am for ' + label + '!');
   
            // in dev environment we use the scraper constants unchanged so this would be null in that case
            if (resp.scraperConstants) {
                Log_WriteInfo("Using ScrapeConstants from server");
                loadConstantsFromJson(resp.scraperConstants);
            }
            else
                Log_WriteInfo("Using static ScrapeConstants instead of server version");
    
            // initialize some global brand specific values...
            Form_RootUri = resp.brandRootURL;
            Form_MainUri = resp.brandRootURL + '/Main.php';
            LoginUri = resp.brandLoginURL;
    
            resolve(true);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function handleSocialAttacheLogin(isScraper) {
    return new Promise( (resolve, reject) => {
        if (!isScraper && !Browser.IsTabVisible()) {
//            Log_WriteInfo('Not visible, sleeping');
            sleep(timings.TAB_NOT_VISIBLE_DELAY)
                .then(resp => {
                    resolve(false);
                })
                .catch(error => {
                    Log_WriteError("Error 1 in handleSocialAttacheLogin(): " + error);
                    resolve(false);
                });
            return;
        }
   
        Messaging.SendMessageToBackground({type: 'checkSocialAttacheLogin'}, function(resp) {
            if (resp == null) {
                if (Browser.IsExtension() && chrome.extension == undefined)  // Chrome extension removed or reloading
                    console.log("Got null response from checkSocialAttacheLogin() and chrome extension has gone away");
                else
                    Log_WriteError("Got null response from checkSocialAttacheLogin()"); // should never happen?
                resolve(false);
                return;
            }
            
            Strings_Init(resp.languages);
            if (isScraper)
                DisplayMessage(Str('This tab is being used by <0>. Please open another if you need to interact with this website.',
                    // we use the longer delay here, we just want the message to eventually go away in case the
                    // tab is no longer being used - the extension was removed or reloaded for example, the
                    // content script will call this method periodically and that will keep this message up
                    resp.siteName), 'warning', null, timings.SEND_POST_RECHECK_DELAY);

            let loggedIn = false;
            if (!isScraper && Browser.IsTabVisible() && resp.type.startsWith('offer_')) {
                if (resp.type == 'offer_brand') {
                    reqUserTryingBranding();
                    displayBrandsMenu();
                }
                else {
                    assert(resp.type == 'offer_login');
                    if (confirm(Str('In order to use the <0> Chrome extension you\'ll need to create or login to a <1> account. Would you like to do this now?',
                        resp.extensionName, resp.brandName))) {
                        reqUserTryingLogin();
                        reqCreateTab('SAMainPage', 'GET', LoginUri, {}, false);
                    }
                    else if (Browser.IsTabVisible())    // if user switched tabs don't act as if he clicked
                        reqUserRefusedLogin();
                }
            }
            else if (resp.type == 'logged_in') {
                loggedIn = true;
            }

            if (!loggedIn)
                Log_WriteInfo('Logged out of back office');
            resolve(loggedIn);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function pingingSleep(seconds, callback) {
    Log_WriteInfo('pingingSleep for ' + seconds + ' seconds');
    let startTimeInMs = Date.now();
    while (Date.now() - startTimeInMs < seconds * 1000) {
        reqPing();
        let d = Math.min(seconds - ((Date.now() - startTimeInMs) / 1000), 10);
        await sleep(d);
    }
    if (callback) {
        Log_WriteInfo('Calling pingingSleep callback');
        callback();
        Log_WriteInfo('Return from pingingSleep callback');
    }
}

async function handleSocialLoggedOut(url) {
    Log_WriteInfo('Not logged in to social');
    await pingingSleep(timings.SOCIAL_NOT_LOGGED_IN_DELAY);
    window.location = url;
    return 4;   // wait a few seconds before checking for account info
}

async function reqGetContactInfos(protocol) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({type: 'getContactInfos', protocol: protocol}, function(resp) {
            if (resp == null) {
                Log_WriteError('getContactInfos(' + protocol + ') returned null!');
                resp = {};
            }
            
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetContactTags() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getContactTags'}, function(resp) {
            if (resp == null) {
                Log_WriteError('getContactTags returned null!');
                resp = {};
            }
            
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetGroupInfos() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getGroupInfos'}, function(resp) {
            if (resp == null) {
                Log_WriteError('getGroupInfos returned null!');
                resp = {};
            }
            
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetSearchFilterNames() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getSearchFilterNames'}, function(resp) {
            if (resp == null) {
                Log_WriteError('getSearchFilterNames returned null!');
                resp = {};
            }
            
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetSearchFilter(filterID) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getSearchFilter', filterID: filterID}, function(resp) {
            if (resp == null) {
                Log_WriteError('getSearchFilter returned null!');
                resp = {};
            }
            
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetHelpItems() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getHelpItems' }, function(resp) {
            if (resp == null) {
                Log_WriteError('getHelpItems returned null!');
                resp = {};
            }
            
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqReloadContactInfo(contactID) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'reloadContactInfo', contactID: contactID }, function() {
            resolve();
        });
    })
       .catch(e => { Log_WriteException(e); throw e; });
}

async function reqReloadSearchFilters() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'reloadSearchFilters' }, function() {
            resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqMarkHelpItemRead(path) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'markHelpItemRead', path: path }, function() {
            resolve();
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

// returns true if the user was prompted, must only be called from non-scrapers
async function handleDataSource(sourceName) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'checkDataSource', sourceName: sourceName}, function(resp) {
            if (resp == null) {
                resolve(false);
                return;
            }
            
            let prompted = false;
            if (Browser.IsTabVisible() && resp.type == 'offer_sync') {
                prompted = true;
                if (confirm(Str('Would you like to link your <0> account with <1> in order to enable data sharing?', resp.sourceName, resp.brandName)))
                    reqLinkDataSource(resp.sourceName);
                else if (Browser.IsTabVisible())    // if user switched tabs don't act as if he clicked
                    reqLinkDataSourceRefused(resp.sourceName);
            }
            resolve(prompted);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqLinkDataSource(sourceName) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({type: 'linkDataSource', sourceName: sourceName}, function(result) {
            resolve(null);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getAccountId(dataName) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getAccountId', dataName: dataName}, function(resp) {
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getImageBlob(url) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getBlob', url: url}, function(dataUri) {
            if (dataUri == null) {
                resolve(null);
                return;
            }
            else if (dataUri == null) {
               Log_WriteError(('Unable to get blob from URL: ' + url));
               resolve(null);
               return;
            }
            resolve(dataURItoBlob(dataUri));
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getFinalUrl(url) {
    assert(url != null);
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getFinalUrl', url: url}, function(result) {
            resolve(result);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqCreateTab(tabName, method, url, params, forScraping, queuedActions)
{
    if (forScraping == null)
        forScraping = false;
   
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground(
            {type: 'createTab', tabName: tabName, method: method, url: url, params: params, forScraping: forScraping, queuedActions: queuedActions},
            function() {
                resolve(null);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqRemoveTab()
{
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground(
           {type: 'removeTab'},
           function() {
               resolve(null);
           });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetBrandID()
{
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground(
           {type: 'getBrandID'},
           function(result) {
               resolve(result);
           });
    })
       .catch(e => { Log_WriteException(e); throw e; });
}

async function reqCreateIssue() {
    DisplayMessage(Str('Preparing information report...'), 'busy');
    reqCreateTab('SAMainPage', 'POST', Form_MainUri, {
        'FormProcessor': 'IssueEdit',
        'VentureID': await reqGetBrandID(),
        'ReferralUrl': contactsPageUrl(),
        'PageURL': window.location.href,
        'PageHTML': DOMtoString(window.document),
        'PagePNG': '%TAB_CAPTURE%',
        'LogFile': '%LOG_FILE%'
    })
    .then(resp => {
        ClearMessage();
    })
    .catch(error => {
        Log_WriteError("Error with reqCreateIssue(): " + error);
        DisplayMessage(Str('Error preparing report'), 'error');
    });
}

// can be passed a message, post, or comment
// returns true if an essential attachment was removed (can't be downloaded)
async function massageAttachments(message) {
    const s = new Set();
    let result = [];
    let removedEssentialAttachment = false;
    
    for (let el of message.Attachments) {
        let url = normalizeUrl(el.URL); // fix Facebook redirect URLs
        
        // skip blob and inline data types as we don't currently support them
        if (url.indexOf('blob:') === 0 ||
            url.indexOf('data:') === 0) {
            // "image/svg", "image/svg+xml" are not essential
            if (url.indexOf('image/svg') === -1)
                removedEssentialAttachment = true;
        }
        // avoid duplicate attachments
        else if (!s.has(url)) {
            
            if (!el.hasOwnProperty('Type') == undefined || el.Type == null)
                el.Type = await getMimeType(url);
            else
                assert(0);  // callers should not be providing the type
    
            if (el.Type != null &&
                // don't bother with "image/svg", "image/svg+xml"
                el.Type.indexOf('image/svg') === -1) {
                s.add(url);
                el.URL = url;
                result.push(el)
            }
        }
    }
   
    message.Attachments = result;

    return removedEssentialAttachment;
}

async function reqScraperException(dataName)
{
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground(
            {type: 'scraperException', dataName: dataName},
            function(resp) {
                resolve(resp);
            });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function handleScraperException(dataName, e, url) {
    let delay = timings.BUSY_LOOP_DELAY;

    if (e.message.indexOf('Extension context invalidated') != -1) {
        console.log(e.message);
        window.location.reload();  // background script unloaded or reloaded
        await sleep(10);    // let's make sure nothing more is done on this page while it reloads
    }
    else if (e.message.indexOf('account info not found') != -1) {
        delay = handleSocialLoggedOut(url);
    }
    else {
        Log_WriteException(e);
        reqScraperException(dataName);
        delay = timings.SCRAPING_EXCEPTION_DELAY;
    }
   
    return delay;
}

async function reqIsBrowserTabIdle() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground(
            {type: 'isBrowserTabIdle'},
            function(resp) {
                resolve(resp);
            });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function DOMtoString(root) {
    let html = '';
    let node = root.firstChild;
    while (node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                html += node.outerHTML;
                break;
            case Node.TEXT_NODE:
                html += node.nodeValue;
                break;
            case Node.CDATA_SECTION_NODE:
                html += '<![CDATA[' + node.nodeValue + ']]>';
                break;
            case Node.COMMENT_NODE:
                html += '<!--' + node.nodeValue + '-->';
                break;
            case Node.DOCUMENT_TYPE_NODE:
                // (X)HTML documents are identified by public identifiers
                html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
                break;
            default:
                break;
        }
        node = node.nextSibling;
    }
    return html;
}