// ========================================================================
//        Copyright (c) 2010 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

var TRUE = true;
var FALSE = false;
var NULL = null;

// array-like enumeration
if (!Array.forEach)	// mozilla already supports this
{
	Array.forEach = function(array, block, context)
	{
		for (var i = 0; i < array.length; i++)
		{
			block.call(context, array[i], i, array);
		}
	};
}

// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
   Array.from = (function () {
      var toStr = Object.prototype.toString;
      var isCallable = function (fn) {
         return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
      };
      var toInteger = function (value) {
         var number = Number(value);
         if (isNaN(number)) { return 0; }
         if (number === 0 || !isFinite(number)) { return number; }
         return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      var maxSafeInteger = Math.pow(2, 53) - 1;
      var toLength = function (value) {
         var len = toInteger(value);
         return Math.min(Math.max(len, 0), maxSafeInteger);
      };
      
      // The length property of the from method is 1.
      return function from(arrayLike/*, mapFn, thisArg */) {
         // 1. Let C be the this value.
         var C = this;
         
         // 2. Let items be ToObject(arrayLike).
         var items = Object(arrayLike);
         
         // 3. ReturnIfAbrupt(items).
         if (arrayLike == null) {
            throw new TypeError('Array.from requires an array-like object - not null or undefined');
         }
         
         // 4. If mapfn is undefined, then let mapping be false.
         var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
         var T;
         if (typeof mapFn !== 'undefined') {
            // 5. else
            // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
            if (!isCallable(mapFn)) {
               throw new TypeError('Array.from: when provided, the second argument must be a function');
            }
            
            // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 2) {
               T = arguments[2];
            }
         }
         
         // 10. Let lenValue be Get(items, "length").
         // 11. Let len be ToLength(lenValue).
         var len = toLength(items.length);
         
         // 13. If IsConstructor(C) is true, then
         // 13. a. Let A be the result of calling the [[Construct]] internal method
         // of C with an argument list containing the single item len.
         // 14. a. Else, Let A be ArrayCreate(len).
         var A = isCallable(C) ? Object(new C(len)) : new Array(len);
         
         // 16. Let k be 0.
         var k = 0;
         // 17. Repeat, while k < len… (also steps a - h)
         var kValue;
         while (k < len) {
            kValue = items[k];
            if (mapFn) {
               A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
            } else {
               A[k] = kValue;
            }
            k += 1;
         }
         // 18. Let putStatus be Put(A, "length", len, true).
         A.length = len;
         // 20. Return A.
         return A;
      };
   }());
}

String.prototype.replaceAt = function(index, replacement, removeLen) {
   if (removeLen === undefined)
      removeLen = replacement.length;
   return this.substr(0, index) + replacement + this.substr(index + removeLen);
};

// generic enumeration
Function.prototype.forEach = function(object, block, context)
{
	for (var key in object)
	{
		if (typeof this.prototype[key] == "undefined")
		{
			block.call(context, object[key], key, object);
		}
	}
};

// character enumeration
String.forEach = function(string, block, context)
{
	Array.forEach(string.split(""), function(chr, index)
	{
		block.call(context, chr, index, string);
	});
};

// globally resolve forEach enumeration
var forEach = function(object, block, context)
{
	if (object)
	{
		var resolve = Object; // default
		if (object instanceof Function)
		{
			// functions have a "length" property
			resolve = Function;
		}
		else if (object.forEach instanceof Function)
		{
			// the object implements a custom forEach method so use that
			object.forEach(block, context);
			return;
		}
		else if (typeof object == "string")
		{
			// the object is a string
			resolve = String;
		}
		else if (typeof object.length == "number")
		{
			// the object is array-like
			resolve = Array;
		}
		resolve.forEach(object, block, context);
	}
};

if (!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(elt /*, from*/)
	{
		var len = this.length;
		var from = Number(arguments[1]) || 0;
		from = (from < 0) ? Math.ceil(from) : Math.floor(from);
		if (from < 0) from += len;		
		for (; from < len; from++)
		{
			if (from in this && this[from] === elt)
				return from;
		}
		return -1;
	};
}

var falsy = /^(?:f(?:alse)?|no?|0+)$/i;
function parseBool(val)
{ 
   return !falsy.test(val) && !!val;
}

if (!String.prototype.includes) {
   String.prototype.includes = function(search, start) {
      'use strict';
      if (typeof start !== 'number') {
         start = 0;
      }
      
      if (start + search.length > this.length) {
         return false;
      } else {
         return this.indexOf(search, start) !== -1;
      }
   };
}

function isset(value)
{
	return value !== undefined && value !== null;
}

function is_array(value)
{
	return typeof(value) == 'object' && (value instanceof Array);
}

function strlen(str)
{
	return str.length;
}

function strpos(haystack, needle, offset)
{
	var i = (haystack + '').indexOf(needle, (offset || 0));
	return i === -1 ? false : i;
}

function strrpos(haystack, needle, offset)
{
	var i = -1;
	if (offset)
	{
		i = (haystack + '').slice(offset).lastIndexOf(needle); // strrpos' offset indicates starting point of range till end,
		// while lastIndexOf's optional 2nd argument indicates ending point of range from the beginning
		if (i !== -1) i += offset;
	}
	else
		i = (haystack + '').lastIndexOf(needle);
	return i >= 0 ? i : false;
}

function substr(str, ind, len)
{
   return str.substr(ind, len);
}

function split(str, sep)
{
   return str.split(sep);
}

function preg_replace(match, replace, str)
{
   return str.replace(match, replace);
}

function strtolower(str)
{
	return str.toLowerCase();
}

function strtoupper(str)
{
	return str.toUpperCase();
}

function strcmp(str1, str2)
{
	return (str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1);
}

function empty(value)
{
	return !isset(value) || value.length == 0;
}

String.prototype.isEmpty = function()
{
   return (this.length == 0 || !this.trim());
}

// there is some funky interpretation going on when we set the innerHtml so this does the appropriate conversion
// so we can handle all sorts of characters
function Utilities_SetInnerHtml(elem, str, isHtml)
{
   if (str != null && isHtml != true)
   {
      str = str.replace(/[\u00A0-\u9999\<\>\&\'\"\\\/]/gim, function(c){
         return '&#' + c.charCodeAt(0) + ';' ;
      });
   }
   elem.innerHTML = str;
}

