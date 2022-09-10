(function( name, factory ) {

   if( typeof window === "object" ) {

      // add to window 
      window[ name ] = factory();

      // add jquery plugin, if available  
      if( typeof jQuery === "object" ) {
         jQuery.fn[ name ] = function( options ) {
            return this.each( function() {
               new window[ name ]( this, options );
            });
         };
      }
   }
})( "DragDropFactory", function() {

   var _w = window,
   _b = document.body,
   _d = document.documentElement;

   // get position of mouse/touch in relation to viewport 
   var getPoint = function( e )
   {
      var scrollX = Math.max( 0, _w.pageXOffset || _d.scrollLeft || (_b && _b.scrollLeft) || 0 ) - ( _d.clientLeft || 0 ),
      scrollY = Math.max( 0, _w.pageYOffset || _d.scrollTop || (_b && _b.scrollTop) || 0 ) - ( _d.clientTop || 0 ),
      pointX  = e ? ( Math.max( 0, e.pageX || e.clientX || 0 ) - scrollX ) : 0,
      pointY  = e ? ( Math.max( 0, e.pageY || e.clientY || 0 ) - scrollY ) : 0; 

      return { x: pointX, y: pointY }; 
   }; 

   // class constructor
   var Factory = function( container, options )
   {
      if( container && container instanceof Element )
      {
         this._container = container; 
         this._options   = options || {}; /* nothing atm */
         this._clickItem = null;
         this._dragItem  = null;
//         this._hovItem   = null;
         this._click     = {};
         this._dragging  = false;
         this._mousemoveHandler = null;
         this._touchmoveHandler = null;
         this._contextmenuHandler = null;
   
   
         this._container.setAttribute( "data-is-sortable", 1 );
         this._container.style["position"] = "static";
         
         window.addEventListener( "mousedown", this._onPress.bind( this ), true );
         window.addEventListener( "mouseup", this._onRelease.bind( this ), true );
         window.addEventListener( "touchstart", this._touchHandler.bind( this ), true );
         window.addEventListener( "touchend", this._touchHandler.bind( this ), true );
         window.addEventListener( "touchcancel", this._touchHandler.bind( this ), true );

         // window.addEventListener( "scroll", this._onScrollHandler.bind( this ), true );
      }
   };

   // class prototype
   Factory.prototype = {
      constructor: Factory,

      // serialize order into array list 
      toArray: function( attr )
      {
         attr = attr || "id";

         var data = [], 
         item = null, 
         uniq = ""; 

         for( var i = 0; i < this._container.children.length; ++i )
         {
            item = this._container.children[ i ], 
            uniq = item.getAttribute( attr ) || "";
            uniq = uniq.replace( /[^0-9]+/gi, "" );
            data.push( uniq );
         }
         return data;
      }, 

      // serialize order array into a string 
      toString: function( attr, delimiter )
      {
         delimiter = delimiter || ":"; 
         return this.toArray( attr ).join( delimiter );
      }, 

      // checks if mouse x/y is on top of an item 
      _isOnTop: function( item, x, y )
      {
         var box = item.getBoundingClientRect(),
         isx = ( x > box.left && x < ( box.left + box.width ) ), 
         isy = ( y > box.top && y < ( box.top + box.height ) ); 
         return ( isx && isy );
      },

      // DRL FIXIT! Use our Class_AddByElement() and Class_RemoveByElement() instead!
      // manipulate the className of an item (for browsers that lack classList support)
      _itemClass: function( item, task, cls )
      {
         var list  = item.className.split( /\s+/ ), 
         index = list.indexOf( cls );

         if( task === "add" && index == -1 )
         { 
            list.push( cls ); 
            item.className = list.join( " " ); 
         }
         else if( task === "remove" && index != -1 )
         {
            list.splice( index, 1 ); 
            item.className = list.join( " " ); 
         }
      }, 

      // swap position of two item in sortable list container 
      _swapItems: function( item1, item2 )
      {
         var parent1 = item1.parentNode, 
         parent2 = item2.parentNode;

         if( parent1 !== parent2 ) 
         {
            // move to new list 
            parent2.insertBefore( item1, item2 );
         }
         else { 
            // sort is same list 
            var temp = document.createElement( "div" ); 
            parent1.insertBefore( temp, item1 );
            parent2.insertBefore( item1, item2 );
            parent1.insertBefore( item2, temp );
            parent1.removeChild( temp );
         }
      },

      // update item position 
      _moveItem: function( item, x, y )
      {
         item.style.left = x + 'px';
         item.style.top = y + 'px';
         // item.style["-webkit-transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
         // item.style["-moz-transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
         // item.style["-ms-transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
         // item.style["transform"] = "translateX( "+ x +"px ) translateY( "+ y +"px )";
      },

      // make a temp fake item for dragging and add to container 
      _makeDragItem: function( item )
      {
         this._trashDragItem(); 

         this._clickItem = item; 
         this._itemClass( this._clickItem, "add", "active" );

// DRL We don't show the item being dragged as it's not consistent across devices and not really necessary.
//         this._dragItem = item.cloneNode(true);
//         this._dragItem.classList.add("dragging");
//         this._dragItem.style["position"] = "absolute";
//         this._dragItem.style["z-index"] = "999";
//         this._dragItem.style["left"] = ( item.offsetLeft || 0 ) + "px";
//         this._dragItem.style["top"] = ( item.offsetTop || 0 ) + "px";
//         this._dragItem.style["width"] = ( item.offsetWidth || 0 ) + "px";
//
//         this._container.appendChild( this._dragItem );
      }, 

      // remove drag item that was added to container 
      _trashDragItem: function()
      {
         if( this._clickItem )
         {
            this._itemClass( this._clickItem, "remove", "active" ); 
            this._clickItem = null;
         }
   
         if( this._dragItem )
         {
            this._container.removeChild( this._dragItem );
            this._dragItem = null; 
         }
      },

      // convert touch event to mouse event
      _touchHandler : function( e )
      {
         var touch = e.changedTouches[0];

         var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent({
            touchstart: "mousedown",
            touchmove: "mousemove",
            touchend: "mouseup"
         }[e.type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);
         touch.target.dispatchEvent(simulatedEvent);

         // e.preventDefault();
      },

      // on item press/drag 
      _onPress: function( e )
      {
         // DRL FIXIT! Got: Uncaught TypeError: e.target.className.includes is not a function
         if( e && e.target && e.target.className && typeof e.target.className.includes !== 'undefined' &&
            e.target.className.includes(this._options.handler) )
         {
            e.preventDefault();

            this._dragging = true;
            this._click = getPoint( e );
   
            this._mousemoveHandler = this._onMove.bind( this );
            this._touchmoveHandler = this._touchHandler.bind( this );
            this._contextmenuHandler = function(e) { e.preventDefault(); };
            this._selectstartHandler = function(e) { e.preventDefault(); };
            
            window.addEventListener( "mousemove", this._mousemoveHandler, true );
            window.addEventListener( "touchmove", this._touchmoveHandler, { passive:false } );
            // this was needed to disable the menu on Chromebook otherwise it comes up when you drag
            window.addEventListener("contextmenu", this._contextmenuHandler);
            // this was needed to disable selection in some cases
            window.addEventListener("selectstart", this._selectstartHandler);
            
            this._makeDragItem( e.target.parentNode );
            this._onMove( e );
         }
      },

      // on item release/drop 
      _onRelease: function( e )
      {
         this._dragging = false;
         this._trashDragItem();

         window.removeEventListener( "mousemove", this._mousemoveHandler, true );
         window.removeEventListener( "touchmove", this._touchmoveHandler, { passive:false } );
         window.removeEventListener("contextmenu", this._contextmenuHandler);
         window.removeEventListener("selectstart", this._selectstartHandler);
   
         this._mousemoveHandler = null;
         this._touchmoveHandler = null;
         this._contextmenuHandler = null;
         this._selectstartHandler = null;
         
         this._options.handler == 'MultiItem_Drag' ?
            MultiItem.ReorderId(this._container) :
            MultiSelect.ReorderId(this._container.querySelector('.MultiSelect'), true);
      },

      // on item drag/move
      _onMove: function( e )
      {
         if( this._dragging )
         {
            e.preventDefault();

            var point     = getPoint( e ); 
            var container = this._container;

            // drag fake item 
            if( this._dragItem )
               this._moveItem( this._dragItem, ( e.pageX ), ( e.pageY ) );

            // container is empty, move clicked item over to it on hover 
            if( container.children.length === 0 && this._isOnTop( container, point.x, point.y ) )
            {
               container.appendChild( this._clickItem ); 
               return; 
            }

            // check if current drag item is over another item and swap places 
            for( var b = 0; b < container.children.length; ++b )
            {
               var subItem = container.children[ b ]; 

               if( subItem === this._clickItem || subItem === this._dragItem )
               {
                  continue; 
               }
               if( subItem.className.includes(this._options.item) && this._isOnTop( subItem, point.x, point.y ))
               {
//                  this._hovItem = subItem;
                  this._swapItems( this._clickItem, subItem ); 
               }
            }

            // DRL FIXIT? We will want to find an alternate way to scroll when there is no _dragItem.
            if (this._dragItem)
            {
               var bottom = window.innerHeight - 10, top = window.scrollY + 10;
               if (this._dragItem.offsetTop > bottom) {
                  //Down
console.log("DragDropFactory scrolling down");
                  window.scrollBy({
                     top: 0,
                     behavior: 'smooth'
                  });
               } else if (this._dragItem.offsetTop < top) {
                  //Up
console.log("DragDropFactory scrolling up");
                  window.scrollBy({
                     top: 0,
                     behavior: 'smooth'
                  });
               } else {
console.log("DragDropFactory stop scrolling");
                  window.scrollBy({
                     top: 0
                  });
               }
            }
         }
      },
   };

   // export
   return Factory;
});

// helper init function 
function initSortable( listClass, containerIsParent, handler, item )
{
   var listObj  = document.getElementsByClassName( listClass );
   for (var i = 0; i < listObj.length; i ++)
   {
      var sortable = new DragDropFactory( containerIsParent ? listObj[i].parentNode : listObj[i], {handler: handler, item: item} ); 
   }
}