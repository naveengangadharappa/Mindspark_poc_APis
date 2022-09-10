var _IsFiltering = null;   // not yet set
var _LastSearch = null;
var _SaveScrollPosition = true;

function RemoveCookiesByPrefix(prefix)
{
   let len = prefix.length;
   let cookies = GetCookies();
   for(let _name in cookies)
   {
      if (_name.substring(0, len) == prefix)
         DeleteCookie(_name);
   }
}

function AddCookieSafe(name, value, expiry)
{
   SetCookie(name, value, expiry);
   
   // if the header is too big the HTTP request will fail so throw away some non-critical cookies
   
   // these should be ordered with most important last
   let cookiePrefixes = ['Paging_', 'Filtering_'];

   let size = GetCookieSize();
   let i = 0;
   while (size > 4000 && i < cookiePrefixes.length)
   {
      RemoveCookiesByPrefix(cookiePrefixes[i]);
      i++;

      SetCookie(name, value, expiry);
      size = GetCookieSize();
   }
}

function SaveScrollPosition()
{
   if (!_SaveScrollPosition)
      return;
   
   if (FormIsLeaving())
   {
      let name = 'PageScrollPos-' + FormGetViewOrProcessor();   // scroll position is saved for each view
   
      // if we are leaving a form (saving or cancelling) then we don't want to save any scroll
      // position since the form should reload at the top the next time it is loaded
      sessionStorage.removeItem(name);
      name = name + '-filtered';
      sessionStorage.removeItem(name);
      _SaveScrollPosition = false;  // don't save it again for this page
   }
   else
   {
      let name = 'PageScrollPos-' + FormGetViewOrProcessor();   // scroll position is saved for each view
      if (_IsFiltering)
         name = name + '-filtered';
   
      // DRL I had a hell of a time getting the scroll position on iOS. In the end this hack for
      // getting the position of the wrapper was the only way I found to do it.
      // DRL FIXIT? Should we be using "page-content" here now since we added the left side menu?
      let temp = Utilities_GetElementsByClass('content_wrapper');
      let x = 0;
      let y = 0;
      if (temp.length > 0)
      {
         x = -temp[0].getBoundingClientRect().left;
         y = -temp[0].getBoundingClientRect().top;
      }
      let docElem = document.documentElement;
      let scrollLeft = (window.pageXOffset || docElem.scrollLeft || document.body.scrollLeft || window.scrollX || x)  - (docElem.clientLeft || 0);
      let scrollTop = (window.pageYOffset || docElem.scrollTop || document.body.scrollTop || window.scrollY || y)  - (docElem.clientTop || 0);
      
      // DRL FIXIT? Sometimes this is negative, should we delete it in that case too? Is that a bug?
      if (scrollTop == 0 && scrollLeft == 0)
         sessionStorage.removeItem(name);  // no need to save the default, we're very limited on space too
      else
         sessionStorage.setItem(name, scrollLeft + ',' + scrollTop);
   }
}

