async function reqSetMessages(accountID, currentCheck, messages) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setMessages',
            accountID: accountID,
            currentCheck: currentCheck,
            messages: messages
        }, function(data) {
            resolve(data);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqGetAccountInfo() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getAccountInfo'}, function(data) {
           resolve(data);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetAccountInfo(accountInfo) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setAccountInfo', 
            id: accountInfo.id, 
            name: accountInfo.name,
            username: accountInfo.username
        }, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getAccountInfo() {
    let accountInfo = null;
    let elems = await waitForElements('SCRIPT');
    for (let elem of elems) {
        let text = $(elem).text();
        // DRL FIXIT? Perhaps we should JSON.parse() the text like we do for Pinterest to avoid errors with our parsing below?
        if (text.includes('screen_name')) {
            accountInfo = {};
            try {
                accountInfo.username = text.split('"screen_name":"')[1].split('"')[0];
                accountInfo.name = text.split('"name":"')[1].split('"')[0];
                accountInfo.id = text.split('"id_str":"')[1].split('"')[0];
            }
            catch (e) {
                // split fails if the content is unexpected, when not logged in
                accountInfo = null;
            }
            break;
        }
    }
    if (accountInfo == null)
        throw new Error("Twitter account info not found");
    return accountInfo;
}


async function makeTwitterPost(post) {
    let elem = await waitForElement(srchPathTWS('homeButton'));
    elem.click();

    await sleep(1);
    elem = await waitForElement(srchPathTWS('tweetTextarea'));
    await insertText(elem, post.Body);

    await sleep(1);
    for (let attach of post.Attachments) {
        if (attach.Type.split('/')[0] != 'image')
            continue;
        elem = await waitForElement(srchPathTWS('imageInput'));
        await uploadAttachment(elem, attach);
        break;
    }

    elem = await waitForElement(srchPathTWS('tweetButton'));
    elem.click();

    await sleep(3);
    elem = await waitForElement(srchPathTWS('tweetLink'), 5);
    let msg = await waitForElement(srchPathTWS('errorMessage'), 1);
    // DRL FIXIT! Move to selector!
    if (elem == null || (msg != null && msg.innerText.indexOf(keywordTWS('was sent')) == -1)) {
        Log_WriteError("Error tweeting " + post.Uid + ": " + (msg ? msg.innerText.trim() : 'none'));
        return ERROR_EXTERNAL_ID;
    }
    return elem.getAttribute('href').split('/')[3];
}


async function sendMessage(message) {
    let to = getEmailPrefix(message.To[0]);
    
    let elem = await waitForElement(srchPathTWS('messagesPage'));
    elem.click();
    elem = await waitForElement(srchPathTWS('composeMessage'));
    elem.click();
    
    elem = await waitForElement(srchPathTWS('searchProfile'));
    await insertText(elem, '@' + to);
    
    elem = await waitForElement(srchPathTWS('profilesList'));
    await sleep(2);
    if (elem == null || elem.innerText.trim() != '@' + to) {
        elem = await waitForElement(srchPathTWS('cancelMessageButton'));
        elem.click();
        await sleep(2);
        return ERROR_EXTERNAL_ID;
    }
    elem.parentElement.click();
    
    elem = await waitForElement(srchPathTWS('messageNextButton'));
    elem.click();
    
    elem = await waitForElement(srchPathTWS('messageTextarea'));
    await insertText(elem, message.Body);
    
    for (let attach of message.Attachments) {
        let type = attach.Type.split('/')[0];
        if (type != 'video' && type != 'image')
            continue;
        elem = await waitForElement(srchPathTWS('inputFile'));
        await uploadAttachment(elem, attach);
        break;
    }
    
    elem = await waitForElement(srchPathTWS('sendMessageButton'));
    elem.click();
    
    return NO_EXTERNAL_ID;
}


