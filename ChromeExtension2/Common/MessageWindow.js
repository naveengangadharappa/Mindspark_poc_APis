// ========================================================================
//        Copyright � 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Uses PopUpWindow.js which must also be included!!!
//
// Allows the showing of a message (error, info, etc.). 
//
// On-load usage (message window is shown when page loads):
//
//  <script type="text/javascript">
// 	  DisplayErrorMessage('This is an error message!');
//  </script>
//
// Javascript usage (message window is shown when call is made):
//
// 	DisplayErrorMessage('This is an error message!');
//
// Available methods:
//
// 	DisplayInfoMessage('This is an info message!');
// 	DisplaySuccessMessage('This is a success message!');
// 	DisplayWarningMessage('This is a warning message!');
// 	DisplayErrorMessage('This is an error message!');
// 	DisplayValidationMessage('This is a validation message!');
//
// Inline usage (message is shown in-line):
//
//  <div class="info">Info message</div>
//

// The message is expected to be HTML, or basic text with no formatting.
function DisplayMessage(message, messageType, displayType, timeoutSeconds, icon, callback)
{
   if (!Utilities_GetElementById('notification_window'))
   {
      var main = Utilities_CreateHtmlNode(
         "<DIV id=\"notification_window\" class=\"SA hide_element\">" +
         "  <DIV id=\"notification_content\"></DIV>" +
         "</DIV>");
      document.body.insertBefore(main,document.body.childNodes[0]);
   }
   
   if (messageType == null)
      messageType = 'success';
   if (displayType == null)
      displayType = (messageType == 'busy' || messageType == 'error') ? 'center' : 'toast';
   
   // set the style of the popup (remove previous style first)
	let win = Utilities_GetElementById('notification_window');
   let classes = Class_GetByElement(win);
   forEach(classes, function(clss)
   {
      if (clss.endsWith('_message'))
         Class_RemoveByElement(win, clss);
   });
   Class_AddByElement(win, messageType + '_message');
   Class_AddByElement(win, displayType + '_message');
   
	Utilities_GetElementById('notification_content').innerHTML = message;
	// DRL FIXIT! Add icon!

   Utilities_GetElementById('notification_window').onclick = function() { Visibility_HideById('notification_window'); if (callback) callback(); };
   if (timeoutSeconds != null)
      setTimeout( function()
      {
         try
         {
            Visibility_HideById('notification_window');
            if (callback)
               callback();
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, timeoutSeconds * 1000);

	Visibility_ShowById('notification_window');
}
function DisplayInfoMessage(message) { DisplayMessage(message, 'info'); }
function DisplaySuccessMessage(message) { DisplayMessage(message, 'success'); }
function DisplayWarningMessage(message) { DisplayMessage(message, 'warning'); }
function DisplayErrorMessage(message) { DisplayMessage(message, 'error'); }
function DisplayValidationMessage(message) { DisplayMessage(message, 'validation'); }

// the style can be one of "info", "success", etc. and optionally followed by a comma and size
function DisplayYesNoMessage(message, style, yesCallback, noCallback)
{
   var size = 'small';
   var temp = style.split(",");
   if (temp.length > 1)
      size = temp[1];
   style = temp[0];

   if (!Utilities_GetElementById('message_yesno_window'))
   {
      var main = Utilities_CreateHtmlNode(
         "<DIV id=\"message_yesno_window\" style=\"display: none;\">" +
         "	<TABLE id=\"message_yesno_window_group\">" +
         "		<TR><TD COLSPAN='2'><DIV id=\"message_yesno_window_content\"></DIV></TD></TR>" +
         "		<TR><TD style='text-align: center;'><INPUT id=\"message_yesno_window_yes\" type='button' value='Yes'></TD>" +
         "         <TD style='text-align: center;'><INPUT id=\"message_yesno_window_no\" type='button' value='No'></TD></TR>" +
         "	</TD></TR></TABLE>" +
         "</DIV>");
      document.body.insertBefore(main,document.body.childNodes[0]);
   }
   Utilities_GetElementById('message_yesno_window_group').className = style + '_message';
   Utilities_GetElementById('message_yesno_window_content').innerHTML = message;
   
   Utilities_GetElementById('message_yesno_window_yes').onclick = function() { ClosePopUp(); if (yesCallback) yesCallback(); };
   Utilities_GetElementById('message_yesno_window_no').onclick = function() { ClosePopUp(); if (noCallback) noCallback(); };
   
   DisplayPopUp('message_yesno_window', size, function() { ClosePopUp(); if (noCallback) noCallback(); });
}

function ClearMessage()
{
   if (Visibility_IsShownById('notification_window'))
   {
      Visibility_HideById('notification_window');
      Utilities_GetElementById('notification_window').onclick();
   }
//   ClosePopUp();   this would hide an embedded dialog which is not what we want
}