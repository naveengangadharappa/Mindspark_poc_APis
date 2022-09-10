// ========================================================================
//        Copyright © 2017 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows the selection of tree nodes and the moving of tree nodes to 
// reorganize the tree.
//
// NOTE: IE requires that the draggable element be an <A> tag with the HREF set (even if just to #) or an IMG tag!
//
// DRL FIXIT! I was still unable to get this to work for IE, look at the following which does work:
// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/dropEffect
//
// The "edittree_selectable" class on the root allows the user to select the rows, otherwise the user can't select
// the rows but they can be selected programmatically.

/* Sample HTML:

   These items are templated:<br />
   <span id="file_added" class="edittree_draggable edittree_templated" style="border: solid"><img class="iconsmall" src="img/FileIcon.png" /> New File</span><br />
   <span id="folder_added" class="edittree_folder edittree_draggable edittree_templated" style="border: solid"><img class="iconsmall" src="img/FolderIcon.png" /> New Folder</span><br />
   <br />
   These items are NOT templated:<br />
   <span id="file_added2" class="edittree_draggable edittree_nottemplated" style="border: solid"><img class="iconsmall" src="img/FileIcon.png" /> New File</span><br />
   <span id="folder_added2" class="edittree_folder edittree_draggable edittree_nottemplated" style="border: solid"><img class="iconsmall" src="img/FolderIcon.png" /> New Folder</span><br />
   
   <!-- put the templates in a hidden DIV... -->
   <div style="display: none;">
      <span id="file_added_template" class="edittree_draggable edittree_droppable">
         <img class="iconsmall" src="img/FileIcon.png" />
         <select name="Icon">
            <option value="Contact">Contact</option>
            <option value="Event">Event</option>
            <option value="Task">Task</option>
            <option value="Resource">Resource</option>
         </select>
         <input type="text" name="Title" placeholder="Title" />
      </span>
      <span id="folder_added_template" class="edittree_folder edittree_draggable edittree_droppable">
         <img class="iconsmall" src="img/FolderIcon.png" />
         <select name="Icon">
            <option value="Contact">Contact</option>
            <option value="Event">Event</option>
            <option value="Task">Task</option>
            <option value="Resource">Resource</option>
         </select>
         <input type="text" name="Title" placeholder="Title" />
      </span>
   </div>
   
   <br /><br />

   <div class="edittree edittree_selectable">
      <ul>
         <li><span id="node_1003" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ContactIcon.png" /> Contacts</span></li>
         <li>
            <span id="node_1004" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/EventIcon.png" /> <span>Events</span></span>
            <ul>
               <li><span id="node_1081" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/EventIcon.png" /> <span>Event 1</span></span></li>
               <li><span id="node_1082" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/EventIcon.png" /> <span>Event 2</span></span></li>
               <li><span id="node_1083" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/EventIcon.png" /> <span>Event 3</span></span></li>
               <li><span id="node_1084" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/EventIcon.png" /> <span>Event 4</span></span></li>
               <li><span id="node_1085" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/EventIcon.png" /> <span>Event 5</span></span></li>
            </ul>
         </li>
         <li><span id="node_1007" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/TaskIcon.png" /> Tasks</span></li>
         <li>
            <span id="node_1006" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/VentureIcon.png" /> Ventures</span>
            <ul>
               <li>
                  <span id="node_1002" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/SubItemIcon.png" />Venture 1</span>
                  <ul>
                     <li>
                        <span id="node_1001" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" />Resources</span>
                        <ul>
                           <li><span id="node_1021" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Resource 1</span></li>
                           <li><span id="node_1022" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Resource 2</span></li>
                           <li><span id="node_1023" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Resource 3</span></li>
                           <li><span id="node_1024" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Resource 4</span></li>
                           <li><span id="node_1025" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Resource 5</span></li>
                        </ul>
                     </li>
                     <li><span id="node_1005" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/TagIcon.png" /> Tags</span>
                        <ul>
                           <li><span id="node_1031" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Tags 1</span></li>
                           <li><span id="node_1032" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Tags 2</span></li>
                           <li><span id="node_1033" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Tags 3</span></li>
                           <li><span id="node_1034" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Tags 4</span></li>
                           <li><span id="node_1035" class="edittree_draggable edittree_droppable"><img class="iconsmall" src="img/ResourceIcon.png" /> Tags 5</span></li>
                        </ul>
                     </li>
                  </ul>
               </li>
               <li><span id="node_1041" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/SubItemIcon.png" />Venture 2</span></li>
               <li><span id="node_1042" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/SubItemIcon.png" />Venture 3</span></li>
               <li><span id="node_1043" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/SubItemIcon.png" />Venture 4</span></li>
               <li><span id="node_1044" class="edittree_folder edittree_draggable edittree_droppable"><img class="iconsmall" src="img/SubItemIcon.png" />Venture 5</span></li>
            </ul>
         </li>
      </ul>
 */


