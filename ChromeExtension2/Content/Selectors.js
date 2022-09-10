// A super selector can consist of any combination of selectors, and commands enclosed in curly braces that
// are applied individually to each of the matches found thus far. The following example looks for nodes by
// class, then goes to the parent of EACH match and searches from there for nodes by a second class, then
// for all of the matching elements returns the second segment of the href attribute:
//    "DIV.child1_class {parentElement} DIV.child2_class {nextElementSibling.href.split('/')[1]}"
// See our "Chrome Extension Design.odt" document for more information.

function _handleSuperSelector(root, superSelector) {
    assert(root == document || root instanceof HTMLElement || typeof root == 'string');
    
    // split the super selector into selectors, commands, and delimiters - we are separating on top level
    // groups of "{ xxx }" or "xxx,xxx" and skipping those characters inside "()" or "[]" parameters (and strings)
    let parts = Utilities_StringToArraySkipGroups(superSelector, "{},", {'(': ')', '[': ']'}, true);
    
    // each group has its current result which we then accumulate into the final result
    // when we start a new group
    let currentResult = [root];
    let finalResult = [];
    
    for (let i = 0; i < parts.length; i++) {
        parts[i] = parts[i].trim();

        if (parts[i] == '')
            continue;
    
        if (parts[i] == ',') {
            // save what we have and start at the top with a new group
            finalResult = finalResult.concat(currentResult);
            currentResult = [root];
            continue;
        }
    
        if (parts[i].startsWith(':root')) { // this doesn't seem to work from inside the selector so we handle it specifically
            parts[i] = parts[i].substr(5);
            currentResult = [document.body];
        }
    
        if (currentResult.length == 0)
            continue;   // there are no results, so this group is done but there may be another group
        
        let objs = currentResult;
        currentResult = [];
        
        if (parts[i] == '{') {
            assert(parts[i+2] == '}');
            let commands = parts[i+1].trim();

            // each commands section (enclosed in "{" and "}") applies the commands to each individual result
            // collected thus far, unless the first command is "merge" in which case it needs all the results
            if (commands.startsWith('merge')) {
                currentResult = currentResult.concat(_handleCommands(objs, commands));
            }
            else {
                for (let obj of objs) {
                    currentResult = currentResult.concat(_handleCommands(obj, commands));
                }
            }

            i += 2;         // we have parsed the three parts of the commands section: { X }
        }
        else {
            let selector = parts[i].trim();
            // each selector section applies the selector to each individual result collected thus far
            for (let obj of objs) {
                currentResult = currentResult.concat(_handleSelector(obj, selector));
            }
        }
    }
    
    // save the result of the last group, and remove duplicates
    finalResult = finalResult.concat(currentResult);
    Utilities_ArrayRemoveDuplicates(finalResult);
    
    return finalResult;
}

// returns an array of matches
function _handleSelector(node, selector) {
    return Array.from(node.querySelectorAll(selector));
}

function _handleParentBySelector(node, selector) {
    node = Utilities_GetParentBySelector(node, selector);
    return node ? node : undefined;
}

function _handleHasMatch(node, selector, negate) {
    let test = Utilities_HasOffspringWithSelector(obj, params[0]);
    return (negate ? !test : test) ? node : undefined;
}

// accepts string (to be converted to regexp) or regexp object
function _handleAttributeMatch(node, attribute, regexp, negate) {
    if (typeof regexp === 'string' || regexp instanceof String)
        regexp = new RegExp(regexp);
    // convert "aria-label" to "ariaLabel"
    attribute = attribute.replace(/-([a-z])/g, function(match) { return match[1].toUpperCase(); });
    let test = regexp.test(node[attribute]);
    return (negate ? !test : test) ? node : undefined;
}

// accepts string (to be converted to regexp) or regexp object
function _handleUrlMatch(node, regexp, negate) {
    if (typeof regexp === 'string' || regexp instanceof String)
        regexp = new RegExp(regexp);
    let test = regexp.test(window.location.href);
    return (negate ? !test : test) ? node : undefined;
}

function _parseParameters(str) {
    // split the parameters - we are separating on commas and skipping commas inside nested parameters (and strings)
    let params = Utilities_StringToArraySkipGroups(str, ",", {'(': ')', '[': ']'}, false);
    for (let i = 0; i < params.length; i++)
        params[i] = _parseParameter(params[i]);
    return params;
}

