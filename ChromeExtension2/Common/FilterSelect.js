// ========================================================================
//        Copyright ? 2008 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

//	Convert a long SELECT control into one that accepts text input to filter 
//  the listed options.
//	Usage:
//
//	<SELECT name='Whatever' class='FilterSelect'>
//		<OPTION>Web Authoring Reference</OPTION>
//		<OPTION>FAQ Archives</OPTION>
//		<OPTION>Feature Article</OPTION>
//			lots of OPTIONs here...
//	</SELECT>


Key = 
{
	/**
	 * Enumeration for the backspace key code
	 * @type {Number}
	 * @static
	 */
	KEY_BACKSPACE: 8,
	/**
	 * Enumeration for the tab key code
	 * @static
	 */
	KEY_TAB:       9,
	/**
	 * Enumeration for the return/enter key code
	 * @static
	 */
	KEY_RETURN:   13,
	/**
	 * Enumeration for the escape key code
	 * @static
	 */
	KEY_ESC:      27,
	/**
	 * Enumeration for the left arrow key code
	 * @static
	 */
	KEY_LEFT:     37,
	/**
	 * Enumeration for the up arrow key code
	 * @static
	 */
	KEY_UP:       38,
	/**
	 * Enumeration for the right arrow key code
	 * @static
	 */
	KEY_RIGHT:    39,
	/**
	 * Enumeration for the down arrow key code
	 * @static
	 */
	KEY_DOWN:     40,
	/**
	 * Enumeration for the delete key code
	 * @static
	 */
	KEY_DELETE:   46,
	/**
	 * Enumeration for the shift key code
	 * @static
	 */
	KEY_SHIFT:    16,
	/**
	 * Enumeration for the cotnrol key code
	 * @static
	 */
	KEY_CONTROL:  17,
	/**
	 * Enumeration for the capslock key code
	 * @static
	 */
	KEY_CAPSLOCK: 20,
	/**
	 * Enumeration for the space key code
	 * @static
	 */
	KEY_SPACE:	  32,

	/**
	 * A simple interface to get the key code of the key pressed based, browser sensitive.
	 * @param {Event} event They keyboard event
	 * @return {Number} the key code of the key pressed
	 */
	keyPressed: function(event)
	{
		return Browser.isIE ? window.event.keyCode : event.which;
	}
};