EditTree =
{
   // constants for the drag callback
   DropNone: 0,
   DropCopy: 1,
   DropMove: 2,
   ServerCopy: 3, // a parent in the heirarchy was a DropCopy and the server copied all the children, including this one so it already exists on the server
   
   DragTypeNone: 0,     // no dragging
   DragTypeNormal: 1,   // item dragged from this browser page
   DragTypeFile: 2,     // file dragged from OS
   DragTypeLink: 3,     // item dragged from another browser page

   filteringCallbacks: new Array(),
   selectionCallbacks: new Array(),
   dragCallbacks: new Array(),
   dropCallbacks: new Array(),
   dropTarget: null,
   dragEnterItem: null,
   dragType: 0,
   dropType: 0,

   dragEnable: false,
   draggedParentFolderID: null,

   fileList: [],

   Init: function(rootNodes)
   {
      forEach(rootNodes, function(root)
      {
         var tree = Utilities_GetThisOrChildrenBySelector(root, '.edittree')[0];
         if (tree)
         {
            var draggables = document.querySelectorAll('.edittree_draggable,.edittree_droppable,.edittree_selectable');
            forEach(draggables, function (draggable)
            {
               if (GetPrefix(draggable.id) == 'new')
               {
                  // make sure our "new" ID won't re-use existing values
                  var i = StripPrefix(draggable.id);
                  if (i > EditTree.new_id)
                     EditTree.new_id = i;
               }
               EditTree.setupDragElement(draggable);
            });
      
            if (Class_HasByElement(tree, 'edittree_disabled'))
            {
               EditTree.dragEnable = true;   // set the flag so the code below executes
               EditTree.DisableEditableTree();
            }
            else
            {
               EditTree.dragEnable = false;  // set the flag so the code below executes
               EditTree.EnableEditableTree();
            }
         }
      });
   },
   
   AddFilteringCallback: function(callback)
   {
      EditTree.filteringCallbacks.push(callback);
   },
   
   AddSelectionCallback: function(callback)
   {
      EditTree.selectionCallbacks.push(callback);
   },
   
   AddDragCallback: function(callback)
   {
      EditTree.dragCallbacks.push(callback);
   },
   
   AddDropCallback: function(callback)
   {
      EditTree.dropCallbacks.push(callback);
   },
   
   // ============================================================
   // Scroll handling...
   
   scrollableElem: null,
   scrollTimer: "",
   scrollDX: 0,
   scrollDY: 0,

   StartScroll: function(node)
   {
      if (!node) return;
      if (EditTree.scrollableElem) return;
   
      MainLayout_UpdateFilterDisplay(true);  // fix for iOS scrolling
      
      EditTree.scrollableElem = node;
      
      // we don't get mouse move events while dragging so this is how we get the mouse position
      document.addEventListener('dragover', EditTree.scrollHandler);

      EditTree.scrollTimer = window.setInterval(function()
      {
         try
         {
            if (EditTree.scrollDX == 0 && EditTree.scrollDY == 0)
               return;

//console.log("EditTree scrolling " + EditTree.scrollDX + "," + EditTree.scrollDY + " from " + EditTree.scrollableElem.scrollLeft + "," + EditTree.scrollableElem.scrollTop);
// had to do this to get it to work in all browser whether maximized or not...
            EditTree.scrollableElem.scrollLeft += EditTree.scrollDX;
            EditTree.scrollableElem.scrollTop += EditTree.scrollDY;
            document.documentElement.scrollLeft += EditTree.scrollDX;
            document.documentElement.scrollTop += EditTree.scrollDY;
            document.body.scrollLeft += EditTree.scrollDX;
            document.body.scrollTop += EditTree.scrollDY;
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 300);
   },
   
   StopScroll: function()
   {
       if (EditTree.scrollTimer != "") {
           window.clearInterval(EditTree.scrollTimer);
           document.removeEventListener('dragover', EditTree.scrollHandler);
       }
       EditTree.scrollTimer = "";
       EditTree.scrollableElem = null;
       
      MainLayout_UpdateFilterDisplay(false); // fix for iOS scrolling
   },
   
   scrollHandler: function(e)
   {
//console.log("EditTree scrollHandler");
      e = e || window.e;
      
      var headerHeight = MainLayout_HeaderHeight();
      var footerHeight = MainLayout_FooterHeight();
      
      // get the viewport dimensions minus any fixed content
      var viewportWidth = Utilities_ViewportWidth();
      var viewportHeight = Utilities_ViewportHeight() - headerHeight - footerHeight;
      
      // make 8% around the edge the area where scrolling occurs
      var activeWidth = viewportWidth / 12.5;
      var activeHeight = viewportHeight / 12.5;
      
      var boundaries = {
         left: 0,
         top: headerHeight,
         width: viewportWidth,
         height: viewportHeight
      };

      // DRL FIXIT? We may want to turn off scrolling when the mouse is outside the scrollable area?

      EditTree.scrollDX = 0;
      if (e.clientX < boundaries.left + activeWidth)
      {
         EditTree.scrollDX = -(boundaries.left + activeWidth - e.clientX);
      }
      else if (e.clientX > boundaries.left + boundaries.width - activeWidth)
      {
         EditTree.scrollDX = e.clientX - (boundaries.left + boundaries.width - activeWidth);
      }
      EditTree.scrollDY = 0;
      if (e.clientY < boundaries.top + activeHeight)
      {
         EditTree.scrollDY = -(boundaries.top + activeHeight - e.clientY);
      }
      else if (e.clientY > boundaries.top + boundaries.height - activeHeight)
      {
         EditTree.scrollDY = e.clientY - (boundaries.top + boundaries.height - activeHeight);
      }
   },

   // ============================================================
   // Dragging helpers...
   
   setupDragElement: function(span)
   {
      if (Class_HasByElement(span, 'edittree_draggable'))
      {
         span.setAttribute("draggable", "true");   // for Firefox
         forEach(span.children, function (child)
         {
            // This seems required for MS Edge?
            child.setAttribute("draggable", "true");
         });
   
         span.addEventListener('dragstart', EditTree.handleDragStart, false);
         span.addEventListener('dragend', EditTree.handleDragEnd, false);
      }
      if (Class_HasByElement(span, 'edittree_draggable') || Class_HasByElement(span, 'edittree_selectable'))
      {
         var elems = Utilities_GetElementsByClass('selected_indicator', null, span);
         if (elems.length > 0)
            elems[0].addEventListener('click', EditTree.handleClick, false);
         else
            span.addEventListener('click', EditTree.handleClick, false);
         
         span.addEventListener('touchstart', EditTree.handleTouchStart, false);
         span.addEventListener('touchend', EditTree.handleTouchEnd, false);
      }
      if (Class_HasByElement(span, 'edittree_droppable'))
      {
         span.addEventListener('dragenter', EditTree.handleDragEnter, false);
         span.addEventListener('dragover', EditTree.handleDragOver, false);
         span.addEventListener('dragleave', EditTree.handleDragLeave, false);
         span.addEventListener('drop', EditTree.handleDrop, false);
      }
   },

   updateDropType: function(target)
   {
      EditTree.dropType = EditTree.DropMove;
      forEach(EditTree.dragCallbacks, function(callback)
      {
         var temp = callback(EditTree.draggingItems, target);
         if (temp < EditTree.dropType)
            EditTree.dropType = temp;
      });
   },
   
   // ============================================================
   // Selection helpers...
   
   selected: [],
   touched: false,

   handlClickOrTouchAction: function(elem, shiftKey)
   {
      let root = Utilities_GetThisOrParentByClass(elem, ['edittree']);
   
      // if the tree is not selectable we ignore the click, if the root is null
      // then the target is a palette item and therefore is selectable
      if (root != null && !Class_HasByElement(root, 'edittree_selectable'))
         return;
   
      let target = Utilities_GetThisOrParentByClass(elem, ['edittree_draggable','edittree_selectable']);

      // ignore the click/touch if there is a selection indicator and the touch wasn't on that indicator
      let elems = Utilities_GetElementsByClass('selected_indicator', null, target);
      if (elems.length > 0 && elem != elems[0])
         return;
      
      if (shiftKey)
      {
         // shift mouse click extends the selection
         EditTree.multiSelectByShift(target);
      }
      else
      {
         // - mouse click toggles selection
         // - ctrl-mouse click toggles selection
         EditTree.multiSelectByCtrl(target);
      }
   
      // Reset border to selected element
      EditTree.displaySelectedItems();
   },
   
   handleClick: function(e)
   {
      // DRL In the pipeline page the similar code in EditGrid was firing when I clicked on an <A> element
      // and preventing it from working so I added this check there and applied it here as well since these classes are so similar.
      if (!Class_HasByElement(e.target, 'edittree_draggable') &&
         !Class_HasByElement(e.target, 'edittree_selectable') &&
         !Class_HasByElement(e.target, 'selected_indicator'))
         return;
   
      e.preventDefault();
      // DRL added these to prevent multiple events getting here for the same click
      Utilities_StopEventPropagation(e);
      e.stopImmediatePropagation();
     
      if (!EditTree.touched)
      {
         EditTree.handlClickOrTouchAction(e.target, e.shiftKey);
      }
   },

   handleTouchStart: function(e)
   {
      EditTree.touched = true;

      setTimeout(function()
      {
         try
         {
            if (EditTree.dragType == EditTree.DragTypeNone)
            {
               EditTree.handlClickOrTouchAction(e.target, FALSE);
            }
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 200);

      if (!EditTree.dragEnable)
      {
         e.stopPropagation();
      }
   },

   handleTouchEnd: function(e)
   {
      setTimeout(function()
      {
         try
         {
            EditTree.touched = false;
            EditTree.dragType = EditTree.DragTypeNone;
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 200);
   },

   multiSelectByCtrl: function(target)
   {
      var include = -1;
      for (var i = 0; i < EditTree.selected.length; i++)
      {
         if (EditTree.selected[i] == target)
         {
            include = i;
            break;
         }
      }

      if (include > -1)
      {
         EditTree.selected.splice(include, 1);
      }
      else
      {
         EditTree.addToSelection(target);
      }
   },

   multiSelectByShift: function(target)
   {
      if (EditTree.selected.length == 0)
      {
         EditTree.multiSelectByCtrl(target);
      }
      else
      {
         // Recreate array between previous element and current element
         var element = EditTree.selected[0];
         EditTree.removeNonSiblingsFromSelection(target);
         
         var spans = document.querySelectorAll('.edittree_draggable,.edittree_selectable');
         
         var first = null;
         var found = false;
         forEach(spans, function (span)
         {
            if (first != null)
            {
               EditTree.addToSelectionIfSibling(span);
            }

            // if we find the original start item, or we find the current item
            if (span == element || span == target)
            {
               if (first != null)
               {
                  first = null;
               }
               else if (!found)   // don't start selection again a second time
               {
                  first = span;
                  found = true;
                  EditTree.addToSelectionIfSibling(span);
               }
            }
         });
      }
   },

   removeNonSiblingsFromSelection: function(target)
   {
      var parent = Utilities_GetParentByTag(target, "UL");
      var idx = 0;
      var changed = false;
      while (idx < EditTree.selected.length)
      {
         if (parent != Utilities_GetParentByTag(EditTree.selected[idx], "UL"))
         {
            EditTree.selected.splice(idx, 1);
            changed = true;
         }
         else
         {
            idx++;
         }
      }

      return EditTree.addToSelection(target) || changed;
   },

   addToSelectionIfSibling: function(target)
   {
      if (EditTree.selected.length && Utilities_GetParentByTag(target, "UL") != Utilities_GetParentByTag(EditTree.selected[0], "UL")) {
         return false;
      }

      return EditTree.addToSelection(target);
   },

   addToSelection: function(target)
   {
      for (idx = 0; idx < EditTree.selected.length; idx++) {
         if (EditTree.selected[idx] == target)
            return false;
      }

      EditTree.selected.push(target);
      return true;
   },

   // ============================================================
   // ghost element for drag...

   ghostElements: [],

   deleteGhostElements: function()
   {
		var ghostEl = document.querySelectorAll('.ghostElement');
		forEach(ghostEl, function(element)
      {
			element.parentNode.removeChild(element);
		});

      EditTree.ghostElements = [];
   },
   
   addGhostEvent: function(clon)
   {
      clon.addEventListener('drop', EditTree.handleDrop, false);
      clon.addEventListener('dragover', EditTree.handleDragOver, false);
   },

   createGhostElements: function()
   {
      EditTree.deleteGhostElements();

      var length = 0;

      forEach(EditTree.draggingItems, function (span, i) 
      {
         var clon;
         if (Class_HasByElement(span, 'edittree_templated'))
         {
            clon = document.querySelector('#' + span.id + "_template").cloneNode(true);
         }
         else
         {
            clon = span.cloneNode(true);
         }
         Class_AddByElement(clon, 'ghostElementNode');
         Class_AddByElement(clon, 'edittree_droppable');   // you can drop on ghost nodes
         clon.style.opacity = '0.5';
         clon.id = 'ghost_' + length;
         var li = document.createElement('li');
         Class_AddByElement(li, 'ghostElement');
         li.appendChild(clon);
         EditTree.addGhostEvent(clon);
         EditTree.ghostElements.push(li);
         length++;
      });
   },

   repositionGhostElement: function()
   {
      var target = EditTree.dropTarget;
      if (EditTree.addType == 'folder')
      {
         EditTree.addItemsToFolder(target, EditTree.ghostElements, false);
      }
      else if (EditTree.addType == 'before')
      {
         EditTree.insertItemsBefore(target, EditTree.ghostElements, false);
      }
      else if (EditTree.addType == 'after')
      {
         EditTree.insertItemsAfter(target, EditTree.ghostElements, false);
      }
   },
   

   // ============================================================
   // Dragging event handlers...
   
   draggingItems: [],

   handleDragStart: function(e)
   {
//      var context = e.currentTarget.dataset.hasOwnProperty('context')
//        ? e.currentTarget.dataset.context
//         : 'NaN';
   
      EditTree.lastStepPosition = {
         x : e.clientX,
         y : e.clientY
      };
      var tree = Utilities_GetElementsByClass('edittree')[0];
      var enabled = !Class_HasByElement(tree, 'edittree_disabled');
      var target = Utilities_GetThisOrParentByClass(e.target, 'edittree_draggable');
   
      // DRL FIXIT! The DragDropTouch.js code sends this event even with no target!
      if ((!enabled || target == null) /*&& context !== 'header'*/)
      {
         e.preventDefault();
         return false;
      }
   
      var dt = e.dataTransfer;
      dt.effectAllowed = 'copyMove';
      
      var userAgent = window.navigator.userAgent;
      var msie = userAgent.indexOf('MSIE ');       //Detect IE
      var trident = userAgent.indexOf('Trident/'); //Detect IE 11
      var edge = userAgent.indexOf('Edge');
      if (msie > 0 || trident > 0 || edge > 0)
      {
         // this is required by IE and Edge...
         dt.setData('text', '');
      }
      else
      {
         // this is required by Firefox...
         dt.setData('text/html', '');
      }

      EditTree.draggingItems = [];

      // see if the dragged item is one of the selected items
      var include = -1;
      for (var i = 0; i < EditTree.selected.length; i++)
      {
         if (EditTree.selected[i] == target)
         {
            include = i;
            break;
         }
      }
      
      // if the dragged item is one of the selected items, then drag all the selected items
      if (include > -1)
      {
         forEach(EditTree.selected, function (span)
         {
            EditTree.draggingItems.push(span);
//            span.style.visibility = 'hidden';
//            span.style.transition = '0.3s';  
         });
      }
      else
      {
         EditTree.draggingItems.push(target);
      }

      if (EditTree.draggingItems.length == 0)
      {
         e.preventDefault();
         return false;
      }

      forEach( EditTree.draggingItems, function(span)
      {
         if (span.dataset.draggable_url)
         {
            let url = span.dataset.draggable_url.substr(span.dataset.draggable_url.toLowerCase().indexOf(':http') + 1);
   
            // the icon that was dragged as well as some other stuff usually appears in the list so remove it
            while (e.dataTransfer.items.length > 0)
               e.dataTransfer.items.remove(0);
            
            // Let's give some different formats depending on what the user may be dragging to...
            e.dataTransfer.setData('DownloadURL', span.dataset.draggable_url);
            e.dataTransfer.setData('text/uri-list', url);

            let thumbnail = span.querySelector('.edit_tree_thumbnail');
            if (thumbnail == null)
            {
               thumbnail = span.querySelector('.edit_tree_icon');
               if (thumbnail == null)
               {
                  thumbnail = document.createElement("img");
                  thumbnail.src = Utilities_ReplaceInString(url, '/Data', '/Thumbnail');
               }
            }
            e.dataTransfer.setDragImage(thumbnail, 0, 0);
         }
      });
/*
      // if we are dragging multiple items, use a special icon
      if (EditTree.selected.length > 1)
      {
         var img = new Image();
         img.src = "img/multiple.jpeg";
         dt.setDragImage(img, -20, -20);
      }
*/
//      if (dt.setDragImage instanceof Function)
//         dt.setDragImage(new Image(), 0, 0);   // don't show anything while dragging
   
      EditTree.dragType = EditTree.DragTypeNormal;
      EditTree.dropType = EditTree.DropNone;
   
      EditTree.initDragItems();

      EditTree.StartScroll(Utilities_GetScrollableParentElement(target));
      
      EditTree.createGhostElements();
      EditTree.repositionGhostElement();
   },

   initDragItems: function()
   {
      // make the dragging items not droppable so you can't drop to self or child of self
      forEach(EditTree.draggingItems, function (item)
      {
         // the children of the dragged item are next to it in the UL 
         // element so we'll go up to the parent to get them all, unless
         // this is a an item dragged from somewhere off the tree in
         // which case the parent won't be an LI element
         if (item.parentNode && item.parentNode.tagName == 'LI')
            item = item.parentNode;
            
         var spans = item.querySelectorAll('.edittree_droppable');
         forEach(spans, function (span)
         {
            Class_AddByElement(span, 'edittree_droppable_temp');
            Class_RemoveByElement(span, 'edittree_droppable');
            setTimeout(function()
            {
               try
               {
                  span.style.display = "none";
               }
               catch (e)
               {
                  Log_WriteException(e);
               }
            }, 0);
         });
         // I'm not sure why we make them not draggable?
         spans = item.querySelectorAll('.edittree_draggable');
         forEach(spans, function (span)
         {
            Class_AddByElement(span, 'edittree_draggable_temp');
            Class_RemoveByElement(span, 'edittree_draggable');
            span.setAttribute("draggable", "false");   // for Firefox
            setTimeout(function()
            {
               try
               {
                  span.style.display = "none";
               }
               catch (e)
               {
                  Log_WriteException(e);
               }
            }, 0);
         });
      });
   },
   
   // NOTE: This can be called multiple times on the same objects!
   uninitDragItems: function()
   {
      // restore the drag/drop settings of the dragging items
      forEach(EditTree.draggingItems, function (item)
      {
         // the children of the dragged item are next to it in the UL 
         // element so we'll go up to the parent to get them all, unless
         // this is a an item dragged from somewhere off the tree in
         // which case the parent won't be an LI element
         if (item.parentNode && item.parentNode.tagName == 'LI')
            item = item.parentNode;
            
         var spans = item.querySelectorAll('.edittree_droppable_temp');
         forEach(spans, function (span)
         {
            Class_AddByElement(span, 'edittree_droppable');
            Class_RemoveByElement(span, 'edittree_droppable_temp');
            span.style.display = "block";
         });
         spans = item.querySelectorAll('.edittree_draggable_temp');
         forEach(spans, function (span)
         {
            Class_AddByElement(span, 'edittree_draggable');
            Class_RemoveByElement(span, 'edittree_draggable_temp');
            span.setAttribute("draggable", "true");   // for Firefox
            span.style.display = "block";
         });
      });
   },
   
   handleDragEnd: function(e)
   {
/*     var context = e.currentTarget.dataset.hasOwnProperty('context')
       ? e.currentTarget.dataset.context
       : 'NaN';
     if (context === 'header') {
       EditTree.EnableEditing();
     }*/

      // DRL FIXIT! The DragDropTouch.js code sends this event even if we're not dragging!
      if (EditTree.dragType == EditTree.DragTypeNone)
         return;

      e.preventDefault();

      if (EditTree.dropTarget)
      {
//         // remove dotted line from target
//         Class_RemoveByElement(EditTree.dropTarget, 'edittree_droptarget');
         EditTree.dropTarget = null;
      }

      
      // remove selection from elements
      EditTree.selected = [];
      EditTree.displaySelectedItems();

      EditTree.deleteGhostElements();
      
      EditTree.uninitDragItems();
      EditTree.draggingItems = [];
      
      EditTree.StopScroll();

      EditTree.addType = '';
      EditTree.lastPosition = {};
      EditTree.lastStepPosition = {};
      EditTree.direction = '';
   
      EditTree.dragType = EditTree.DragTypeNone;
   },

   lastPosition: {},
   lastStepPosition: {},
   direction: '',
   addType: '',
   tabSize: 26,

   handleDragOver: function(e)
   {
      if (EditTree.dragEndTimer)
      {
         // when dragging from another window we often get the case where we get a dragLeave even though there
         // will be lots of valid dragOver afterwards, so in this case we ignore the pending dragEnd
         console.log('still seeing dragOver so canceling pending dragEnd');
         clearTimeout(EditTree.dragEndTimer);
         EditTree.dragEndTimer = null;
      }
      else
      {
         if (EditTree.dragEnterItem == null)
         {
            console.log('handleDragOver skip 1');
            return;
         }
         assert(e.target == EditTree.dragEnterItem);
      }
      
      // this isn't getting called in some cases, perhaps when this dragover handler is applied,
      // so we'll pass it on to update the scrolling
      EditTree.scrollHandler(e);

      if (typeof(EditTree.lastPosition.x) != 'undefined')
      {
         //get the change from last position to this position
         var deltaX = EditTree.lastPosition.x - e.clientX,
             deltaY = EditTree.lastPosition.y - e.clientY;

         //check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
         if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
            EditTree.direction = 'left'
         } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
            EditTree.direction = 'right'
         } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
            EditTree.direction = 'up'
         } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
            EditTree.direction = 'down'
         }
      }

      //set the new last position to the current for next time
      EditTree.lastPosition = {
         x : e.clientX,
         y : e.clientY
      };

      if (EditTree.dragType == EditTree.DragTypeNone ||
         !EditTree.CheckIfDragEnabled() ||
         EditTree.draggingItems.length == 0)
      {
      }
      else
      {
         var found = null;
         var isReposition = false;

         // if we are dragging over a ghost item or one of its children just keep the same drop info from the target
         forEach(EditTree.ghostElements, function (span)
         {
            if (span == e.target || Utilities_HasAsChild(span, e.target))
            {
               found = span;
            }
         });
   
         var target = found
            ? found.firstElementChild
            : Utilities_GetParentsChildByClass(e.target, 'edittree_droppable');

         if (target == null)
         {
            EditTree.dropType = EditTree.DropNone;
            return;
         }

         var temp = null;
         if (e.hasOwnProperty('offsetY'))
         {
            temp = {top: e.offsetX, left: e.offsetY};
         }
         else
         {
            // DRL FIXIT? DragDropTouch.js doesn't seem to provide the offsetY...
            temp = Utilities_GetOffset2(target);
            temp.top = e.clientY - temp.top;
            temp.left = e.clientX - temp.left;
         }
   
         // here we look for a place to drop, and if it isn't good we loop trying again at a higher level
         // in the tree until we run out of options
         do
         {
            var parent = null;
            var saved_dropType = EditTree.dropType;
            var saved_addType = EditTree.addType;
            var saved_dropTarget = EditTree.dropTarget;
            var saved_lastStepPosition = EditTree.lastStepPosition;
            
            if (!found)
            {
               parent = EditTree.GetParentNode(target); // tree root doesn't have a parent or siblings
   
               var siblingNodes = parent ? EditTree.GetChildNodes(parent) : [target];
               var childNodes = EditTree.GetChildNodes(target);

               var cb = EditTree.DropMove;
               forEach(EditTree.dragCallbacks, function(callback)
               {
                  var cb_temp = callback(EditTree.draggingItems, target);
                  if (cb_temp < cb)
                     cb = cb_temp;
               });
               if (cb != EditTree.DropNone)
               {
                  EditTree.addType = 'folder';
               }
               else if (EditTree.direction == 'up')
               {
                  if (temp.top < target.offsetHeight * 2 / 3)
                     EditTree.addType = 'before';
                  else if (childNodes.length == 0 && target == siblingNodes[siblingNodes.length - 1])
                     EditTree.addType = 'after';
               }
               else if (EditTree.direction == 'down')
               {
                  var firstNode = null;
                  for (var i = 0; i < siblingNodes.length; i++)
                  {
                     if (siblingNodes[i].id.startsWith('ghost')) break;
                     firstNode = siblingNodes[i];
                  }
                  (siblingNodes.length > 1 && i == 0) ? (firstNode = siblingNodes[1]) : null;
                  if ((Utilities_GetOffset2(target).top + target.offsetHeight) < e.clientY )
                     EditTree.addType = 'after';
                  else if (target == firstNode)
                     EditTree.addType = 'before';
                  else if (childNodes.length == 0 && temp.top >= target.offsetHeight / 3)
                     EditTree.addType = 'after';
               }
      
               EditTree.dropTarget = target;
               EditTree.lastStepPosition = {
                  x : e.clientX,
                  y : e.clientY
               };
 
               isReposition = true;
            }
            else
            {
               if (EditTree.direction == 'right' && (e.clientX - EditTree.lastStepPosition.x) > EditTree.tabSize)
               {
                  parentNode = EditTree.GetParentNode(target);
                  var siblingNodes = EditTree.GetChildNodes(parentNode);
                  for (var i = 0; i < siblingNodes.length; i ++)
                  {
                     if (target == siblingNodes[i])
                        break;
                  }
                  if (i > 0 && siblingNodes[i - 1].classList.contains('edittree_folder'))
                  {
                     EditTree.addType = 'folder';
                     EditTree.lastStepPosition = {
                        x : e.clientX,
                        y : e.clientY
                     };
                     EditTree.dropTarget = siblingNodes[i - 1];
                     isReposition = true;
                  }
               }
               if (EditTree.direction == 'left' && (EditTree.lastStepPosition.x - e.clientX) > EditTree.tabSize)
               {
                  parent = EditTree.GetParentNode(found);
                  var parent_parent = EditTree.GetParentNode(parent);
                  if (parent && parent_parent && parent.classList.contains('edittree_draggable'))
                  {
                     EditTree.addType = 'after';
                     EditTree.dropTarget = parent;
                     EditTree.lastStepPosition = {
                        x : e.clientX,
                        y : e.clientY
                     };
                     isReposition = true;
                  }
               }
               
               if (!isReposition)   // no change
                  return;
            }
      
            // the callback below wants to be passed the element that the dragged item will be dropped into
            var targ = EditTree.dropTarget;
            if (targ != null && EditTree.addType != 'folder')
               targ = EditTree.GetParentNode(targ);
         
            if (targ == null || !Class_HasByElement(targ, 'edittree_droppable'))
               EditTree.dropType = EditTree.DropNone;
            else
               EditTree.updateDropType(targ);
            
            var done = EditTree.dropType != EditTree.DropNone;
            
            // if we can't drop here keep looking up the tree until we find something
            if (!done)
            {
               if (target == parent)
                  done = true;      // avoid endless loop
               target = parent;
               
               // keep using the last ghost position until we find something new
               EditTree.dropType = saved_dropType;
               EditTree.addType = saved_addType;
               EditTree.dropTarget = saved_dropTarget;
               EditTree.lastStepPosition = saved_lastStepPosition;
            }
            
         } while (target != null && !done);
      
         if (EditTree.dropType == EditTree.DropNone)
            return;
   
         if (EditTree.dropType == EditTree.DropCopy)
            e.dataTransfer.dropEffect = 'copy';
         else
            e.dataTransfer.dropEffect = 'move';

         if (isReposition == true)
            EditTree.repositionGhostElement();
      }

      e.preventDefault();   // allow drop
   },

   getLabel: function(elem)
   {
      if (elem == null)
         return 'null';
   
      let temp = Utilities_GetThisOrParentByClass(elem, 'edittree_file');
      if (temp)
         return temp.tagName + ' ' + temp.id;
      temp = Utilities_GetThisOrParentByClass(elem, 'edittree_folder');
      if (temp)
         return temp.tagName + ' ' + temp.id;
      
      return elem.tagName;
   },
   
   dragEndTimer: null,
   
   handleDragEnter: function(event)
   {
      event.preventDefault();
      
      if (EditTree.dragEndTimer)
      {
         clearTimeout(EditTree.dragEndTimer);
         EditTree.dragEndTimer = null;
      }
      
      // NOTE: sometimes we get the enter for the new area before the leave of the last area, so this handles
      // the leave that we haven't yet received, and we'll ignore it when we do get it later
      if (EditTree.dragEnterItem && EditTree.dragEnterItem != event.target)
      {
         console.log('handleDragEnter skip 1');
         EditTree.dragEnterItem = event.target;
         assert(EditTree.dragEnterItem != null);
         return;
      }
   
      EditTree.direction = '';
      EditTree.dragEnterItem = event.target;
      
      // when dragging from another window we don't get start/end only enter/leave
      if (EditTree.CheckIfDragEnabled() &&   // drag-and-drop allowed
         EditTree.dragType == EditTree.DragTypeNone &&
         (EditTree.CheckIfDraggingFile(event) || EditTree.CheckIfDraggingLink(event)))
      {
         EditTree.dropType = EditTree.DropCopy;
         EditTree.addType = 'folder';
         EditTree.dropTarget = Utilities_GetThisOrParentByClass(event.target, 'edittree_droppable');
         EditTree.lastStepPosition =
         {
            x : event.clientX,
            y : event.clientY
         };
         
         EditTree.draggingItems = [];

         var templateEl = document.querySelector('#file_added_template');
         if (templateEl == null)
         {
            Log_WriteError("Missing template \"file_added_template\" on page!");
            templateEl = document.createElement('div');
         }
   
         var cloneEl = templateEl.cloneNode(true);
         cloneEl.getElementsByClassName('row_label')[0].innerHTML = Str('Drop Here');
         cloneEl.id = 'file_added';

         Class_AddByElement(cloneEl, 'edittree_templated'); // since our item is not in the tree
         Class_AddByElement(cloneEl, 'edittree_draggable');
         Class_AddByElement(cloneEl, 'edittree_droppable');
         Class_AddByElement(cloneEl, 'TreeNode_SourceItem');

         EditTree.draggingItems.push(cloneEl);

         assert(EditTree.CheckIfDraggingFile(event) || EditTree.CheckIfDraggingLink(event));
         EditTree.dragType = EditTree.CheckIfDraggingFile(event) ? EditTree.DragTypeFile : EditTree.DragTypeLink;

         EditTree.initDragItems();

         // DRL FIXIT? Should this be event.target? cloneEl isn't even part of the page!
         EditTree.StartScroll(Utilities_GetScrollableParentElement(cloneEl));
      
         EditTree.createGhostElements();
         EditTree.repositionGhostElement();
      }
   },

   handleDragLeave: function(e)
   {
      // NOTE: sometimes we get the enter for the new area before the leave of the last area, so this skips a
      // leave that was already initiated due to receiving the new DragEnter before it
      if (EditTree.dragEnterItem != event.target)
      {
         console.log('handleDragLeave skip');
         return;
      }
      EditTree.dragEnterItem = null;

      // remote initiated dragging ends when the item leaves
      if (EditTree.dragType != EditTree.DragTypeNone && EditTree.dragType != EditTree.DragTypeNormal)
      {
         // do this on a timer so that if we get a handleDragEnter we can skip it otherwise the positioning
         // of the ghost items gets reset and they don't get positioned well
         if (EditTree.dragEndTimer)
            clearTimeout(EditTree.dragEndTimer);
         EditTree.dragEndTimer = setTimeout(function()
         {
            try
            {
               EditTree.dragEndTimer = null;
               EditTree.handleDragEnd(e);
            }
            catch (e)
            {
               Log_WriteException(e);
            }
         }, 200);
      }
   },

   handleDrop: function(e)
   {
      // DRL FIXIT! The DragDropTouch.js code sends this event even if we're not dragging!
      if (EditTree.dragType == EditTree.DragTypeNone)
         return;

      // DRL FIXIT! The DragDropTouch.js code sends this event even with no target!
      if (!EditTree.dropTarget)
         return;
   
      var target = EditTree.dropTarget;
   
      assert(!Class_HasByElement(target, "ghostElement"));
      assert(!Class_HasByElement(target, "ghostElementNode"));
   
      if (EditTree.dragType == EditTree.DragTypeFile)
      {
         // this will be handled by the dropzone code
         
         // Utilities_StopEventPropagation(e);
         // e.stopImmediatePropagation();
         e.preventDefault();      // prevent default action which could be open link, etc.
         return;
      }
      
      // if we're not dropping in the middle then the parent is the actual target
      var parent = EditTree.addType == 'folder' ? target : EditTree.GetParentNode(target);
      if (!Class_HasByElement(parent, 'edittree_droppable'))
         EditTree.dropType = EditTree.DropNone;
      else
         EditTree.updateDropType(parent);

      if (EditTree.dropType != EditTree.DropNone)
      {
         // we must restore the dragging items to their original state before we copy them below
         // and we should also do this before we hand them off to the callbacks as we don't know
         // what they'll be used for then
         EditTree.uninitDragItems();
   
         if (EditTree.dragType == EditTree.DragTypeNormal)
         {
            // we don't want an array of the wrappers, we want an array of the actual items
            var draggingItems = [];
            forEach(EditTree.draggingItems, function(node)
            {
               // make sure we handle both the data elements and the wrappers here
               draggingItems.push(node.tagName == 'LI' ? node.firstElementChild : node);
            });
      
            var isCopy = EditTree.dropType == EditTree.DropCopy;
            var newItems = [];
            if (EditTree.addType == 'after')
            {
               EditTree.insertItemsAfter(target, draggingItems, isCopy, newItems);
            }
            else if (EditTree.addType == 'folder')
            {
               EditTree.addItemsToFolder(target, draggingItems, isCopy, newItems);
            }
            else if (EditTree.addType == 'before')
            {
               EditTree.insertItemsBefore(target, draggingItems, isCopy, newItems);
            }
      
            forEach(EditTree.dropCallbacks, function(callback)
            {
               callback(draggingItems, newItems, parent);
            });
            
            // allow this to occur asynchronously to allow the page to settle first
            setTimeout(function()
            {
               try
               {
                  forEach(newItems, function (span)
                  {
                     OnElemAdded(span, EditTree.dropType);
                  });
                  FireElemChanged(parent);
               }
               catch (e)
               {
                  Log_WriteException(e);
               }
            }, 200);
         }
         else if (EditTree.dragType == EditTree.DragTypeLink)
         {
            let url = event.dataTransfer.getData('text/uri-list');  // this comes from the drag icon in Chrome
      
            BusyIndicatorStart(Str('Copying...'));
            let params ={
               FromUrl: url,
               ResourceFolderID: EditTree._GetElementID(parent, true),
            };
            ajax.post('/v2/Resources', params, function (resp, httpCode)
            {
               BusyIndicatorStop();
         
               resp = Json_FromString(resp);
         
               if (resp.status != 'success')
               {
                  DisplayMessage(Str('Resource wasn\'t copied: <0>', resp.message), 'error');
               }
               else
               {
                  resp = resp.data;
   
                  assert(EditTree.draggingItems.length == 1);
                  let ghostElem = EditTree.draggingItems[0];
                  EditTree.draggingItems = [];
                  
                  let newElem = EditTree.CreateNewItem(parent, 'file_' + resp.ResourceID, 'file', resp.Name, false, EditTree.DropNone);
                  
                  let ul = parent.nextElementSibling;
                  assert(ul.tagName == 'UL');
                  let ghostLi = Utilities_GetElementsByClass('ghostElement', 'LI', ul, true)[0];
                  assert(ghostLi.tagName == 'LI');
                  newElem = newElem.parentNode;
                  assert(newElem.tagName == 'LI');
                  
                  // move the new elements LI parent to the correct spot, right before the ghost elements LI parent
                  ul.insertBefore(newElem, ghostLi);
               }
   
               if (!EditTree.dragEndTimer)
                  EditTree.dragEndTimer = setTimeout(function()
                  {
                     try
                     {
                        EditTree.dragEndTimer = null;
                        EditTree.handleDragEnd(e);
                     }
                     catch (e)
                     {
                        Log_WriteException(e);
                     }
                  }, 200);
            });
         }
         else
         {
            assert(0);  // unexpected drag type
         }
      }

      // Utilities_StopEventPropagation(e);
      // e.stopImmediatePropagation();
      e.preventDefault();      // prevent default action which could be open link, etc.
   },

   // ============================================================
   // Dragging helpers...
   
   // ============================================================
   // Tree insertion helpers...
   
   new_id: 0,
   
   getListElementToPaste: function(node, isCopy, newItems)
   {
      var addedTarget = null;
      
      // NOTE: This method should be passed the actual element, but the "ghost" code calls this method
      // with the LI wrapper.
      var span = node.tagName == 'LI' ? node.firstElementChild : node;
   
      if (isCopy || Class_HasByElement(span, 'edittree_templated') || Class_HasByElement(span, 'edittree_nottemplated'))
      {
         if (Class_HasByElement(span, 'edittree_templated'))
         {
            span = document.querySelector('#' + span.id + "_template").cloneNode(true);
            Class_RemoveByElement(span, "edittree_templated");
         }
         else
         {
            span = span.cloneNode(true);
            
            if (Class_HasByElement(span, 'edittree_nottemplated'))
            {
               Class_RemoveByElement(span, "edittree_nottemplated");
               
               // non-templated items can't have the droppable attribute otherwise you'd be able to drop onto them so we add it here
               Class_AddByElement(span, "edittree_droppable");
            }
         }
   
         if (isCopy)
            span.dataset.source_id = span.id; // save the source ID so the callback can access it
         EditTree.new_id++;
         span.id = "new_" + EditTree.new_id;

         addedTarget = document.createElement("LI");
         addedTarget.appendChild(span);

         EditTree.setupDragElement(span);

         Class_RemoveByElement(span, "edittree_selecteditem");

         if (newItems != null)
            newItems.push(span);
      }
      else 
      {
         // already on the tree
         addedTarget = Utilities_GetThisOrParentByTag(span, "LI");
      }

      return addedTarget;
   },

   insertItemsAfter: function(node, items, isCopy, newItems)
   {
      var ul = null;
      var dest_li = Utilities_GetThisOrParentByTag(node, "LI");
      if (dest_li == null)
      {
         // tree root
         ul = node.parentElement.querySelector('ul');
      }
      else
      {
         ul = Utilities_GetParentByTag(dest_li, "UL");
      }

      for (var i = items.length - 1; i >= 0; i--)
      {
         var span = items[i];
         var new_li = EditTree.getListElementToPaste(span, isCopy, newItems);
         if (dest_li != null && dest_li.nextElementSibling)
         {
            ul.insertBefore(new_li, dest_li.nextElementSibling);
         } 
         else 
         {
            ul.appendChild(new_li);
         }
      }
   },

   insertItemsBefore: function(node, items, isCopy, newItems)
   {
      // don't allow inserting above the root node
      if (Utilities_GetThisOrParentByTag(node, "LI") == null)
//      if (!Class_HasByElement(node, "edittree_draggable"))
      {
         return;
      }
      var ul = null;
      var dest_li = Utilities_GetThisOrParentByTag(node, "LI");
      if (dest_li == null)
      {
         // tree root
         ul = node.parentElement;
         if (ul.tagName != 'UL')
            ul = ul.querySelector('ul');
      }
      else
      {
         ul = Utilities_GetParentByTag(dest_li, "UL");
      }
   
      forEach(items, function (span)
      {
         var new_li = EditTree.getListElementToPaste(span, isCopy, newItems);
         if (dest_li != null) 
         {
            ul.insertBefore(new_li, dest_li);
         }
         else
         {
            ul.appendChild(new_li);
         }
      });
   },
   
   addItemsToFolder: function(node, items, isCopy, newItems)
   {
      var ul = null;
      var dest_li = Utilities_GetThisOrParentByTag(node, "LI");
      if (dest_li == null)
      {
         // tree root
         dest_li = node.parentElement;
      }
      
      ul = dest_li.querySelector('.edittree_folder + ul');  // added edittree_folder to skip UL as a menu
      if (ul == null)
      {
         ul = document.createElement("UL");
         dest_li.appendChild(ul);
      }
   
      forEach(items, function (span)
      {
         var new_li = EditTree.getListElementToPaste(span, isCopy, newItems);
         if (new_li != node)   // skip dropping on self
         {
            ul.appendChild(new_li);
         }
      });
   },

   displaySelectedItems: function()
   {
      var temp = document.querySelectorAll('.edittree_draggable,.edittree_selectable');
      
      // Remove borders
      forEach(temp, function (span) 
      {
         if (String(span.id).search('_template') == -1)    // skip templates
         {
            Class_RemoveByElement(span, "edittree_selecteditem");
         }
      });
      
      // Add border to new selected elements
      forEach(EditTree.selected, function (span) 
      {
         Class_AddByElement(span, "edittree_selecteditem");
      });

      forEach(EditTree.selectionCallbacks, function(callback)
      {
         callback(null);
      });
   },
   
   _GetElementID: function(elem, strip_id_prefix)
   {
      if (strip_id_prefix === false) return elem.id;

      var substrs = elem.id.split("_");
      var id = substrs[substrs.length - 1];
      if (substrs[0] == "new") 
      {
         id = "-" + id;   // use negative number for newly added items
      }
      return id;
   },

   // the cell passed in is the LI element (or the DIV for the root)
   _SaveNode: function(cell, strip_id_prefix, dataKeys, result)
   {
      var children = [];
      var ulNode = null;
      
      if (cell.tagName == 'LI')   // if first item is LI then this isn't the root
      {
         var dataNode = cell.firstElementChild;

         var dataset = dataNode.dataset;

/* DRL FIXIT? I think this was added so a node cold have an edit box for the label and other properties that
   the user can edit but this is not the correct place for this logic. If we need this behavior the logic
   should be pushed into a callback.
         // take the existing configuration and add/replace any input fields to it
         var fields = Form_GetValues(dataNode);
         for (var property in fields) 
         {
            if (fields.hasOwnProperty(property)) 
            {
               config[property] = fields[property];
            }
         }
*/
         var nodeData = 
         {
            NodeID: EditTree._GetElementID(dataNode, strip_id_prefix),
            Children: children
         };
   
         if (dataKeys != null)
         {
            for (const i in dataKeys)
            {
               let dest = dataKeys[i];
               let destType = null;
               let destKey = i;
               if (dest.indexOf(' ') != -1)
               {
                  destType = dest.split(' ')[0];
                  destKey = dest.split(' ')[1];
               }
               
               if (dataset.hasOwnProperty(i))
               {
                  if (destType == 'json')
                     nodeData[destKey] = Json_FromString(dataset[i]);
                  else
                     nodeData[destKey] = dataset[i];
               }
            }
         }
         
         result.push(nodeData);   // push it ahead so the nodes are in the same order as parsed
         
         ulNode = dataNode.nextElementSibling;
         assert(ulNode == null || ulNode.tagName == 'UL');
      }
      else
      {
         // root node
         ulNode = cell;
         while (ulNode != null && ulNode.tagName != 'UL')
         {
            ulNode = ulNode.nextElementSibling;
         }
      }
      
      if (ulNode != null)
      {
         for (var i = 0; i < ulNode.children.length; i++)
         {
            var childNode = ulNode.children[i];
   
            if (!Class_HasByElement(childNode, 'ghostElement') &&   // skip any left over ghost nodes
               childNode.firstElementChild != null)   // DRL FIXIT! this is a workaround for a bug that seems to happen when we drag files over to a new folder?
            {
               // this pushes the children onto the array that we put (by reference) into the parent
               children.push(EditTree._GetElementID(childNode.firstElementChild, strip_id_prefix));
   
               EditTree._SaveNode(childNode, strip_id_prefix, dataKeys, result);
            }
         }
      }
   },
   
   // ============================================================
   // Public methods...
   
   IsEditing: function()
   {
      return EditTree.dragEnable;
   },
   
   ToggleEditing: function()
   {
      if (EditTree.dragEnable)
      {
         // event.currentTarget.innerHTML = 'Edit';
         EditTree.DisableEditableTree();
      }
      else
      {
         // event.currentTarget.innerHTML = 'Done';
         EditTree.EnableEditableTree();
      }
   },

   EnableEditableTree: function()
   {
      if (!EditTree.dragEnable)
      {
         var tree = Utilities_GetElementsByClass('edittree')[0];
   
         Class_RemoveByElement(tree, 'edittree_disabled');
         EditTree.dragEnable = true;
         
         var draggables = document.querySelectorAll('.edittree_draggable');
         forEach(draggables, function (draggable)
         {
            draggable.setAttribute("draggable", "true");   // for Firefox
            forEach(draggable.children, function (child)
            {
               // This seems required for MS Edge?
               child.setAttribute("draggable", "true");
            });
         });

         EditTree.EnableDropzone();
      }
   },

   DisableEditableTree: function()
   {
      if (EditTree.dragEnable)
      {
         var tree = Utilities_GetElementsByClass('edittree')[0];
   
         Class_AddByElement(tree, 'edittree_disabled');
         EditTree.dragEnable = false;
      
         var draggables = document.querySelectorAll('.edittree_draggable');
         forEach(draggables, function (draggable)
         {
            draggable.setAttribute("draggable", "false");   // for Firefox
            forEach(draggable.children, function (child)
            {
               // This seems required for MS Edge?
               child.setAttribute("draggable", "false");
            });
         });
   
         EditTree.DisableDropzone();
      }
   },

   UploadURLToDropzone: function(elem, url, folderID)
   {
      // add progress bar
      var progress = document.createElement('div');
      Class_AddByElement(progress, 'uploadProgress');
      progress.style.width = 0;
      elem.appendChild(progress);

      // initialize dropzone
      var dropzone = new Dropzone('#' + elem.id, {
         elementID: elem.id,
         url: 'Api.php?Action=AddResource',
         paramName: 'File',
         forceFallback: false,
         chunking: true,
         forceChunking: true,
         chunkSize: 500000,
         retryChunks: true,
         parallelUploads: 1,
         previewTemplate: `<div></div>`,
         params: function(files, xhr, chunk)
         {
            // this method gets called before each chunk is sent to the server and what we return
            // here gets sent to the server as data fields that it can use to process the chunk
            if (chunk) {
               return {
                  ClientFileID: chunk.file.upload.uuid,
                  Filename: chunk.file.name,
                  FileSize: chunk.file.totalSize,
                  SequenceNumber: chunk.index,
                  SequenceOffset: chunk.index * this.options.chunkSize,
                  // we want a new resource ID to be created once the file is uploaded
                  AddResource: true
               };
            }
         },
         chunksUploaded: function(file, done)
         {
            done();
         },
         init: function() {
            this.on('uploadprogress', function(file, progress, bytesSent)
            {
               progress = bytesSent / file.totalSize * 100;
               elem.getElementsByClassName('uploadProgress')[0].style.width = (progress + "%");
            });

            this.on("sending", function(file, xhr, formData)
            {
               formData.append('ResourceFolderID', folderID);
               formData.append('Conflict', 'replace');
            });
            
            this.on('success', function(file)
            {
               var response = JSON.parse(file.xhr.responseText);
               if (response.status == 'success' && elem) {
                  elem.id = 'file_' + response.data.ResourceID;

                  // remove progress bar
                  var progressElement = elem.getElementsByClassName('uploadProgress')[0];
                  progressElement.parentNode.removeChild(progressElement);

                  // replace file name
                  var nameElement = elem.getElementsByClassName('row_label')[0];
                  nameElement.innerHTML = response.data.Name;
               }
            });
         }
      });

      dropzone.addFile(url);
   },

   EnableDropzone: function()
   {
      var tree = Utilities_GetElementsByClass('edittree')[0];
      Class_AddByElement(tree, 'dropzone');
      tree.id = 'edittree_dropzone';

      if (tree.dropzone)
      {
         tree.dropzone.destroy();
      }

      new Dropzone('#' + tree.id,
      {
         elementID: tree.id,
         url: 'Api.php?Action=AddResource',
         paramName: 'File',
         maxFiles: 1,
         maxFilesize: 2000,    // 2GB (about an hour of video) must match $MaxResourceSize in PHP
         chunkSize: 1000000,   // 1MB
         forceFallback: false, // used to test the case where the browser doesn't support drag-n-drop
         chunking: true,
         forceChunking: true,  // seems our code doesn't currently work in non-chunk mode
         retryChunks: true,
         parallelUploads: 1,
         autoProcessQueue: false,
         previewTemplate: `<div></div>`,

         params: function(files, xhr, chunk)
         {
            // this method gets called before each chunk is sent to the server and what we return
            // here gets sent to the server as data fields that it can use to process the chunk
            if (chunk) {
               return {
                  ClientFileID: chunk.file.upload.uuid,
                  Filename: chunk.file.name,
                  FileSize: chunk.file.size,
                  SequenceNumber: chunk.index,
                  SequenceOffset: chunk.index * this.options.chunkSize,
                  // we want a new resource ID to be created once the file is uploaded
                  AddResource: true
               };
            }
         },
         chunksUploaded: function(file, done)
         {
            done();
         },
         init: function()
         {
            var myDropzone = this;
            var draggingItems = [];

            function containsFile(uuid, list) {
               var i;
               for (i = 0; i < list.length; i++) {
                   if (list[i].clientFileID === uuid) {
                     list[i].processed = true;
                     return true;
                  }
               }
               return false;
            }

            this.on('drop', function(event)
            {
               if (EditTree.dragType != EditTree.DragTypeFile)
               {
                  return;
               }
               if (EditTree.ghostElements[0].parentNode == null)
               {
                  // this sometimes happened when dragging a file and dropping it quickly onto the page, and also
                  // when dropping an item onto a quiz that shouldn't be dropped (hence the DropNone)
                  assert(EditTree.dropType == EditTree.DropNone);
                  return;
               }
               event.preventDefault();
               if (EditTree.CheckIfDraggingFile(event))   // we are dropping files and folders from the file system
               {
                  var parentNode = EditTree.GetParentNode(EditTree.ghostElements[0]);
                  EditTree.draggedParentFolderID = parentNode.id.startsWith('folder_') ? parseInt(parentNode.id.split('_')[1]) : -1;

                  if (EditTree.draggedParentFolderID == null || EditTree.draggedParentFolderID == -1)
                     EditTree.fileList = [];
               }
               setTimeout(function()
               {
                  try
                  {
                     if (EditTree.draggedParentFolderID == -1) return;
   
                     var chain = Promise.resolve(0);
                     var overwriteList = [];
                     var cancelList = [];
   
                     myDropzone.files.forEach(function (file)
                     {
                        var path = file.fullPath ? file.fullPath : file.name;
                        var splits = path.split('/');
                        var index = 0;
                        var fileList = EditTree.fileList;
                        var parentFolderID = EditTree.draggedParentFolderID;
   
                        chain = chain.then(function (idx)
                        {
                           return 0;
                        });
   
                        while(index < splits.length)
                        {
                           var name = splits[index];
                           if (index == splits.length - 1)     // this is file
                           {
                              chain = chain.then(function (idx)
                              {
                                 return new Promise(function (resolve)
                                 {
                                    ajax.post(
                                       '/Api.php?Action=GetResources&Filter={%22ResourceFolderID%22%3A%22' + parentFolderID + '%22%2C%22Name%22%3A%22' + name + '%22}', {},
                                       function(data, httpCode) {
                                          data = JSON.parse(data);
                                          resolve(data);
                                       }
                                    )
                                 })
                                 .then(function (data) {
                                    if (data.status == 'success')
                                    {
                                       var resources = data.data.resources;
                                       if (resources.length === 0)  // this means the file is not existing on db
                                       {
                                          if (!containsFile(file.upload.uuid, fileList))
                                          {
                                             fileList.push({
                                                type: 'file',
                                                name: name,
                                                folderID: parentFolderID,
                                                clientFileID: file.upload.uuid,
                                                processed: false,
                                                id: null
                                             });
                                          }
                                       }
                                       else if (!containsFile(file.upload.uuid, fileList))                    // this means the file is existing on db
                                       {
                                          if (idx !== 0)
                                          {
                                             fileList.push({
                                                type: 'file',
                                                name: name,
                                                folderID: parentFolderID,
                                                clientFileID: file.upload.uuid,
                                                processed: false,
                                                id: resources[Object.keys(resources)[0]].ResourceID
                                             });
                                          }
                                          else                 // if this is root item(file)
                                          {
                                             var confirm = window.confirm(Str("There is already a resource named \"<0>\". Do you want to overwrite it?", name));
                                             if (confirm === false)
                                             {
                                                myDropzone.removeFile(file);
                                             }
                                             else
                                             {
                                                if (!containsFile(file.upload.uuid, fileList))
                                                {
                                                   fileList.push({
                                                      type: 'file',
                                                      name: name,
                                                      folderID: parentFolderID,
                                                      clientFileID: file.upload.uuid,
                                                      processed: false,
                                                      id: resources[Object.keys(resources)[0]].ResourceID
                                                   });
                                                }
                                             }
                                          }
                                       }
                                    }
                                    return idx+1;
                                 });
                              });
                           }
                           else                          // else is folder
                           {
                              chain = chain.then(function (idx)
                              {
                                 return new Promise(function (resolve)
                                 {
                                    ajax.post(
                                       '/Api.php?Action=GetResourceFolders&Filter={%22ParentResourceFolderID%22%3A%22' + parentFolderID + '%22%2C%22Name%22%3A%22' + name + '%22}', {},
                                       function(data, httpCode)
                                       {
                                          data = JSON.parse(data);
                                          resolve(data);
                                       }
                                    );
                                 })
                                 .then(function (data) {
                                    var folders = data.data.folders;
                                    if (folders.length != 0) {
                                       var exist = fileList.find(function (folder)
                                       {
                                          return folder.id === folders[0].ResourceFolderID;
                                       });
                                       return new Promise(function (resolve) {
                                          if (exist) {
                                             parentFolderID = folders[0].ResourceFolderID;
                                          } else {
                                             fileList.push({
                                                type: 'folder',
                                                name: name,
                                                folderID: parentFolderID,
                                                id: folders[0].ResourceFolderID
                                             });
                                             parentFolderID = folders[0].ResourceFolderID;
   
                                             if (overwriteList.includes(folders[0].ParentResourceFolderID) === true)
                                                overwriteList.push(folders[0].ResourceFolderID);
                                             if (cancelList.includes(folders[0].ParentResourceFolderID) === true)
                                                cancelList.push(folders[0].ResourceFolderID);
   
                                             if (overwriteList.includes(folders[0].ResourceFolderID) === false &&
                                                cancelList.includes(folders[0].ResourceFolderID) === false)
                                             {
                                                var confirm = window.confirm(Str("There is already a folder named \"<0>\". Do you want to overwrite it?", name));
                                                if (confirm === true) overwriteList.push(folders[0].ResourceFolderID);
                                                else cancelList.push(folders[0].ResourceFolderID);
                                             }
                                             
                                             if (cancelList.includes(folders[0].ResourceFolderID))
                                                myDropzone.removeFile(file);
                                          }
                                          resolve();
                                       })
                                       .then(function ()
                                       {
                                          return idx + 1;
                                       });
                                    } else {
                                       return new Promise(function (resolve)
                                       {
                                          ajax.post(
                                             '/Api.php?Action=AddResourceFolder',
                                             {
                                                'ParentResourceFolderID': parentFolderID,
                                                'Name': name
                                             },
                                             function(data, httpCode) {
                                                data = JSON.parse(data);
                                                resolve(data);
                                             }
                                          )
                                       })
                                       .then(function (response)
                                       {
                                          if (response.status == 'success') {
                                             fileList.push({
                                                type: 'folder',
                                                name: name,
                                                folderID: parentFolderID,
                                                id: response.data.ResourceFolderID
                                             });
                                             parentFolderID = response.data.ResourceFolderID;
                                          }
                                          return idx+1;
                                       });
                                    }
                                 });
                              });
                           }
                           index ++;
                        }
                     });
   
                     chain.then(function () {
                        // create folder and file structure on the edit tree with template elements
                        var container = document.createElement('li');
                        var generateFolderStructure = function(list, parentID, el)
                        {
                           list.forEach(function (item)
                           {
                              if (item.folderID === parentID)
                              {
                                 if (item.type === 'file' && item.processed === false)
                                 {
                                    if (item.id === null)
                                    {
                                       // DRL FIXIT? I'm not sure the ID being passed here is correct?
                                       EditTree.CreateNewItem(el, item.clientFileID, 'file', item.name, true, EditTree.DropNone);
                                    }
                                    else
                                    {
                                       var fileEl = document.querySelector('#file_' + item.id);
                                          var progress = document.createElement('div');
                                          Class_AddByElement(progress, 'uploadProgress');
                                          progress.style.width = 0;
                                       fileEl ? fileEl.appendChild(progress) : null;
                                       fileEl ? fileEl.id = item.clientFileID : null;
                                    }
                                 }
                                 else if (item.type === 'folder')
                                 {
                                    var folder = document.querySelector('#folder_' + item.id);
                                    var currentEl;
                                    if (folder)
                                       currentEl = folder.nextSibling;
                                    else
                                    {
                                       currentEl = document.createElement('ul');
                                       var currentDiv = document.querySelector('#folder_added_template').cloneNode(true);
                                       currentDiv.getElementsByClassName('row_label')[0].innerHTML = item.name;
                                       currentDiv.id = 'folder_' + item.id;
         
                                       var li = document.createElement('li');
                                       li.appendChild(currentDiv);
                                       li.appendChild(currentEl);
         
                                       el.appendChild(li);
   
                                       EditTree.setupDragElement(currentDiv);
                                    }
                                    generateFolderStructure(list, item.id, currentEl);
                                 }
                              }
                           });
                        }
   
                        generateFolderStructure(EditTree.fileList, EditTree.draggedParentFolderID, container);
   
                        // the result of the above is one or more <LI> inside an <LI> container and we only want the interior one
                        if (container.children.length > 0)
                        {
                           var ghostEl = document.querySelectorAll('.ghostElement');
                           assert(ghostEl.length == 1);
                           // I use the parent/next here because the ghost element seems to get
                           // destroyed below in the loop somehow (callback?)
                           var parent = ghostEl[0].parentNode;
                           var last = ghostEl[0].nextElementSibling;
                           assert(parent.tagName == 'UL')
   
                           while (container.children.length)
                           {
                              var elem = container.children[container.children.length-1];
                              assert(elem.tagName == 'LI');
                              assert(elem.innerText.length != 0); // why this?
                              parent.insertBefore(elem, last);
                              last = elem;
                           }
                        }
   
                        EditTree.deleteGhostElements();
   
                        // upload files manually
                        myDropzone.processQueue();
                     })
                  }
                  catch (e)
                  {
                     Log_WriteException(e);
                  }
               }, 200);
            });
            this.on("sending", function(file, xhr, formData)
            {
               assert(file.upload != undefined);
               var sendingFile = EditTree.fileList.find(function (f) 
               {
                  return f.type === 'file' && f.clientFileID === file.upload.uuid;
               });
               
               if (sendingFile)
               {
                  formData.append('ResourceFolderID', sendingFile.folderID);
                  formData.append('Conflict', 'replace');
               }
            });
            this.on('uploadprogress', function(file, progress, bytesSent)
            {
               assert(file.upload != undefined);
               progress = bytesSent / file.size * 100;
               var uploadEl = Utilities_GetElementById(file.upload.uuid);
               if (uploadEl)
                  uploadEl.getElementsByClassName('uploadProgress')[0].style.width = (progress + "%");
            });
            this.on('success', function(file)
            {
               myDropzone.options.autoProcessQueue = true;
               var uploadEl = Utilities_GetElementById(file.upload.uuid);
               var response = JSON.parse(file.xhr.responseText);
               if (response.status == 'success' && uploadEl) {
                  uploadEl.id = 'file_' + response.data.ResourceID;
         
                  // remove progress bar
                  var progressElement = uploadEl.getElementsByClassName('uploadProgress')[0];
                  progressElement.parentNode.removeChild(progressElement);
         
                  draggingItems.push(uploadEl);
               }
            });
            this.on('error', function(file, errorMessage)
            {
               alert("error: " + errorMessage);
            });
            this.on('queuecomplete', function()
            {
               // initialized variables so that we can continue drag and drop

               myDropzone.options.autoProcessQueue = false;
               myDropzone.files = [];
               EditTree.fileList = [];
               EditTree.draggedParentFolderID = -1;
            });
         }
      });
   },

   DisableDropzone: function()
   {
      var tree = Utilities_GetElementsByClass('edittree')[0];
      Class_RemoveByElement(tree, 'dropzone');
      if (tree.dropzone)
      {
         tree.dropzone.destroy();
      }

      window.addEventListener("dragover", function(e)
      {
         e = e || event;
         e.preventDefault();
      }, false);
      window.addEventListener("drop", function(e)
      {
         e = e || event;
         e.preventDefault();
      }, false);
   },

   CheckIfDraggingFile: function(e)
   {
      var dt = e && e.dataTransfer;
      var isFile = dt && dt.types && Utilities_ArrayContains(dt.types, "Files");
      return isFile;
   },
   
   CheckIfDraggingLink: function(e)
   {
      var dt = e && e.dataTransfer;
      var isLink = dt && dt.types && Utilities_ArrayContains(dt.types, "text/uri-list");
      return isLink;
   },
   
   CheckIfDragEnabled: function()
   {
      var tree = document.getElementsByClassName('edittree')[0];
      var enabled = !tree.className.includes('edittree_disabled');
      return enabled;
   },
   
   GetIds: function(root)
   {
      // the children of the item are next to it in the UL
      // element so we'll go up to the parent to get them all
      var parent = root;
      if (parent.parentNode.tagName == 'LI')
         parent = parent.parentNode;

      var temp = parent.querySelectorAll('.edittree_draggable');
      
      var result = [];
      forEach(temp, function(elem)
      {
         // the root element will appear if we went up one element to get the LI, so strip it
         if (elem.id != root.id && String(elem.id).search('_template') == -1)   // skip templates
         {
            result.push(elem.id);
         }
      });
      return result;
   },
   
   GetFilteredIds: function(root)
   {
      var temp = Utilities_GetElementsByClass('edittree_draggable', null, root);
      
      var result = [];
      forEach(temp, function(elem)
      {
         if (Visibility_IsShownByElement(elem.parentNode))
         {
            if (String(elem.id).search('_template') == -1)   // skip templates
            {
               result.push(elem.id);
            }
         }
      });
      return result;
   },
   
   GetSelectedIds: function(root)
   {
      var result = [];
      forEach(EditTree.selected, function(elem)
      {
         assert(String(elem.id).search('_template') == -1);   // skip templates
         result.push(elem.id);
      });
      return result;
   },
   
   SelectIds: function(ids, root)
   {
      var changed = false;
   
      var temp = Utilities_GetElementsByClass('edittree_draggable', null, root);
   
      forEach(ids, function(id)
      {
         assert(String(id).search('_template') == -1);   // skip templates
   
         forEach(temp, function(elem)
         {
            if (elem.id == id)
            {
               if (EditTree.addToSelection(elem))
                  changed = true;
            }
         });
      });
      
      // Reset border to selected elements
      if (changed)
         EditTree.displaySelectedItems();
   },
   
   UnselectIds: function(ids, root)
   {
      var changed = false;
   
      forEach(ids, function(id)
      {
         forEach(EditTree.selected, function(elem)
         {
            if (elem.id == id)
            {
               Utilities_RemoveFromArray(EditTree.selected, elem);
               changed = true;
            }
         });
      });

      // Reset border to selected elements
      if (changed)
         EditTree.displaySelectedItems();
   },

   // item passed is the tree div, returns JSON, dataKeys is array of items to save from the element data and can
   // contain a destination type to perform some conversion such as:
   //
   // var result = EditTree.SaveTree(tree, false,
   //    {
   //       'entries' : 'Entries',        take elem.data.entries and store it in result[i].Entries
   //       'config' : 'json Config',     this will be converted to JSON before storing in result[i].Config
   //    });
   SaveTree: function(root, strip_id_prefix, dataKeys)
   {
      var result = [];
      if (root.firstElementChild)
         EditTree._SaveNode(root.firstElementChild, strip_id_prefix, dataKeys, result);
      return result;
   },
   
   // this handles templated items too
   AddNewItem: function(elem, parentElem, root, dropType)
   {
      assert(Class_HasByElement(parentElem, 'edittree_droppable'));
      var target = Utilities_GetThisOrParentByClass(parentElem, 'edittree_droppable');
      assert(target != null);

      var isCopy = dropType == EditTree.DropCopy || dropType == EditTree.ServerCopy;
      var newItems = [];
      if (Class_HasByElement(target, "edittree_folder"))
      {
         EditTree.addItemsToFolder(target, [elem], isCopy, newItems);
      }
      else
      {
         EditTree.insertItemsAfter(target, [elem], isCopy, newItems);
      }
      
// Doing this async caused issues with Quiz designer when copying questions.
//      // allow this to occur asynchronously to allow the page to settle first
//      setTimeout(function()
//      {
         forEach(newItems, function (span)
         {
            OnElemAdded(span, dropType);
         });
         FireElemChanged(target);
//      }, 200);
      
      return Utilities_GetElementById("new_" + EditTree.new_id);
   },
   
   
   CopyChildren: function(sourceParent, destination, root, recursive, serverCopiesItem)
   {
      var children = EditTree.GetChildNodes(sourceParent);
      
      forEach(children, function(child)
      {
         var newElem = EditTree.CopyAndAddNewItem(child, destination, root, recursive,
            serverCopiesItem, serverCopiesItem);  // returns new cloned element with new ID and dataset.source_id
      });
   },

   CopyAndAddNewItem: function(elem, parentElem, root, recursive, serverCopiesItem, serverCopiesChildren)
   {
      if (recursive == null) recursive = false;
      
      assert(!Class_HasByElement(elem, "edittree_nottemplated"));
      assert(!Class_HasByElement(elem, "edittree_templated"));
      Class_AddByElement(elem, "edittree_nottemplated");                    // force the call below to create a copy
      var newElem = EditTree.AddNewItem(elem, parentElem, root,
         serverCopiesItem ? EditTree.ServerCopy : EditTree.DropCopy);      // returns new cloned element with new ID
      Class_RemoveByElement(elem, "edittree_nottemplated");                 // restore classes
      if (recursive)
      {
         var children = EditTree.GetChildNodes(elem);
         forEach(children, function (child)
         {
            EditTree.CopyAndAddNewItem(child, newElem, root, recursive, serverCopiesChildren, serverCopiesChildren);
         });
      }
      return newElem;
   },
   
   // NOTE: folder parameter can be the parent folder to contain the new item or it can be an empty LI that
   // is a temporary placeholder for the new item, and if id is null then a new id will be generated.
   // DRL FIXIT? It seems weird to me that we're placing an LI inside an LI as described above?
   CreateNewItem: function(folder, id, type, name, showProgress, dropType)
   {
      if (id == null)
      {
         EditTree.new_id++;
         id = "new_" + EditTree.new_id;
      }
   
      if (folder.tagName != 'LI')
      {
         var orig = folder;
         while (folder != null && folder.tagName != 'UL')
         {
            folder = folder.nextElementSibling;
         }
         if (folder == null)
         {
            folder = document.createElement("UL");
            orig.parentNode.appendChild(folder);
         }
      }
   
      var templateEl = document.querySelector('#' + type + '_added_template');
      if (templateEl == null)
      {
         // if it's not one of our recognized templates it's likely something like "link_video" that uses "file" instead
         templateEl = document.querySelector('#file_added_template');
         if (templateEl == null)
         {
            Log_WriteError("Missing template \"file_added_template\" on page!");
            return null;
         }
      }

      var fileEl = document.createElement('li');
      var cloneEl = templateEl.cloneNode(true);
      if (showProgress)
      {
         var progress = document.createElement('div');
         Class_AddByElement(progress, 'uploadProgress');
         progress.style.width = 0;
         cloneEl.appendChild(progress);
      }
      let labels = cloneEl.getElementsByClassName('row_label');
      if (labels.length > 0)
         cloneEl.getElementsByClassName('row_label')[0].innerHTML = name;
      cloneEl.id = id;
      fileEl.appendChild(cloneEl);
      
      folder.appendChild(fileEl);

      EditTree.setupDragElement(cloneEl);

      Class_RemoveByElement(cloneEl, "edittree_selecteditem");

      // DRL FIXIT? Should we be calling the callbacks and FireElemChanged() here?
      
      OnElemAdded(cloneEl, dropType);

      return cloneEl;
   },
   
   DeleteItems: function(ids, root)
   {
      if (ids.length == 0) return;
      
      forEach(ids, function (id)
      {
         var span = Utilities_GetElementById(id);
         if (span)
         {
            span.parentElement.remove(span);
            Utilities_RemoveFromArray(EditTree.selected, span);
         }
      });
      
      // Reset border to selected elements
      EditTree.displaySelectedItems();
   
      var tree = Utilities_GetElementsByClass('edittree')[0];
      FireElemChanged(tree);
   },
   
   GetParentNode: function(elem)
   {
      // check that the element is in a tree!
      assert(Utilities_GetParentByClass(elem, 'edittree') != null);
      
      var ul = Utilities_GetParentByTag(elem, "UL");
      if (ul == null)
         return null;
      return ul.previousElementSibling;
   },
   
   GetChildNodes: function(elem)
   {
      var children = [];
   
      // check that the element is in a tree!
      // OR the element is a template (templates aren't under a tree)
      assert(Utilities_GetParentByClass(elem, 'edittree') != null || Utilities_GetParentByClass(elem, 'header_templates') != null);
      
      var ulNode = elem;
      while (ulNode != null && ulNode.tagName != 'UL')
      {
         ulNode = ulNode.nextElementSibling;
      }
      
      if (ulNode != null)
      {
         for (var i = 0; i < ulNode.children.length; i++)
         {
            var childNode = ulNode.children[i];
            if (childNode.firstElementChild == null || childNode.firstElementChild.style.display === 'none')
               continue;
            else
               children.push(childNode.firstElementChild);
         }
      }
      
      return children;
   },
   
   Filter: function(searchString, searchClasses)
   {
      if (searchClasses == null)
         searchClasses = new Array();
         
      if (empty(searchString) && searchClasses.length == 0)
      {
         EditTree.ClearFilter();
      }
      else
      {
         if (EditTree._timer)
            clearTimeout(EditTree._timer);            
         
         EditTree._searchClasses = searchClasses;
         EditTree._searchString = strtolower(searchString);

         EditTree._rows = [];
         var treeRoot = Utilities_GetElementsByClass('edittree', 'DIV', document.body);
         if (treeRoot.length > 0) 
         {
            // only include rows inside the treeroot, so that template rows don't get counted
            EditTree._rows = Utilities_GetElementsByClass('edittree_file', 'DIV', treeRoot[0]);
         }
         EditTree._iRow = 0;
         EditTree._timer = setTimeout(function()
         {
            try
            {
               EditTree._FilterFunc();
            }
            catch (e)
            {
               Log_WriteException(e);
            }
         }, 100);
      }
   },

   ClearFilter: function()
   {
      if (EditTree._timer)
         clearTimeout(EditTree._timer);            
      
      EditTree._searchClasses = null;
      EditTree._searchString = null;
      EditTree._rows = [];
      var treeRoot = Utilities_GetElementsByClass('edittree', 'DIV', document.body);
      if (treeRoot.length > 0) 
      {
         // only include rows inside the treeroot, so that template rows don't get counted
         EditTree._rows = Utilities_GetElementsByClass('edittree_file', 'DIV', treeRoot[0]);
      }
      EditTree._iRow = 0;
      EditTree._timer = setTimeout(function()
      {
         try
         {
            EditTree._ClearFunc();
         }
         catch (e)
         {
            Log_WriteException(e);
         }
      }, 100);
   },

   _FilterFunc: function()
   {
      if (EditTree._timer)
      {
         // kill the timer
         clearTimeout(EditTree._timer);
         EditTree._timer = null;          

         var count = 0;
         while (count < 200 && EditTree._iRow < EditTree._rows.length)
         {
            var elem = EditTree._rows[EditTree._iRow];
            var visible = EditTree._MatchesClasses(elem, EditTree._searchClasses) &&
               EditTree._MatchesString(elem, EditTree._searchString);
            Visibility_SetByElement(elem.parentNode, visible);
            count++;
            EditTree._iRow++;
         }

         if (EditTree._iRow < EditTree._rows.length)
         {
            EditTree._timer = setTimeout(function ()
            {
               try
               {
                  EditTree._FilterFunc();
               }
               catch (e)
               {
                  Log_WriteException(e);
               }
            }, 100);
         }
         else
         {
            forEach(EditTree.filteringCallbacks, function(callback)
            {
               callback(EditTree._table);
            });
         }
      }
   },

   _MatchesClasses: function(elem, searchClasses)
   {
      if (searchClasses.length == 0) return true;
      
      // if we're dealing with an array of arrays then ALL of them must be true
      if (is_array(searchClasses[0]))
      {
         var result = true;
         forEach(searchClasses, function(subClasses)
         {
            if (!EditTree._MatchesClasses(elem, subClasses))
               result = false;
         });
         return result;
      }
      
      // if we're dealing with a simple array then ANY of the items must be true
      return Utilities_ArraysMeet(Utilities_StringToArray(elem.className, ' '), searchClasses);
   },
   
   _MatchesString: function(elem, searchString)
   {
      var text = FilterTable.GetInnerText(elem);
      return Utilities_StringContains(strtolower(text), searchString);
   },
   
   _ClearFunc: function()
   {
      if (EditTree._timer)
      {
         // kill the timer
         clearTimeout(EditTree._timer);
         EditTree._timer = null;          

         var count = 0;
         while (count < 200 && EditTree._iRow < EditTree._rows.length)
         {
            var elem = EditTree._rows[EditTree._iRow];
            Visibility_ShowByElement(elem.parentNode);
            count++;
            EditTree._iRow++;
         }

         if (EditTree._iRow < EditTree._rows.length)
         {
            EditTree._timer = setTimeout(function()
            {
               try
               {
                  EditTree._ClearFunc();
               }
               catch (e)
               {
                  Log_WriteException(e);
               }
            }, 100);
         }
         else
         {
            forEach(EditTree.filteringCallbacks, function(callback)
            {
               callback(EditTree._table);
            });
         }
      }
   },
}

DocumentLoad.AddCallback(EditTree.Init);
