// this file can be loaded in the content script or the background script and will perform the necessary
// actions in order to support communication from the content script to the background script, including
// the responses

var promiseLock = false;

SA_PROMISES = {};
async function globalPromise(key, codeBlock) {
   async function sleep(msec) {
      return new Promise(resolve => setTimeout(resolve, msec));
   }
   
   while(promiseLock) {
      console.info("Waiting for promise lock release start");
      await sleep(1000);
      console.info("Waiting for promise lock release end");
      continue;
   }
   
   promiseLock = true;
   try {
      if (!SA_PROMISES[key]) {
         let resolveCodeBlock, rejectCodeBlock;
         let promise = new Promise(function (resolve, reject) {
            resolveCodeBlock = resolve;
            rejectCodeBlock = reject;
            codeBlock(resolve, reject);
         });
         
         promise.resolve = resolveCodeBlock;
         promise.reject = rejectCodeBlock;
         promise.then(function (data) {
               // console.log("SA_PROMISES before delete", JSON.stringify(SA_PROMISES), new Date());
               delete SA_PROMISES[key];
               // console.log("SA_PROMISES after delete", JSON.stringify(SA_PROMISES), new Date());
               return data;
            },
            function (error) {
               console.error("Error in global promise", error, key);
               console.log("SA_PROMISES before delete", JSON.stringify(SA_PROMISES), new Date());
               delete SA_PROMISES[key];
               console.log("SA_PROMISES after delete", JSON.stringify(SA_PROMISES), new Date());
               return null;
            });
         // console.log("SA_PROMISES before add", JSON.stringify(SA_PROMISES), new Date());
         SA_PROMISES[key] = promise;
         // console.log("SA_PROMISES after add", JSON.stringify(SA_PROMISES), new Date());
         // setTimeout(function () {promiseLock = false;}, 500);
         promiseLock = false;
         return promise;
      }
      
      // setTimeout(function () {promiseLock = false;}, 500);
      promiseLock = false;
      return null;
   } catch (error) {
      console.error("Error occured in global promise: ", error, JSON.stringify(error), new Date());
      // setTimeout(function () {promiseLock = false;}, 500);
      promiseLock = false;
   }
   finally {
      // promiseLock = false;
      // console.log("Global Promise finally block promiseLock:", promiseLock);
      //setTimeout(function () { console.log("Global Promise finally block timeout promiseLock:", promiseLock); }, 1000);
      // setTimeout(function () { console.log("Global Promise finally block timeout promiseLock:", promiseLock); }, 1000);
   }
}

function resolveGlobalPromise(key, data) {
   try {
      if (SA_PROMISES[key]) {
         SA_PROMISES[key].resolve(data);
      }
      else {
         console.error("Promise key not found, Key:", key, JSON.stringify(SA_PROMISES));
      }
   } catch (error) {
      console.error("Error occured in resolveGlobalPromise", error);
   }
}

function addAppTypePrefix(type) {
   if (type.indexOf("#SA#-") === -1) {
      type = "#SA#-" + type;
   }
   
   return type;
}

function removeAppTypePrefiex(type) {
   if (type.indexOf("#SA#-") > -1) {
      type = type.replace("#SA#-", "");
   }
   
   return type;
}

