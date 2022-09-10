// ========================================================================
//        Copyright � 2013 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

function BusyIndicatorStart(message)
{
	if (!Utilities_GetElementById('busy_indicator') && !Browser.IsExtension())
	{
		let main = Utilities_CreateHtmlNode(
			"<DIV id='busy_indicator' style='width:100%; height:100%; position:fixed; top:0; left:0; z-index:100002;'></DIV>" +
			"<DIV id='busy_indicator_message' style='text-align:center; position:fixed; width:50%; margin-left:-25%; top:30%; left:50%; z-index:100003;'></DIV>" +
			// DRL FIXIT? What is this INPUT element doing?
         "<INPUT type='text' id='busy_indicator_paste' name='paste_input' style='display:none; text-align:center; position:fixed; width:50%; margin-left:-25%; top:50%; left:50%; z-index:100001;'>"
			);
		document.body.insertBefore(main,document.body.childNodes[0]);
	}
	if (!message)
   {
      // if there is no message and the indicator is already shown just exit
      if (Visibility_IsShownById('busy_indicator'))
         return;
      
		message = Str('Please wait...');
   }
	if (Browser.IsExtension())
   {
   	// we don't hide the screen here because it is disruptive, though it would be nice to hide just our popup
		FormDisableSubmit();
   }
   else
   {
      Utilities_GetElementById('busy_indicator_message').innerHTML = message;
      Visibility_ShowById('busy_indicator');
      Visibility_ShowById('busy_indicator_message');
   }
   
   Class_AddByElement(document.body, 'busy_indicator_on');
}

function BusyIndicatorStop()
{
	FormEnableSubmit();

	Visibility_HideById('busy_indicator_paste');
   Visibility_HideById('busy_indicator_message');
   Visibility_HideById('busy_indicator');

	Class_RemoveByElement(document.body, 'busy_indicator_on');
}

function IsBusyIndicatorOn()
{
   return Visibility_IsShownById('busy_indicator');
}

DocumentLoad.AddCallback(function(rootNodes)
{
    if (Browser.IsExtension())
        return;
        
	forEach(rootNodes, function(root)
	{
		forEach(Utilities_GetElementsByTag('a', root), function (elem)
		{
			if (Class_HasByElement(elem, 'busy_onclick'))
			{
				Utilities_AddEvent(elem, "click", function (e)
				{
					BusyIndicatorStart(Str('Working...'));
				});
			}
		});
	});
});
