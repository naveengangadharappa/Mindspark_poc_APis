window.console = (function (logger) {
  console.old = console.log;
  console.log = function () {
    var output = "",
      arg,
      i;

    for (i = 0; i < arguments.length; i++) {
      arg = arguments[i];
      output += '<span class="log-"' + typeof arg + '">';

      if (
        typeof arg === "object" &&
        typeof JSON === "object" &&
        typeof JSON.stringify === "function"
      ) {
        output += JSON.stringify(arg);
      } else {
        output += arg;
      }

      output += "</span>&nbsp;";
    }
    Messaging.SendMessageToNativeApp(
      { type: "native-log", value: JSON.stringify(arg) },
      function (response) {
          if (response) response();
      }
    );
    if (logger) {
      logger.innerHTML += output + "<br>";
    }
    console.old.apply(undefined, arguments);
  };
  return console;
})(document.getElementById("logger"));
