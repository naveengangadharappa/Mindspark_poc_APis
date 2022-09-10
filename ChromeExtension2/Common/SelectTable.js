// ========================================================================
//        Copyright © 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the selection of rows in a table element. The selected rows will 
// be given the class 'selected_row'.
//
// <TABLE class='select_table'>
// 	<TR><TD>Tanis Higgins</TD><TD>56</TD></TR>
// 	<TR><TD>Dom Test2</TD><TD>45</TD></TR>
// 	<TR><TD>faye keys</TD><TD>58</TD></TR>
// </TABLE>
//
// You can use the "selected_indicator" class on a child element so that the
// user must click on that element to select the row, and also add "selectable_indicators"
// on the table:
//
// <TABLE class='select_table selectable_indicators'>
// 	<TR><TD>
//       <label><span class="selected_indicator iconsmall"></span>
//       </label>Tanis Higgins</TD><TD>56</TD></TR>
// 	<TR><TD>
//       <label><span class="selected_indicator iconsmall"></span>
//       </label>Dom Test2</TD><TD>45</TD></TR>
// 	<TR><TD>
//       <label><span class="selected_indicator iconsmall"></span>
//       </label>faye keys</TD><TD>58</TD></TR>
// </TABLE>
//
// You can use the "checkbox_selectable" class on the table so clicking on a
// row doesn't unselect other rows (behaves like a checkbox):
//
// <TABLE class='select_table checkbox_selectable'>
// 	<TR><TD>Tanis Higgins</TD><TD>56</TD></TR>
// 	<TR><TD>Dom Test2</TD><TD>45</TD></TR>
// 	<TR><TD>faye keys</TD><TD>58</TD></TR>
// </TABLE>

