(function()
{
   var customDialog = function( editor)
   {
      var lang = editor.lang.placeholder,
		generalLabel = editor.lang.common.generalTab,
      validNameRegex = /^[^\{\}<>]+$/;

      return {
         id: editor.name,
         title : 'Custom Resource',
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
						id: 'custom',
						type: 'text',
						style: 'width: 100%;',
						label: "Placeholder Name",
						'default': '',
						required: false,
						validate: function() {
							var pass = true;
                     var thisValue = this.getValue();
                     if (!thisValue || thisValue.length == 0) {
                        pass = false;
                     } else if (!validNameRegex.test(thisValue)) {
                        pass = false;
                     }
							if (!pass) {
								return lang.invalidName;
							}
						},
						setup: function( widget ) {
                  },
						commit: function( widget ) {
                     widget.setData( 'custom', this.getValue() );
						}
					}
            ]
         }]
      };
   };

   CKEDITOR.dialog.add( 'customDialog', function(editor, data)
   {
      return customDialog(editor, data);
   });

})();