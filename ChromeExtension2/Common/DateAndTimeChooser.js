// ========================================================================
//        Copyright � 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows an input control to display a calendar for choosing a date and time.
// Note that either can be selected independently by leaving out the other class.
// The time may be specified by Epoch or by string, use string when allowing null!
//
// <input class="datechooser timechooser" type="text" name="Date" value="1352101450" format="" availability=""/>
//
// classes:
//
// datechooser 
// timechooser
// datenullable
// timenullable
// nullable
// showaspopup
// showalways
//
// Attributes include those for DateAndTime_FromElement as well as:
//
//	format:			the optional display format (default is 2006/03/04 11:00am)
// availability:  the optional list of available times that can be chosen (comma separated list of GMT epochs)

DateAndTimeChooser =
{
	// constants used throughout the class
	DaysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
	Hours: [' 1',' 2',' 3',' 4',' 5',' 6',' 7',' 8',' 9','10','11','12'],
	Minutes: ['00','05','10','15','20','25','30','35','40','45','50','55'],
   Years: [],
	AmPm: ['am','pm'],
   TheseDontWorkForMe: null,
   None: null,
	FullCurrentMonth: true,
   ToElementTimer: null,

	// shortcuts to get date info
	GetYear: function(date)
   {
		return date.HasDate() ? date.Year() : DateAndTime_Now().Year();
	},
	GetMonth:
   {
		integer: function(date)
      {
			return (date.HasDate() ? date.Month() : DateAndTime_Now().Month()) - 1;
		},
		string: function(date, full)
      {
			return DateAndTime_GetMonthString(DateAndTimeChooser.GetMonth.integer(date), full);
		}
	},
	GetDay: function(date)
   {
		return date.HasDate() ? date.Day() : DateAndTime_Now().Day();
	},
	GetHour: function(date)
   {
		var hours = date.HasTime() ? date.Hour() : 0;
   
      var minutes = date.HasTime() ? date.Minute() : 0;
      minutes = Math.ceil(minutes / 5) * 5;     // our minutes are rounded up to 5 min intervals
      if (minutes == 60) hours++;               // rounded up to full hour
      
		if (hours >= 12) hours -= 12;
		return hours;
	},
	GetMinute: function(date)
   {
      var minutes = date.HasTime() ? date.Minute() : 0;
      minutes = Math.ceil(minutes / 5) * 5;     // our minutes are rounded up to 5 min intervals
      if (minutes == 60) minutes = 0;           // rounded up to full hour
		return minutes;
	},
	GetAmPm: 
   {
		integer: function(date)
      {
         var hours = date.HasTime() ? date.Hour() : 0;
   
         var minutes = date.HasTime() ? date.Minute() : 0;
         minutes = Math.ceil(minutes / 5) * 5;     // our minutes are rounded up to 5 min intervals
         if (minutes == 60) hours++;               // rounded up to full hour
         
			return hours < 12 ? 0 : 1;
		},
		string: function(date)
      {
			return DateAndTimeChooser.GetAmPm.integer(date) ? 'pm' : 'am';
		}
	},
	
   GetDisplayedMonth:
   {
		integer: function(currentMonthView)
      {
			return currentMonthView;
		},
		string: function(currentMonthView)
      {
			var date = currentMonthView+1;
			return DateAndTime_GetMonthString(date, DateAndTimeChooser.FullCurrentMonth);
		},
		numDays: function(currentMonthView, currentYearView)
      {
			// checks to see if february is a leap year otherwise return the respective # of days
			return (DateAndTimeChooser.GetDisplayedMonth.integer(currentMonthView) == 1 && !(currentYearView & 3) && (currentYearView % 1e2 || !(currentYearView % 4e2))) ? 29 : DateAndTimeChooser.DaysInMonth[DateAndTimeChooser.GetDisplayedMonth.integer(currentMonthView)];
		}
	},
   
   GetDisplayFormat: function(dataElement)
   {
      var format = dataElement.getAttribute('format');
      if (empty(format)) format = "%/D %l:%M%P";
      return format;
   },
   
   // returns local time days since epoch
   GetAvailableDates: function(dataElement)
   {
      var displayZone = DateAndTime_LocalTimeZoneOffset();
      var availability = dataElement.getAttribute('availability');
      var dates = [];
      if (availability && availability.length > 0)
      {
         availability = availability.split(",");
         for (var i = 0; i < availability.length; i++)
         {
            var days = Utilities_Div(parseInt(availability[i], 10) + displayZone, SecondsPerDay);
            
            var found = false;
            for (var j = 0; j < dates.length; j++)
            {
               if (dates[j] == days)
               {
                  found = true;
                  break;
               }
            }
            if (!found)
               dates.push(days);
         }
         Utilities_SortNumericArray(dates);
      }
      return dates;
   },
   
   // returns local time seconds since midnight
   GetAvailableTimes: function(dataElement, date)
   {
      var displayZone = DateAndTime_LocalTimeZoneOffset();
      var availability = dataElement.getAttribute('availability');
      var times = [];
      if (availability && availability.length > 0)
      {
         date = Utilities_Div(date.ToEpoch() + displayZone, SecondsPerDay);
         
         availability = availability.split(",");
         for (var i = 0; i < availability.length; i++)
         {
            var epoch = parseInt(availability[i], 10) + displayZone;
            var days = Utilities_Div(epoch, SecondsPerDay);
            if (days == date)
            {
               var seconds = Utilities_Mod(epoch, SecondsPerDay);
               
               var found = false;
               for (var j = 0; j < times.length; j++)
               {
                  if (times[j] == seconds)
                  {
                     found = true;
                     break;
                  }
               }
               if (!found)
                  times.push(seconds);
            }
         }
         Utilities_SortNumericArray(times);
      }
      return times;
   },
   
   GetDateNullable: function(dataElement)
   {
   	return Class_HasByElement(dataElement, 'datenullable');
   },
   
   GetTimeNullable: function(dataElement)
   {
   	return Class_HasByElement(dataElement, 'timenullable');
   },
   
   GetNullable: function(dataElement)
   {
   	return Class_HasByElement(dataElement, 'nullable');
   },
   
	Init: function(rootNodes)
	{
      DateAndTimeChooser.TheseDontWorkForMe = Str('These dates don\'t work for me.');  // string matches Schedulers.php
      DateAndTimeChooser.None = Str('None');
      
      Log_WriteInfo('Client time zone ' + DateAndTime_LocalTimeZoneOffset() + ' in ' + (DateAndTime_Now().IsDaylightSavings() ? 'daylight savings time' : 'standard time'));
      
      forEach(rootNodes, function(root)
      {
         var elems = Utilities_GetThisOrChildrenBySelector(root, 'INPUT.datechooser,INPUT.timechooser');
         for (var i = 0; i < elems.length; i++)
         {
            var elem = elems[i];
            DateAndTimeChooser.MakeDateAndTimeChooser(elem);
         }
      });
	},
	
	GetHours: function(dataElementId)
   {
      var hoursElement = DateAndTimeChooser.GetHoursElement(dataElementId);
      var ampmElement = DateAndTimeChooser.GetAmPmElement(dataElementId);
      
		var hours = parseInt(hoursElement.value, 10);
		var temp = parseInt(ampmElement.value, 10);
		if (hours == 12) temp -= 1;
		hours += 12 * temp;
		return hours;
	},

	GetContainerElement: function(node)
   {
      if (Class_HasByElement(node, 'datechooser,timechooser'))
      {
         // the container comes after
         while (node != null && !Class_HasByElement(node, 'calendar'))
         {
            node = node.nextElementSibling;
         }
      }
      else
      {
         // this node is inside the container
         node = Utilities_GetThisOrParentByClass(node, 'calendar');
      }
      if (node == null)
      {
         Log_Die('Error finding container element!');
      }
      return node;
	},
	
	GetDataElement: function(node)
   {
      if (Class_HasByElement(node, 'datechooser,timechooser'))
         return node;
      node = DateAndTimeChooser.GetContainerElement(node);
      if (Class_HasByElement(node.previousElementSibling, 'showalways'))
         return node.previousElementSibling;
      else
         return node.previousElementSibling.previousElementSibling;
	},
	
	GetDisplayElement: function(node)
   {
      node = DateAndTimeChooser.GetContainerElement(node);
      if (Class_HasByElement(node.previousElementSibling, 'showalways'))
         return node.nextElementSibling;
      else
         return node.previousElementSibling;
	},

   // the name is a subset of the actual one used
   GetElementByIdOrName: function(node, name)
   {
      var base_name = DateAndTimeChooser.GetBaseName(node);
      var container = DateAndTimeChooser.GetContainerElement(node);
      var elem = Utilities_GetElementById(base_name + name, container);
      if (elem == null)
         elem = Utilities_GetElementByName(base_name + name, container);
      if (elem == null && name != 'AllNull' && name != 'HasDate' && name != 'HasTime' &&
         name != 'HasDateLabel' && name != 'HasTimeLabel')
      {
         Log_Die('Error finding ' + name + ' element by name!');
      }
      return elem;
   },

   GetAllNullElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'AllNull');
	},
	
	GetHasDateElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'HasDate');
	},
	
	GetHasDateLabelElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'HasDateLabel');
	},
	
	GetHasTimeElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'HasTime');
	},
	
	GetHasTimeLabelElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'HasTimeLabel');
	},
	
	GetDatePortion1Element: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'DatePortion1');
	},
	
	GetDatePortion2Element: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'DatePortion2');
	},
	
   GetBodyElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'Body');
   },
   
   GetTimeElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'Time');
   },
   
   GetYearListElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'YearList');
	},
	
	GetMonthElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'Month');
	},
	
	GetHoursElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'Hours');
	},
	
	GetMinutesElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'Minutes');
	},
	
	GetAmPmElement: function(node)
   {
      return DateAndTimeChooser.GetElementByIdOrName(node, 'AmPm');
	},
	
	handleDoneClick: function(node)
   {
		DateAndTimeChooser.close(node);
		return false;
	},

	handleDayClick: function(node)
   {
      var dataElement = DateAndTimeChooser.GetDataElement(node)
      var hasDate = DateAndTimeChooser.GetHasDateElement(node);
      var allNull = DateAndTimeChooser.GetAllNullElement(node);
      var wantsTime = parseBool(dataElement.getAttribute('wantsTime'));
      
      if (hasDate)
         hasDate.checked = true;
      if (allNull)
         allNull.checked = false;
      
      DateAndTimeChooser.updateDataElement(node);
		
		if (!wantsTime)
			DateAndTimeChooser.close(node);
		
		// the selection has changed
		DateAndTimeChooser.rebuildCalendar(node);
	},
			
	handleTimeClick: function(node)
   {
      var hasTime = DateAndTimeChooser.GetHasTimeElement(node);
      var allNull = DateAndTimeChooser.GetAllNullElement(node);
      
      if (hasTime)
         hasTime.checked = true;
      if (allNull)
         allNull.checked = false;
      
      DateAndTimeChooser.updateDataElement(node);
	},
			
	handleDateChange: function(node)
   {
      var dataElement = DateAndTimeChooser.GetDataElement(node);
      var monthElement = DateAndTimeChooser.GetMonthElement(node);
      
      var currentYearView = parseInt(dataElement.getAttribute('currentYearView'));
      var currentMonthView = parseInt(dataElement.getAttribute('currentMonthView'));
      
		// if we go too far into the past
		if (currentMonthView < 0)
      {
			currentYearView--;
			
			// start our month count at 11 (11 = december)
			currentMonthView = 11;
		}
		
		// if we go too far into the future
		if (currentMonthView > 11)
      {
			currentYearView++;
			
			// restart our month count (0 = january)
			currentMonthView = 0;
		}
		
		monthElement.innerHTML = DateAndTimeChooser.GetDisplayedMonth.string(currentMonthView) + '&nbsp;';

      dataElement.setAttribute('currentYearView', currentYearView);
      dataElement.setAttribute('currentMonthView', currentMonthView);
		
      var yearList = DateAndTimeChooser.GetYearListElement(node);
      yearList.value = currentYearView;
      
		DateAndTimeChooser.rebuildCalendar(node);
		
		return false;
	},

   getSelectedTime: function(node)
   {
      var timeElement = DateAndTimeChooser.GetTimeElement(node);
      if (timeElement.nodeName == 'SELECT')
         return timeElement.value;
   
      var base_name = DateAndTimeChooser.GetBaseName(node);
      
      // we are dealing with a DIV containing radio buttons
      return Utilities_GetRadioValue(base_name + 'Time', timeElement);
   },
   
   GetBaseName: function(node)
   {
      return DateAndTimeChooser.GetDataElement(node).name;
   },
   
    // the data element value has changed so we need to update our state
   DataElementHasChanged: function(elem)
   {
      // we are passed the INPUT element so we delete the SELECTor and then the DIV that come after
      // so they can be recreated with the new date
      var temp = elem.nextSibling;
      elem.parentNode.removeChild(temp);
      temp = elem.nextSibling;
      elem.parentNode.removeChild(temp);
      
      elem.removeAttribute('wantsDate');  // this is used to flag the element is initialized so we have to remove it
   
      DateAndTimeChooser.MakeDateAndTimeChooser(elem);
   },
   
   updateDataElement: function(node)
   {
      var dataElement = DateAndTimeChooser.GetDataElement(node);
      var displayElement = DateAndTimeChooser.GetDisplayElement(node);
      var hasDate = DateAndTimeChooser.GetHasDateElement(node);
      var hasTime = DateAndTimeChooser.GetHasTimeElement(node);
      var hasDateLabel = DateAndTimeChooser.GetHasDateLabelElement(node);
      var hasTimeLabel = DateAndTimeChooser.GetHasTimeLabelElement(node);
      var allNull = DateAndTimeChooser.GetAllNullElement(node);
      var datePortion1 = DateAndTimeChooser.GetDatePortion1Element(node);
      var datePortion2 = DateAndTimeChooser.GetDatePortion2Element(node);
      var timePortion = DateAndTimeChooser.GetTimeElement(node);

      var displayFormat = DateAndTimeChooser.GetDisplayFormat(dataElement);
      var showAlways = Class_HasByElement(dataElement, 'showalways');
      
      var wantsDate = parseBool(dataElement.getAttribute('wantsDate'));
      var wantsTime = parseBool(dataElement.getAttribute('wantsTime'));

      var currentYear = parseInt(dataElement.getAttribute('currentYear'));
      var currentMonth = parseInt(dataElement.getAttribute('currentMonth'));
      var currentDay = parseInt(dataElement.getAttribute('currentDay'));

      var selectedDate = DateAndTime_FromElement(dataElement);
      selectedDate.SetDate(currentYear, currentMonth+1, currentDay);
      var availableDates = DateAndTimeChooser.GetAvailableDates(dataElement);
      var availableTimes = DateAndTimeChooser.GetAvailableTimes(dataElement, selectedDate);
      
      if (wantsDate && (!hasDate || hasDate.checked) && (!allNull || !allNull.checked)
         && (availableDates.length == 0 || availableTimes.length > 0))
      {
         Visibility_Show(datePortion1);
         Visibility_Show(datePortion2);
      }
      else
      {
         selectedDate.SetDate(null);
         if (!showAlways)
         {
            Visibility_Hide(datePortion1);
            Visibility_Hide(datePortion2);
         }
      }
   
      if (availableDates.length > 0)
      {
         Visibility_Show(timePortion);

         if (availableTimes.length > 0)
         {
            var time = DateAndTimeChooser.getSelectedTime(node);
            if (empty(time) || !Utilities_ArrayContains(availableTimes, time))
               time = availableTimes[0];
            var hours = Utilities_Div(time, SecondsPerHour);
            var minutes = Utilities_Div(time - (hours * SecondsPerHour), SecondsPerMinute);
            selectedDate.SetTime(hours, minutes, 0, 0);
         }
         else
         {
            selectedDate.SetTime(null);
         }
      }
      else
      {
         if (wantsTime && (!hasTime || hasTime.checked) && (!allNull || !allNull.checked))
         {
            var hours = DateAndTimeChooser.GetHours(node);
            var minutes = DateAndTimeChooser.GetMinutesElement(node).value;
            selectedDate.SetTime(hours, minutes, 0, 0);
            Visibility_Show(timePortion);
         }
         else
         {
            selectedDate.SetTime(null);
            Visibility_Hide(timePortion);
         }
      }
   
      if (!selectedDate.HasDate() && !selectedDate.HasTime()) allNull.checked = true;
      
      if (hasTimeLabel) Visibility_SetByElement(hasTimeLabel, !allNull || !allNull.checked);
      if (hasDateLabel) Visibility_SetByElement(hasDateLabel, !allNull || !allNull.checked);
				
		displayElement.innerHTML = selectedDate.ToFormat(displayFormat);
      if (displayElement.innerHTML.isEmpty() && !showAlways)
         displayElement.innerHTML = DateAndTimeChooser.None;   // give the user something to click on
   
      // DRL I use a timer because in some cases the time will be updated a couple of times before it settles, 
      // the first change when the user clicks to un-NULL the item, and then when the code picks a time to use.
      if (DateAndTimeChooser.ToElementTimer)
         clearTimeout(DateAndTimeChooser.ToElementTimer);
      DateAndTimeChooser.ToElementTimer = setTimeout( function()
      {
         DateAndTimeChooser.ToElementTimer = null;
         try
         {
            selectedDate.ToElement(dataElement);
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 1);
	},

	buildNode: function(nodeName, attributes, content)
   {
		var element;

// This didn't work in Firefox and I didn't have time to track it down.
// Error is "buildCache[nodeName].cloneNode is not a function".
//		if(!(nodeName in buildCache)) {
//			buildCache[nodeName] = document.createElement(nodeName);
//		}
//		element = buildCache[nodeName].cloneNode(false);
		element = document.createElement(nodeName);
		
		if (attributes != null)
      {
			for(var attribute in attributes)
         {
				element[attribute] = attributes[attribute];
			}
		}
		
		if (content != null)
      {
			if(typeof(content) == 'object')
         {
				element.appendChild(content);
			}
         else
         {
				element.innerHTML = content;
			}
		}
		
		return element;
	},
	
	buildSelectNode: function(values, selected)
   {
		elem = DateAndTimeChooser.buildNode('select', { size: 1 }, null);
		for (i = 0; i < values.length; i++)
		{
			val = parseInt(values[i], 10);
			if (val == selected)
				elem.appendChild(DateAndTimeChooser.buildNode('option', { value: val, selected: 1 }, values[i]));
			else
				elem.appendChild(DateAndTimeChooser.buildNode('option', { value: val }, values[i]));
		}
		return elem;
	},
	
	rebuildCalendar: function(node)
	{
      var dataElement = DateAndTimeChooser.GetDataElement(node);
      var body = DateAndTimeChooser.GetBodyElement(node);
      var availableDates = DateAndTimeChooser.GetAvailableDates(dataElement);
      var timeElement = availableDates && availableDates.length > 0 ? DateAndTimeChooser.GetTimeElement(node) : null;
      
      // rebuild the calendar
      while (body.hasChildNodes())
      {
         body.removeChild(body.lastChild);
      }
      body.appendChild(DateAndTimeChooser.buildCalendar(dataElement));
      
      if (timeElement)
         DateAndTimeChooser.buildTimes(dataElement, timeElement);
   },
	
	buildWeekdays: function()
   {
		var html = document.createDocumentFragment();
		// write out the names of each week day
		for(i = 0, x = DaysOfWeek.length; i < x; i++) {
			html.appendChild(DateAndTimeChooser.buildNode('th', {}, DaysOfWeek[i].substring(0, 2)));
		}
		return html;
	},
   
   buildTimes: function(dataElement, timeElement)
   {
      var selectedDate = DateAndTime_FromElement(dataElement);
      var displayZone = DateAndTime_LocalTimeZoneOffset();
      var base_name = DateAndTimeChooser.GetBaseName(dataElement);

      // remove the old times
      while (timeElement.hasChildNodes())
      {
         timeElement.removeChild(timeElement.lastChild);
      }

      // add the new times
      var availableTimes = DateAndTimeChooser.GetAvailableTimes(dataElement, selectedDate);
      if (availableTimes.length > 0)
      {
         var selected = Utilities_Mod(selectedDate.ToEpoch() + displayZone, SecondsPerDay);

         var split = Utilities_Div(availableTimes.length+1, 2);
         if (split < 4 || timeElement.nodeName == 'SELECT')
            split = availableTimes.length;
         var container = null;

         for (var i = 0; i < availableTimes.length; i++)
         {
            var val = parseInt(availableTimes[i], 10);
            var hours = Utilities_Div(val, SecondsPerHour);
            var minutes = Utilities_Div(val - (hours * SecondsPerHour), SecondsPerMinute);
            var pm = hours < 12 ? 'am' : 'pm';
            if (hours > 12) hours -= 12;
            var label = sprintf("%02d:%02d", hours, minutes) + ' ' + pm;
            if (timeElement.nodeName == 'SELECT')
            {
               if (val == selected)
                  timeElement.appendChild(DateAndTimeChooser.buildNode('option', { value: val, selected: 1 }, label));
               else
                  timeElement.appendChild(DateAndTimeChooser.buildNode('option', { value: val }, label));
            }
            else
            {
               // otherwise we have a DIV containing radio buttons

               var id = base_name + 'Time_' + i;
               var child = null;
               if (val == selected)
                  child = DateAndTimeChooser.buildNode('input', { id: id, type: 'radio', name: base_name + 'Time', value: val, checked: 1 });
               else
                  child = DateAndTimeChooser.buildNode('input', { id: id, type: 'radio', name: base_name + 'Time', value: val });
               child.onchange = function(e)
               {
                  var node = Utilities_GetEventTarget(e);
                  DateAndTimeChooser.handleTimeClick(node);
               }

               if (container == null || i == split)
               {
                  container = DateAndTimeChooser.buildNode('div', { className: 'calendar_time_column' });
                  timeElement.appendChild(container);
               }
               else
                  container.appendChild(DateAndTimeChooser.buildNode('br', { }));

               container.appendChild(child);
               container.appendChild(DateAndTimeChooser.buildNode('label', { htmlFor: id }, label));
            }
         }
      }
      else
      {
         var msg = DateAndTimeChooser.buildNode('span', { }, Str("No available times for this date."));
         timeElement.appendChild(msg);
      }
   },
   
	buildCalendar: function(dataElement)
   {
      var currentYearView = parseInt(dataElement.getAttribute('currentYearView'));
      var currentMonthView = parseInt(dataElement.getAttribute('currentMonthView'));
      var currentYear = parseInt(dataElement.getAttribute('currentYear'));
      var currentMonth = parseInt(dataElement.getAttribute('currentMonth'));
      var currentDay = parseInt(dataElement.getAttribute('currentDay'));
   
      var displayZone = DateAndTime_LocalTimeZoneOffset();
      var start = new DateAndTime(currentYearView, currentMonthView+1, 1, 0, 0, 0, 0, displayZone);
      start = Utilities_Div(parseInt(start.ToEpoch(), 10) + displayZone, SecondsPerDay);
      start--; // the day number here is 1-based so make that adjustment
      
      var availableDates = DateAndTimeChooser.GetAvailableDates(dataElement);
      for (i = 0; i < availableDates.length; i++)
      {
         availableDates[i] -= start;   // convert to day in this month (negative for earlier months, etc.)
      }
      
		var html = document.createDocumentFragment();
		
		// get the first day of the month we are currently viewing
		var firstOfMonth = new Date(currentYearView, currentMonthView, 1).getDay();
		// get the total number of days in the month we are currently viewing
		var numDays = DateAndTimeChooser.GetDisplayedMonth.numDays(currentMonthView, currentYearView);
		// declare our day counter
		var dayCount = 0;
		
		var row = DateAndTimeChooser.buildNode('tr');
		
		// print out previous month's "days"
		for (i = 1; i <= firstOfMonth; i++)
      {
			row.appendChild(DateAndTimeChooser.buildNode('td', {}, '&nbsp;'));
			dayCount++;
		}
		
		for (i = 1; i <= numDays; i++)
      {
			// if we have reached the end of a week, wrap to the next line
			if (dayCount == 7)
         {
				html.appendChild(row);
				row = DateAndTimeChooser.buildNode('tr');
				dayCount = 0;
			}
			
			// create a clickable day element
			elem = DateAndTimeChooser.buildNode('a', { href: 'javascript:void(0)' }, i);
			elem.onclick = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            var dataElement = DateAndTimeChooser.GetDataElement(node);
            var currentYearView = parseInt(dataElement.getAttribute('currentYearView'));
            var currentMonthView = parseInt(dataElement.getAttribute('currentMonthView'));
            dataElement.setAttribute('currentyear', currentYearView);
            dataElement.setAttribute('currentMonth', currentMonthView);
            dataElement.setAttribute('currentDay', this.innerHTML);
				DateAndTimeChooser.handleDayClick(node);
				return false;
			}

         var now = DateAndTime_Now();
         
			// output the text that goes inside each td
			// if the day is the selected day, add a class of "selected"
			className = availableDates.length > 0 ? 'not_available' : '';
         for (j = 0; j < availableDates.length; j++)
         {
            if (availableDates[j] == i)
               className = 'available';
         }
         if (now.Day() == i && now.Month()-1 == currentMonthView && now.Year() == currentYearView)
            className += ' today';
			if (currentDay == i && currentMonth == currentMonthView && currentYear == currentYearView)
				className += ' selected';
			
			row.appendChild(DateAndTimeChooser.buildNode('td', { className: className }, elem));

			dayCount++;
		}
		
		// if we haven't finished at the end of the week, start writing out the "days" for the next month
		for(i = 1; i <= (7 - dayCount); i++)
      {
			row.appendChild(DateAndTimeChooser.buildNode('td', {}, '&nbsp;'));
		}
		
		html.appendChild(row);
		
		return html;
	},
	
	open: function(node)
   {
/* DRL FIXIT! Add handler to close when user clicks outside the calendar.
      var wantsTime = parseBool(Utilities_GetElementById(dataElementId).getAttribute('wantsTime'));
      
		if (!wantsTime)
		{
			document.onclick = function(e)
         {
				e = e || window.event;
				var target = e.target || e.srcElement;
            var displayElement = DateAndTimeChooser.GetDisplayElement(dataElementId);
            
				var parentNode = target.parentNode;
				if (target != displayElement && parentNode != container)
            {
					while (parentNode != container)
               {
						parentNode = parentNode.parentNode;
						if (parentNode == null)
                  {
							DateAndTimeChooser.close(containerId);
							break;
						}
					}
				}
			}
		}
*/
		
      var scrollX = window.scrollX;
      var scrollY = window.scrollY;
      
      var container = DateAndTimeChooser.GetContainerElement(node);
		Visibility_Show(container);
      DateAndTimeChooser.updateDataElement(node);   // show/hide date and time as appropriate
      
      setTimeout( function()
      {
         try
         {
            window.scrollTo(scrollX, scrollY);
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 1);   // restore original scroll position
	},
	
	close: function(node)
   {
//		document.onclick = null;

      var scrollX = window.scrollX;
      var scrollY = window.scrollY;
      
      var container = DateAndTimeChooser.GetContainerElement(node);
		Visibility_Hide(container);
      
      setTimeout( function()
      {
         try
         {
            window.scrollTo(scrollX, scrollY);
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 1);   // restore original scroll position
	},
	
	MakeDateAndTimeChooser: function(dataElement)
	{
      // do not initialize if it's in a template
      if (Utilities_HasClassAsParent(dataElement, 'MultiItemTemplate'))
         return;
      
      if (dataElement.hasAttribute('wantsDate'))
         return;	// already initialized

      var wantsDate = Class_HasByElement(dataElement, 'datechooser');
      var wantsTime = Class_HasByElement(dataElement, 'timechooser');
      
      var base_name = dataElement.name;
      
      if (DateAndTimeChooser.Years.length == 0)
         for (var i = 1950; i < 2050; i++)
            DateAndTimeChooser.Years[i-1950] = i + "";
            
      var displayFormat = DateAndTimeChooser.GetDisplayFormat(dataElement);
      var showAsPopUp = Class_HasByElement(dataElement, 'showaspopup');
      var showAlways = Class_HasByElement(dataElement, 'showalways');
      var dateNullable = DateAndTimeChooser.GetDateNullable(dataElement);
      var timeNullable = DateAndTimeChooser.GetTimeNullable(dataElement);
      var nullable = DateAndTimeChooser.GetNullable(dataElement);
      var availableDates = DateAndTimeChooser.GetAvailableDates(dataElement);
      
      var now = DateAndTime_Now();
         
		var selectedDate = DateAndTime_FromElement(dataElement);
      
      if (wantsDate && !dateNullable && (!nullable || selectedDate.HasTime()) && !selectedDate.HasDate())
      {
         selectedDate.SetDate(now.Year(), now.Month(), now.Day());
      }
      else if (!wantsDate)
      {
         selectedDate.SetDate(null);
      }
      if (wantsTime && !timeNullable && (!nullable || selectedDate.HasDate()) && !selectedDate.HasTime())
      {
         selectedDate.SetTime(now.Hour(), now.Minute(), now.Second());
      }
      else if (!wantsTime)
      {
         selectedDate.SetTime(null);
      }
      
		var currentYearView = DateAndTimeChooser.GetYear(selectedDate);
		var currentMonthView = DateAndTimeChooser.GetMonth.integer(selectedDate);
		var currentDay = DateAndTimeChooser.GetDay(selectedDate);

		dataElement.setAttribute('wantsDate', wantsDate);
		dataElement.setAttribute('wantsTime', wantsTime);
		dataElement.setAttribute('currentDay', currentDay);
		dataElement.setAttribute('currentMonth', currentMonthView);
		dataElement.setAttribute('currentYear', currentYearView);
		dataElement.setAttribute('currentMonthView', currentMonthView);
		dataElement.setAttribute('currentYearView', currentYearView);
  
      // initialize the display element
      var displayElement = DateAndTimeChooser.buildNode('a', { href: '#' });
      if (!showAlways)
      {
         displayElement.className = 'DateAndTimeChooser_Selector';
         displayElement.onclick = function(e)
         {
            var displayElement = Utilities_GetEventTarget(e);
            var container = displayElement.nextElementSibling;
            if (Visibility_IsShown(container))
               DateAndTimeChooser.close(container);
            else
               DateAndTimeChooser.open(container);
         };
      }

      // hide the data element
      Visibility_HideByElement(dataElement);
      
      // add display element
      Utilities_InsertAfterNode(dataElement.parentNode, displayElement, dataElement);
      
      var inputLeft = 0;
		var inputTop = 20;	// DRL FIXIT! Find the element height!
		obj = displayElement;
		if(obj.offsetParent)
      {
			do
         {
				inputLeft += obj.offsetLeft;
				inputTop += obj.offsetTop;
            obj = obj.offsetParent;
			} while (obj);
		}
		
		var container = DateAndTimeChooser.buildNode('div', { className: 'calendar' });
		if (showAsPopUp)
         container.style.cssText = 'display: none; position: absolute; top: ' +
            (inputTop + displayElement.offsetHeight) + 'px; left: ' + inputLeft + 'px; z-index: 9999;';
		else
         container.style.cssText = 'display: none;';

		var enabler = DateAndTimeChooser.buildNode('div', { className: 'calendar_enabler' });
      var allNull = null;
      var hasDate = null;
      var hasTime = null;
      if (nullable && (!timeNullable || !dateNullable))
      {
         allNull = DateAndTimeChooser.buildNode('input', { type: 'checkbox', name: base_name + 'AllNull' }, '');
         if (!selectedDate.HasDate() && !selectedDate.HasTime()) allNull.checked = true;
   		allNull.onchange = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            DateAndTimeChooser.updateDataElement(node);
   		}
         var label = DateAndTimeChooser.buildNode('label', { }, '');
   		var temp = availableDates.length > 0 ? DateAndTimeChooser.TheseDontWorkForMe : DateAndTimeChooser.None;
   		label.appendChild(allNull);
         label.appendChild(DateAndTimeChooser.buildNode('span', { }, ' ' + temp + '&nbsp;&nbsp;'));
   		enabler.appendChild(label);
      }
      if (wantsDate && dateNullable)
      {
         hasDate = DateAndTimeChooser.buildNode('input', { type: 'checkbox', name: base_name + 'HasDate' }, '');
         hasDate.checked = selectedDate.HasDate();
   		hasDate.onchange = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            DateAndTimeChooser.updateDataElement(node);
   		}
         var label = DateAndTimeChooser.buildNode('label', { id: base_name + 'HasDateLabel' }, '');
   		label.appendChild(hasDate);
         label.appendChild(DateAndTimeChooser.buildNode('span', { }, ' Date&nbsp;&nbsp;'));
   		enabler.appendChild(label);
      }
      if (wantsTime && timeNullable)
      {
         hasTime = DateAndTimeChooser.buildNode('input', { type: 'checkbox', name: base_name + 'HasTime' }, '');
         hasTime.checked = selectedDate.HasTime();
   		hasTime.onchange = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            DateAndTimeChooser.updateDataElement(node);
   		}
         var label = DateAndTimeChooser.buildNode('label', { id: base_name + 'HasTimeLabel' }, '');
   		label.appendChild(hasTime);
         label.appendChild(DateAndTimeChooser.buildNode('span', { }, ' Time'));
   		enabler.appendChild(label);
      }
      
		var months = DateAndTimeChooser.buildNode('div', { className: 'months', id: base_name + 'DatePortion1' });
		prevMonth = DateAndTimeChooser.buildNode('span', { className: 'prev-month' }, 
         DateAndTimeChooser.buildNode('a', { href: 'javascript:void(0)' }, '&lt;'));
		prevMonth.onclick = function(e)
      {
         var node = Utilities_GetEventTarget(e);
         var dataElement = DateAndTimeChooser.GetDataElement(node);
			dataElement.setAttribute('currentMonthView', parseInt(dataElement.getAttribute('currentMonthView'))-1);
			return DateAndTimeChooser.handleDateChange(node);
		}
		nextMonth = DateAndTimeChooser.buildNode('span', { className: 'next-month' }, 
         DateAndTimeChooser.buildNode('a', { href: 'javascript:void(0)' }, '&gt;'));
		nextMonth.onclick = function(e)
      {
         var node = Utilities_GetEventTarget(e);
         var dataElement = DateAndTimeChooser.GetDataElement(node);
			dataElement.setAttribute('currentMonthView', parseInt(dataElement.getAttribute('currentMonthView'))+1);
			return DateAndTimeChooser.handleDateChange(node);
		}
		month = DateAndTimeChooser.buildNode('span', { className: 'current-month', id: base_name + 'Month' },
         DateAndTimeChooser.GetDisplayedMonth.string(currentMonthView) + '&nbsp;');
		yearList = DateAndTimeChooser.buildSelectNode(DateAndTimeChooser.Years, currentYearView);
      yearList.name = base_name + 'YearList';
   	yearList.onchange = function(e)
      {
         var node = Utilities_GetEventTarget(e);
         var yearList = DateAndTimeChooser.GetYearListElement(node);
         var currentYearView = yearList.options[yearList.selectedIndex].value;
			dataElement.setAttribute('currentYearView', currentYearView);
			DateAndTimeChooser.handleDateChange(node);
		}

		months.appendChild(prevMonth);
		months.appendChild(month);
		months.appendChild(yearList);
		months.appendChild(nextMonth);
		
		var calendar = DateAndTimeChooser.buildNode('table', { id: base_name + 'DatePortion2' },
         DateAndTimeChooser.buildNode('thead', {}, 
            DateAndTimeChooser.buildNode('tr', { className: 'weekdays' }, DateAndTimeChooser.buildWeekdays())));
		var body = DateAndTimeChooser.buildNode('tbody', { id: base_name + 'Body' }, DateAndTimeChooser.buildCalendar(dataElement));
		
		calendar.appendChild(body);
      
		container.appendChild(enabler);
		container.appendChild(months);
		container.appendChild(calendar);

      // an ID must be unique on the page so we prefix the name
      var row = DateAndTimeChooser.buildNode('div', { id: base_name + 'Time', className: 'calendar_timerow' });

      if (availableDates.length > 0)
      {
         // use radio buttons inside the existing DIV

         // populate the times now that everything has been built
         DateAndTimeChooser.buildTimes(dataElement, row);
      }
      else
      {
         var hour = DateAndTimeChooser.GetHour(selectedDate);
         if (hour == 0)
            hour = 12;
   
         var hoursElement = DateAndTimeChooser.buildSelectNode(DateAndTimeChooser.Hours, hour);
         hoursElement.name = base_name + 'Hours';
         hoursElement.onchange = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            DateAndTimeChooser.handleTimeClick(node);
         }
         row.appendChild(hoursElement);
   
         var minutesElement = DateAndTimeChooser.buildSelectNode(DateAndTimeChooser.Minutes, DateAndTimeChooser.GetMinute(selectedDate));
         minutesElement.name = base_name + 'Minutes';
         minutesElement.onchange = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            DateAndTimeChooser.handleTimeClick(node);
         }
         row.appendChild(minutesElement);
   
         var ampmElement = DateAndTimeChooser.buildNode('select', { size: 1, name: base_name + 'AmPm' }, null);
         for (i = 0; i < DateAndTimeChooser.AmPm.length; i++)
         {
            if (DateAndTimeChooser.GetAmPm.integer(selectedDate) == i)
               ampmElement.appendChild(DateAndTimeChooser.buildNode('option', { value: i, selected: 1 }, DateAndTimeChooser.AmPm[i]));
            else
               ampmElement.appendChild(DateAndTimeChooser.buildNode('option', { value: i }, DateAndTimeChooser.AmPm[i]));
         }
         ampmElement.onchange = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            DateAndTimeChooser.handleTimeClick(node);
         }
         row.appendChild(ampmElement);
         var space = document.createElement('span');
         space.innerHTML = "&nbsp;&nbsp;";
         row.appendChild(space);
      }
      
      if (!showAlways)
      {
         var doneElement = DateAndTimeChooser.buildNode('span', { },
            DateAndTimeChooser.buildNode('a', { className: 'calendar_ok', href: 'javascript:void(0)' }, 'OK'));
         doneElement.onclick = function(e)
         {
            var node = Utilities_GetEventTarget(e);
            return DateAndTimeChooser.handleDoneClick(node);
         }
         row.appendChild(doneElement);
      }

      container.appendChild(row);
		
