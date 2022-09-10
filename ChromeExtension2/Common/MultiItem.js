// ========================================================================
//        Copyright � 2010 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Convert a single DIV element into a 'multiple' so more can be added (and removed) by the user. Note
// that the template elements can be DIV for vertical layout or SPAN for horizontal layout. You can also
// specify the class MultiItemReorder if the order of the items can be changed by the user.
//
// Usage:
//
//	<DIV data-prefix='ValidTitles' class='MultiItem' max='4'>
//		<!-- always have at least one template element with no numbering in the field names, and
//		     make sure to ignore these as they will be submitted with the rest -->
//		<DIV class='MultiItemTemplate' AddButtonLabel='Add Title'><INPUT type='text' name='ValidTitles' value=''></DIV>
//
//		<!-- follow with the existing data elements, this time numbered however you like... -->
//		<DIV class='MultiItem_Item'><INPUT type='text' name='ValidTitles134' value='Novice'></DIV>
//		<DIV class='MultiItem_Item'><INPUT type='text' name='ValidTitles1564' value='Crew'></DIV>
//		<DIV class='MultiItem_Item'><INPUT type='text' name='ValidTitles234' value='Skipper'></DIV>
//
//		<!-- new items will be added with numbering starting at the next available value
//		     (1565 here) but the numbers may not be sequential if items have been deleted -->
//	</DIV>
//
// This module depends on: BusyIndicator.js, DocumentLoad.js, EnableDisable.js, Utilities.js, Visibility.js
//
// NOTE: The "readonly" attribute is supported.
//
// Supports MultiItem on TR elements as well
//
// Sample Usage:
//
//   <!-- the MultiItem class marks the start (first row) of the multi-item -->
// <TR data-prefix='ValidTitles' class='MultiItem MultiItem_Item' max='4'><TD><INPUT type='text' name='ValidTitles134' value='Novice' /></TD></TR>
// <TR class='MultiItem_Item'><TD><INPUT type='text' name='ValidTitles1564' value='Crew' /></TD></TR>
// <TR class='MultiItem_Item'><TD><INPUT type='text' name='ValidTitles234' value='Skipper' /></TD></TR>
//
//		<!-- new items will be added with numbering starting at the next available value
//		     (1565 here) but the numbers may not be sequential if items have been deleted -->
//
//		<!-- always have one or more template elements with no numbering in the field names, and
//		     make sure to ignore these as they will be submitted with the rest -->
// <TR class='MultiItemTemplate' AddButtonLabel='Add Title'><TD><INPUT type='text' name='ValidTitles' value='' /></TD></TR>
//
//    <!-- the MultiItemButton row is used to mark the end (last row) of the multi-item -->
// DRL FIXIT! I think this prevents us from having multiple templates, switch to using a MultiItem_End class instead?
// <TR class='MultiItemButton'><TD COLSPAN='2'>The "Add" button will be placed here.</TD></TR>
//
// NOTE: For nested use of MultiItem the data-prefix attribute is required in order to properly number
// each nested use. This data-prefix value must contain the "root" of each name/id used within the MultiItem.

