// ========================================================================
//        Copyright � 2008 Dominique Lacerte, All Rights Reserved.
//
// Redistribution and use in source and binary forms are prohibited without
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the showing and hiding of elements in a Web page.
//
// Usage:
//
// <p><a href="#data" onclick="EnableDisable_ToggleById('data')">Toggle</a></p>
// <INPUT id='data' type='button' value='Send Message'>


function EnableDisable_IsEnabledByElement(elem)
{
	return !elem.disabled;
}

function EnableDisable_SetByElement(elem, enabled)
{
	elem.disabled = !enabled;
	return true;
}

function EnableDisable_EnableByElement(elem)
{
	return EnableDisable_SetByElement(elem, 1);
}

function EnableDisable_DisableByElement(elem)
{
	return EnableDisable_SetByElement(elem, 0);
}

function EnableDisable_ToggleByElement(elem)
{
	return EnableDisable_SetByElement(elem, !EnableDisable_IsEnabledByElement(elem));
}

function EnableDisable_IsEnabledById(id)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return EnableDisable_IsEnabledByElement(elem);
	return false;
}

function EnableDisable_SetById(id, enabled)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return EnableDisable_SetByElement(elem, enabled);
	return false;
}

function EnableDisable_EnableById(id)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return EnableDisable_EnableByElement(elem);
	return false;
}

function EnableDisable_DisableById(id)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return EnableDisable_DisableByElement(elem);
	return false;
}

function EnableDisable_ToggleById(id)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return EnableDisable_ToggleByElement(elem);
	return false;
}

function EnableDisable_IsEnabledByClass(className)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (EnableDisable_IsEnabledByElement(elems[i]))
			result = true;
	}
	return result;
}

function EnableDisable_SetByClass(className, enabled)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (EnableDisable_SetByElement(elems[i], enabled))
			result = true;
	}
	return result;
}

function EnableDisable_EnableByClass(className)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (EnableDisable_EnableByElement(elems[i]))
			result = true;
	}
	return result;
}

function EnableDisable_DisableByClass(className)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (EnableDisable_DisableByElement(elems[i]))
			result = true;
	}
	return result;
}

function EnableDisable_ToggleByClass(className)
{
	var result = false;
	var elems = Utilities_GetElementsByClass(className);
	for(var i = 0, len = elems.length; i < len; i++)
	{
		if (EnableDisable_ToggleByElement(elems[i]))
			result = true;
	}
	return result;
}
