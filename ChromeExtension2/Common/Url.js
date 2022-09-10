// ========================================================================
//        Copyright � 2008 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

function Url_GetDomain(url)
{
	let iStart = strpos(url, "://");
	if (iStart === false)
	{
		iStart = 0;
	}
	else
	{
		iStart += 3;
	}
	
	let iEnd = strpos(url, "/", iStart);
	if (iEnd === false)
	{
		iEnd = strpos(url, "?", iStart);
		if (iEnd === false)
		{
			iEnd = strlen(url);
		}
	}
	
	return substr(url, iStart, iEnd - iStart);
}

// keeps protocol and path but swaps the domain
function Url_SwapDomain(url, newDomain)
{
	let iStart = strpos(url, '//');
	if (iStart === FALSE)
		return url;
	iStart += 2;
	let iEnd = strpos(url, '/', iStart);
	if (iEnd === FALSE)
		iEnd = strpos(url, '?', iStart);
	if (iEnd === FALSE)
		iEnd = strlen(url);
	return substr(url, 0, iStart) + newDomain + substr(url, iEnd);
}

function Url_GetProtocol(url)
{
	let iStart = strpos(url, "://");
	if (iStart === false)
	{
		iStart = strpos(url, ":");
		if (iStart === false)
		{
			return '';
		}
	}
	
	return substr(url, 0, iStart);
}

function Url_SetProtocol(url, protocol, addSlashes)
{
	return protocol + (addSlashes ? '://' : ':') + Url_StripProtocol(url);
}

function Url_StripProtocol(url)
{
	let iStart = strpos(url, "://");
	if (iStart === false)
	{
		iStart = strpos(url, ":");
		if (iStart === false)
		{
			return url;
		}
		else
		{
			return substr(url, iStart + 1);
		}
	}
	else
	{
		return substr(url, iStart + 3);
	}
}

function Url_GetEmailPrefix(email)
{
	email = Url_StripProtocol(email);
	let i = strpos(email, '@');
	if (i === FALSE)
		return NULL;
	return substr(email, 0, i);
}

function Url_GetEmailSuffix(email)
{
	email = Url_StripProtocol(email);
	let i = strpos(email, '@');
	if (i === FALSE)
		return NULL;
	return substr(email, i+1);
}

// strips domain and includes the filename
function Url_GetPath(url)
{
	url = Url_StripParams(url);
	
	let iStart = strpos(url, "://");
	if (iStart === false)
	{
		iStart = 0;
	}
	else
	{
		iStart += 3;
		iStart = strpos(url, "/", iStart);
		if (iStart === false)
			return '';
		iStart++;
	}
	return substr(url, iStart);
}

// returns domain and filename
function Url_GetFullPath(url)
{
	url = Url_StripParams(url);
	
	let iStart = strpos(url, "://");
	if (iStart === false)
	{
		iStart = 0;
	}
	else
	{
		iStart += 3;
	}
	return substr(url, iStart);
}

// keeps protocol and domain but swaps the rest
function Url_SwapPath(url, newPath)
{
	url = Url_StripPath(url);
	if (strlen(newPath) > 0 && newPath[0] != '/')
		url += '/';
	url += newPath;
	return url;
}

// returns protocol and domain with no terminating slash
function Url_StripPath(url)
{
	url = Url_StripParams(url);
	
	let i = strpos(url, "://");
	if (i === false)
		return NULL;
	
	i = strpos(url, "/", i+3);
	if (i === false)
	{
		i = strlen(url);
	}
	return substr(url, 0, i);
}

function Url_GetFilename(url)
{
	// remove fragments and parameters
	let iStart = strrpos(url, "?");
	if (iStart !== false)
		url = substr(url, 0, iStart);
	iStart = strrpos(url, "#");
	if (iStart !== false)
		url = substr(url, 0, iStart);
	
	// remove path and anything before
	iStart = strrpos(url, "/");
	if (iStart === false)
		return NULL;
	return substr(url, iStart+1);
}

// leaves a terminating slash
function Url_StripFilename(url)
{
	let iStart = strrpos(url, "/");
	if (iStart === false)
	{
		iStart = strlen(url)-1;
	}
	return substr(url, 0, iStart+1);
}

// strips the ? as well
function Url_StripParams(url)
{
	let iStart = strpos(url, "?");
	if (iStart === false)
		return url;
	
	return substr(url, 0, iStart);
}

// returns everything after the ?
function Url_GetParamsSection(url)
{
	let iStart = strpos(url, "?");
	if (iStart === false)
		return '';
	
	// I did see some URLs with the # section after the ? section...
	url = substr(url, iStart+1);
	let iEnd = strpos(url, "#");
	if (iEnd !== false)
		url = url.substr(0, iEnd);
	
	return url;
}

