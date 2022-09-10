function RefreshFormWhenNullChanges(e)
{
   let elem = Utilities_GetEventTarget(e);
   let isNull = elem.value == '' ? 1 : 0;
   
   if (elem.hasAttribute('OriginalWasNull'))
   {
      if (elem.getAttribute('OriginalWasNull') != isNull)
         RefreshForm();
   }
   else
      elem.setAttribute('OriginalWasNull', isNull);
}

function MiscDropDownMenu(label, icon, actions)
{
   let div = document.createElement("DIV");
   div.className = "dropdown-menu right";
   
   let span = document.createElement("SPAN");
   span.tabIndex = "0";
   span.onclick = "return true";
   
   let img = document.createElement("IMG");
   img.className = "iconsmall";
   img.title = label;
   img.alt = label;
   img.src = icon;
   span.appendChild(img);
   
   let span2 = document.createElement("SPAN");
   span2.className = "optional";
   Utilities_SetInnerHtml(span2, " " + StrButton(label));
   span.appendChild(span2);
   
   div.appendChild(span);
   
   let div2 = document.createElement("DIV");
   div2.tabIndex = "0";
   div2.onclick = "return true";
   
   div.appendChild(div2);
   
   let ul = document.createElement("UL");
   
   let labels = Object.getOwnPropertyNames(actions);
   forEach(labels, function(label)
   {
      let icon = null;
      let action = actions[label];
      if (Array.isArray(action))
      {
         icon = action[1];
         action = action[0];
      }
      
      let li = document.createElement("LI");
      
      div2 = document.createElement("DIV");
      if (typeof action == 'string')
         div2.setAttribute('onclick', action);
      else
         div2.onclick = action;
      
      if (icon != null)
      {
         let img = document.createElement("IMG");
         img.className = "iconsmall";
         img.src = icon;
         div2.appendChild(img);
      }
      
      span2 = document.createElement("SPAN");
      Utilities_SetInnerHtml(span2, " " + label);
      div2.appendChild(span2);
      li.appendChild(div2);
      ul.appendChild(li);
   });
   
   div.appendChild(ul);
   
   return div;
}

function GetValueByLocale(value)
{
   let result = null;
   
   // choose matching language over generic language
   // let's skip over the empty values as they've likely not been provided/translated yet
   forEach(value['Value'], function(val, lang)
   {
      if (val != '' &&
         (lang == Strings_LanguageCode || (result == null && lang == Strings_GenericLanguageCode)))
      {
         result = val;
      }
   });
   
   if (result == null)
   {
      // pick any item
      // let's skip over the empty values as they've likely not been provided/translated yet
      forEach(value['Value'], function(val, lang)
      {
         if (val != '')
            result = val;
      });
   }
   
   return result;
}

function IsSupportedOnlineVideo(url)
{
   // DRL NOTE: This code must match exactly the PHP logic in GetVideoProviderFromUrl()
   if (url.includes('youtube.com') || url.includes('youtu.be') ||
      url.includes('vimeo.com') || url.includes('dailymotion.com') ||
      url.includes('wistia.') ||
      (url.includes('facebook.com') && (url.includes('/videos/') || url.includes('/?v='))) ||
      (url.includes('widencdn.net') && (url.includes('/video/') ||  url.endsWith('.mp4'))))
      return true;
   
   return false;
}

function Designer_ToggleEditing()
{
   EditTree.ToggleEditing();
   
   // hide/show the palette handle
   let elem = Utilities_GetElementById('divSnippetHandle');
   if (elem)
      Visibility_SetByElement(elem, EditTree.IsEditing());

   // show the palette when enabling editing, hide the palette when not editing
   // need a delay to allow the click to be handled before we show the palette otherwise it'll get closed again
   setTimeout(function()
   {
      let elem = Utilities_GetElementById('divSnippetList');
      if (elem && Class_HasByElement(elem, 'active') != EditTree.IsEditing())
         JsPlumb.TogglePanel();
   }, 100);
}

