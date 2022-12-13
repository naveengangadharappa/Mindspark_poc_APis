/**
 * @deprecated
 * @function iconHtml
 * @param {string} options: array of menu items
 * @param {object} triggerButtonStyles Add custom styles you want for the trigger button
 * @param {object} menuStyles Add custom styles you want for the menu, Obs: Position, z-index, top and left are locked for positioning the menu
 */
 function dropDownMenu(options, triggerButtonStyles = '', menuStyles = null, others = {}) {
   let defaultTriggerButtonStyles = 'margin-left: 5px;margin-right: 5px;'

   //Guarantee the others will become "" if doesn't follow the right pattern
   if (others == null || typeof others == "string"){
        others = {}
   }

   let dropdownTriggerButtonClasses = ['dropdown-menu', 'SA']

   if(typeof others.extraClassesButton != "undefined" && others.extraClassesButton != null){
      dropdownTriggerButtonClasses.push('SA_globalDropdown')
   }
   const dropdownTriggerButton = Utilities_CreateElement('div', {
       class: dropdownTriggerButtonClasses,
       styles: defaultTriggerButtonStyles + Utilities_ParseStyleFromObject(triggerButtonStyles),
   });

   //Making sure the triggerButtonImgStyles have a default value if not set
   if (typeof others.triggerButtonImgStyles == 'undefined' || others.triggerButtonImgStyles == null || others.triggerButtonImgStyles === "") {
       others.triggerButtonImgStyles = {width: '19px', height: '19px'}
   }
   Utilities_CreateElement('img', {
       parent: dropdownTriggerButton,
       src: ImagesUrl + 'IconWithBorder.svg',
       styles: others.triggerButtonImgStyles
   });
   // DRL FIXIT? This should be added as needed, not for every button.
   Utilities_CreateElement('img', {
      parent: dropdownTriggerButton,
      class: 'filterActive',
      src: ImagesUrl + 'Common/Valid.png',
      styles: "position:absolute;display:none;width: 20px;right: -3px;bottom: -1px;"
   });

  Utilities_AddEvent(dropdownTriggerButton, 'click', (event )=> { //function(event) {
      Messaging.SendMessageToNativeApp({type:'drop_down_event',value:event});
     const ul = createMenu(options, menuStyles);
  
     //Is changing the position of the UL to the dropdownButton click position, which will be always inside the dropdownButton
     // I offset by 10 in both axis so the mouse cursor is inside the menu and not right on the edge
     ul.style.top = (event.pageY-10)+"px"
     Class_ToggleByElement(ul, 'SA_dropdown-menu-popup-visible');
     //Creating an Orientation for the position from the mouse click the dropdown is going to show, if is going to show to the left or to the right of the click
     if(others.orientation === "right"){
        ul.style.left = (event.pageX-ul.offsetWidth+10)+"px"
     }else{
        ul.style.left = (event.pageX-10)+"px"
     }

      ul.focus();
      //event.stopPropagation();
      //event.preventDefault();
      return false;
  });

  return dropdownTriggerButton;
}

function createMenu(options, menuStyles) {
  let hasSelectables = false
  for (const option of options) {
     if(typeof option.others != 'undefined' && typeof option.others.selectable != 'undefined' && option.others.selectable)
        hasSelectables = true;
  }
  
  const ul = createMenuElement(options, menuStyles);
  ul.id = 'Pop-Up-Menu';
  
  let old = Utilities_GetElementById('Pop-Up-Menu');
  if (old)
     old.remove();
  document.body.appendChild(ul);
  
  Utilities_AddEvent(ul, 'mouseleave', function(event) {
     Class_SetByElement(ul, 'SA_dropdown-menu-popup-visible', false)
     event.stopPropagation();
     event.preventDefault();
     return false;
  });
  
  Utilities_AddEvent(ul, 'click', function(event) {
     if(!hasSelectables){
        Class_SetByElement(ul, 'dropdown-menu-visible', false);
     }
     event.stopPropagation();
     event.preventDefault();
     return false;
  });
  
  return ul;
}