function Utilities_GetInnerHTML(elem)
{
	value = elem.innerHTML;
	
// I believe this is not used.
//	if (isset(value))
//	{
//		// replace any tags because on mobile devices you'll sometimes see <a href="tel:1234567">1234567</a>
//		var regex = /(<([^>]+)>)/ig;
//		value = value.replace(regex, "");
//	}
	
	return value;
}

function Utilities_Any(array, callback)
{
//   if (array == null || !is_array(array)) { Log_Die("No array!"); }
      
	for (var i = 0; i < array.length; i++)
	{
		if (callback(array[i]))
         return true;
	}
   return false;
}

function Utilities_All(array, callback)
{
//   if (array == null || !is_array(array)) { Log_Die("No array!"); }
      
	for (var i = 0; i < array.length; i++)
	{
		if (!callback(array[i]))
         return false;
	}
   return true;
}

// NOTE: the callback will be passed an event ID, need to call Utilities_GetEvent() to get the actual event!
function Utilities_AddEvent(object, type, callback)
{
   if (object == null || typeof(object) == 'undefined')
      return;
   
   if (object.addEventListener)
   {
      object.addEventListener(type, callback, false);
   }
   else if (object.attachEvent)
   {
      object.attachEvent("on" + type, callback);
   }
   else
   {
      object["on" + type] = callback;
   }
}

function Utilities_RemoveEvent(object, type, callback)
{
   if (object == null || typeof(object) == 'undefined')
      return;
   
   if (object.removeEventListener)
   {
      object.removeEventListener(type, callback, false);
   }
   else if (object.detachEvent)
   {
      object.detachEvent("on" + type, callback);
   }
   else
   {
      object["on" + type] = null;
   }
}

function Utilities_FireEvent(object, type)
{
   if (object == null || typeof(object) == 'undefined')
      return;
      
   if (typeof window.Event == "function")
   {
      var evt = new Event(type);
      if (evt == null)
      {
         Log_Die('Unsupported event type: ' + type);
         return;
      }
      object.dispatchEvent(evt);
   }
   else if ("createEvent" in document)
   {
      var evt = document.createEvent("Event");
      evt.initEvent(type, false, true);
      element.dispatchEvent(evt);
   }
   else
   {
      element.fireEvent("on" + type);
   }
}

// DRL FIXIT! This should incorporate the logic from the above!
function Utilities_TriggerMouseEvent(node, eventType)
{
   let clickEvent = document.createEvent ('MouseEvents');
   clickEvent.initEvent (eventType, true, true);
   node.dispatchEvent (clickEvent);
}

// some browsers don't pass the event into the callback so we must use this helper
function Utilities_GetEvent(e)
{
   return e || window.event;
}

// the element that was listening for the event
function Utilities_GetEventTarget(e)
{
   var event = Utilities_GetEvent(e);
   return event.currentTarget || event.target;
}

// the element that triggered the event (button, etc.)
function Utilities_GetEventTrigger(e)
{
   var event = Utilities_GetEvent(e);
   return event.target || event.currentTarget;
}

function Utilities_StopEventPropagation(e)
{
   var event = Utilities_GetEvent(e);
   
   //IE9 & Other Browsers
   if (event.stopPropagation)
   {
      event.stopPropagation();
   }
   //IE8 and Lower
   else
   {
      event.cancelBubble = true;
   }
}

function Utilities_PreventDefaultForEvent(e)
{
   var event = Utilities_GetEvent(e);
   
   //IE9 & Other Browsers
   if (event.preventDefault)
   {
      event.preventDefault();
   }
   //IE8 and Lower
   else
   {
      event.defaultPrevented = true;
   }
}
/* Not used.
function Utilities_WatchElementForChanges(elem, callback)
{
   let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
   let observer = new MutationObserver(function() { callback(elem); });
   observer.observe(elem, {childList: true});
   return observer;
}

function Utilities_UnwatchElementForChanges(observer)
{
   observer.disconnect();
}
*/
function Utilities_GetElementById(id, root)
{
   assert(id != null && id != "");
	var result;
	if (document.getElementById)			// this is the way the standards work
		result = document.getElementById(id);
	if (!result && document.all)			// this is the way old msie versions work
		result = document.all[id];
	else if (!result && document.layers)	// this is the way nn4 works
		result = document.layers[id];
	if (result && root && !Utilities_HasAsParent(result, root))
	   result = null;
	return result;
}

function Utilities_GetElementsBySelector(selector, root, includeRoot)
{
   if (root == null) root = document;
   
   let result = Array.from(root.querySelectorAll(selector));
   if (includeRoot && root.matches(selector))
      result.push(root);
   return result;
}

// className can contain CSV values
function Utilities_GetElementsByClass(className, tagName, root, includeRoot)
{
	if (root == null) root = document;
	
	let classNames = className.includes(',') ? className.split(',') : [className];
	let filter = '';
   forEach(classNames, function(className)
   {
      if (filter)
         filter += ',';
      if (tagName)
         filter += tagName;
      filter += '.' + className;
   });

	let result = Array.from(root.querySelectorAll(filter));
	if (includeRoot && root.matches(filter))
	   result.push(root);
	return result;
}

function Utilities_GetElementsByTag(tagName, root)
{
   if (root == null) root = document;
   
   return Array.from(root.querySelectorAll(tagName));
}

function Utilities_GetElementByName(name, root)
{
   if (root == null) root = document;
   
   return root.querySelector('[name="' + name + '"]');
}

function Utilities_GetCheckedElementByName(name, root)
{
   if (root == null) root = document;
   
   return root.querySelector('[name="' + name + '"]:checked');
}

function Utilities_GetElementsByName(name, root)
{
   if (root == null) root = document;
   
   return Array.from(root.querySelectorAll('[name="' + name + '"]'));
}

function Utilities_GetElement(item)
{
   if (typeof item == 'string' || item instanceof String)
   {
      if (item.substring(0,1) == '#')
         item = item.substring(1);
      assert(item != "");
   	var elem = Utilities_GetElementById(item);
      if (elem == null)
   	   elem = Utilities_GetElementByName(item);
      assert(elem != null);
      item = elem;
   }
   
   return item;
}