// DRL FIXIT! This method may not handle all cases. I think we should use the methods in DateAndTimeHelpers.js
// and enhance them as needed for our purposes.
function parseDateTime(dateTime) {
    console.log('DT', dateTime);
    let date = new Date();
    if (dateTime.split(',').length == 3) {
        date = new Date(dateTime);
    }
    else {
        let parts = dateTime.trim().split(' ');
        if (parts.length == 2) {
            parts.unshift(keywordTWS('Today'));
        }
        else {
            parts[0] = parts[0].replace(',', '');
        }
        let diff = 0;
        if (parts[0] == keywordTWS('Today')) {
        }
        else if (parts[0] == keywordTWS('Yesterday')) {
            diff = 1;
        }
        else if (keywordTWS('DaysInWeek').indexOf(parts[0]) != -1) {
            diff = date.getDay() - keywordTWS('DaysInWeek').indexOf(parts[0]);
            if (diff <= 0) {
                diff = 7 + diff;
            }
        }
        else {
            Log_WriteError('Unrecognized Twitter interval key in "' + dateTime + '" for language ' + pageLanguage);
            throw new Error("Got invalid timestamp")
        }
        date.setDate(date.getDate() - diff);
        date = new Date(date.toString().substring(0, 16) + parts[1] + ' ' + parts[2]);
    }
    let d = date.getTime();
    if (timestampToString(d) == null) {
        Log_WriteError('Got invalid Twitter timestamp converting string "' + dateTime + '"  for language ' + pageLanguage);
        throw new Error("Got invalid timestamp")
    }
    return d;
}


async function parseMessage(chatInfo, accountInfo, message_div) {
    if (message_div.tagName != 'DIV' || findElement(srchPathTWS('msgEntry'), null, message_div) == null)
        return null;
    
    let message = {
        Type: 'twit_msg',
        Uid: NO_EXTERNAL_ID,
        Date: null,
        Timestamp: null,
        Url: window.location.href,
        Body: '',
        Attachments: []
    };
    let elem = $(message_div).children()[0];
    let elem_message = $($(elem).children()[0]).children()[0];
    let elem_time = $(elem).children()[1];
    let elem_content = $(elem_message).children()[1];
    if ($(elem_message).children().length >= 3) {
        message.Folder = 'inbox';
        message.From = chatInfo.name + ' <' + chatInfo.id + '@twitun.socialattache.com>';
        message.To = [accountInfo.name + ' <' + accountInfo.id + '@twitid.socialattache.com>'];
    }
    else {
        message.Folder = 'sent';
        message.From = accountInfo.name + ' <' + accountInfo.id + '@twitid.socialattache.com>';
        message.To = [chatInfo.name + ' <' + chatInfo.id + '@twitun.socialattache.com>'];
    }
    message.Body = $(elem_content).text();
    // if (elem_text.length > 0) {
    //     message.Body = elem_text.text();
    // }
    // let elem_a = $(elem_content).find('a');
    // if (elem_a.length > 0) {
    //     message.Body = elem_a.attr('href');
    // }
/* DRL FIXIT? Twitter seems to protect their attachments so we'll need to figure a workaround.
    let elem_img = $(elem_content).find('img');
    if (elem_img.length > 0) {
        let src = $(elem_img).attr('src');
        src = await getFinalUrl(src);
        message.Attachments.push({URL: src});
    }
*/
    elem_time = $(elem_time).find(srchPathTWS('msgTimeButton'));
    if (elem_time.length > 0) {
        let timestamp = parseDateTime(elem_time.text().trim());
        if (timestamp) {
            message.Timestamp = timestamp;
            message.Date = timestampToString(timestamp);
        }
    }

    await massageAttachments(message);

    return message;
}