function showCenteredMenu(options, menuStyles) {
  const ul = createMenu(options, menuStyles);
  
  // the "!important" below allows us to override .SA_dropdown-menu-popup
  ul.style.cssText = "position:fixed !important; top:100px; left:50%; width:400px; margin-left:-200px; z-index:99999; max-height: none;";

  Class_ToggleByElement(ul, 'SA_dropdown-menu-popup-visible');
  
  ul.focus();
}

/**
* @param options
*    Structure: [
*       {
*          text: String,
*          icon: String, 
*          callback: Function,
*          other: {
*             TODO
*          }
*       }
*    ]
* @param triggerButton
*    Structure: {
*       styles: String,
*       classes: array
*    }
*    Example: {
*       styles: "color:black;",
*       classes: ['.example-class'],
*       img: {
*          src: '',
*          classes: [],
*          styles: ''
*       },
*       extraImages: [
*          {
*             src: '',
*             classes: [],
*             styles: ''
*          }
*       ]
*    }
* @param menuStyle
* @param others
* @returns {*}
*/
function styledDropDownMenu(options, triggerButton = null, menu = null, others = null){
  //Building Styles based on parameters
  if(triggerButton == null){
     triggerButton = {}
  }
  if(typeof triggerButton.styles == 'undefined' || triggerButton.styles == null){
     triggerButton.styles = ''
  }
  if(typeof triggerButton.classes == 'undefined' || triggerButton.classes == null){
     triggerButton.classes = []
  }
  if(typeof triggerButton.img == 'undefined' || triggerButton.img == null){
     triggerButton.img = {}
  }
  if(typeof triggerButton.extraImages == 'undefined' || triggerButton.extraImages == null){
     triggerButton.extraImages = []
  }
  
  triggerButton = {
     styles: constantStyles.DropdownMenuDefaults.triggerButton.styles+triggerButton.styles,
     classes: constantStyles.DropdownMenuDefaults.triggerButton.classes.concat(triggerButton.classes),
     img: {
        src: ImagesUrl+(triggerButton.img.src ?? constantStyles.DropdownMenuDefaults.triggerButton.img.src),
        classes: constantStyles.DropdownMenuDefaults.triggerButton.img.classes.concat(triggerButton.img.classes ?? []),
        styles: constantStyles.DropdownMenuDefaults.triggerButton.img.styles+(triggerButton.img.styles ?? "")
     },
     extraImages: constantStyles.DropdownMenuDefaults.triggerButton.extraImages.concat(triggerButton.extraImages)
  }
  
  //Start Creating Elements
  const dropdownTriggerButton = Utilities_CreateElement('div', {
     class: triggerButton.classes,
     styles: triggerButton.styles,
  });
  
  //Main Icon/Image for dropdown
  Utilities_CreateElement('img', {
     parent: dropdownTriggerButton,
     src: triggerButton.img.src,
     styles: triggerButton.img.classes
  });
  //Add Extra Icons to the Dropdown Trigger Button
  for(let i in triggerButton.extraImages){
     Utilities_CreateElement('img', {
        parent: dropdownTriggerButton,
        class: triggerButton.extraImages[i].classes,
        src: ImagesUrl + triggerButton.extraImages[i].src,
        styles: triggerButton.extraImages[i].styles
     });
  }
  
  let hasSelectables = false
  for (const option of options) {
     if(typeof option.others != 'undefined' && typeof option.others.selectable != 'undefined' && option.others.selectable)
        hasSelectables = true;
  }

  Utilities_AddEvent(dropdownTriggerButton, 'click', function(event) {
     const ul = createStyledMenu(options, menu);
     ul.id = 'Pop-Up-Menu';

     let old = Utilities_GetElementById('Pop-Up-Menu');
     if (old)
        old.remove();
     document.body.appendChild(ul);

     //Is changing the position of the UL to the dropdownButton click position, which will be always inside the dropdownButton
     // I offset by 10 in both axis so the mouse cursor is inside the menu and not right on the edge
     ul.style.top = (event.pageY-10)+"px"
     Class_ToggleByElement(ul, 'SA_dropdown-menu-popup-visible');
     //Creating an Orientation for the position from the mouse click the dropdown is going to show, if is going to show to the left or to the right of the click
     if(others.orientation === "right"){
        ul.style.left = (event.pageX-ul.offsetWidth+10)+"px"
     }else{
        ul.style.left = (event.pageX-10)+"px"
     }

     Utilities_AddEvent(ul, 'mouseleave', function(event) {
        Class_SetByElement(ul, 'SA_dropdown-menu-popup-visible', false)
        event.stopPropagation();
        event.preventDefault();
        return false;
     });

     Utilities_AddEvent(ul, 'click', function(event) {
        if(!hasSelectables){
           Class_SetByElement(ul, 'dropdown-menu-visible', false);
        }
        event.stopPropagation();
        event.preventDefault();
        return false;
     });

     ul.focus();
     event.stopPropagation();
     event.preventDefault();
     return false;
  });

  return dropdownTriggerButton;
}


