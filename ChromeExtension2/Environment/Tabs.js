let Tabs =
{
   ACTIVE_WINDOW: -1,
   CREATE_WINDOW: null,
   
   _activeTabChangedHandlers: {},
   _ActiveTabChangedHandler: function(activeInfo)
   {
      if (Tabs._activeTabChangedHandlers.hasOwnProperty(activeInfo.tabId)) {
         Tabs._activeTabChangedHandlers[activeInfo.tabId](activeInfo.tabId);
         delete Tabs._activeTabChangedHandlers[activeInfo.tabId];
      }
   },
   
   _focusedWindowChangedHandlers: {},
   _FocusedWindowChangedHandler: function(windowId)
   {
      if (Tabs._focusedWindowChangedHandlers.hasOwnProperty(windowId)) {
         Tabs._focusedWindowChangedHandlers[windowId](windowId);
         delete Tabs._focusedWindowChangedHandlers[windowId];
      }
   },
   
   TabCreatedCallbackInvoker: function(tabId)
   {
      // console.log("TabCreatedCallbackInvoker", AddTabCreatedHandlers);
      if (AddTabCreatedHandlers.length > 0)
      {
         AddTabCreatedHandlers.forEach(function (handler)
         {
            handler(tabId);
         })
      }
   },
   
   TabRemovedCallbackInvoker: function (tabId)
   {
      // console.log("TabRemovedCallbackInvoker", AddTabRemovedHandlers);
      if (AddTabRemovedHandlers.length > 0)
      {
         AddTabRemovedHandlers.forEach(function (handler)
         {
            handler(tabId);
         })
      }
   },
   
   WindowCreatedCallbackInvoker: function (windowId)
   {
      // console.log("AddWindowCreatedHandlers", AddWindowCreatedHandlers);
      if (AddWindowCreatedHandlers.length > 0)
      {
         AddWindowCreatedHandlers.forEach(function (handler)
         {
            handler(windowId);
         });
      }
   },
   
   WindowRemovedCallbackInvoker: function (windowId)
   {
      // console.log("AddWindowRemovedHandlers", AddWindowRemovedHandlers);
      if (AddWindowRemovedHandlers.length > 0)
      {
         AddWindowRemovedHandlers.forEach(function (handler)
         {
            handler(windowId);
         });
      }
   },
   
   AddTabAttachedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.onAttached.addListener(function(tabId, attachInfo)
         {
            handler(tabId);
         });
      }
      else
      {
         // this is the app background script: we don't attach tabs in this case
      }
   },
   
   AddTabDetachedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.onAttached.addListener(function(tabId, detachInfo)
         {
            handler(tabId);
         });
      }
      else
      {
         // this is the app background script: we don't attach tabs in this case
      }
   },
   
   AddTabCreatedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.onCreated.addListener(function(tab)
         {
            handler(tab.id);
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('AddTabCreatedListener() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   AddTabRemovedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.onRemoved.addListener(function(tabId, removeInfo)
         {
            handler(tabId);
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('AddTabRemovedListener() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   AddTabMovedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.onMoved.addListener(function(tabId, moveInfo)
         {
            handler(tabId);
         });
      }
      else
      {
         // this is the app background script: we don't move tabs in this case
      }
   },
   
   AddTabReplacedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId)
         {
            handler(addedTabId, removedTabId);
         });
      }
      else
      {
         // this is the app background script: we don't replace tabs in this case
      }
   },
   
   AddWindowCreatedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.windows.onCreated.addListener(function(window)
         {
            handler(window.id);
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('AddWindowCreatedListener() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   AddWindowRemovedListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.windows.onRemoved.addListener(function(windowId)
         {
            handler(windowId);
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('AddWindowRemovedListener() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   // windowID can also be ACTIVE_WINDOW or CREATE_WINDOW
   // new tab should be created such that if it is closed the old tab is shown when possible
   CreateTab: function(windowID, url, focused, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script

         let activeWindowID = null;

         let handleTabLoaded = function(tab)
         {
            if (tab == null) {
               Log_WriteError('Error creating tab with url: ' + url);
               if (handler) handler(null);
               return;
            }
      
            let updateHandler = function(tabID, changeInfo, tab2)
            {
               let lastError = chrome.runtime.lastError;
               if (lastError != null) {
                  Log_WriteError('Tab ' + tabID + ' got error in CreateTab() updating tab: ' + lastError.message);
               }
   
               if (tabID == tab.id && changeInfo.status === 'complete')
               {
                  chrome.tabs.onUpdated.removeListener(updateHandler);
   
                  let info = {
                     id: tab2.id,
                     windowId: tab2.windowId,
                     url: tab2.url
                  }
                  if (handler) handler(info);
               }
            }
      
            // in case we're faster than page load (usually):
            chrome.tabs.onUpdated.addListener(updateHandler);
      
            // just in case we're too late with the listener, or the tab was pre-existing:
            if (tab.status == 'complete') {
               let info = {
                  id: tab.id,
                  windowId: tab.windowId,
                  url: tab.url
               }
               if (handler) handler(info);
            }
         }
   
         let handleWindowCreated = function(window)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Got error in CreateTab() when creating window: ' + lastError.message);
            }
   
            if (window == null) {
               Log_WriteError('Error creating window with url: ' + url);
               if (handler) handler(null);
               return;
            }
   
            let info = {
               id: window.tabs[0].id,
               windowId: window.id,
               url: window.tabs[0].url
            }

            if (!focused && activeWindowID && Browser.GetOS() == 'Windows') {
               // on Windows the window seems to always be created in front so this
               // will work around that issue
               chrome.windows.update(activeWindowID, {focused: true}, function()
               {
                  let lastError = chrome.runtime.lastError;
                  if (lastError != null) {
                     Log_WriteError('Got error in CreateTab() when activating window: ' + lastError.message);
                  }
   
                  if (handler) handler(info);
               });
            }
            else
               if (handler) handler(info);
         }

         // get the active window so we can restore it to workaround a Windows issue
         chrome.windows.getLastFocused(function(window) {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Got error in CreateTab() when getting focused window: ' + lastError.message);
            }
            
            if (window)
               activeWindowID = window.id;

            if (windowID == Tabs.CREATE_WINDOW)
            {
               chrome.windows.create({focused: focused, url: url}, handleWindowCreated);
            }
            else if (windowID == Tabs.ACTIVE_WINDOW)
            {
               // we want the new tab to be opened before the current active tab so that when it
               // is closed the old active tab becomes the active one again
               chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                  let lastError = chrome.runtime.lastError;
                  if (lastError != null) {
                     Log_WriteError('Got error in CreateTab() when getting active tab: ' + lastError.message);
                  }
   
                  if (tabs.length == 0) Log_WriteError('While creating new tab couldn\'t get current tab!');
                  let index = tabs.length > 0 ? tabs[0].index : 0;
                  chrome.tabs.create({active: focused, url: url, index: index}, handleTabLoaded);
               });
            }
            else
            {
               chrome.tabs.create({windowId: windowID, active: focused, url: url}, handleTabLoaded);
            }
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('CreateTab() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   SetTabUrl: function(tabID, url, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.update(parseInt(tabID), {url: url}, function(tab)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Tab ' + tabID + ' got error in SetTabUrl(): ' + lastError.message);
            }
   
            if (tab == null) {
               if (handler) handler({id: tabID, windowId: null, url: null});
               return;
            }
            
            let info = {
               id: tabID,
               windowId: tab.windowId,
               url: tab.url   // NOTE: The tab won't have been loaded with the new URL yet, so this will be the old one.
            }
            if (handler) handler(info);
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('SetTabUrl() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   SetTabMuted: function(tabID, muted)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         // DRL FIXIT! This doesn't appear to work? It's still not muted and the "muted" flag isn't set when we check it.
         chrome.tabs.update(parseInt(tabID), {muted: muted});
      }
      else
      {
         // this is the app background script
         Log_WriteError('SetTabMuted() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   ReloadTab: function(tabID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.reload(parseInt(tabID), function()
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Tab ' + tabID + ' got error in ReloadTab(): ' + lastError.message);
            }
   
            if (handler) handler();
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('ReloadTab() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   SetActiveTab: function(tabID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
   
         if (handler)
            Tabs._activeTabChangedHandlers[tabID] = handler;
   
         chrome.tabs.update(parseInt(tabID), {active: true}, function(tab)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Tab ' + tabID + ' got error during SetActiveTab: ' + lastError.message);
               if (Tabs._activeTabChangedHandlers.hasOwnProperty(tabID)) {
                  Tabs._activeTabChangedHandlers[tabID](null);
                  delete Tabs._activeTabChangedHandlers[tabID];
               }
            }
            if (tab && tab.active) {
               // tab was already active, so the active changed handler won't fire, so do this here instead
               if (Tabs._activeTabChangedHandlers.hasOwnProperty(tabID)) {
                  Tabs._activeTabChangedHandlers[tabID](tabID);
                  delete Tabs._activeTabChangedHandlers[tabID];
               }
            }
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('SetActiveTab() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   RemoveTab: function(tabID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.remove(parseInt(tabID), function()
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Tab ' + tabID + ' got error in RemoveTab(): ' + lastError.message);
            }
   
            if (handler) handler();
         });
      }
      else
      {
         // this is the app background script
         
         Messaging.SendMessageToNativeApp({type: "#SA#-native-removeTab", value: tabID}, function (response)
         {
            if (response.value.deleted === true)
            {
               // console.log(`Tab with id ${tabID} removed.`);
               if (handler) handler();
               Tabs.TabRemovedCallbackInvoker(tabID);
               if (response.value.isWindowDeleted === true)
               {
                  Tabs.WindowRemovedCallbackInvoker(response.value.windowId)
               }
            }
            else
            {
               Log_WriteError("Tab " + tabID + " could not be removed.");
            }
         });
      }
   },
   
   RemoveWindow: function(windowID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.windows.remove(parseInt(windowID), function()
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Window ' + windowID + ' got error in RemoveWindow(): ' + lastError.message);
            }
            
            if (handler) handler();
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('RemoveWindow() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
   
   // returns id, url and active only for now
   GetTab: function(tabID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
   
         // we have to get all the windows so we can calculate the index
         chrome.tabs.query({windowType: 'normal'}, function(tabs)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Tab ' + tabID + ' got error in GetTab(), will reschedule and try again later: ' + lastError.message);
               Tabs.GetTab(tabID, handler);
               return;
            }
   
            // NOTE: We don't use the Chrome tab index as this restarts at 0 for each window, instead we use
            // our own index which spans across all windows so it's unique.
            let index = 0;
   
            let info = {
               id: tabID,
               windowId: null,
               index: null,
               url: null,
               active: null};
            
            for (let tab of tabs)
            {
               if (tab.id == tabID)
               {
                  info = {
                     id: tab.id,
                     windowId: tab.windowId,
                     index: index,
                     url: tab.url,
                     active: tab.active
                  };
               }
               index++;
            }
            
            if (handler) handler(info);
         });
      }
      else
      {
         // this is the app background script
   
         Messaging.SendMessageToNativeApp({type: "#SA#-native-getTab", value: tabID}, function (response)
         {
            if (response.value)
            {
               if (handler) handler(response.value);
            }
            else
            {
               Log_WriteError("Tab " + tabID + " not found to remove.");
            }
         });
      }
   },
   
   // returns array of tabs each with id, url, active, windowId and a unique index
   GetAllTabs: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.query({windowType: 'normal'}, function(tabs)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Error querying tabs, will reschedule and try again later: ' + lastError.message);
               Tabs.GetAllTabs(handler);
               return;
            }
   
            // NOTE: We don't use the Chrome tab index as this restarts at 0 for each window, instead we use
            // our own index which spans across all windows so it's unique.
            let index = 0;
   
            let data = [];
            
            for (let tab of tabs)
            {
               let info = {
                  id: tab.id,
                  windowId: tab.windowId,
                  index: index,
                  url: tab.url,
                  active: tab.active
               };
               data.push(info);
               index++;
            }

            if (handler) handler(data);
         });
      }
      else
      {
         // this is the app background script
   
         Messaging.SendMessageToNativeApp({type: "#SA#-native-getAllTabs"}, function (response)
         {
            if (response.value)
            {
               if (handler) handler(response.value);
            }
            else
            {
               Log_WriteError("No tabs found.");
            }
         });
      }
   },
