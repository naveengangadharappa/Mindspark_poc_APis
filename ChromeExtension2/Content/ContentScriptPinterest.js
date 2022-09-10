accountUsername = null;

async function reqSetMessages(accountID, currentCheck, syncData, messages) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setMessages',
            accountID: accountID,
            currentCheck: currentCheck,
            syncData: syncData,
            messages: messages
        }, function(data) {
            resolve(data);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}


async function reqGetAccountInfo() {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'getAccountInfo'}, function(resp) {
            resolve(resp);
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
    let accountInfo = {};
    let json = null;
    let attempts = 0;
    
    // Sometimes Pinterest pops up a dialog asking the user to select some categories. We need to close
    // this dialog so we can continue.
    let elem = findElement(srchPathPIS('randomDialogCloseBttn'));
    if (elem)
        elem.click();
    
    while (json == null) {
        attempts++;
        let elems = await waitForElements('SCRIPT');
        let text = 'No SCRIPT Matches!';
        for (let elem of elems) {
            text = $(elem).text();
            try {
                json = JSON.parse(text);
            }
            catch (e) {
                console.log('Error parsing JSON: ' + e);
                console.log(text);
            }
            // it looks like the account info could be in one of two places...
            if (json != null && json.hasOwnProperty('props') && json.props.hasOwnProperty('initialReduxState') &&
               json.props.initialReduxState.hasOwnProperty('viewer') && json.props.initialReduxState.viewer.hasOwnProperty('username')) {
               json = json.props.initialReduxState.viewer;
               break;
            }
            if (json != null && json.hasOwnProperty('props') && json.props.hasOwnProperty('context') &&
               json.props.context.hasOwnProperty('user') && json.props.context.user.hasOwnProperty('username')) {
               json = json.props.context.user;
               break;
            }
            json = null;
        }
        if (json != null)
            break;
        // DRL It looks like sometimes when the page is in the background it doesn't get fully
        // populated with the items we seek??
        if (attempts == 10) {
            Log_WriteError("Can't find Pinterest account information in: " + text);
            throw new Error("Pinterest account info not found after 10 seconds");
        }
        await sleep(1);
    }
    try {
        accountInfo.username = json.username;
        accountInfo.id = json.id;
        if (json.hasOwnProperty('fullName'))
           accountInfo.name = json.fullName;
        else
           accountInfo.name = json.full_name;
    }
    catch (e) {
        // split fails if the content is unexpected, when not logged in
        accountInfo = null;
    }
    return accountInfo;
}


async function makePinterestPin(pinDetails)
{
    let elem = await waitForElement(srchPathPIS('headerProfile'));
    elem.click();
    elem = await waitForElement(srchPathPIS('createButton'));
    elem.click();
    elem = await waitForElement(srchPathPIS('createPinButton'));
    elem.click();
    
    elem = await waitForElement(srchPathPIS('pinTitleTextarea'));
    await insertText(elem, pinDetails.Subject);
    elem = await waitForElement(srchPathPIS('descriptionTextarea'));
    await insertText(elem, pinDetails.Body);

    for (let button of pinDetails.Buttons) {
        elem = await waitForElement(srchPathPIS('linkTextarea'));
        await insertText(elem, button.URL);
    
        elem = await waitForElement(srchPathPIS('altTextButton'));
        elem.click();
        elem = await waitForElement(srchPathPIS('altTextarea'));
        await insertText(elem, button.Label);
        break;
    }
    
    await sleep(1);
    for (let attach of pinDetails.Attachments) {
        if (attach.Type.split('/')[0] != 'image' && attach.Type.split('/')[0] != 'video')
            continue;
        elem = await waitForElement(srchPathPIS('imageInput'));
        await uploadAttachment(elem, attach);
        break;
    }
    
    elem = await waitForElement(srchPathPIS('boardSelectButton'));
    console.log(elem.innerText.trim());
    if (pinDetails.SubFolder && elem.innerText.trim() != pinDetails.SubFolder) {
        elem.click();    
        elem = await waitForElement(srchPathPIS('boardSearchInput'));
        await insertText(elem, pinDetails.SubFolder);
        
        let elems = await waitForElements(srchPathPIS('foundBoards'), 2);
        console.log(elems);
        let boardExists = false;
        for (elem of elems) {
            console.log($(elem).text().trim());
            if ($(elem).text().trim() == pinDetails.SubFolder) {
                $(elem).click();
                boardExists = true;
                break;
            }
        }
        if (!boardExists) {
            elem = await waitForElement(srchPathPIS('createBoardButton'));
            elem.click();
            elem = await waitForElement(srchPathPIS('createBoardFinalButton'));
            elem.click();
        }
    }

    await sleep(1);
    elem = await waitForElement(srchPathPIS('savePinButton'));
    await sleep(1);
    elem.click();
    await sleep(5); // seems to need time here to load the pin in the preview otherwise below fails
    elem = await waitForElement(srchPathPIS('seeItNowButton'));
    if (elem == null) {
        // there was an error with the post (missing image, etc.)
        return ERROR_EXTERNAL_ID;
    }
    return elem.getAttribute('href').split('/')[2];
}