async function getMessages(chatInfo, accountInfo, lastCheck, currentCheck) {
    let messages = [];
    let count = 0;
    let empty_loops = 0;
    let break_loop = false;
   
    let container = await waitForElement(srchPathTWS('messagesContainer'), 10, null, 'Twitter messagesContainer');
    let top_message = $(container).children()[0];
    assert(top_message != null);
    for (let el of $(container).children()) {
        let message = await parseMessage(chatInfo, accountInfo, el);
        if (message != null)
            messages.push(message);
    }
    
    let containerListener = await waitForElement(srchPathTWS('messagesContainer'));
    $(containerListener).on('DOMNodeInserted', function(e) {
        if (e.target.tagName == 'DIV' && $(e.target).find(srchPathTWS('msgEntry')).length > 0) {
            count++;
        }
    });
    
    try
    {
        while (true)
        {
            top_message.scrollIntoView();
            await pingingSleep(2);
            container = await waitForElement(srchPathTWS('messagesContainer'));
            top_message = $(container).children()[0];
            assert(top_message != null);
            if (count == 0)
            {
                empty_loops++;
            }
            else
            {
                let new_messages = [];
                for (let el of $(container).children())
                {
                    let message = await parseMessage(chatInfo, accountInfo, el);
                    if (message == null)
                        continue;
                    
                    new_messages.push(message);
                    if (message.Timestamp && message.Timestamp < lastCheck)
                    {
                        break_loop = true;
                    }
                }
                new_messages = new_messages.slice(0, count);
                messages = new_messages.concat(messages);
            }
            count = 0;
            if (break_loop)
            {
                break;
            }
            if ($(container).find(srchPathTWS('msgLink')).length > 0)
            {
                break;
            }
            if (empty_loops == 3)
            {
                break;
            }
        }
    }
    finally {
        $(containerListener).unbind('DOMNodeInserted');
    }
    
    messages = messages.reverse();
    let last_timestamp = messages[0].Timestamp;
    let cur_timestamp = messages[0].Timestamp;
    let filtered_messages = [];
    for (let message of messages) {
        if (message.Timestamp) {
            cur_timestamp = message.Timestamp;
        }
        else {
            message.Timestamp = cur_timestamp;
            message.Date = timestampToString(cur_timestamp);
        }
        if (lastCheck && message.Timestamp < lastCheck) {
            break;
        }
        if (message.Timestamp <= currentCheck) {
            filtered_messages.push(message);
        }
    }
    filtered_messages = filtered_messages.reverse();
    console.log(filtered_messages);
    return [last_timestamp, filtered_messages];
}


async function getChatInfo() {
    let info = {};
    let elem = await waitForElement(srchPathTWS('chatInfo'));
    elem.click();
    let elems = await waitForElements(srchPathTWS('chatProfileLink'), 10, null, 'Twitter chatProfileLink');
    let participants = [];
    for (let el of elems) {
        participants.push($(el).attr('href').replace('/', '').trim());
    }
    info.id = participants.join('|');
    
    elems = await waitForElements(srchPathTWS('chatProfileName'));
    participants = [];
    for (let el of elems) {
        participants.push($(el).text().trim());
    }
    info.name = participants.join(', ');
    elem = await waitForElement(srchPathTWS('chatInfoBack'));
    elem.click();
    await sleep(2);
    return info;
}


async function getChats(accountInfo, lastCheck, currentCheck) {
    let elem = await waitForElement(srchPathTWS('messagesPage'));
    elem.click();
    let checked = [];
    let messages = [];
    let break_loop = false;
    while (true) {
        let elems = await waitForElements(srchPathTWS('conversationsList'), 20);
        if (elems.length == 0)
        {
            // Issue 62: I'm going to watch this case to see if it recovers or not.
            Log_WriteWarning('Breaking out of Twitter chats loop without finding any conversations!');
            break;
        }

        for (let i = 0; i < elems.length; i++)
        {
            // DRL FIXIT? Skip group chats as we don't handle those yet.
            if (elems[i].innerText.indexOf(',') != -1) {
                elems.splice(i, 1);
                i--;
            }
        }
        
        if (elems.length == 0) {
            Log_WriteWarning('No Twitter chats found');
        }
        
        let a = null;
        let unchecked = false;
        for (elem of elems) {
            a = elem.querySelector('a');
            if (a == null) {
                continue;   // this is not a conversation because it doesn't have an A element
            }
            let href = a.attr('href');
            if (!checked.includes(href)) {
                elem.scrollIntoView();
                elem = findElement(srchPathTWS('chatsTab'), null, elem);
                elem.click();
                await sleep(1);
                let chatInfo = await getChatInfo();
                console.log(chatInfo);
   
                reqPing();
   
                let [last_timestamp, filtered_messages] = await getMessages(chatInfo, accountInfo, lastCheck, currentCheck);
                messages = messages.concat(filtered_messages);
                if (lastCheck && last_timestamp < lastCheck) {
                    break_loop = true;
                }
                checked.push(href);
                unchecked = true;
                // it looks like when the screen is narrow the conversations list is hidden and there is a button
                // you have to click to get back to it, but this doesn't happen on a wide display
                elem = findElement(srchPathTWS('returnFromChatsTab'));
                if (elem) {
                    elem.click();
                    await sleep(1);
                }
                break;
            }
        }
        if (break_loop) {
            break;
        }
        // the end of the chats list should contain an item with no A element so that's how we know we're at the end
        if (a == null || a.length == 0) {
            break;
        }
        if (!unchecked) {
            elems.last().get(0).scrollIntoView();
            await pingingSleep(1);
        }
        console.log(checked);
    }
    return messages;
}


