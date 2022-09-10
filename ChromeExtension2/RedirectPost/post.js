var onMessageHandler = function(message) {
   if (message.params == undefined)
      return; // not our message
  
   // Ensure it is run only once, as we will try to message twice
   chrome.runtime.onMessage.removeListener(onMessageHandler);
  
   // code from https://stackoverflow.com/a/7404033/934239
   var form = document.createElement('form');
   form.setAttribute('method', 'post');
   form.setAttribute('action', message.url);
   form.setAttribute('accept-charset', 'utf-8');
   for(var key in message.params) {
      var hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', message.params[key]);
      form.appendChild(hiddenField);
   }
   document.body.appendChild(form);
   form.submit();
}

chrome.runtime.onMessage.addListener(onMessageHandler);