SelectTable =
{
	firstSelectedRow: null,
	callbacks: new Array(),
	clickCallbacks: new Array(),
	
	Init: function(rootNodes)
	{
		forEach(rootNodes, function(root)
		{
			var elems = Utilities_GetThisOrChildrenBySelector(root, '.select_table');
			for (var i = 0; i < elems.length; i++)
			{
				SelectTable.MakeSelectable(elems[i]);
			}
		});
	},
	
	AddCallback: function(callback)
	{
		SelectTable.callbacks.push(callback);
	},
	
	AddClickCallback: function(callback)
	{
		SelectTable.clickCallbacks.push(callback);
	},
	
	GetTable: function(elem)
	{
		while (elem && strtoupper(elem.tagName) != 'TABLE')
			elem = elem.parentNode;
		return elem;
	},
	
	ClearSelection: function(table)
	{
		forEach(SelectTable.GetRows(table), function(tr)
		{
			Class_RemoveByElement(tr, "selected_row");
		});
		
      forEach(SelectTable.callbacks, function(callback)
      {
         callback(table);
      });
	},
   
   SelectAllRows: function(table)
   {
      if (table.rows.length > 0)
      {
         SetSelection(table, table.rows[0]);
         SelectTable.ExtendSelection(table, table.rows[table.rows.length-1]);
         
         forEach(SelectTable.callbacks, function(callback)
         {
            callback(table);
         });
      }
   },
   
   ExtendSelection: function(table, elem)
	{
		var selecting = false;
		forEach(SelectTable.GetRows(table), function(tr)
		{
			// DRL We don't want to select hidden rows.
			var visible = Visibility_IsShownByElement(tr);
			
			Class_SetByElement(tr, "selected_row", tr.id && selecting && visible);
			if (tr == SelectTable.firstSelectedRow || tr == elem)
				selecting = !selecting;
			if (tr.id && selecting && visible) {
				Class_AddByElement(tr, "selected_row");
			}
		});

      forEach(SelectTable.callbacks, function(callback)
      {
         callback();
      });
	},

	HasMultipleRowsSelected: function(table)
	{
		var count = 0;
		forEach(SelectTable.GetRows(table), function(tr)
		{
			if (Class_HasByElement(tr, "selected_row")) {
				count++;
			}			
			if (count >= 2) {
				return true;
			}
		});
		return false;
	},
   
   HandleIndicatorClick: function(event)
   {
      if (!event) event = window.event;	// Internet Explorer before version 9
   
      var target = event.currentTarget;
      var tr = Utilities_GetParentByTag(target, 'TR');
      if (!tr || !tr.id)
         return;
   
      SelectTable.HandleClick(tr);
   },

	HandleRowClick: function(event)
	{
      if (!event) event = window.event;	// Internet Explorer before version 9
      
		var target = event.currentTarget;
		if (!target.id)
			return;

      SelectTable.HandleClick(target);
   },
   
   HandleClick: function(row)
   {
		var table = SelectTable.GetTable(row);
		var shiftSelect = false;
			
		if (event.shiftKey)
		{
			SelectTable.ExtendSelection(table, row);
			shiftSelect = true;
		} 
		else if (event.ctrlKey || event.metaKey || Class_HasByElement(table, 'checkbox_selectable'))
		{
			Class_ToggleByElement(row, "selected_row");
		}
		else
		{
			if (SelectTable.HasMultipleRowsSelected(table))
			{
				SelectTable.ClearSelection(table);
				Class_AddByElement(row, "selected_row");
				SelectTable.firstSelectedRow = null;
			}
			else
         {
				var rowIsCurrentlySelected = Class_HasByElement(row, "selected_row");
				SelectTable.ClearSelection(table);
				if (!rowIsCurrentlySelected)
				{
					Class_AddByElement(row, "selected_row");
				}
			}
		}
		
		if (SelectTable.firstSelectedRow == null)
			SelectTable.firstSelectedRow = row;
		
		// shift clicking causes browser selection so we remove any selection here
      if (shiftSelect)
      {
   		if (document.selection && document.selection.empty)
   		{
   			document.selection.empty();
   		}
   		else if (window.getSelection)
   		{
   			var sel = window.getSelection();
   			sel.removeAllRanges();
   		}
      }

      event.stopPropagation();
	
		forEach(SelectTable.clickCallbacks, function(callback)
		{
			callback(table, row);
		});
		
		forEach(SelectTable.callbacks, function(callback)
		{
			callback(table);
		});
	},
   
   SetSelection: function(table, elem)
   {
      SelectTable.ClearSelection(table);
      Class_AddByElement(elem, "selected_row");
      SelectTable.firstSelectedRow = elem;
      
      // clicking causes browser selection so we remove any selection here
      if(document.selection && document.selection.empty)
      {
         document.selection.empty();
      }
      else if(window.getSelection)
      {
         var sel = window.getSelection();
         sel.removeAllRanges();
      }
      
      forEach(SelectTable.callbacks, function(callback)
      {
         callback(table);
      });
   },
   
   SelectAllRows: function(table)
   {
      if (table.rows.length > 0)
      {
         SelectTable.SetSelection(table, table.rows[0]);
         SelectTable.ExtendSelection(table, table.rows[table.rows.length-1]);
         
         forEach(SelectTable.callbacks, function(callback)
         {
            callback(table);
         });
      }
   },
   
   MakeSelectable: function(table)
	{
		forEach(SelectTable.GetRows(table), function(tr)
		{
		   var elems = Utilities_GetElementsByClass('selected_indicator', null, tr);
		   if (elems.length > 0)
            elems[0].onclick = SelectTable.HandleIndicatorClick;
		   else
            tr.onclick = SelectTable.HandleRowClick;
		});
      forEach(SelectTable.callbacks, function(callback)
		{
			callback(table);
		});
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
   
   GetIds: function(table)
   {
      var result = new Array();
      forEach(SelectTable.GetRows(table), function(row)
      {
         result.push(row.id);
      });
      return result;
   },
   
   SelectIds: function(ids, table)
   {
      forEach(ids, function(id)
      {
         Class_AddById(id, "selected_row");
      });
   },
   
   UnselectIds: function(ids, table)
   {
      forEach(ids, function(id)
      {
         Class_RemoveById(id, "selected_row");
      });
   },
   
   GetSelectedIds: function(table)
	{
		var result = new Array();
		forEach(SelectTable.GetRows(table), function(row)
		{
			if (Class_HasByElement(row, "selected_row"))
				result.push(row.id);
		});
		return result;
	},
}



DocumentLoad.AddCallback(SelectTable.Init);

