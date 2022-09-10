let Storage =
{
   localValuesName: undefined,
   localValues: null,
   tabValuesName: undefined,
   tabValues: null,
   
   _MassageKeys: function(section, keys)
   {
      if (!Array.isArray(keys)) keys = [keys];

      let result = [];
      for (let key of keys)
      {
         result.push(section + '.' + key);
      }
      return result;
   },
   
   _MassageData: function(section, keys, data)
   {
      if (!Array.isArray(keys)) keys = [keys];
   
      for (let key of keys)
      {
         let massagedKey = section + '.' + key;
         if (data.hasOwnProperty(key))
         {
            data[massagedKey] = data[key];
            delete data[key];
         }
      }
      return data;
   },
   
   _UnmassageData: function(section, keys, data)
   {
      if (!Array.isArray(keys)) keys = [keys];
   
      for (let key of keys)
      {
         let massagedKey = section + '.' + key;
         if (data.hasOwnProperty(massagedKey))
         {
            data[key] = data[massagedKey];
            delete data[massagedKey];
         }
      }
      return data;
   },
   
   // this standard storage is shared across the extension
   // keys can be a single string or an array of strings, returns an object with each key that was found
   GetStorage: function(section, keys, handler)
   {
      let massagedKeys = Storage._MassageKeys(section, keys);
   
      if (Browser.IsExtension())
      {
         // should never be called by the content script except for our internal use
         assert(Browser.IsExtensionBackground() || ['LocalValues', 'TabValues'].includes(section))
         
         chrome.storage.local.get(massagedKeys, function(data)
         {
            var lastError = chrome.runtime.lastError;
            if (lastError != null)
            {
               Log_WriteError('Error getting local storage in section "' + section + '": ' + lastError.message);
               assert(data == null);
               data = {};
            }
            
            data = Storage._UnmassageData(section, keys, data);
            
            if (handler) handler(data);
         });
      }
      else
      {
         Messaging.SendMessageToNativeApp({type: 'native-getStorage', value: massagedKeys}, function (data)
         {
            let response = data.value || null;
            if (response)
            {
               response = Storage._UnmassageData(section, keys, response);
            }
      
            if (handler) handler(response);
         });
      }
   },
   
   // data contains key/value pairs to be set, doesn't affect other existing key/value pairs
   SetStorage: function(section, data, handler)
   {
      if (Browser.IsExtension())
      {
         // should never be called by the content script except for our internal use
         assert(Browser.IsExtensionBackground() || ['LocalValues', 'TabValues'].includes(section))
         
         data = Storage._MassageData(section, Object.keys(data), data);
         
         chrome.storage.local.set(data, function()
         {
            var lastError = chrome.runtime.lastError;
            if (lastError != null)
            {
               Log_WriteError('Error setting local storage in section "' + section + '": ' + lastError.message);
            }
            
            if (handler) handler();
         });
      }
      else
      {
         Messaging.SendMessageToNativeApp({type: 'native-setStorage', value: data}, function (data)
         {
            if (handler && data) handler();
         });
      }
   },
   
   // keys can be a single string or an array of strings
   RemoveStorage: function(section, keys, handler)
   {
      let massagedKeys = Storage._MassageKeys(section, keys);
   
      if (Browser.IsExtension())
      {
         // should never be called by the content script except for our internal use
         assert(Browser.IsExtensionBackground() || ['LocalValues', 'TabValues'].includes(section))
         
         chrome.storage.local.remove(massagedKeys, function() {
            var lastError = chrome.runtime.lastError;
            if (lastError != null) {
               Log_WriteError('Error removing local storage in section "' + section + '": ' + lastError.message);
            }
            
            if (handler) handler();
         });
      }
      else
      {
         Messaging.SendMessageToNativeApp({type: 'native-removeStorage', value: massagedKeys}, function (result)
         {
            if (handler) handler(result);
         });
      }
   },
   
   GetAllKeys: function (handler)
   {
      if (Browser.IsExtension())
      {
         assert(0);
         return;
      }
      
      Messaging.SendMessageToNativeApp({type: 'native-getAllStorageKeys'}, function (result)
      {
         let response = (result && result.value) || [];
         if (handler) handler(response);
      });
   },

   // local vars are distinct between the background and content scripts
   GetLocalVar: function(section, initializer)
   {
      if (this.localValues == null)
      {
         Log_WriteError('Storage "localValues" is not yet initialized! Faking it for now...')
         this.localValues = {};
      }
      
      if (!(section in this.localValues))
         return Utilities_DeepClone(initializer);
      
      return this.localValues[section];
   },
   
   // local vars are distinct between the background and content scripts
   SetLocalVar: function(section, value)
   {
      if (this.localValues == null)
      {
         Log_WriteError('Storage "localValues" is not yet initialized! Faking it for now...')
         this.localValues = {};
      }
   
      if (value === undefined)
         delete this.localValues[section];
      else
         this.localValues[section] = value;

      if (Browser.IsExtension())
      {
         // this process can be shut down at any time so we must store the local data so it can be restored later
         
         if (this.localVarTimer)
            clearTimeout(this.localVarTimer);
         this.localVarTimer = setTimeout(function ()
         {
            this.localVarTimer = null;
            try
            {
               chrome.storage.local.set({[Storage.localValuesName]: Storage.localValues}, function ()
               {
                  Log_WriteInfo('Saved local values');
               });
            }
            catch (e)
            {
               Log_WriteException(e);
            }
         }, 1);
      }
   },
   
   // tab vars are distinct to a specific tab and can only be used from a content script
   GetTabVar: function(section, initializer)
   {
      if (this.tabValues == null)
         assert(0);  // haven't loaded tab data yet
      
      if (!(section in this.tabValues))
         return Utilities_DeepClone(initializer);
      
      return this.tabValues[section];
   },
   
   // tab vars are distinct to a specific tab and can only be used from a content script
   SetTabVar: function(section, value)
   {
      if (this.tabValues == null)
         assert(0);  // haven't loaded local data yet
   
      if (value === undefined)
         delete this.tabValues[section];
      else
         this.tabValues[section] = value;
      
      if (Browser.IsExtension())
      {
         // this process can be shut down at any time so we must store the local data so it can be restored later
         
         if (this.tabVarTimer)
            clearTimeout(this.tabVarTimer);
         this.tabVarTimer = setTimeout(function ()
         {
            this.tabVarTimer = null;
            try
            {
               chrome.storage.local.set({[Storage.tabValuesName]: Storage.tabValues}, function ()
               {
                  Log_WriteInfo('Saved tab values');
               });
            }
            catch (e)
            {
               Log_WriteException(e);
            }
         }, 1);
      }
   }
};

