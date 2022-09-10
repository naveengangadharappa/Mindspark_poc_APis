(function()
{
   var customDialog = function( editor )
   {
      var lang = editor.lang.placeholder,
		generalLabel = editor.lang.common.generalTab,
      validNameRegex = /([A-Za-z0-9_])\w+/g;

      var defaultConfig = {
         resources: []
      };

		var config = CKEDITOR.tools.extend(defaultConfig, editor.config.resource || {}, true);

      return {
         id: editor.name,
         title : 'Please enter resource name',
         minWidth: 300,
		   minHeight: 80,
         onShow : function()
         {
         },
         onOk : function()
         {
         },
         onLoad : function()
         {
         },
         onHide : function()
         {
         },
         
         contents : [
         {
            id : 'info',
            label: generalLabel,
				title: generalLabel,
            elements : [
               {
                  id: 'name',
                  type: 'select',
                  style: 'width: 100%',
                  label: 'Select Resource',
                  'default': '',
                  required: true,
                  items: [],
                  onLoad: function() {
                     var cel = this.getDialog().getContentElement('info', 'name');
                     var actualEl = document.getElementById(cel.domId).getElementsByTagName("SELECT")[0];
                     actualEl.innerHTML = '';
							actualEl.style.lineHeight = 'normal';

                     var opt = document.createElement("option");
							opt.value = "_Custom";
							opt.innerHTML = "Custom";
                     actualEl.appendChild(opt);
                     
                     for (var key in config.resources) {
								var og = document.createElement("optgroup");
								og.label = key;
								for (var itemName in config.resources[key]) {
									var opt = document.createElement("option");
									opt.value = itemName;
                           opt.innerHTML = config.resources[key][itemName]["label"];
                           opt.setAttribute('data-url', config.resources[key][itemName]['url']);
									og.appendChild(opt);
								}
								actualEl.appendChild(og);
							}
                  },
                  setup: function(widget) {
                     var cel = this.getDialog().getContentElement('info', 'name');
                     var actualEl = document.getElementById(cel.domId).getElementsByTagName("SELECT")[0];
                     actualEl.innerHTML = '';
							actualEl.style.lineHeight = 'normal';

							var isCustom = true;

                     var opt = document.createElement("option");
							opt.value = "_Custom";
							opt.innerHTML = "Custom";
                     actualEl.appendChild(opt);

                     for (var key in config.resources) {
								var og = document.createElement("optgroup");
								og.label = key;
								for (var itemName in config.resources[key]) {
									var opt = document.createElement("option");
									opt.value = itemName;

                           opt.innerHTML = config.resources[key][itemName]["label"];
                           opt.setAttribute('data-url', config.resources[key][itemName]['url']);
                           og.appendChild(opt);
                           
                           if(itemName == widget.data.name) isCustom = false;
								}
								actualEl.appendChild(og);
							}
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
						label: "URL",
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
	
								this.setValue( widget.data.custom );
							}
                  },
						commit: function( widget ) {
                     var cel = this.getDialog().getContentElement('info', 'name');
							if ("_Custom" == cel.getValue()) {
								widget.setData( 'custom', this.getValue() );
							}
						}
               },
               {
						id: 'label', 
						type: 'text',
						style: 'width: 100%',
						label: 'Button Label',
						'default': '',
						required: true,
						validate: function() {
							var thisValue = this.getValue();
							if (!thisValue || thisValue.length == 0) {
								return lang.invalidName;
							}
						},
						setup: function(widget) {
							this.setValue(widget.data.label);
						},
						commit: function(widget) {
							widget.setData('label', this.getValue());
						}
               },
               {
                  id: 'newtab',
                  type: 'checkbox',
                  label: 'Open new tab',
						required: false,
						setup: function(widget) {
							this.setValue(widget.data.newtab);
						},
						commit: function(widget) {
							widget.setData('newtab', this.getValue());
						}
               }
            ]
         }]
      };
   };

   CKEDITOR.dialog.add( 'customResources', function(editor)
   {
      return customDialog(editor);
   });

})();