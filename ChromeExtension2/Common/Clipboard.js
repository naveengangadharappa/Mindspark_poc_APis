// ========================================================================
//        Copyright � 2019 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

MyClipboard =
{
   systemPasteReady: false,
   systemPasteContent: null,
   systemPasteWaitCount: 0,
   textArea: null,
   pasteCallback: null,
   pasteTarget: null,

   Init: function(rootNodes)
   {
      forEach(rootNodes, function(root)
      {
         // initialize the clipboard support, alert on error
         forEach(Utilities_GetThisOrChildrenBySelector(root, '.clipboard_copy'), function (elem)
         {
            var clipboard = new Clipboard(elem);
            clipboard.on('error', function (e)
            {
               alert(e);
            });
         });
         forEach(Utilities_GetElementsByClass('clipboard_paste', null, root), function (elem)
         {
            var callback = elem.dataset.callbackname;
            elem.onclick = function (evt)
            {
               MyClipboard.ClipboardPaste(evt, callback);
            };
         });
      });

//   document.getElementById('element1').addEventListener('keydown', MyClipboard.keyBoardListener);
//   document.getElementById('element2').addEventListener('keydown', MyClipboard.keyBoardListener);
   },
   
   CopyTextToClipboard: function(text)
   {
      assert(text != ''); // copying of empty string doesn't work so we shouldn't try (DRL FIXIT? just skip it?)
      let result = true;

      // standard way of copying
      let textArea = document.createElement('textarea');
      textArea.setAttribute('style','width:1px;border:0;opacity:0;');
      document.body.appendChild(textArea);
      textArea.innerHTML = text;
      textArea.focus({preventScroll:true});
      textArea.select();
      try
      {
         if (!document.execCommand('copy'))
         {
            Log_WriteError('Error copying to clipboard');
            result = false;
         }
      }
      catch (e)
      {
         Log_WriteException(e);
         result = false;
      }
      document.body.removeChild(textArea);
      
      return result;
   },
   
   GetClipboardText: function()
   {
      const textArea = document.createElement('textarea');
      textArea.setAttribute('style','width:1px;border:0;opacity:0;');
      document.body.appendChild(textArea);
      // I found that when we call textArea.focus(true) in the extension it wasn't copying to the clipboard, so I added the check here as well??
      if (!Browser.IsExtensionContent())
         textArea.focus(true);   // don't scroll
      textArea.select();
      document.execCommand('paste');
      let value = textArea.value;
      document.body.removeChild(textArea);
      return value;
   },

// data is a JavaScript "hash" of the data in several versions as: { "text/plain": "Hi", "text/html": "<p>Hi</p>", ... }
   // DRL NOTE: At this time we only use one format, choosing "application/*" over anything else.
   CopyMimeValues: function(data)
   {
      let bestType = null;
      let bestData = null;
      
      // choose the best format to use
      forEach(Object.keys(data), function (mimeType)
      {
         if (bestType == null || bestType == 'text/plain' || mimeType.indexOf('application/') == 0)
         {
            bestType = mimeType;
            bestData = data[mimeType];
         }
      });

      // DRL FIXIT! This is a hack to work around the problem that most browsers do not support
      // a wide variety of formats. This allows us to copy/paste data between our own applications
      // by forcing our data into a supported format.
      if (bestType.indexOf('application/') != -1)
      {
         assert(!(bestData instanceof Blob));
         bestData = "!!MIME-TYPE:" + bestType + "!!\n" + bestData;
      }
      
      return MyClipboard.CopyTextToClipboard(bestData);
      
/* DRL The following would be great but Chrome seems to filter the formats and getting this to work was a pain.
      return new Promise( (resolve, reject) =>
      {
         navigator.permissions.query({name: "clipboard-write"})
            .then(result =>
            {
               if (result.state == "granted" || result.state == "prompt")
               {
                  let promises = [];
                  try
                  {
                     forEach(Object.keys(data), function (mimeType)
                     {
                        let dataItem = data[mimeType];
                        
                        // DRL FIXIT! This is a hack to work around the problem that most browsers do not support
                        // a wide variety of formats. This allows us to copy/paste data between our own applications
                        // by forcing our data into a supported format.
                        if (mimeType.indexOf('application/') != -1)
                        {
                           assert(!(dataItem instanceof Blob));
                           dataItem = "!!MIME-TYPE:" + mimeType + "!!\n" + dataItem;
                           mimeType = 'text/plain';
                        }

                        if (!(dataItem instanceof Blob))
                           dataItem = new Blob([dataItem], {type : mimeType});
                        let items = [new ClipboardItem({[mimeType]: dataItem})];
                        promises.push(navigator.clipboard.write(items));
                     });
                     Promise.all(promises)
                        .then(res =>
                        {
                           resolve(true);
                        })
                        .catch(e =>
                        {
                           Log_WriteException(e);
                           resolve(false);
                        });
                  }
                  catch (e)
                  {
                     Log_WriteException(e);
                     resolve(false);
                  }
               }
               else
               {
                  Log_WriteError("No access to clipboard in MyClipboard.CopyMimeValues()");
                  resolve(false);
               }
            })
            .catch(e =>
            {
               Log_WriteException(e);
               resolve(false);
            });
      });
*/
   },
   
/* Not currently used. Could be improved to use CopyText() to avoid duplicate code.
   ClipboardCopy: function(target)
   {
      // standard way of copying
      var textArea = document.createElement('textarea');
      textArea.setAttribute('style','width:1px;border:0;opacity:0;');
      document.body.appendChild(textArea);
      textArea.innerHTML = target.innerHTML;
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
   },
*/
   
   ClipboardPaste: function(evt, callback)
   {
      if (window.clipboardData)
      {
         // DRL FIXIT! Need to add support for all the formats provided.
         let data = window.clipboardData.getData('Text');
         let mimeType = 'text/plain';
   
         // DRL FIXIT! This is a hack to work around the problem that most browsers do not support
         // a wide variety of formats. This allows us to copy/paste data between our own applications
         // by forcing our data into a supported format.
         if (data.indexOf('!!MIME-TYPE:') == 0)
         {
            let i = data.indexOf("\n");
            mimeType = data.substr(12, i - 14);
            data = data.substr(i + 2);
         }
         
         callback(evt.target, {mimeType: data});
      }
      else
      {
         function waitForPaste()
         {
            if (!MyClipboard.systemPasteReady &&
               MyClipboard.systemPasteWaitCount < 10)   // wait 10 seconds before giving up
            {
               if (Browser.IsMobileOrTablet())
               {
                  // without a keyboard paste is done by holding down on selected text until the context menu appears
                  Utilities_GetElementById('busy_indicator_paste').value = Str('Hold here then paste');
                  Visibility_ShowById('busy_indicator_paste');
                  Utilities_GetElementById('busy_indicator_paste').focus(true);   // don't scroll
                  BusyIndicatorStart(Str('Hold down in box to show menu') + ' (' + (10 - MyClipboard.systemPasteWaitCount) + ')');
               }
               else
               {
                  BusyIndicatorStart(Str('Hit ctrl-V to paste your data') + ' (' + (10 - MyClipboard.systemPasteWaitCount) + ')');
               }
               setTimeout(function()
               {
                  try
                  {
                     waitForPaste();
                  }
                  catch (e)
                  {
                     Log_WriteException(e);
                  }
               }, 1000);
               MyClipboard.systemPasteWaitCount++;
               return;
            }
   
            window.removeEventListener('paste', MyClipboard.systemPasteListener);
            
            if (MyClipboard.systemPasteReady)
               window[MyClipboard.pasteCallback](MyClipboard.pasteTarget, MyClipboard.systemPasteContent);
            
            // clean up...
            document.body.removeChild(MyClipboard.textArea);
            MyClipboard.textArea = null;
            MyClipboard.systemPasteReady = false;
            MyClipboard.systemPasteWaitCount = 0;
            MyClipboard.systemPasteContent = null;
            MyClipboard.pasteCallback = null;
            MyClipboard.pasteTarget = null;
            
            BusyIndicatorStop();
         }
   
         window.addEventListener('paste', MyClipboard.systemPasteListener);
         MyClipboard.pasteCallback = callback;
         MyClipboard.pasteTarget = evt.currentTarget;
         
         // FireFox requires at least one editable
         // element on the screen for the paste event to fire
         MyClipboard.textArea = document.createElement('textarea');
         MyClipboard.textArea.setAttribute('style', 'width:1px;border:0;opacity:0;');
         document.body.appendChild(MyClipboard.textArea);
         MyClipboard.textArea.select();
   
         waitForPaste();
      }
   },
   
   systemPasteListener: function(evt)
   {
      MyClipboard.systemPasteContent = {};
   
      var bestType = null;
      for (var i = 0; i < evt.clipboardData.types.length; i++)
      {
         var type = evt.clipboardData.types[i];
         if (type == 'text/uri-list' || type == 'text/plain')
            bestType = type;
      }
   
      // put the "best" format first
      for (var i = 0; i < evt.clipboardData.items.length; i++)
      {
         var item = evt.clipboardData.items[i];
         if (item.type == bestType)
         {
            item.getAsString(function (data)
            {
               let mimeType = item.type;
               
               // DRL FIXIT! This is a hack to work around the problem that most browsers do not support
               // a wide variety of formats. This allows us to copy/paste data between our own applications
               // by forcing our data into a supported format.
               if (data.indexOf('!!MIME-TYPE:') == 0)
               {
                  let i = data.indexOf("\n");
                  mimeType = data.substr(12, i - 14);
                  data = data.substr(i + 1);
               }

               MyClipboard.systemPasteContent[mimeType] = data;
            });
         }
      }
   
      // followed by all the other formats
      for (var i = 0; i < evt.clipboardData.items.length; i++)
      {
         var item = evt.clipboardData.items[i];
         if (item.type != bestType)
         {
            item.getAsString(function (s)
            {
               MyClipboard.systemPasteContent[item.type] = s;
            });
         }
      }
   
      MyClipboard.systemPasteReady = true;
      evt.preventDefault();
   },

//   keyBoardListener: function(evt)
//   {
//      if (evt.ctrlKey)
//      {
//         switch(evt.keyCode)
//         {
//            case 67: // c
//               MyClipboard.ClipboardCopy(evt.target);
//               break;
//            case 86: // v
//               MyClipboard.ClipboardPaste(evt.target);
//               break;
//         }
//      }
//   }
}

DocumentLoad.AddCallback(MyClipboard.Init);