/* Not needed.
   // returns array of windows each with windowId, focused and state
   GetAllWindows: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.windows.getAll(function(windows)
         {
            let data = [];
            
            for (let window of windows)
            {
               let info = {
                  windowId: window.id,
                  focused: window.focused,
                  state: window.state
               };
               data.push(info);
            }
            if (handler) handler(data);
         });
      }
      else
      {
         // this is the app background script
         
         Messaging.SendMessageToNativeApp({type: "#SA#-native-getAllWindows"}, function (response)
         {
            if (response.value)
            {
               if (handler) handler(response.value);
            }
            else
            {
               Log_WrieError("No windows found.");
            }
         });
      }
   },
*/
   // focusedSecondsOrBool controls the window focus (true, false, or number of seconds)
   // handlerFocused is not called if focusedSecondsOrBool is false
   // handlerRestored is not called if focusedSecondsOrBool is a bool
   SetWindowNormal: function(windowID, focusedSecondsOrBool, minWidth, handlerFocused, handlerRestored)
   {
Log_WriteInfo('Setting window ' + windowID + ' with focus: ' + focusedSecondsOrBool);
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.windows.getAll(function(windows)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Got error in SetWindowNormal() when getting all windows: ' + lastError.message);
            }
   
            let focused = focusedSecondsOrBool === true ||
               (focusedSecondsOrBool !== false && focusedSecondsOrBool > 0);
            
            // find the currently focused window, or any other window if the sync window is focused
            let focusedID = null;
            let anyID = windowID;
            for (let i in windows) {
               if (windows[i].focused)
                  focusedID = windows[i].id;
               else if (windows[i].id != windowID)
                  anyID = windows[i].id;
         
               if (windows[i].id == windowID) {
                  if (windows[i].state == 'normal' && windows[i].focused == focused && windows[i].width >= minWidth) {
                     // the requested window is already in an acceptable state
                     if (handlerFocused) handlerFocused(windowID);
                     if (handlerRestored) handlerRestored(windowID);
                     return;
                  }
                  
                  if (minWidth === null || windows[i].width > minWidth)
                     minWidth = windows[i].width;
               }
            }
            if (focusedID == null)
               focusedID = anyID;
   
            if (handlerFocused && focused)
               Tabs._focusedWindowChangedHandlers[windowID] = handlerFocused;
            
            chrome.windows.update(windowID, {state: 'normal', focused: focused, width: minWidth}, function()
            {
               let lastError = chrome.runtime.lastError;
               if (lastError != null) {
                  Log_WriteError('Window ' + windowID + ' got error during SetWindowNormal: ' + lastError.message);
               }

               if (focusedSecondsOrBool !== true && focusedSecondsOrBool !== false)
               {
                  // restore the previously focused window so we're not interrupting the user too much
                  setTimeout(function()
                  {
                     try {
                        chrome.windows.update(focusedID, {focused: true}, function()
                        {
                           let lastError = chrome.runtime.lastError;
                           if (lastError != null) {
                              Log_WriteError('Window ' + focusedID + ' got error during SetWindowNormal restore: ' + lastError.message);
                           }
                           
                           assert(!Tabs._focusedWindowChangedHandlers.hasOwnProperty(windowID));
                           delete Tabs._focusedWindowChangedHandlers[windowID];
                           if (handlerRestored) handlerRestored(windowID);
                        });
                     }
                     catch (e) {
                        Log_WriteException(e);
                     }
                  }, focusedSecondsOrBool > 0 ? focusedSecondsOrBool * 1000 : 10);
               }
            });
         });
      }
      else
      {
         // this is the app background script

         Log_WriteError('SetWindowNormal() not implemented!');  // DRL FIXIT! Implement this for app!
         // We will likely fake two windows here, perhaps ID=1 for
         // the user tabs/webviews and ID=2 for the scraper tabs/webviews, and we'll assume the
         // user window will always have the focus.
      }
   },
   
   IsTabIdle: function(tabID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.get({tabId: parseInt(tabID)}, function(tab)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Tab ' + tabID + ' got error in IsTabIdle(): ' + lastError.message);
               if (handler) handler(false);
               return;
            }
   
            chrome.idle.queryState(timings.BROWSER_IDLE_TIME, function(state) {
               if (handler) handler(state != 'active' || !tab.active);
            });
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('IsTabIdle() not implemented!');  // DRL FIXIT! Implement this for app!
         if (handler) handler(false);
      }
   },
   
   // returns PNG image data (encoded as base64) of active tab in specified window, or null on error
   CaptureWindow: function(windowID, handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
   
         chrome.tabs.captureVisibleTab(parseInt(windowID), {format: "png"}, function (dataUrl)
         {
            let lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Window ' + windowID + ' got error in CaptureWindow(): ' + lastError.message);
               if (handler) handler(null);
               return;
            }

            if (dataUrl == null)
            {
               Log_WriteError('Window ' + windowID + ' got no data in CaptureWindow()');
               if (handler) handler(null);
               return;
            }
            
            assert(dataUrl.startsWith('data:image/png;base64,'));
            let data = dataUrl.substr(22);
            data = data.replace(' ', '+');
// decoding it here seemed to cause issues so we decode it on the server instead
//                data = atob(data);
            if (handler) handler(data);
         });
      }
      else
      {
         // this is the app background script
         Log_WriteError('CaptureWindow() not implemented!');  // DRL FIXIT! Implement this for app!
         if (handler) handler(null);
      }
   },
   
   ExecuteScriptInTab: function (tabID, script)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.tabs.executeScript(tabID, {code: script});
      }
      else
      {
         // this is the app background script
         Log_WriteError('ExecuteScriptInTab() not implemented!');  // DRL FIXIT! Implement this for app!
      }
   },
};

if (Browser.IsExtension())
{
   chrome.tabs.onActivated.addListener(Tabs._ActiveTabChangedHandler);
   chrome.windows.onFocusChanged.addListener(Tabs._FocusedWindowChangedHandler);
}