// When you hide the search feature the page should scroll to the same position it was before the search
// feature was shown, and vice-versa. We store the scroll position for both no-search and with search in
// order to restore it in either case.
function RestoreScrollPosition()
{
   let name = 'PageScrollPos-' + FormGetViewOrProcessor();   // scroll position is saved for each view
   if (_IsFiltering)
      name = name + '-filtered';
   
   let scrollTop = sessionStorage.getItem(name);
   if (scrollTop != null && !window.location.hash) // dont't set scroll position if URL is targeting a tag
   {
      let scrollLeft = 0;
      if (scrollTop.indexOf(',') != -1)   // legacy support - we used to only store the top
      {
         scrollLeft = scrollTop.split(',')[0];
         scrollTop = scrollTop.split(',')[1];
      }
      setTimeout(function()
      {
         try
         {
            let temp = Utilities_GetElementsByClass('page-content ');
            if (temp.length > 0)
            {
               temp[0].scrollLeft = scrollLeft;
               temp[0].scrollTop = scrollTop;
            }
            else
            {
               document.documentElement.scrollLeft = document.body.scrollLeft = scrollLeft;
               document.documentElement.scrollTop = document.body.scrollTop = scrollTop;
            }
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 10);
   }
}

function ClearScrollPosition()
{
   let name = 'PageScrollPos-' + FormGetViewOrProcessor();   // scroll position is saved for each view
   if (_IsFiltering)
      name = name + '-filtered';
   
   sessionStorage.removeItem(name);
   _SaveScrollPosition = false;  // don't save it again for this page
}

function HasScrollPosition()
{
   let name = 'PageScrollPos-' + FormGetViewOrProcessor();   // scroll position is saved for each view
   if (_IsFiltering)
      name = name + '-filtered';
   
   return sessionStorage.getItem(name) != null;
}

function SaveSelections()
{
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect == null)
   {
//      assert(Utilities_GetElementsByClass("select_table").length == 0);
//      assert(Utilities_GetElementsByClass("edittree").length == 0);
      return;
   }
   let name = 'PageSelections-' + sect.value;   // selections are saved for each display section
   
// DRL Changed to save the selections even when leaving a page...
//   if (FormIsLeaving())
//   {
//      // if we are leaving a form (saving or cancelling) then we don't want to save any selections
//      sessionStorage.removeItem(name);
//   }
//   else
   {
      let selections = [];
      
      if (AllRowsSelected())
      {
         selections[0] = 'ALL_ROWS';
      }
      else
      {
         // we start with the selections that were saved because they contain selections from all pages
         selections = sessionStorage.getItem(name);
         if (selections != null)
            selections = Json_FromString(selections);
         else
            selections = [];
   
         forEach(Utilities_GetElementsByClass("select_table"), function(table)
         {
            // remove all the IDs that are on this page (leaving the IDs from other pages intact)
            Utilities_RemoveFromArray(selections, SelectTable.GetIds(table));
            // add the selected IDs that are on this page
            Utilities_MergeIntoArray(selections, SelectTable.GetSelectedIds(table));
         });
      
         forEach(Utilities_GetElementsByClass("edittree"), function(tree)
         {
            // remove all the IDs that are on this page (leaving the IDs from other pages intact)
            Utilities_RemoveFromArray(selections, EditTree.GetIds(tree));
            // add the selected IDs that are on this page
            Utilities_MergeIntoArray(selections, EditTree.GetSelectedIds(tree));
         });
      }
      
      if (selections.length == 0)
         sessionStorage.removeItem(name);  // no need to save the default, we're very limited on space too
      else
      {
         selections = Json_ToString(selections);
         sessionStorage.setItem(name, selections);
      }
   }
}

function GetSelections()
{
   let name = null;
   let paging = null;
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect)
   {
      name = 'PageSelections-' + sect.value;   // selections are saved for each display section
      paging = GetPagingCookie(sect.value);
   }
   
   let serverFiltering = paging && paging['ServerFiltering'];
   
   let selections = [];
   
   if (AllRowsSelected())
   {
      assert(!serverFiltering);
   }
   else
   {
      // with server filtering we start with the selections that were saved because they contain selections from all pages

      selections = serverFiltering ? sessionStorage.getItem(name) : null;
      if (selections != null)
         selections = Json_FromString(selections);
      else
         selections = [];
   }

   forEach(Utilities_GetElementsByClass("select_table"), function(table)
   {
      if (serverFiltering)
      {
         // remove all the IDs that are on this page (leaving the IDs from other pages intact)
         Utilities_RemoveFromArray(selections, SelectTable.GetIds(table));
         // add the selected IDs that are on this page
         Utilities_MergeIntoArray(selections, SelectTable.GetSelectedIds(table));
      }
      else
      {
         // if we are using client side filtering remove the filtered items
         let temp = Utilities_UnionArrays(SelectTable.GetSelectedIds(table), FilterTable.GetFilteredIds(table));
         // add the selected IDs that are in this table
         Utilities_MergeIntoArray(selections, temp);
      }
   });
   
   forEach(Utilities_GetElementsByClass("edittree"), function(tree)
   {
      if (serverFiltering)
      {
         // remove all the IDs that are on this page (leaving the IDs from other pages intact)
         Utilities_RemoveFromArray(selections, EditTree.GetIds(tree));
         // add the selected IDs that are on this page
         Utilities_MergeIntoArray(selections, EditTree.GetSelectedIds(tree));
      }
      else
      {
         // if we are using client side filtering remove the filtered items
         let temp = Utilities_UnionArrays(EditTree.GetSelectedIds(tree), EditTree.GetFilteredIds(tree));
         // add the selected IDs that are in this table
         Utilities_MergeIntoArray(selections, temp);
      }
   });
   
   return selections;
}