function Utilities_GetLabelsForInputElement(element)
{
   var labels = [];
   var id = element.id;
   
   if (element.labels)
   {
      return Array.from(element.labels);  // convert NodeList to Array
   }
   
   id && Array.prototype.push.apply(labels, document.querySelector("label[for='" + id + "']"));
   
   while ((element = element.parentNode) && element.tagName != 'BODY')
   {
      if (element.tagName.toLowerCase() == "label")
      {
         labels.push(element);
      }
   }
   
   return labels;
}

function Utilities_GetThisOrParentByTag(elem, tagName)
{
   tagName = tagName.toUpperCase();
   while (elem)
   {
      if (elem.tagName.toUpperCase() == tagName)
         return elem;
      elem = elem.parentElement;
   }
   return null;
}

function Utilities_GetParentByTag(elem, tagName)
{
   tagName = tagName.toUpperCase();
   while (elem)
   {
      elem = elem.parentElement;
      if (elem != null && elem.tagName.toUpperCase() == tagName)
         return elem;
   }
   return null;
}

// NOTE: className can be an array, will match on any class in the array
function Utilities_GetParentByClass(elem, className)
{
   if (Object.prototype.toString.call(className) !== '[object Array]')
      className = [className];
   var result = null;
   while (elem && !result)
   {
      elem = elem.parentElement;
      if (elem != null)
      {
         forEach(className, function(name)
         {
            if (Class_HasByElement(elem, name))
               result = elem;
         });
      }
   }
   return result;
}

function Utilities_GetThisOrParentByClass(elem, className)
{
   if (Object.prototype.toString.call(className) !== '[object Array]')
      className = [className];
   var result = null;
   while (elem && !result)
   {
      forEach(className, function(name)
      {
         if (Class_HasByElement(elem, name))
            result = elem;
      });
      elem = elem.parentElement;
   }
   return result;
}

function Utilities_GetParentBySelector(elem, selector)
{
   var result = null;
   while (elem && !result)
   {
      elem = elem.parentElement;
      if (elem != null)
      {
         if (elem.matches(selector))
            result = elem;
      }
   }
   return result;
}

function Utilities_GetThisOrParentBySelector(elem, selector)
{
   var result = null;
   while (elem && !result)
   {
      if (elem != null)
      {
         if (elem.matches(selector))
            result = elem;
      }
      elem = elem.parentElement;
   }
   return result;
}

// returns an array (could be empty)
function Utilities_GetThisOrChildrenBySelector(elem, selector)
{
   assert(typeof elem.nodeName != undefined);
   
   if (elem.matches(selector))
      return [elem];
   
   return Array.from(elem.querySelectorAll(selector));
}

// NOTE: className can be an array
function Utilities_GetParentsChildByClass(elem, className)
{
   if (Object.prototype.toString.call(className) !== '[object Array]')
      className = [className];
   var result = null;
   var parent = null;
   while (elem && !parent)
   {
      result = elem;
      forEach(className, function(name)
      {
         if (Class_HasByElement(elem, name))
            parent = elem;
      });
      elem = elem.parentElement;
   }
   if (!parent)
      result = null; // not found
   return result;
}

function Utilities_HasOffspringWithSelector(elem, selector)
{
   for (var i = 0; i < elem.children.length; i++)
   {
      if (elem.children[i].matches(selector) ||
         Utilities_HasOffspringWithSelector(elem.children[i], selector))
         return true;
   }
   
   return false;
}

function Utilities_SetNodeText(node, text)
{
   while (node.firstChild)
   {
       node.removeChild(node.firstChild);
   }
   node.appendChild(document.createTextNode(text));
}

function Utilities_GetRadioValue(name, node)
{
   var elems = Utilities_GetElementsByName(name, node)

   for (i = 0; i < elems.length; i++)
   {
      if(elems[i].checked)
         return elems[i].value;
   }

   return null;
}

function Utilities_CreateHtmlNode(htmlStr)
{
	var temp = document.createElement('div');
	temp.innerHTML = htmlStr;
//   var temp = new DOMParser().parseFromString(htmlStr, 'text/html').body;
   
   var frag = document.createDocumentFragment();
   while (temp.firstChild)
   {
      frag.appendChild(temp.firstChild);
   }

	return frag;
}

function Utilities_CloneNode(orgNode)
{
   var orgNodeEvents = Utilities_GetElementsByTag('*', orgNode);
   var cloneNode = orgNode.cloneNode( true );
   var cloneNodeEvents = Utilities_GetElementsByTag('*', cloneNode);

   var allEvents = new Array('onabort','onbeforecopy','onbeforecut','onbeforepaste','onblur','onchange','onclick',
      'oncontextmenu','oncopy','ondblclick','ondrag','ondragend','ondragenter', 'ondragleave' ,
      'ondragover','ondragstart', 'ondrop','onerror','onfocus','oninput','oninvalid','onkeydown',
      'onkeypress', 'onkeyup','onload','onmousedown','onmousemove','onmouseout',
      'onmouseover','onmouseup', 'onmousewheel', 'onpaste','onreset', 'onresize','onscroll','onsearch', 'onselect','onselectstart','onsubmit','onunload');


   // The node root
   for (var j = 0; j < allEvents.length ; j++)
   {
      eval('if (orgNode.'+allEvents[j]+') cloneNode.'+allEvents[j]+' = orgNode.'+allEvents[j]);
   }

   // Node descendants
   for (var i = 0; i < orgNodeEvents.length; i++)
   {
      for (var j = 0; j < allEvents.length; j++)
      {
         eval('if (orgNodeEvents[i].'+allEvents[j]+') cloneNodeEvents[i].'+allEvents[j]+' = orgNodeEvents[i].'+allEvents[j]);
      }
   }

   return cloneNode;
}

function Utilities_InsertAfterNode(parent, node, referenceNode)
{
	parent.insertBefore(node, referenceNode.nextSibling);
}

function Utilities_InsertBeforeNode(parent, node, referenceNode)
{
	parent.insertBefore(node, referenceNode);
}

function Utilities_Mod(numerator, denominator)
{
   return Math.abs(numerator) % Math.abs(denominator);
}

function Utilities_Div(numerator, denominator)
{
   var remainder = Math.abs(numerator) % Math.abs(denominator);
   if (numerator * denominator < 0) { remainder = -remainder; }
   var quotient = (numerator - remainder) / denominator;
   return quotient;
}

function Utilities_RemoveQuotes(str)
{
	return Utilities_ReplaceInString(str, '"', '');
}

