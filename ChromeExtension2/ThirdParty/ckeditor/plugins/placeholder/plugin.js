/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The "placeholder" plugin.
 *
 */

'use strict';

( function() {
	CKEDITOR.plugins.add( 'placeholder', {
		requires: 'widget,dialog',
		lang: 'af,ar,az,bg,ca,cs,cy,da,de,de-ch,el,en,en-gb,eo,es,es-mx,et,eu,fa,fi,fr,fr-ca,gl,he,hr,hu,id,it,ja,km,ko,ku,lv,nb,nl,no,oc,pl,pt,pt-br,ru,si,sk,sl,sq,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
		icons: 'placeholder', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%

		onLoad: function() {
			// Register styles for placeholder widget frame.
			CKEDITOR.addCss( '.cke_placeholder{background-color:#ff0}' );
		},

		init: function( editor ) {
			var lang = editor.lang.placeholder;
			
			// DRL FIXIT? Why can't I get this through the usual "dataset" feature?
			var templateType = editor.element.getAttribute('data-templatetype');
			assert(EditingResourceID !== undefined);
			assert(LimitVentureID !== undefined);
			
			// Register dialog.
			CKEDITOR.dialog.add( 'placeholder', this.path + 'dialogs/placeholder.js' );

			// Put ur init code here.
			editor.widgets.add( 'placeholder', {
				// Widget code.
				dialog: 'placeholder',
				pathName: lang.pathName,
				// We need to have wrapping element, otherwise there are issues in
				// add dialog.
				template: '<span class="cke_placeholder">{{}}</span>',

				// need to have something here for the above template to work
				defaults: {},

				downcast: function() {
					return new CKEDITOR.htmlParser.text( '{{' + this.data.name + '}}' );
				},

				init: function() {
					// Note that placeholder markup characters are stripped for the name.
					this.setData( 'name', this.element.getText().slice( 2, -2 ) );
				},

				data: function() {
					this.element.setText( '{{' + this.data.name + '}}' );
				},

				getLabel: function() {
					return this.editor.lang.widget.label.replace( /%1/, this.data.name + ' ' + this.pathName );
				}
			} );

			editor.ui.addButton && editor.ui.addButton( 'CreatePlaceholder', {
				label: lang.toolbar,
				command: 'placeholder',
				toolbar: 'insert,5',
				icon: 'placeholder'
			} );

			CKEDITOR.on('dialogDefinition', function(ev) {
				var dialogName = ev.data.name;
				var dialogDefinition = ev.data.definition;
				var dialog = dialogDefinition.dialog;
				var placeholder = "placeholder";
				if (placeholder == dialogName) {

					var metaName = placeholder + 'Meta';
					var inputSettings = null;

					window[metaName] = {};

					dialogDefinition.onShow = function() {
						
						window[metaName]['dialog'] = dialog;

						if(editor.getSelection().getSelectedElement() != null)
						{
							var selectedElement = editor.getSelection().getSelectedElement().$.querySelector('.cke_widget_element');
							
							//fix: get setting only when selected element is belogs to same widget
							if(selectedElement && selectedElement.getAttribute('data-widget') == placeholder) {
								window[metaName]['widget_element'] = selectedElement;
								inputSettings = selectedElement.innerText;
							}
						}

						DisplayInlineItemForm(
							'PlaceholderEdit',
							'EditingResourceID', EditingResourceID,
							'VentureID', LimitVentureID,
							'TemplateType', templateType,
							'Settings', inputSettings,
							'CallbackMethod', 'CKEditorPlaceHolder_PlaceholderChanged');
					}

					dialogDefinition.onHide = function() {}
				}
			});
		},

		afterInit: function( editor ) {
			var placeholderReplaceRegex = /\{\{(?!forum|forumpost|quiz|scheduler|webinar|video|url|resource|picture)([^\{\}])+\}\}/g;

			editor.dataProcessor.dataFilter.addRules( {
				text: function( text, node ) {
					var dtd = node.parent && CKEDITOR.dtd[ node.parent.name ];

					// Skip the case when placeholder is in elements like <title> or <textarea>
					// but upcast placeholder in custom elements (no DTD).
					if ( dtd && !dtd.span )
						return;

					return text.replace( placeholderReplaceRegex, function( match ) {
						// Creating widget code.
						var widgetWrapper = null,
							innerElement = new CKEDITOR.htmlParser.element( 'span', {
								'class': 'cke_placeholder'
							} );

						// Adds placeholder identifier as innertext.
						innerElement.add( new CKEDITOR.htmlParser.text( match ) );
						widgetWrapper = editor.widgets.wrapElement( innerElement, 'placeholder' );

						// Return outerhtml of widget wrapper so it will be placed
						// as replacement.
						return widgetWrapper.getOuterHtml();
					} );
				}
			} );
		}
	} );

} )();