function CreateDateHeaderRow(rowEpoch, rowDay, today, time, rowLocalZone, columns, showNewLink)
{
   let dateStr = rowEpoch.toString();
   
   let row = document.createElement("TR");
   row.className = "table_section_header centered_table_header";

   let cel = document.createElement("TD");
   cel.colSpan = columns.toString();
   if (today == rowDay)
   {
      cel.id = "CalendarToday";
      cel.className = "section_title calendar_today";
   }
   else
      cel.className = "section_title";
   row.appendChild(cel);

   let format = '%a, %E %b %Y';
   if (today == rowDay)
      format += ' (' + StrLabel('Today') + ')';
   let span = document.createElement("SPAN");
   span.setAttribute("format", format);
   span.className = "DateAndTimePre";
   Utilities_SetInnerHtml(span, dateStr);
   cel.appendChild(span);

   if (showNewLink)
   {
      let div = document.createElement("DIV");
      div.classList.add("action_buttons");
      cel.appendChild(div);

      let actions = {};
      // we don't include the time in the date below because the form will calculate an appropriate one
      dateStr = DateAndTime_FromEpoch((rowDay * SecondsPerDay) + time, rowLocalZone).ToFormat(DateAndTime_ShortDateFormat);
      if (UserHasFeature(UserFeaturesEvents))
         actions[Str('Event')] = ['DisplayItemForm("EventEdit","Start","' + dateStr + '","large")', '/v2/Skins/CalendarEventDk.svg'];
      if (UserHasFeature(UserFeaturesTasks))
         actions[Str('Task')] = ['DisplayItemForm("TaskEdit","DueDate","' + dateStr + '","large")', '/v2/Skins/TaskDk.svg'];
      if (UserHasFeature(UserFeaturesSyncMessages))
      {
         if (UserHasFeature(UserFeaturesFacebookSync))
         {
            actions[Str('Facebook Page or Group Post')] = ['DisplayItemForm("PostEdit","Type","fb_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgFbPostDk.svg'];
            actions[Str('Facebook Feed Post')] = ['DisplayItemForm("PostEdit","Type","fbp_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgFbPostDk.svg'];
         }
         if (UserHasFeature(UserFeaturesInstagramSync))
            actions[Str('Instagram Post')] = ['DisplayItemForm("PostEdit","Type","ig_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgIgPostDk.svg'];
         if (UserHasFeature(UserFeaturesLinkedInSync))
            actions[Str('LinkedIn Post')] = ['DisplayItemForm("PostEdit","Type","li_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgLinkedInPostDk.svg'];
         if (UserHasFeature(UserFeaturesPinterestSync))
            actions[Str('Pinterest Pin')] = ['DisplayItemForm("PostEdit","Type","pint_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgPinterestPostDk.svg'];
         if (UserHasFeature(UserFeaturesTikTokSync))
            actions[Str('TikTok Post')] = ['DisplayItemForm("PostEdit","Type","tt_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgTikTokPostDk.svg'];
         if (UserHasFeature(UserFeaturesTwitterSync))
            actions[Str('Twitter Tweet')] = ['DisplayItemForm("PostEdit","Type","twit_post","Date","' + dateStr + '","large")', '/v2/Skins/MsgTwitterPostDk.svg'];
      }
      
      let div2 = MiscDropDownMenu('New', '/v2/Skins/NewDk.svg', actions);
      div.appendChild(div2);
   }

   return row;   
}