// DRL FIXIT! We need to initialize this or replace the code that uses this with something appropriate
// for both the app and the extension!
let IsThisBackgroundScript = /*Browser.IsExtensionBackground() ||*/ typeof reqGetTabID === 'undefined';

Storage.localValuesName = IsThisBackgroundScript ? 'BackgroundVars' : 'ContentVars';

Storage.GetStorage('LocalValues', Storage.localValuesName, function (result)
{
   Log_WriteInfo('Loaded local values');
   
   if (result && result.hasOwnProperty(Storage.localValuesName))
      Storage.localValues = result[Storage.localValuesName];
   else
      Storage.localValues = {};
});

// we'll do this a tiny bit later because Tabs.js and ContentUtils.js are loaded after Storage.js
setTimeout(function ()
{
   try
   {
      if (IsThisBackgroundScript)
      {
         Tabs.AddTabRemovedListener(function (tabId)
         {
            let tabValuesName = 'TabVars_' + tabId;
            Storage.RemoveStorage('TabValues', tabValuesName, function ()
            {
               Log_WriteInfo('Removed tab storage for tab ' + tabId);
            });
         });
      
         Tabs.AddTabReplacedListener(function (addedTabId, removedTabId)
         {
            let tabOldValuesName = 'TabVars_' + removedTabId;
            let tabNewValuesName = 'TabVars_' + addedTabId;
         
            Storage.GetStorage('TabValues', tabOldValuesName, function (result)
            {
               if (result && result.hasOwnProperty(tabOldValuesName))
               {
                  result[tabNewValuesName] = result[tabOldValuesName];
                  delete result[tabOldValuesName];
                  Storage.SetStorage('TabValues', {[tabNewValuesName]: result}, function ()
                  {
                     Storage.RemoveStorage('TabValues', tabOldValuesName, function ()
                     {
                        Log_WriteInfo('Moved tab storage for tab ' + removedTabId + ' to tab ' + addedTabId);
                     });
                  });
               }
            });
         });
      }
      else
      {
         reqGetTabID()
            .then(tabID =>
            {
               Storage.tabValuesName = 'TabVars_' + tabID;
               
               Storage.GetStorage('TabValues', Storage.tabValuesName, function (result)
               {
                  Log_WriteInfo('Loaded tab values');
                  
                  if (result && result.hasOwnProperty(Storage.tabValuesName))
                     Storage.tabValues = result[Storage.tabValuesName];
                  else
                     Storage.tabValues = {};
               });
            })
            .catch(e =>
            {
               Log_WriteException(e);
            });
      }
   }
   catch (e)
   {
      Log_WriteException(e);
   }
}, 10);
