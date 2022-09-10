let syncWindowID = null;
// we keep a copy of the data so we don't have to access it async
let tabsUsed = {};      // indexed by tab ID, the value is an array containing
                        //      the "tabName" either the scraper name or for a user tab the target name or null
                        //      the "isTemporary" flag
                        //      the "url" is what we use when we have to reload the tab
                        //      the "index" (across all window)s where this tab appears when we query Chrome - used
                        //          to find the tab on reload because all the IDs change so we can't use those
let queuedActions = {}; // an array (by tab ID), each value containing a queue of actions that can be provided for
                        // the content script to use when it loads

let lastScraperConstantsChecked = 0;
let lastScraperConstantsUpdated = 0;
let scraperConstants = null;    // as a JSON string

// when the browser is closed then launched, or the extension is installed/updated and launched
Environment.AddStartupListener(function() {
    Log_WriteInfo('App Startup');
    reloadTabInfo();
});

Tabs.AddTabAttachedListener(function(tabId) {
    Log_WriteInfo('Tab Attached(' + getTabNameNoCheck(tabId) + ', attachInfo)');
    updateTabIndices(false);
});

Tabs.AddTabDetachedListener(function(tabId) {
    Log_WriteInfo('Tab Detached(' + getTabNameNoCheck(tabId) + ', detachInfo)');
    updateTabIndices(false);
});

let tabCreatedTimerID = null;
Tabs.AddTabCreatedListener(function(tabId) {
    Log_WriteInfo('Tab Created(' + getTabNameNoCheck(tabId) + ')');
    if (Object.keys(tabsUsed).length == 0) {
        if (tabCreatedTimerID != null)
            clearTimeout(tabCreatedTimerID);

        // DRL FIXIT? Timers not safe to use in Manifest v3?
        // we allow a little time because there's likely a bunch of tabs being created
        tabCreatedTimerID = setTimeout(function() {
            try {
                tabCreatedTimerID = null;
                // this may be the case where the browser was launched and the user selected to have the old tabs restored
                Log_WriteInfo('No tabs used so reloading the tab info');
                reloadTabInfo();
            }
            catch (e) {
                Log_WriteException(e);
            }
        }, 5000);
    }
    else
        updateTabIndices(false);
});

Tabs.AddTabRemovedListener(function(tabId) {
    Log_WriteInfo('Tab Removed(' + getTabNameNoCheck(tabId) + ', removeInfo)');

    let tabName = tabsUsed.hasOwnProperty(tabId) ? tabsUsed[tabId].tabName : null;
    if (isScraperTabName(tabName))
        releaseSyncControl(tabId, tabName);   // just in case it had control

    delete queuedActions[tabId];
    
    updateTabIndices(false);
});

Tabs.AddTabMovedListener(function(tabId) {
    Log_WriteInfo('Tab Moved(' + getTabNameNoCheck(tabId) + ', moveInfo)');
    updateTabIndices(false);
});

Tabs.AddTabReplacedListener(function(addedTabId, removedTabId) {
    Log_WriteInfo('Tab Replaced(' + getTabNameNoCheck(addedTabId) + ', ' + getTabNameNoCheck(removedTabId) + ')');
    
    if (tabsUsed.hasOwnProperty(removedTabId)) {
        Log_WriteInfo('TabManager replacing tab ID ' + removedTabId + ' with ' + addedTabId);
        assert(!tabsUsed.hasOwnProperty(addedTabId));

        tabsUsed[addedTabId] = tabsUsed[removedTabId];
        delete tabsUsed[removedTabId];
    
        updateSyncTabID(removedTabId, addedTabId)
    }
    
    updateTabIndices(false);
});

Tabs.AddWindowCreatedListener(function(windowId) {
    Log_WriteInfo('Window Created(' + windowId + ')');
    updateTabIndices(false);
});

Tabs.AddWindowRemovedListener(function(windowId) {
    Log_WriteInfo('Window Removed(' + windowId + ')');
    updateTabIndices(false);
    if (syncWindowID == windowId) {
        Log_WriteError('Sync window closed!');
        syncWindowID = null;
    }
});

Timers.AddRepeatingTimer(60, function() {
    Log_WriteInfo('Tabs alarm');

    if (longRunningOperationName == null)   // skip while we're busy with the server
        checkScraperConstants();
    else
        Log_WriteInfo('Skipping scraper constants check due to long running ' + longRunningOperationName + ' operation');

    updateTabIndices(true)  // check for bugs
});


