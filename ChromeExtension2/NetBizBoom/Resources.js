function Resources_GetResourceIDFromUrl(url)
{
   url = Url_StripParams(url);
   var i = url.indexOf('Resources/');
   if (i == -1)
   {
      Log_WriteError('Invalid resource URL: ' + url);
      return null;
   }
   i += 10;
   var j = url.indexOf('/');
   if (j == -1)
      j = url.length;
   return url.substr(i, j-i);
}

function Resources_onImageLoaded(event)
{
   Utilities_RemoveEvent(event.target, 'load', Resources_onImageLoaded);
   Utilities_RemoveEvent(event.target, 'error', Resources_onImageError);

   Visibility_ShowByElement(event.target.parentElement); // show DIV
}

function Resources_onImageError(event)
{
   Utilities_RemoveEvent(event.target, 'load', Resources_onImageLoaded);
   Utilities_RemoveEvent(event.target, 'error', Resources_onImageError);
   
   event.target.src = '';
   Visibility_HideByElement(event.target.parentElement); // hide DIV
}

var _ResourceVariableName = null;
function Resources_HandleNewResource(data, httpCode)
{
   data = Json_FromString(data);
   
   if (data == null)
   {
      DisplayErrorMessage(Str('Connection or timeout error'));
   }
   else if (data.hasOwnProperty('status') && data.status == 'error')
   {
      DisplayErrorMessage(data.message);
   }
   else
   {
      let targetSelect = Utilities_GetElementByName(_ResourceVariableName + '_Select');
      if (targetSelect == undefined) targetSelect = Utilities_GetElementByName(_ResourceVariableName);
   
      let thumbnailElem = Utilities_GetElementById(_ResourceVariableName + '_Thumbnail');
      let filenameElem = Utilities_GetElementById(_ResourceVariableName + '_Filename');
      let resourceElem = Utilities_GetElementById(_ResourceVariableName + '_ResourceID');
      let oldResourceID = resourceElem.value;
      
      let resourceID = data.data.ResourceID;
      let filename = data.data.Name;
      
      var opt = document.createElement('option');
      opt.value = resourceID;
      opt.innerHTML = filename;
      
      // add the new item right after the old one (if there was one) so it's in the hierarchy properly
      let found = false;
      forEach(targetSelect.options, function(option)
      {
         if (option.value == oldResourceID)
         {
            // we need to add any prefix spacing in case it's in an optgroup
            let i = option.innerHTML.lastIndexOf('&nbsp;');
            if (i != -1)
            {
               i += 6;
               opt.innerHTML = option.innerHTML.substr(0, i) + opt.innerHTML;
            }
            
            // we get the parent because it could be an optgroup and not the targetSelect
            option.parentElement.insertBefore(opt, option.nextSibling);
            found = true;
         }
      });
      if (!found) // DRL FIXIT? New item so let's just add it at the end (won't be in the hierarchy correctly).
         targetSelect.appendChild(opt);
      
      resourceElem.value = resourceID;
      
      // we add time to the URL in order to force the refresh of the image in case it has changed via one of the image editors
      if (thumbnailElem) thumbnailElem.src = Form_RootUri + '/v2/Resources/' + resourceID + '/Thumbnail#' + new Date().getTime();
      if (filenameElem) filenameElem.innerHTML = filename;
   
      if (Visibility_IsShownByElement(targetSelect))
      {
         if (thumbnailElem) Visibility_ShowByElement(thumbnailElem);
         if (filenameElem) Visibility_ShowByElement(filenameElem);
      }
   
      // initialize the enabled/disabled state of the menu items given the selection has changed
      Utilities_FireEvent(targetSelect, 'change');
   }
   
   _ResourceVariableName = null;
}