function RestoreSelections()
{
   DeselectAllRows();
   
   forEach(Utilities_GetElementsByClass("select_table"), function(table)
   {
      SelectTable.UnselectIds(SelectTable.GetSelectedIds(table), table);
   });
   
   forEach(Utilities_GetElementsByClass("edittree"), function(tree)
   {
      EditTree.UnselectIds(EditTree.GetSelectedIds(tree), tree);
   });
   
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect == null)
   {
//      assert(Utilities_GetElementsByClass("select_table").length == 0);
//      assert(Utilities_GetElementsByClass("edittree").length == 0);
      return;
   }
   let name = 'PageSelections-' + sect.value;   // selections are saved for each display section
   
   // we first check if the server sent a cookie as this is used by the training code to select
   // the current lesson when it has changed
   let selections = GetCookie(name);
   if (selections != null)
   {
      // it's a one-time-use cookie from the server to the client, used to set selections in Trainings::HandleLessonForm()
      DeleteCookie(name);
      sessionStorage.setItem(name, selections);
   }
   else
      selections = sessionStorage.getItem(name);

   if (selections != null)
   {
      selections = Json_FromString(selections);

      if (selections.length == 1 && selections[0] == 'ALL_ROWS')
      {
         SelectAllRows();
      }
      else
      {
         forEach(Utilities_GetElementsByClass("select_table"), function(table)
         {
            SelectTable.SelectIds(selections, table);
         });
   
         forEach(Utilities_GetElementsByClass("edittree"), function(tree)
         {
            EditTree.SelectIds(selections, tree);
         });
      }
   }
}

function ClearSelections()
{
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect == null)
   {
      DeselectAllRows();

      forEach(Utilities_GetElementsByClass("select_table"), function(table)
      {
         SelectTable.UnselectIds(SelectTable.GetSelectedIds(table), table);
      });
   
      forEach(Utilities_GetElementsByClass("edittree"), function(tree)
      {
         EditTree.UnselectIds(EditTree.GetSelectedIds(tree), tree);
      });

      return;
   }
   let name = 'PageSelections-' + sect.value;   // selections are saved for each display section
   
   sessionStorage.removeItem(name);  // no need to save the default, we're very limited on space too
   
   RestoreSelections();
}

function SelectAll()
{
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect == null)
   {
      SelectAllRows();
      return;
   }
   let name = 'PageSelections-' + sect.value;   // selections are saved for each display section
   
   sessionStorage.setItem(name, '["ALL_ROWS"]');
   
   RestoreSelections();
}

// returns null if not found
function GetPagingCookie(name)
{
   let paging = GetCookie('Paging_' + name);
   if (paging)
      paging = Json_FromString(paging);
   
   return paging;
}

function SetPagingCookie(name, paging)
{
   paging = Json_ToString(paging);
   AddCookieSafe('Paging_' + name, paging, SecondsPerDay);
}

// returns new empty item if not found
function GetFilteringCookie(name)
{
   let filtering = GetCookie('Filtering_' + name);
   if (filtering)
      filtering = Json_FromString(filtering);
   
   if (filtering == null ||
      filtering == 0 ||    // DRL FIXIT? I don't know why I saw this one time?
      // convert from some old versions of this class
      filtering['SearchClasses'] instanceof Array ||
      !('FilteringShown' in filtering))
   {
      let alwaysShowFiltering = name.startsWith('Home_MyBusiness_Contacts') ||
         name.startsWith('Home_MyBusiness_Tasks') ||
         name.startsWith('Home_MyBusiness_Messages') ||
         name.startsWith('Home_MyBusiness_UniConvos');
      
      filtering = {
         'FilteringShown': alwaysShowFiltering,
         'SearchFilterID': null,
         'SearchText': '',
         'SearchClasses': {}
      };
   }
   
   return filtering;
}