function Utilities_RemoveSurroundingSpaces(str)
{
	var expr = new RegExp(/^[\r\n\t ]+/g);
	str = str.replace(expr,"");
	expr = new RegExp(/[\r\n\t ]+$/g);
	return str.replace(expr,"");
}

function Utilities_RemoveSurroundingAngleBrackets(str)
{
	var expr = new RegExp(/^</g);
	str = str.replace(expr,"");
	expr = new RegExp(/>/g);
	return str.replace(expr,"");
}

function Utilities_NormalizeSpaces(str)
{
	str = Utilities_RemoveSurroundingSpaces(str);
	var expr = new RegExp(/[\r\n\t ]+/g);
	return str.replace(expr," ");
}

function Utilities_CombineStrings(separator, item1, item2)
{
	if (!empty(item1) && !empty(item2))
		return item1 + separator + item2;
	if (!empty(item2))
		return item2;
	return item1;
}

function Utilities_ShortenWithEllipsis(str, len)
{
	if (str.length <= len)
		return str;
	return Utilities_RemoveSurroundingSpaces(substr(str, 0, len-3)) + '...';
}

function Utilities_ShortenWithCenterEllipsis(str, len)
{
	if (str.length <= len)
		return str;
	len -= 3;
   i = Utilities_Div(len, 2);
	return Utilities_RemoveSurroundingSpaces(substr(str, 0, i)) + '...' + 
      Utilities_RemoveSurroundingSpaces(substr(str, str.length-i));
}

function Utilities_ReplaceInString(str, find, replace)
{
   if (str == null)
      return null;
	find = Utilities_RegexpEscape(find);
	var expr = new RegExp(find,'g');
	return str.replace(expr,replace);
}

function Utilities_ReplaceCharsInString(str, findChars, replace)
{
   if (str == null)
      return null;
	findChars = Utilities_RegexpEscape(findChars);
	var expr = new RegExp("[" + findChars + "]",'g');
	return str.replace(expr,replace);
}

function Utilities_StringContains(string, value)
{
   if (string == null)
      return false;
	value = Utilities_RegexpEscape(value);
	var expr = new RegExp(value);
	return expr.test(string);
}

function Utilities_StringContainsAny(string, array)
{
   if (string == null)
      return false;
	for (var i = 0; i < array.length; i++)
	{
		var value = Utilities_RegexpEscape(array[i]);
		var expr = new RegExp(value);
		if (expr.test(string))
		{
			return 1;
		}
	}
	return 0;
}

function Utilities_DecodeHtml(str, safeEscape)
{
   if (str && typeof str === 'string')
   {
      str = str.replace(/\</g, '&lt;');

      // DRL FIXIT? Make this global?
      var el = document.createElement('div');
      
      el.innerHTML = str;
      if (el.innerText)
      {
         str = el.innerText;
         el.innerText='';
      }
      else if (el.textContent)
      {
         str = el.textContent;
         el.textContent = '';
      }
      
      if (safeEscape)
         str = str.replace(/\</g, '&lt;');
   }
   return str;
}