function filterselect(_elem)
{
	var 
	
	/**
	 * JavaScript callback function to execute upon selection
	 * @type {Function}
	 */
//	onchange: null,

	/**
	 * The dropdown object used in the touch case
	 */
	_dropdown = null,

	/**
	 * The dropdown container used in the touch case
	 */
	_dropdownContainer = null,
   
   /**
    * The select object used in the non-touch case
    * @type {HTMLSelectElement}
    */
   _selector = null,
   
   /**
	 * The component that triggers the suggest
	 * @type {HTMLInputElement}
	 */
	_input = null,
	
	/**
	 * The timeout between lookups
	 * @type {Number}
	 * @private
	 */
	_timeout = null,
	
	/**
	 * Visibility status of the selector object
	 * @type {Boolean}
	 */
	_visible = false,

	/**
	 * Flag indicating whether the components have been laid out
	 * @type {Boolean}
	 */
	_drawn = false,

	/**
	 * Hide timeout
	 * @type {Number}
	 * @private
	 */
	_hideTimeout = null,

	/**
	 * The original SELECT element
	 * @private
	 */
	_select = null,

	/**
	 * The configuration options for the instance
	 * @type {FilterSelect.Options}
	 */
	_options = 
	{
		/**
		 * Number of options to display before scrolling
		 * @type {Number}
		 */
		size: 10,
		/**
		 * CSS class name for autocomplete selector
		 * @type {String}
		 */
		cssClass: null,
		/**
		 * Minimum characters needed before an suggestion is executed
		 * @type {Number}
		 */
		threshold: 1,
		/**
		 * Time delay between key stroke and execution
		 * @type {Number}
		 */
		delay: .2,
		/**
		 * The request method to use when getting the suggestions
		 * @type {String}
		 */
	};

	/**
	 * @param {Object} input ID of form element, or dom element,  to _suggest on
	 */
	function initialize(elem)
	{
		_select = elem;
		
		let scrollable = Utilities_GetScrollableParentElement2(elem);

		// make sure the element appears above the "parent" elements
		let zIndex = Utilities_GetComputedStyle(scrollable, 'z-index');
		if (!Utilities_IsInteger(zIndex))
			zIndex = 50000;	// this was needed when the scrollable was the body
		
		// Create the actual element that will be shown
		_input = document.createElement('input');
		_input.type = "text";
		_input.name = "FilterSelect_Random_" + (new Date()).getTime();   // required in IE for the below to work
		_input.placeholder = Str("Type to search...");
		_input.className = "FilterSelect_Input";
		if (elem.name)
		{
			// allow Form.js code to find the replacement element
			_input.id = Utilities_StripBracketsFromElementName(elem.name) + "_ReplacementElement";
		}
		_input.setAttribute("autocomplete", "off");
      _input.onclick = function() { this.focus(); this.select(FALSE); };

		// Most browsers set selectedIndex to 0 by default even if there is nothing selected in
      // the list of options so I added the extra check for the "selected" property.
		if (_select.selectedIndex != -1 && _select.options[_select.selectedIndex].hasAttribute('selected'))
		{
			_input.value = Utilities_DecodeHtml(_select.options[_select.selectedIndex].innerHTML).trim();
			_input.select();
		}
		else
			_select.selectedIndex = -1; // no item selected

		// a hidden element has no offsetWidth
/*      _input.style.width = Math.max(_select.offsetWidth, 125) + 'px'; Let the CSS set the width. */
		Utilities_InsertAfterNode(_select.parentNode, _input, _select);
		Visibility_HideByElement(_select);

		if (Browser.IsMobileOrTablet())
      {
         // Create the drop down list
         _dropdown = document.createElement('ul');
         
         // Create dropdown container
         _dropdownContainer = document.createElement('div');
         _dropdownContainer.className = 'dropdown-menu visible left dropdown-menu-fix';
         var _temp = document.createElement('div');
         _temp.tabIndex = 0;
         _temp.onclick = 'return true';
         _dropdownContainer.appendChild(_temp);
         _dropdownContainer.appendChild(_dropdown);
	
			_dropdownContainer.style.display = 'none';
         _dropdownContainer.style.zIndex = zIndex;
	
			scrollable.appendChild(_dropdownContainer);
			
         Utilities_AddEvent(_input, 'focus', _onInputFocus);
         //Utilities_AddEvent(_input, 'keyup', _onInputKeyUp);
         Utilities_AddEvent(_input, 'keydown', _onInputKeyDown);
         Utilities_AddEvent(_input, 'blur', _onInputBlur);
      }
		else
      {
         // Create the drop down selection list
         _selector = document.createElement('select');
	
			_selector.style.display = 'none';
			_selector.style.zIndex = zIndex;
	
			// DRL FIXIT? Is there a better solution for this?
			// because we're adding this to the body we had to add position:relative to the body in the CSS for iOS to work
			scrollable.appendChild(_selector);

         Utilities_AddEvent(_input, 'focus', _onInputFocus);
         //Utilities_AddEvent(_input, 'keyup', _onInputKeyUp);
         Utilities_AddEvent(_input, 'keydown', _onInputKeyDown);
         Utilities_AddEvent(_input, 'blur', _onInputBlur);
         Utilities_AddEvent(_selector, 'blur', _onSelectorBlur);
         Utilities_AddEvent(_selector, 'focus', _onSelectorFocus);
         Utilities_AddEvent(_selector, 'change', _onSelectorChange);
      }
      
		Utilities_AddEvent(scrollable, 'resize', _reposition);
		Utilities_AddEvent(scrollable, 'scroll', _reposition);
	}

	/**
	 * The input fields focus event handler
	 */
	function _onInputFocus(event)
	{
		_onSelectorFocus(event);
	}

	/**
	 * The selector's blur event handler
	 * @param {Event} event
	 * @private
	 */
	function _onSelectorBlur(event)
	{
      _hideTimeout = setTimeout(function()
		{
			try
			{
				_checkOnBlur();
			}
			catch (e)
			{
				Log_WriteException(e);
			}
		}, 100);
	}
	
	/**
	 * The input's blur event handler
	 * @param {Event} event
	 * @private
	 */
	function _onInputBlur(event)
	{
      // if we are leaving the input field and NOT going to the select list then we can check for a match
      if (event.relatedTarget != _selector)
         select(TRUE);
      
      _hideTimeout = setTimeout(function()
		{
			try
			{
				_checkOnBlur();
			}
			catch (e)
			{
				Log_WriteException(e);
			}
		}, 100);
	}
	
	/**
	 * Complete's the blur event handlers. Used as a proxy to avoid event collisions when blurring from the input
	 * and focusing on the selector during a mouse navigation
	 * @private
	 */
	function _checkOnBlur()
	{
		_hideTimeout = null
		hide();
		
		// when the focus leaves the control show the selected item (if any)
		if (_select.selectedIndex == -1)
			_input.value = '';
		else 
      {
			var fullValue = _select.options[_select.selectedIndex].innerHTML; //getAttribute('fullvalue');
			fullValue = _select.options[_select.selectedIndex].value != '_NULL_' && fullValue ? fullValue : '';
			_input.value = Utilities_DecodeHtml(fullValue).trim();
		}
	}
	
	/**
	 * The input's key-up event handler
	 * @param {Event} event
	 * @private
	 */
	function _onInputKeyUp(event)
	{
		if (_suggest(event))
      {
			Utilities_StopEventPropagation(event);
			Utilities_PreventDefaultForEvent(event);
      }
	}
	
	/**
	 * The input's key-down event handler
	 * @param {Event} event
	 * @private
	 */
	function _onInputKeyDown(event)
	{
		_input = Utilities_GetEventTarget(event);
		if (_suggest(event))
      {
			Utilities_StopEventPropagation(event);
			Utilities_PreventDefaultForEvent(event);
      }
	}
	
	/**
	 * The selectors's focus event handler.
	 * @param {Event} event
	 * @private
	 */
	function _onSelectorFocus(event)
	{
		if (_hideTimeout)
		{
			clearTimeout(_hideTimeout);
			_hideTimeout = null;
		}
	}
	
	/**
	 * The selector's change event handler
	 * @param {Event} event
	 * @private
	 */
	function _onSelectorChange(event)
	{
		select(FALSE);
	}
	
	/**
	 * Lays the UI elements of the control out, sets interaction options
	 * @param {Object} event Event
	 */
	function draw()
	{
		if (_drawn) return;
		
		if (Browser.IsMobileOrTablet())
      {
         _dropdownContainer.style.display = 'none';
         _dropdownContainer.style.position = 'absolute';
         _dropdownContainer.style.maxWidth = '350px';
         _dropdownContainer.size = _options.size;
      }
		else
      {
         if (_options.cssClass)
            _selector.className = _options.cssClass;
         _selector.style.display = 'none';
         _selector.style.position = 'absolute';
         // the following was added for SA-324 to allow FilterSelect drop down list to work on iOS
         _selector.style.maxWidth = '350px';
// a hidden element has no offsetWidth
/*         _selector.style.width = Math.max(_input.offsetWidth, 125) + 'px'; Let the CSS set the width. */
         _selector.size = _options.size;
      }
		
		_drawn = true;
	}

	/**
	 * Hides the option box
	 */
	function hide()
	{
		if (!_drawn || !_visible) return;
		_visible = false;

		if (Browser.IsMobileOrTablet())
      {
         _dropdownContainer.style.display = 'none';
         _dropdown.innerHTML = '';
      }
		else
      {
         _selector.style.display = 'none';
         _selector.options.length = 0;
      }

		// FF hack, wasn't selecting without this small delay for some reason
		//restore focus is not required. it messes with tabbing.
		//setTimeout(_restoreFocus,50);
	}
	
	/**
	 * Resores the focus to the input control to avoid the cursor getting lost somewhere.
	 * @private
	 */
	function _restoreFocus()
	{
		_input.focus();
	}
	
	/**
	 * Displays the select box
	 */
	function show()
	{
		if (!_drawn) draw();

		if (Browser.IsMobileOrTablet())
      {
         if (_dropdown.children.length)
         {
            _dropdownContainer.style.display = 'inline';
            _reposition();
            _visible = true;
         }
      }
		else
      {
         if (_selector.options.length)
         {
            _selector.style.display = 'inline';
            _reposition();
            _visible = true;
         }
      }
	}

	/**
	 * Removes the timeout function set by a suggest
	 * @private
	 */
	function _cancelTimeout()
	{
		if (_timeout)
		{
			clearTimeout(_timeout);
			_timeout = null;
		}
	}

	/**
	 * Triggers the suggest interaction
	 * @param {Object} event The interaction event (keyboard or mouse)
	 * @return {Boolean} Whether to stop the event
	 * @private
	 */
	function _suggest(event)
	{
		_cancelTimeout();
		var key = Key.keyPressed(event);
		var ignoreKeys = [
			20, // caps lock
			16, // shift
			17, // ctrl
			91, // Windows key
			121, // F1 - F12
			122,
			123,
			124,
			125,
			126,
			127,
			128,
			129,
			130,
			131,
			132,
			45, // Insert
			36, // Home
			35, // End
			33, // Page Up
			34, // Page Down
			144, // Num Lock
			145, // Scroll Lock
			44, // Print Screen
			19, // Pause
			93, // Mouse menu key
		];
		if (ignoreKeys.indexOf(key) > -1)
			return false;

		switch(key)
		{
			case Key.KEY_LEFT:
			case Key.KEY_RIGHT:
				return false;
				break;
			case Key.KEY_TAB:
				if (_visible)
				{
					// do not return true for Tab to allow the default tab behavior
					select(FALSE);
				}
				return false;
				break;
//			case Key.KEY_BACKSPACE:
//			case 46: //Delete
				//cancel();
				//return false;
				//break;
			case Key.KEY_RETURN:
				if (_visible)
				{
					select(FALSE);
					return true;
				}
				return false;
				break;
			case Key.KEY_ESC:
				cancel();
				return true;
				break;
			case Key.KEY_UP:
			case Key.KEY_DOWN:
				_interact(event);
				return true;
				break;
			default:
				break;
		}

//		if (_input.value.length >= _options.threshold - 1)
		{
			_timeout = setTimeout(function()
			{
				try
				{
					_updateSelector();
				}
				catch (e)
				{
					Log_WriteException(e);
				}
			}, 1000 * _options.delay);
		}
			
		return false;
	}

	/**
	 * Sends the suggestion request
	 * @private
	 */
	function _updateSelector()
	{
		// update ul element
		var optionValues = [];
		if (Browser.IsMobileOrTablet())
         _dropdown.innerHTML = '';
		else
         _selector.options.length = 0;

		if (_input.value.length >= _options.threshold)
		{
			var children = _select.options;
			var str = new RegExp(Utilities_RegexpEscape(_input.value), 'i');
			for (var i = 0; i < children.length; i++)
			{
				if (children[i].value == '_NULL_')
				{
					_addOption(children[i].value, '', children[i].innerHTML, false);
					continue;
				}
				// clean the extra padding added for nested elements
				var label = children[i].innerHTML.replace(/\&nbsp\;/g, ' ').replace(/^\s+|\s+$/g, '');
				// use fullvalue if available
				if (children[i].getAttribute("fullvalue")) {
					label = children[i].getAttribute("fullvalue");
				}
				if (label.search(str) != -1)
				{
					// insert parent nodes first
					var components = label.split('/');
					for (var j = 0; j < components.length; j ++) {
						var optionValue = components.slice(0, j + 1).join('/');
						if (optionValues.indexOf(optionValue) < 0) {
							var optionLabel = '   '.repeat(j).concat(components[j]);
							var disabled = false;
							if (j < components.length - 1)
								disabled = true;
							_addOption(children[i].value, optionValue, optionLabel, disabled);
							optionValues.push(optionValue);
						}
					}
				}
			}
			
			var len = Browser.IsMobileOrTablet() ? _dropdown.children.length : _selector.options.length;
         if (!len)
			{
				_addOption(0, 0, Str('No match found'), true);
			}
		}

		if (Browser.IsMobileOrTablet())
      {
         if (_dropdown.children.length)
            show();
         else
            cancel();
      }
		else
      {
         if (_selector.options.length > (_options.size))
            _selector.size = _options.size;
         else
            _selector.size = _selector.options.length > 1 ? _selector.options.length : 2;
   
         if (_selector.options.length)
         {
            //none selected by default
            _selector.selectedIndex = -1;
            show();
         }
         else
            cancel();
      }
	}

	/**
	 * Repositions the selector (if visible) to match the new
	 * coords of the input.
	 * @private
	 */
	function _reposition()
	{
		if (!_drawn) return;
		
		let scrollable = Utilities_GetScrollableParentElement2(_input);
		var pos = Utilities_GetOffset(_input, scrollable);
		
		if (Browser.IsMobileOrTablet())
		{
			_dropdownContainer.style.left =  pos.left + 'px';
			_dropdownContainer.style.top = (pos.top + _input.offsetHeight) + 'px';
     	}
		else
		{
			_selector.style.left =  pos.left + 'px';
			_selector.style.top = (pos.top + _input.offsetHeight) + 'px';
		}
	}

	/**
	 * Creates a suggestion option for the given suggestion,
	 * adds it to the selector object.
	 * @param {String} suggestion The suggestion
	 */
	function _addOption(value, fullValue, label, disabled)
	{
	   if (Browser.IsMobileOrTablet())
      {
         var li = document.createElement('li');
         li.innerText = unescape(label.replace(/ /g, "%A0"));
         li.setAttribute('data-value', value);
         li.addEventListener('mousedown', function (event) {
            onSelect(event);
		 });
		//iPhone dropdown item select issue fix
        //  li.addEventListener('touchstart', function (event) {
        //     onSelect(event);
        //  });
         _dropdown.appendChild(li);
   
         function onSelect(event)
         {
            if (event.target === event.currentTarget) {
               var $this = event.target;
               var label = $this.innerText;
               var value = $this.getAttribute('data-value') != 'undefined' ? $this.getAttribute('data-value') : label;
         
               _input.value = Utilities_DecodeHtml(label).trim();
               _input.select();
         
               var children = _select.options;
               for (var i = 0; i < children.length; i++)
               {
                  if ((typeof children[i].value !== 'undefined' && children[i].value == value) ||
                     (typeof children[i].value === 'undefined' && children[i].innerHtml == label))
                  {
                     _select.selectedIndex = i;
                     break;
                  }
               }
         
               cancel();
         
               // the onchange doesn't fire until the element loses focus
               // so we call it here
               Utilities_FireEvent(_select, 'change');
         
               // MultiSelect changes the value of the selected item after we
               // change it so we need to check and update our edit box
               if (_select.selectedIndex == -1)
                  _input.value = '';
               else
                  _input.value = Utilities_DecodeHtml(_select.options[_select.selectedIndex].innerHTML).trim();
            }
         }
      }
	   else
      {
         var opt = new Option(unescape(label.replace(/ /g, "%A0")), value);
         if (disabled)
            opt.setAttribute('disabled', true);
         opt.setAttribute('fullvalue', fullValue);
         Browser.isIE ? _selector.add(opt) : _selector.add(opt, null);
      }
	}

	/**
	 * Clears and hides the suggestion box.
	 */
	function cancel()
	{
		hide();
	}
   
   /**
    * Captures the currently selected suggestion option to the input field
    */
   function select(leavingControl)
   {
      if (Browser.IsMobileOrTablet())
         return;
      
      var originalValue = '';
      if (_select.selectedIndex != -1)
         originalValue = Utilities_DecodeHtml(_select.options[_select.selectedIndex].innerHTML).trim();
      
      // if there is exactly one match (excluding NULL) and it isn't the "No match found" item then we can select it
      if (_selector.selectedIndex == -1 && _selector.options.length == 1 && _selector.options[0].value != 0)
      {
         _selector.selectedIndex = 0;
      }
      else if (_selector.selectedIndex == -1 && _selector.options.length == 2 && _selector.options[0].value == "_NULL_")
      {
         _selector.selectedIndex = 1;
      }
      
      //check if there are any options and also if any option was selected
      if (_selector.options.length && _selector.selectedIndex >= 0)
      {
         var label = _selector.options[_selector.selectedIndex].innerHTML;
         var value = typeof _selector.options[_selector.selectedIndex].value !== 'undefined'
            ? _selector.options[_selector.selectedIndex].value : label;
         
         _input.value = Utilities_DecodeHtml(label).trim();
         _input.select();
         
         var children = _select.options;
         var str = _input.value;
         for (var i = 0; i < children.length; i++)
         {
            if ((typeof children[i].value !== 'undefined' && children[i].value == value) ||
               (typeof children[i].value === 'undefined' && children[i].innerHtml == label))
            {
               _select.selectedIndex = i;
               break;
            }
         }
      }
      cancel();
      
      // the onchange doesn't fire until the element loses focus
      // so we call it here
      var newValue = _input.value;
      if (_select.selectedIndex != -1)
         newValue = Utilities_DecodeHtml(_select.options[_select.selectedIndex].innerHTML).trim();
      if (newValue != originalValue)
         Utilities_FireEvent(_select, 'change');
      
      // MultiSelect changes the value of the selected item after we
      // change it so we need to check and update our edit box
      if (_select.selectedIndex == -1)
         _input.value = '';
      else
         _input.value = Utilities_DecodeHtml(_select.options[_select.selectedIndex].innerHTML).trim();
      
      // DRL I added this check because when leaving the control (i.e. clicking on a different control on
      // the page) this call would prevent the user from leaving his control.
      if (!leavingControl)
         _input.select();
   }
   
   /**
	 * Processes key interactions with the input field, including navigating the selected option
	 * with the up/down arrows, esc cancelling and selecting the option.
	 * @param {Event} event The interaction event
	 * @private
	 */
	function _interact(event)
	{
      if (Browser.IsMobileOrTablet())
         return;
      
      if (!_visible) return;
      
      var key = Key.keyPressed(event);
      if (key != Key.KEY_UP && key != Key.KEY_DOWN) return;
      var mx = _selector.options.length;
      
      if (key == Key.KEY_UP)
      {
         if (_selector.selectedIndex == 0)
            _selector.selectedIndex = _selector.options.length - 1;
         else
            _selector.selectedIndex--;
      }
      else
      {
         if (_selector.selectedIndex == _selector.options.length - 1)
            _selector.selectedIndex = 0;
         else
            _selector.selectedIndex++;
      }
   }

	
	return (function() {
		initialize(_elem);
	})();
};

FilterSelect =
{
   MinimumOptions: 60,
   
	Init: function(rootNodes)
	{
		forEach(rootNodes, function(root)
		{
			forEach(Utilities_GetThisOrChildrenBySelector(root, 'SELECT.FilterSelect'), function (elem)
			{
				FilterSelect.MakeFilterSelect(elem);
			});
		});
	},

	/**
	 * @param {Object} input ID of form element, or dom element,  to _suggest on
	 */
	MakeFilterSelect: function(elem)
	{
		// don't bother for small lists
		if (elem.options.length > FilterSelect.MinimumOptions &&
			// do not initialize if it's disabled
			!elem.disabled &&
			// do not initialize if it's in a template
			!Utilities_HasClassAsParent(elem, 'MultiItemTemplate'))
		{
			new filterselect(elem);
		}
	}
}

DocumentLoad.AddCallback(FilterSelect.Init);
