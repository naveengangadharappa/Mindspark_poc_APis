// ========================================================================
//        Copyright (c) 2010 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// ===================================================================
//
//	Module Interface.
//
// ===================================================================

var JULIAN_CALENDAR = 1;
var ORTHODOX_CALENDAR = 2;
var WESTERN_CALENDAR  = 3;

// DRL FIXIT? Don't know what these should be? They will really affect the RecurrenceRule* modules.
var DateAndTime_MINYEAR = 1900;
var DateAndTime_MAXYEAR = 2037; // can't handle dates greater than this????

var DateAndTime_DefaultFormat = "%/D %:T %Z";			// 2006/03/04 09:41:03 PST
var DateAndTime_TimeFormat = "%H:%M:%S";				// 09:41:03
var DateAndTime_LongDateFormat = "%A, %E %B %Y";		// Saturday, 4 March 2006
var DateAndTime_ShortDateFormat = "%Y/%m/%d";			// 2006/03/04
var DateAndTime_LongFormat = "%A, %E %B %Y %:T %Z";		// Saturday, 4 March 2006 09:41:03 PST
var DateAndTime_LongFormat2 = "%a, %E %b %Y %:T %Z";	// Sat, 4 Mar 2006 09:41:03 PST
var DateAndTime_LongFormat3 = "%a, %E %b %Y %:T %z";	// Sat, 4 Mar 2006 09:41:03 -0800
var DateAndTime_ShortFormat = "%/D %:T";				// 2006/03/04 09:41:03
var DateAndTime_ISO8601ExtendedFormat = "%-DT%T%1Z";
var ISO8601DateFormat = "%D";
var ISO8601TimeFormat = "%1Z";
var DateAndTime_ISO8601BasicFormat = "%DT%T%1Z";
var DateAndTime_ISO8601BasicFormatWithMilliseconds = "%DT%.T%1Z";	// non-standard millisecond specification!

var SecondsPerMinute = 60;
var SecondsPerHour = 3600;
var SecondsPerDay = 86400;
var SecondsPerWeek = 604800;

var SixtySevenYears = 67;
var DaysPerSixtySevenYears = 24405;
var DaysFromRataDieToEpoch = 719177;

// ===================================================================
//
//	Constants.
//
// ===================================================================

// Class of each DateAndTime SPAN in the document
var DateAndTime_SpanClass = "DateAndTimePre";
// Rename DateAndTime_SpanClass to DateAndTime_SpanClassLive after initialization so a different style can be applied
var DateAndTime_SpanClassLive = "DateAndTime";


var DefaultYear = 1970;		// year to use in storage if none specified, just so comparisons kinda work

var Months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
var LongMonths = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var DaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
var LongDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];

function GetMonths() { return StrArray('Months', Months); }
function GetLongMonths() { return StrArray('LongMonths', LongMonths); }
function GetDaysOfWeek() { return StrArray('DaysOfWeek', DaysOfWeek); }
function GetLongDaysOfWeek() { return StrArray('LongDaysOfWeek', LongDaysOfWeek); }