// used for logging
function getTabNameNoCheck(tabID) {
    if (tabsUsed.hasOwnProperty(tabID))
        return (tabsUsed[tabID].tabName == null ? 'user' : tabsUsed[tabID].tabName) + ' (' + tabID + ')';
    
    return 'unknown (' + tabID + ')';
}

function reloadTabInfo() {
    Storage.GetStorage('TabManager', 'tabsUsed', function(data) {
        if (!data.hasOwnProperty('tabsUsed')) {
            Log_WriteInfo('No saved tabs to restore');
            data.tabsUsed = {};
        }
        
        Tabs.GetAllTabs(function (tabs) {
            try {
                Log_WriteInfo('Reloading tab info: ' + Json_ToString(tabs));
                Log_SetMetaLogging('Browser Tabs', Json_ToString(tabs, null, 3));
                
                // when the browser is reloaded we need to find the window used by the scrapers, and we do
                // this by looking for a tab with a special URL that identifies the scraper window
                
//                    let firstRun = Object.keys(tabsUsed).length == 0;

                let removeSyncWindows = [];
                let indicatorTabId = null;
                syncWindowID = null;
                for (let tab of tabs) {
                    assert(tab.windowId != null);
                    if (tab.url == ExtensionInfoUrl)
                    {
                        if (syncWindowID != null && syncWindowID != tab.windowId) {
                            Log_WriteError('Another ExtensionInfoUrl tab found so we will close the old one (' + syncWindowID + ')!');
                            removeSyncWindows.push(syncWindowID);
                        }
                        Log_WriteInfo('ExtensionInfoUrl tab found (' + tab.id + '), setting sync window ID to ' + tab.windowId);
                        syncWindowID = tab.windowId;
                        indicatorTabId = tab.id;
                    }
                }
    
                tabsUsed = {};
                if (syncWindowID) {
                    Log_WriteInfo('Sync window ID is ' + syncWindowID);

                    // when the browser is reloaded the tab IDs may be different so we have to re-map them by
                    // looking for them by index which spans all the windows so it is unique across windows

                    for (let tabID in data.tabsUsed) {
                        let info = data.tabsUsed[tabID];
                        if (info.tabName == null)
                            continue;   // we don't reload user tabs, they'll call initTab() and get added to our list
                        
                        for (let i = 0; i < tabs.length; i++) {
                            let tab = tabs[i];
                            if (tab.windowId == syncWindowID && tab.id != indicatorTabId && info.index == tab.index)
                            {
                                Log_WriteInfo('Using new tab:' + Json_ToString(tab));
                                Log_WriteInfo('For old tab:' + Json_ToString(info));

                                let tabID = tab.id;

                                // put the tab into the array using the new tab ID
                                tabsUsed[tabID] = info;

// DRL FIXIT! Need to revisit this as it seemed to be stealing the focus from the temporary window, but it shouldn't?
//                                    // if this is a fresh start give each sync tab a five second poke to wake it up, starting in five seconds
//                                    if (firstRun && isScraperTabName(info.tabName))
//                                        setTimeout(function() {
//                                            Log_WriteInfo('TabManager giving focus to ' + getTabNameNoCheck(tabID));
//                                            Tabs.SetActiveTab(tabID);
//                                        }, 5000 + (5000 * Object.keys(tabsUsed).length))

                                info = null; // we found it

                                // note that this doesn't change the array indices
                                delete tabs[i]; // remove it from the list so we don't delete the tab below
                                break;
                            }
                        }
    
                        // the delete operator above doesn't update indices or array length so we have to re-index
                        tabs = Object.values(tabs);
    
                        if (info)
                        {
                            Log_WriteError('Tab not found ' + tabID);
                            console.log(info);
                        }
                    }
                    
                    // delete unused tabs in our list
                    for (let tab of tabs) {
                        if (tab.windowId == syncWindowID && tab.id != indicatorTabId) {
                            Log_WriteError('Removing unmatched tab ' + tab.id + ' at ' + tab.url);
                            Tabs.RemoveTab(tab.id);
                        }
                    }
                }
                else
                    Log_WriteInfo('Sync window not found');

                Utilities_ArrayRemoveDuplicates(removeSyncWindows);
                for (let windowID of removeSyncWindows) {
                    Log_WriteError('Removing old sync window: ' + windowID);
                    Tabs.RemoveWindow(windowID, function () {});
                }

                Log_SetMetaLogging('Tabs Used', Json_ToString(tabsUsed, null, 3));
            }
            catch (e) {
                Log_WriteException(e);
            }
        });
    });
}

