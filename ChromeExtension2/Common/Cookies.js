// ========================================================================
//        Copyright � 2013 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

let _ChromeExtensionCookies = null;

function SetCookie(name, value, expiry)   // seconds
{
   let exdate = DateAndTime_Now(0).Add(expiry);

   if (Browser.IsExtensionBackground())
   {
      assert(Form_RootUri != null); // should be initialized
      let params = {
         'url': Form_RootUri,
         'name': name,
         'value': value
      };
      if (expiry != null)
         params['expirationDate'] = exDate.ToEpoch();
      chrome.cookies.set(params, function (cookie)
      {
         if (chrome.extension.lastError) Log_WriteError("Extension error setting cookie: " + chrome.extension.lastError.message);
         if (chrome.runtime.lastError) Log_WriteError("Runtime error setting cookie: " + chrome.runtime.lastError.message);

         // update our cache
         _ChromeExtensionCookies[name] = value;
      });
   }
   else if (Browser.IsExtensionContent())
   {
      assert(0);
   }
   else
   {
      value = encodeURIComponent(value) + ((expiry == null) ? '' : '; expires=' + exdate.ToFormat(DateAndTime_LongFormat2)) + '; path=/';
      document.cookie = name + '=' + value;
   }
}

function DeleteCookie(name)
{
   if (Browser.IsExtensionBackground())
   {
      assert(Form_RootUri != null); // should be initialized
      let params = {
         'url': Form_RootUri,
         'name': name
      };
      chrome.cookies.remove(params, function ()
      {
         if (chrome.extension.lastError) Log_WriteError("Extension error setting cookie: " + chrome.extension.lastError.message);
         if (chrome.runtime.lastError) Log_WriteError("Runtime error setting cookie: " + chrome.runtime.lastError.message);
   
         if (_ChromeExtensionCookies != null)
            delete _ChromeExtensionCookies[name];
      });
   }
   else if (Browser.IsExtensionContent())
   {
      assert(0);
   }
   else
   {
      let exdate = DateAndTime_Now(0).Subtract(100); // expire the cookie
      let value = '; expires=' + exdate.ToFormat(DateAndTime_LongFormat2) + '; path=/';
      document.cookie = name + '=' + value;
   }
}

function GetCookie(name, defaultValue)
{
   let value = defaultValue;

   if (Browser.IsExtension())
   {
      if (_ChromeExtensionCookies != null)
      {
         if (_ChromeExtensionCookies.hasOwnProperty(name))
            value = _ChromeExtensionCookies[name];
      }
      else
      {
         Log_WriteError('Cookies have not yet been loaded when requesting "' + name + '"');
      }
   }
   else
   {
      let i, x, y, ARRcookies = document.cookie.split(';');
      for (i = 0; i < ARRcookies.length; i++)
      {
         x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
         y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
         x = x.replace(/^\s+|\s+$/g, '');
         if (x == name)
         {
            value = decodeURIComponent(y.replace(/\+/g, ' '));
            break;
         }
      }
   }
   
   return value;
}

function GetCookieSize()
{
   if (Browser.IsExtension())
   {
      assert(0);  // not yet implemented
   }
   else
   {
      return document.cookie.length;
   }
}

function GetCookies()
{
   let cookies = { };
   
   if (Browser.IsExtension())
   {
      if (_ChromeExtensionCookies != null)
      {
         cookies = _ChromeExtensionCookies;
      }
      else
      {
         Log_WriteError('Cookies have not yet been loaded when requesting all cookies');
      }
   }
   else
   {
      if (document.cookie && document.cookie != '')
      {
         let split = document.cookie.split(';');
         for (let i = 0; i < split.length; i++)
         {
            let name_value = split[i].split('=');
            name_value[0] = name_value[0].replace(/^ /, '');
            cookies[decodeURIComponent(name_value[0])] = decodeURIComponent(name_value[1]);
         }
      }
   }
   
   return cookies;
}

// getting the cookies is asynchronous so let's kick this off here in the hopes it completes before we need them
if (Browser.IsExtensionBackground())
{
   // this must be called once the URLs have been initialized
   function InitializeCookies()
   {
      assert(Form_RootUri != null); // should be initialized
      let params = {
         'url': Form_RootUri
      };
      // DRL FIXIT! This doesn't seem to get us all the cookies.
      chrome.cookies.getAll(params, function (cookies)
      {
         if (chrome.extension.lastError) Log_WriteError("Extension error getting cookies: " + chrome.extension.lastError.message);
         if (chrome.runtime.lastError) Log_WriteError("Runtime error getting cookies: " + chrome.runtime.lastError.message);
         
         _ChromeExtensionCookies = {};
         for (let cookie of cookies)
         {
            _ChromeExtensionCookies[cookie.name] = cookie.value;
         }
      });
   }
}

if (Browser.IsExtensionContent())
{
   Messaging.SendMessageToBackground({type: 'getCookies'}, function(resp)
   {
      _ChromeExtensionCookies = resp;
   });
}