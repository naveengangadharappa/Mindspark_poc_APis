// ========================================================================
// ========================================================================
//        Copyright � 2008 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

//	Convert a multiple SELECT control into one that lists the selected items in a column (or row with
// class MultiSelectHorizontal). You can also specify the class MultiSelectReorder if the order of the
// items can be changed by the user.
//
//	Usage:
//
//	<SELECT name='Whatever[]' class='MultiSelect MultiSelectHorizontal FilterSelect' size=4 AddButtonLabel='Add Document...'>
//		<OPTION value="1">Web Authoring Reference</OPTION>
//		<OPTION value="2" SELECTED>FAQ Archives</OPTION>
//		<OPTION value="3" SELECTED>Feature Article</OPTION>
//	</SELECT>
//
// The selected items can be provided in the list above or in an optional hidden element such as this.
// The reason we might want to do it this way is for the MultiSelectReorder case since this provides the
// order of the elements whereas the list above does not.
//
// <INPUT type="hidden" name="Whatever_Values" value="3,2">


MultiSelect =
{
   Init: function(rootNodes)
   {
      forEach(rootNodes, function(root)
      {
         var elems = Utilities_GetThisOrChildrenBySelector(root, '.MultiSelect');
         // using forEach below didn't work on Firefox because we're changing the select elements I believe?
         for (var i = 0; i < elems.length; i++)
         {
            MultiSelect.MakeMultiSelect(elems[i]);
      
            if (MultiSelect.IsHorizontal(elems[i]))
            {
               var siblings = elems[i].parentNode.childNodes;
               for (var j = 0; j < siblings.length; j++)
               {
                  if (siblings[j].className && siblings[j].className.indexOf('MultiSelect_Item') != -1)
                     Class_AddByElement(siblings[j], 'MultiSelectHorizontal');
               }
            }
         }
         for (var i = 0; i < elems.length; i++)
         {
            if (MultiSelect.IsReoderable(elems[i]))
            {
               initSortable("MultiSelect", true, "MultiSelect_Drag", "MultiSelect_Item");
               break;
            }
         }
      });
   },

   ClearSelections: function(targetSelect)
   {
      for (var i = 0; i < targetSelect.children.length; i++)
      {
         var option = targetSelect.children[i];
         if (option.selected)
         {
            MultiSelect.UnselectItem(targetSelect, option.value);
            MultiSelect.RefreshSelectOption(targetSelect);
         }
      }
   },

   OnChange: function(newSelect)
   {
      var targetSelect = MultiSelect.GetTargetSelect(newSelect);
      var useFilter = MultiSelect.IsFilterSelect(targetSelect);
      var selectedItem = newSelect.selectedIndex
      if (!useFilter)
         selectedItem = selectedItem - 1;	// accounts for blank item only present in newSelect but not targetSelect

      // Don't do anything if the selected item is the empty one or the item is already selected
      if (selectedItem >= 0) // && !targetSelect.options[selectedItem].selected --- removed this condition since it did not allow same option to be selected in consecutive select boxes
      {
         // Select the item
         MultiSelect.OnSelectItem(targetSelect, selectedItem, true);
      }

      // Set the empty item as selected
      newSelect.selectedIndex = useFilter ? -1 : 0;
   },

   OnSelectItem: function(targetSelect, selectedItem, fireEvent)
   {
      // Select the item
      targetSelect.options[selectedItem].selected = true;
      MultiSelect.RefreshSelectOption(targetSelect);
      MultiSelect.ReorderId(targetSelect, fireEvent);

      var groupingElement;
      if (MultiSelect.IsHorizontal(targetSelect))
      {
         groupingElement = document.createElement('span');
         /* I took this out because it was making the toolbar filter go tall instead of wide. */
         /*         groupingElement.className = 'mobile_block';    show vertical on mobile */
      }
      else
         groupingElement = document.createElement('div');
      Class_AddByElement(groupingElement, 'MultiSelect_Item');

      // Delete button
      var deleteButton = document.createElement('button');
      //		deleteButton.innerHTML = 'X';
      Class_AddByElement(deleteButton, 'MultiSelect_Delete');

      // Delete function and data it will use
      deleteButton.onclick = MultiSelect.OnDelete;
      deleteButton.setAttribute('MultiSelect_Name', targetSelect.name);   // save the name so we can find the target later
      deleteButton.setAttribute('MultiSelect_SelectedItem', selectedItem);// save the selected item so we can unselect it later

      // Set row value
      var _selectedItem = targetSelect.options[selectedItem];
      // NOTE: I switch &nbsp; to spaces and then remove surrounding spaces in
      // order to remove the spacing that is around tree lists.
      var itemText = _selectedItem.innerHTML.replace(/\&nbsp\;/g, ' ').replace(/^\s+|\s+$/g, '');
      if (_selectedItem.getAttribute("fullvalue")) {
         itemText = _selectedItem.getAttribute("fullvalue");
      }
      groupingElement.innerText = itemText;

      //		// Create an element that will create a bit of space between this and the delete button
      //      var spaceElement = document.createElement('span');
      //      spaceElement.innerHTML = "&nbsp;";
      //      groupingElement.appendChild(spaceElement);

      // Add button
      groupingElement.appendChild(deleteButton);

      if (MultiSelect.IsReoderable(targetSelect))
      {
         var dragButton = document.createElement("BUTTON");
         dragButton.name = 'MultiSelectHandler';
         dragButton.type = 'BUTTON';
         Class_AddByElement(dragButton, 'MultiSelect_Drag');

         groupingElement.appendChild(dragButton);
      }

      //		// Create an element that will create a bit of space between this and the next item (for horizontal layout)
      //      spaceElement = document.createElement('span');
      //      spaceElement.innerHTML = "&nbsp;&nbsp;";
      //      groupingElement.appendChild(spaceElement);

      // Add new element before the input item
      newSelectElement = MultiSelect.GetNewSelect(targetSelect);
      targetSelect.parentNode.insertBefore(groupingElement, newSelectElement);

      // Add space after the element, for spacing and also to allow line breaks to occur
      var spaceElement = document.createTextNode(' ');
      targetSelect.parentNode.insertBefore(spaceElement, newSelectElement);

      if (fireEvent)
         Utilities_FireEvent(targetSelect, 'change');
   },

   OnDelete: function()
   {
      var selectedItem = this.getAttribute('MultiSelect_SelectedItem');
      var targetSelectName = this.getAttribute('MultiSelect_Name');
      var targetSelect = Utilities_GetElementByName(targetSelectName, this.parentNode.parentNode);

      // Unselect the item
      targetSelect.options[selectedItem].selected = false;     

      // Remove this row from the list
      this.parentNode.parentNode.removeChild(this.parentNode);

      Utilities_FireEvent(targetSelect, 'change');

      MultiSelect.RefreshSelectOption(targetSelect);
      MultiSelect.ReorderId(targetSelect, true);
      // Appease Safari
      //    without it Safari wants to reload the browser window
      //    which nixes your already queued uploads
      return false;
   },

   UnselectItem: function(targetSelect, selectedItem)
   {
      var newSelectItem = targetSelect.nextSibling;

      // Unselect the item
      targetSelect.options[selectedItem].selected = false;

      var children = targetSelect.parentNode.children;
      for (var i = 0; i < children.length; i++)
      {
         var temp = children[i].getAttribute('MultiSelect_SelectedItem');
         if (temp == selectedItem)
         {
            // Remove this row from the list
            targetSelect.parentNode.removeChild(children[i]);

            //            Utilities_FireEvent(targetSelect, 'change');
         }
      }
   },

   GetTargetSelect: function(newSelect)
   {
      assert(newSelect.name.indexOf('MultiSelect_') == 0);
      var name = newSelect.name.substr(12);           // strip 'MultiSelect_' prefix
   
      return Utilities_GetElementByName(name, newSelect.parentNode);
   },

   GetNewSelect: function(targetSelect)
   {
      var name = 'MultiSelect_' + targetSelect.name;
      return Utilities_GetElementByName(name, targetSelect.parentNode);
   },

   IsHorizontal: function(targetSelect)
   {
      return Class_HasByElement(targetSelect, 'MultiSelectHorizontal');
   },

   IsReoderable: function(targetSelect)
   {
      return Class_HasByElement(targetSelect, 'MultiSelectReorder');
   },

   IsFilterSelect: function(targetSelect)
   {
      return Class_HasByElement(targetSelect, 'UseFilterSelect') && targetSelect.options.length > FilterSelect.MinimumOptions;
   },

   MakeMultiSelect: function(targetSelect)
   {
      // do not initialize if it's in a template
      if (Utilities_HasClassAsParent(targetSelect, 'MultiItemTemplate'))
         return;

      var targetSelectName = targetSelect.name;

      var children = targetSelect.options;
      var useFilter = MultiSelect.IsFilterSelect(targetSelect);

      Visibility_HideByElement(targetSelect);

      // Create the actual element that will be shown
      var newSelectElement = document.createElement('SELECT');

      newSelectElement.disabled = targetSelect.disabled;

      if (!useFilter && children.length > 0)
      {
         // Add an empty element to be initially selected so we can identify the change
         var option = document.createElement('OPTION');
         var label = targetSelect.getAttribute('AddButtonLabel');
         if (label == null || label.length == 0) label = Str("Add...");
         option.innerHTML = label;         
         option.selected = true;
         option.disabled = true;
         option.value = null; // so this can be identified as an "invalid" option
         //      option.hidden = true;
         newSelectElement.appendChild(option);
      }

      // The new select item will have all the same options as the old one
      for (var i = 0; i < targetSelect.children.length; i++)
      {
         /*
         var option = document.createElement('OPTION');
         var value = children[i].innerHTML;

         // DRL FIXIT! We should refresh the list when switching between portrait and landscape mode!
         var maxLen = targetSelect.parentNode.offsetWidth / 10;   // DRL FIXIT? A bit of a hack!
         value = Utilities_ShortenWithCenterEllipsis(value, maxLen);

         option.innerHTML = value;
         */
         var option = targetSelect.children[i].cloneNode(true);   // copy nesting items such as <optgroup>
         newSelectElement.appendChild(option);
      }

      // Add a name so we can find this element (and indirectly the target element) by name
      newSelectElement.name = 'MultiSelect_' + targetSelectName;
   
      // allow Form.js code to find the replacement element
      newSelectElement.id = Utilities_StripBracketsFromElementName(targetSelectName) + "_ReplacementElement";

      // What to do when an item is selected
      newSelectElement.onchange = function(){MultiSelect.OnChange(newSelectElement);};

      // Add new element after the current one
      targetSelect.parentNode.insertBefore(newSelectElement, targetSelect.nextSibling);
   
      var selectedItems = [];
      
      // Initialize selections with currently selected items in the special "Values" element if found
      var selected = Utilities_GetElementByName(targetSelectName.slice(0, -2) + '_Values');
      if (selected != null)
      {
         selected = selected.value.split(',');
         for (var j = 0; j < selected.length; j++)
         {
            for (var i = 0; i < children.length; i++)
            {
               if (children[i].value == selected[j])
               {
                  MultiSelect.OnSelectItem(targetSelect, i, false);   // don't fire changed event on init
               }
            }
         }
      }
      else
      {
         // Initialize selections with currently selected items in the SELECT itself
         for (var i = 0; i < children.length; i++)
         {
            if (children[i].selected)
            {
               MultiSelect.OnSelectItem(targetSelect, i, false);   // don't fire changed event on init
            }
         }
      }
   
      // it looks like I have to do this in order for the last selected item above to
      // get placed in the Xys_Values element
      MultiSelect.ReorderId(targetSelect, false);
      
      // Roy added this, not sure why but it unselects the first item in the list when the page is shown.
      //		if (targetSelect.selectedIndex == 0)
      //			targetSelect.selectedIndex = -1;
      // Set the empty item as selected
      newSelectElement.selectedIndex = useFilter ? -1 : 0;

      if (useFilter)
      {
         // Convert to FilterSelect
         FilterSelect.MakeFilterSelect(newSelectElement);
      }
   },

   ReorderId: function(targetSelect, fireEvent)
   {
      if (!targetSelect) { assert(0); return};
      assert(Class_HasByElement(targetSelect, 'MultiSelect'));
      
      var items = targetSelect.parentNode.querySelectorAll('.MultiSelect_Item');
      var value = '';
      for (var i = 0; i < items.length; i ++)
      {
         var id =  items[i].querySelector('.MultiSelect_Delete').getAttribute('multiselect_selecteditem');
         value += targetSelect.options[id].value + ','
      }
      var elem = Utilities_GetElementByName(targetSelect.name.slice(0, -2) + '_Values');
      if (elem != null)
      {
         elem.value = value.slice(0, -1);

         // the above isn't firing the changed event
         if (fireEvent != false)
            Utilities_FireEvent(elem, 'change');
      }
   },

   RefreshSelectOption: function(targetSelect)
   {
      var newSelect = Utilities_GetElementByName('MultiSelect_' + targetSelect.name);
      var j = 0;
      if (targetSelect.options.length != newSelect.options.length)
      {
         assert(targetSelect.options.length+1 == newSelect.options.length);
         // when the SelectItem is NOT used with FilterSelect an additional item is added at the beginning
         // of the list so we have to account for this in our indexing below
         j = 1;
      }
      for (var i = 0; i < targetSelect.options.length; i++, j++)
      {
         if(targetSelect.options[i].selected == true)
         {
            newSelect.options[j].style.display = 'none';
         }
         else
         {
            newSelect.options[j].style.display = 'block';
         }
      }
   },
}

DocumentLoad.AddCallback(MultiSelect.Init);
