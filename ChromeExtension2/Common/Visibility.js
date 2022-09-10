// ========================================================================
//        Copyright © 2008 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the showing and hiding of elements in a Web page.
//
// Usage (note use of showhide):
//
// <p><a href="#data" onclick="Visibility_ToggleById('data')">Toggle</a></p>
// <div id="data" class="showhide">
// <p>This is some text that is initially hidden.</p>
// </div>
//
// <p><a href="#data" onclick="Visibility_ToggleByClass('data')">Toggle</a></p>
// <div class="data showhide">
// <p>This is some text that is initially hidden.</p>
// </div>
//
// Alternative uses:
// <p><a href="#data" onclick="Visibility_Show('data')">Show</a></p>
// <p><a href="#data" onclick="Visibility_Hide('data')">Hide</a></p>

function Visibility_IsShownByElement(elem)
{
   if (typeof(HtmlTextArea) !== 'undefined' && HtmlTextArea.IsHtmlTextArea(elem))
   {
      return HtmlTextArea.IsShown(elem);
   }

   if (Class_HasByElement(elem, 'hide_element'))
      return false;
   
   let vis = elem.style.display;
	// if the style value is blank we try to figure it out
	if (vis == '' && elem.offsetWidth != undefined && elem.offsetHeight != undefined)
		return (elem.offsetWidth !=0 && elem.offsetHeight !=0 ) ? true : false;
	return vis != 'none' ? true : false;
}

// returns true if there was a change
function Visibility_SetByElement(elem, visible)
{
   let result = false;
   
   // we try to change the visibility without affecting the "display" property because it may not be set to standard

   if (typeof(HtmlTextArea) !== 'undefined' && HtmlTextArea.IsHtmlTextArea(elem))
   {
      if (visible)
         result = HtmlTextArea.Show(elem);
      else
         result = HtmlTextArea.Hide(elem);
   }
   else if (visible)
   {
      if (Class_HasByElement(elem, 'hide_element'))
      {
         Class_RemoveByElement(elem, 'hide_element');
         result = true;
      }
      
      if (elem.style.display == 'none')
      {
         var value;
         var tagName = strtolower(elem.tagName);
         if (tagName == 'tr')
            value = 'table-row';
         else if (tagName == 'div')
            value = 'block';
         else
            value = '';
         elem.style.display = value;

         result = true;
      }
   }
   else if (!Class_HasByElement(elem, 'hide_element'))
   {
      Class_AddByElement(elem, 'hide_element');
      result = true;
   }
   
	return result;
}

function Visibility_ShowByElement(elem)
{
	return Visibility_SetByElement(elem, 1);
}

function Visibility_HideByElement(elem)
{
	return Visibility_SetByElement(elem, 0);
}

function Visibility_ToggleByElement(elem)
{
	return Visibility_SetByElement(elem, !Visibility_IsShownByElement(elem));
}

function Visibility_IsShownById(id)
{
   var elem = Utilities_GetElementById(id);
   if (elem)
      return Visibility_IsShownByElement(elem);
   return false;
}

function Visibility_SetById(id, visible)
{
   var elem = Utilities_GetElementById(id);
   if (elem)
      return Visibility_SetByElement(elem, visible);
   return false;
}

function Visibility_ShowById(id)
{
   var elem = Utilities_GetElementById(id);
   if (elem)
      return Visibility_ShowByElement(elem);
   return false;
}

function Visibility_HideById(id)
{
   var elem = Utilities_GetElementById(id);
   if (elem)
      return Visibility_HideByElement(elem);
   return false;
}

function Visibility_ToggleById(id)
{
   var elem = Utilities_GetElementById(id);
   if (elem)
      return Visibility_ToggleByElement(elem);
   return false;
}

function Visibility_IsShownByName(name)
{
   var elem = Utilities_GetElementByName(name);
   if (elem)
      return Visibility_IsShownByElement(elem);
   return false;
}

function Visibility_SetByName(name, visible)
{
   var elem = Utilities_GetElementByName(name);
   if (elem)
      return Visibility_SetByElement(elem, visible);
   return false;
}

function Visibility_ShowByName(name)
{
   var elem = Utilities_GetElementByName(name);
   if (elem)
      return Visibility_ShowByElement(elem);
   return false;
}