function popUpMenu(title, options, menuStyles = null, others = {}) {
  //Guarantee the others will become "" if doesn't follow the right pattern
  if (others == null || typeof others == "string"){
     others = {}
  }
  
  const ul = createMenuElement(options, menuStyles);
  ul.id = 'Pop-Up-Menu';
  
  if (title) {
     const label = Utilities_CreateElement('li', { innerText: title });
     ul.insertBefore(label, ul.firstElementChild);
  }

  let old = Utilities_GetElementById('Pop-Up-Menu');
  if (old)
     old.remove();
  document.body.appendChild(ul);
  
//   let hasSelectables = false
//   for (const option of options) {
//      if(typeof option.others != 'undefined' && typeof option.others.selectable != 'undefined' && option.others.selectable)
//         hasSelectables = true;
//   }

  // the "!important" below allows us to override .SA_dropdown-menu-popup
  ul.style.cssText = "position:fixed !important; top:100px; left:50%; width:400px; margin-left:-200px; z-index:99999;";
  
  ul.focus();
  
  Class_SetByElement(ul, 'SA_dropdown-menu-popup-visible', true);
/*
  Utilities_AddEvent(div, 'mouseleave', function(event) {
     ul.remove();
     event.stopPropagation();
     event.preventDefault();
     return false;
  });
*/
  Utilities_AddEvent(ul, 'click', function(event) {
//      if(!hasSelectables){
        ul.remove();
//      }
     event.stopPropagation();
     event.preventDefault();
     return false;
  });
}

/**
* @deprecated
* @param options
* @param menuStyles
* @returns {*}
*/
function createMenuElement(options, menuStyles = null) {
  //Default the z-index to make it sure is showing on top of everything after open
  if(menuStyles == null){
     menuStyles = "z-index: 9999;"
  }
  const ul = Utilities_CreateElement('ul',
     {
        class: ['SA_dropdown-menu-popup'],
        styles: menuStyles
     });
  for (const option of options) {
     let others = {};
     if(typeof option.others != 'undefined')
        others = option.others;
     addMenuButton(ul, option.label, option.icon, option.cmd, others);
  }
  return ul;
}


function createStyledMenu(options, menu = null) {
  //Default the z-index to make it sure is showing on top of everything after open
  if(menu == null){
     menu = {}
  }
  menu = {
     classes: constantStyles.DropdownMenuDefaults.menu.classes+(menu.classes ?? ''),
     styles: constantStyles.DropdownMenuDefaults.menu.styles.concat(menu.styles ?? [])
  }
  const ul = Utilities_CreateElement('ul',
     {
        class: menu.classes,
        styles: menu.styles
     });
  for (const option of options) {
     addStyledMenuButton(ul, option);
  }
  return ul;
}

