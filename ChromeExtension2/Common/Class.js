// ========================================================================
//        Copyright � 2008 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the applying and removing of classes to elements in a Web page.
//
// <p><a href="#data" onclick="Class_ToggleById('data','someclass')">Toggle</a></p>
// <div id="data" class="temp">
// <p>This is some text that.</p>
// </div>
//
// Alternative uses:
// <p><a href="#data" onclick="Class_Add('data','someclass)">Apply</a></p>
// <p><a href="#data" onclick="Class_Remove('data''someclass')">Remove</a></p>


function Class_GetByElement(elem)
{
   assert(elem != null);
   return Utilities_StringToArray(elem.className, ' ');
}

// can be passed a comma separated list that are ORed
function Class_HasByElement(elem, className)
{
   assert(elem != null)
	let classNames = className.split(',');
	for (var i = 0; i < classNames.length; i++)
	{
// DRL This was matching on sub-stings, and we don't need to support old Firefox.
//		// older versions of Firefox don't support classList so we do this instead...
//		var myclass = new RegExp('\\b'+classNames[i].trim()+'\\b');
//		if (myclass.test(elem.className))
//			return true;
		assert('classList' in elem);
		if (elem.classList.contains(classNames[i].trim()))
			return true;
	}
	return false;
}

// classNames can be a single name or an array
function Class_AddByElement(elem, classNames)
{
	assert(elem != null);
	if (!Array.isArray(classNames))
		classNames = [classNames];

	let changed = false;
	for (let className of classNames)
	{
		if (!Class_HasByElement(elem, className))
		{
			// older versions of Firefox don't support classList so we do this instead...
			elem.className = Utilities_CombineStrings(' ', elem.className, className);
			changed = true;
		}
	}
	return changed;
}

// classNames can be a single name or an array
function Class_RemoveByElement(elem, classNames)
{
   assert(elem != null);

	if (!Array.isArray(classNames))
		classNames = [classNames];
	
	// older versions of FIrefox don't support classList so we do this instead...
	let classes = Utilities_StringToArray(elem.className, ' ');

	let changed = false;
	for (let className of classNames)
	{
		if (Utilities_RemoveFromArray(classes, className, true) > 0)
			changed = true;
	}
	if (changed)
		elem.className = classes.join(' ');
	
	return changed;
}

function Class_ToggleByElement(elem, className)
{
	if (Class_HasByElement(elem, className))
		return Class_RemoveByElement(elem, className);
	else
		return Class_AddByElement(elem, className);
}

function Class_SetByElement(elem, className, enable)
{
	if (enable)
		return Class_AddByElement(elem, className);
	else
		return Class_RemoveByElement(elem, className);
}

function Class_HasById(id, className)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return Class_HasByElement(elem, className);
	return false;
}

function Class_AddById(id, className)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return Class_AddByElement(elem, className);
	return false;
}

function Class_RemoveById(id, className)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return Class_RemoveByElement(elem, className);
	return false;
}

function Class_ToggleById(id, className)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return Class_ToggleByElement(elem, className);	
	return false;
}

function Class_SetById(id, className, enable)
{
	var elem = Utilities_GetElementById(id);
	if (elem)
		return Class_SetByElement(elem, className, enable);	
	return false;
}

function Class_RemoveClassFromAll(className)
{
   var result = false;
	var elems = Utilities_GetElementsByClass(className);
	for (var i = 0; i < elems.length; i++)
	{
		if (Class_RemoveByElement(elems[i], className))
         result = true;
   }
	return result;
}