function Url_GetParam(url, name)
{
	let params = Url_GetParamsSection(url);
	
	let i = strpos(params, name + "=");
	if (i === false)
		return null;
	
	params = substr(params, i+strlen(name)+1);
	
	i = strpos(params, "&");
	if (i === false)
	{
		i = strlen(params);
	}
	
	return Url_DecodeURIComponent(substr(params, 0, i));
}

// this method must add a "?" even if the url is empty
function Url_AddParamsSection(url, section)
{
	if (empty(section))
		return url;
	
	if (strpos(url, '?') === false)
		url += '?';
	
	if (substr(url, -1) == '?')
	{
		if (substr(section, 0, 1) == '&')
			section = substr(section, 1);   // remove "&"
	}
	else
	{
		if (substr(section, 0, 1) != '&')
			section = '&' + section;             // add "&"
	}
	
	return url + section;
}

// value must NOT be encoded, if it is null then the parameter is removed completely
function Url_SetParam(url, name, value)
{
	let params = Url_GetParamsSection(url);
	url = Url_StripParams(url);
	
	let replacement = "";
	if (value !== null)
	{
		value = Url_EncodeURIComponent(value);
		replacement = name + '=' + value;
	}
	
	let i = strpos(params, name + '=');
	if (i === false)
	{
		if (!empty(replacement))
		{
			if (!empty(params))
				params += '&';
			params += replacement;
		}
	}
	else
	{
		let j = strpos(params, '&', i+1);
		if (j === false)
		{
			// must be at the end of the string
			j = strlen(params);
			if (empty(replacement) && i > 0)
				i--; // remove preceding & or ?
		}
		else if (empty(replacement))
			j++; // remove following &
		params = substr(params, 0, i) + replacement + substr(params, j);
	}
	
	if (!empty(params))
		params = '?' + params;
	
	return url + params;
}

function Url_SetParams(url, params)
{
	forEach(params, function(name)
	{
		url = Url_SetParam(url, name, params[name]);
	});
	return url;
}

function Url_RemoveParam(url, name)
{
	return Url_SetParam(url, name, null);
}

function Url_GetAllParams(url)
{
	params = Url_GetParamsSection(url);
	params = params.split('&');
	
	values = {};
	forEach(params, function(param)
	{
		if (strpos(param, '=') !== false)
		{
			let name = split('=', param)[0];
			let value = split('=', param)[1];
			values[name] = Url_DecodeURIComponent(value);
		}
		else
			values[param] = null;
	});
	
	return values;
}

function Url_StripFragments(url)
{
	let iStart = strpos(url, "#");
	if (iStart === false)
		return url;
	
	let iEnd = strpos(url, "?", iStart);
	if (iEnd === false)
		iEnd = strlen(url);
	
	return substr(url, 0, iStart) + substr(url, iEnd);
}

// returns everything after the # but before the #
function Url_GetFragmentsSection(url)
{
	let iStart = strpos(url, "#");
	if (iStart === false)
		return '';
	iStart++;
	
	let iEnd = strpos(url, "?", iStart);
	if (iEnd === false)
		iEnd = strlen(url);
	
	return substr(url, iStart, iEnd-iStart);
}

function Url_GetFragment(url, name)
{
	let frags = Url_GetFragmentsSection(url);
	
	let i = strpos(frags, name + '=');
	if (i === false)
		return null;
	
	frags = substr(frags, i+strlen(name)+1);
	
	i = strpos(frags, "&");
	if (i === false)
	{
		i = strlen(frags);
	}
	
	return Url_DecodeURIComponent(substr(frags, 0, i));
}

// value must NOT be encoded, if it is null then the fragment is removed completely
function Url_SetFragment(url, name, value)
{
	let params = Url_GetParamsSection(url);
	url = Url_StripParams(url);
	let frags = Url_GetFragmentsSection(url);
	url = Url_StripFragments(url);
	
	replacement = "";
	if (value !== null)
	{
		value = Url_EncodeURIComponent(value);
		replacement = name + '=' + value;
	}
	
	if (strpos(frags, name + '=') === false)
	{
		if (!empty(replacement))
		{
			frags += '&' + replacement;
		}
	}
	else
	{
		frags = preg_replace("/" + name + "=[^&=]*/", replacement, frags);
	}
	
	if (strpos(frags, '&') === 0)
		frags = substr(frags, 1);
	if (!empty(frags))
		frags = '#' + frags;
	
	if (!empty(params))
		params = '?' + params;
	
	return url + frags + params;
}

function Url_RemoveFragment(url, name)
{
	return Url_SetFragment(url, name, null);
}

// this is intended to work exactly like the JavaScript encodeURIComponent()
function Url_EncodeURIComponent(str, encodeQuote=false)
{
	str = encodeURIComponent(str);
	if (!encodeQuote)
		str = Utilities_ReplaceInString(str, '%27', "'");
	return str;
}

// this is intended to work exactly like the JavaScript decodeURIComponent()
function Url_DecodeURIComponent(str)
{
	return decodeURIComponent(str);
}