function SetFilteringCookie(name, filtering)
{
   name = 'Filtering_' + name;
   if (!filtering['FilteringShown'] && !filtering['SearchText'] && Utilities_HashEquals(filtering['SearchClasses'], {}))
      DeleteCookie(name);  // no need to save the default, we're very limited on space too
   else
   {
      filtering = Json_ToString(filtering);
      assert(filtering != '0' && filtering != '"0"'); // DRL FIXIT? I saw this above one time so I'm checking here when it occurs.
      AddCookieSafe(name, filtering, SecondsPerDay);
   }
}

function IsFilteringShown()
{
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   assert(sect != null);
   let filtering = GetFilteringCookie(sect.value);
   
   return filtering['FilteringShown'];
}

function ShowFiltering(show)
{
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   assert(sect != null);
   let displaySection = sect.value;
   let paging = GetPagingCookie(displaySection);
   let filtering = GetFilteringCookie(displaySection);

   filtering['FilteringShown'] = show;
   SetFilteringCookie(displaySection, filtering);
   
   let image = Utilities_GetElementById("toggle_filter_image");
   if (image)
      image.src = show ? '/v2/Skins/SearchLtOff.svg' : '/v2/Skins/SearchLtOn.svg';
   
   // save the scroll position when we switch between filtering and non-filtering
   let changedFilterMode = false;
   if (show)
   {
      // filtering will be on
      if (_IsFiltering === null || _IsFiltering === false)
      {
         if (_IsFiltering !== null)  // don't save on initial page load
         {
            SaveScrollPosition();
            changedFilterMode = true;
         }
         _IsFiltering = true;
         RestoreScrollPosition();
      }
   }
   else
   {
      // filtering will be off
      if (_IsFiltering === null || _IsFiltering === true)
      {
         if (_IsFiltering !== null)  // don't save on initial page load
         {
            SaveScrollPosition();
            changedFilterMode = true;
         }
         _IsFiltering = false;
         RestoreScrollPosition();
      }
   }
   
   if (!changedFilterMode)
      return;
   
   // check if we are using server side filtering
   if (paging && paging['ServerFiltering'])
   {
      // don't save the scroll position because it will be for the mode we're moving to and since we haven't
      // loaded the new data the scroll position will be off
      _SaveScrollPosition = false;
      RefreshForm();
   }
   else
   {
      let inlineFilter = Utilities_GetElementById("content_inline_filter");
      if (inlineFilter)
      {
         Visibility_SetByElement(inlineFilter, show);
         MainLayout_UpdateFilterDisplay(false);
         if (show)
            SearchChanged();
         else
            ExecuteSearch(null, '', {});
      }
   }
}

