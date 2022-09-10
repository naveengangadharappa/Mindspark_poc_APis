// ========================================================================
//        Copyright � 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the showing of a pop-up window with just about any HTML content.
//
// Usage (shows a form, hides form on cancel, note the DIV isn't 
// copied just its content):
//
// <DIV id='content_id' style='display:none;'>
//     <FORM action='/SomeScript.php'>
//         Type Something <INPUT type='text' size='50' name='Text'><BR>
//         <INPUT type='submit' value='Save'><INPUT type='button' value='Cancel' onClick='ClosePopUp();'>
//     </FORM>
// </DIV>
// <A onclick="DisplayPopUp('content_id');">Open form</A>

var popup_window_content_elem = null;
var popup_window_close_handler = null;

// size: small, medium, narrow, large
function DisplayPopUp(id, size, closeHandler)
{
   var elem = Utilities_GetElementById(id);
   DisplayPopUpElement(elem, size, closeHandler);
}

function DisplayPopUpElement(elem, size, closeHandler)
{
   if (popup_window_content_elem != null)
      ClosePopUp();

   let formActions = '';
   let hasButtons = elem.querySelectorAll('.form_actions .form_button').length > 0;
   if (hasButtons)
   {
      formActions = elem.querySelector('.form_actions').innerHTML
   }
   else
   {
      // in the rare case that there are no buttons on the form we need a way of closing the popup
      formActions = '<button class="form_button form_cancel" id="PopUpCloseButton" type="button" onclick="ClosePopUp()">\n' +
         '    <span class="optional">Close</span>\n' +
         '    <img class="iconsmall" title="Close" src="/v2/Skins/CancelLt.svg">\n' +
         '</button>';
   }

   if (!Utilities_GetElementById('popup_window'))
   {
      let main = Utilities_CreateHtmlNode(
         "<DIV id='popup_window' class='SA hide_element'>" +
         "	<header id='popup_header' class='window_header'>" +
         "	</header>" +
         "	<DIV id='popup_window_content'></DIV><!--<DIV id='popup_window_shim'>--></DIV>" +
         "</DIV>"
      );
   
      document.body.insertBefore(main,document.body.childNodes[0]);
   }
   
   if (!size)
      size = "medium";
   
   // set the style of the popup to match the desired size
   let win = Utilities_GetElementById('popup_window');
   let classes = Class_GetByElement(win);
   forEach(classes, function(clss)
   {
      if (clss.startsWith('popup_window_'))
         Class_RemoveByElement(win, clss);
   });
   Class_AddByElement(win, 'popup_window_' + size);
   
   // move the display data from the document into the popup
   var dest = Utilities_GetElementById('popup_window_content');
   while (elem.hasChildNodes())
   {
      dest.appendChild(elem.childNodes[0]);
   }
   
   // copy buttons to the header as needed and massage them (required for extension event handling)
   let header = document.body.querySelector('#popup_header');
   header.innerHTML = formActions;
   InitializeForm([header]);

   // run any scripts that were provided
   forEach(Utilities_GetElementsByTag('SCRIPT', dest), function(elem)
   {
      eval(elem.innerText);
   });
   
   // save the ID and handler so we can access it later
   popup_window_content_elem = elem;
   popup_window_close_handler = closeHandler;
   
   Visibility_ShowById('popup_window');

   // This engages some CSS that fixes iframe scrolling on iOS.
//	if (size == "full") {
   Class_AddByElement(document.body, "has_popup_window");
//	}
}

function DisplayPopUpValue(id, size, closeHandler)
{
   let elem = Utilities_GetElementById(id);
   
   // handling is identical except for the saved item below
   DisplayPopUpElement(elem, size, closeHandler);

   // override the setting from above
   popup_window_content_elem = "INJECTED_CONTENT";
}

// DisplayPopUp moves the iframe into a different container, so we cant just pluck the id from popup_web_window
// Let's just store it as global instead
var _popupFrameId = null;
// id should be the id of a form control with value attribute
function DisplayPopUpFrame(id, size, closehandler)
{
	var web_window = Utilities_GetElementById('popup_web_window');
	if (!web_window)
	{
	   // make it unique even across parent documents because some browsers require it
      var milliseconds = new Date().getTime();
      _popupFrameId = 'popup_web_window_iframe_' + milliseconds;
      
      var main = Utilities_CreateHtmlNode(
            "<DIV id=\"popup_web_window\" style=\"display: none;\">" +
            "  <IFRAME id=\"" + _popupFrameId + "\" name=\"" + _popupFrameId + "\" frameborder=\"0\" src=\"\" width=\"100%\" height=\"100%\"></IFRAME>" +
            "</DIV>");

      document.body.insertBefore(main, document.body.childNodes[0]);
	}
	var iframe = Utilities_GetElementById(_popupFrameId);
	if (!iframe)
   {
      alert("Can't find iFrame with id: " + _popupFrameId);
      return;
   }
   
	DisplayPopUp('popup_web_window', size);
	// moving the iframe after writing the content seems to erase the content
	// so instead let's write the content after DisplayPopUp
	var html = Utilities_GetElementById(id).value;
	iframe.contentWindow.document.open();
	iframe.contentWindow.document.write(html);
	iframe.contentWindow.document.close();	
}