let tabUpdateTimerID = null;
let tabLogChangesAsErrors = null;
function updateTabIndices(logChangesAsErrors) {
    if (tabUpdateTimerID != null)
        clearTimeout(tabUpdateTimerID);
    
    // if there is any request to NOT log as errors then we shouldn't because changes are expected
    if (tabLogChangesAsErrors === null || logChangesAsErrors == false)
        tabLogChangesAsErrors = logChangesAsErrors;
    
    // DRL FIXIT? Timers not safe to use in Manifest v3?
    tabUpdateTimerID = setTimeout(function() {
        try {
            tabUpdateTimerID = null;
            logChangesAsErrors = tabLogChangesAsErrors;
            tabLogChangesAsErrors = null;
            
            _updateTabIndices(logChangesAsErrors);
        }
        catch (e) {
            Log_WriteException(e);
        }
    }, 1000);
}

function _updateTabIndices(logChangesAsErrors) {
    try {
        Tabs.GetAllTabs(function(tabs) {
            try {
                Log_WriteInfo('Checking tabs - start');
                Log_SetMetaLogging('Browser Tabs', Json_ToString(tabs, null, 3));

                let changed = false;
                for (let tabID in tabsUsed) {
                    let info = tabsUsed[tabID];
                    for (let tab of tabs) {
                        if (tab.id == tabID) {
                            if (info.index != tab.index) {
                                if (info.index != -1 && logChangesAsErrors) {
                                    Log_WriteError('While checking tabs found a tab with the wrong index! ' + Json_ToString(tabsUsed[tabID]));
                                }
                                Log_WriteInfo('Updating tab ' + getTabNameNoCheck(tabID) + ' index from ' +
                                   info.index + ' to ' + tab.index);
                                tabsUsed[tabID].index = tab.index;
                                changed = true;
                            }
                            
                            info = null; // found it
                            break;
                        }
                    }
                    
                    if (info) {
                        if (logChangesAsErrors)
                            Log_WriteError('Tab removed (not found) ' + tabID);
                        else
                            Log_WriteInfo('Tab removed (not found) ' + tabID);
                        delete tabsUsed[tabID];
                        changed = true;
                    }
                }
                
                if (changed) {
                    Storage.SetStorage('TabManager', {tabsUsed: tabsUsed});
                    Log_WriteInfo('Saved tabsUsed');
                    Log_SetMetaLogging('Tabs Used', Json_ToString(tabsUsed, null, 3));
                }
                Log_WriteInfo('Checking tabs - end');
            }
            catch (e) {
                Log_WriteException(e, 'updateTabIndices() 2');
            }
        });
    }
    catch (e) {
        Log_WriteException(e, 'updateTabIndices() 1');
    }
}

checkScraperConstants();        // initial check

function checkScraperConstants() {
    // check for new scraper constants periodically
    if (!navigator.onLine) {
        Log_WriteInfo('The browser appears to be offline, skipping ScraperConstants checks.');
        return;
    }
    let now = Date.now();
    if (now - lastScraperConstantsChecked < timings.CHECK_FOR_UPDATED_CONSTANTS * 1000) {
        return;
    }

    lastScraperConstantsChecked = now;
    Log_WriteInfo('Checking for updated constants');

    const url = Form_RootUri
       ? Form_RootUri + '/v2/Skins/ScraperConstants'
       : Environment.GetAssetUrl('Constants.js');

    ajax.get(url, {}, function(resp, httpCode)
    {
        if (resp == null || httpCode == 0) {
            Log_WriteInfo('Server is not available to get scraper constants');
            return;
        }

        if (httpCode != 200) {
            Log_WriteError('Got unexpected result ' + httpCode + ' for ScraperConstants: ' + httpCode);
            return;
        }

        if (scraperConstants != resp) {
            Log_WriteInfo('Updating with constants from server');
            scraperConstants = resp;
            lastScraperConstantsUpdated = now;
            
            loadConstantsFromJson(resp);
            
            // reload scraper tabs so they make use of the new values immediately, whereas user
            // tabs are already getting reloaded periodically when the browser is idle
            for (let usedTabID in tabsUsed) {
                if (isScraperTabName(tabsUsed[usedTabID].tabName))
                    Tabs.ReloadTab(usedTabID);
            }
        }
    }, true, timings.SHORT_AJAX_REQUEST * 1000);
}