function Visibility_HideByName(name)
{
   var elem = Utilities_GetElementByName(name);
   if (elem)
      return Visibility_HideByElement(elem);
   return false;
}

function Visibility_ToggleByName(name)
{
   var elem = Utilities_GetElementByName(name);
   if (elem)
      return Visibility_ToggleByElement(elem);
   return false;
}

function Visibility_IsShownByClass(className, root)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className, null, root);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (Visibility_IsShownByElement(elems[i]))
			result = true;
	}
	return result;
}

function Visibility_SetByClass(className, visible, root, includeRoot)
{
   var result = false;
   var elems = Utilities_GetElementsByClass(className, null, root, includeRoot);
   for(var i = 0, len = elems.length; i < len; i++)
   {
      if (Visibility_SetByElement(elems[i], visible))
         result = true;
   }
   return result;
}

// this version returns a list of the affected elements (more expensive)
function Visibility_SetByClassReturnList(className, visible, root, includeRoot)
{
   var result = [];
   var elems = Utilities_GetElementsByClass(className, null, root, includeRoot);
   for(var i = 0, len = elems.length; i < len; i++)
   {
      if (Visibility_SetByElement(elems[i], visible))
         result.push(elems[i]);
   }
   return result;
}

function Visibility_ShowByClass(className, root)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className, null, root);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (Visibility_ShowByElement(elems[i]))
			result = true;
	}
	return result;
}

function Visibility_HideByClass(className, root)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className, null, root);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (Visibility_HideByElement(elems[i]))
			result = true;
	}
	return result;
}

function Visibility_ToggleByClass(className, root)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className, null, root);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (Visibility_ToggleByElement(elems[i]))
			result = true;
	}
	return result;
}

function Visibility_IsShown(item)
{
   return Visibility_IsShownByElement(Utilities_GetElement(item));
}

function Visibility_SetIsShown(item, visible)
{
   Visibility_SetIsShownByElement(Utilities_GetElement(item), visible);
}

function Visibility_Show(item)
{
   Visibility_ShowByElement(Utilities_GetElement(item));
}

function Visibility_Hide(item)
{
   Visibility_HideByElement(Utilities_GetElement(item));
}

function Visibility_Toggle(item)
{
   return Visibility_ToggleByElement(Utilities_GetElement(item));
}

DocumentLoad.AddCallback(function(rootNodes)
{
   forEach(rootNodes, function(root)
   {
      // start all showhide elements as initially hidden
      Visibility_SetByClass('showhide', false, root, true);

      let nodes = Utilities_GetElementsByClass('toggler_id', null, root);
      for (let a of nodes)
      {
         // start the item initially hidden
         var sel = a.getAttribute('href').substr(1);
         Visibility_SetById(sel, Class_HasByElement(a, "toggler_opened"));  // initial state
      
         a.addEventListener('click', function (event)
         {
            event.preventDefault();
            a.classList.toggle("toggler_opened");
            var sel = this.getAttribute('href').substr(1);
            Visibility_ToggleById(sel);
         
            var node = Utilities_GetElementById(sel);
            var nodes = Utilities_GetElementsByClass('toggle_loaded', 'IFRAME', node);
            [].forEach.call(nodes, function (iframe)
            {
               if (iframe.hasAttribute('delay_load_src'))
               {
                  iframe.setAttribute('src', iframe.getAttribute('delay_load_src'));
                  // don't load it a second time
                  iframe.removeAttribute('delay_load_src');
               }
            });
         });
      }
   
      nodes = Utilities_GetElementsByClass('toggler_class', null, root);
      for (let a of nodes)
      {
         // start the item initially hidden
         var sel = a.getAttribute('href').substr(1);
         Visibility_SetByClass(sel, Class_HasByElement(a, "toggler_opened"));  // initial state
      
         // DRL FIXIT? Eventually we'll want the same handling for child iframes as above.
      
         a.addEventListener('click', function (event)
         {
            event.preventDefault();
            a.classList.toggle("toggler_opened");
            var sel = this.getAttribute('href').substr(1);
            Visibility_ToggleByClass(sel);
         });
      }
   });
});
