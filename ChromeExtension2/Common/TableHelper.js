// ========================================================================
//        Copyright � 2017 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Utilities used in conjunction with FilterTable and SelectTable and EditTree.

var _SelectAllEnabled = false;
var _IgnoreSelectionChange = false;

// return "row_" or "node_" style prefix from an ID (without the underscore), or null if no prefix
function GetPrefix(id)
{
   var i = id.lastIndexOf("_");
   if (i == -1) return null;
   return id.substr(0, i);
}

function GetSuffix(id)
{
   var i = id.lastIndexOf("_");
   if (i == -1) return null;
   return id.substr(i+1);
}

// remove "row_" or "node_" style prefix from an ID
function StripPrefix(id)
{
   var i = id.lastIndexOf("_");
   if (i == -1) return id;
   return id.substr(i+1);
}

function StripSuffix(id)
{
   var i = id.lastIndexOf("_");
   if (i == -1) return id;
   return id.substr(0, i);
}

// remove "row_" or "node_" style prefix from IDs
function StripPrefixes(ids)
{
   for (var i = 0; i < ids.length; i++)
   {
      ids[i] = StripPrefix(ids[i]);
   }
}

function SelectAllRows()
{
   _SelectAllEnabled = true;
   var table = Utilities_GetElementById('content_table');
   if (table != null)
   {
      _IgnoreSelectionChange = true;      // don't clear _SelectAllEnabled!
      SelectTable.SelectAllRows(table);
      _IgnoreSelectionChange = false;
   }
}

function DeselectAllRows()
{
   var table = Utilities_GetElementById('content_table');
   if (table != null)
   {
      SelectTable.ClearSelection(table);
   }
   _SelectAllEnabled = false;
}

function AllRowsSelected()
{
   return _SelectAllEnabled;
}

function SendSelectedItemsEmail()
{
   var table = Utilities_GetElementById("content_table");
   var selectedIds = SelectTable.GetSelectedIds(table);
   var filteredIds = FilterTable.GetFilteredIds(table);
   selectedIds = Utilities_UnionArrays(selectedIds, filteredIds);
   StripPrefixes(selectedIds);
   window.location.href = "mailto:" + selectedIds.join(",");
}

function TableSearchChanged()
{
   // whenever the user changes the selection we turn off "select all" mode
   if (!_IgnoreSelectionChange)
      _SelectAllEnabled = false;
}

SelectTable.AddCallback(TableSearchChanged);