//		if (showAsPopUp)
//			document.body.appendChild(container);
//		else
      if (showAlways)
         Utilities_InsertBeforeNode(dataElement.parentNode, container, displayElement);
      else
         Utilities_InsertAfterNode(dataElement.parentNode, container, displayElement);
		
		displayElement.innerHTML = selectedDate.ToFormat(displayFormat);
      if (displayElement.innerHTML.isEmpty() && !showAlways)
         displayElement.innerHTML = DateAndTimeChooser.None;   // give the user something to click on
      
      if (showAlways)
         DateAndTimeChooser.open(container);
      
      // I added this so that when a non-nullable control does not yet have a value and the form is submitted
      // without changing the control we get the displayed value sent in the form instead of NULL
      DateAndTimeChooser.updateDataElement(dataElement);
      
      // this handles a case where there is a start and end time paired together
      if (Class_HasByElement(dataElement, 'event_start_ctrl'))
         DateAndTimeChooser._InitStartEndTimeElements(dataElement);
   },
   
   _StartTimeHasChanged: function (e)
   {
      let startElem = e.target;
      let oldStart = DateAndTime_FromString(startElem.getAttribute('OriginalStart'));
      var newStart = DateAndTime_FromElement(startElem);
      if (oldStart.Compare(newStart) == 0)
         return;  // no change in date/time
      
      let endElem = Utilities_GetElementByName(Utilities_ReplaceInString(startElem.name, 'Start', 'End'));
      assert(endElem != null);
      
      var diff = oldStart.Subtract(newStart);
      var oldEnd = DateAndTime_FromElement(endElem);
      var newEnd = oldEnd.Subtract(diff);
      newEnd.ToElement(endElem);
      
      DateAndTimeChooser.DataElementHasChanged(endElem);
      
      // ready for next change
      startElem.setAttribute('OriginalStart', newStart.toString());
   },
   
   _InitStartEndTimeElements: function (startElem)
   {
      startElem.setAttribute('OriginalStart', DateAndTime_FromElement(startElem).toString());
      startElem.onchange = DateAndTimeChooser._StartTimeHasChanged;
   }
}

DocumentLoad.AddCallback(DateAndTimeChooser.Init);