function UpdateSelectionText()
{
	let rowCount = 0;
	let selectedIds = AllRowsSelected() ? [] : GetSelections();
	let filteredIds = [];

   forEach(Utilities_GetElementsByClass("select_table"), function(table)
   {
      rowCount += SelectTable.GetRows(table).length;  // DRL FIXIT? Optimize?
      Utilities_MergeIntoArray(filteredIds, FilterTable.GetFilteredIds(table));
   });

   let nodeCount = 0;
	forEach(Utilities_GetElementsByClass("edittree"), function(tree)
	{
      Utilities_MergeIntoArray(filteredIds, EditTree.GetFilteredIds(tree));
      nodeCount += EditTree.GetIds(tree).length;
	});
   
	let elem = Utilities_GetElementById('selection_text');
   if (elem)
   {
      let selected = selectedIds.length;
      let matching = filteredIds.length;
      let shown = filteredIds.length;
      let total = rowCount + nodeCount;
   
      let paging = null;
      let filtering = null;
      let sect = Utilities_GetElementById('Filtering_DisplaySection');
      if (sect)
      {
         paging = GetPagingCookie(sect.value);
         filtering = GetFilteringCookie(sect.value);
      }
   
      // check if we are using server side filtering
      if (paging && paging['ServerFiltering'])
      {
         shown = total;
         matching = paging['MatchingRows'];
   
         if (filtering == null || (filtering['SearchText'] == '' && Utilities_HashEquals(filtering['SearchClasses'], {})))
            total = matching;
         else
            total = -1;
      }
      
      let temp = '';
      if (shown < matching)
         temp += ', ' + shown + ' ' + Str('shown');
      if (matching < total || (matching >= 0 && total == -1))
         temp += ', ' + matching + ' ' + Str('matching');
      if (total >= 0)
         temp += ', ' + total + ' ' + Str('total');
      if (AllRowsSelected())
         temp += ', all ' + matching + ' ' + Str('selected');
      else
      {
         if (paging && paging['MatchingRows'] > paging['PageSize'])
            temp += ', ' + selected + ' ' + Str('selected on this page');
         else if (selected > 0)
            temp += ', ' + selected + ' ' + Str('selected');
      }
      temp = temp.substr(2);
   
      Utilities_SetInnerHtml(elem, temp);
      // this just takes up space for universal conversations page
      Visibility_SetByElement(elem, temp != '' && (sect == null || !sect.value.startsWith('Home_MyBusiness_UniConvos')));
   }
   
   // update the menu options
   
   EnableDisable_DisableByClass('type_controlled');
	EnableDisable_DisableByClass('none_selected');
	EnableDisable_DisableByClass('single_selected');
	EnableDisable_DisableByClass('multiple_selected');
	Visibility_HideByClass('none_selected_visibility');
	Visibility_HideByClass('single_selected_visibility');
	Visibility_HideByClass('multiple_selected_visibility');
	if (selectedIds.length == 0 && !AllRowsSelected())
   {
		EnableDisable_EnableByClass('none_selected');
		Visibility_ShowByClass('none_selected_visibility');
   }
	else if (selectedIds.length == 1)
   {
		EnableDisable_EnableByClass('single_selected');
		Visibility_ShowByClass('single_selected_visibility');
   }
	else
   {
		EnableDisable_EnableByClass('multiple_selected');
		Visibility_ShowByClass('multiple_selected_visibility');
   }
   
   let selectedTypes = [];
   let typeControlledMenus = Utilities_GetElementsByClass('type_controlled');
   if (typeControlledMenus.length > 0)
   {
      forEach(selectedIds, function(selectedId)
      {
         let row = Utilities_GetElementById(selectedId);
         if ('type' in row.dataset)
         {
            if (!Utilities_ArrayContains(selectedTypes, row.dataset.type))
               selectedTypes.push(row.dataset.type);
         }
      });
   
      forEach(typeControlledMenus, function(menu)
      {
         let found = false;
         forEach(selectedTypes, function(type)
         {
            if (Class_HasByElement(menu, 'type_' + type))
               found = true;
         });
         if (!found)
            EnableDisable_DisableByElement(menu);
      });
   }
}

function ExecuteSearch(searchFilterID, searchText, searchClasses)
{
   let paging = null;
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect)
      paging = GetPagingCookie(sect.value);
   
   let changedCriteria = _LastSearch != null &&
      (!_LastSearch.hasOwnProperty('SearchFilterID') || _LastSearch['SearchFilterID'] != searchFilterID ||
         _LastSearch['SearchText'] != searchText ||
         !Utilities_HashEquals(_LastSearch['SearchClasses'], searchClasses, true));
   
   _LastSearch = {
      'SearchFilterID': searchFilterID,
      'SearchText': searchText,
      'SearchClasses': searchClasses
   };
   
   // DRL FIXIT! Our paging cookie times out after 1 day so there may not be any paging set even
   // though we were using server side filtering!
   // check if we are using server side filtering
   if (paging && paging['ServerFiltering'])
   {
      if (changedCriteria)
      {
         UpdatePageRows();
      }
      return;
   }
   
   assert(searchFilterID == null);  // not supported for client side filtering
   
   let elem = Utilities_GetElementById('selection_text');
   if (elem)
      Utilities_SetInnerHtml(elem, Str('Working...'));

   // our classes below require the filtering to be in arrays and not in hashes (what the server expects)
   // so we do the conversion here
   let searchClasses2 = [];
   forEach(searchClasses, function(searchClass)
   {
      forEach(searchClass, function(item)
      {
         searchClasses2.push(item);
      });
   });
   
   let table = Utilities_GetElementById('content_table');
   if (table != null)
   {
      FilterTable.SetFilter(table, searchText, searchClasses2);
   }
   else
   {
      EditTree.Filter(searchText, searchClasses2);
   }
}

