/**
 * A plugin to enable placeholder tokens to be inserted into the CKEditor message. Use on its own or with teh placeholder plugin. 
 * The default format is compatible with the placeholders syntex
 *
 * @version 0.1 
 * @Author Troy Lutton
 * @license MIT 
 * 
 * This is a pure modification for the placeholders plugin. All credit goes to Stuart Sillitoe for creating the original (stuartsillitoe.co.uk)
 *
 */

CKEDITOR.plugins.add('placeholder_select',
{
	requires : ['richcombo'],
	init : function( editor )
	{
		//  array of placeholders to choose from that'll be inserted into the editor
		var placeholders = [];

		// customPlaceholder dialog name
		var customDialog = "customDialog";
		
		// init the default config - empty placeholders
		var defaultConfig = {
			format: '[[%placeholder%]]',
			placeholders : []
		};

		// merge defaults with the passed in items		
		var config = CKEDITOR.tools.extend(defaultConfig, editor.config.placeholder_select || {}, true);

		CKEDITOR.dialog.add(customDialog, this.path + 'dialogs/custom.js');

		style = new CKEDITOR.style({
			name: "Custom",
			element: 'p',
			styles: {
				'font-family': 'sans-serif',
				'font-size': 'small'
			}
		});

		placeholders.push(["Custom", style.buildPreview(), "Custom"]);

		for (var key in config.placeholders) {
			placeholders.push([key]);
			for (var item in config.placeholders[key]) {
				placeholder = config.format.replace('%placeholder%', item);

				style = new CKEDITOR.style({
					name: config.placeholders[key][item]['label'],
					element: 'p',
					styles: {
						'padding-left': '8px',
						'font-family': 'sans-serif',
						'font-size': 'small'
					}
				});

				placeholders.push([placeholder, style.buildPreview(), item]);
			}
		}

		// add the menu to the editor
		editor.ui.addRichCombo('placeholder_select',
		{
			label: 		'Placeholder',
			title: 		'Insert placeholder',
			voiceLabel: 'Insert placeholder',
			className: 	'cke_format placeholder_select_combo',
			multiSelect:false,
			panel:
			{
				css: [ editor.config.contentsCss, CKEDITOR.skin.getPath('editor') ],
				voiceLabel: editor.lang.panelVoiceLabel
			},

			init: function()
			{
				for (var i in placeholders)
				{
					placeholders[i].length == 1 ?
						this.startGroup(placeholders[i][0]) :
						this.add(placeholders[i][0], placeholders[i][1], placeholders[i][2]);
				}
			},

			onClick: function( value )
			{
				if (value == 'Custom') {
					editor.execCommand(customDialog);
				} else {
					editor.focus();
					editor.fire( 'saveSnapshot' );
					editor.insertHtml(value);
					editor.fire( 'saveSnapshot' );
				}
			}
		});

		CKEDITOR.on("dialogDefinition", function (e) {
			var dialogName = e.data.name;
			var dialog = e.data.definition.dialog;
			var dialogDefinition = e.data.definition;

			if (dialogName == customDialog && dialogDefinition.id == editor.name) {
				dialog.on('ok', function () {
					var custom = dialog.getContentElement('info','custom');
					var placeholder = config.format.replace('%placeholder%', custom.getValue());

					editor.focus();
					editor.fire( 'saveSnapshot' );
					editor.insertHtml(placeholder);
					editor.fire( 'saveSnapshot' );
				});
			}
		});

		editor.addCommand(customDialog, new CKEDITOR.dialogCommand(customDialog));
	}
});