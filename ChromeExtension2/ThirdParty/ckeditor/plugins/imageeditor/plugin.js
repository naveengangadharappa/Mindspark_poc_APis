var editorImage = null;
CKEDITOR.plugins.add( 'imageeditor', {
    icons: 'imageeditor',
    init: function( editor ) {
      
      editor.addCommand(
        'imageeditor',
        new CKEDITOR.command(editor, {
          exec: function(editor) {
            var selectedElement = editor.getSelection().getSelectedElement();
            if (selectedElement && selectedElement.getName() == 'img') {
              editorImage = selectedElement.$;
              ImageEditor.CreateImageEditor(Resources_GetResourceIDFromUrl(editorImage.src), function(resourceID, name) {
                var src = Form_RootUri + '/v2/Resources/' + resourceID + '/Data';
                editorImage.src = src;
                editorImage.setAttribute('data-cke-saved-src', src);
              })
            } else {
              alert(Str("Please select an image to edit."));
            }
          }
        })
      );
      editor.ui.addButton( 'ImageEditor', {
        label: 'Edit Image',
        command: 'imageeditor',
        toolbar: 'insert'
      });
      var command = editor.getCommand( 'imageeditor' );
      command.setState( CKEDITOR.TRISTATE_DISABLED );
      editor.on( 'selectionChange', function( evt ) {
        if (editor.readOnly) {
          return;
        }
        var command = editor.getCommand( 'imageeditor' ),
        element = evt.data.path.lastElement && evt.data.path.lastElement.getAscendant( 'img', true );
        if (element && element.getName() == 'img') {
          command.setState( CKEDITOR.TRISTATE_OFF );
        } else {
          command.setState( CKEDITOR.TRISTATE_DISABLED );
        }
      });
    }
});
