// ========================================================================
//        Copyright � 2012 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Allows WYSIWYG editing of TEXTAREA controls, just by adding class='HtmlTextArea'.
// Optional class (choose only one):
//    HtmlTextArea - content is HTML in multiple lines
//    PlainTextArea - content is text in multiple lines
//    HtmlTextAreaSingleRow - content is HTML in one line only
//    PlainTextAreaSingleRow - content is text in one line only
//
// Optional data:
//    data-templatetype - the template type being edited, used by PlaceholderEditForm.php

// Depends on ckeditor in ThirdParty folder - MUST BE INCLUDED (see Constants.php)

CKEDITOR.replaceClass = null; // Disable replacing by class
CKEDITOR.disableAutoInline = true;

HtmlTextArea =
{
   configPlain:
   {
      language: null,
      disableNativeSpellChecker: false,
      extraPlugins: 'placeholder,placeholder_select,forum,quiz,scheduler,webinar,picture,video,resource,autogrow',
      removePlugins : 'elementspath,image',
      resize_enabled : false,
      enterMode: CKEDITOR.ENTER_BR,
      autoParagraph: false,
      contentsCss: './CSS/CKEditorContents.css',

      autoGrow_onStartup: true,
      autoGrow_minHeight: 120,
//      autoGrow_maxHeight: 500, iOS doesn't scroll properly while typing if there are CKEditor scrollbars

      toolbar: [
         { items: [ 'Cut', 'Copy', 'PasteText', '-', 'Undo', 'Redo' ] },
         '/',
         { items: [ 'placeholder_select', 'forum', 'quiz', 'scheduler', 'webinar', 'picture', 'video', 'resource', 'SpecialChar' ] },
         { items: [ 'Maximize' ] },
      ],
      allowedContent:
      {
         $1:
         {
            // Use the ability to specify elements as an object.
            elements: CKEDITOR.dtd,
            attributes: true,
            styles: true,
            classes: true
         }
      },
      placeholder_select: {
         placeholders: {},
         format: '{{%placeholder%}}'
      },
      forum: {
         forums: {},
         format: '{{%forum%}}'
      },
      quiz: {
         quizzes: {},
         format: '{{%quiz%}}'
      },
      scheduler: {
         schedulers: {},
         format: '{{%scheduler%}}'
      },
      webinar: {
         webinars: {},
         format: '{{%webinar%}}'
      },
      picture: {
         pictures: {},
         format: '{{%picture%}}'
      },
      video: {
         videos: {},
         format: '{{%video%}}'
      },
      resource: {
         resources: {},
         format: '{{%resource%}}'
      },
      placeholder: {
         placeholders: {}
      }
/*      disallowedContent: 'script; *[on*]'   we need onclick for CC processing */
   },

   configHtml:
   {
      language: null,
      disableNativeSpellChecker: false,
      extraPlugins: 'font,imageeditor,widget,lineutils,placeholder,placeholder_select,forum,quiz,scheduler,webinar,picture,video,resource,autogrow',
      removePlugins : 'image',
      filebrowserBrowseUrl: '/PHP/UserInterface/ImageBrowser.php',
      filebrowserImageWindowWidth : '850',
      filebrowserImageWindowHeight : '480',
      toolbar: [
         { items: [ 'Source', '-', 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo', '-', 'Maximize' ] },
         '/',
         { items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', 'RemoveFormat', 'NumberedList', 'BulletedList', 'Link', 'Unlink' ] },
         '/',
         { items: [ 'Outdent', 'Indent', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
         '/',
         { items: [ 'Styles', 'Format', 'FontSize' ] },
         '/',
         { items: [ 'placeholder_select', 'forum', 'quiz', 'scheduler', 'webinar', 'picture', 'video', 'resource', 'Image', 'Table', 'HorizontalRule', 'SpecialChar' ] },
      ],

      resize_enabled : false,
      contentsCss: './CSS/CKEditorContents.css',

      autoGrow_onStartup: true,
      autoGrow_minHeight: 200,
//      autoGrow_maxHeight: 500, iOS doesn't scroll properly while typing if there are CKEditor scrollbars

      allowedContent:
      {
         $1:
         {
            // Use the ability to specify elements as an object.
            elements: CKEDITOR.dtd,
            attributes: true,
            styles: true,
            classes: true
         }
      },
      placeholder_select: {
         placeholders: {},
         format: '{{%placeholder%}}'
      },
      forum: {
         forums: {},
         format: '{{%forum%}}'
      },
      quiz: {
         quizzes: {},
         format: '{{%quiz%}}'
      },
      scheduler: {
         schedulers: {},
         format: '{{%scheduler%}}'
      },
      webinar: {
         webinars: {},
         format: '{{%webinar%}}'
      },
      picture: {
         pictures: {},
         format: '{{%picture%}}'
      },
      video: {
         videos: {},
         format: '{{%video%}}'
      },
      resource: {
         resources: {},
         format: '{{%resource%}}'
      },
      placeholder: {
         placeholders: {}
      }
/*      disallowedContent: 'script; *[on*]'   we need onclick for CC processing */
   },

   configPlainSingleRow:
   {
      language: null,
      disableNativeSpellChecker: false,
      extraPlugins: 'placeholder,placeholder_select,doNothing,autogrow',
      removePlugins : 'elementspath',
      resize_enabled : false,
      enterMode: CKEDITOR.ENTER_BR,
      autoParagraph: false,
      ignoreEmptyParagraph: true,
      contentsCss: './CSS/CKEditorContents.css',

      autoGrow_onStartup: true,
      autoGrow_minHeight: 30,

      toolbar: [
         { items: [ 'Cut', 'Copy', 'PasteText', '-', 'Undo', 'Redo' ] },
         { items: [ 'placeholder_select', 'SpecialChar'] }
      ],
      keystrokes: [
         [ 13 , 'doNothing'],
         [CKEDITOR.SHIFT + 13 , 'doNothing' ]
      ],
      allowedContent:
      {
         $1:
         {
            // Use the ability to specify elements as an object.
            elements: CKEDITOR.dtd,
            attributes: true,
            styles: true,
            classes: true
         }
      },
      placeholder_select: {
         placeholders: {},
         format: '{{%placeholder%}}'
      },
      placeholder: {
         placeholders: {}
      }
/*      disallowedContent: 'script; *[on*]'   we need onclick for CC processing */
   },

   configHtmlSingleRow:
   {
      language: null,
      disableNativeSpellChecker: false,
      extraPlugins: 'font,widget,lineutils,placeholder,placeholder_select,doNothing,autogrow',
      toolbar: [
         { items: [ 'Source', '-', 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
         '/',
         { items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', 'RemoveFormat', 'Link', 'Unlink' ] },
         '/',
         { items: [ 'Styles', 'Format', 'FontSize' ] },
         '/',
         { items: [ 'placeholder_select', 'Image', 'SpecialChar' ] },
      ],
      autoParagraph: false,
      ignoreEmptyParagraph: true,
      resize_enabled : false,
      contentsCss: './CSS/CKEditorContents.css',

      autoGrow_onStartup: true,
      autoGrow_minHeight: 30,

      keystrokes: [
         [ 13 , 'doNothing'],
         [CKEDITOR.SHIFT + 13 , 'doNothing' ]
      ],
      allowedContent:
      {
         $1:
         {
            // Use the ability to specify elements as an object.
            elements: CKEDITOR.dtd,
            attributes: true,
            styles: true,
            classes: true
         }
      },
      placeholder_select: {
         placeholders: {},
         format: '{{%placeholder%}}'
      },
      placeholder: {
         placeholders: {}
      }
/*      disallowedContent: 'script; *[on*]'   we need onclick for CC processing */
   },
   disabledFeatures: [],

   Init: function(rootNodes)
   {
      forEach(rootNodes, function(root)
      {
         var elems = Utilities_GetThisOrChildrenBySelector(root, '.PlainTextArea,.HtmlTextArea,.PlainTextAreaSingleRow,.HtmlTextAreaSingleRow');
         for (var i = 0; i < elems.length; i++)
         {
            HtmlTextArea.MakeHtmlTextArea(elems[i]);
         }
      });
   },
   
   SetLanguage: function(language)
   {
      HtmlTextArea.configPlain.language = language;
      HtmlTextArea.configHtml.language = language;
      HtmlTextArea.configPlainSingleRow.language = language;
      HtmlTextArea.configHtmlSingleRow.language = language;
   },
   
   DisableFeatures: function(features)
   {
      HtmlTextArea.disabledFeatures = features;

      for (var i = 0; i < features.length; i++)
      {
         HtmlTextArea.configPlain.extraPlugins = Utilities_ReplaceInString(HtmlTextArea.configPlain.extraPlugins, features[i], '');
         HtmlTextArea.configHtml.extraPlugins = Utilities_ReplaceInString(HtmlTextArea.configHtml.extraPlugins, features[i], '');
         HtmlTextArea.configPlainSingleRow.extraPlugins = Utilities_ReplaceInString(HtmlTextArea.configPlainSingleRow.extraPlugins, features[i], '');
         HtmlTextArea.configHtmlSingleRow.extraPlugins = Utilities_ReplaceInString(HtmlTextArea.configHtmlSingleRow.extraPlugins, features[i], '');
      }
   },

   // this is used by the Layout editor as a workaround since it loads later than the above call
   GetDisabledFeatures: function()
   {
      HtmlTextArea.disabledFeatures;
   },

   SetKnownFields: function(fields)
   {
      HtmlTextArea.configPlain.placeholder_select.placeholders = fields;
      HtmlTextArea.configHtml.placeholder_select.placeholders = fields;
      HtmlTextArea.configPlainSingleRow.placeholder_select.placeholders = fields;
      HtmlTextArea.configHtmlSingleRow.placeholder_select.placeholders = fields;

      HtmlTextArea.configPlain.placeholder.placeholders = fields;
      HtmlTextArea.configHtml.placeholder.placeholders = fields;
      HtmlTextArea.configPlainSingleRow.placeholder.placeholders = fields;
      HtmlTextArea.configHtmlSingleRow.placeholder.placeholders = fields;
   },

   // this is used by the Layout editor as a workaround since it loads later than the above call
   GetKnownFields: function()
   {
      return HtmlTextArea.configPlain.placeholder_select.placeholders;
   },

   Show: function(elem)
   {
      if (typeof CKEDITOR.instances[Utilities_ElementId(elem)] == 'undefined')
      {
         elem.style.display='';
         
         HtmlTextArea.MakeHtmlTextArea(elem);
         
         return true;
      }
      
      return false;
   },

   Hide: function(elem)
   {
      let result = false;
      var editor = CKEDITOR.instances[Utilities_ElementId(elem)];
      if (typeof editor != 'undefined')
      {
         editor.updateElement();
         editor.destroy();

         if (Class_HasByElement(elem, 'PlainTextArea') || Class_HasByElement(elem, 'PlainTextAreaSingleRow'))
         {
            var isMultiRow = Class_HasByElement(elem, 'PlainTextArea');
            elem.value = HtmlTextArea.Unwrap(elem.value, isMultiRow);
         }
         
         result = true;
      }
      
      if (elem.style.display!='none')
      {
         elem.style.display='none';
         result = true;
      }
      
      return result;
   },

   IsVisible: function(elem)
   {
      return typeof CKEDITOR.instances[Utilities_ElementId(elem)] != 'undefined' ||
         elem.style.display != 'none';  // hasn't been initialized yet but it is visible
   },

   IsHtmlTextArea: function(elem)
   {
      return Class_HasByElement(elem, 'HtmlTextArea') ||
             Class_HasByElement(elem, 'PlainTextArea') ||
             Class_HasByElement(elem, 'HtmlTextAreaSingleRow') ||
             Class_HasByElement(elem, 'PlainTextAreaSingleRow');
   },

   MakeHtmlTextArea: function(elem)
   {
      // don't initialize items already intialized or hidden items (they'll be initialized when shown)
      if (typeof CKEDITOR.instances[Utilities_ElementId(elem)] != 'undefined' || elem.style.display != '' ||
         // do not initialize if it's in a template
         Utilities_HasClassAsParent(elem, 'MultiItemTemplate'))
         return;

      var isMultiRow = Class_HasByElement(elem, 'HtmlTextArea') || Class_HasByElement(elem, 'PlainTextArea');
      var isHtml = Class_HasByElement(elem, 'HtmlTextArea') || Class_HasByElement(elem, 'HtmlTextAreaSingleRow');
      var isRequired =  elem.required;
   
      if (!isHtml)
      {
         elem.value = HtmlTextArea.Wrap(elem.value, isMultiRow);
      }
      
      var editor = CKEDITOR.replace(Utilities_ElementId(elem),
         isMultiRow ?
            (isHtml ? HtmlTextArea.configHtml : HtmlTextArea.configPlain) :
            (isHtml ? HtmlTextArea.configHtmlSingleRow : HtmlTextArea.configPlainSingleRow));
      if (isRequired) elem.required=true; // somehow this gets removed
      editor.on('change', function()
      {
         // call the onchange method so our form code knows things have changed
         FireElemChanged(elem);
      });
      
      if (isHtml)
      {
         // we add this here so the form validation sees the updated value
         FormPrepValues.AddCallback(function(e)
         {
            var editor = CKEDITOR.instances[Utilities_ElementId(elem)];
            if (typeof editor != 'undefined' /*&& HtmlTextArea.IsVisible(elem)*/)
            {
               editor.updateElement();
            }

            return true;
         });
         if (isMultiRow)
         {
            editor.on('paste', function(event)
            {
               // make non-editable content editable
               event.data.dataValue = event.data.dataValue.replace(/contenteditable=/gi, 'contentwaseditable=');
            });
         }
         else
         {
            editor.on('paste', function(event)
            {
               // remove line break tags
               event.data.dataValue = event.data.dataValue.replace(/<br[^>]*>/gi, ' ').replace(/<p>/g, " ").replace(/<\/p>/g, "");
               // make non-editable content editable
               event.data.dataValue = event.data.dataValue.replace(/contenteditable=/gi, 'contentwaseditable=');
            });
         }
      }
      else
      {
         var form = Utilities_GetParentByTag(elem, 'FORM');
         // DRL FIXIT? Every time the element is hidden/shown we'll register a new listener, we handle it but it's a waste.
         // we add this here so the form validation sees the updated value
         FormPrepValues.AddCallback(function(e)
         {
            var editor = CKEDITOR.instances[Utilities_ElementId(elem)];
            if (typeof editor != 'undefined' /*&& HtmlTextArea.IsVisible(elem)*/)
            {
               editor.updateElement();
               elem.value = HtmlTextArea.Unwrap(elem.value, isMultiRow);
            }

            return true;
         });
         Utilities_AddEvent(form, "submit", function(e)
         {
            var editor = CKEDITOR.instances[Utilities_ElementId(elem)];
            if (typeof editor != 'undefined' /*&& HtmlTextArea.IsVisible(elem)*/)
            {
               editor.updateElement();
               editor.destroy();
               elem.value = HtmlTextArea.Unwrap(elem.value, isMultiRow);
            }
         });
         editor.on('paste', function(event)
         {
            // convert line breaks to prevent them from being stripped
            event.data.dataValue = event.data.dataValue.replace(/<br([ ^])*\/>/gi, "_LB_PH_");
            // remove all other tags
            event.data.dataValue = event.data.dataValue.replace(/<([^>]+)>/g, ' ');
            // convert line breaks back
            event.data.dataValue = event.data.dataValue.replace(/_LB_PH_/g, "<br/>");
         });
      }

      elem.style.display = 'none';
   },

   Wrap: function(value, isMultiRow)
   {
      // DRL This encoding was messing up emoji's so I took it out. Not sure why we have it here?
      var result = value; //Encoder.htmlEncode(value, true);
      if (isMultiRow)
      {
         result = result.replace(/&#10;/g, '<br />');
         result = result.replace(/\n/g, '<br />');
      }
      return result;
   },

   Unwrap: function(value, isMultiRow)
   {
      var result = value;
      if (isMultiRow)
         result = result.replace(/<br[^>]*>/gi, '\r').replace(/<p>/g, " ").replace(/<\/p>/g, "");
      return Encoder.htmlDecode(result);
   },

/* We no longer need the resources listed on the client side.
   GetResourcesByType: function(type, resolve, reject)
   {
      var result = [];
      ResourcesHelper.LoadResourcesByType(type, function(array) {
         array.forEach(function (element) 
         {
            result.push({
               name: element.name,
               id: element.id
            });
         });

         switch (type) {
         case 'forum':
            HtmlTextArea.configPlain.forum.resources = result;
            HtmlTextArea.configHtml.forum.resources = result;
            break;
         case 'quiz':
            HtmlTextArea.configPlain.quiz.resources = result;
            HtmlTextArea.configHtml.quiz.resources = result;
            break;
         case 'scheduler':
            HtmlTextArea.configPlain.scheduler.resources = result;
            HtmlTextArea.configHtml.scheduler.resources = result;
            break;
         case 'webinar':
            HtmlTextArea.configPlain.webinar.resources = result;
            HtmlTextArea.configHtml.webinar.resources = result;
            break;
         case 'image':
            HtmlTextArea.configPlain.picture.resources = result;
            HtmlTextArea.configHtml.picture.resources = result;
            break;
         case 'video':
            HtmlTextArea.configPlain.video.resources = result;
            HtmlTextArea.configHtml.video.resources = result;
            break;
         default:
            break;
         }

         resolve();
      });
   },

   GetAllResources: function(resolve, reject)
   {
      ResourcesHelper.LoadResourcesByType('resource', function(data) {
         HtmlTextArea.configHtml.resource.resources = data;
         resolve();
      });
   }
 */
}

DocumentLoad.AddCallback(HtmlTextArea.Init);