function Filtering_ChangeToPage(key, page)
{
   // there could be paging at the top and the bottom of the data and each would have an INPUT element
   let elems = Utilities_GetElementsBySelector('INPUT[name="' + key + '"]');
   for (let elem of elems)
   {
      elem.value = page;
   }
   
   UpdatePageRows();
}

function UpdatePageRows()
{
   let sect = Utilities_GetElementById('Filtering_DisplaySection');

   // some pages have been converted to use this more efficient means of filtering results:
   if (sect && !HasFormChanged() && (
      sect.value.startsWith('Home_MyBusiness_Contacts') ||
      sect.value.startsWith('Home_MyBusiness_Tasks') ||
      sect.value.startsWith('Home_MyBusiness_Messages') ||
      sect.value.startsWith('Home_MyBusiness_UniConvos')))
   {
      if (typeof BusyIndicatorStart === "function")
         BusyIndicatorStart(Str('Searching...'));
      
      let form = Utilities_GetElementById('main_form');
      let url = Form_RootUri + '/v2/' + sect.value.split('_')[2] + '/View';
      let params = null;
      if (Utilities_GetElementById('SearchFilterID'))
      {
         // convert "Home_MyBusiness_Contacts_USR_500" to "Home,MyBusiness,Contacts"
         let view = Utilities_ReplaceInString(sect.value.substr(0, sect.value.indexOf('_USR_')), '_', ',');
         let pageKey = 'Session_' + sect.value + '_Page';
         let pageElem = Utilities_GetElementByName(pageKey);
         params = {
            'View': view,
            'DisplaySection': sect.value,
            [pageKey]: pageElem ? pageElem.value : 0,
            'SearchFilterID': Utilities_GetElementById('SearchFilterID').value,
            'SearchText': Utilities_GetElementById('search_text').value
         };
      }
      else
         params = Form_GetValues(form);
      ajax.get(url, params, function(data, httpCode, headers)
      {
         if (httpCode != 200)
         {
            // server unavailable, network error, etc.
            Log_WriteError('Server is not available to get form "' + sect.value + '": ' + httpCode);
            DisplayMessage(Str('There was a problem contacting the server.'), 'error');
            
            if (typeof BusyIndicatorStop === "function")
               BusyIndicatorStop();
            return;
         }
         
         if (typeof BusyIndicatorStart === "function")
            BusyIndicatorStart(Str('Loading...'));
         
         data = Utilities_CreateHtmlNode(data);
         
         let form = Utilities_GetElementById('main_form');
         
         // skip over everything that's an INPUT
         let elem = form.firstElementChild;
         while (elem && elem.nodeName == 'INPUT')
            elem = elem.nextElementSibling;
         
         // everything else will be replaced, so remove it
         while (elem)
         {
            let temp = elem;
            elem = elem.nextElementSibling;
            temp.parentElement.removeChild(temp);
         }
         
         // insert the new items which could contain any of the paging, table and script
         let children = [...data.children];  // make a copy otherwise we'll end up with an empty array below
         form.appendChild(data);
         
         // the elements created above need to be initialized
         DocumentLoad.InitChunk(children);
   
         // This is for the UniConvos display which requires setting up the two columns after loading.
         MainLayout_UpdateFilterDisplay(false);
         
         if (typeof BusyIndicatorStop === "function")
            BusyIndicatorStop();
      });
   }
   else
      RefreshForm();
}