MultiItem =
{
	callbacks: new Array(),

	MakeMultiItem: function(elem)
	{
		// do not initialize if it's in a template
		if (Utilities_HasClassAsParent(elem, 'MultiItemTemplate'))
			return;
		
		if (elem.multi_item != undefined)
			return;	// already initialized
		
		if (elem.tagName.toUpperCase() == 'DIV')
		{
			var max = parseInt(elem.getAttribute('max'));
			MultiItem.MakeMultiItemDiv(elem, max);
		}
		else if (elem.tagName.toUpperCase() == 'TR')
		{
			var max = parseInt(elem.getAttribute('max'));
			MultiItem.MakeMultiItemTable(elem, max);
		}
		
		if (MultiItem.IsReorderable(elem))
		{
			MultiItem.EnableReorder(elem);
		}
	},
	
	Init: function(rootNodes)
	{
		forEach(rootNodes, function(root)
		{
			var elems = Utilities_GetThisOrChildrenBySelector(root, '.MultiItem');
			// using forEach below didn't work on Firefox because we're changing the select elements I believe?
			for (var i = 0; i < elems.length; i++)
			{
				MultiItem.MakeMultiItem(elems[i]);
			}
		});
	},

   // adds or modifies the numeric suffix of the name and id properties to make them unique
	NumberFields: function(elem, oldBaseName, newBaseName)
	{
		let changed = false;
		
		// DRL FIXIT! I think it would be better to have the newNumber passed in in case the base name ends in a number!
		// when we get to a MultiItem the numbering starts over and each child MultiItem_Item gets a new number
		let newNumber = -1;
		// anything else and we'll use the existing number from the passed base
		if (!Class_HasByElement(elem, 'MultiItem'))
		{
			let j = newBaseName.length-1;
			for (; j >= 0 && Utilities_IsNumeric(newBaseName.charAt(j)); j--)
				;
			if (j < newBaseName.length-1)
			{
				newNumber = newBaseName.substr(j+1);
			}
		}

		let els = elem.children;
		for (let i = 0, count = els.length; i < count; i++)
		{
         let el = els[i];
			
			if (Class_HasByElement(el, 'cke'))
			{
				// this is a CKEditor DIV that we need to ignore (and its children)
			}
			else if (Class_HasByElement(el, 'MultiItem'))
			{
				// this is a nested MultiItem
				
				let oldName = MultiItem.GetPrefix(el);
				
				assert(oldName.substr(0, oldBaseName.length) == oldBaseName);
				let newName = newBaseName + oldName.substr(oldBaseName.length);

				if (oldName != newName)
				{
					// we have to renumber the children first as the code needs the old prefix to get the ids
					MultiItem.NumberFields(el, oldName, newName);
					
					// save the new base name to maintain hierarchy
					el.setAttribute('data-prefix', newName);
					
					changed = true;
				}
			}
			else if (Class_HasByElement(el, 'MultiItemTemplate'))
			{
				// I believe here the items don't have numbers but we do need to update the base names
				if (MultiItem.NumberFields(el, oldBaseName, newBaseName))
					changed = true;
			}
			else if (Class_HasByElement(el, 'MultiItem_Item') && !Class_HasByElement(el, 'ghostElement'))
			{
				let oldNumber = MultiItem.GetIdFromFields(el);
				newNumber++;
				
				if (MultiItem.NumberFields(el, oldBaseName + oldNumber, newBaseName + newNumber))
					changed = true;
			}
			else
			{
				// renumber the name and/or ID
				
				if ((el.name != undefined && el.name != '') || el.id != '')	// id is an empty string when not set
				{
					// if they are both specified then they should match
					assert(el.name == undefined || el.name == '' || el.id == '' ||
						// for a radio button the id would include the value to make it unique so we use a substring match
						(el.type == 'radio' && el.id.substr(0, el.name.length) == el.name) ||
						// for a multiple selection item the name would include brackets so we use a substring match
						(el.type != 'radio' && el.name.substr(0, el.id.length) == el.id));
					
					let oldName = el.name != undefined && el.name != '' ? el.name : el.id;
					
					// skip items we don't want numbered
					if (oldName == 'MultiItemAddButton' || oldName == 'MultiItemDeleteButton' || oldName == 'MultiItemHandler')
						continue;
					
					assert(oldName.substr(0, oldBaseName.length) == oldBaseName);
					let suffix = oldName.substr(oldBaseName.length);
					let newName = newBaseName + suffix;

					if (oldName != newName)
					{
						if (el.name != undefined && el.name != '') el.name = newName;
						if (el.id != '') el.id = newName;
						changed = true;

						if (Class_HasByElement(el, 'MultiItemSelector'))
						{
							// radio button selector handling, such as the selector that identifies the default phone from a list
							// of phones - doesn't have the number for this nesting since there's one selector for all items
							
							el.value = newNumber;
						}
					}
				}
				
				// skip a SELECTs OPTION items for efficiency
				if (el.tagName != 'SELECT' && MultiItem.NumberFields(el, oldBaseName, newBaseName))
					changed = true;
			}
		}

		return changed;
	},
	
	GetPrefix: function(elem)
	{
		// we need to find the parent with the data-prefix in both the DIV and TR cases
		while (!Class_HasByElement(elem, 'MultiItem') && !Class_HasByElement(elem, 'MultiItem_Item'))
		{
			elem = elem.parentElement;
		}
		
		if (elem.multi_item)	// this will be here once element is initialized, otherwise not
			return elem.multi_item.wrapper_element.hasAttribute('data-prefix')
				? elem.multi_item.wrapper_element.getAttribute('data-prefix')
				: '';

		if (elem.tagName == 'TR')
		{
			while (elem && !Class_HasByElement(elem, 'MultiItem'))
				elem = elem.previousElementSibling;
			assert(elem != null);
		}
		else
		{
			elem = Utilities_GetThisOrParentByClass(elem, 'MultiItem');
		}
		
		return elem.hasAttribute('data-prefix')
			? elem.getAttribute('data-prefix')
			: '';
	},
	
	GetIdFromFields: function(parent)
	{
		let prefix = MultiItem.GetPrefix(parent);
		
		let id = null;
		let els = parent.children;
		for (let i = 0, count = els.length; i < count; i++)
		{
			let name = els[i].name;
			
			if (name == 'MultiItemAddButton' || name == 'MultiItemDeleteButton' || name == 'MultiItemHandler' ||
				Class_HasByElement(els[i], 'MultiItemTemplate') || Class_HasByElement(els[i], 'ghostElement'))
				continue;

			if (name != null && name != '')
			{
				assert(name.substr(0, prefix.length) == prefix);
				let j = prefix.length;
				for (; j < name.length && Utilities_IsNumeric(name.charAt(j)); j++)
					;
				if (j > prefix.length)
				{
					id = parseInt(name.substr(prefix.length, j-prefix.length));
					break;
				}
			}
         
         id = MultiItem.GetIdFromFields(els[i]);   // nested items (i.e. in a table)
   		if (id != null)
   		{
   			break;
   		}
		}
		
		return id;
	},

	AddItem: function(multi_item, element, fireEvent, template)
	{
		if (multi_item.max && multi_item.count >= multi_item.max)
         return;
         
		if (element == null)
		{
			// cloneNode will not clone event listeners attached to the node
			element = template.cloneNode(true);

			// replace the template class (from cloned node) with the regular one
         Class_RemoveByElement(element, "MultiItemTemplate");
			Class_AddByElement(element, "MultiItem_Item");
			
			if (multi_item.wrapper_element.tagName == 'TR')
			{
				var node = multi_item.addButtons[0];
				// find the TR parent, so we can insert the new row before it
				while (node.tagName != 'TR')
				{
					node = node.parentNode;
				}
				Utilities_InsertBeforeNode(multi_item.wrapper_element.parentNode, element, node);
			}
			else
			{
				Utilities_InsertBeforeNode(multi_item.wrapper_element, element, multi_item.addButtons[0]);
			}
			
			//display the element before you call InitializeNodes to get it's offsetWidth
			Visibility_ShowByElement(element);

			//call numberfields after CustomClone to ensure its numbered
			let number = multi_item.next_id++;
			let prefix = multi_item.wrapper_element.hasAttribute('data-prefix')
				? multi_item.wrapper_element.getAttribute('data-prefix')
				: '';
			MultiItem.NumberFields(element, prefix, prefix + number);
			
         // added this so we can support DateAndTimeChooser
         Form_InitializeNode(element);
		}
		else
		{
			let id = MultiItem.GetIdFromFields(element);

			if (element.tagName == 'TR')
			{
				var els = element.children;
				cols = 0;
				for (var i = 0, count = els.length; i < count; i++)
				{
					var el = els[i];
					if (el.tagName == 'TD' || el.tagName == 'TH')
					{
						cols++;
						break;
					}
				}
				if (cols == 0)
				{
					// we allow empty rows to be added (since the wrapper_element may be an empty row)
					// but we hide them so that they don't cause display issues
					Visibility_HideByElement(element);
					// no need to further process empty rows
					return;
				}
			}

			if (id === null)
				alert('Error: No item number found in element names. Make sure each MultiItem entry has a numeric ID added to the field names.');
			else if (id >= multi_item.next_id)
				multi_item.next_id = id+1;
		}
	
		multi_item.count++;
		if (multi_item.max && multi_item.count >= multi_item.max)
		{
			multi_item.addButtons.forEach(function(button)
		  {
				EnableDisable_DisableByElement(button);
			});
		}

		if (!multi_item.wrapper_element.hasAttribute('readonly'))
		{
			Array.prototype.slice.call(element.children).forEach(function (child)
			{
				if (Class_HasByElement(child, 'MultiItem_Delete'))
					element.deleteButton = child;
			});

			if (!element.deleteButton)
			{
				// some items may already have a delete button with special handling
				element.deleteButton = document.createElement("BUTTON");
				element.deleteButton.name = 'MultiItemDeleteButton';
				element.deleteButton.type = 'BUTTON';   // required to not submit form
				Class_AddByElement(element.deleteButton, 'MultiItem_Delete');

				element.deleteButton.onclick = MultiItem.OnRemoveItem;
			}

			element.handler = document.createElement("BUTTON");
			element.handler.name = 'MultiItemHandler';
			element.handler.type = 'BUTTON';
			Class_AddByElement(element.handler, 'MultiItem_Drag');
		}

		// for a tr element we have to find the first and last td to add the items
		var first = element;
		var last = element;
		if (multi_item.wrapper_element.tagName == 'TR')
		{
			var els = element.children;
			for (var i = 0, count = els.length; i < count; i++)
			{
				var el = els[i];
				if (el.tagName == 'TD' || el.tagName == 'TH')
				{
					if (first == element)
						first = el;
					last = el;
				}
			}
		}

		// we add the button to the front so when it is "float: right" for multiple rows it shows at the top
		if (element.handler && MultiItem.IsReorderable(multi_item.wrapper_element))
			first.insertBefore(element.handler, first.firstChild);
		if (element.deleteButton)
			last.insertBefore(element.deleteButton, last.firstChild);

		if (multi_item.wrapper_element.tagName != 'TR')
		{
			// Add space after the element, for spacing and also to allow line breaks to occur
			var spaceElement = document.createTextNode(' ');
			element.appendChild(spaceElement);
		}

		element.multi_item = multi_item;
      
      if (fireEvent)
         MultiItem.FireChanged(multi_item.wrapper_element);
      
      return element;
	},

	// utility function to find the parent node with the multi-item
	FindWrapperFromButton: function(button)
	{
		var node = button.parentNode;
		// for Table mode, parentNode is not necessarily the multi-item itself, so we have to navigate the DOM to find it
		if (!node.multi_item)
		{
			// find the TR parent
			while (node.tagName != 'TR')
			{
					node = node.parentNode;
			}
			// check previous elements until we find the multi item
			while (node != null)
			{
				if (node.multi_item)
				{
					return node;
				}
				node = node.previousElementSibling;
			}
		}
		else
		{
			// for DIV mode, the button parent already contains the multi-item
			return node;
		}
	},
	
	AddTemplateItem: function(wrapper_elem, templateName)
	{
		let multi_item = wrapper_elem.multi_item;
		
		assert(templateName in multi_item.templates)

		let elem = MultiItem.AddItem(multi_item, null, true, multi_item.templates[templateName]);

		Utilities_FireEvent(wrapper_elem, "AfterAddItem");

		return elem;
	},
	
	RemoveItem: function(element)
	{
		assert(Class_HasByElement(element, 'MultiItem_Item'));
		
		element.multi_item.count--;
		if (element.multi_item.max && element.multi_item.count < element.multi_item.max)
		{
			element.multi_item.addButtons.forEach(function(button)
			{
				EnableDisable_EnableByElement(button);
			});
		}
		
		// in TR mode it's possible for the row to be deleted to be the wrapper element
		// for this case, just delete all the TDs (so that we still have a wrapper element)
		if (element == element.multi_item.wrapper_element)
		{
			while (element.firstChild)
			{
				element.removeChild(element.firstChild);
			}
			Visibility_HideByElement(element);
		}
		else
		{
			element.parentNode.removeChild(element);
		}
		
		MultiItem.FireChanged(element.multi_item.wrapper_element);
		Utilities_FireEvent(element.multi_item.wrapper_element, "AfterRemoveItem");
	},

	OnAddItem: function()
	{
		var wrapper_elem = MultiItem.FindWrapperFromButton(this);
		var templateName = this.innerHTML;
		
		MultiItem.AddTemplateItem(wrapper_elem, templateName);

		// Appease Safari
		//    without it Safari wants to reload the browser window
		//    which nixes your already queued uploads
		return false;
	},
	
	OnRemoveItem: function()
	{
		var element = MultiItem.FindWrapperFromButton(this);
		
		MultiItem.RemoveItem(element);
  
		// Appease Safari
		//    without it Safari wants to reload the browser window
		//    which nixes your already queued uploads
		return false;
	},

	// some multi items us a hidden checkbox which when checked will result in the item
	// being deleted on the server side when the form is submitted
   OnCheckboxRemoveItem: function(elem, checkboxName)
	{
		var checkbox = Utilities_GetElementByName(checkboxName, elem);
		checkbox.checked = true;
		elem.style.display = 'none';

		// DRL FIXIT! I don't know why I had to do this to get the OnElemChanged() to fire, it should be set up by InitializeForm()!
		if (typeof OnElemChanged === 'function')
		{
			var e = new Object();
			e.target = elem;
			OnElemChanged(e);
		}
	},

   
   FireChanged: function(wrapper_elem)
   {
      FireElemChanged(wrapper_elem);

      MultiItem.callbacks.forEach(function(callback)
      {
         try
         {
            callback(wrapper_elem);
         }
         catch(err)
         {
            alert("Exception: " + err.message);
         }
      });
   },
   
   AddCallback: function(callback)
   {
      MultiItem.callbacks.push(callback);
   },
	
	MakeMultiItemDiv: function(wrapper_elem, max)
	{
		if (wrapper_elem.tagName != 'DIV')
		{
			alert('Error: not a DIV element');
         return;
      }
      
		let multi_item = new Object();
	
		multi_item.count = 0;
		multi_item.next_id = 0;

		multi_item.wrapper_element = wrapper_elem;
		wrapper_elem.multi_item = multi_item;

		var default_label = wrapper_elem.getAttribute('AddButtonLabel');
		if (default_label == null || default_label.length == 0) default_label = "Add";

		if (max)
		{
			multi_item.max = max;
		}
		else
		{
			multi_item.max = null;
		}

		multi_item.templates = new Object();

		var els = wrapper_elem.children;
		for (var i = 0, count = els.length; i < count; i++)
		{
			var element = els[i];

			if (Class_HasByElement(element, 'MultiItemTemplate'))
			{
				//element.className = element.className.replace('MultiItemTemplate', '');
				var label = element.getAttribute('AddButtonLabel');
            if (label == null || label.length == 0) label = default_label;
				multi_item.templates[label] = element;
				Visibility_HideByElement(element);
			}
			else if (Class_HasByElement(element, 'MultiItem_Item'))
			{
				MultiItem.AddItem(multi_item, element, false, null);
			}
			else
			{
				assert(0);
			}
		}

		// create a button for each template
		multi_item.addButtons = new Array();
		if (!wrapper_elem.hasAttribute('readonly'))
		{
			for (var button_label in multi_item.templates)
			{
				var addButton = document.createElement("BUTTON");
				addButton.name = 'MultiItemAddButton';
				addButton.type = 'BUTTON';   // required to not submit form
				Class_AddByElement(addButton, 'form_button');
				addButton.appendChild(document.createTextNode(button_label));
				addButton.onclick = MultiItem.OnAddItem;
//   			addButton.style.width = "auto";
				multi_item.addButtons.push(addButton);
			}
		}

		multi_item.addButtons.forEach(function(button)
		{
			multi_item.wrapper_element.appendChild(button);
			
			// add an element that will create some spacing between the buttons
         var spaceElement = document.createElement('span');
         spaceElement.innerHTML = " ";
         multi_item.wrapper_element.appendChild(spaceElement);
		});

		if (multi_item.templates.length == 0)
			alert('Error: no template element');
	},

	MakeMultiItemTable: function(wrapper_elem, max)
	{
		if (wrapper_elem.tagName != 'TR')
		{
			alert('Error: not a TR');
         return;
      }

		let multi_item = new Object();

		multi_item.count = 0;
		multi_item.next_id = 0;

		multi_item.wrapper_element = wrapper_elem;
		wrapper_elem.multi_item = multi_item;

		var default_label = wrapper_elem.getAttribute('AddButtonLabel');
		if (default_label == null || default_label.length == 0) default_label = "Add";

		if (max)
		{
			multi_item.max = max;
		}
		else
		{
			multi_item.max = null;
		}

		multi_item.templates = new Object();
		var element = multi_item.wrapper_element;
		// use nextElementSibling to iterate through the rows
		while (element != null)
		{
			if (Class_HasByElement(element, 'MultiItemTemplate'))
			{
				//element.className = element.className.replace('MultiItemTemplate', '');
				var label = element.getAttribute('AddButtonLabel');
		    if (label == null || label.length == 0) label = default_label;
				multi_item.templates[label] = element;
				Visibility_HideByElement(element);
			}
			else if (Class_HasByElement(element, 'MultiItemButton'))
			{
				multi_item.button_element = element;
				// use the button to indicate the end of the multi_item
				break;
			}
			else
			{
				MultiItem.AddItem(multi_item, element, false, null);
			}
			element = element.nextElementSibling;
		}

		if (!multi_item.templates.length == 0)
			alert('Error: no template element');

		// create a button for each template
		multi_item.addButtons = new Array();
		for (var button_label in multi_item.templates)
		{
			var addButton = document.createElement("BUTTON");
			addButton.name = 'MultiItemAddButton';
			addButton.type = 'BUTTON';   // required to not submit form
			Class_AddByElement(addButton, 'form_button');
			addButton.appendChild(document.createTextNode(button_label));
			addButton.onclick = MultiItem.OnAddItem;
//			addButton.style.width = "auto";
			multi_item.addButtons.push(addButton);
		}

		// insert the buttons into the first cell of the button row
		var els = multi_item.button_element.children;
		for (var i = 0, count = els.length; i < count; i++)
		{
			var element = els[i];

			if (element.tagName == "TD" || element.tagName == "TH")
			{
				while (element.firstChild) {
		    	element.removeChild(element.firstChild);
				}
				multi_item.addButtons.forEach(function(button)
			  {
					element.appendChild(button);
				});
				break;
			}
		}
	},

	IsReorderable: function(elem)
	{
		return Class_HasByElement(elem, 'MultiItemReorder');
	},

	DisableReorder: function(elem)
	{
		forEach(elem.children, function (child)
		{
			if (Class_HasByElement(child, "MultiItem_Item")) {
				Class_RemoveByElement(child, "draggable");
			}
		});
	},

	EnableReorder: function()
	{
		initSortable("MultiItem", false, "MultiItem_Drag", "MultiItem_Item");
	},

	ReorderId: function(elem)
	{
      assert(Class_HasByElement(elem, 'MultiItem'));
      
      let prefix = elem.hasAttribute('data-prefix')
			? elem.getAttribute('data-prefix')
			: '';

		if (MultiItem.NumberFields(elem, prefix, prefix))
			MultiItem.FireChanged(elem);
	},
}

DocumentLoad.AddCallback(MultiItem.Init);
