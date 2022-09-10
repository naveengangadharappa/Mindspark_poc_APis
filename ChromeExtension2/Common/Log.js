// ========================================================================
//        Copyright (c) 2010 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// ===================================================================
//
//	NOTE: The global variable Form_RootUri can be defined such as "https://socialattache.com" for non-website usage.
//
// ===================================================================

let AccumulatedLogging = '';
let MetaLogging = {};
let GroupName = '';
let ClientPrefix = '';	// only used for the content script in the browser extension
let TimeoutStarted = null;
let FullLogging = false;	// do we send the log file whenever it reaches a certain size?
let LogTimeOffset = null;

function GetVariableAsString(obj)
{
	return JSON.stringify(obj, null, 4);
}

function Log_SetFullLogging(enable)
{
	FullLogging = enable;
}

// we can provide information that is included with each log file sent to the server, and each of these
// pieces of meta information has a name so it can be individually updated (ore removed if the value is null)
function Log_SetMetaLogging(name, value)
{
	if (value === null)
		delete MetaLogging[name];
	else
		MetaLogging[name] = value;
}

function Log_SetGroupName(name)
{
	GroupName = name;
}

function Log_SetPrefix(prefix)
{
	ClientPrefix = '[' + prefix + '] ';
}

function Log_Write(severity, msg)
{
	
	let output = new Date().toLocaleString()/*DateAndTime_Now().ToFormat('%/D %:T')*/ + ' ' + severity.toUpperCase() + ': ' + msg;
	if (window.console && window.console.log)
		window.console.log(output);
	else if (window.opera && window.opera.postError)
		window.opera.postError(output);

	if (Browser.IsExtensionContent())
	{
		// ignore this error happening when I reload the extension
		if (msg.indexOf('Extension context invalidated') != -1 ||
			// ignore this error generated by some websites we scrape
			msg.indexOf('ResizeObserver loop limit exceeded') != -1)
			return;

		try
		{
			// allow the background script to do the accumulating, also we have to let the
			// background script send it or it'll get blocked by the browser
			chrome.runtime.sendMessage({ type: 'logging', severity: severity, msg: ClientPrefix + msg}, function() {
				var lastError = chrome.runtime.lastError;
				if (lastError != null) {
					// we can't log it because this would cause another failure, so just put it on the console
					console.log('Error sending message "logging": ' + lastError.message);
				}
			});
		}
		catch (e)
		{
			console.log(e);
		}
		
		return;
	}
	
	if (LogTimeOffset == null)
	{
		// show times in America/Vancouver, note approximation for DST - DRL FIXIT! This is a hack!
		let month = (new Date()).getMonth();
		// use DST for March to October inclusive
		LogTimeOffset = (month >= 2 && month <= 9) ? 25200 : -28800;
	}

	// let's accumulate logging data until we get an error
	AccumulatedLogging += DateAndTime_Now(LogTimeOffset).ToFormat('%/D %:T') + ' ' + severity.toUpperCase() + ': ' + msg + "\n";
	if (FullLogging)
	{
		// send the log file whenever it gets to a significant size
		if (AccumulatedLogging.length < 20000)
			return;
	}
	else if (severity != 'error')
	{
		// let's not hold too much data, truncate every 4000 bytes over our limit
		if (AccumulatedLogging.length > 504000)
			AccumulatedLogging = AccumulatedLogging.substr(500000 - AccumulatedLogging.length);
		
		return;
	}
	
	// we will send the log after a slight delay in case there is additional logging
	// coming right after the initial error (such as information about the state, etc.)
	if (TimeoutStarted != null)
		return;
	if (Browser.IsExtensionBackground())
	{
		chrome.alarms.onAlarm.addListener(function(alarm)
			{ if (alarm.name == 'SendLogFile') _SendLogFile(); });
		chrome.alarms.create('SendLogFile', {periodInMinutes:1});
		TimeoutStarted = true;
	}
	else
		TimeoutStarted = setTimeout(function()
		{
			try
			{
				_SendLogFile();
			}
			catch (e)
			{
				Log_WriteException(e);
			}
		}, 500);
}

function Log_GetLogFile()
{
	let header = '';
	
	if (Browser.IsExtensionBackground())
		header = header + 'Chrome extension v' + chrome.runtime.getManifest().version + ' on ';
	
	header = header + Browser.GetOS() + ' ' + Browser.GetName() + ' ' + Browser.GetVersion() + ' ' + "\r\n\r\n";
	
	for (const name in MetaLogging)
	{
		header = header + name + ":\r\n" + MetaLogging[name] + "\r\n\r\n";
	}
	
	return header + AccumulatedLogging;
}

function _SendLogFile()
{
	if (AccumulatedLogging != '')
	{
		let logging = Log_GetLogFile();
		
		// DRL FIXIT? It would be more efficient to send this as the body of the request without encoding.
		let params = {'GroupName': GroupName, 'LogFile': logging};
		
		if (Form_RootUri != null)
			ajax.post(Form_RootUri + '/v2/Logs', params);
		else
			console.log("Not sending log file in dev serverless environment");
		
		AccumulatedLogging = '';
	}
	
	if (Browser.IsExtensionBackground())
		chrome.alarms.clear('SendLogFile');
	TimeoutStarted = null;
}

function Log_WriteInfo(msg)
{
	Log_Write('info', msg);
}

function Log_WriteWarning(msg)
{
	Log_Write('warning', msg);
}

function Log_WriteError(msg)
{
	Log_Write('error', msg);
}

function Log_WriteException(e, msg)
{
	// ignore this error happening when I reload the extension
	if (e.message.indexOf('Extension context invalidated') != -1)
		return;
	
	if (msg)
		msg += "\r\n";
	else
		msg = '';
	if (e.message)
		msg += e.message;
	if (e.stack)
		msg += "\r\n" + e.stack;
	Log_WriteError(msg);
}

function Log_Die(msg)
{
	Log_WriteError(msg);
	alert(msg);
}