function SearchChanged()
{
//   assert(IsFilteringShown()); this would assert in the case of toolbar filtering
   
   let filterElem = Utilities_GetElementById('SearchFilterID');
   let searchFilterID = filterElem != null ? filterElem.value : null;
   
   if (searchFilterID == -1)
   {
      // the user wants to edit the filters
      
      let selectedFilterID = null;  // DRL FIXIT? would be good to keep the selected item before the user decided to edit
   
      let sect = Utilities_GetElementById('Filtering_DisplaySection');
      assert(sect != null);
      let category = sect.value.split('_')[2]; // get "Contacts" from "Home_MyBusiness_Contacts_USR_500"
      
      DisplayItemForm('SearchFiltersEdit', 'Category', category, 'SearchFilterID', selectedFilterID);
      return;
   }
   
   let searchElem = Utilities_GetElementById('search_text');
   let searchText = searchElem != null ? searchElem.value : '';
   
   // each checked checkbox or selected option is placed in a sub-array
   // along with all its siblings so they are ORed together, whereas the
   // sibling sub-arrays are ANDed together
   
   let searchClasses = {};
   
   let sections = Utilities_GetElementsByClass('filter_section');
   forEach(sections, function(section)
   {
      let sectionId = section.id;
      let elems = Utilities_GetElementsByClass('search_selector', null, section);
      forEach(elems, function(elem)
      {
         if (elem.tagName == 'INPUT' && elem.type == 'checkbox')
         {
            if (elem.checked)
            {
               if (!(sectionId in searchClasses))
                  searchClasses[sectionId] = [];
               searchClasses[sectionId].push(elem.value);
            }
         }
         else if (elem.tagName == 'SELECT')
         {
            for (let j = 0; j < elem.options.length; j++)
            {
               if (elem.options[j].selected)
               {
                  if (!(sectionId in searchClasses))
                     searchClasses[sectionId] = [];
                  searchClasses[sectionId].push(elem.options[j].value);
               }
            }
         }
         else
         {
            alert('Unsupported search "input" type: ' + elem.type);
         }
      });
   });
   
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect)
   {
      let displaySection = sect.value;
      let filtering = GetFilteringCookie(displaySection);
      filtering['SearchFilterID'] = searchFilterID;
      filtering['SearchText'] = searchText;
      filtering['SearchClasses'] = searchClasses;
      SetFilteringCookie(displaySection, filtering);
   }
   
   ExecuteSearch(searchFilterID, searchText, searchClasses);
}

function SearchKeyPress(e)
{
   let evt = e || window.event;   // look for window.event in case event isn't passed in
   let keyCode = evt.keyCode ? evt.keyCode : evt.which;
   
   if (keyCode == 13)
   {
      SearchChanged();
   }
}

function InitFiltering()
{
   let table = Utilities_GetElementById('content_table');
   let tree = Utilities_GetElementsByClass('edittree', "DIV", document.body);
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect && (table != null || tree.length > 0))
   {
      let filtering = GetFilteringCookie(sect.value);
      
      ShowFiltering(filtering['FilteringShown']);
      
      if (filtering['FilteringShown'])
      {
         if (filtering['SearchText'])
         {
            let text = document.getElementById("search_text");
            if (text) text.value = filtering['SearchText'];
         }
   
         forEach(filtering['SearchClasses'], function(section_values, sectionId)
         {
            let section = Utilities_GetElementById(sectionId);
            if (section)
            {
               let elems = Utilities_GetElementsByClass('search_selector', null, section);
               forEach(elems, function(elem)
               {
                  forEach(section_values, function(value)
                  {
                     let found = false;
                     if (elem.tagName == 'INPUT' && elem.type == 'checkbox')
                     {
                        if (elem.value == value)
                        {
                           elem.checked = true;
                           found = true;
                        }
                     }
                     else if (elem.tagName == 'SELECT')
                     {
                        for (let j = 0; j < elem.options.length; j++)
                        {
                           if (elem.options[j].value == value)
                           {
                              if (Class_HasByElement(elem, 'MultiSelect'))
                                 MultiSelect.OnSelectItem(elem, j, false);   // don't fire changed event on init
                              else
                                 elem.options[j].selected = true;
                              found = true;
                           }
                        }
                     }
                     else
                     {
                        alert('Unsupported search "input" type: ' + elem.type);
                     }
                     if (found)
                     {
                        // if we enabled an item for a section make sure that we enable the toolbar containing
                        // that section if it is in fact on a toolbar (instead of inline)
                        let href = '#' + sectionId;
                        let anchorLinks = Utilities_GetElementsByTag('a', Utilities_GetElementById('filter_anchors'));
                        forEach(anchorLinks, function (link)
                        {
                           let thisHref = link.getAttribute('href');
                           if (thisHref == href)
                           {
                              Class_SetByElement(link, 'active', true);
                           }
                        });
                     }
                  });
               });
            }
         });
   
         SearchChanged();
      }
      
      let inlineFilter = Utilities_GetElementById("content_inline_filter");
      if (inlineFilter)
      {
         // if there is an inline filter section, display the toggle button in the toolbar
         // and add a click handler for the toggle
         let toggle = Utilities_GetElementById("toggle_inline_filter");
         if (toggle != null)
         {
//            Visibility_ShowByElement(toggle);
            Utilities_AddEvent(toggle, "click", function(e)
            {
               ShowFiltering(!Visibility_IsShownByElement(inlineFilter));
            });
         }
      
         Visibility_SetByElement(inlineFilter, filtering['FilteringShown']);
         MainLayout_UpdateFilterDisplay(false);
      }
   }
}