// NOTE: This code depends on FileUpload.js and TemporaryFiles.php so keep changes to them in sync!
function Resources_SelectorChanged(elem)
{
   let name = elem.name.indexOf('_Select') != -1
      ? elem.name.substr(0, elem.name.indexOf('_Select'))  // remove "_Select" suffix if it's there
      : elem.name;
   
   // the select element has the Select_ prefix when using the file upload controls to avoid conflict
   let targetSelect = Utilities_GetElementByName(name + '_Select');
   if (targetSelect == undefined) targetSelect = Utilities_GetElementByName(name);
   let visible = Visibility_IsShownByElement(targetSelect);

   let resourceElem = Utilities_GetElementById(name + '_ResourceID');
   let thumbnailElem = Utilities_GetElementById(name + '_Thumbnail');
   let filenameElem = Utilities_GetElementById(name + '_Filename');
   let linkElem = Utilities_GetElementById(name + '_Link');
   let placeholderElem = Utilities_GetElementById(name + '_Placeholder');
   
   let resourceID = resourceElem.value;
   let filename = filenameElem.innerHTML;
   let selectedValue = targetSelect.options[targetSelect.selectedIndex].value;
   let selectedLabel = targetSelect.options[targetSelect.selectedIndex].label.trim(); // remove prefix spaces
   
   if (selectedValue == '_CLEAR_' || selectedValue == '_LINK_' || selectedValue == '_PHLDR_')
   {
      resourceID = '';
      filename = '';
   }
   else if (selectedValue == '_COPY_')
   {
      var url = '/v2/Resources?Fields=ResourceID,Name,ThumbnailURL&CopyResourceID=' + resourceID;
   
      _ResourceVariableName = name;
      
      // this will queue the requests so only one runs at a time, avoiding deadlock and other issues
      ExecuteAjax('POST', url, {}, Str('Duplicating...'), Resources_HandleNewResource);
   }
   else if (selectedValue == '_CREATE_')
   {
      let createInfo = JSON.parse(Utilities_GetElementByName(name + '_CreateInfo').value);
      var url = '/v2/Resources?Fields=ResourceID,Name,ThumbnailURL&Name=' + createInfo.Name +
         '&Type=' + createInfo.Type + '&ResourceFolderID=' + createInfo.ResourceFolderID +
         '&Conflict=rename_new';
   
      _ResourceVariableName = name;
   
      // this will queue the requests so only one runs at a time, avoiding deadlock and other issues
      ExecuteAjax('POST', url, {}, Str('Creating...'), Resources_HandleNewResource);
   }
   else if (selectedValue == '_EDIT_')
   {
      ajax.get(Form_RootUri + '/v2/Resources/' + resourceID, {'Fields': 'Type'}, function (resp, httpCode)
      {
         resp = Json_FromString(resp);
         let type = resp.data.Type;
   
         if (type.startsWith('image/'))
            Resources_LaunchImageEditor(elem, name, resourceID, 'Doka');
         else if (type.indexOf('triggers') != -1)
            DisplayInlineItemForm('TriggersDesign', 'ResourceID', resourceID);
         else if (type.indexOf('onboarding') != -1 || type.indexOf('timetable') != -1)
            DisplayInlineItemForm('ListservDesign', 'ResourceID', resourceID);
         else
            assert(0);
      });
   }
   else if (selectedValue == '_DokaCreator_' || selectedValue == '_CanvaCreator_')
   {
      let editor = selectedValue == '_CanvaCreator_' ? 'Canva' : 'Doka';
      Resources_LaunchImageEditor(elem, name, resourceID, editor);
   }
   else if (!selectedValue.startsWith('_'))
   {
      resourceID = selectedValue;
      filename = selectedLabel;
   }
   else if (resourceID)
   {
      // in case this is a newly added resource via the image editors update the name
      forEach(targetSelect.options, function(option)
      {
         if (option.value == resourceID)
            filename = option.label.trim(); // remove prefix spaces
      });
   }
   
   if (selectedValue != '_LINK_' && selectedValue != '_PHLDR_')
      targetSelect.selectedIndex = 0;
   
   // enable/disable certain items
   forEach(targetSelect.options, function(option)
   {
      // can only clear or copy if we have a resource, can only edit if we have a supported resource
      if (option.value == '_CLEAR_' || option.value == '_COPY_')
         resourceID ? option.removeAttribute('disabled') : option.setAttribute('disabled', 'disabled');
      else if (option.value == '_EDIT_')
      {
         if (resourceID)
         {
            ajax.get(Form_RootUri + '/v2/Resources/' + resourceID, {'Fields': 'Type'}, function (resp, httpCode)
            {
               resp = Json_FromString(resp);
               let type = resp.data.Type;
   
               let isEditSupported = type.startsWith('image/') || type.indexOf('triggers') != -1 ||
                  type.indexOf('onboarding') != -1 || type.indexOf('timetable') != -1;
               isEditSupported ? option.removeAttribute('disabled') : option.setAttribute('disabled', 'disabled');
            });
         }
         else
            option.setAttribute('disabled', 'disabled');
      }
   });
   
   if (thumbnailElem)
   {
      // we want to get notified if the image load succeeds or fails so we can control the visibility
      Utilities_AddEvent(thumbnailElem, 'load', Resources_onImageLoaded);
      Utilities_AddEvent(thumbnailElem, 'error', Resources_onImageError);
   }
   
   if (resourceID)
   {
      // we add time to the URL in order to force the refresh of the image in case it has changed via one of the image editors
      if (thumbnailElem) thumbnailElem.src = Form_RootUri + '/v2/Resources/' + resourceID + '/Thumbnail#' + new Date().getTime();
      if (filenameElem) filenameElem.innerHTML = filename;
   }
   else 
   {
      if (thumbnailElem) thumbnailElem.src = '';
      if (filenameElem) filenameElem.innerHTML = '';
   }

   resourceElem.value = resourceID;
   
   if (thumbnailElem) Visibility_SetByElement(thumbnailElem, visible && resourceID);
   if (filenameElem) Visibility_SetByElement(filenameElem, visible && resourceID);
   if (linkElem) Visibility_SetByElement(linkElem, visible && selectedValue == '_LINK_');
   if (placeholderElem) Visibility_SetByElement(placeholderElem, visible && selectedValue == '_PHLDR_');
   
   OnElemChanged(targetSelect);
}

