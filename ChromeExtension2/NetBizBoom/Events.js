function ConferenceType_onchange(prefix)
{
   var type = Utilities_GetElementByName(prefix + 'ConferenceType');
   var url = Utilities_GetElementByName(prefix + 'ConferenceURL');
   var fbGroup = Utilities_GetElementByName(prefix + 'FbGroupID');
   var fbPage = Utilities_GetElementByName(prefix + 'FbPageID');
   var webinar = Utilities_GetElementByName(prefix + 'WebinarID');
   var ins = Utilities_GetElementById(prefix + 'ConferenceTypeInstructions');
   
   url.value = '';
   url.required = false;
//   fbGroup.value = '_NULL_';
   fbGroup.required = false;
//   fbPage.value = '_NULL_';
   fbPage.required = false;
//   webinar.value = '_NULL_';
   webinar.required = false;
   Visibility_Hide(url);
   Visibility_Hide(fbGroup);
   Visibility_Hide(fbPage);
   Visibility_Hide(webinar);
   Visibility_Hide(ins);
   
   switch (type.options [type.selectedIndex].value)
   {
      case '_NULL_':
         break;
      case 'Call':
         url.value = Utilities_GetElementByName(prefix + 'ConferenceUrlCall').value;
         url.type = 'tel';
         url.placeholder = '+1-555-555-5555,123';
         url.required = true;
         Utilities_SetNodeText(ins, Str('Enter the telephone number for the call (use a comma before an extension or access code), and it will automatically be sent to invitees.'));
         Visibility_Show(url);
         Visibility_Show(ins);
         break;
      case 'Skype':
         url.value = Utilities_GetElementByName(prefix + 'ConferenceUrlSkype').value;
         url.type = 'text';
         url.placeholder = '';
         url.required = true;
         Utilities_SetNodeText(ins, Str('Enter the Skype username for the call, and it will automatically be sent to invitees.'));
         Visibility_Show(ins);
         Visibility_Show(url);
         break;
      case 'Google':
         url.value = Utilities_GetElementByName(prefix + 'ConferenceUrlGoogle').value;
         url.type = 'url';
         url.placeholder = 'http://hangouts.google.com/start';
         url.required = true;
         Utilities_SetNodeText(ins, Str('Invitees will automatically receive details for joining the meeting. This event will be added to your default Google conferencing calendar.'));
         Visibility_Show(ins);
         break;
      case 'Zoom':
         url.value = Utilities_GetElementByName(prefix + 'ConferenceUrlZoom').value;
         url.type = 'url';
         url.placeholder = 'http://zoom.us/';
         url.required = true;
         Utilities_SetNodeText(ins, Str('Invitees will automatically receive details for joining the meeting. This event will be added to your default Zoom conferencing calendar.'));
         Visibility_Show(ins);
         break;
      case 'GoToMeeting':
         url.value = Utilities_GetElementByName(prefix + 'ConferenceUrlGoToMeeting').value;
         url.type = 'url';
         url.placeholder = 'https://global.gotomeeting.com/';
         url.required = true;
         Utilities_SetNodeText(ins, Str('Invitees will automatically receive details for joining the meeting. This event will be added to your default GoToMeeting conferencing calendar.'));
         Visibility_Show(ins);
         break;
      case 'FbGroup':
//         fbGroup.value = '$fbGroupID';
         fbGroup.required = true;
         Utilities_SetNodeText(ins, Str('This is a scheduled live event, and invitees will automatically receive a link to the group selected below.'));
         Visibility_Show(ins);
         Visibility_Show(fbGroup);
         break;
      case 'FbPage':
//         fbPage.value = '$fbPageID';
         fbPage.required = true;
         Utilities_SetNodeText(ins, Str('This is a scheduled live event, and invitees will automatically receive a link to the page selected below.'));
         Visibility_Show(ins);
         Visibility_Show(fbPage);
         break;
      case 'Other':
         url.value = Utilities_GetElementByName(prefix + 'ConferenceUrlOther').value;
         url.type = 'url';
         url.placeholder = 'http://something.com';
         url.required = true;
         Utilities_SetNodeText(ins, Str('Enter the URL to join the conference and it will automatically be sent to invitees.'));
         Visibility_Show(ins);
         Visibility_Show(url);
         break;
      case 'Webinar':
//         webinar.value = '$webinarID';
         webinar.required = true;
         Utilities_SetNodeText(ins, Str('This is a scheduled evergreen webinar, and invitees will automatically receive a link to it.'));
         Visibility_Show(ins);
         Visibility_Show(webinar);
         break;
      default:
         assert(0);
         break;
   }
}

function CalendarShowToday()
{
   var row = Utilities_GetElementById("CalendarToday");
   if (row == null)
   {
      ClearScrollPosition();

      // reset the page to 0 on the server
      var sect = Utilities_GetElementById('Filtering_DisplaySection');
      assert(sect != null);
      var key = "Session_" + sect.value + "_Page";
      var elem = Utilities_GetElementById(key);
      assert(elem != null);
      
      if (elem && elem.value != 0)
      {
         elem.value=0;
         RefreshForm();
      }
   }
   else
   {
      row.scrollIntoView();
      var docElem = document.documentElement;
      var scrollTop = (window.pageYOffset || docElem.scrollTop)  - (docElem.clientTop || 0);

      var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
      var oben = window.pageYOffset;
      if (scrollTop == 0 || iOS == true)
      {
         // DRL FIXIT! Remove jQuery!
         var container = $("html,body");
         var scrollTo =  $('tr td.calendar_today') ;
         container.animate({scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop(), scrollLeft: 0},300);
      }
      else
      {
         scrollTop -= MainLayout_HeaderHeight();
         document.documentElement.scrollTop = document.body.scrollTop = scrollTop;
      }
   }
}

function CreateCalendarHeaders(tableId, columns)
{
   if (!IsFilteringShown())
   {
      var sect = Utilities_GetElementById('Filtering_DisplaySection');
      assert(sect);
   
      var isTodayPage = true;
      var earliestDate = null;
      var latestDate = null;
      var paging = GetPagingCookie(sect.value);
      if (paging != null)
      {
         earliestDate = DateAndTime_FromString(paging['MinDate']);
         latestDate = DateAndTime_FromString(paging['MaxDate']);
         if (paging['CurPage'] == 0)
            isTodayPage = true;
      }
      else
      {
         // This should never happen as the server should always be providing the start/end dates
         earliestDate = DateAndTime_Now().Subtract(SecondsPerDay*30);
         latestDate = DateAndTime_Now().Add(SecondsPerDay*30);
      }
   
      CreateDateHeaders(tableId, columns, true, true, earliestDate, latestDate);
   
      // for iOS, scroll after the headers have been added and the page has adjusted sizing
      if (isTodayPage && !HasScrollPosition())
         setTimeout(function()
         {
            try
            {
               CalendarShowToday();
            }
            catch (e)
            {
               Log_WriteException(e);
            }
         }, 1000);
   }
   else
   {
      CreateDateHeaders(tableId, columns, true, false);
   }
}
