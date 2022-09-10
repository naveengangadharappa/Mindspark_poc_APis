// ========================================================================
//        Copyright � 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the filtering of rows in a table element.
//
// Search <INPUT id='search_text' type='text' size='15' onchange='SearchChanged();'><INPUT type='button' value='X' onclick='Utilities_GetElementById("search_text").value=""; SearchChanged();'><BR>
// <DIV id='selection_text'></DIV>
// 
// <SCRIPT type="text/javascript">
// function SearchChanged()
// {
// 	table = Utilities_GetElementById('content_table');
// 	text = Utilities_GetElementById('search_text').value;
// 	FilterTable.SetFilter(table, text);
// }
// </SCRIPT>
//
// <TABLE>
// <THEAD>
// 	<TR><TH>Name</TH><TH>Age</TH>
// </THEAD>
// <TBODY>
// 	<TR><TD>Tanis Higgins</TD><TD>56</TD></TR>
// 	<TR><TD>Dom Test2</TD><TD>45</TD></TR>
// 	<TR><TD>faye keys</TD><TD>58</TD></TR>
// </TBODY>
// </TABLE>


FilterTable =
{
	callbacks: new Array(),
	
	AddCallback: function(callback)
	{
		FilterTable.callbacks.push(callback);
	},
	
	_MatchesClasses: function(tr, searchClasses)
	{
		if (searchClasses.length == 0) return true;
		
		// if we're dealing with an array of arrays then ALL of them must be true
		if (is_array(searchClasses[0]))
		{
			var result = true;
			forEach(searchClasses, function(subClasses)
			{
				if (!FilterTable._MatchesClasses(tr, subClasses))
					result = false;
			});
			return result;
		}
		
		// if we're dealing with a simple array then ANY of the items must be true
		return Utilities_ArraysMeet(Utilities_StringToArray(tr.className, ' '), searchClasses);
	},
	
	_MatchesString: function(tr, searchString)
	{
		var result = false;
		forEach(Utilities_GetElementsByTag('td', tr), function(td)
		{
			if (Utilities_StringContains(strtolower(FilterTable.GetInnerText(td)), searchString))
				result = true;
		});
		return result;
	},
	
   _table: null,
	_searchClasses: null,
	_searchString: null,
	_rows: null,
	_iRow: null,
	_timer: null,
	
	_FilterFunc: function()
	{
		if (FilterTable._timer)
		{
			// kill the timer
			clearTimeout(FilterTable._timer);
			FilterTable._timer = null;				

			var count = 0;
			while (count < 200 && FilterTable._iRow < FilterTable._rows.length)
			{
				var tr = FilterTable._rows[FilterTable._iRow];
				var visible = FilterTable._MatchesClasses(tr, FilterTable._searchClasses) && 
					FilterTable._MatchesString(tr, FilterTable._searchString);
				Visibility_SetByElement(tr, visible);
				if (visible)
				{
					// also find the nearest preceding section_header and show it
					console.log(tr);
					var prev = tr.previousSibling;
					while (prev)
					{
						if (Class_HasByElement(prev, "table_section_header"))
						{
							Visibility_SetByElement(prev, true);
							break;
						}
						prev = prev.previousSibling;
					}
				}
				count++;
				FilterTable._iRow++;
			}

			if (FilterTable._iRow < FilterTable._rows.length)
				FilterTable._timer = setTimeout(FilterTable._FilterFunc, 100);
			else
			{
				forEach(FilterTable.callbacks, function(callback)
				{
					callback(FilterTable._table);
				});
			}
		}
	},
	
	_ClearFunc: function()
	{
		if (FilterTable._timer)
		{
			// kill the timer
			clearTimeout(FilterTable._timer);				
			FilterTable._timer = null;				

			var count = 0;
			while (count < 200 && FilterTable._iRow < FilterTable._rows.length)
			{
				var tr = FilterTable._rows[FilterTable._iRow];
				Visibility_ShowByElement(tr);
				count++;
				FilterTable._iRow++;
			}

			if (FilterTable._iRow < FilterTable._rows.length)
				FilterTable._timer = setTimeout(FilterTable._ClearFunc, 100);
			else
			{
				forEach(FilterTable.callbacks, function(callback)
				{
					callback(FilterTable._table);
				});
			}
		}
	},
	
	SetFilter: function(table, searchString, searchClasses)
	{
		if (searchClasses == null)
			searchClasses = new Array();
			
		if (empty(searchString) && searchClasses.length == 0)
		{
			FilterTable.ClearFilter(table);
		}
		else
		{
			if (FilterTable._timer)
				clearTimeout(FilterTable._timer);				
			
			FilterTable._table = table;
			FilterTable._searchClasses = searchClasses;
			FilterTable._searchString = strtolower(searchString);
			FilterTable._rows = FilterTable.GetRows(table);
			FilterTable._iRow = 0;
			FilterTable._timer = setTimeout(FilterTable._FilterFunc, 100);
		}
	},
	
	ClearFilter: function(table)
	{
		if (FilterTable._timer)
			clearTimeout(FilterTable._timer);				
		
		FilterTable._table = table;
		FilterTable._searchClasses = null;
		FilterTable._searchString = null;
		FilterTable._rows = FilterTable.GetRows(table);
		FilterTable._iRow = 0;
		FilterTable._timer = setTimeout(FilterTable._ClearFunc, 100);
	},
	
	GetRows: function(table)
   {
/*
		elems = Utilities_GetElementsByTag('tbody', table);
		if (elems.length == 0)
			elems = new Array(table);
		return Utilities_GetElementsByTag('tr', elems[0]);
*/
      return table.rows;
	},
	
	GetFilteredIds: function(table)
	{
		result = new Array();
		forEach(FilterTable.GetRows(table), function(row)
		{
			if (Visibility_IsShownByElement(row) && !Class_HasByElement(row, "table_section_header"))
				result.push(row.id);
		});
		return result;
	},

	GetInnerText: function(node)
	{
		// gets the text we want to use for sorting for a cell.
		// strips leading and trailing whitespace.
		// this is *not* a generic getInnerText function; it's special to sorttable.
		// for example, you can override the cell text with a customkey attribute.
		// it also gets .value for <input> fields.
		
		if (!node) return "";
		
		hasInputs = Utilities_GetElementsByTag('input', node).length;
		
		if (node.getAttribute("sorttable_customkey") != null)
		{
			return node.getAttribute("sorttable_customkey");
		}
		else if (typeof node.value != 'undefined' && !hasInputs)
		{
			return node.value.replace(/^\s+|\s+$/g, '');
		}
		else if (typeof node.textContent != 'undefined' && !hasInputs)
		{
			return node.textContent.replace(/^\s+|\s+$/g, '');
		}
		else if (typeof node.innerText != 'undefined' && !hasInputs)
		{
			return node.innerText.replace(/^\s+|\s+$/g, '');
		}
		else if (typeof node.text != 'undefined' && !hasInputs)
		{
			return node.text.replace(/^\s+|\s+$/g, '');
		}
		else
		{
			switch (node.nodeType)
			{
			case 3:
				if (strtolower(node.nodeName) == 'input')
					return node.value.replace(/^\s+|\s+$/g, '');
			case 4:
				return node.nodeValue.replace(/^\s+|\s+$/g, '');
			case 1:
			case 11:
				var innerText = '';
				for (var i = 0; i < node.childNodes.length; i++)
					innerText += sorttable.getInnerText(node.childNodes[i]);
				return innerText.replace(/^\s+|\s+$/g, '');
			default:
				return '';
			}
		}
	},
}