function InitializeAutoLoadedFrames(rootNodes)
{
   forEach(rootNodes, function(root)
   {
      var iframes = Utilities_GetElementsByClass('AutoLoadedFrame', 'IFRAME', root);
      for (var i = 0; i < iframes.length; i++)
      {
         var iframe = iframes[i];
         var contentSourceId = iframe.getAttribute("ContentSourceID");
         var contentSource = Utilities_GetElementById(contentSourceId);
         if (contentSource)
         {
//			iframe.contentWindow.document.open('text/htmlreplace');
//			iframe.contentWindow.document.write(contentSource.value);
//			iframe.contentWindow.document.close();
// DRL FIXIT? I suspect this copies the content, couldn't we have put it here
// in the first place and avoid ContentSourceID altogether?
            iframe.contentWindow["contents"] = contentSource.value;
            iframe.src = 'javascript:window["contents"]';   // this will result in onload event and recalculating height
         }
      }
      
      iframes = Utilities_GetElementsByClass('adjust_frame_height_on_load', 'IFRAME', root);
      for (var i = 0; i < iframes.length; i++)
      {
         var iframe = iframes[i];
         iframe.addEventListener('load', function (e)
         {
            AutoAdjustFrameHeight(e.target);
         });
      }
   });
}

DocumentLoad.AddCallback(InitializeAutoLoadedFrames);

// NOTE: If using this for an iFrame you must first set the iFrame height to a small value otherwise the returned
// value might be the maximum of the actual height and the current iFrame height. Also, the HTML inside the iframe
// must have a valid DOCTYPE. Even with all these this doesn't seem to work on Mac Chrome, and instead returns the
// current iFrame height.
function GetDocHeight(doc)
{
   doc = doc || document;
   // stackoverflow.com/questions/1145850/
   var body = doc.body, html = doc.documentElement;
   var height = Math.max(body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight);
   return height;
}

// adjust iframe height according to content height
function AutoAdjustFrameHeight(elem)
{
   var doc = elem.contentDocument ? elem.contentDocument : elem.contentWindow.document;

   elem.style.visibility = 'hidden';
   elem.style.height = "10px"; // reset to minimal height ...
   // IE opt. for bing/msn needs a bit added or scrollbar appears
   var height = GetDocHeight(doc);
   if (height == 0) height = 400;   // DRL FIXIT! Why does the height often come up 0?
   elem.style.height = (height + 10) + "px";   // we needed some extra height so the scrollbar won't show
   elem.style.visibility = 'visible';
}

function DisplayPopUpContent(content, size, closeHandler)
{
   let elem = Utilities_CreateHtmlNode(content);
   
   // handling is identical except for the saved item below
   DisplayPopUpElement(elem, size, closeHandler);
   
   // override the setting from above
   popup_window_content_elem = "DYNAMIC_CONTENT";
   
   // the elements created above need to be initialized
   elem = Utilities_GetElementById('popup_window_content');
   DocumentLoad.InitChunk(elem.children);
}

function GetPopUpContent()
{
	return Utilities_GetElementById('popup_window_content');
}

function ClosePopUp(closeTabIfTemporary)
{
//	// This is support for a popup containing an iFrame and this 
//	// call wanting to close the popup in the parent window hosting 
//	// that iFrame. 
//	if (!Visibility_IsShownById('popup_window'))
//	{
//		if (!window.parent || !window.parent == window || !window.parent.ClosePopUp) return;	// can't do it!
//		window.parent.ClosePopUp();
//		return;
//	}
   
   // it looks like the scroll position is being saved between uses so I clear it here
   // this must be done while the DIV is visible
   let src = Utilities_GetElementById('popup_window_content');
   src.scrollTop = 0;
   src.scrollLeft = 0;
   
   Visibility_HideById('popup_window');
   Visibility_HideById('popup_frame');

   if (popup_window_content_elem == "INJECTED_CONTENT")
   {
   }
   else if (popup_window_content_elem == "DYNAMIC_CONTENT")
   {
      // remove the content added to the popup window
      while (src.hasChildNodes())
         src.removeChild(src.childNodes[0]);
   }
   else if (popup_window_content_elem != null)
	{
		// restore the display data back to where it was in the document
		let dest = popup_window_content_elem;
		while (src.hasChildNodes())
			dest.appendChild(src.childNodes[0]);
	}
   
   // remove any buttons we added to the header
   document.body.querySelector('#popup_header').innerHTML = '';
   
	popup_window_content_elem = null;
	
	if (popup_window_close_handler)
	{
		popup_window_close_handler();
		popup_window_close_handler = null;
	}

	Class_RemoveByElement(document.body, "has_popup_window");

   // if this was a temporary tab we can close it now
   if (closeTabIfTemporary && Url_GetParam(window.location.href, 'SA_action') !== null)
      reqRemoveTab();   // used in Chrome extension only
}

function CloseParentPopUp()
{
	// This is support for a popup containing an iFrame and this 
	// call wanting to close the popup in the parent window hosting 
	// that iFrame.
   if (Browser.CanAccessParent())
   {
      if (window.parent != window && window.parent.ClosePopUp)
         window.parent.ClosePopUp();
   }
   else
      window.parent.postMessage({action: 'ClosePopUp', params: null}, "*");
}