// DRL FIXIT? Move this to an HTML module to match the PHP structure.
function Utilities_HtmlToText(str)
{
   var returnText = str;
   
   //-- remove BR tags and replace them with line break
   returnText=returnText.replace(/<br>/gi, "\n");
   returnText=returnText.replace(/<br\s\/>/gi, "\n");
   returnText=returnText.replace(/<br\/>/gi, "\n");
   
   //-- remove P and A tags but preserve what's inside of them
   returnText=returnText.replace(/<p.*?>/gi, "\n");
   returnText=returnText.replace(/<a.*?href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");
   
   //-- remove all inside SCRIPT and STYLE tags
   returnText=returnText.replace(/<script.*?>[\w\W]{1,}(.*?)[\w\W]{1,}<\/script>/gi, "");
   returnText=returnText.replace(/<style.*?>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, "");
   //-- remove all else
   returnText=returnText.replace(/<(?:.|\s)*?>/g, "");
   
   //-- get rid of more than 2 multiple line breaks:
   returnText=returnText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n");
   
   //-- get rid of more than 2 spaces:
   returnText = returnText.replace(/ +(?= )/g,'');
   
   //-- get rid of html-encoded characters:
   returnText=returnText.replace(/&nbsp;/gi," ");
   returnText=returnText.replace(/&amp;/gi,"&");
   returnText=returnText.replace(/&quot;/gi,'"');
   returnText=returnText.replace(/&lt;/gi,'<');
   returnText=returnText.replace(/&gt;/gi,'>');
   
   //-- return
   return returnText;
}

function Utilities_SortArray(ref_array, ignoreCase)
{
   if (!Utilities_empty(ignoreCase) && ignoreCase)
   {
      ref_array.sort(function(x,y) 
      {
         var a = strtoupper(String(x));
         var b = strtoupper(String(y));
         if (a > b)
            return 1
         if (a < b)
            return -1
         return 0;
      });
   }
   else
   {
      ref_array.sort();
   }
}

function Utilities_SortNumericArray(ref_array)
{
   ref_array.sort(function(x,y){ return x-y; });
}

function Utilities_OrderArray(ref_array)
{
	ref_array.sort(function(a,b){return a-b});
}

function Utilities_StringToArray(str, separator)
{
   if (empty(separator)) separator = ',';
   if (empty(str)) return new Array();
   return str.split(separator);
}

// The "separators" are characters to split on (i.e. ",;."), and "groups" are hashes where the key is the start of
// the group (i.e. "{") and the value is the end of the group (i.e. "}"). The code handles ignoring any of these inside
// strings and regexp delimited by a double quote, single quote, or slash. It also ignores separators inside groups.
// DRL FIXIT? Could be improved to allow groups to be multiple characters.
function Utilities_StringToArraySkipGroups(str, separators, groups, includeSeparators)
{
   let i = 0;
   let ch = null;
   let nesting = ''; // stack of pushed group terminators (i.e. "}}")
   let lastSeparator = 0;
   let startString = null;
   let startComment = null;
   let result = [];
   while (i < str.length)
   {
      const ch = str[i];
      if (startComment != null)
      {
         // in a comment
         
         if (ch == '*' && str[startComment+1] == '*' && str[i+1] == '/')
         {
            str = str.replaceAt(startComment, '', i-startComment+2);
            i = startComment;
            startComment = null;
         }
         else if (ch == '\n' && str[startComment+1] == '/')
         {
            str = str.replaceAt(startComment, '', i-startComment);
            i = startComment;
            startComment = null;
         }
      }
      else if (startString != null)
      {
         // in a string or regexp
         
         if (ch == str[startString])
         {
            startString = null;
         }
         else if (ch == '\\')
         {
            i++;  // skip the quoted character
         }
      }
      else
      {
         if (nesting.length == 0 && separators.indexOf(ch) != -1)
         {
            result.push(str.substr(lastSeparator, i - lastSeparator));
            if (includeSeparators)
               result.push(ch);  // the separator is pushed as its own item
            lastSeparator = i+1; // ready for next chunk starting after the separator
         }
         else if (ch == nesting.substr(nesting.length-1))
         {
            nesting = nesting.substr(0, nesting.length-1);
         }
         else if (ch == '/' && (str[i+1] == '/' || str[i+1] == '*'))
         {
            assert(startComment == null);
            startComment = i;
         }
         else if (ch == "'" || ch == '"' || ch == '/')   // string or regexp
         {
            startString = i;
         }

         if (groups.hasOwnProperty(ch))
         {
            // start of a new group
            nesting += groups[ch];
         }
      }
      
      i++;
   }
   
   assert(startString === null);
   assert(startComment === null);
   
   if (lastSeparator < str.length)
      result.push(str.substr(lastSeparator));   // add the last chunk
   
   return result;
}

function Utilities_CollectionToArray(coll)
{
   var arr = [];
   for (var i = 0; i < coll.length; i++)
      arr.push(coll[i]);
   return arr;
}

function Utilities_ArrayFirstKey(array)
{
   let keys = Object.keys(array);
   if (keys.length == 0)
      return NULL;
   return keys[0];
}

function Utilities_ArrayNthKey(array, n)
{
   let keys = Object.keys(array);
   if (keys.length <= n)
      return NULL;
   return keys[n];
}

function Utilities_ArrayLastKey(array)
{
   let keys = Object.keys(array);
   if (keys.length == 0)
      return NULL;
   return keys[keys.length-1];
}

function Utilities_ArrayFirstValue(array)
{
   let keys = Object.keys(array);
   if (keys.length == 0)
      return NULL;
   return array[keys[0]];
}

function Utilities_ArrayNthValue(array, n)
{
   let keys = Object.keys(array);
   if (keys.length <= n)
      return NULL;
   return array[keys[n]];
}

function Utilities_ArrayLastValue(array)
{
   let keys = Object.keys(array);
   if (keys.length == 0)
      return NULL;
   return array[keys[keys.length-1]];
}

function Utilities_ConcatArrays()
{
	var result = arguments[0].slice();	// make a copy of the first array
	
	// isn't there a more efficient way then pushing each individual item?
	for (var i = 1; i < arguments.length; i++)
	{
		for (var j = 0; j < arguments[i].length; j++)
		{
			result.push(arguments[i][j]);	// push each element from the other arrays
		}
	}
	
	return result;
}

function Utilities_ArrayEquals(array1, array2, ignoreOrder, ignoreCase)
{
	if (ignoreOrder == null) { ignoreOrder = 0; }
	if (ignoreCase == null) { ignoreCase = 0; }
	
	if (array1.length != array2.length)
	{
		return false;
	}
	
	if (ignoreOrder)
	{
		var temp = array2.slice();	// make a copy
		
		for (var j = 0; j < array1.length; j++)
		{
			var item = array1[j];
			var i;
			var found = 0;
			
			for (i = 0; i < temp.length; i++)
			{
				if (Utilities_ValuesEqualOrBothUndef(temp[i], item, ignoreOrder, ignoreCase))
				{
					found = 1;
					break;
				}
			}

			if (found)
			{
				temp.splice(i, 1);
			}
			else
			{
				return false;
			}
		}
	}
	else
	{
		for (var i = 0; i < array1.length; i++)
		{
			if (!Utilities_ValuesEqualOrBothUndef(array1[i], array2[i], ignoreOrder, ignoreCase))
			{
				return false;
			}
		}
	}
	
	return true;
}

function Utilities_HashEquals(array1, array2, ignoreOrder, ignoreCase)
{
   if (ignoreOrder == null) { ignoreOrder = 0; }
   if (ignoreCase == null) { ignoreCase = 0; }
   
   var props1 = Object.getOwnPropertyNames(array1);
   var props2 = Object.getOwnPropertyNames(array2);
   
   if (props1.length != props2.length)
   {
      return false;
   }
   
   var result = true;
   forEach(props1, function(prop)
   {
      if (!Utilities_ArrayContains(props2, prop) ||
         !Utilities_ValuesEqualOrBothUndef(array1[prop], array2[prop], ignoreOrder, ignoreCase))
      {
         result = false;
      }
   });
   
   return result;
}

function Utilities_ArrayContains(array, value, ignoreCase)
{
	if (ignoreCase == null) { ignoreCase = 0; }

	if (array == null) { Log_Die("No array!"); }

	for (var i = 0; i < array.length; i++)
	{
		var item = array[i];
		if (Utilities_ValuesEqualOrBothUndef(item, value, 0, ignoreCase))
		{
			return 1;
		}
	}
	
	return 0;
}

function Utilities_ArraysMeet(ref_array1, ref_array2, ignoreCase)
{
	if (ignoreCase == null) { ignoreCase = 0; }
	
	for (var i = 0; i < ref_array1.length; i++)
	{
		var item1 = ref_array1[i];
		for (var j = 0; j < ref_array2.length; j++)
		{
			var item2 = ref_array2[j];
			if (Utilities_ValuesEqualOrBothUndef(item1, item2, 0, ignoreCase))
			{
				return 1;
			}
		}
	}
	
	return 0;
}

function Utilities_ArrayIndexOf(ref_array, value)
{
	for (i = 0; i < ref_array.length; i++)
	{
		if (ValuesEqualOrBothUndef(ref_array[i], value))
		{
			return i;
		}
	}
	
	return -1;
}

function Utilities_MergeIntoArray(ref_array1, ref_array2)
{
	for (var i = 0; i < ref_array2.length; i++)
	{
		var item = ref_array2[i];
		if (!Utilities_ArrayContains(ref_array1, item))
		{
			ref_array1.push(item);
		}
	}
}

function Utilities_UnionArrays(ref_array1, ref_array2)
{
   var result = new Array();
   for (var i = 0; i < ref_array2.length; i++)
   {
      var item = ref_array2[i];
      if (Utilities_ArrayContains(ref_array1, item))
      {
         result.push(item);
      }
   }
   return result;
}

// "keys" can be a single item or an array of keys
// returns number of removed items
function Utilities_TrimArrayByKey(array, keys)
{
   let ret = 0;
   
   if (!(keys instanceof Array))
      keys = [keys];
   
   for (const key in array)
   {
      if (!Utilities_ArrayContains(keys, key))
      {
         delete array[key];
         ret++;
      }
   }
   
   return ret;
}

// avoids adding duplicates
function Utilities_AddToArray(array, item)
{
	if (!Utilities_ArrayContains(array, item))
	{
		array.push(item);
		return true;
	}
	
	return false;
}

// value can be an array
function Utilities_RemoveFromArray(array, value, compareInstances)
{
   var count = 0;
   
   if (!Array.isArray(value))
      value = [value];
   
   for (var i = 0; i < array.length; i++)
   {
      for (var j = 0; j < value.length; j++)
      {
         if (compareInstances
            ? (array[i] == value[j])
            : Utilities_ValuesEqualOrBothUndef(array[i], value[j]))
         {
            array.splice(i, 1);
            i--;
            count++;
         }
      }
   }
   
   return count;
}

function Utilities_ArrayRemoveDuplicates(array)
{
   // this is a fast way but also creates a new array so we use it only to provide a reference
   let unique = [...new Set(array)];
   // then we massage the existing array in-place (wish there was a more efficeint way)
   let len = array.length;
   for (let i = 0; i < array.length; i++)
   {
      if (!Utilities_ArrayContains(unique, array[i]))
         array.splice(i--, 1);
      else
         unique.splice(unique.indexOf(array[i]), 1);
   }
   return len - array.length;
}

function Utilities_ValuesEqualOrBothUndef(item1, item2, ignoreOrder, ignoreCase)
{
	if (ignoreOrder == null) { ignoreOrder = 0; }
	if (ignoreCase == null) { ignoreCase = 0; }
	
	if (item1 == null && item2 == null)
		return true;
	if (item1 == null || item2 == null)
		return false;
	
	if (typeof item1 == "object" && typeof item2 == "object")
	{
		return Utilities_ArrayEquals(item1, item2, ignoreOrder, ignoreCase);
	}
	if (typeof item1 == "object" || typeof item2 == "object")
	{
		return 0;
	}
	
	if (ignoreCase)
	{
		item1 = strtoupper(item1);
		item2 = strtoupper(item2);
	}
	return item1 == item2;
}

function Utilities_RegexpEscape(str)
{
	var chars = ["\\", '.', '[', '^', '$', "\x00", '|', '*', '+', '-', '?', '('];
	
	for (var i = 0; i < chars.length; i++)
	{
		var ch = chars[i];
		ch = "\\" + ch;
		var expr = new RegExp(ch,'g');
		str = str.replace(expr,ch);
	}
	
	return str;
}

function Utilities_IsAlphaNumeric(value)
{
	var expr = /^[0-9a-zA-Z\s]+$/;
	return expr.test(value);
}

function Utilities_IsInteger(value)
{
	var expr = /^\-?[0-9]+$/;
	return expr.test(value);
}

function Utilities_IsNumeric(value)
{
	var expr = /^\-?[0-9]*\.?[0-9]+$/;
	return expr.test(value);
}

function Utilities_IsAlphabetic(value)
{
	var expr = /^[a-zA-Z]+$/;
	return expr.test(value);
}

function Utilities_IsWhiteSpace(value)
{
	var expr = /^[\s\r\n\t]+$/;
	return expr.test(value);
}

function Utilities_IsArray(value)
{
	if (strpos(value.constructor.toString(), "Array") === FALSE)
		return false;
	else
		return true;
}

function Utilities_IsString(value)
{
   if (value === null)
      return false;
	// test for string native type
	if (typeof value == 'string')
		return true;
	// test for object wrapping a string native type
	if (typeof value == 'object' && value.constructor.toString().match(/string/i) != null)
		return true;
	return false;
}

function Utilities_IsObject(value)
{
  return Object.prototype.toString.call(value) === '[object Object]';
}

function Utilities_IsValidUrl(string)
{
   var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
   return (res !== null)
}

function Utilities_Chomp(str)
{
  return str.replace(/(\n|\r)+/, '');
}

// returns the elements ID, giving it one if it doesn't have one
function Utilities_ElementId(elem)
{
   if (typeof Utilities_ElementId.LastUniqueID == 'undefined')
      Utilities_ElementId.LastUniqueID = (new Date()).getTime();  // local static variable
      
   if (!elem.id)
   {
      // if the element does not have an ID we'll generate one
      elem.id = 'id_' + Utilities_ElementId.LastUniqueID;
      Utilities_ElementId.LastUniqueID++;
   }
   return elem.id;
}

function Utilities_AddCssStyle(style)
{
   var sheet = document.createElement('style');
   sheet.innerHTML = style;

   document.head.appendChild(sheet);
}

function Utilities_GetElementsByAttribute(attribute)
{
   var matchingElements = [];
   var allElements = Utilities_GetElementsByTag('*');
   for (var i = 0, n = allElements.length; i < n; i++)
   {
      if (allElements[i].getAttribute(attribute) !== null)
      {
         // Element exists with attribute. Add to array.
         matchingElements.push(allElements[i]);
      }
   }
   return matchingElements;
}

function Utilities_ViewportWidth()
{
   return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
}

function Utilities_ViewportHeight()
{
   return window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0;
}

// root is optional and if provided provides the position relative to this element
function Utilities_GetOffset(elem, root)
{
   var _x = 0;
   var _y = 0;
   while (elem && elem != root && (!root || Utilities_HasAsChild(root, elem)) &&
      !isNaN(elem.offsetLeft) && !isNaN(elem.offsetTop))
   {
      _x += elem.offsetLeft - elem.scrollLeft;
      _y += elem.offsetTop - elem.scrollTop;
      if (root && !Utilities_HasAsChild(root, elem.offsetParent))
         break;
      elem = elem.offsetParent;
   }
   assert(root == null || elem != null);
   return {top: _y, left: _x};
}

function Utilities_GetOffset2(elem)
{
   var r = elem.getBoundingClientRect();
   return { left: r.left /*+ window.scrollX*/, top: r.top /*+ window.scrollY*/};
}

function Utilities_IsElementScrollable(elem)
{
   var overflowY = window.getComputedStyle(elem)['overflow-y'];
   var overflowX = window.getComputedStyle(elem)['overflow-x'];
   
   return ((overflowY === 'scroll' || overflowY === 'auto') && elem.scrollHeight > elem.clientHeight) || 
          ((overflowX === 'scroll' || overflowX === 'auto') && elem.scrollWidth > elem.clientWidth);
}

// DRL FIXIT? I think we should revisit the code that uses this method and switch to the one below as
// appropriate since this one seems very context specific in (its weird) behavior.
function Utilities_GetScrollableParentElement(elem)
{
   while (elem && !Utilities_IsElementScrollable(elem))
   {
      elem = elem.parentElement;
   }
   
   if (elem == null)
      elem = document.documentElement;
//      elem = document.body;
   
   return elem;
}

function Utilities_GetScrollableParentElement2(elem)
{
   assert(elem != null);
   if (elem == null)
      return null;
   
   do
   {
      elem = elem.parentElement;
   } while (elem && !Utilities_IsElementScrollable(elem) && elem != document.body);
   
   return elem;
}

function Utilities_HasAsParent(elem, parent)
{
   do
   {
      elem = elem.parentElement;
   } while (elem != null && elem != parent);
   
   return elem != null;
}

function Utilities_HasClassAsParent(elem, className)
{
	var isClassNamePresent = false;	
   do
   {
      elem = elem.parentElement;
	  if(elem && Class_HasByElement(elem, className))
	  {
		  isClassNamePresent = true;
		  break;
	  }
   } while (elem != null);
   
   return isClassNamePresent;
}
/**
 * Get closest parent by class 
 */
function Utilities_Closest(elem, className)
{
   do
   {
      elem = elem.parentElement;
      
      if(elem && Class_HasByElement(elem, className))
      {    
         break;
      }

   } while (elem != null);
   
   return elem;
}


function Utilities_HasAsChild(elem, child)
{
	for (var i = 0; i < elem.children.length; i++)
	{
		if (elem.children[i] == child)
			return true;
      if (Utilities_HasAsChild(elem.children[i], child))
         return true;
	}
   
   return false;
}

function Utilities_HasAsAnyChild(elem, child)
{
	for (var i = 0; i < child.length; i++)
	{
      if (Utilities_HasAsChild(elem, child[i]))
         return true;
	}
   
   return false;
}

function Utilities_GetComputedStyle(elem, name)
{
   let val = window.document.defaultView.getComputedStyle(elem).getPropertyValue(name);
   if ((isNaN(val) || val == "") && elem.parentNode != document)
      return Utilities_GetComputedStyle(elem.parentNode, name); // go up the hierarchy
   return val;
}

function Utilities_IntRand(min, max)   // values are inclusive
{
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

var hasCrypto = undefined;
function Utilities_Sha1(str)
{
   //  discuss at: http://locutus.io/php/sha1/
   // original by: Webtoolkit.info (http://www.webtoolkit.info/)
   // improved by: Michael White (http://getsprink.com)
   // improved by: Kevin van Zonneveld (http://kvz.io)
   //    input by: Brett Zamir (http://brett-zamir.me)
   //      note 1: Keep in mind that in accordance with PHP, the whole string is buffered and then
   //      note 1: hashed. If available, we'd recommend using Node's native crypto modules directly
   //      note 1: in a steaming fashion for faster and more efficient hashing
   //   example 1: sha1('Kevin van Zonneveld')
   //   returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'
   
   var hash = undefined;
   if (hasCrypto != false)
   {
      try {
         var crypto = require('crypto');
         var sha1sum = crypto.createHash('sha1');
         sha1sum.update(str);
         hash = sha1sum.digest('hex');
         hasCrypto = true;
      } catch (e) {
         hasCrypto = false;
         hash = undefined;
      }
   
      if (hash !== undefined) {
         return hash;
      }
   }
   
   var _rotLeft = function (n, s) {
      var t4 = (n << s) | (n >>> (32 - s));
      return t4;
   };
   
   var _cvtHex = function (val) {
      var str = '';
      var i;
      var v;
      
      for (i = 7; i >= 0; i--) {
         v = (val >>> (i * 4)) & 0x0f;
         str += v.toString(16);
      }
      return str;
   };
   
   var blockstart;
   var i, j;
   var W = new Array(80);
   var H0 = 0x67452301;
   var H1 = 0xEFCDAB89;
   var H2 = 0x98BADCFE;
   var H3 = 0x10325476;
   var H4 = 0xC3D2E1F0;
   var A, B, C, D, E;
   var temp;
   
   // utf8_encode
   str = unescape(encodeURIComponent(str));
   var strLen = str.length;
   
   var wordArray = [];
   for (i = 0; i < strLen - 3; i += 4) {
      j = str.charCodeAt(i) << 24 |
         str.charCodeAt(i + 1) << 16 |
         str.charCodeAt(i + 2) << 8 |
         str.charCodeAt(i + 3);
      wordArray.push(j);
   }
   
   switch (strLen % 4) {
      case 0:
         i = 0x080000000;
         break;
      case 1:
         i = str.charCodeAt(strLen - 1) << 24 | 0x0800000;
         break;
      case 2:
         i = str.charCodeAt(strLen - 2) << 24 | str.charCodeAt(strLen - 1) << 16 | 0x08000;
         break;
      case 3:
         i = str.charCodeAt(strLen - 3) << 24 |
            str.charCodeAt(strLen - 2) << 16 |
            str.charCodeAt(strLen - 1) <<
            8 | 0x80;
         break;
   }
   
   wordArray.push(i);
   
   while ((wordArray.length % 16) !== 14) {
      wordArray.push(0);
   }
   
   wordArray.push(strLen >>> 29);
   wordArray.push((strLen << 3) & 0x0ffffffff);
   
   for (blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
      for (i = 0; i < 16; i++) {
         W[i] = wordArray[blockstart + i];
      }
      for (i = 16; i <= 79; i++) {
         W[i] = _rotLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
      }
      
      A = H0;
      B = H1;
      C = H2;
      D = H3;
      E = H4;
      
      for (i = 0; i <= 19; i++) {
         temp = (_rotLeft(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
         E = D;
         D = C;
         C = _rotLeft(B, 30);
         B = A;
         A = temp;
      }
      
      for (i = 20; i <= 39; i++) {
         temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
         E = D;
         D = C;
         C = _rotLeft(B, 30);
         B = A;
         A = temp;
      }
      
      for (i = 40; i <= 59; i++) {
         temp = (_rotLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
         E = D;
         D = C;
         C = _rotLeft(B, 30);
         B = A;
         A = temp;
      }
      
      for (i = 60; i <= 79; i++) {
         temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
         E = D;
         D = C;
         C = _rotLeft(B, 30);
         B = A;
         A = temp;
      }
      
      H0 = (H0 + A) & 0x0ffffffff;
      H1 = (H1 + B) & 0x0ffffffff;
      H2 = (H2 + C) & 0x0ffffffff;
      H3 = (H3 + D) & 0x0ffffffff;
      H4 = (H4 + E) & 0x0ffffffff;
   }
   
   temp = _cvtHex(H0) + _cvtHex(H1) + _cvtHex(H2) + _cvtHex(H3) + _cvtHex(H4);
   return temp.toLowerCase();
}

function Utilities_CreateElement(name, obj) {
   const elmt = document.createElement(name);

   // classList
   if (!obj.class)
      obj.class = [];
   if (typeof obj.class == 'string')
      obj.class = [obj.class];

   obj.class.forEach(className => {
      elmt.classList.add(className);
   });

   //Css Style via Object or String injecting directly on the attribute
   if (!obj.css)
      obj.css = [];
   if (typeof obj.css == 'string')
   {
      elmt.style = obj.css;
   }
   else for (let prop in obj.css)
   {
      elmt.style[prop] = obj.css[prop];
   }

   if (typeof obj.styles == 'string')
   {
      elmt.setAttribute("style", obj.styles);
   }
   else
   {
      elmt.setAttribute("style", Utilities_ParseStyleFromObject(obj.styles))
   }

   for (let prop in obj.attr)
   {
      elmt.setAttribute(prop, obj.attr[prop]);
   }

   // Parent node
   if (obj.parent)
      obj.parent.appendChild(elmt);

   delete obj.class;
   delete obj.css;
   delete obj.attr;
   delete obj.parent;

   // other attr
   for (let attr in obj)
   {
      elmt[attr] = obj[attr];
   }

   return elmt;
}

function Utilities_DeepClone(item)
{
   if (item === null || typeof (item) !== 'object' || 'isActiveClone' in item)
      return item;
   
   let temp = null;
   if (item instanceof Date)
      temp = new item.constructor(); //or new Date(item);
   else
      temp = item.constructor();
   
   for (let key in item)
   {
      if (Object.prototype.hasOwnProperty.call(item, key))
      {
         item['isActiveClone'] = null;
         temp[key] = Utilities_DeepClone(item[key]);
         delete item['isActiveClone'];
      }
   }

   return temp;
}

function Utilities_ParseStyleFromObject(obj)
{
   if(typeof obj == 'string')
   {
      return obj;
   }
   let stylesCss = '';
   for(let prop in obj)
   {
      stylesCss += prop+":"+obj[prop]+';';
   }
   return stylesCss;
}

// takes into account optional [] that may be on the name
function Utilities_AddSuffixToElementName(name, suffix)
{
   let brackets = '';
   if (name.indexOf('[]') != -1)
   {
      brackets = '[]';
      name = name.substr(0, name.length-2);
   }
   return name + suffix + brackets;
}

function Utilities_StripBracketsFromElementName(name)
{
   if (name.indexOf('[]') != -1)
      return name.substr(0, name.length-2);
   
   return name;
}

// DRL FIXIT! This should be in ContentUtils.js!
function Utilities_CheckIfAttachmentsHaveVideos(attachments){
   for(let attachment of attachments){
      if(attachment.Type.includes('video/')){
         return true;
      }
   }
   return false;
}

// DRL FIXIT! This should be in Cookies.js!
function Utilities_GetDocumentCookie(search){
   let cookies = document.cookie.split('; ')
   for (let cookie of cookies){
      let cookieArray = cookie.split('=');
      if(cookieArray[0] === search){
         return cookieArray[1]
      }
   }
   return null;
}

// DRL FIXIT! This should be in Cookies.js!
function Utilities_SetDocumentCookie(name, value, days = (1/24/60)){
   let expires = "";
   if (days) {
      let date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
   }
   document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// DRL FIXIT! This should be in Cookies.js!
function Utilities_DeleteDocumentCookie(name){
   document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// DRL FIXIT! This should be in Url.js!
function Utilities_SearchUrlParams(url){
   return new URLSearchParams(url);
}


// =========================================================================
// DRL FIXIT! I need to find a better place for the following  code to live!
//
// This code handles the propagation of events from a web page to a Chrome
// extension content script in such a way that we can use the same code in
// a regular web based app as well.
// =========================================================================

function PrepareEventContext(target, code)
{
   const FN = new Function('event', code);
   FN({target: target});   // code will use "event.target"
}

if (Browser.IsExtensionContent())
{
   // inject a method into the web page to convert the context for us
   let code = "" +
      "function PrepareEventContext(target, code)\n" +
      "{\n" +
      "   window.postMessage({SA_id: Utilities_ElementId(target), SA_code: code}, '*');\n" +
      "};\n";
   
   // also inject some methods that will be needed by the code in the web page context
   let methods = ['Utilities_GetEvent', 'Utilities_GetEventTarget', 'Utilities_StopEventPropagation',
      'Utilities_PreventDefaultForEvent', 'Utilities_GetElementById', 'Utilities_HasAsParent', 'Utilities_ElementId'];
   for (let method of methods)
   {
      code += "\n\n" + window[method].toString();
   }
   
   var script = document.createElement('script');
   script.setAttribute("type", "application/javascript");
   script.textContent = code;
   document.body.appendChild(script);
   
   window.addEventListener('message', function(event)
   {
      if (event.data.hasOwnProperty('SA_id') && event.data.hasOwnProperty('SA_code'))
      {
         console.log('PopUpWindow.js got message:', event.data);
         PrepareEventContext(Utilities_GetElementById(event.data.SA_id), event.data.SA_code);
      }
   });
}