// this checks for strings and regex as those need special handling, as well as handling spaces around parameters
function _parseParameter(param) {
    param = param.trim();   // we should always ignore any surrounding spaces
    
    if (param.startsWith('"') || param.startsWith("'"))
    {
        // this is a string format so we have to un-escape the string
        for (let i = 1; i < param.length - 2; i++)
        {
            if (param[i] == '\\')
            {
                // remove the backslash and skip over the escaped character
                param = param.substr(0, i) + param.substr(i + 1);
            }
        }

        param = param.substr(1, param.length-2);
    }
    else if (param.startsWith('/'))
    {
        // sometimes we need the slash escaped: new RegExp(/\//)
        // and sometimes we don't: new RegExp("/")
        // and since we're converting from the former to the latter we need to unescape it
        param = Utilities_ReplaceInString(param, "\\/", "/");
        
        let iFlags = param.lastIndexOf('/'); // get index of last slash (any flags come after)
        let regexp = param.substr(1, iFlags-1); // remove start and end slashes
        param = new RegExp(regexp, param.substr(iFlags+1));
    }
    else if (Utilities_IsAlphabetic(param.substr(0,1)))
    {
        // a variable name
        
        let parts = param.split('.');
        let value = window;
        for (let i = 0; i < parts.length; i++) {
            if (!value.hasOwnProperty(parts[i]))
                throw new Error('Selector parameter ' + param + ' is undefined at ' + parts[i]);
            
            value = value[parts[i]];
        }
        
        // if this is our localized array we need to find the appropriate language
        if (parts[0] == 'localizedKeywords' && typeof value !== 'string' && !(value instanceof String))
            param = localizedKeywordItem(value, 'selector parameter ' + param);
        else
            param = value;
    }
    else
    {
        // this should be a number
    }
    
    return param;
}

// the objs passed in could be one item or an array, but whatever it is we apply the commands string to it
// returns an array of results
function _handleCommands(objs, commands) {
    // split the commands - we are separating on periods and oben square brackets, skipping those inside
    // parameters, square brackets, and strings
    commands = Utilities_StringToArraySkipGroups(commands, ".[", {'(': ')', '[': ']'}, true);
    
    // the above splits "[" on its own so we'll put it back where it belongs and while we're at it we'll trim
    // the items and remove empty items and dots as those are skipped anyway and this will simplify our code
    for (let i = 0; i < commands.length; i++) {
        if (commands[i] == '[') {
            commands[i+1] = '[' + commands[i+1];
            commands = commands.slice(0, i).concat(commands.slice(i+1));
        }
        else {
            commands[i] = commands[i].trim();
            if (commands[i] == '' || commands[i] == '.') {
                commands = commands.slice(0, i).concat(commands.slice(i+1));
                i--;
            }
        }
    }
    
    return _handleCommandsArray(objs, commands);
}

// the objs passed in could be one item or an array, but whatever it is we apply the commands array to it
// returns an array of results
function _handleCommandsArray(objs, commands) {
    let result = objs;
    
    for (let i = 0; i < commands.length; i++) {
        let command = commands[i];

        // params is null if there were no () specified, otherwise it's an array
        let params = null;
        let j = command.indexOf('(');   // DRL FIXIT? We don't handle a "(" inside "[]".
        if (j != -1) {
            params = _parseParameters(command.substr(j+1, command.length - j - 2));
            command = command.substr(0, j);
        }
    
        objs = result;
        result = [];
        
        if (command == 'fork') {            // apply the rest of the commands to the individual results
            assert(params && params.length == 0);
            commands = commands.slice(i+1); // skip "fork"
            for (let obj of objs) {
                result = result.concat(_handleCommandsArray(obj, commands));
            }
            break;                          // we've parsed all of the commands
        }
        
        if (command == 'merge') {
            assert(i == 0); // this must be the first command in the section
            if (params && params.length == 1)
                result = [objs.join(params[0])];    // combine all the results thus far - and they must be strings
            else if (params == null)
                result = objs;
            else
                assert(0);
        }
        else
            result = _handleCommand(objs, command, params);

        if (result == undefined || result == null || (Array.isArray(result) && result.length == 0)) {
            result = [];
            break;  // there are no results, so we're done
        }
    }
    
    return result;
}

// the obj passed in could be one item or an array, but whatever it is we apply the command to it
// a command could return undefined (I think), null, a single result, or an array of results
// params is null if there were no () specified, otherwise it's an array
function _handleCommand(obj, command, params)
{
    try {
        if (command.startsWith('['))
            return obj[command.substr(1, command.length-2)];
        else if (params === null)
            return obj[command];
        else if (command == 'parentBySelector') {
            assert(params && params.length == 1);
            return _handleParentBySelector(obj, params[0]);
        }
        else if (command == 'selfOrChildrenBySelector') {
            assert(params && params.length == 1);
            return Utilities_GetThisOrChildrenBySelector(obj, params[0]);
        }
        else if (command == 'has' || command == '!has') {
            assert(params && params.length == 1);
            return _handleHasMatch(obj, params[0], command.substr(0, 1) == '!');
        }
        else if (command == 'propMatch' || command == '!propMatch') {
            assert(params && params.length == 2);
            return _handleAttributeMatch(obj, params[0], params[1], command.substr(0, 1) == '!');
        }
        else if (command == 'urlMatch' || command == '!urlMatch') {
            assert(params && params.length == 1);
            return _handleUrlMatch(obj, params[0], command.substr(0, 1) == '!');
        }
        else
            return obj[command].apply(obj, params);
    }
    catch (e) {
        Log_WriteException(e, 'Error executing command "' + command + '"');
        Log_WriteInfo('Object: ' + GetVariableAsString(obj));
        Log_WriteInfo('Command: ' + command);
        Log_WriteInfo('Parameters: ' + GetVariableAsString(params));
        if (Array.isArray(obj))
            Log_WriteInfo('It looks like your object is an array. Maybe you need to add [0] or fork() before this command?');
        return undefined;
    }
}