// pass null sync data name for user controlled tab, otherwise the data name for the sync, returns some
// initialization data if this tab can be used, otherwise null
async function initTab(tabID, tabName) {
    return new Promise( (resolve, reject) =>
    {
        Tabs.GetTab(tabID, function(tab) {
            try {
                // when a script is connected to a tab it will call "init" to check if it should use the tab or if it
                // should ignore the tab and let the user have it because we already have a tab for that processor
    
                let canUse = true;
                let prettyTabName = tabName != null ? tabName : 'user';
                
                if (tabsUsed.hasOwnProperty(tabID)) {
                    // only user tabs can be re-used, and scraper tabs should be setup via createTab(), not here
                    if (tabsUsed[tabID].tabName != tabName && (isScraperTabName(tabsUsed[tabID].tabName) || isScraperTabName(tabName)))
                    {
                        Log_WriteInfo('Tab ' + tabID + ' can\'t be used for ' + prettyTabName +
                           ' as it\'s already being used for ' + (tabsUsed[tabID].tabName ? tabsUsed[tabID].tabName : 'user'));
                        canUse = false;
                    }
                }
                else if (isScraperTabName(tabName)) {
                    Log_WriteInfo('Tab ' + tabID + ' is not set up for ' + prettyTabName);
                    canUse = false;
                }
    
                Log_WriteInfo('Init tab ' + tabID + ' for ' + prettyTabName + ' canUse ' +
                   (canUse ? 'yes' : 'no'));
    
                // keep track of the usage for the tab if it's new or it changes
                if (canUse && (!tabsUsed.hasOwnProperty(tabID) || tabsUsed[tabID].tabName != tabName)) {
                    Log_WriteInfo('Init tab ' + tabID + ' for ' + prettyTabName);
        
                    tabsUsed[tabID] = {
                        tabName: tabName,
                        url: null,
                        index: tab.index,
                        isTemporary: false
                    };
    
                    Log_SetMetaLogging('Tabs Used', Json_ToString(tabsUsed, null, 3));
                }
                
                if (!canUse && isScraperTabName(tabName) && tab.windowId == syncWindowID) {
                    Log_WriteError('Closing scraper tab that is not set up!');
                    assert(!tabsUsed.hasOwnProperty(tabID));
                    Tabs.RemoveTab(tabID);
                }
    
                if (!canUse) {
                    resolve(null);
                    return;
                }

                getBrands() // call this just to make sure brands have been loaded
                    .then(resp => {
                        let brand = getBrand();
                        let rootUrl = null;
                        let loginUrl = null;
                        if (brand) {
                            rootUrl = brand.RootURL;
                            loginUrl = brand.ExtensionLoginResourceID
                               ? brand.RootURL + '/Main.php?FormProcessor=FlowChartVisit&ResourceID=' + brand.ExtensionLoginResourceID + '&Restart=1'
                               : brand.RootURL + '/Main.php';
                        }
                        let result = {
                            brandRootURL: rootUrl,
                            brandLoginURL: loginUrl,
                            // in dev environment we use the scraper constants unchanged so this would be null in that case
                            scraperConstants: getBrandID() == BrandID_LocalFile ? null : scraperConstants
                        }
                        resolve(result);
                    })
                    .catch(error => {
                        Log_WriteError("Error handling getBrands(): " + error);
                        resolve(null);
                    });
            }
            catch (e) {
                Log_WriteException(e, 'initTab()');
                resolve(null);
            }
        });
    })
   .catch(e => { Log_WriteException(e); throw e; });
}

function getTabName(tabID) {
    if (tabsUsed.hasOwnProperty(tabID))
        return tabsUsed[tabID].tabName;
    
    let str = '';
    for (let usedTabID in tabsUsed) {
        str += "Tab: " + usedTabID + " for " + tabsUsed[usedTabID].tabName + "\r\n";
    }
    Log_WriteError("Tab " + tabID + " not found in:\r\n" + str);
    return null;
}