/**
* @deprecated
* @param ul
* @param text
* @param icon
* @param callback
* @param other
* @returns {*}
*/
function addMenuButton(ul, text, icon, callback, other) {
   const button        = Utilities_CreateElement('li', { parent : ul });
   const clickZone     = Utilities_CreateElement('div', { parent : button });
   const id            = "chckbx_" + Utilities_IntRand(100, 1000000);
   
   let input = null;
   if(typeof other.selectable != "undefined"){
      input = Utilities_CreateElement('input', {
         id: id,
         parent : clickZone,
         type: 'checkbox'
      });
      if(typeof other.selected != "undefined"){
         input.checked = other.selected
      }
   }
   if (icon){
      let icon_path = (icon.indexOf('.png') != -1 || icon.startsWith('Icon')) ? ImagesUrl : SkinsUrl;
      Utilities_CreateElement('img', {
                  class  : 'iconsmall',
                  src    : icon_path + icon,
                  parent : clickZone
              });
   }
   Utilities_CreateElement('label', {
               htmlFor   : id,
               innerText : text,
               parent    : clickZone
           });

   if(typeof callback != 'undefined' && callback != null){
       Utilities_AddEvent(clickZone, 'click', function(event) {
//            event.preventDefault()   DRL Looks like we don't need this?
          if(typeof other.selectable == "undefined" || !other.selectable) {
             Class_SetByElement(ul, 'SA_dropdown-menu-popup-visible', false);
          }
           // DRL FIXIT! It looks like there's some code somewhere that is restoring the state of
           // the checkbox after this event handler so the workaround there is to wait and
           // take forceful action after.
          setTimeout(function() {
              if (input)
                 input.checked = !input.checked;
  
              callback(event.target, input ? input.checked : null);
          }, 10);

           // NOTE: we let this event bubble up so the UL element can handle hiding the menu
       });
   }

   return button;
}


function addStyledMenuButton(ul, option) {
  let {text, icon, callback} = option
  let other = {}
  if(option.other != null){
     other = option.other;
  }
  
  const button        = Utilities_CreateElement('li', { parent : ul });
  const clickZone     = Utilities_CreateElement('div', { parent : button });
  const id            = "chckbx_" + Utilities_IntRand(100, 1000000);

  let input = null;
  if(typeof other.selectable != "undefined"){
     input = Utilities_CreateElement('input', {
        id: id,
        parent : clickZone,
        type: 'checkbox'
     });
     if(typeof other.selected != "undefined"){
        input.checked = other.selected
     }
  }
  if (icon){
     let icon_path = (icon.indexOf('.png') != -1 || icon.startsWith('Icon')) ? ImagesUrl : SkinsUrl;
     Utilities_CreateElement('img', {
        class  : 'iconsmall',
        src    : icon_path + icon,
        parent : clickZone
     });
  }
  Utilities_CreateElement('label', {
     htmlFor   : id,
     innerText : text,
     parent    : clickZone
  });

  if(typeof callback != 'undefined' && callback != null){
     Utilities_AddEvent(clickZone, 'click', function(event) {
     //            event.preventDefault()   DRL Looks like we don't need this?
        if(typeof other.selectable == "undefined" || !other.selectable) {
           Class_SetByElement(ul, 'SA_dropdown-menu-popup-visible', false);
        }
        // DRL FIXIT! It looks like there's some code somewhere that is restoring the state of
        // the checkbox after this event handler so the workaround there is to wait and
        // take forceful action after.
        setTimeout(function() {
           if (input)
              input.checked = !input.checked;

           callback(event.target, input ? input.checked : null);
        }, 10);

        // NOTE: we let this event bubble up so the UL element can handle hiding the menu
     });
  }

  return button;
}