// from -12 to +12 hours from GMT...
var TimeZones =    [null, null, "HST", "YST", "PST", "MST", "CST", "EST", "AST", null, "FST", null, "GMT", "MET", "EET", "IST", null, null, null, null, null, "KST", null, null, null];
var TimeZonesDST = [null, null, null, null, null, "PDT", "MDT", "CDT", "EDT", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

// DRL FIXIT! These are not yet supported!
// %c	MM/DD/YY HH:MM:SS
// %C	ctime format: Sat Nov 19 21:05:57 1994
// %D	MM/DD/YY
// %G	GPS week number (weeks since January 6, 1980)
// %j	day of the year
// %n	NEWLINE
// %o	ornate day of month -- "1st", "2nd", "25th", etc.
// %q	Quarter number, starting with 1
// %r	time format: 09:05:57 PM
// %s	seconds since the Epoch, UCT
// %t	TAB
// %U	week number, Sunday as first day of week
// %w	day of the week, numerically, Sunday == 0
// %W	week number, Monday as first day of week

var DateAndTime_SingleCodes = new Object();
DateAndTime_SingleCodes['a'] = 'DateAndTime__FormatShortDayOfWeek';
DateAndTime_SingleCodes['A'] = 'DateAndTime__FormatLongDayOfWeek';
DateAndTime_SingleCodes['b'] = 'DateAndTime__FormatShortMonth';
DateAndTime_SingleCodes['B'] = 'DateAndTime__FormatLongMonth';
DateAndTime_SingleCodes['d'] = 'DateAndTime__FormatLongDay';
DateAndTime_SingleCodes['D'] = 'DateAndTime__FormatDate';
DateAndTime_SingleCodes['e'] = 'DateAndTime__FormatSpaceDay';
DateAndTime_SingleCodes['E'] = 'DateAndTime__FormatShortDay';		// non-standard (day without any leading character)
DateAndTime_SingleCodes['h'] = 'DateAndTime__FormatShortMonth';
DateAndTime_SingleCodes['H'] = 'DateAndTime__FormatLong24Hour';
DateAndTime_SingleCodes['I'] = 'DateAndTime__FormatLong12Hour';
DateAndTime_SingleCodes['k'] = 'DateAndTime__FormatShort24Hour';
DateAndTime_SingleCodes['l'] = 'DateAndTime__FormatShort12Hour';
DateAndTime_SingleCodes['L'] = 'DateAndTime__FormatShortNumericMonth';
DateAndTime_SingleCodes['m'] = 'DateAndTime__FormatLongNumericMonth';
DateAndTime_SingleCodes['M'] = 'DateAndTime__FormatMinute';
DateAndTime_SingleCodes['p'] = 'DateAndTime__FormatAMPM';
DateAndTime_SingleCodes['P'] = 'DateAndTime__Formatampm_lower';
DateAndTime_SingleCodes['R'] = 'DateAndTime__FormatTimeNoSecColon';
DateAndTime_SingleCodes['S'] = 'DateAndTime__FormatSecond';
DateAndTime_SingleCodes['T'] = 'DateAndTime__FormatTime';
DateAndTime_SingleCodes['x'] = 'DateAndTime__FormatDate';
DateAndTime_SingleCodes['X'] = 'DateAndTime__FormatTimeColon';
DateAndTime_SingleCodes['y'] = 'DateAndTime__FormatShortYear';
DateAndTime_SingleCodes['Y'] = 'DateAndTime__FormatLongYear';
DateAndTime_SingleCodes['Z'] = 'DateAndTime__FormatZone';
DateAndTime_SingleCodes['z'] = 'DateAndTime__FormatNumericZone';

// DRL FIXIT? These codes are non-standard.
var DateAndTime_DoubleCodes = new Object();
DateAndTime_DoubleCodes['/D'] = 'DateAndTime__FormatDateSlashes';
DateAndTime_DoubleCodes['-D'] = 'DateAndTime__FormatDateHyphens';
DateAndTime_DoubleCodes[':T'] = 'DateAndTime__FormatTimeColon';
DateAndTime_DoubleCodes['.T'] = 'DateAndTime__FormatTimeWithMillisecond';
DateAndTime_DoubleCodes['6S'] = 'DateAndTime__FormatMillisecond';
DateAndTime_DoubleCodes['1Z'] = 'DateAndTime__FormatCharZone';

// ===================================================================
//
//	Implementation.
//
// ===================================================================

function DateAndTime(year, month, day, hour, minute, second, millisecond, zone)
{
	this.hasYear = isset(year);
	if (!isset(year)) { year = DefaultYear; }
	this.hasDate = isset(month) && isset(day);
	if (!isset(month)) { month = 0; } else { month--; }
	if (!isset(day)) { day = 1; }
	this.hasTime = true;
	if (!isset(hour)) { hour = 0; this.hasTime = false; }
	if (!isset(minute)) { minute = 0; this.hasTime = false; }
	if (!isset(second)) { second = 0; }
	if (!isset(millisecond)) { millisecond = 0; }

	if (this.hasDate || this.hasTime)
	{
// The following resulted in different time zones being used for different days due to daylight savings time.
//		this.date = new Date(year, month, day, hour, minute, second, millisecond);
// What we're saving is the desired values given the time zone, and we stuff these in as 
// UTC values so we always work with the UTC methods but they're really in the desired zone
// start with a date that isn't DST, and a month with 31 days (otherwise the setUTCDate could fail)
		this.date = new Date(1990, 7, 1, 0, 0, 0, 0);
		// The following is necessary to explicitly set the UTCDate to 1 before we set the month
		this.date.setUTCDate(1);
		this.date.setUTCFullYear(year);
		this.date.setUTCMonth(month);
		this.date.setUTCDate(day);
		this.date.setUTCHours(hour);
		this.date.setUTCMinutes(minute);
		this.date.setUTCSeconds(second);
		this.date.setUTCMilliseconds(millisecond);
	}
	else
	{
		this.date = new Date();		// now/today dummy value (since we have no date/time)
	}

	this.hasZone = zone !== null && zone !== undefined;
	if (!isset(zone)) { zone = 0; }
	this.zone = zone;
	
   // DRL FIXIT! The isNaN below doesn't seem to be working, it always returns TRUE??
	if (Object.prototype.toString.call(this.date) != '[object Date]')
	{
		Log_Die("Invalid date 1: " + Object.prototype.toString.call(this.date));
	}
	if (this.hasTime && isNaN(this.date.getTime()))
	{
		Log_Die("Invalid date 2: " + this.date.getTime());
	}
}

DateAndTime.prototype.Copy = function()
{
	var result = new DateAndTime(null, null, null, null, null, null, null, null);

	result.date = new Date(this.date.getTime());
	result.hasYear = this.hasYear;
	result.hasDate = this.hasDate;
   result.hasTime = this.hasTime;
   result.hasZone = this.hasZone;
	result.zone = this.zone;
	
	return result;
}

DateAndTime.prototype.Extract = function()
{
	var date = this.Date();
	var time = this.Time();

	return [date[0], date[1], date[2], time[0], time[1], time[2], time[3], this.Zone()];
}

function DateAndTime__Process(format, hasValue, key, replacement)
{
	var keyLen = key.length;
	var len = format.length;
	var i = strpos(format, key);
	if (i !== FALSE)
	{
		var c;
		var type = substr(key, -1);
		
		if (hasValue)
		{
			format = substr(format, 0, i) + replacement + substr(format, i+keyLen);
		}
		else if (i == 0)
		{
			// it's at the beginning, must be followed by T (for time) or % for next replacement, or space or comma separator
			
			if (i+keyLen == len || strcmp(c = substr(format, i+keyLen, 1), 'T') == 0 ||
				strcmp(c, '%') == 0)
			{
				// remove only this item
			}
			else if (strcmp(c = substr(format, i+keyLen, 1), ' ') == 0 ||
				strcmp(c, ',') == 0)
			{
				// remove this item plus the separator, which may include a space after a comma
				keyLen++;
				if (c == ',' && strcmp(substr(format, i+keyLen, 1), ' ') == 0)
					keyLen++;
			}
			else
			{
				// DRL FIXIT? I'm not sure about this, we aren't removing the matched item in this case
				Log_WriteError("Check for correctness, not removing \""+key+"\" from \""+format+"\" for missing value");
				keyLen = 0;
			}
			format = substr(format, keyLen);
		}
		else
		{
			c = substr(format, i-1, 1);
			if ((strcmp(type, 'T') == 0 && strcmp(c, 'T') == 0) ||    // time preceeded by 'T'
            // anything surrounded by space
			   (strcmp(c, ' ') == 0 && (i+keyLen == len || strcmp(substr(format, i+keyLen, 1), ' ') == 0)) ||
            strcmp(c, ':') == 0)
			{
				// remove preceeding separator as well
				i--;
            keyLen++;
         }
			format = substr(format, 0, i) + substr(format, i+keyLen);
		}
	}
	
	return format;
}

DateAndTime.prototype.ToOrdinalDay = function()
{
	var result = this.ToOrdinal();
	result = Utilities_Div(result, SecondsPerDay);
	return result;
}

DateAndTime.prototype.ToOrdinal = function()
{
	var result = this.ToEpoch();
	result += (DaysFromRataDieToEpoch * SecondsPerDay);
	return result;
}

// returns seconds from the epoch date in GMT
DateAndTime.prototype.ToEpoch = function()
{
	if (!this.hasDate)
	{
		return null;
	}
	var epoch = this.date.getTime();		// returns UTC but we stuffed in desired so that's what we get back
	epoch = Utilities_Div(epoch, 1000); 	// convert to seconds
	if (this.hasZone)
      epoch -= this.zone;
	return epoch;
}


DateAndTime.prototype.ToNative = function()
{
	return this.date;
}


DateAndTime.prototype.toString = function()
{
	var result = "";
	if (this.hasDate)
	{
		if (result.length > 0)
			result += " ";
		result += sprintf("%04d/%02d/%02d", this.Year(), this.Month(), this.Day());
	}
	if (this.hasTime)
	{
		if (result.length > 0)
			result += " ";
		result += sprintf("%02d:%02d:%02d", this.Hour(), this.Minute(), this.Second());
	}
	if (this.hasZone)
	{
		if (result.length > 0)
			result += " ";
		result += DateAndTime_TimeZoneToChar(this.Zone());
	}
//	if (result.length == 0)
//		result = "<null>";
	return result;
}

DateAndTime.prototype.ToFormat = function(format)
{
	if (empty(format)) { format = DateAndTime_DefaultFormat; }

	// we want the special characteristic that when there is no value for an item
	// we assign it an empty string and also gobble one space separator if found

	// zone is done first so it can be removed and the next item (time) can be properly removed too if necessary
	format = DateAndTime__Process(format, this.HasZone(), '%Z', '%Z');
	format = DateAndTime__Process(format, this.HasZone(), '%1Z', '%1Z');

	format = DateAndTime__Process(format, this.HasTime(), '%T', '%H%M%S');
	format = DateAndTime__Process(format, this.HasTime(), '%:T', '%H:%M:%S');
	format = DateAndTime__Process(format, this.HasTime(), '%.T', '%H%M%6S');

	// this messes up some formats like YYYY-MM-DD so we only want to do it for formats like "2 October 1967"
	format = DateAndTime__Process(format, this.HasYear(), '%Y', '%Y');

	format = DateAndTime__Process(format, this.HasDate(), '%A', '%A');
	format = DateAndTime__Process(format, this.HasDate(), '%a', '%a');
	format = DateAndTime__Process(format, this.HasDate(), '%D', '%Y%m%d');
	format = DateAndTime__Process(format, this.HasDate(), '%-D', '%Y-%m-%d');
	format = DateAndTime__Process(format, this.HasDate(), '%/D', '%Y/%m/%d');

   // remove any of the replacements not covered above if their values are not available
   var remove = [];
   if (!this.HasZone())
   {
      remove.push('z');
   }
   if (!this.HasTime())
   {
      remove.push('H');
      remove.push('I');
      remove.push('k');
      remove.push('l');
      remove.push('M');
      remove.push('p');
      remove.push('P');
      remove.push('R');
      remove.push('S');
      remove.push('X');
   }
   if (!this.HasYear())
   {
      remove.push('Y');
   }
   if (!this.HasDate())
   {
      remove.push('a');
      remove.push('A');
      remove.push('b');
      remove.push('B');
      remove.push('d');
      remove.push('e');
      remove.push('E');
      remove.push('h');
      remove.push('L');
      remove.push('m');
      remove.push('x');
   }
   for (var index = 0; index < remove.length; index++)
   {
   	format = DateAndTime__Process(format, false, '%' + remove[index], '');
   }
	
	var len = format.length;
	var result = "";
	var last = 0;
	var i = strpos(format, '%');
	while (i !== FALSE)
	{
		result += substr(format, last, i - last);
		last = i + 1;		// skip '%'
		
		var remain = len - i;
		var method = null;
		if (remain >= 2)
		{
			var temp = substr(format, i+1, 2);
			if (temp in DateAndTime_DoubleCodes)
			{
				method = DateAndTime_DoubleCodes[temp];
				result += window[method](this);
				last += 2;		// skip double code
			}
		}
		if (method == null && remain >= 1)
		{
			var temp = substr(format, i+1, 1);
			if (temp in DateAndTime_SingleCodes)
			{
				method = DateAndTime_SingleCodes[temp];
				result += window[method](this);
				last += 1;	// skip single code
			}
		}
		
		i = strpos(format, '%', last);
	}
	result += substr(format, last);
	
	return result;
}

function DateAndTime_FromOrdinalDay(ordinal, zone)
{
	var epoch = ordinal - DaysFromRataDieToEpoch;
	epoch *= SecondsPerDay;
	var ret = DateAndTime_FromEpoch(epoch, zone);
	ret.createdBy = "FromOrdinalDay(" + ordinal + ", " + zone + ")";		// used for debugging only
	return ret;
}

function DateAndTime_FromOrdinal(ordinal, zone)
{
	var epoch = ordinal - (DaysFromRataDieToEpoch * SecondsPerDay);
	var ret = DateAndTime_FromEpoch(epoch, zone);
	ret.createdBy = "FromOrdinal(" + ordinal + ", " + zone + ")";		// used for debugging only
	return ret;
}

function DateAndTime_FromEpoch(epoch, zone)
{
   if (epoch === null) return null;
	
	// Date() takes UTC so we pass in our value in the desired zone and...
	var date = new Date((zone !== null && zone !== undefined ? epoch + zone : epoch) * 1000);
	
	// by using the UTC values we get back our values in the desired zone
	ret = new DateAndTime(date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate(),
		date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds(), zone);
	ret.createdBy = "FromEpoch(" + epoch + ", " + zone + ")";		// used for debugging only

	return ret;
}
function DateAndTime_FromEpochMilli(epoch, zone)
{
	if (epoch === null) return null;
	
	// Date() takes UTC so we pass in our value in the desired zone and...
	var date = new Date(zone !== null && zone !== undefined ? epoch + (zone * 1000) : epoch);
	
	// by using the UTC values we get back our values in the desired zone
	ret = new DateAndTime(date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate(),
		date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds(), zone);
	ret.createdBy = "FromEpoch(" + epoch + ", " + zone + ")";		// used for debugging only
	
	return ret;
}

DateAndTime.prototype.Date = function()
{
	var year;
	var month;
	var day;
	if (this.hasDate)
	{
		year = this.date.getUTCFullYear();
		month = this.date.getUTCMonth();
		day = this.date.getUTCDate();
		month += 1;
		if (!this.hasYear)
		{
			year = null;
		}
	}
	
	return [year, month, day];
}

DateAndTime.prototype.SetDate = function(year, month, day)
{
	this.hasYear = 0;
   
	if (month != null && day != null)
	{
		this.hasDate = true;
      
		if (year != null)
		{
			this.hasYear = 1;
		}
		else
		{
			year = DefaultYear;
		}
		this.date.setUTCFullYear(year);
		this.date.setUTCMonth(month-1);
		this.date.setUTCDate(day);
	}
	else
	{
		this.hasDate = false;
	}
	
	if (Object.prototype.toString.call(this.date) != '[object Date]' || isNaN(this.date.getTime()))
	{
		Log_Die("Invalid date");
	}
}

DateAndTime.prototype.Year = function()
{
	var values = this.Date();
	return values[0];
}

DateAndTime.prototype.Month = function()
{
	var values = this.Date();
	return values[1];
}

DateAndTime.prototype.Day = function()
{
	var values = this.Date();
	return values[2];
}

DateAndTime.prototype.Time = function()
{
	var millisecond;
	var second;
	var minute;
	var hour;
	
	if (this.hasTime)
	{
		second = this.date.getUTCSeconds();
		minute = this.date.getUTCMinutes();
		hour = this.date.getUTCHours();
		millisecond = this.date.getUTCMilliseconds();
	}
	
	return [hour, minute, second, millisecond];
}

DateAndTime.prototype.SetTime = function(hour, minute, second, millisecond)
{
	if (hour != null)
	{
		this.hasTime = true;
		if (millisecond == null) millisecond = 0;
	}
	else
	{
		this.hasTime = false;
      hour = 0;
      minute = 0;
      second = 0;
      millisecond = 0;
	}

	this.date.setUTCHours(hour);
	this.date.setUTCMinutes(minute);
	this.date.setUTCSeconds(second);
	this.date.setUTCMilliseconds(millisecond);
	
	if (Object.prototype.toString.call(this.date) != '[object Date]' || isNaN(this.date.getTime()))
	{
		Log_Die("Invalid date");
	}
}

DateAndTime.prototype.Hour = function()
{
	var values = this.Time();
	return values[0];
}

DateAndTime.prototype.Minute = function()
{
	var values = this.Time();
	return values[1];
}

DateAndTime.prototype.Second = function()
{
	var values = this.Time();
	return values[2];
}

DateAndTime.prototype.Millisecond = function()
{
	var values = this.Time();
	return values[3];
}

DateAndTime.prototype.Zone = function()
{
	return this.zone;
}

DateAndTime.prototype.SetZone = function(zone)
{
	if (zone != null && !Utilities_IsInteger(zone))
	{
		Log_Die("Attempting to set time zone of '" + zone + "' when numeric is expected!");
	}
	
	this.hasZone = zone != null;
	if (zone == null) zone = 0;
	this.zone = zone;
}

DateAndTime.prototype.ConvertToZone = function(zone, defaultZone)
{
	if (zone === null || !Utilities_IsInteger(zone) ||
		zone < -Utilities_Div(SecondsPerDay, 2) || zone > Utilities_Div(SecondsPerDay, 2))
	{
		Log_WriteError("Zone is not integer or is out of range for $zone");
	}
	
	result = this.Copy();
	
	if (this.HasZone())
		defaultZone = this.Zone();
	
	if (defaultZone !== null && defaultZone !== undefined && this.HasTime())
	{
		if (defaultZone)
		{
			result = result.Subtract(defaultZone);
		}
		
		if (zone)
		{
			result = result.Add(zone);
		}
		
	}
	
	result.SetZone(zone);
	
	return result;
}

DateAndTime.prototype.HasYear = function()
{
	return this.hasYear;
}

DateAndTime.prototype.HasDate = function()
{
	return this.hasDate;
}

DateAndTime.prototype.HasTime = function()
{
	return this.hasTime;
}

DateAndTime.prototype.HasZone = function()
{
	return this.hasZone;
}

DateAndTime.prototype.IsDaylightSavings = function()
{
	// First select two dates - the first of January and the first of July. In those 
	// places where daylight saving time is used we are going to assume that daylight 
	// saving time is not in force on one of these two dates. Next, find the standard 
	// time timezone offset regardless of whether the current time is on standard or 
	// daylight saving time. JavaScript returns the offset in minutes and reverses the 
	// sign (so for example time zone +10 will return an offset of -600).

	var jan = new Date(this.date.getFullYear(), 0, 1);
	var jul = new Date(this.date.getFullYear(), 6, 1);
	var stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

	// Now that we have the standard time timezone offset, compare the current timezone 
	// offset with the standard one. If they are equal then the current time is standard 
	// time. If they are not then the current time is daylight saving time.

	return this.date.getTimezoneOffset() < stdTimezoneOffset;
}

DateAndTime.prototype.DayOfWeek = function()
{
	var wday;
	if (this.hasDate && this.hasYear)
	{
		wday = this.date.getUTCDay();	// Sunday is 0
	}

	return wday;
}

DateAndTime.prototype.DayOfYear = function()
{
	if (!this.hasDate || !this.hasYear)
	{
		return null;
	}
	
	var date = this.Copy();
	date.SetDate(this.Year(), 1, 1);
	
	return Utilities_Div(this.Subtract(date), SecondsPerDay) + 1;
}

DateAndTime.prototype.DaysThisMonth = function()
{
	if (!this.hasDate || !this.hasYear)
	{
		return null;
	}
	
	var year = this.Year();
	var month = this.Month()+1;
	if (month == 13)
	{
		year++;
		month = 1;
	}

	// use a fixed day (5) in case time zone calculations cause it to wrap a month
	var date1 = new DateAndTime(year, month, 5);
	var date2 = this.Date();
	return Utilities_Div(date1.Subtract(new DateAndTime(date2[0], date2[1], 5)), SecondsPerDay);
}

DateAndTime.prototype.Equal = function(obj2)
{
	if (this.HasYear() != obj2.HasYear() ||
		this.HasDate() != obj2.HasDate() ||
		this.HasTime() != obj2.HasTime() ||
		this.HasZone() != obj2.HasZone())
	{
		return 0;
	}
	return this.Subtract(obj2) == 0;
}

DateAndTime.prototype.NotEqual = function(obj2)
{
	if (this.HasYear() != obj2.HasYear() ||
		this.HasDate() != obj2.HasDate() ||
		this.HasTime() != obj2.HasTime() ||
		this.HasZone() != obj2.HasZone())
	{
		return 1;
	}
	return this.Subtract(obj2) != 0;
}

DateAndTime.prototype.GreaterThan = function(obj2)
{
	return this.Subtract(obj2) > 0;
}

DateAndTime.prototype.GreaterThanOrEqual = function(obj2)
{
	return this.Subtract(obj2) >= 0;
}

DateAndTime.prototype.LessThan = function(obj2)
{
	return this.Subtract(obj2) < 0;
}

DateAndTime.prototype.LessThanOrEqual = function(obj2)
{
	return this.Subtract(obj2) <= 0;
}

DateAndTime.prototype.Compare = function(obj2)
{
	// DRL FIXIT! This ignores a bunch of stuff!!
	if (this.hasYear != obj2.hasYear ||
		this.hasDate != obj2.hasDate ||
		this.hasTime != obj2.hasTime ||
		this.zone != obj2.zone)
		return false;
	return this.date.getTime() - obj2.date.getTime();
}

// ignores milliseconds when subtracting two dates because it returns seconds!
DateAndTime.prototype.Subtract = function(secondsOrDate)
{
	// DRL FIXIT! What about HasYear?
	
	if (secondsOrDate instanceof DateAndTime)
	{
		var result = 0;
		if (this.hasDate == secondsOrDate.hasDate &&
			this.hasTime == secondsOrDate.hasTime)
		{
			result += Utilities_Div(this.date.getTime() - secondsOrDate.date.getTime(), 1000);

         if (this.hasTime && this.hasZone)
         {
            if (!secondsOrDate.hasZone)
            {
               Log_Die("Attempting to subtract DateAndTime having time zone with one not having a time zone!");
            }
            result -= this.zone - secondsOrDate.zone;
         }
         else if (secondsOrDate.hasTime && secondsOrDate.hasZone)
         {
            Log_Die("Attempting to subtract DateAndTime having no time zone with one having a time zone!");
         }
		}
		else
		{
			Log_Die("Attempting to subtract DateAndTime having date or time with one not having date or time!");
		}
		
		return result;
	}
	else
	{
		var result = this.Copy();

		result.date.setTime(this.date.getTime() - (secondsOrDate * 1000));
		
		return result;
	}
}

DateAndTime.prototype.Add = function(seconds)
{
	var result = this.Copy();

	result.date.setTime(this.date.getTime() + (seconds * 1000));
	
	return result;
}

function DateAndTime_Now(zone)
{
	var t = new DateAndTime(null, null, null, null, null, null, null, zone);

	// the above initialized some things, we just need to change a few...
	
	var temp = new Date();
	// convert from local time to desired zone
	if (zone != undefined)
		temp = new Date(temp.getTime()/*milli*/ + (((temp.getTimezoneOffset()/*min*/ * 60) - zone/*sec*/) * 1000));
   // What we're saving is the desired values given the time zone, and we stuff these in as
   // UTC values so we always work with the UTC methods but they're really in the desired zone
	// convert from desired zone to UTC
	t.date.setUTCFullYear(temp.getFullYear());
	t.date.setUTCMonth(temp.getMonth());
	t.date.setUTCDate(temp.getDate());
	t.date.setUTCHours(temp.getHours());
	t.date.setUTCMinutes(temp.getMinutes());
	t.date.setUTCSeconds(temp.getSeconds());
	t.date.setUTCMilliseconds(temp.getMilliseconds());
	
	t.hasYear = true;
	t.hasDate = true;
	t.hasTime = true;
	
	return t;
}

DateAndTime.prototype.LocalTimeZoneOffset = function()
{
	return this.date.getTimezoneOffset() * -SecondsPerMinute;
}

function DateAndTime_LocalTimeZoneOffset(referenceDate)
{
	if (referenceDate)
		referenceDate = referenceDate.date;
	else
		referenceDate = new Date();
	return referenceDate.getTimezoneOffset() * -SecondsPerMinute;
}

// DRL FIXIT! See how this has been improved/fixed in PHP by providing a reference date!
function DateAndTime_TimeZoneOffset(zone)
{
	if (zone == null || zone.length == 0)
	{
		return null;
	}
	
	zone = zone.toString();		// convert from number
	var sign = substr(zone, 0, 1);

	zone = Utilities_ReplaceInString(zone, ":", "");
	
	if (sign == "-" || sign == "+" || sign == "0")
	{
		// format is "000", "-800", "-1000" or "+800"
		
		return (substr(zone, 0, zone.length - 2) * 3600) +
			(substr(zone, zone.length - 2, 2) * 60);
	}
	else
	{
		// format is probably a string

		if (zone.length == 1 && zone >= "A" && zone <= "Z")
		{
			// this is likely a time zone character as in 'Z' for UTC or GMT
			// NOTE: "J" isn't used!

			if (zone <= "I")
			{
				return - (zone.charCodeAt(0) - ("A").charCodeAt(0) + 1) * SecondsPerHour;
			}
			else if (zone <= "M")
			{
				return - (zone.charCodeAt(0) - ("A").charCodeAt(0)) * SecondsPerHour;
			}
			else if (zone <= "Y")
			{
				return (zone.charCodeAt(0) - ("N").charCodeAt(0) + 1) * SecondsPerHour;
			}
			else
			{
				return 0;
			}
		}
		
		var i;
		for (i = 0; i < 24; i++)
		{
			if (TimeZones[i] != null && zone == TimeZones[i])
			{
				return (i - 12) * 3600;
			}
			if (TimeZonesDST[i] != null && zone == TimeZonesDST[i])
			{
				return (i - 12) * 3600;
			}
		}
		
		// DRL FIXIT! This is a bad way of figuring out time zone!
		if (zone == "Pacific Standard Time")
		{
			return -8 * 3600;
		}
		else if (zone == "Pacific Daylight Time")
		{
			return -7 * 3600;
		}
		else if (zone == "India Standard Time")
		{
			return 5.5 * 3600;
		}
		else
		{
			Log_WriteError("Unrecognized time zone: " + zone);
		}
		
		return null;
	}
}

// this is used for ISO 8601 basic and extended formats
function DateAndTime_TimeZoneToChar(zone)
{
	if (zone == null)
	{
		return "";
	}

	var hours = Utilities_Div(zone, 3600);
	var minutes = Utilities_Div(zone - (hours * 3600), 60);

	if (minutes == 0)
	{
		// NOTE: "J" is not used
		if (hours <= -10)
		{
			return String.fromCharCode(("A").charCodeAt(0) - hours);
		}
		else if (hours < 0)
		{
			return String.fromCharCode(("A").charCodeAt(0) - hours - 1);
		}
		else if (hours > 0)
		{
			return String.fromCharCode(("N").charCodeAt(0) + hours - 1);
		}
		else
		{
			return "Z";
		}
	}
	else
	{
		hours = sprintf("%02d", hours);
		
		if (minutes < 0)
		{
			minutes = -minutes;
		}
		else
		{
			// it is important to have a prefix because this value may come right after a time with no space in between
			hours = "+" + hours;
		}

		// DRL FIXIT? Is it OK to use the extended format even for basic?
		return hours + ":" + sprintf("%02d", minutes);
	}
}

function DateAndTime_TimeZoneToNumeric(zone)
{
	if (empty(zone))
	{
		return "";
	}
	
	var hours = Utilities_Div(zone, 3600);
	var minutes = Utilities_Div(zone - (hours * 3600), 60);

	if (minutes < 0)
	{
		minutes = -minutes;
	}
	
	if (hours < 0)
	{
		return sprintf("%03d", hours) + sprintf("%02d", minutes);
	}
	else
	{
		return sprintf("+%02d", hours) + sprintf("%02d", minutes);
	}
}

function DateAndTime_TimeZoneToString(zone, daylightSavings)
{
	if (empty(zone))
	{
		return "";
	}
	
	var hours = Utilities_Div(zone, 3600);
	var minutes = Utilities_Div(zone - (hours * 3600), 60);

	if (empty(daylightSavings))
	{
		daylightSavings = DateAndTime_Now().IsDaylightSavings();
	}
	
	var result;
	if (daylightSavings)
	{
		result = TimeZonesDST[hours + 12];
	}
	else
	{
		result = TimeZones[hours + 12];
	}
	if (minutes != 0 || empty(result))
	{
		if (minutes < 0)
		{
			minutes = -minutes;
		}
		if (hours >= 0)
		{
			hours = '+' + hours;
		}
		
		result = hours + ":" + sprintf("%02d", minutes);
	}
	
	return result;
}

function DateAndTime_ParseMonth(month)
{
	var month = substr(month, 0, 3);
	var i;
	
	for (i = 1; i <= 12; i++)
	{
		if (Months[i] == month)
		{
			return i;
		}
	}
	
	return null;
}

function DateAndTime_GetMonthString(month, long)
{
	if (empty(long)) { long = 0; }
	
	if (long)
	{
		return GetLongMonths()[month];
	}
	else
	{
		return GetMonths()[month];
	}
}

function DateAndTime_ParseDayOfWeek(weekday)
{
	var weekday = substr(weekday, 0, 3);
	var i;
	
	for (i = 0; i < 7; i++)
	{
		if (strcmp(DaysOfWeek[i], weekday) == 0)
		{
			return i;
		}
	}
	
	Log_WriteDie("Unrecognized day of week: " + weekday);
}
	
function DateAndTime_GetDayOfWeekString(day, long)
{
	if (empty(long)) { long = 0; }
	
	if (long)
	{
		return GetLongDaysOfWeek()[day];
	}
	else
	{
		return GetDaysOfWeek()[day];
	}
}
	
function DateAndTime_IsLeapYear(year)
{
	if (year % 4) { return 0; }
	if (year % 100) { return 1; }
	if (year % 400) { return 0; }
	return 1;
}

function DateAndTime_DaysInMonth(year, month)
{
	var date = new DateAndTime(year, month, 1);
	
	return date.DaysThisMonth();
}

function DateAndTime_GetEaster(year, calendar)
{
//	This method was ported from the work done by GM Arts,
//	on top of the algorithm by Claus Tondering, which was
//	based in part on the algorithm of Ouding (1940), as
//	quoted in "Explanatory Supplement to the Astronomical
//	Almanac", P.  Kenneth Seidelmann, editor.
//	
//	This algorithm implements three different easter
//	calculation methods:
//	
//	1 - Original calculation in Julian calendar, valid in
//		dates after 326 AD
//	2 - Original method, with date converted to Gregorian
//		calendar, valid in years 1583 to 4099
//	3 - Revised method, in Gregorian calendar, valid in
//		years 1583 to 4099 as well
//
//	More about the algorithm may be found at:
//	
//	http://users.chariot.net.au/~gmarts/eastalg.htm
//	
//	and
//	
//	http://www.tondering.dk/claus/calendar.html

	if (calendar == null)
	{
		calendar = WESTERN_CALENDAR;
	}
	
	if (calendar != JULIAN_CALENDAR && calendar != ORTHODOX_CALENDAR && calendar != WESTERN_CALENDAR)
	{
		Log_Die("invalid calendar");
	}
	
	// g - Golden year - 1
	// c - Century
	// h - (23 - Epact) mod 30
	// i - Number of days from March 21 to Paschal Full Moon
	// j - Weekday for PFM (0=Sunday, etc)
	// p - Number of days from March 21 to Sunday on or before PFM
	//     (-6 to 28 methods 1 & 3, to 56 for method 2)
	// e - Extra days to add for method 2 (converting Julian
	//     date to Gregorian date)
	
	var y = year;
	var g = y % 19;
	var e = 0;
	var i;
	var j;
	if (calendar == JULIAN_CALENDAR || calendar == ORTHODOX_CALENDAR)
	{
		// Old method
		i = (19*g+15)%30;
		j = (y+y/4+i)%7;
		if (calendar == ORTHODOX_CALENDAR)
		{
			// Extra dates to convert Julian to Gregorian date
			e = 10;
			if (y > 1600)
			{
				e = e+y/100-16-(y/100-16)/4;
			}
		}
	}
	else
	{
		// New method
		var c = y/100;
		var h = (c-c/4-(8*c+13)/25+19*g+15)%30;
		i = h-(h/28)*(1-(h/28)*(29/(h+1))*((21-g)/11));
		j = (y+y/4+i+2-c+c/4)%7;
	}
	
	// p can be from -6 to 56 corresponding to dates 22 March to 23 May
	// (later dates apply to method 2, although 23 May never actually occurs)
	var p = i-j+e;
	var d = 1+(p+27+(p+6)/40)%31;
	var m = 3+(p+26)/30;
	
	return new DateAndTime(y, m, d);
}

function DateAndTime_FromString(string, defaultZone)
{
	// DRL FIXIT! The ISO specification indicates that the minutes and seconds are optional,
	// and the last one provided may also contain a fractional portion and that the zone may
	// be specified as an offset instead of a character as well with optional bits. We
	// currently don't support any of this!
	
	// DRL FIXIT! For serialization/deserialization correctness we should be able to
	// deserialize a date and time zone (i.e. only time was null) but we don't!

	if (string == null) { return null; }
	if (string.isEmpty()) { return new DateAndTime(); }

	var originalString = string;
	
//	Log_WriteError("Converting date from: string");

	// strip the day of week
	var comma = strpos(string, ", ");
	if (comma !== FALSE)
	{
		//  could be "Saturday, 4 March 2006 09:41:03 PST" or "October 6, 1990"
		var temp = substr(string, comma+2);
		if (temp.length == 4)												// check for 4 digit year
		{
			string = substr(string, 0, comma) + " " + temp;	// just remove comma
		}
		else
		{
			string = temp;													// remove everything before and including the comma
		}
	}
	
	string = string.trim();   // the day sometimes has a space before it if it is one digit
	
	// DRL I sometimes got strings with two time zones at the end such as "-0700 (PDT)" so I check
	// for (PDT) first and also check for the other format below and remove them both, prefering the first one.
	i = strpos(string, '(');
	if (i !== false && substr(string, -1, 1) == ')')
	{
		// we found the time zone
		zone = DateAndTime_TimeZoneOffset(substr(string, i+1, -1));
		if (zone !== null)
			defaultZone = zone;
		
		// strip it
		lastSpace = i-1;
		while (lastSpace > 0 && string[lastSpace] == ' ')
			lastSpace--;
		string = substr(string, 0, lastSpace+1);
	}
	
	// look for a time zone and split it out
	var lastSpace = strrpos(string, " ");
	if (lastSpace === FALSE)
   {
		var len = string.length;
	
		// look for "2013-04-18T12:00:00-07:00" format (but avoid catching "2013-04-18")
		if (len >= 6 && string[len-3] != '-' && (string[len-6] == '+' || string[len-6] == '-'))
			lastSpace = len-7;
		// look for "2013-04-18T12:00:00-0700" format
		else if (len >= 5 && (string[len-5] == '+' || string[len-5] == '-'))
			lastSpace = len-6;
		// look for "2013-04-18T12:00:00G" format
		else if (len >= 3 && Utilities_IsInteger(substr(string, len-3, 2)) && Utilities_IsAlphabetic(string[len-1]))
			lastSpace = len-2;
		else
			lastSpace = -1;
   }
	var zone = substr(string, lastSpace + 1);

	// remove the time zone from the string (check for the form: Z, GMT, +000, +0:00, +0000, +00:00)
	var convertZone = false;
	var sign = substr(zone, 0, 1);
	if ((Utilities_IsAlphabetic(zone) && (zone.length == 1 || zone.length == 3)) ||
		((sign == "+" || sign == "-") && zone.length >= 4 && zone.length <= 6))
	{
		// we found the time zone, but convert it later when twe have a date to check DST
		convertZone = TRUE;
		
		// strip it
		while (lastSpace > 0 && string[lastSpace] == ' ')
			lastSpace--;
		string = substr(string, 0, lastSpace+1);
	}
	// remove the time zone from the string (check for the form: 000Z)
	else if (Utilities_IsInteger(substr(string, string.length-2, 1)) && Utilities_IsAlphabetic(substr(string, string.length-1, 1)))
	{
		// we found the time zone
		zone = DateAndTime_TimeZoneOffset(substr(string, string.length-1));
		
		// strip it
		string = substr(string, 0, string.length-1);
	}
	else
	{
		// no time zone, use default if provided
		
		zone = defaultZone;
	}

	// look for a am/pm and split it out
   isPM = false;
   if (string.length >= 2)
   {
      var temp = strtolower(substr(string, -2));
   	if (temp == "am" || temp == "pm")
   	{
         isPM = temp == "pm";
         
         len = 2;
         if (string.length >= 3 && substr(string, -3, 1) == " ")
            len++;
		   string = substr(string, 0, string.length-len);
   	}
   }

	// split time and date portions
	lastSpace = strrpos(string, " ");
	if (lastSpace === FALSE)
	{
		// is this a full time and date with no spaces (19980101T050000)?
		lastSpace = strrpos(string, "T");
		if (lastSpace !== FALSE)
		{
			var date = substr(string, 0, lastSpace);
			var time = substr(string, lastSpace+1);

			if (strlen(time) > 0 && !Utilities_StringContains(time, ":"))
			{
				if (!Utilities_IsNumeric(time))
				{
					WriteInfo("Not a date??: " + originalString);
					return null;
				}
				
				// add the colons to the time
				for (var i = 2; i < 8 && i < time.length; i += 3)
				{
					time = substr(time, 0, i) + ":" + substr(time, i);
				}
			}

			if (strlen(date) > 0 && !Utilities_StringContains(date, "/") && !Utilities_StringContains(date, "-"))
			{
				if (!Utilities_IsNumeric(date))
				{
					WriteInfo("Not a date??: " + originalString);
					return null;
				}
				
				// add the separators to the date
				var i = strlen(date) >= 8 ? 4 : 2;
				for (; i < strlen(date); i += 3)
				{
					date = substr(date, 0, i) + "-" + substr(date, i);
				}
			}
			
			string = date + " " + time;
	
			lastSpace = strlen(date);
		}
		else if (zone == null &&
			!Utilities_StringContains(string, ":") &&
			!Utilities_StringContains(string, "-") &&
			!Utilities_StringContains(string, "/"))
		{
			if (strlen(string) > 8)
			{
				WriteInfo("Not a date??: " + originalString);
				return null;
			}
			
			// if we have something with no separators lets assume it is a date and add separators as necessary
			var i = string.length >= 8 ? 4 : 2;
			for (; i < string.length; i += 3)
			{
				string = substr(string, 0, i) + "-" + substr(string, i);
			}
		}
	}

	// is the last chunk a time or a date?
	if (lastSpace == FALSE)
	{
		if (Utilities_StringContains(string, ":"))
		{
			lastSpace = 0;
		}
		else
		{
			lastSpace = string.length;
		}
	}
	else
	{
		// the thing after the last space could be the AM/PM indicator OR a day or year if there is no time portion
		if (Utilities_StringContains(substr(string, lastSpace+1), ":"))
		{
			lastSpace++;
		}
		else
		{
			lastSpace = string.length;
		}
	}
	
	var year, month, day, hour, minute, second, millisecond;

	// process a time if specified
	if (lastSpace < string.length)
	{
		time = substr(string, lastSpace);
			
		var t = time.split(":");
		hour = t[0]; minute = t[1]; second = t[2];
      
		// apply the result of finding PM above
		if (isPM && hour < 12)
		{
			hour = parseInt(hour, 10) + 12;
		}
		// seconds may not have been provided
		if (second == null)
		{
			second = 0;
		}

		if (strpos(second, ".") !== FALSE)
		{
			var t = second.split(/\./);
			second = t[0]; millisecond = t[1];
				
			// DRL Added this for WindowsLive date/time of "2011-06-09T01:18:16.9570000Z"
			if (millisecond.length > 3)
			{
				millisecond = substr(millisecond, 0, 3);
			}
		}
	}
	else
	{
		lastSpace = string.length;
	}
	
	// process a date if specified
	if (lastSpace > 1)
	{
		// remove any spaces that were between the date and time
		while (lastSpace > 0 && substr(string, lastSpace-1, 1) == " ")
		{
			lastSpace--;
		}
		
		// could be "1984" or "1984/10/02" or "1984-10-02" followed by something like "6:00"
		var date = substr(string, 0, lastSpace);
	
		//parse the date
		var separator = null;
		t = [null, null];
		if (strpos(date, "-") !== FALSE)
		{
			separator = "-";
		}
		else if (strpos(date, "/") !== FALSE)
		{
			separator = "/";
		}
		else if (strpos(date, ' ') !== FALSE)
		{
			separator = ' ';
		}
		if (separator != null)
		{
			t = date.split(separator);
		}
		else if (strlen(string) == 4)
		{
			t[0] = string;
		}
		else if (strlen(string) == 6)
		{
			t[0] = substr(string, 0, 2);
			t[1] = substr(string, 2, 2);
			t[2] = substr(string, 4, 2);
		}
		else if (strlen(string) == 8)
		{
			t[0] = substr(string, 0, 4);
			t[1] = substr(string, 4, 2);
			t[2] = substr(string, 6, 2);
		}
		year = t[0];
		month = t[1];
		day = t.length == 3 ? t[2] : null;
      var temp = DateAndTime_ParseMonth(year);
		if (day == null && month != null)
		{
			// if there was no day then we probably have a date with no year as
			// in "October 2" or "2 October"
         var m = DateAndTime_ParseMonth(month);
			if (m != null)
			{
				day = year;
				year = null;
			}
			else
			{
				day = month;
				month = year;
				year = null;
			}
		}
		else if (temp != null)
		{
			// we could have a date order as in "October 2 1967"
			var temp = month;
			month = year;
			year = day;
			day = temp;
		}
		else
		{
			// we could have a date order as in "25 Jan 2010" or "dd/mm/yyyy" (or perhaps "mm/dd/yyyy")
			if (month.length == 2 && month > 12)
			{
				var temp = month;
				month = year;
				year = day;
				day = temp;
			}
			else if (day > 31)
			{
				var temp = day;
				day = year;
				year = temp;
			}
		}
		var temp = DateAndTime_ParseMonth(month);
		if (month.length >= 3 && temp != null)
		{
			month = temp;
		}
		if (year != null)
		{
			if (year.length == 2)
			{
				// for a two digit year we have to guess at what century is meant
				if (year >= 50)
				{
					year = parseInt(year, 10) + 1900;
				}
				else
				{
					year = parseInt(year, 10) + 2000;
				}
			}
			else if (year == "0000")	// special value for year not specified
			{
				year = null;
			}
		}
		if (month != null && month == "00")	// special handling for date not specified
		{
			month = null;
		}
	}
	
	if (convertZone)
	{
		// we need to convert the zone but we also need a date so we can figure out DST
		referenceDate = new DateAndTime(year, month, day, hour, minute, second, millisecond, 0);
		zone = DateAndTime_TimeZoneOffset(zone, referenceDate);
	}
	
//	Log_WriteError("Converted date and time: year, month, day, hour, minute, second, millisecond");
	var ret = new DateAndTime(year, month, day, hour, minute, second, millisecond, zone);
	ret.CreatedBy = "FromString(" + originalString + ", " + defaultZone + ")";		// used for debugging only
	return ret;
}

function DateAndTime_FromNative(date, zone)
{
	if (date == null)
		return null;

	var ret = new DateAndTime(date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate(),
		date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds(), zone);
	ret.CreatedBy = "FromNative(" + date.toString() + ", " + defaultZone + ")";		// used for debugging only
	return ret;
}

// The element may contain the attributes:
//		datazone: the time zone of the data provided if not specified in the data, default is GMT
//		displayzone: the time zone to display, default is client local
function DateAndTime_FromElement(element)
{
   var content = element.tagName == "INPUT" ? element.value : element.innerHTML;
   
   // get the zone of what we're given (may be overridden by the contents zone below)
   var dataZone = element.getAttribute('datazone');
	if (!empty(dataZone))
		dataZone = DateAndTime_TimeZoneOffset(dataZone);

	var dt = DateAndTime_FromString(content, dataZone);
	dataZone = dt.Zone();
	
	// get the time zone to be displayed
	var displayZone = element.getAttribute('displayzone');
	if (empty(displayZone))
		displayZone = DateAndTime_LocalTimeZoneOffset(dt);
	else
		displayZone = DateAndTime_TimeZoneOffset(displayZone, dt);

	if (!empty(dataZone))
		dt = dt.ConvertToZone(displayZone);

	return dt;
}

DateAndTime.prototype.ToElement = function(element)
{
	var result = false;
   var content = element.tagName == "INPUT" ? element.value : element.innerHTML;
	
	// get the zone desired for saving, if any
   var dataZone = element.getAttribute('datazone');
	if (!empty(dataZone))
		dataZone = DateAndTime_TimeZoneOffset(dataZone);

   // get the time zone to be displayed
   var displayZone = element.getAttribute('displayzone');
   if (empty(displayZone))
   	displayZone = DateAndTime_LocalTimeZoneOffset();
   else
   	displayZone = DateAndTime_TimeZoneOffset(displayZone);
	
	var cp = this.Copy();
   if (this.HasDate() && this.HasTime())
   {
      // convert to data zone if specified
      if (dataZone !== null && dataZone !== undefined)
		{
			cp = cp.Add(dataZone-displayZone);
			cp.SetZone(dataZone);
		}
      
      // convert from local daylight savings time
      var now = DateAndTime_Now(this.Zone());
      if (now.IsDaylightSavings() != this.IsDaylightSavings())
      {
      	if (now.IsDaylightSavings())
      		cp = cp.Add(SecondsPerHour);
      	else
      		cp = cp.Subtract(SecondsPerHour);
      }
   }
   else
		cp.SetZone(null);
	
	if (!this.HasDate())
		cp.SetDate(null);
	if (!this.HasTime())
		cp.SetTime(null);
	
	// we want the format here to match that used by Form.php FormPrepDate()
	content = cp.ToFormat('%/D %:T %z');
   
   if (element.tagName == "INPUT")
   {
   	if (element.value != content)
		{
			result = true;
			element.value = content;
			Utilities_FireEvent(element, 'change');
		}
   }
   else
   {
		if (element.innerHTML != content)
		{
			result = true;
			element.innerHTML = content;
		}
   }

   return result;
}

function DateAndTime__FormatLongYear(dt)
{
	return sprintf("%04d", dt.HasYear() ? dt.Year() : 0);
}

function DateAndTime__FormatShortYear(dt)
{
	return sprintf("%02d", dt.HasYear() ? (dt.Year() % 100) : 0);
}

function DateAndTime__FormatLongNumericMonth(dt)
{
	return sprintf("%02d", dt.Month());
}

function DateAndTime__FormatShortNumericMonth(dt)
{
	return sprintf("%d", dt.Month());
}

function DateAndTime__FormatLongDay(dt)
{
	return sprintf("%02d", dt.Day());
}

function DateAndTime__FormatLong24Hour(dt)
{
	return sprintf("%02d", dt.Hour());
}

function DateAndTime__FormatLong12Hour(dt)
{
	if (dt.Hour() > 12)
	{
		return sprintf("%02d", (dt.Hour() - 12));
	}
	return sprintf("%02d", dt.Hour());
}

function DateAndTime__FormatShort24Hour(dt)
{
	return sprintf("%d", dt.Hour());
}

function DateAndTime__FormatShort12Hour(dt)
{
	if (dt.Hour() > 12)
	{
		return sprintf("%d", (dt.Hour() - 12));
	}
	return sprintf("%d", dt.Hour());
}

function DateAndTime__FormatMinute(dt)
{
	return sprintf("%02d", dt.Minute());
}

function DateAndTime__FormatAMPM(dt)
{
	if (dt.Hour() < 12)
	{
		return 'AM';
	}
	else
	{
		return 'PM';
	}
}

function DateAndTime__Formatampm_lower(dt)
{
	if (dt.Hour() < 12)
	{
		return 'am';
	}
	else
	{
		return 'pm';
	}
}

function DateAndTime__FormatSecond(dt)
{
	return sprintf("%02d", dt.Second());
}

function DateAndTime__FormatZone(dt)
{
	return DateAndTime_TimeZoneToString(dt.Zone());
}

function DateAndTime__FormatShortDayOfWeek(dt)
{
	return DateAndTime_GetDayOfWeekString(dt.DayOfWeek(), 0);
}

function DateAndTime__FormatLongDayOfWeek(dt)
{
	return DateAndTime_GetDayOfWeekString(dt.DayOfWeek(), 1);
}

function DateAndTime__FormatSpaceDay(dt)
{
	return sprintf("% 2d", dt.Day());
}

function DateAndTime__FormatShortDay(dt)
{
	return sprintf("%d", dt.Day());
}

function DateAndTime__FormatShortMonth(dt)
{
	return DateAndTime_GetMonthString(dt.Month(), 0);
}

function DateAndTime__FormatLongMonth(dt)
{
	return DateAndTime_GetMonthString(dt.Month(), 1);
}

function DateAndTime__FormatMillisecond(dt)
{
	return sprintf("%02d.%03d", dt.Second(), dt.Millisecond());
}

function DateAndTime__FormatCharZone(dt)
{
	return DateAndTime_TimeZoneToChar(dt.Zone());
}

function DateAndTime__FormatNumericZone(dt)
{
	return DateAndTime_TimeZoneToNumeric(dt.Zone());
}

function DateAndTime__FormatTime(dt)
{
	return sprintf("%02d%02d%02d", dt.Hour(), dt.Minute(), dt.Second());
}

function DateAndTime__FormatTimeColon(dt)
{
	return sprintf("%02d:%02d:%02d", dt.Hour(), dt.Minute(), dt.Second());
}

function DateAndTime__FormatTimeNoSecColon(dt)
{
	return sprintf("%02d:%02d", dt.Hour(), dt.Minute());
}

function DateAndTime__FormatTimeWithMillisecond(dt)
{
	return sprintf("%02d%02d%02d.%03d", dt.Hour(), dt.Minute(), dt.Second(), dt.Millisecond());
}

function DateAndTime__FormatDate(dt)
{
	return sprintf("%02d%02d%02d", dt.Month(), dt.Day(), (dt.Year() % 100));
}

function DateAndTime__FormatDateHyphens(dt)
{
	return sprintf("%04d-%02d-%02d", dt.Year(), dt.Month(), dt.Day());
}

function DateAndTime__FormatDateSlashes(dt)
{
	return sprintf("%04d/%02d/%02d", dt.Year(), dt.Month(), dt.Day());
}

function DateAndTime_SpanInit(span)
{
	if (typeof DateAndTime_SpanInit.REDateAndTime_SpanClass == 'undefined' )
		DateAndTime_SpanInit.REDateAndTime_SpanClass = new RegExp('\\b' + DateAndTime_SpanClass + '\\b', 'gi');
	
	var dt = DateAndTime_FromElement(span);
	
	// convert to local time zone
	dt = dt.ConvertToZone(dt.LocalTimeZoneOffset());
	
	// get the display format specifier
	var format = span.getAttribute('format');
	if (empty(format)) format = DateAndTime_ShortFormat;
	
	var t = dt.ToFormat(format);
	
	// replace the epoch with the date string
	span.innerHTML = t;
	
	// make the SPAN "live" so different CSS can be applied
	span.className = span.className.replace(DateAndTime_SpanInit.REDateAndTime_SpanClass, DateAndTime_SpanClassLive);
}

function DateAndTimePageInit(rootNodes)
{
	forEach(rootNodes, function(root)
	{
		// This function finds all SPAN elements in the document where
		// class=DateAndTime_SpanClass, then massages the text to display
		// in a specified format and zone, or a default format and the
		// local time zone. The SPAN may contain the attributes:
		//		datazone: the time zone of the epoch provided, default is GMT
		//		displayzone: the time zone to display, default is client local
		//		format: an optional display format
		
		var spans = Utilities_GetElementsByClass(DateAndTime_SpanClass, "span", root);
		for (var j = 0; j < spans.length; j++)
		{
			DateAndTime_SpanInit(spans[j]);
		}
	});
}

DocumentLoad.AddCallback(DateAndTimePageInit);



if (0)
{
	var tmp = DateAndTime_FromString("20110501T120102Z");
	if (tmp.ToFormat(DateAndTime_ISO8601BasicFormat) != "20110501T120102Z")
	{
		Log_Die("Error in ToFormat()!");
	}
	if (tmp.Hour() != 12)
	{
		Log_Die("Error in Hour()!");
	}
	if (tmp.Minute() != 1)
	{
		Log_Die("Error in Minute()!");
	}
	if (tmp.Second() != 2)
	{
		Log_Die("Error in Second()!");
	}
	if (tmp.Millisecond() != 0)
	{
		Log_Die("Error in Millisecond()!");
	}
	if (tmp.Zone() != 0)
	{
		Log_Die("Error in Zone()!");
	}
	tmp.SetTime(15, 35, 22, 45);
	tmp.SetZone(200);
	if (tmp.Hour() != 15)
	{
		Log_Die("Error in SetTime()!");
	}
	if (tmp.Minute() != 35)
	{
		Log_Die("Error in SetTime()!");
	}
	if (tmp.Second() != 22)
	{
		Log_Die("Error in SetTime()!");
	}
	if (tmp.Millisecond() != 45)
	{
		Log_Die("Error in SetTime()!");
	}
	if (tmp.Zone() != 200)
	{
		Log_Die("Error in SetZone()!");
	}
	var tmp = new DateAndTime(2037, 12, 1, 20, 41, 3);
	if (tmp.DaysThisMonth() != 31)
	{
		Log_Die("Error in DaysThisMonth()!");
	}
//	for (var year = 2035; year <= 2037; year++)
//	{
//		for (var month = 1; month <= 12; month++)
//		{
//			Log_WriteInfo("Y: " + year + " M: " + month + " D: " + DateAndTime_DaysInMonth(year, month));
//		}
//	}
	var tmp = DateAndTime_Now();
	var str = tmp.toString();

	tmp = DateAndTime_FromEpoch(1361000000, 0);
	if (tmp.Day() != 16)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Hour() != 7)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Minute() != 33)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Second() != 20)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Zone() != 0)
	{
		Log_Die("Error in FromEpoch()!");
	}
	tmp2 = tmp.Copy();
	if (tmp.Compare(tmp2) != 0)
	{
		Log_Die("Error in Copy()!");
	}
	tmp = tmp.ToEpoch();
	if (tmp != 1361000000)
	{
		Log_Die("Error in ToEpoch()!");
	}

	tmp = DateAndTime_FromEpoch(1361000000, -14400);
	if (tmp.Day() != 16)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Hour() != 7)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Minute() != 33)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Second() != 20)
	{
		Log_Die("Error in FromEpoch()!");
	}
	if (tmp.Zone() != -14400)
	{
		Log_Die("Error in FromEpoch()!");
	}
	tmp2 = tmp.Copy();
	if (tmp.Compare(tmp2) != 0)
	{
		Log_Die("Error in Copy()!");
	}
	tmp = tmp.ToEpoch();
	if (tmp != 1361000000)
	{
		Log_Die("Error in ToEpoch()!");
	}
}