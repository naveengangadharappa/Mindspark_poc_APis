// DRL We should split the constant and data portions of this into two structures!
// DRL FIXIT? The arrays inside this structure (i.e. PollingSyncs and ScraperSyncs, etc.) were for
// supporting multiple syncs per third party provider but so far it looks like this feature isn't
// needed (only one polling and one scraper sync needed) so we could remove this additional complexity.
let Syncs = {
    'Facebook': {
        // const
        PollingSyncs: ['Facebook'],
        ScraperSyncs: ['FacebookScrape'],
        InitialScraperUrls: ['https://www.facebook.com'],
        RequiresFeature: UserFeaturesFacebookSync,
        // data
        scraperTabs: [null],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'Instagram': {
        // const
        PollingSyncs: [],
        ScraperSyncs: ['InstagramScrape'],
        InitialScraperUrls: ['https://www.instagram.com'],
        RequiresFeature: UserFeaturesInstagramSync,
        // data
        scraperTabs: [null],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'Pinterest': {
        // const
        PollingSyncs: [],
        ScraperSyncs: ['PinterestScrape'],
        InitialScraperUrls: ['https://www.pinterest.com'],
        RequiresFeature: UserFeaturesPinterestSync,
        // data
        scraperTabs: [null],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'TikTok': {
        // const
        PollingSyncs: [],
        ScraperSyncs: ['TikTokScrape'],
        InitialScraperUrls: ['https://tiktok.com'],
        RequiresFeature: UserFeaturesTikTokSync,
        // data
        scraperTabs: [null],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'Twitter': {
        // const
        PollingSyncs: [],
        ScraperSyncs: ['TwitterScrape'],
        InitialScraperUrls: ['https://twitter.com'],
        RequiresFeature: UserFeaturesTwitterSync,
        // data
        scraperTabs: [null],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'Google': {
        // const
        PollingSyncs: ['Google'],
        ScraperSyncs: [],
        InitialScraperUrls: [],
        RequiresFeature: UserFeaturesGoogleSync,
        // data
        scraperTabs: [],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'Microsoft': {
        // const
        PollingSyncs: ['Microsoft'],
        ScraperSyncs: [],
        InitialScraperUrls: [],
        RequiresFeature: UserFeaturesMicrosoftSync,
        // data
        scraperTabs: [],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
    'Apple': {
        // const
        PollingSyncs: ['Apple'],
        ScraperSyncs: [],
        InitialScraperUrls: [],
        RequiresFeature: UserFeaturesAppleSync,
        // data
        scraperTabs: [],
        lastLinkOfferRefused: 0,
        lastCheck: 0,
        pauseUntil: 0,
        syncState: null,
        existingDataNames: []
    },
};


let lastAlarm = null;
let longRunningOperationName = null;

Timers.AddRepeatingTimer(60, function() {
    Log_WriteInfo('Syncs timer');
    
    if (!navigator.onLine) {
        Log_WriteInfo('The browser appears to be offline, skipping sync checks.');
        return;
    }
    
    let now = Date.now();
    let wokeFromSleep = lastAlarm != null && (now - lastAlarm > SecondsPerMinute * 5 * 1000);  // alarm is 1 minute so check for 5 minutes to be sure
    if (wokeFromSleep)
        _wokeFromSleep();
    
    if (longRunningOperationName != null) {
        // a long running operation is a background script state so it should never get stuck
        // but we won't be receiving pings from the content script while it's waiting on the
        // background script so we skip any checks
        Log_WriteInfo('Skipping sync checks due to long running ' + longRunningOperationName + ' operation');
    }
    else if (activeDataName) {
        // if we have an active sync we don't want to muck with the tabs so we skip that but
        // we do want to check that the content script isn't stuck
        if (!_prepareAndCheckSync(activeDataName)) {
            Log_WriteError('The active sync ' + activeDataName + ' appears to be in a bad state, removing as active');
            activeDataName = null;
        }
    }
    else {
        _calculateNextSyncTurn();
    
        _createReadySyncTabs();
    }
    
    lastAlarm = now;
});


function getSyncUri() {
    return Form_RootUri + '/v2/Syncs/';
}

function startingLongRunningOperation(name) {
    Log_WriteInfo('Starting long running operation ' + name);
    assert(longRunningOperationName == null);
    longRunningOperationName = name;
}

function finishedLongRunningOperation(name) {
    Log_WriteInfo('Finished long running operation ' + name);
    assert(longRunningOperationName == name);
    longRunningOperationName = null;
}

function updateTabActivity(tabID) {
    for (let sourceName in Syncs)
    {
        for (let i in Syncs[sourceName].ScraperSyncs)
        {
            if (Syncs[sourceName].scraperTabs[i] && Syncs[sourceName].scraperTabs[i].tabID == tabID)
            {
                Syncs[sourceName].scraperTabs[i].lastActivity = Date.now();
                Syncs[sourceName].scraperTabs[i].lastActivityStage = 0;
                
                return;
            }
        }
    }
    
    // if we don't find it then it's likely a user tab (not a scraper tab)
}

// throttled is bool, type is a string identifying the type of throttling (messages, posts, etc.)
function setTabThrottled(tabID, throttled, type) {
    for (let sourceName in Syncs)
    {
        for (let i in Syncs[sourceName].ScraperSyncs)
        {
            if (Syncs[sourceName].scraperTabs[i] && Syncs[sourceName].scraperTabs[i].tabID == tabID)
            {
                let tabName = Syncs[sourceName].ScraperSyncs[i] + ' (' + tabID + ')';
                
                if (throttled) {
                    let added = Utilities_AddToArray(Syncs[sourceName].scraperTabs[i].throttledTypes, type);
                    if (Syncs[sourceName].scraperTabs[i].throttledSince == null) {
                        Syncs[sourceName].scraperTabs[i].throttledSince = Date.now();
                        Log_WriteWarning('Tab ' + tabName + ' is now being throttled for ' + type);
                    }
                    else if (added)
                        Log_WriteWarning('Tab ' + tabName + ' is also being throttled for ' + type);
                    else
                        Log_WriteWarning('Tab ' + tabName + ' is still being throttled for ' + type);
                }
                else {
                    if (Utilities_RemoveFromArray(Syncs[sourceName].scraperTabs[i].throttledTypes, type)) {
                        if (Syncs[sourceName].scraperTabs[i].throttledTypes.length == 0) {
                            Syncs[sourceName].scraperTabs[i].throttledSince = null;
                            Log_WriteWarning('Tab ' + tabName + ' is no longer being throttled');
                        }
                        else
                            Log_WriteWarning('Tab ' + tabName + ' is no longer being throttled for ' + type);
                    }
                }
                
                return;
            }
        }
    }
    
    Log_WriteError('Tab ' + tabID + ' not found for updating throttled!');
}

function isScraperTabName(name) {
    return name != null && name.indexOf('Scrape') == name.length - 6;
}

function updateSyncTabID(oldTabID, newTabID) {
    for (let sourceName in Syncs)
    {
        for (let i in Syncs[sourceName].ScraperSyncs)
        {
            if (Syncs[sourceName].scraperTabs[i] && Syncs[sourceName].scraperTabs[i].tabID == oldTabID)
            {
                Log_WriteInfo('Syncs replacing tab ID ' + oldTabID + ' with ' + newTabID);
                Syncs[sourceName].scraperTabs[i].tabID = newTabID;
                
                return;
            }
        }
    }
    
    // if we don't find it then it's likely a user tab (not a scraper tab)
}

function _wokeFromSleep() {
    Log_WriteInfo('***** System wake from sleep or network has resumed');
    for (let sourceName in Syncs) {
        for (let i in Syncs[sourceName].ScraperSyncs) {
            if (Syncs[sourceName].scraperTabs[i] == null)
                continue;
            
            let tabID = Syncs[sourceName].scraperTabs[i].tabID;
            let tabName = Syncs[sourceName].ScraperSyncs[i] + ' (' + tabID + ')';
            Log_WriteInfo('Resetting tab ' + tabName + ' time due to system wake from sleep or network resumed');
            updateTabActivity(tabID);
        }
    }
}

// only one sync has control at a time
let nextDataName = null;        // this is who's turn it is next
let activeDataName = null;      // this is set once the sync has accepted their turn, and cleared when they finish
let lastSyncEnded = 0;          // when did the last sync end
let curSyncStarted = null;      // when did the current sync start

function _calculateNextSyncTurn() {
    if (!navigator.onLine) {
        Log_WriteInfo('The browser appears to be offline, skipping sync checks.');
        return;
    }
    
    if (nextDataName != activeDataName && activeDataName != null)
        return; // we already know who is next
    
    // calculate who's turn it is next on first init and when the current sync has started, completed, or didn't take their turn
    
    // find available scrapers
    let availableScrapers = {};
    for (let sourceName in Syncs) {
        // only give a turn to syncs that are not being skipped
        if (Syncs[sourceName].syncState == 'sync_ready') {
            for (let i in Syncs[sourceName].ScraperSyncs) {
                // we only want scrapers with a tab
                if (Syncs[sourceName].scraperTabs[i]) {
                    // the tab may have been removed
                    let scraperTab = Syncs[sourceName].scraperTabs[i];
                    if (hasExistingTab(scraperTab.tabID))
                        availableScrapers[Syncs[sourceName].ScraperSyncs[i]] = scraperTab.lastRunTime;
                    else {
                        Log_WriteInfo('Scraper tab has gone away for: ' + Syncs[sourceName].ScraperSyncs[i]);
                        Syncs[sourceName].scraperTabs[i] = null;
                    }
                }
            }
        }
    }

    // if we have multiple choices choose the one that has been the longest since running
    while (Object.keys(availableScrapers).length > 1) {
        if (Object.values(availableScrapers)[0] <= Object.values(availableScrapers)[1])
            delete availableScrapers[Object.keys(availableScrapers)[1]];
        else
            delete availableScrapers[Object.keys(availableScrapers)[0]];
    }

    if (Object.keys(availableScrapers).length == 1) {
        nextDataName = Object.keys(availableScrapers)[0];
        Log_WriteInfo('Next sync turn: ' + nextDataName);
        Log_SetMetaLogging('Syncs', Json_ToString(Syncs, null, 3))
    
        // if there's no active sync, give the new one the focus to help speed things along
        if (activeDataName == null && !_prepareAndCheckSync(nextDataName)) {
            Log_WriteError('The next sync ' + nextDataName + ' appears to be in a bad state, removing as next active');
            nextDataName = null;
        }
    }
}

function _prepareAndCheckSync(checkDataName) {
    let now = Date.now();
    
    for (let sourceName in Syncs) {
        for (let i in Syncs[sourceName].ScraperSyncs) {
            if (Syncs[sourceName].ScraperSyncs[i] == checkDataName) {
                if (Syncs[sourceName].scraperTabs[i] == null) {
                    Log_WriteError('While preparing/checking ' + checkDataName + ' found that it has no tab!');
                    return false;
                }
                
                Tabs.SetActiveTab(Syncs[sourceName].scraperTabs[i].tabID, function(tabID) {
                    let scraperTab = Syncs[sourceName].scraperTabs[i];
                    if (tabID == null) {
                        Log_WriteError('Scraper tab ' + scraperTab.tabID + ' has gone away for: ' + Syncs[sourceName].ScraperSyncs[i]);
                        Syncs[sourceName].scraperTabs[i] = null;
                        return;
                    }
                    assert(tabID == scraperTab.tabID);
                    let tabName = Syncs[sourceName].ScraperSyncs[i] + ' (' + tabID + ')';
                    
                    if (scraperTab.throttledSince != null &&
                        now - scraperTab.throttledSince >= timings.THROTTLED_REFRESH_DELAY * 1000) {
                        Log_WriteError('Removing tab ' + tabName + ' due to throttling');
    
                        Tabs.RemoveTab(tabID);
                        Syncs[sourceName].scraperTabs[i] = null;
                        return;
                    }
        
                    let initialUrl = Syncs[sourceName].InitialScraperUrls[i];
                    let idleTime = scraperTab.lastActivity
                       ? now - scraperTab.lastActivity
                       : 0;
                    let stage = Utilities_Div(idleTime, timings.SCRAPER_INACTIVITY_REFRESH_DELAY * 1000);
                    let lastStage = scraperTab.lastActivityStage;
        
                    if (stage > lastStage) {
                        stage = lastStage+1;    // don't skip stages
                        scraperTab.lastActivityStage = stage;
                        
                        Log_WriteInfo('Tab ' + tabName + ' has been idle for ' + Utilities_Div(idleTime, 1000) + ' seconds');
                        Tabs.GetTab(tabID, function (tab) {
                            if (tab == null) {
                                Log_WriteError('Getting tab ' + tabName + ' returned null!');
                                return;
                            }
                
                            if (stage == 1) {
                                Log_WriteWarning('Reloading tab ' + tabName + ' at url "' +
                                   tab.url + '" due to inactivity');
                                Tabs.ReloadTab(tabID);
                            }
                            else if (stage == 2) {
                                if (!fuzzyUrlsMatch(tab.url, initialUrl)) {
                                    Log_WriteError('Updating tab ' + tabName + ' url from "' +
                                       tab.url + '" to "' + initialUrl + '" due to inactivity');
                                    Tabs.SetTabUrl(tabID, initialUrl);
                                }
                            }
/* Focusing didn't seem to provide much help and it really bothers the user.
                            else if (stage == 3) {
                                Log_WriteError('Focus scraper window for ' + tabName + ' at url ' + tab.url + ' due to inactivity');
                                // push it to the foreground for 3 seconds
                                showSyncWindowAndTab(tabID, 3, constants.MINIMUM_TAB_WIDTH);
                            }
*/
                            else if (idleTime >= timings.SCRAPER_INACTIVITY_REFRESH_DELAY * 1000) {
                                Log_WriteError('Removing tab ' + tabName + ' due to inactivity');
    
                                Tabs.RemoveTab(tabID);
                                Syncs[sourceName].scraperTabs[i] = null;
                            }
                        });
                    }
                });
                
                return true;
            }
        }
    }
    
    return false;
}

function getSyncControl(tabID, dataName) {
    let now = Date.now();

    if (activeDataName == dataName) {
        Log_WriteInfo('Sync ' + dataName + ' already controlled by ' + getTabNameNoCheck(tabID));

        if (!isTemporaryTab(tabID)) {        // don't steal focus from the temporary window
            // in case user changed the tab or minimized the window
            showSyncWindowAndTab(tabID, false, constants.MINIMUM_TAB_WIDTH);
        }

        return true;
    }
    
    // update the tab ID
    for (let sourceName in Syncs) {
        for (let i in Syncs[sourceName].ScraperSyncs) {
            let scraperTab = Syncs[sourceName].scraperTabs[i];
            
            if (Syncs[sourceName].ScraperSyncs[i] == dataName) {
                if (scraperTab == null)
                    Syncs[sourceName].scraperTabs[i] = {
                        tabID: tabID,
                        lastRunTime: 0,
                        lastActivity: now,
                        lastActivityStage: 0,
                        throttledTypes: [],
                        throttledSince: null
                    };
                else if (scraperTab.tabID != tabID) {
                    if (hasExistingTab(scraperTab.tabID)) {
                        Log_WriteWarning('Scraper tab ' + scraperTab.tabID + ' still around and tab ' + tabID + ' is also for ' + dataName + ' so assuming ' + tabID + ' is temporary!');
                    }
                    else {
                        Log_WriteError('Scraper tab ' + scraperTab.tabID + ' is being replaced by tab ' + tabID + ' for ' + dataName + ' so assuming ' + tabID + '??');
                        Syncs[sourceName].scraperTabs[i].tabID = tabID;
                    }
                }
            }
        }
    }
    
    if (!navigator.onLine || activeDataName != null || (nextDataName != null && nextDataName != dataName) ||
        !_hasAccessToSync(dataName) || now - lastSyncEnded < timings.INTER_SYNC_RUN_DELAY * 1000)
        return false;
    
    // check the run time
    for (let sourceName in Syncs) {
        for (let i in Syncs[sourceName].ScraperSyncs) {
            if (Syncs[sourceName].ScraperSyncs[i] == dataName) {
                if (now - Syncs[sourceName].scraperTabs[i].lastRunTime < timings.SYNC_RUN_FREQUENCY * 1000 ||
                    Syncs[sourceName].pauseUntil > now)
                    return false;   // it hasn't been long enough since the last check, or the sync is paused
                
                // update the last run time
                Syncs[sourceName].scraperTabs[i].lastRunTime = now;
            }
        }
    }
    
    Log_WriteInfo('***** Giving ' + dataName + ' sync control to ' + getTabNameNoCheck(tabID));
    activeDataName = dataName;
    curSyncStarted = now;
    
    Log_SetMetaLogging('Syncs', Json_ToString(Syncs, null, 3))

    showSyncWindowAndTab(tabID, false, constants.MINIMUM_TAB_WIDTH);
    
    return true;
}

function releaseSyncControl(tabID, dataName) {
    if (nextDataName == dataName) {
        // this handles the case where the scraper tab is closed, and TabManager calls us to let us know,
        // and we clear it so we'll' calculate who the next tab should be instead, otherwise we'll get stuck
        Log_WriteInfo('Next sync turn being cleared, was: ' + nextDataName);
        nextDataName = null;
    }
    
    if (activeDataName != dataName) {
        return;
    }
    
    Log_WriteInfo('***** Releasing ' + dataName + ' sync control from ' + getTabNameNoCheck(tabID));
    activeDataName = null;
    curSyncStarted = null;
    lastSyncEnded = Date.now();
    
    _calculateNextSyncTurn();    // who's next after me?
}

// returns seconds
function getSyncControlDuration(dataName) {
    if (activeDataName != dataName) {
        assert(0);
    }
    if (curSyncStarted == null) {
        assert(0);
    }
    
    return (Date.now() - curSyncStarted) / 1000;
}

function pauseSyncFor(tabID, dataName, delay) {
    if (activeDataName == dataName) {
        ActionCheck_Aborting();
        releaseSyncControl(tabID, dataName);
    }

    for (let sourceName in Syncs) {
        for (let i in Syncs[sourceName].ScraperSyncs) {
            if (Syncs[sourceName].ScraperSyncs[i] == dataName) {
                Syncs[sourceName].pauseUntil = Date.now() + (delay * 1000);
                Log_WriteInfo('***** Pausing ' + sourceName + ' for ' + delay + ' seconds');
                return;
            }
        }
    }

    assert(0);
}

function getLatestSyncTimestamp() {
    return Date.now() - (SecondsPerWeek * 104 * 1000); // go back a maximum of two years
}

// this is used in the local developer setup with no server, we store some data here to simulate the server
let SimulatedServer = {};

// returns null on error or {} if the sync does not exist, accountName can be left out if we know the
// account exists on the server
async function _getSync(dataName, accountID, accountName) {
    assert(accountID != null);
    
    return new Promise( (resolve, reject) => {
        var params = {
            'DataName': dataName,
            'AccountID': accountID,
            'AccessToken': 'unused'
        };
        // in case the server is going to create an account we want to provide this, but it's not provided
        // in those cases where we know the account already exists
        if (accountName)
            params['AccountName'] = accountName;
        const url = getBrandID() == BrandID_LocalFile
           ? Environment.GetAssetUrl('Data/' + dataName + '_' + accountID + '.json')
           : getSyncUri();
    
        ajax.get(url, params, function(resp, httpCode)
        {
            if (httpCode == 404) {
                resolve({});    // no result
                return;
            }
            
            if (httpCode != 200) {
                if (resp == null || httpCode == 0 || httpCode == 401 || httpCode == 403 || httpCode == 404)
                    Log_WriteWarning('Response ' + httpCode + ' from server for sync ' + dataName + ' account ' + accountID + ' _getSync: ' + (resp ? resp : 'null'));
                else
                    Log_WriteError('Response ' + httpCode + ' from server for sync ' + dataName + ' account ' + accountID + ' _getSync: ' + resp);
                resolve(null);  // error
                return;
            }
            
            let temp = Json_FromString(Json_ConvertJavaScriptToJson(resp)); // Json_ConvertJavaScriptToJson() allows comments in our Data/*.json files
            if (temp == null) {
                Log_WriteError('Error converting ' + dataName + ' sync state from server: ' + resp);
                return;
            }
            resp = temp.data;
        
            // added these so the content code doesn't need to check if they exist
            if (!resp.hasOwnProperty('messages')) {
                resp.messages = [];
            }
            if (!resp.hasOwnProperty('commands')) {
                resp.commands = [];
            }
            if (!resp.hasOwnProperty('contacts')) {
                resp.contacts = [];
            }
            if (!resp.hasOwnProperty('watched_posts')) {
                resp.watched_posts = [];
            }
            if (!resp.hasOwnProperty('watched_groups')) {
                resp.watched_groups = [];
            }

            if (!getBrandID()) {
                let syncKey = dataName + accountID;
                if (!SimulatedServer.hasOwnProperty(syncKey)) {
                    SimulatedServer[syncKey] = {
                        SentMessageIDs: [],
                        HandledCommandIDs: [],
                        LastSynced: null,
                        SyncData: null
                    };
                }
                let sync = SimulatedServer[syncKey];

                // in the local case we filter out items that have been handled and would have been removed by the live server
                resp.messages = resp.messages.filter(x => !sync.SentMessageIDs.includes(x.Uid));
                resp.commands = resp.commands.filter(x => !sync.HandledCommandIDs.includes(x.SyncCommandID));

                // in the local case we use saved items that would have come back to us from a live server
                resp.LastSynced = sync.LastSynced;
                resp.SyncData = sync.SyncData;
            }
        
            resolve(resp);
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

// NOTE: accountID only used in local dev case!
async function _getSyncsOfType(dataName, accountID) {
    return new Promise( (resolve, reject) => {
        var params = {
            'DataName': dataName
        };
        const url = getBrandID() == BrandID_LocalFile
           ? Environment.GetAssetUrl('Data/' + dataName + '_' + accountID + '.json')
           : getSyncUri();
    
        ajax.get(url, params, function(resp, httpCode)
        {
            if (httpCode != 200) {
                if (httpCode != 0 &&    // server not available - usually this is due to recent wake from sleep
                    httpCode != 401)    // logged out
                    Log_WriteError('Response ' + httpCode + ' from server for sync ' + dataName + ' account ' + accountID + ' _getSyncsOfType: ' + resp);
                resolve(null);  // error
                return;
            }
            
            resp = Json_FromString(Json_ConvertJavaScriptToJson(resp)); // Json_ConvertJavaScriptToJson() allows comments in our Data/*.json files
            resp = resp.data;
            
            resolve(resp);
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function _createSync(dataName, accountID, accountName) {
    assert(accountID != null);
    
    return new Promise( (resolve, reject) =>
    {
        let params ={
            DataName: dataName,
            AccountID: accountID,
            AccountName: accountName,
            AccessToken: 'unused'
        };
        ajax.post(getSyncUri(), params, function (resp, httpCode)
        {
            resp = Json_FromString(resp);
            resp = resp.data;
    
            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getServerState(dataName, accountID, accountName) {
    // let's see if we have a matching sync
    let sync = await _getSync(dataName, accountID, accountName);
    // the above returns null on error, empty object if there's no match
    if (sync != null && !sync.hasOwnProperty('SyncID')) {
        sync = null;    // what we'll return if the below fails

        // if we don't have a matching sync let's see if we have any syncs of this type
        let syncs = await _getSyncsOfType(dataName, accountID);
        // Returns an object with the SyncIDs as properties and the values are objects with more properties.

        // if we have at least one sync of this type then we're OK to create others of the same type without
        // asking the user - this is important for example with Instagram where you can have multiple accounts
        // linked together
        if (syncs && Object.keys(syncs).length > 0) {
            sync = await _createSync(dataName, accountID, accountName);
        }
        else {
            // the last sync for this data name was removed on the server
        
            for (let sourceName in Syncs) {
                for (let i in Syncs[sourceName].ScraperSyncs) {
                    if (Syncs[sourceName].ScraperSyncs[i] == dataName) {
                        Log_WriteError('Removing sync ' + dataName + ' account ' + accountID + ' due to sync removal on server, or user changing social accounts.');
                    
                        if (Syncs[sourceName].scraperTabs[i] != null) {
                            Log_WriteError('Removing tab for sync ' + dataName + ' account ' + accountID + ' due to sync removal on server, or user changing social accounts.');
                            Tabs.RemoveTab(Syncs[sourceName].scraperTabs[i].tabID);
                            Syncs[sourceName].scraperTabs[i] = null;
                        }
                    
                        Syncs[sourceName].lastCheck = 0;
                        Syncs[sourceName].syncState = null;
                        Utilities_RemoveFromArray(Syncs[sourceName].existingDataNames, dataName);
                    }
                }
            }
        }
    }
    
    return sync;
}

// syncData should be a JSON encoded string at this point, whereas the following parameters are objects
// DRL FIXIT? Maybe we should change the above so we're doing the encoding inside this method?
async function setServerState(dataName, accountID, currentCheck, syncData, messages, contact, command,
    groupMembers, groupQuestions) {
    assert(syncData == null || typeof syncData === 'string' || syncData instanceof String);
    return new Promise( (resolve, reject) => {
        if (!getBrandID()) {
            let syncKey = dataName + (accountID ? accountID : 'any');
            if (!SimulatedServer.hasOwnProperty(syncKey)) {
                SimulatedServer[syncKey] = {
                    SentMessageIDs: [],
                    HandledCommandIDs: [],
                    LastSynced: null,
                    SyncData: null
                };
            }
            let sync = SimulatedServer[syncKey];
            
            // in the local case we save some items that would come back to us from a live server
            if (messages != null) {
                for (let message of messages) {
                    if (message.hasOwnProperty('MessageID'))    // won't be there for incoming message being sent to server
                        sync.SentMessageIDs.push(message.MessageID);
                }
            }
            if (command != null)
                sync.HandledCommandIDs.push(command.SyncCommandID);
            if (currentCheck != null)
                sync.LastSynced = timestampToString(currentCheck);
            if (syncData != null)
                sync.SyncData = syncData;

            SimulatedServer[syncKey] = sync;

            resolve(null);
            return;
        }
    
        if (!navigator.onLine) {
            Log_WriteInfo('The browser appears to be offline, skipping sending server state.');
            resolve(null);
            return;
        }
    
        // I believe downloading posts is the only time we don't need an account ID
        assert(accountID != null || messages != null);
        
        let url = getSyncUri();
        var params = {
            'DataName': dataName
        };
        if (accountID != null)
            params.AccountID = accountID;
        if (currentCheck != null)
            params.LastSynced = timestampToString(currentCheck);
        if (syncData != null)
            params.SyncData = syncData;
        if (messages != null)
            params.messages = Json_ToString(messages);
        if (contact != null)
            params.contacts = Json_ToString([contact]);
        if (command != null)
            params.commands = Json_ToString([command]);
        if (groupMembers != null)
            params.groupMembers = Json_ToString(groupMembers);
        if (groupQuestions != null)
            params.groupQuestions = Json_ToString(groupQuestions);
        ajax.post(url, params, function(resp, httpCode)
        {
            if (httpCode != 200) {
                if (getBrandID() != BrandID_LocalFile &&
                    httpCode != 0 &&    // server not available - usually this is due to recent wake from sleep
                    httpCode != 401)    // logged out
                    Log_WriteError('Response ' + httpCode + ' from server for sync ' + dataName + ' account ' + accountID + ' setServerState: ' + resp);
                else
                    Log_WriteWarning('Response ' + httpCode + ' from server for sync ' + dataName + ' account ' + accountID + ' setServerState: ' + resp);
                resolve(null);
                return;
            }
            
            resp = Json_FromString(resp);

            resolve(resp);
        });
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

let isCreatingTab = false;
async function _createSyncTabs(sourceName, dataNames) {
    Log_WriteInfo('_createSyncTabs ' + sourceName + ' (' + dataNames.join(',') + ')');
    
    if (Utilities_ArrayContains(Syncs[sourceName].ScraperSyncs, activeDataName)) {
        Log_WriteInfo('Skipping creating tabs because one of them is the active tab (' + activeDataName + ') and therefore busy.');
        return;
    }
    if (isCreatingTab) {
        // DRL FIXIT? I added this check to try and catch a scenario I saw where we created multiple tabs.
        Log_WriteError('Skipping creating tabs because we are in the process of creating a tab!');
        return;
    }
    
    for (let i in Syncs[sourceName].ScraperSyncs) {
        let dataName = Syncs[sourceName].ScraperSyncs[i];
        let url = Syncs[sourceName].InitialScraperUrls[i] + '*';    // use substring matching
        
        if (Utilities_ArrayContains(dataNames, dataName)) {
            // we want the tabs created in sequence in case the window needs to be created in which
            // case we don't want to accidentally end up with multiple windows created
            isCreatingTab = true;
            await createTab(dataName, 'GET', url, {}, true, false)
                .then(tabID => {
                    Log_WriteInfo('Using tab ' + tabID + ' for ' + dataName);
                    // it looks like if the user closes the sync tab this assert will go off?
                    if (Syncs[sourceName].scraperTabs[i] != null && Syncs[sourceName].scraperTabs[i].tabID != tabID) {
                        Log_WriteError('Existing tab doesn\'t match on tabID:' + GetVariableAsString(Syncs[sourceName].scraperTabs[i]));
                    }
                    if (Syncs[sourceName].scraperTabs[i] == null)
                        Syncs[sourceName].scraperTabs[i] = {
                            tabID: tabID,
                            lastRunTime: 0,
                            lastActivity: Date.now(),
                            lastActivityStage: 0,
                            throttledTypes: [],
                            throttledSince: null
                        };
                    isCreatingTab = false;
                })
                .catch(e => {
                    Log_WriteException(e);
                    isCreatingTab = false;
                    throw e;
                });
        }
    }
}

async function _createReadySyncTabs() {
    for (let sourceName in Syncs) {
        if (Syncs[sourceName].syncState == 'sync_ready' && userHasFeature(Syncs[sourceName].RequiresFeature)) {
            // we want the tabs created in sequence in case the window needs to be created in which
            // case we don't want to accidentally end up with multiple windows created
            await _createSyncTabs(sourceName, Syncs[sourceName].existingDataNames)
                .then(response => {})
                .catch(e => { Log_WriteException(e); throw e; });
        }
    }
}

function __hasAccessToSyncSource(sourceName) {
    return getBrandID() == BrandID_LocalFile || userHasFeature(Syncs[sourceName].RequiresFeature);
}

function _hasAccessToSync(dataName) {
    if (!getBrandID()) return true;
    
    for (let sourceName in Syncs) {
        for (let i in Syncs[sourceName].ScraperSyncs) {
            if (Syncs[sourceName].ScraperSyncs[i] == dataName) {
                return userHasFeature(Syncs[sourceName].RequiresFeature);
            }
        }
    }
    
    assert(0);
    return false;
}

async function checkDataSource(sourceName) {
    return new Promise( (resolve, reject) => {
        if (!getBrandID()) {
            let result = {
                brandName: getBrand().Name,
                sourceName: sourceName
            };
            // if there's a busy sync skip any checks
            if (activeDataName) {
                if (Syncs[sourceName].syncState != null)
                    result.type = Syncs[sourceName].syncState;
                else
                    result.type = 'sync_skip';
                resolve(result);
                return;
            }
            
            // local development case, create them all
            _createSyncTabs(sourceName, Syncs[sourceName].ScraperSyncs)
                .then(response => {
                    Syncs[sourceName].syncState = 'sync_ready';
                    result.type = 'sync_ready';
                    resolve(result);
                })
                .catch(e => {
                    Log_WriteException(e);
                    result.type = Syncs[sourceName].syncState = 'sync_skip';
                    resolve(result);
                });
            return;
        }
    
        let now = Date.now();
        let result = {
            brandName: getBrand().Name,
            sourceName: sourceName
        };

        if (!__hasAccessToSyncSource(sourceName)) {
            Log_WriteInfo('No access to sync ' + sourceName);
            result.type = Syncs[sourceName].syncState = 'sync_skip';
            resolve(result);
            return;
        }
        
        // for a ready sync check once per hour in case anything got removed, otherwise check every
        // 5 minutes, and when not checking just return the previous state
        let delay = Syncs[sourceName].existingDataNames == Syncs[sourceName].dataNames
           ? timings.READY_SYNC_CHECK_DELAY
           : timings.MISSING_SYNC_CHECK_DELAY;
        if (now - Syncs[sourceName].lastCheck <= delay * 1000) {
            result.type = Syncs[sourceName].syncState;
            resolve(result);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        Syncs[sourceName].lastCheck = now - (delay / 5 * 1000);
        
        // DRL FIXIT! This handling assumes one social media account per type, but a user is very likely
        // to have more than one Instagram account for example!
        // DRL NOTE: I believe the multiple account case is now handled automatically in that when a
        // sync is requested but we don't have one for that account but we do have one for another account
        // we create the sync for that account automatically on the server?
    
        let params = {
            DataNames: Syncs[sourceName].ScraperSyncs.concat(Syncs[sourceName].PollingSyncs).join(',')
        };
        
        ajax.get(getSyncUri(), params, function(resp, httpCode)
        {
            resp = Json_FromString(resp);
    
            Syncs[sourceName].lastCheck = now;
            
            if (resp && (resp.result_code == 200 || resp.result_code == 404)) {
                var dataNames = [];
                if (resp.result_code == 200) {
                    for (var syncID in resp.data) {
                        // we add it here even if the AccountID is null as it'll get set after we create the tab for it
                        dataNames.push(resp.data[syncID].DataName);
                    }
                }
                Utilities_ArrayRemoveDuplicates(dataNames);
                Syncs[sourceName].existingDataNames = dataNames;
                
                // create the tabs for the syncs we have
                _createSyncTabs(sourceName, Syncs[sourceName].existingDataNames)
                    .then(response => {
    
                        // the sync is ready if we have any scrapers ready
                        Syncs[sourceName].syncState = Utilities_ArraysMeet(Syncs[sourceName].ScraperSyncs, dataNames)
                           ? 'sync_ready' : 'sync_skip';
    
                        // if we are missing some syncs for this source we can ask the user if he wants to add them
                        let temp = Syncs[sourceName].ScraperSyncs.concat(Syncs[sourceName].PollingSyncs);
                        Utilities_RemoveFromArray(temp, dataNames);

                        if (temp.length > 0 &&
                            // the user hasn't refused to link this sync in the past day
                            now - Syncs[sourceName].lastLinkOfferRefused > timings.LINK_SYNC_REFUSED_REOFFER * 1000) {
                            Syncs[sourceName].syncState = 'offer_sync';
                        }
                        
                        result.type = Syncs[sourceName].syncState;
                        resolve(result);
                    })
                    .catch(e => {
                        Log_WriteException(e);
                        resolve(null);
                    });
            }
            else {
                if (resp == null || httpCode == 0) {
                    // server unavailable, network error, etc.
                    Log_WriteWarning('Server is not available when requesting syncs ' + params.DataNames);
                }
                else if (resp.result_code != 401)
                    Log_WriteError('Syncs got ' + (resp ? resp.result_code : 'null') + ' result when requesting ' + params.DataNames);
                result.type = Syncs[sourceName].syncState = 'sync_skip';
                resolve(result);
            }
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function linkDataSourceRefused(sourceName) {
    Log_WriteError('Refused to link ' + sourceName);
    Syncs[sourceName].lastLinkOfferRefused = Date.now();
    
   // the sync is ready if we have any scrapers ready
   Syncs[sourceName].syncState = Utilities_ArraysMeet(Syncs[sourceName].ScraperSyncs, Syncs[sourceName].existingDataNames)
      ? 'sync_ready' : 'sync_skip';
}

function _linkScraperSyncsOnly(sourceName, dataNames, resolve){
    if (Utilities_ArraysMeet(dataNames, Syncs[sourceName].ScraperSyncs))
    {
        // exclude polling syncs as they are handled separately
        Utilities_RemoveFromArray(dataNames, Syncs[sourceName].PollingSyncs);
        // this creates the syncs "empty" so the next time the scraper tries to access each one it will
        // take it over and fill in the account ID and name
        let params = {
            DataNames: dataNames.join(',')
        };
        ajax.post(getSyncUri(), params, function (resp, httpCode)
        {
            resp = Json_FromString(resp);
    
            Syncs[sourceName].lastCheck = null; // allow the sync to be loaded right away without a delay
    
            // load the sync(s) just created so the tab(s) will be created on the timer
            checkDataSource(sourceName)
                .then(resp => resolve(null))
                .catch(e => {
                    Log_WriteException(e);
                    resolve(null);
                });
        });
    }
    else
        resolve(null);
}

async function linkDataSource(sourceName) {
    return new Promise( (resolve, reject) => {
        Syncs[sourceName].lastLinkOfferRefused = 0;
        Syncs[sourceName].lastCheck = 0;
    
        let dataNames = Syncs[sourceName].ScraperSyncs.concat(Syncs[sourceName].PollingSyncs);
        Utilities_RemoveFromArray(dataNames, Syncs[sourceName].existingDataNames);

        if (Utilities_ArraysMeet(dataNames, Syncs[sourceName].PollingSyncs)) {
            // if a polling sync is one of the missing ones we will send the user to the login page for it
            createTab('SyncPage', 'GET', Form_MainUri, {
                'FormProcessor': 'SyncPreLogin',
                'DataName': sourceName,
                'ReferralUrl': syncsPageUrl()
            }, false, false)
            .then(resp => {
                // also handle scraper syncs
                _linkScraperSyncsOnly(sourceName, dataNames, resolve);
            })
            .catch(e => {
                Log_WriteException(e);
                resolve(null);
            });
        }
        else {
            _linkScraperSyncsOnly(sourceName, dataNames, resolve);
        }
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getSyncAccountID(dataName) {
    return new Promise( (resolve, reject) => {
        if (!getBrandID()) {
            // local development case
            resolve('acct_' + dataName);
            return;
        }
    
        // DRL FIXIT! We should cache this request and only re-check every minute or so!
    
        const params = {
            DataName: dataName
        };
        ajax.get(getSyncUri(), params, function(resp, httpCode)
        {
            resp = Json_FromString(resp);
    
            if (!resp.hasOwnProperty('data')) {
                resolve(null);
                return;
            }
    
            // the data contains properties for each account
            assert(resp.data.length == 1);  // should never have more than one account
            for (var accountId in resp.data) {
                resolve(accountId);
            }
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}


// contactIDs is "in/out"
function parseContactFetches(commands, contactIDs, sendResponse) {
    if (UserHasFeature(UserFeaturesSyncContacts) && Object.keys(commands).length > 0) {
        let added = false;
        for (let command of Object.values(commands)) {
            if (command.SyncCommand == 'FetchContact') {
                contactIDs[command.SyncCommandID] = command.ExternalContactID;
                added = true;
            }
        }
        if (added) {
            // contacts will be fetched the next time around (this simplifies the code)
            sendResponse({action: 'retry'});
            return true;
        }
    }
    
    return false;
}

let lastFetchAttempted = {};

// the URL must have "{contact_id}" in it!
function initiateContactFetch(sender, dataName, accountID, contactIDs, url, sendResponse) {
    if (Object.keys(contactIDs).length == 0)
        return false;
    
    // DRL FIXIT! We should incorporate the ActionCheck.js functionality.

    let syncCommandID = parseInt(Object.keys(contactIDs)[0]);   // keys are always strings and this ID is an integer, so convert
    let contactID = contactIDs[syncCommandID];
    let handle = Url_GetEmailPrefix(contactID);
    let contactUrl = Utilities_ReplaceInString(url, '{contact_id}', handle);
    
    // For some sites (like Facebook) the eventual URL could be different than what we requested, for
    // example we start off with a numeric ID and the final URL points to a username, so we have to
    // compare with the final URL.
    getFinalUrl(contactUrl)
    .then(finalContactUrl => {
        if (fuzzyUrlsMatch(sender.url, finalContactUrl)) {
            delete contactIDs[syncCommandID];
            delete lastFetchAttempted[dataName];
            Log_WriteInfo('getContact ' + handle + ' (' + syncCommandID + ') from ' + sender.url);
            sendResponse({ action: 'getContact', accountID: accountID, syncCommandID: syncCommandID, contactID: contactID });
        }
        else {
            // if the contact was not found we would get stuck in an endless loop so here we check
            // and if we've already attempted to navigate to the contact and failed skip it
            while (handle != null && lastFetchAttempted.hasOwnProperty(dataName) && handle == lastFetchAttempted[dataName]) {
                Log_WriteError('Unable to fetch contact ' + contactIDs[syncCommandID] + ' from ' + dataName +
                   ' original URL ' + contactUrl + ' final URL ' + finalContactUrl);
                sendCommandError(dataName, accountID, syncCommandID, Str('Unable to find contact "<0>" on <1>.',
                   handle, Utilities_ReplaceInString(dataName, 'Scrape', '')));
                delete contactIDs[syncCommandID];
                if (Object.keys(contactIDs).length > 0) {
                    syncCommandID = parseInt(Object.keys(contactIDs)[0]);   // keys are always strings and this ID is an integer, so convert
                    handle = Url_GetEmailPrefix(contactIDs[syncCommandID]);
                }
                else {
                    handle = null;
                }
            }
            lastFetchAttempted[dataName] = handle;
            if (handle != null) {
                contactUrl = Utilities_ReplaceInString(url, '{contact_id}', handle);
                Log_WriteInfo('Switching to profile URL: ' + contactUrl);
                Tabs.SetTabUrl(sender.tab.id, contactUrl);
    
                // we have to wait for the page to navigate to the contact URL
                sendResponse({action: 'reload'});
            }
            else {
                // we have no more contacts to fetch
                sendResponse({action: 'retry'});
            }
        }
    })
    .catch(e => { Log_WriteException(e); throw e; });
    
    return true;
}

function sendCommandError(dataName, accountID, syncCommandID, errorMessage) {
    setServerState(dataName, accountID, null, null, null, null, {
        SyncCommandID: syncCommandID,
        ErrorMessage: errorMessage
    })
    .then(response => {})
    .catch(e => { Log_WriteException(e); throw e; });
}