function hasExistingTab(tabID) {
    return tabsUsed.hasOwnProperty(tabID);
}

function isTemporaryTab(tabID) {
    if (!tabsUsed.hasOwnProperty(tabID)) {
        Log_WriteError('Tab ' + tabID + ' not found when checking for temporary tab!');
        return false;
    }
    return tabsUsed[tabID].isTemporary;
}

function hasTemporaryTab(tabName) {
    for (let usedTabID in tabsUsed) {
        if (tabsUsed[usedTabID].tabName == tabName && tabsUsed[usedTabID].isTemporary)
            return true;
    }
    return false;
}

function pushTabNextAction(tabID, nextAction) {
    if (!queuedActions.hasOwnProperty(tabID))
        queuedActions[tabID] = [nextAction];
    else
        queuedActions[tabID].push(nextAction);
    return true;
}

function popTabNextAction(tabID) {
    if (!tabsUsed.hasOwnProperty(tabID)) {
        // If this method is being called then our client script is running which means initTab() must have been
        // called, but for some reason it doesn't appear in our list. We will reload the tab in the hopes initTab()
        // gets called again to correct this.
        Log_WriteError('Tab ' + tabID + ' not found when getting next action!');
        Tabs.ReloadTab(tabID);
        return {action: 'reload'};
    }
    return queuedActions.hasOwnProperty(tabID) && queuedActions[tabID].length > 0
        ? queuedActions[tabID].shift()
        : null;
}