async function parseMessage(elem, chatInfo, chatTimestamp) {
    let message = {};
    message.Type = 'pint_msg';
    message.timestamp = chatTimestamp;
    message.Date = timestampToString(chatTimestamp);
    message.Url = null; // DRL FIXIT? Can we get this?
    message.Body = elem.find('span').text();
    let like = elem.find('svg');
    message.Like = like.length > 0;
    message.Attachments = [];
    let pin = elem.find('a');
    if (pin.length > 0 ) {
        let url = pin.attr('href');
        if (url[0] == '/')
            url = 'https://www.pinterest.com' + url;
        message.Attachments.push({URL: url})
    }
    if ($(elem).attr('class').includes('Fje')) {
        message.Folder = 'inbox';
        message.From = chatInfo.name + ' <' + chatInfo.id + '@pintun.socialattache.com>';
        message.To = ['<' + accountUsername + '@pintun.socialattache.com>'];
    }
    else {
        message.Folder = 'sent';
        message.To = [chatInfo.name + ' <' + chatInfo.id + '@pintun.socialattache.com>'];
        message.From = '<' + accountUsername + '@pintun.socialattache.com>';
    }

    await massageAttachments(message);

    return message;
}


async function scrollToConversationTop() {
    let len = null;
    let elems = null;
    while (true) {
        elems = await waitForElements(srchPathPIS('messageDivs'));
        assert(elems.length > 0);
        console.log(elems.length);
        if (len == elems.length) {
            break;
        }
        len = elems.length;
        elems[0].scrollIntoView();
        await sleep(1);
    }
    return elems;
}

async function getChatInfo() {
    let info = {}
    let elem = $(srchPathPIS('moreParticipants'));
    if (elem.length > 0) {
        elem = elem[0];
        elem.dispatchEvent(new Event('mouseover', {bubbles:true}));
    }
    await sleep(2);
    let participantIds = [];
    let participantNames = [];
    let elems = await waitForElements(srchPathPIS('participants'));
    for (let elem of elems) {
        participantIds.push($(elem).attr('href').replaceAll('/', ''));
        participantNames.push($(elem).text().trim());
    }
    info.id = participantIds.join('|');
    info.name = participantNames.join(', ');
    return info;
}


async function getMessages(lastMessageIds, chatTimestamp) {
    await waitForElement(srchPathPIS('backButton'));
    await sleep(1);
    let chatInfo = await getChatInfo();
    let lastMessageId = 0;
    if (chatInfo.id in lastMessageIds) {
        lastMessageId = lastMessageIds[chatInfo.id];
    }
    console.log(chatInfo);
    elems = await scrollToConversationTop();
    let messages = [];
    for (let i = lastMessageId == null ? 0 : lastMessageId+1; i < elems.length; i++) {
        let message = await parseMessage($(elems[i]), chatInfo, chatTimestamp);
        message.Id = i;
        message.Uid = chatInfo.id + '_' + i;
        messages.push(message);
        reqPing();
    }
    lastMessageIds[chatInfo.id] = elems.length-1;
    return { messages: messages, lastMessageIds: lastMessageIds };
}


// DRL FIXIT! This method may not handle all cases. I think we should use a common method across
// social sites and the Facebook one seems the most complete.
function getChatTimestamp(str) {
    let delta = str.split(' ');
    delta = delta[delta.length - 1];
    let last = delta[delta.length-1];
    delta = parseInt(delta.slice(0, -1));
    let timestamp = Date.now();
    if (last == keywordPIS('s')) {
        timestamp -= delta * 1000;
    }
    else if (last == keywordPIS('m')) {
        timestamp -= delta * 60 * 1000;
    }
    else if (last == keywordPIS('h')) {
        timestamp -= delta * 60 * 60 * 1000;
    }
    else if (last == keywordPIS('d')) {
        timestamp -= delta * 24 * 60 * 60 * 1000;
    }
    else if (last == keywordPIS('w')) {
        timestamp -= delta * 7 * 24 * 60 * 60 * 1000;
    }
    else if (last == keywordPIS('y')) {
        timestamp -= delta * 365 * 24 * 60 * 60 * 1000;
    }
    else {
        Log_WriteError('Unrecognized Pinterest interval key in "' + str + '" for language ' + pageLanguage);
    }
    if (timestamp == null || timestamp == undefined) {
        throw new Error("Error parsing Pinterest date delta: " + str);
    }
    return timestamp;
}