// NOTE: Selector can be an array to wait for multiple options and can be of our "super selector" format.
// if exceptionName is provided an Error will be thrown if the element is not found
async function waitForElement(selector, timeoutSeconds= null, root = null, exceptionName = null) {
    if (!Array.isArray(selector))
        selector = [selector];
    if (root == null)
        root = document.body;
    if (timeoutSeconds == null)
        timeoutSeconds = 20;
    assert(timeoutSeconds <= 600);  // check that caller isn't passing milliseconds
    let startTimeInMs = Date.now();
    while(true) {
        for (let i = 0; i < selector.length; i++) {
            let elems = _handleSuperSelector(root, selector[i]);
            if (elems.length > 0) {
                return elems[0];
            }
        }
//console.log(DateAndTime_Now().ToFormat('%/D %:T') + ' waiting for ' + (timeoutSeconds * 1000) + ' elapsed time: ' + (Date.now() - startTimeInMs));
        await sleep(0.3);
//console.log(DateAndTime_Now().ToFormat('%/D %:T') + ' done sleeping, elapsed time: ' + (Date.now() - startTimeInMs));
        if (timeoutSeconds && Date.now() - startTimeInMs > timeoutSeconds * 1000) {
            if (exceptionName != null) {
                throw new Error(exceptionName + " not found");
            }
            else {
                return null;
            }
        }
    }
}


// NOTE: Selector can be an array to wait for the first of multiple options and can be of our "super selector" format.
// if exceptionName is provided an Error will be thrown if the element is not found
async function waitForElements(selector, timeoutSeconds= null, root = null, exceptionName = null) {
    if (!Array.isArray(selector))
        selector = [selector];
    if (root == null)
        root = document.body;
    if (timeoutSeconds == null)
        timeoutSeconds = 20;
    assert(timeoutSeconds <= 600);  // check that caller isn't passing milliseconds
    let startTimeInMs = Date.now();
    while(true) {
        for (let i = 0; i < selector.length; i++) {
            let elems = _handleSuperSelector(document, selector[i]);
            if (elems != null && elems.length > 0) {
                return elems;
            }
        }
        if (timeoutSeconds && Date.now() - startTimeInMs > timeoutSeconds * 1000) {
            if (exceptionName != null) {
                throw new Error(exceptionName + " not found");
            }
            else {
                return [];
            }
        }
        await sleep(0.3);
    }
}

// selectorSuffix might be something like ":not(.SA_augmented)" to add to each selector
// items are returned in the order they appear on the page unless there are commands (i.e. "{x}")
// in the selector
// NOTE: If the selectors is an array this will only return the results from the first selector
// with matches!
function findElements(selectors, selectorSuffix, elem) {
    if (!Array.isArray(selectors))
        selectors = [selectors];
    else
        selectors = selectors.slice();   // create a copy so we don't change the original!
    if (selectorSuffix == null)
        selectorSuffix = '';
    if (elem == null)
        elem = document.body;
    
    if (selectors.join('').indexOf('{') == -1) { // use the faster version
        // we test for each selector in the array return the first thing != [] we find
        for (let selector of selectors) {
            assert(selectorSuffix == '' || selector.indexOf(',') == -1);  // would need special handling, like below
            let elems = Array.prototype.slice.call(elem.querySelectorAll(selector + selectorSuffix));
            // elems results for
            // let elems = findElements(srchPathPG('profileNameMsngr'), ':not(.SA_augmented):not(.SA_ButtonIcon)');
            // [0-3] => elems = []
            // => selectors are bad
            if (elems == null) {
                assert(0);  // I think this never happens
            }
            else if (elems.length > 0) {
                return elems;
            }
        }
    }
    else {
        for (let selector of selectors) {
            let elems = _handleSuperSelector(elem, selector);
            // special handling to remove items that don't match the suffix
            if (elems.length > 0) {
                if (selectorSuffix) {
                    for (let i = 0; i < elems.length; i++) {
                        if (!elems[i].matches(selectorSuffix)) {
                            elems = elems.slice(0, i).concat(elems.slice(i+1));
                            i--;
                        }
                    }
                }
                return elems;
            }
        }
    }
    
    return [];
}

function findElement(selector, selectorSuffix, elem) {
    let elems = findElements(selector, selectorSuffix, elem);
    if (elems.length == 0)
        return null;
    return elems[0];
}

async function waitForElementsGone(selector, timeout = 20, root) {
    let startedAt = new Date().getTime() / 1000
    let isGone = false;
    do {
        if(findElement(selector, null, root) == null){
            isGone = true;
        }
        await sleep(1);
    } while (!isGone && startedAt-(new Date().getTime() / 1000) < timeout);
    return isGone;
}