// tabName can be a scraper name or for a user tab can be null or some other name (allows re-use)
// the URL can be terminated with a "*" in order to re-use any existing URL that starts the same
async function createTab(tabName, method, url, params, forScraping, isTemporary, _queuedActions) {
    assert(_queuedActions == null || Array.isArray(_queuedActions));

    let tabID = null;
    if (tabName != null) {
        for (let usedTabID in tabsUsed) {
            if (tabsUsed[usedTabID].tabName == tabName && tabsUsed[usedTabID].isTemporary == isTemporary) {
                tabID = usedTabID;
                Log_WriteInfo('Using existing tab ' + tabID + ' for ' + tabName + (isTemporary ? ' temporary tab' : ''));
                break;
            }
        }
    }
    
    let substringMatch = false;
    if (url.endsWith('*')) {
        url = url.slice(0, -1);
        substringMatch = true;
    }
    let redirectUrl = null;
    if (method.toUpperCase() == 'POST') {
        redirectUrl = Environment.GetAssetUrl('RedirectPost/post.html');
    }
    else {
        redirectUrl = url;
        let query = (new URLSearchParams(params)).toString();
        if (query.length > 0)
        {
            assert(!url.endsWith('*'));
            redirectUrl += '?' + query;
        }
    }
    
    return new Promise( (resolve, reject) => {
        if (tabID && forScraping) {
            if (isTemporary) {
                // there's only ever one temporary tab and we don't re-use it (it should have been removed already)
                Log_WriteError('Removing ' + tabName + ' temporary tab before creating another');
                Tabs.RemoveTab(tabID);
                tabID = null;
            }
        }
    
        let handleTabLoaded = function (tab)
        {
            // CreateTab() return null on error whereas SetTabUrl() returns null windowId
            if (tab == null || tab.windowId == null) {
                Log_WriteError('Error creating tab for ' + (forScraping ? 'scraping' : 'user') + ' with url: ' + url);
                resolve(null);
                return;
            }
    
            if (forScraping && !isTemporary) {
                if (syncWindowID != null && syncWindowID != tab.windowId) {
                    // added this because I saw one case where things got held up and that resulted in multiple
                    // calls to create the same initial tab resulting in a lot of sync windows being created so
                    // we'll close the extras if we get into that state again
                    Log_WriteError('There is already a sync window with ID ' + syncWindowID + ' therefore closing new window ' + tab.windowId);
                    Tabs.RemoveWindow(tab.windowId, function () {});
                    resolve(null);
                    return;
                }
    
                assert(tab.windowId != null);
                if (syncWindowID == null) {
                    Log_WriteError('Tab loaded, setting sync window ID from null to ' + tab.windowId);
                    syncWindowID = tab.windowId;
                    // we create a tab with a special URL for the sole purpose of identifying the scraper
                    // window when the browser or Chrome extension are reloaded
                    Tabs.CreateTab(syncWindowID, ExtensionInfoUrl, false, function (tab) {});
                }
            }
            
            if (tabID == null) {
                // scraper tabs could bring up an auto-play video so we mute them
                if (forScraping)
                    Tabs.SetTabMuted(tab.id, true);
                
                tabsUsed[tab.id] = {
                    tabName: tabName,
                    isTemporary: isTemporary,
                    url: forScraping ? url : null,
                    index: -1,  // set by updateTabIndices() below
                };
                if (_queuedActions != null)
                    queuedActions[tab.id] = _queuedActions;
                Log_WriteInfo('Using new tab ' + tab.id + ' for ' + tabName + (isTemporary ? ' temporary tab' : ''));
                updateTabIndices(false);
            }

            // DRL FIXIT? Timers not safe to use in Manifest v3?
            // some sites (like Twitter) still haven't loaded the page content so we wait a little longer
            setTimeout(function() {
                try {
                    // if this was a post we have to tell the redirect page to perform the post
                    if (method.toUpperCase() == 'POST')
                        Messaging.SendMessageToTab(tab.id, {url: url, params: params});
                }
                catch (e) {
                    Log_WriteException(e);
                }

                resolve(tab.id);
            }, 1000);
        }
    
        if (tabID)
        {
            Tabs.GetTab(tabID, function(tab) {
                try {
                    if (!forScraping && !tab.active) {
                        Log_WriteInfo('Updating tab in window ' + syncWindowID + ' for ' + (forScraping ? 'scraping' : 'user') + ' as active');
                        Tabs.SetActiveTab(tabID);
                    }
                    
                    let matches = substringMatch
                        ? fuzzyUrlStartsWith(tab.url, redirectUrl)
                        : fuzzyUrlsMatch(tab.url, redirectUrl);
                    if (matches && method.toUpperCase() != 'POST')
                        resolve(tabID);
                    else {
                        Log_WriteInfo('Updating tab in window ' + syncWindowID + ' for ' + (forScraping ? 'scraping' : 'user') + ' with url: ' + redirectUrl);
                        Tabs.SetTabUrl(tabID, redirectUrl, handleTabLoaded);
                    }
                }
                catch (e) {
                    Log_WriteException(e, 'initTab()');
                    resolve(null);
                }
            });
        }
        else if (!forScraping)
        {
            Log_WriteInfo('Creating user tab in window ' + syncWindowID + ' with url: ' + redirectUrl);
            Tabs.CreateTab(Tabs.ACTIVE_WINDOW, redirectUrl, true, handleTabLoaded);
        }
        else if (isTemporary) {
            Log_WriteInfo('Creating temporary window/tab with url: ' + redirectUrl);
            Tabs.CreateTab(Tabs.CREATE_WINDOW, redirectUrl, true, handleTabLoaded);
        }
        else if (syncWindowID)
        {
            Log_WriteInfo('Creating scraping tab in window ' + syncWindowID + ' with url: ' + redirectUrl);
            Tabs.CreateTab(syncWindowID, redirectUrl, false, handleTabLoaded);
        }
        else
        {
            Log_WriteError('Creating scrapers window'); // made this an error while I try to figure out how some people are getting multiple scraper windows
            Tabs.CreateTab(Tabs.CREATE_WINDOW, redirectUrl, false, handleTabLoaded);
        }
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

// intended to be used in an extreme case where a scraper tab is no longer going to be used
function removeTab(tabID) {
    Log_WriteError('Removing tab ' + tabID + ' with saved tabs:' + Json_ToString(tabsUsed));
    Tabs.RemoveTab(tabID);
}

// focusedSecondsOrBool controls the window focus (true, false, or number of seconds)
async function showSyncWindowAndTab(tabID, focusedSecondsOrBool, minWidth) {
    return new Promise( (resolve, reject) =>
    {
        assert(syncWindowID != null);
        Tabs.SetWindowNormal(syncWindowID, focusedSecondsOrBool, minWidth, function ()
        {
            Tabs.SetActiveTab(tabID, function(tabId)
            {
                resolve();
            });
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function tabManagerBrandChanged() {
    // when the brand changes, so do the global URLs, so we reload the tabs that will care
    for (let tabID in tabsUsed) {
        Tabs.ReloadTab(tabID);
    }
}