async function getChats(lastCheck, lastMessageIds, currentCheck) {
    // we might have one chat up and need to go back to the list of chats
    let elem = await waitForElement(srchPathPIS('returnToConversationsButton'), 1);
    if (elem != null)
        elem.click();
    // we might not have the chat list slider showing
    elem = await waitForElement(srchPathPIS('composeButton'), 1);
    if (elem == null) {
        elem = await waitForElement(srchPathPIS('messagesButton'));
        elem.click();
    }
    let messages = [];
    for (let i = 0; ; i++) {
        await sleep(2);
        let elems = await waitForElements(srchPathPIS('chatDivs'));
        
        for (let j = 0; j < elems.length; j++) {
            // DRL FIXIT? Skip group chats as we don't handle those yet.
            if ($(elems[j]).text().indexOf(',') != -1) {
                elems.splice(j, 1);
                j--;
            }
        }

        if (elems.length == 0) {
            if (lastMessageIds != null && lastMessageIds.length > 0)
                throw new Error("Pinterest chatDivs not found");
            Log_WriteInfo("Either the chatDivs was not found or there are no conversations.")
            break;
        }
        let len = null;
        while (elems.length <= i && len != elems.length) {
            len = elems.length;
            elems[len-1].scrollIntoView();
            await sleep(2);
            elems = await waitForElements(srchPathPIS('chatDivs'));
        }
        if (i >= elems.length) {
            break;
        }
        let delta = findElement(srchPathPIS('chatTimestamp'), null, elems[i]).innerText.trim();
        let chatTimestamp = getChatTimestamp(delta);
        if (lastCheck != null) {
            if (chatTimestamp < lastCheck) {
                break;
            }
        }
        elems[i].click();

        reqPing();

        let chat = await getMessages(lastMessageIds, chatTimestamp);
        lastMessageIds = chat.lastMessageIds;
        messages = messages.concat(chat.messages);
        elem = await waitForElement(srchPathPIS('backButton'));
        elem.click();
    }
    return { messages: messages, lastMessageIds: lastMessageIds };
}


async function sendMessage(message) {
    // we might have one chat up and need to go back to the list of chats
    let elem = await waitForElement(srchPathPIS('returnToConversationsButton'), 1);
    if (elem != null)
        elem.click();
    // we might not have the chat list slider showing
    elem = await waitForElement(srchPathPIS('composeButton'), 1);
    if (elem == null) {
        elem = await waitForElement(srchPathPIS('messagesButton'));
        elem.click();
    }
    elem = await waitForElement(srchPathPIS('composeButton'));
    elem.click();
    elem = await waitForElement(srchPathPIS('contactSearch'));
    let to = getEmailPrefix(message.To[0]);
    await insertText(elem, to);
    elem = await waitForElement(srchPathPIS('searchResults'));
    // DRL FIXIT! Remove jQuery!
    if ($(elem).text() != 'Recent' && $(elem).text() != to) {
        Log_WriteError("Can't find matching recipient \"" + to + "\" for message " + message.Uid);
        return ERROR_EXTERNAL_ID;
    }
    elem.click();
    elem = await waitForElement(srchPathPIS('messageTextarea'));
    await insertText(elem, message.Body);
    elem = await waitForElement(srchPathPIS('messageSendButton'));
    elem.click();
    
    let elems = await scrollToConversationTop();
    console.log(elems);
    console.log(DateAndTime_Now() + " Send msg scroll to top elems " + (elems.length - 1));
    return to + '_' + (elems.length - 1);
}


async function loopPinterest() {
    console.log(DateAndTime_Now() + " loopPinterest()"); // this is here so we can click on it in the console for easier debugging ;-)

    if (!await contentScriptInit('PinterestScrape'))
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
    
                accountUsername = accountInfo.username;
            }
    
            let currentCheck = Date.now();
            let resp = await reqGetAction(accountInfo.id, accountInfo.name);
            if (resp.action == 'getMessages') {
                let lastMessageIds = JSON.parse(resp.lastMessageIds) || {}
                let chats = await getChats(resp.lastCheck, lastMessageIds, currentCheck);
                if (await reqSetMessages(accountInfo.id, currentCheck, JSON.stringify(chats.lastMessageIds), chats.messages))
                    continue;   // no wait, just check again for next action
                delay = timings.INTER_CONVERSATION_CHECK_DELAY;
            }
            else if (resp.action == 'sendMessage') {
                let id = await sendMessage(resp.message);
                let from = accountInfo.name + ' <' + accountInfo.username + '@pintun.socialattache.com>';
                await reqSetMessageId(accountInfo.id, resp.message.Uid, id, from);
                delay = timings.INTER_MESSAGE_DELAY;
            }
            else if (resp.action == 'makePost') {
                let id = await makePinterestPin(resp.post);
                let from = '<' + accountInfo.username + '@pintun.socialattache.com>';
                await reqSetPostId(accountInfo.id, resp.post.Uid, id, from);
                delay = timings.INTER_POST_DELAY;
            }
            else if (resp.action == 'getContact') {
                await sleep(4); // we have to wait for the page to load since the background script just set the URL
                let vCard = await getvCardFromPinterestProfile();
                await reqSendContact('PinterestScrape', resp.accountID, resp.syncCommandID, vCard);
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
            delay = await handleScraperException('PinterestScrape', e, 'https://www.pinterest.com');
        }
    
        try {
            await pingingSleep(delay);
        }
        catch (e) {
            await handleScraperException('PinterestScrape', e, 'https://' + window.location.host);
        }
    }
}


DocumentLoad.AddCallback(function(rootNodes) {
    if (rootNodes.length != 1 || rootNodes[0] != document.body)
        return;     // this only needs to be done once on initial page load
    
    loopPinterest();
});