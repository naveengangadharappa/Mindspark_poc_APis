let Timers =
{
   // Note: in some environments the timer resolution is minutes (we round up)
   // returns an ID that can be used to remove the timer
   AddRepeatingTimer: function(seconds, handler)
   {
      let result = null;
      
      if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         result = Utilities_IntRand(1000, 100000);
         chrome.alarms.onAlarm.addListener(function(alarm)
         {
            if (alarm.name == result)
            {
               handler();
            }
         });
         chrome.alarms.create(result + '', {periodInMinutes: Utilities_Div(seconds + 59, 60)});
      }
      else
      {
         result = setInterval(function()
         {
            handler();
         }, seconds * 1000);
      }
      
      return result;
   },
   
   RemoveRepeatingTimer: function(timerID)
   {
      if (Browser.IsExtensionBackground())
      {
         // this is the Chrome extension background script
         chrome.alarms.clear(timerID + '');
      }
      else
      {
         clearInterval(timerID);
      }
   }
};