// launches the appropriate editor, used with the resource picker
// editor can be Doka or Canva
function Resources_LaunchImageEditor(elem, name, resourceID, editor)
{
   if (resourceID)
   {
      ajax.get(Form_RootUri + '/v2/Resources/' + resourceID, {}, function (resp, httpCode)
      {
         resp = Json_FromString(resp);
         
         let isImage = resp.data.Type.startsWith('image/');
         if (isImage)
         {
            // DRL FIXIT! We should be putting the VersionKey in here so we're editing the correct
            // language of the image in the case of a template!
            let callback = function (resourceID, newName)
            {
               Utilities_GetElementById(name + '_ResourceID').value = resourceID;   // update to new resourceID
               Resources_SelectorChanged(elem);
            };
            
            if (editor == 'Doka')
               ImageEditor.CreateImageEditor(resourceID, callback);
            else if (editor == 'Canva')
               ImageEditor.CreateCanvaEditor(resourceID, callback);
            else
               assert(0);
         }
         else 
         {
            alert(Str('This is not an image.'));
         }
      });
   }
   else
   {
      let callback = function (resourceID, newName)
      {
         // DRL FIXIT! We should be adding the item in the proper place given its folder and name ordering.
         var targetSelect = Utilities_GetElementByName(name + '_Select');
         var opt = document.createElement('option');
         opt.value = resourceID;
         opt.innerHTML = newName;
         targetSelect.appendChild(opt);
//         targetSelect.selectedIndex = targetSelect.length-1;
//         Utilities_FireEvent(targetSelect, 'change');
   
         Utilities_GetElementById(name + '_ResourceID').value = resourceID;   // update to new resourceID
         Resources_SelectorChanged(elem);
      };
      
      if (editor == 'Doka')
         ImageEditor.CreateImageEditor(null, callback);
      else if (editor == 'Canva')
         ImageEditor.CreateCanvaEditor(null, callback);
      else
         assert(0);
   }
}

/*
// configures a button that when clicked shows the appropriate editor, used with the resource picker
// editor can be Doka or Canva
function Resources_PrepImageEditButton(elem, name, resourceID, editor, visible)
{
   Visibility_SetByElement(elem, visible);
   
   if (resourceID)
   {
      ajax.get(Form_RootUri + '/v2/Resources/' + resourceID, {}, function (resp, httpCode)
      {
         resp = Json_FromString(resp);
      
         let isImage = resp.data.Type.startsWith('image/');
         if (isImage)
         {
            elem.onclick = function ()
            {
               // DRL FIXIT! We should be putting the VersionKey in here so we're editing the correct
               // language of the image in the case of a template!
               let callback = function (resourceID, newName)
               {
                  // we add time to the URL in order to force the refresh of the image
                  var thumbnail = Utilities_GetElementById('Thumbnail_' + name);
                  if (thumbnail)
                     thumbnail.src = Form_RootUri + '/v2/Resources/' + resourceID + '/Thumbnail#' + new Date().getTime();
               };
   
               if (editor == 'Doka')
                  ImageEditor.CreateImageEditor(resourceID, callback);
               else if (editor == 'Canva')
                  ImageEditor.CreateCanvaEditor(resourceID, callback);
               else
                  assert(0);
            };
         }
         Visibility_SetByElement(elem, visible && isImage);
      });
   }
   else 
   {
      elem.onclick = function ()
      {
         let callback = function (resourceID, newName)
         {
            // DRL FIXIT! We should be adding the item in the proper place given its folder and name ordering.
            var targetSelect = Utilities_GetElementByName(name + '_Select');
            var opt = document.createElement('option');
            opt.value = resourceID;
            opt.innerHTML = newName;
            targetSelect.appendChild(opt);
            targetSelect.selectedIndex = targetSelect.length-1;
   
            Utilities_FireEvent(targetSelect, 'change');
         };
   
         if (editor == 'Doka')
            ImageEditor.CreateImageEditor(null, callback);
         else if (editor == 'Canva')
            ImageEditor.CreateCanvaEditor(null, callback);
         else
            assert(0);
      }
   }
}
*/

function Resources_PickerSelectorChanged(elem, previewFrameID, languagePrefix)
{
   var resourceID = elem.options[elem.selectedIndex].value;
   var preview = Utilities_GetElementById(previewFrameID);
   var versionKey = '';
   if (languagePrefix != null)
   {
      if (languagePrefix.length == 3)  // is it like "en-"?
         languagePrefix += 'XX';       // if so add a locale to make "en-XX", locale will be ignored if there's no exact match
      versionKey = '?Version=' + languagePrefix + '/any';
   }
   preview.src = window.location.protocol + '//' + window.location.hostname + '/v2/Resources/' + resourceID +
      '/Preview' + versionKey;
}