function CreateDateHeaders(tableId, columns, ascending, createIntermediate, earliestDate, latestDate)
{
   if (createIntermediate == null)
      createIntermediate = true;
   
   let table = Utilities_GetElementById(tableId);
   let rows = table.rows;
   let hasEvents = rows.length > 0;
   let lastDay = null;
   let lastEpoch = null;
   let now = DateAndTime_Now();
   let localZone = now.LocalTimeZoneOffset();
   let epoch = now.ToEpoch() /*+ localZone*/;
   let today = Math.floor(epoch / SecondsPerDay);
   // get the next hour rounded up, then add another hour for the suggested start time
   let time = (Math.ceil((epoch % SecondsPerDay) / SecondsPerHour) + 1) * SecondsPerHour;
   
   let firstEventDate = DateAndTime_Now();
   let lastEventDate = firstEventDate;
   let lastLocalZone = localZone;
   // minDays params only supported for ascending/EventsPage
   if (ascending)
   {
      if (hasEvents)
      {
         let i = 0;
         while (i < rows.length && !rows[i].hasAttribute("data-sortDate")) // skip rows with no date (section headers, etc.)
            i++;
         if (i < rows.length)
            firstEventDate = DateAndTime_FromString(rows[i].getAttribute("data-sortDate"));
         i = rows.length-1;
         while (i >= 0 && !rows[i].hasAttribute("data-sortDate"))          // skip rows with no date (section headers, etc.)
            i--;
         if (i >= 0)
            lastEventDate = DateAndTime_FromString(rows[i].getAttribute("data-sortDate"));
      }
//      console.log(["firstEventDate", firstEventDate]);
   }
   
   // ignore the time, not doing this sometimes caused the current day to be incorrectly identified
   firstEventDate.SetTime(null);
   lastEventDate.SetTime(null);

   for (let i = 0; i < rows.length; i++)
   {
      if (!rows[i].hasAttribute("data-sortDate"))  // skip rows with no date (section headers, etc.)
         continue;
      let sortDate = DateAndTime_FromString(rows[i].getAttribute("data-sortDate"));
      lastLocalZone = localZone;
      localZone = sortDate.LocalTimeZoneOffset();
      let epoch = sortDate.ToEpoch();
      if (sortDate.HasTime()) epoch += localZone;
      let curDay = Math.floor(epoch / SecondsPerDay);

      while (lastDay == null || (ascending && lastDay < curDay) || (!ascending && lastDay > curDay))
      {
         if (lastDay == null)
         {
            lastDay = curDay;
            lastEpoch = sortDate;
         }
         else
         {
            if (ascending)
            {
               lastDay++;
               lastEpoch = lastEpoch.Add(SecondsPerDay);
            }
            else
            {
               lastDay--;
               lastEpoch = lastEpoch.Subtract(SecondsPerDay);
            }
            
            if (!createIntermediate && ((ascending && lastDay < curDay) || (!ascending && lastDay > curDay)))
               continue;   // don't create a header if there are no rows for this day
         }
         let row = CreateDateHeaderRow(lastEpoch, lastDay, today, time, lastLocalZone, columns, ascending);

         rows[i].parentNode.insertBefore(row, rows[i]);
         i++;
      }
   }

   if (ascending)
   {
      if (earliestDate == null)
         earliestDate = firstEventDate;
      if (latestDate == null)
         latestDate = lastEventDate;
      
      let insertRow = function(row)
      {
         if (table.tBodies.length == 0)
            table.appendChild(document.createElement('tbody'));
         table.tBodies[0].appendChild(row);
      }
      
      if (hasEvents)
      {
         let row0 = rows[0];
         // there's a different insert method if there are actual rows already
         insertRow = function(row)
         {
            row0.parentNode.insertBefore(row, row0);
         }
      }
      // create date headers from earliestDate up to first event (or to latestDate if no events)
      let curDay = Math.floor(earliestDate.ToEpoch() / SecondsPerDay);
      let curDate = earliestDate;
      let targetDay = Math.floor(firstEventDate.ToEpoch() / SecondsPerDay);
      while (curDay < targetDay)
      {
         let row = CreateDateHeaderRow(curDate, curDay, today, time, lastLocalZone, columns, ascending);
         insertRow(row);
         curDay = curDay + 1;
         curDate = curDate.Add(SecondsPerDay);
      }
      // create date headers from last event up to latestDay (if there is no last event, then nothing to do)
      if (lastEventDate)
      {
         if (hasEvents)
         {
            let temp = lastEventDate.Add(SecondsPerDay);  // start the day after the last event
            curDay = Math.floor(temp.ToEpoch() / SecondsPerDay);
            curDate = temp;
         }
         targetDay = Math.floor(latestDate.ToEpoch() / SecondsPerDay);
         insertRow = function(row)
         {
            if (table.tBodies.length == 0)
               table.appendChild(document.createElement('tbody'));
            table.tBodies[0].appendChild(row);
         }
         while (curDay <= targetDay)
         {
            let row = CreateDateHeaderRow(curDate, curDay, today, time, lastLocalZone, columns, ascending);
            insertRow(row);
            curDay = curDay + 1;
            curDate = curDate.Add(SecondsPerDay);
         }
      }
   }
}

function Tree_GetVentureNode(elem)
{
   if (Class_HasByElement(elem, 'edittree_templated') || Class_HasByElement(elem, 'edittree_nottemplated'))
      return null;      // skip palette items
   
   // the resources use 'vent' as the prefix but tags use 'venture'
   while (elem && GetPrefix(elem.id) != 'vent' && GetPrefix(elem.id) != 'venture')
   {
      elem = EditTree.GetParentNode(elem);
   }
   return elem;
}

function Tree_GetVentureID(elem)
{
   let temp = Tree_GetVentureNode(elem);
   let ventureID = temp != null ? StripPrefix(temp.id) : null;
   if (ventureID == 0) ventureID = null;
   return ventureID;
}

function CompanyRep_TitleChanged(elem, prefix, compID)
{
   let isShown = Visibility_IsShownByElement(elem);
   Visibility_SetByClass('companyRep_' + compID + '_Items',
      isShown && elem.options[elem.selectedIndex].value != '_NULL_');
   // make rep number required if a title is chosen and visible
   Utilities_GetElementByName(prefix + '_' + compID + '_RepNumber').required =
      isShown && elem.options[elem.selectedIndex].value != '_NULL_';
   // make sponsor rep number required if a title is chosen and it's not employee
   Utilities_GetElementByName(prefix + '_' + compID + '_SponsorRepNumber').required =
      isShown &&
      elem.options[elem.selectedIndex].value != '_NULL_' &&
      elem.options[elem.selectedIndex].innerHTML != 'Employee';
}

function CompanyRep_AddCompany(elem, prefix)
{
   Visibility_ShowByClass('companyRep_' + elem.value);
   let title = Utilities_GetElementByName(prefix + '_' + elem.value + '_RepTitleID');
   if (title && title.value == '_NULL_')
      Visibility_HideByClass('companyRep_' + elem.value + '_Items');
   elem.remove(elem.selectedIndex);
}