let Messaging =
{
   isResponseReceived: false,
   responseReceived: null,
   
   // intended to be used in the Chrome extension and app background scripts
   // the handler is called with the message, the sender, and the method to call with the response
   // the handler should return true if it is going to use the sendResponse mechanism later
   AddBackgroundMessageListener: function(handler)
   {
      if (Browser.IsExtensionContent())
      {
         // this is the Chrome extension content script
      }
      else if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         
         chrome.runtime.onMessage.addListener(function (request, sender, sendResponse)
         {
            try
            {
               // the handler should return true if it is going to use the sendResponse mechanism later
               return handler(request, sender, sendResponse);
            }
            catch (e)
            {
               Log_WriteException(e);
            }
         });
      }
      else
      {
         // this is the app background script
   
         let webView = window.ReactNativeWebView;
         document.addEventListener("message", function (event)
         {
            // console.log("This event was called in background", JSON.stringify(event.data));
            // var result = handler(event.data, event.data.sender, function (response)
            // {
            //    // send the response to the same webview that sent the request
            //    window.postMessage(result, event.origin);
            // });
      
      
            let request = event.data;
            if (request.type.indexOf("-native-") > -1) {
               return;
            }
      
            // console.log("Object received in AddBackgroundMessageListener:", JSON.stringify(request));
            switch (request.type)
            {
               case "#SA#-sync":
                  showRespondButton(request);
                  break;
               case "#SA#-content-message":
                  showMessageInBackground(request);
                  break;
               case "#SA#-background-message":
                  resolveGlobalPromise(request.type, null);
                  break;
               default:
                  request.type = removeAppTypePrefiex(request.type);
                  handler(request, request.sender, function (response)
                  {
                     request.type = addAppTypePrefix(request.type);
                     console.log("Listener", JSON.stringify({ type: request.type, response: response }));
                     // console.log("Calling post Message Method, AddBackgroundMessageListener", webView);
                     webView.postMessage(JSON.stringify({ type: request.type, value: response, sender: request.sender }));
                  });
                  break;
            }
         });
      }
   },
   
   AddContentMessageListener: function ()
   {
      if (Browser.IsExtension())
      {
         assert(0);
         return;
      }
      
      document.addEventListener("message", function (event)
      {
         // console.log("Object received in AddContentMessageListener", event, JSON.stringify(event.data));
         let response = event.data;
         switch (response.type) {
            case "#SA#-background-message":
               showMessageInContent(response);
               break;
            case "#SA#-content-message":
            case "#SA#-sync":
               resolveGlobalPromise(response.type, response);
               break;
            default:
               resolveGlobalPromise(response.type, response.value);
               break;
         }
      });
   },
   
   LastSendMessageError: null,
   
   // intended to be used only in the content script
   // responseHandler takes the response or null on error
   // DRL FIXIT!!! This method is async for the "app" implementation but Dominique thinks it should NOT be async!
   SendMessageToBackground: async function(message, responseHandler)
   {
      if (Browser.IsExtensionContent())
      {
         chrome.runtime.sendMessage(message, function (response)
         {
            var lastError = chrome.runtime.lastError;
            if (lastError != null)
            {
               if (Messaging.LastSendMessageError == null) {
                  // if there was an error sending a message to the background script we can't use logging as this
                  // would also try to communicate with the background script, so we pend it
                  Messaging.LastSendMessageError = 'Error sending message to background: ' + lastError.message + "\r\nMessage: " + GetVariableAsString(message);
               }
               console.log(lastError.message);
               
               responseHandler(null);
               return;
            }

            // if we had a pending error message we can send it now
            if (Messaging.LastSendMessageError)
            {
               Log_WriteError(Messaging.LastSendMessageError);
               Messaging.LastSendMessageError = null;
            }
   
            responseHandler(response);
         });
      }
      else if (Browser.IsExtensionBackground())
      {
         assert(0);
      }
      else
      {
         let url = '';  // FIXIT! Need to get the URL of this webview!
         let appTabID = webvViewDetails ? webvViewDetails.TabId : 0; // DRL FIXIT! Need to get the ID of this webview! Perhaps set this to the content
         // script ID when the webview is created based on the URL (social attache gets 1,
         // Facebook gets 2, etc.).
   
         // here we mimick some of the data that would be provided for a Chrome extension in the "sender" param
         // but include only the fields we need
         let params = {};
         message.sender =
            {
               url: url,
               tab:
                  {
                     id: appTabID
                  }
            };
   
         message.type = addAppTypePrefix(message.type);
   
         let webview = window.ReactNativeWebView;
   
         // console.log("Sending to background:", JSON.stringify(message));
         let result = await globalPromise(message.type, function () {
            try
            {
               // console.log("Calling post Message Method, SendMessageToBackground", typeof (webview), message);
               webview.postMessage(JSON.stringify(message));
            }
            catch (error)
            {
               console.error("Error occured in sending message", error, JSON.stringify(error));
            }
         });
         responseHandler(result);
      }
   },
   
   // DRL FIXIT!!! This method is async for the "app" implementation but Dominique thinks it should NOT be async!
   SendMessageToTab: async function(tabID, message)
   {
      if (Browser.IsExtensionContent())
      {
         assert(0);
      }
      else if (Browser.IsExtensionBackground())
      {
         chrome.tabs.sendMessage(tabID, message, null, function (response)
         {
            var lastError = chrome.runtime.lastError;
            if (lastError != null)
            {
               if (Messaging.LastSendMessageError == null)
               {
                  // if there was an error sending a message to the background script we can't use logging as this
                  // would also try to communicate with the background script, so we pend it
                  Messaging.LastSendMessageError = 'Error sending message to tab ' + tabID + ': ' + lastError.message + "\r\nMessage: " + GetVariableAsString(message);
               }
               console.log(lastError.message);
      
//               responseHandler(null);
               return;
            }
   
//            responseHandler(response);
         });
      }
      else
      {
         // this is the app background script
         
         let webView = window.ReactNativeWebView;
         let result = await globalPromise(message.type, function ()
         {
            // console.log("Calling post Message Method, SendMessageToTab", JSON.stringify(webview));
            webView.postMessage(JSON.stringify(message));
         });
         responseHandler(result);
      }
   },
   
   SendMessageToNativeApp: async function (message, responseHandler)
   {
      if (Browser.IsExtension())
      {
         assert(0);
         return;
      }
      
      let appTabID = webvViewDetails ? webvViewDetails.TabId : 0;
      message.sender =
         {
            url: '',
            tab:
               {
                  id: appTabID
               }
         };
      
      message.type = addAppTypePrefix(message.type);
      
      let webview = window.ReactNativeWebView;
   
      // console.log("Sending to app:", JSON.stringify(message));
      try
      {
         // console.log("Calling post Message Method, SendMessageToApp", typeof (webview), message);
         if (message.type.indexOf('native-log') > -1) {
            webview.postMessage(JSON.stringify(message));
            responseHandler(null);
         } else {
            let result = await globalPromise(message.type, function () {
               webview.postMessage(JSON.stringify(message));
            });
            responseHandler(result);
         }
      }
      catch (error)
      {
         console.error("Error occured in sending message to app", error, JSON.stringify(error));
      }
   },
   
   ListenNativeAppMessages: async function()
   {
      if (Browser.IsExtension())
      {
         assert(0);
         return;
      }
   
      document.addEventListener("message", function (event)
      {
if (typeof BusyIndicatorStart === "function")
   BusyIndicatorStart('Native app message');
         // console.log("This event was called in ListenAppMessages", JSON.stringify(event.data));
         let request = event.data;
         if (request.type.indexOf("-native-") === -1)
         {
            return;
         }
         
         // console.log("Object received in ListenAppMessages:", JSON.stringify(request));
         resolveGlobalPromise(request.type, request);
      });
   },
};

if (!Browser.IsExtension())
{
   // this is the app content script, we will handle incoming responses from the background webview
   
   window.addEventListener("message", function (event)
   {
      Messaging.isResponseReceived = false;
      // store the response so the waiting loop below can find it
      Messaging.responseReceived = event.data;
   });
}