function ClearFiltering()
{
   let text = document.getElementById("search_text");
   if (text) text.value = "";

   let elems = Utilities_GetElementsByClass('search_selector');
   forEach(elems, function(elem)
   {
      if (elem.tagName == 'INPUT' && elem.type == 'checkbox')
      {
         checkbox.checked = false;
      }
      else if (elem.tagName == 'SELECT')
      {
         if (Class_HasByElement(elem, 'MultiSelect'))
         {
            MultiSelect.ClearSelections(elem);
         }
         else
         {
            for (let j = 0; j < elem.options.length; j++)
            {
               elem.options[j].selected = false;
            }
         }
      }
   });
}

function DisplaySelectedItemsForm(form, itemsName, itemName1, itemValue1, itemName2, itemValue2)
{
   if (Form_MainUri == null)
   {
      DisplayErrorMessage("Your page failed to initialize Form_MainUri.");
   }
   if (Form_ThisUri == null)
   {
      DisplayErrorMessage("Your page failed to initialize Form_ThisUri.");
   }
   
   let url = Form_MainUri + "?FormProcessor=" + form;
   if (itemName1 != null)
      url += "&" + itemName1 + "=" + encodeURIComponent(itemValue1);
   if (itemName2 != null)
      url += "&" + itemName2 + "=" + encodeURIComponent(itemValue2);
   
   // the form will likely require the display section for filtering purposes
   let paging = null;
   let sect = Utilities_GetElementById('Filtering_DisplaySection');
   if (sect)
   {
      paging = GetPagingCookie(sect.value);

      url += "&DisplaySection=" + sect.value;
   }
   
   // provide the information about the selected items
   let selections = null
   if (paging && paging['ServerFiltering'] && AllRowsSelected())
      selections = '_ALL_';   // let server pick the selected rows from all pages
   else
   {
      selections = GetSelections();
      StripPrefixes(selections);
      selections = selections.join(",");
   }
   
   url += "&" + itemsName + "=" + encodeURIComponent(selections);
   
   if (itemName1 != "ReferralUrl" && "ReferralUrl" != null)
      url += "&ReferralUrl=" + encodeURIComponent(Form_ThisUri);
   
   SubmitForm(url);
}

/*
function DisplaySelectedItemsWebPage(url, replace, size)
{
   if (size == null) size = 'narrow';
   let table = Utilities_GetElementById("content_table");
   let selectedIds = SelectTable.GetSelectedIds(table);
   StripPrefixes(selectedIds);
   url = url.replace(replace, encodeURIComponent(selectedIds.join(",")));
   DisplayWebPage(url, size);
}
*/

if (!Browser.IsExtension())
{
   // restore scroll position when filtering changes
   FilterTable.AddCallback(RestoreScrollPosition);
   //SelectTable.AddCallback(RestoreScrollPosition);
   EditTree.AddFilteringCallback(RestoreScrollPosition);

   // update the filter/selection string displayed when the filtering/selection changes
   FilterTable.AddCallback(UpdateSelectionText);
   SelectTable.AddCallback(UpdateSelectionText);
   EditTree.AddFilteringCallback(UpdateSelectionText);
   EditTree.AddSelectionCallback(UpdateSelectionText);

   // restore/save scroll position and selections when page loads/unloads
   DocumentLoad.AddCallback(function(rootNodes)
   {
      if (rootNodes.length != 1 || rootNodes[0] != document.body)
         return;     // this only needs to run once on initial page load
      
      InitFiltering();
      RestoreScrollPosition();
      RestoreSelections();
      // make sure menu items are correctly enabled/disabled on load
      UpdateSelectionText();
   });
}

Form.AddBeforeUnloadCallback(function()
{
   SaveScrollPosition();
   SaveSelections();
});
