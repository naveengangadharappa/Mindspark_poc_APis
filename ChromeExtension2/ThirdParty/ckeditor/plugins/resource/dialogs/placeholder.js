
/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Definition for placeholder plugin dialog.
 *
 */

'use strict';

CKEDITOR.dialog.add( 'placeholder', function( editor ) {
	var lang = editor.lang.placeholder,
		generalLabel = editor.lang.common.generalTab,
		validNameRegex = /^[^\{\}<>]+$/;

	var defaultConfig = {
		placeholders: []
	};

	var config = CKEDITOR.tools.extend(defaultConfig, editor.config.placeholder || {}, true);

	return {
		title: lang.title,
		minWidth: 300,
		minHeight: 80,
		contents: [
			{
				id: 'info',
				label: generalLabel,
				// title: generalLabel,
				elements: [
					// Dialog window UI elements.
					{
						id: 'name',
						type: 'select',
						style: 'width: 100%;',
						label: 'Select name',
						'default': '',
						required: true,
						// validate: CKEDITOR.dialog.validate.regex( validNameRegex, lang.invalidName ),
						items: [],
						setup: function( widget ) {
							// dynamically build the select options from knownfields
							// we can't use items attribute directly because it doesn't support optgroup
							var cel = this.getDialog().getContentElement('info', 'name');
							var actualEl = document.getElementById(cel.domId).getElementsByTagName("SELECT")[0];
							actualEl.style.lineHeight = 'normal';

							var isCustom = true;

							for (var key in config.placeholders) {
								var og = document.createElement("optgroup");
								og.label = key;
								for (var itemName in config.placeholders[key]) {
									var opt = document.createElement("option");
									opt.value = itemName;
									opt.innerHTML = config.placeholders[key][itemName]["label"];
									og.appendChild(opt);

									if (itemName == widget.data.name)
										isCustom = false; 
								}
								actualEl.appendChild(og);
							}
							var opt = document.createElement("option");
							opt.value = "_Custom";
							opt.innerHTML = "Custom";
							actualEl.appendChild(opt);

							isCustom ? this.setValue('_Custom') : this.setValue( widget.data.name );
						},
						commit: function( widget ) {
							if ("_Custom" !== this.getValue()) {								
								widget.setData( 'name', this.getValue() );
							}
						}
					},
					{
						id: 'custom',
						type: 'text',
						style: 'width: 100%;',
						label: "Provide custom value",
						'default': '',
						required: false,
						validate: function() {
							var pass = true;
							var cel = this.getDialog().getContentElement('info', 'name');
							if ("_Custom" == cel.getValue()) {
								var thisValue = this.getValue();
								if (!thisValue || thisValue.length == 0) {
									pass = false;
								} else if (!validNameRegex.test(thisValue)) {
									pass = false;
								}
							}
							if (!pass) {
								return lang.invalidName;
							}
						},
						setup: function( widget ) {
							var cel = this.getDialog().getContentElement('info', 'name');
							if ("_Custom" == cel.getValue()) {
								var actualEl = document.getElementById(this.domId);
								actualEl.style.display = 'block';
	
								this.setValue( widget.data.name );
							}
						},
						commit: function( widget ) {
							var cel = this.getDialog().getContentElement('info', 'name');
							if ("_Custom" == cel.getValue()) {
								widget.setData( 'name', this.getValue() );
							}
						}
					}

				]
			}
		]
	};
} );
