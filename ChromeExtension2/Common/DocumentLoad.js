// ========================================================================
//        Copyright � 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the registration of methods that will be called after document load.


var _BusyIndicatorHoldCount = 0;

// keep the busy indicator on even after the callbacks have all been called
function BusyIndicatorHold()
{
   _BusyIndicatorHoldCount++;
}

function BusyIndicatorUnhold()
{
   _BusyIndicatorHoldCount--;
   if (_BusyIndicatorHoldCount == 0)
   {
      BusyIndicatorStop();
   }
}

DocumentLoad =
{
	// sometimes we load a chunk of the page later, and that chunk needs to be initialized just like the
	// rest of the page, so we save the callbacks for this purpose, so we can apply them on that chunk
	savedCallbacks: new Array(),
	callbacks: new Array(),
	nodes: null,		// if we are initializing a subset of the page, these are the nodes to initialize
	done: false,
	timer: null,

	TimerFunc: function()
	{
		// kill the timer
		if (DocumentLoad.timer)
		{
			clearTimeout(DocumentLoad.timer);
			DocumentLoad.timer = null;
		}

		while (DocumentLoad.callbacks.length > 0)
		{
         var callback = DocumentLoad.callbacks.shift();
         
         try
         {
            callback(DocumentLoad.nodes);
         }
         catch(err)
         {
            alert("Exception: " + err.message + "\r\n" + err.stack);
         }
		}
		
		DocumentLoad.nodes = [document.body];

		if (_BusyIndicatorHoldCount == 0 && typeof BusyIndicatorStop === "function" && !Browser.IsExtension())
			BusyIndicatorStop();
	},

	Init: function()
	{
		// quit if this function has already been called
		if (DocumentLoad.done) return;
    let links = [
      webvViewDetails.ExtensionUrl + "CSS/CardLayout.css",
      webvViewDetails.ExtensionUrl + "CSS/Controls.css",
      webvViewDetails.ExtensionUrl + "CSS/DashboardItems.css",
      webvViewDetails.ExtensionUrl + "CSS/DateAndTimeChooser.css",
      webvViewDetails.ExtensionUrl + "CSS/MenuExtension.css",
      webvViewDetails.ExtensionUrl + "CSS/ExternalUI.css",
      webvViewDetails.ExtensionUrl + "CSS/Forms.css",
      webvViewDetails.ExtensionUrl + "CSS/Images.css",
      webvViewDetails.ExtensionUrl + "CSS/LayoutAppContent.css",
      webvViewDetails.ExtensionUrl + "CSS/MessageWindow.css",
      webvViewDetails.ExtensionUrl + "CSS/NormalizeStyles.css",
      webvViewDetails.ExtensionUrl + "CSS/Notifications.css",
      webvViewDetails.ExtensionUrl + "CSS/PopUpWindow.css",
      webvViewDetails.ExtensionUrl + "CSS/LayoutAppPage.css",
      webvViewDetails.ExtensionUrl + "CSS/LayoutExtension.css",
      webvViewDetails.ExtensionUrl + "CSS/RowLayout.css",
      webvViewDetails.ExtensionUrl + "CSS/MessagesPage.css",
    ];
    for (let i = 0; i < links.length; i++) {
      var link = document.createElement( "link" );
      link.href = links[i];
      link.type = "text/css";
      link.rel = "stylesheet";
      link.media = "screen,print";

      document.getElementsByTagName( "head" )[0].appendChild( link );
    }
		// flag this function so we don't do the same thing twice
		DocumentLoad.done = true;
		DocumentLoad.nodes = [document.body];
      
      // if (typeof BusyIndicatorStart === "function" && !Browser.IsExtension())
      //    BusyIndicatorStart(Str('Loading...'));
      DocumentLoad.timer = setTimeout(function()
		{
			try
			{
			 	DocumentLoad.TimerFunc();
			}
			catch (e)
			{
				Log_WriteException(e);
			}
		}, 500);
	},
	
	InitChunk: function(nodes)
	{
		if (nodes.length == 0)
			return;
		
		assert(DocumentLoad.nodes.length == 1);
		DocumentLoad.nodes = nodes;
		DocumentLoad.callbacks = [...DocumentLoad.savedCallbacks];	// make a shallow copy
		
		// if (typeof BusyIndicatorStart === "function" && !Browser.IsExtension())
		// 	BusyIndicatorStart(Str('Loading...'));
		DocumentLoad.TimerFunc();
	},
	
	AddCallback: function(callback)
	{
		DocumentLoad.savedCallbacks.push(callback);
		
		if (DocumentLoad.done)
			callback(DocumentLoad.nodes);	// document already loaded
		else
			DocumentLoad.callbacks.push(callback);
	}
}

// for Mozilla/Opera9
if (document.addEventListener)
{
    document.addEventListener("DOMContentLoaded", DocumentLoad.Init, false);
}

// for Safari
if (/WebKit/i.test(navigator.userAgent))
{
	var timer = setTimeout(function()
	{
		try
		{
			if (/loaded|complete/.test(document.readyState))
			{
				// kill the timer
				if (timer) clearTimeout(timer);
				
				DocumentLoad.Init();	// call the onload callback
			}
			else if (DocumentLoad.done && timer)
				clearTimeout(timer);	// not needed, loading done
		}
		catch (e)
		{
			Log_WriteException(e);
		}
	}, 100);
}
	
// for other browsers

// This function adds DocumentLoad.init to the window.onload event,
// so it will run after the document has finished loading.
var oldOnLoad = window.onload;
window.onload = function() 
{
	DocumentLoad.Init();

	if (typeof oldOnload == 'function')
		oldOnLoad();
};
