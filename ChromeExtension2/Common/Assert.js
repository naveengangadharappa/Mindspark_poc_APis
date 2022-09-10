// ========================================================================
//        Copyright � 2016 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Checks for a condition and throws an exception if it isn't met.
// Also includes code to catch exceptions and log them.


function assert(condition, message)
{
   if (!condition || 
      // added these to catch when I mistakenly pass a string like I do in PHP
      typeof condition == 'string' || condition instanceof String)
   {
      message = message || "Assertion failed";
      try
      {
         // throw an exception so we can get a stack trace...
         if (typeof Error !== "undefined")
         {
            throw new Error(message);
         }
         throw message; // Fallback
      }
      catch (exception)
      {
         if (typeof exception.stack !== "undefined")
            message += "\n" + exception.stack;
         Log_WriteError(message);
      }
   }
}

window.onerror = function(msg, url, line)
{
   var message = msg+'\nURL: '+url+'\nLine: '+line+'\nUser Agent: '+navigator.userAgent;
   if (url == null || url.startsWith('safari-extension://') || // we are seeing some errors from a Safari extension that is unrelated to our code
      msg.indexOf('Extension context invalidated') != -1 ||    // reloading of the extension causes this, which isn't serious
      msg.indexOf('ResizeObserver loop limit exceeded') != -1) // we are seeing this in the Chome extension, a poblem with the host page?
      Log_WriteWarning(message);
   else
      Log_WriteError(message);
//   alert('Error: '+message);
};