async function loopTwitter()
{
    console.log(DateAndTime_Now() + " loopTwitter()");    // this is here so we can click on it in the console for easier debugging ;-)
    
    if (!await contentScriptInit('TwitterScrape'))
        return;

    let accountInfo = null;
    
    while (true) {
        let delay = timings.BUSY_LOOP_DELAY;

        try {
            if (!await handleSocialAttacheLogin(true)) {
                await pingingSleep(timings.SA_NOT_LOGGED_IN_DELAY);
                continue;
            }
            
            if (accountInfo == null) {
                accountInfo = await getAccountInfo();
                Log_WriteInfo('Got account info: ' + GetVariableAsString(accountInfo));
                let savedAccountInfo = await reqGetAccountInfo();
                if (savedAccountInfo == null || savedAccountInfo.id != accountInfo.id) {
                    Log_WriteInfo('Account info: ' + GetVariableAsString(accountInfo));
                    await reqSetAccountInfo(accountInfo);
                }
            }
   
            let currentCheck = Date.now();
            let resp = await reqGetAction(accountInfo.id, accountInfo.name);
            if (resp.action == 'getMessages') {
                let messages = await getChats(accountInfo, resp.lastCheck, currentCheck);
                if (await reqSetMessages(accountInfo.id, currentCheck, messages))
                    continue;   // no wait, just check again for next action
                delay = timings.INTER_CONVERSATION_CHECK_DELAY
            }
            else if (resp.action == 'makePost') {
                let id = await makeTwitterPost(resp.post);
                let from = '<' + accountInfo.id + '@twitid.socialattache.com>';
                await reqSetPostId(accountInfo.id, resp.post.Uid, id, from);
                delay = timings.INTER_POST_DELAY;
            }
            else if (resp.action == 'sendMessage') {
                let id = await sendMessage(resp.message);
                let from = accountInfo.name + ' <' + accountInfo.id + '@twitid.socialattache.com>';
                await reqSetMessageId(accountInfo.id, resp.message.Uid, id, from);
                delay = timings.INTER_MESSAGE_DELAY;
            }
            else if (resp.action == 'getContact') {
                await sleep(4); // we have to wait for the page to load since the background script just set the URL
                let vCard = await getvCardFromTwitterProfile();
                await reqSendContact('TwitterScrape', resp.accountID, resp.syncCommandID, vCard);
                delay = timings.INTER_CONTACT_DELAY;
            }
            else if (resp.action == 'reload') {
                delay = 60; // this command is just to make the page wait to be reloaded, as requesting another action at this URL would be bad
            }
            else if (resp.action == 'retry') {
                delay = 0;  // this command is just to make things quicker when the server wants the action tried again
            }
            else if (resp.action == null) {
                delay = timings.IDLE_LOOP_DELAY;
            }
            else {
                assert(0, "Unrecognized action: " + resp.action);
            }
        }
        catch (e) {
            accountInfo = null; // in case the exception was due to logging out, try to get account info
            delay = await handleScraperException('TwitterScrape', e, 'https://www.twitter.com');
        }
    
        try {
            await pingingSleep(delay);
        }
        catch (e) {
            await handleScraperException('TwitterScrape', e, 'https://' + window.location.host);
        }
    }
}


DocumentLoad.AddCallback(function(rootNodes) {
    if (rootNodes.length != 1 || rootNodes[0] != document.body)
        return;     // this only needs to be done once on initial page load
    
    loopTwitter();
});