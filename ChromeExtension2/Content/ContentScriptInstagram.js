async function reqSetAccounts(accounts) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
           type: 'setAccounts', accounts: accounts
        }, function(resp) {
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
            // NOTE: We don't use the name as his appears to be the users actual name and
            // therefore would be the same across his accounts
            name: accountInfo.id,
        }, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}


// ==============================================
// messaging helpers


async function getMessagingAccountInfo() {
    let accountInfo = null;
    let elems = await waitForElements('SCRIPT');
    for (let elem of elems) {
        let text = elem.innerText;
        // DRL FIXIT? Perhaps we should JSON.parse() the text like we do for Pinterest to avoid errors with our parsing below?
        if (text.includes('full_name')) {
            accountInfo = {};
            try {
// we could provide the id and the username and the full name but it works best for our purposes to use
// the username as the ID since in some cases the actual ID is hard to get
                if (text.indexOf('"full_name":"') != -1)
                    accountInfo.name = text.split('"full_name":"')[1].split('"')[0];
                else
                    accountInfo.name = text.split('\\"full_name\\":\\"')[1].split('\\"')[0];
                if (text.indexOf('"username":"') != -1)
                    accountInfo.id = text.split('"username":"')[1].split('"')[0];
                else
                    accountInfo.id = text.split('\\"username\\":\\"')[1].split('\\"')[0];
            }
            catch (e) {
                // split fails if the content is unexpected, when not logged in
                accountInfo = null;
            }
            break;
        }
    }
    if (accountInfo == null)
        throw new Error("Instagram account info not found");
    return accountInfo;
}


async function getMessagingAccounts() {
    let accounts = [];
    let loginBoxClose = null;
    let elems = [];
    //console.log(DateAndTime_Now().ToFormat('%/D %:T') + ' waiting for element');
    do{
        let elem = await waitForElement(srchPathIGM('openAccountsButton'), 4);
        if (elem == null) {
            // I expect at this point we have an Instagram user who only has a single account?
            let accountInfo = await getMessagingAccountInfo();
            if (accountInfo) {
                accounts.push(accountInfo.id);
                return accounts;
            }
            
            //console.log(DateAndTime_Now().ToFormat('%/D %:T') + ' throwing error');
            throw new Error("Can't find button to open Instagram messaging accounts dialog!");
        }
        elem.click();
        elems = await waitForElements(srchPathIGM('accountsItem'), 4);

        loginBoxClose = findElement(srchPathIGM('loginDialogBoxCloseButton'));
        if((typeof elems == 'undefined' || elems.length <= 0) && loginBoxClose != null){
            loginBoxClose.click()
            Log_WriteError('Error on the getMessagingAccounts() opening login box instead of the users list')
        }else{
            loginBoxClose = null
        }
    }while(loginBoxClose != null)

    for (let elem of elems) {
        // DRL FIXIT! Sometimes the profile email is shown instead of the username! We skip if we see an email
        // to avoid importing an invalid ID.
        if (elem.innerText.indexOf('@') == -1)
            accounts.push(elem.innerText.trim());
    }
    // DRL FIXIT? Combine these two...
    await waitForElement(srchPathIGM('accountsDialog'));
    Utilities_TriggerMouseEvent(findElement(srchPathIGM('closeAccountsDialog')), "mousedown");

    return accounts;
}


async function selectAccount(accountID) {
    Log_WriteInfo('Looking for account ' + accountID);
    let elem = await waitForElement(srchPathIGM('openAccountsButton'));
    elem.click();
    await sleep(1);
    let found = false;
    let elems = await waitForElements(srchPathIGM('accountsItem'));
    for (let elem of elems) {
        // DRL FIXIT! Sometimes the profile email is shown instead of the username! I noticed that when
        // you click on it the title shown when the page refreshes is the non-email correct value so we
        // could perhaps handle this case somehow?
        let foundAccountID = elem.innerText.trim();
        if (foundAccountID == accountID) {
            if (elem != elems[0]) { // the first item is the already selected one
                let elem2 = Utilities_GetParentBySelector(elem, srchPathIGM('accountsItemButton'));
                pressNonButton(elem2);
                await sleep(3);   // wait for event to be handled
//                elem2.click();
            }
            found = true;
        }
        else
            Log_WriteInfo('Skipping account ' + foundAccountID);
    }
    if (!found) {
        Log_WriteError('Instagram account ' + accountID + ' not found!');
    }
    // DRL FIXIT? Combine these two...
    await waitForElement(srchPathIGM('accountsDialog'));
    Utilities_TriggerMouseEvent(findElement(srchPathIGM('closeAccountsDialog')), "mousedown");
}


async function reqParsedFinalChat(accountID, tab) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'parsedFinalChat',
            accountID: accountID,
            tab: tab
        }, function(resp) {
            resolve(resp);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}


async function sendConversation(accountID, conversations, syncData, checkedChats) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'sendConversation', 
            accountID: accountID,
            conversations: conversations,
            syncData: syncData,
            checkedChats: checkedChats
        }, function(resp) {
            resolve(resp);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}


async function openNextChat(checkedChats) {
    let lastChat = '';
    let attempts = 0;
    while (true) {
        attempts++;
        let elems = await waitForElements(srchPathIGM('chatElem'), 1);
        if (elems.length == 0) {
            // DRL It looks like sometimes when the page is in the background it doesn't get fully
            // populated with the items we seek??
            // It also looks like this is the same scenario if there are no messages yet - or perhaps
            // Instagram is not showing them because the account was recently blocked as a possible robot?
            if (attempts == 10) {
                if (findElement(srchPathIGM('chatsLoading')) != null) {
                    Log_WriteError("Instagram messages still loading after 10 seconds, aborting!");
                }
                else {
                    Log_WriteInfo("Instagram messages not found after 10 seconds, maybe there aren't any?");
                }
                break;
            }
            continue;
        }
        attempts = 0;
        for (let i = 0; i < elems.length; i++)
        {
            // DRL FIXIT? Skip group chats as we don't handle those yet.
            if (elems[i].innerText.indexOf(',') != -1) {
                elems.splice(i, 1);
                i--;
            }
        }
        if (elems.length == 0 ||                // we only have group chats, or no chats
            lastChat == elems[elems.length-1].innerText) {  // nothing changed since last loop
            break;
        }
        lastChat = elems[elems.length-1].innerText;
        // console.log(lastChat);
        for (let elem of elems) {
            if (! checkedChats.includes(elem.innerText)) {
                elem.click();
                let threadDetails = await waitForElement(srchPathIGM('threadMessagesOpenButton'))
                threadDetails.click()

                let username = await waitForElement(srchPathIGM('threadDetailsMessagesUsername').replace("%%USERNAME%%", elem.innerText))
                let backToChatFromThreadDetails = findElement(srchPathIGM('threadMessagesCloseButton'))
                backToChatFromThreadDetails.click()
                // let dateDivs = await waitForElements(srchPathIGM('dateDiv);
                // console.log($(dateDivs).text());
                return username;
            }
        }
        elems[elems.length-1].scrollIntoView();
        await sleep(1);
    }
    return null;
}

// DRL FIXIT! This method may not handle all cases. I think we should use the methods in DateAndTimeHelpers.js
// and enhance them as needed for our purposes.
function parseDateTime(dateTime) {
    let date = new Date();
    if (dateTime.includes(',')) {
        date = new Date(dateTime);
    }
    else {
        let parts = dateTime.trim().split(' ');
        if (parts.length == 2) {
            if (parts[1].length == 2) {
                parts.unshift(keywordIGM('Today'));
            }
            else {
                parts[2] = parts[1].slice(-2);
                parts[1] = parts[1].slice(0, -2);
            }
        }
        let diff = 0;
        if (parts[0] == keywordIGM('Today')) {
        }
        else if (parts[0] == keywordIGM('Yesterday')) {
            diff = 1;
        }
        else if (keywordIGM('DaysInWeek').indexOf(parts[0]) != -1) {
            diff = date.getDay() - keywordIGM('DaysInWeek').indexOf(parts[0]);
            if (diff <= 0) {
                diff = 7 + diff;
            }
        }
        else {
            Log_WriteError('Unrecognized Instagram interval key in "' + dateTime + '" for language ' + pageLanguage);
            throw new Error("Got invalid timestamp")
        }
        date.setDate(date.getDate() - diff);
        date = new Date(date.toString().substring(0, 16) + parts[1] + ' ' + parts[2]);
    }
    let d = date.getTime();
    if (timestampToString(d) == null) {
        Log_WriteError('Got invalid Instagram timestamp converting string "' + dateTime + '"  for language ' + pageLanguage);
        throw new Error("Got invalid timestamp")
    }
    return d;
}


async function parseMessage(elem, accountInfo, chatInfo, timestamp) {
    let message = {
        Type: 'ig_msg',
        Uid: NO_EXTERNAL_ID,
        Date: timestampToString(timestamp),
        Url: window.location.href,
        Body: '',
        Attachments: []
    };
    if (findElement(srchPathIGM('sentFolderCheck'), null, elem)) {
        message.Folder = 'sent';
        message.From = accountInfo.name + ' <' + accountInfo.id + '@igun.socialattache.com>';
        message.To = [chatInfo.name + ' <' + chatInfo.id + '@igun.socialattache.com>'];
    }
    else {
        message.Folder = 'inbox';
        message.From = chatInfo.name + ' <' + chatInfo.id + '@igun.socialattache.com>';
        message.To = [accountInfo.name + ' <' + accountInfo.id + '@igun.socialattache.com>'];
    }
// DRL I don't know why this field is being included?
//    let h1 = elem.find('h1');
//    if ($(h1).length > 0) {
//        message.Action = $(h1).text();
//    }
    
    message.Body = findElement(srchPathIGM('body'), null, elem);

    for (let audio of findElements(srchPathIGM('audioAttachments'), null, elem))
        message.Attachments.push({URL: audio});
    for (let video of findElements(srchPathIGM('videoAttachments'), null, elem))
        message.Attachments.push({URL: video});
    for (let image of findElements(srchPathIGM('imageAttachments'), null, elem))
        message.Attachments.push({URL: image});
    
    await massageAttachments(message);

    return message;
}


async function getCurrentTab() {
    // DRL FIXIT? Wouldn't it be better to look at the URL like we do in the background script?
    let elem = await waitForElement(srchPathIGM('generalTab'));
    if (elem == null) {
        return PRIMARY_TAB;
    }
    if ($(elem).attr('class').trim().split(' ').length == 2) {
        return GENERAL_TAB;
    }
    return PRIMARY_TAB;
}


async function getChatInfo(chatName) {
    let info = {};
    info.id = chatName;
    await sleep(1);
    let elem = await waitForElement(srchPathIGM('chatInfoButton'));
    elem.click();
    elem = await waitForElement(srchPathIGM('chatInfoName'));
    info.name = elem.innerText.trim();
    elem = await waitForElement(srchPathIGM('chatInfoCloseButton'));
    elem.click();
    await sleep(1);
    return info;
}


async function parseMessages(accountInfo, chatName, startTimestamp, syncData) {
    let chatInfo = await getChatInfo(chatName);
    console.log(chatInfo);
    let sameLength = 0;
    let lastLength = 0;
    while (true) {
        let elems = await findElements(srchPathIGM('messageOrDateDiv'));
        if (elems.length == lastLength) {
            sameLength += 1;
        }
        else {
            sameLength = 0;
        }
        if (sameLength > 5) {
            break;
        }
        let timestamp = parseDateTime(elems[0].innerText.trim());
        if (timestamp < startTimestamp || timestamp < syncData.timestamp) {
            break;
        }
        elems[0].scrollIntoView();
        await pingingSleep(0.5);
        lastLength = elems.length;
    }
    
    let elems = await findElements(srchPathIGM('messageOrDateDiv'));
    let conversations = [];
    let conversation = null;
    // DRL FIXIT? This code seems to parse all the messages in a conversation and then throw away the older
    // ones as already read in. It would be great to optimize this a bit to not have to parse all the old
    // messages (sometimes there could be a lot!).
    for (let elem of elems) {
        // console.log(elem);
        // DRL FIXIT! We should not be using hardcoded string here!
        if (Class_HasByElement(elem, 'l4b0S')) {
            if (conversation) {
                conversations.push(conversation);
            } 
            conversation = {
                timestamp: parseDateTime(elem.innerText),
                messages: []
            }
        }
        else {
            conversation.messages.push(await parseMessage(elem, accountInfo, chatInfo, conversation.timestamp));
        }
        reqPing();
    }
    if (conversation) {
        conversations.push(conversation);
    }
    
    let newCheck = {
        timestamp: conversations[conversations.length - 1].timestamp,
        messageCount: conversations[conversations.length - 1].messages.length
    }
    let new_conversations = [];
    for (conversation of conversations) {
        if (conversation.timestamp < startTimestamp || conversation.timestamp < syncData.timestamp) {
            continue;
        }
        if (conversation.timestamp == syncData.timestamp) {
            if (conversation.messages.length <= syncData.messageCount) {
                continue;
            }
            conversation.messages = conversation.messages.slice(syncData.messageCount);
        }
        new_conversations.push(conversation);
    }
    if (new_conversations.length > 0) {
        syncData.timestamp = newCheck.timestamp;
        syncData.messageCount = newCheck.messageCount;
        return new_conversations;
    }
    return [];
}



async function sendMessage(message) {
    let elem = await waitForElement(srchPathIGM('newMessageButton'));
    console.log(elem);
    elem.click();
    
    let to = getEmailPrefix(message.To[0]);

    elem = await waitForElement(srchPathIGM('userSearch'));
    await insertText(elem, to);

    let elems = await waitForElements(srchPathIGM('userList'));
    // DRL FIXIT! Move this into selector!
    // the element contains the recipient handle as well as their full name so we have to get just the former
    if (elems.length == 0 || elems[0].childNodes[0].childNodes[1].childNodes[0].innerText.trim() != to) {
        return ERROR_EXTERNAL_ID;
    }
    console.log('a');
    elems.first().click();

    elem = await waitForElement(srchPathIGM('nextButton'));
    elem.click();

    elem = await waitForElement(srchPathIGM('messageTextarea'));
    if (elem == null)
    {
        // sometimes at this point we see the "info" page, not sure why (I think it was already showing before), but we can toggle it
        elem = await waitForElement(srchPathIGM('infoButton'));
        if (elem == null)
            return ERROR_EXTERNAL_ID;
        elem.click();
        elem = await waitForElement(srchPathIGM('messageTextarea'));
        if (elem == null)
            return ERROR_EXTERNAL_ID;
    }
    await insertText(elem, message.Body);

    elem = await waitForElement(srchPathIGM('sendButton'));
    elem.click();

    await sleep(2);
    
    return NO_EXTERNAL_ID;
}


// ==============================================
// posting helpers


async function getPostingAccounts() {
    let elem = await waitForElement(srchPathIGP('instagramButton'));
    elem.click();
    await waitForElement(srchPathIGP('tabHeader'));
    if (findElement(srchPathIGP('tabHeaderDropdown')) == null) {
        let elems = await waitForElements(srchPathIGP('singleAccountName'));
        if (elems.length == 0) {
            throw new Error("No Instagram accounts found for posting")
        }
        return [elems[0].innerText.trim()];
    }
    elem = await waitForElement(srchPathIGP('tabHeaderDropdown'));
    elem.click();
    let buttons = await waitForElements(srchPathIGP('dropdownAccountNames'));
    let accounts = [];
    for (let button of buttons) {
        accounts.push(button.innerText.trim());
    }
    elem = await waitForElement(srchPathIGP('tabHeaderDropdown'));
    elem.click();
    return accounts;
}


async function createPost(accountID, accountName, post) {
    await sleep(4); // if we click the button as the page is loading it doesn't seem to take effect
    let elem = await waitForElement(srchPathIGP('instagramButton'));
    elem.click();
    await sleep(1);
    elem = await waitForElement(srchPathIGP('createPostButton'));
    elem.click();
    await sleep(1);
    elem = await waitForElement(srchPathIGP('instagramFeedButton'));
    elem.click();
    
    await waitForElement(srchPathIGP('slidingTray'));
    if (findElement(srchPathIGP('addFileButton')) == null) {
        let buttons = await waitForElements(srchPathIGP('accountNames'))
        elem = null;
        for (let button of buttons) {
            if (accountName == button.innerText.trim()) {
                elem = button;
            }
        }
        if (!elem) {
            Log_WriteError("Creator studio can't find instagram account " + accountName + " for post");
            return ERROR_EXTERNAL_ID;
        }
        elem.click();
    }
    
    elem = await waitForElement(srchPathIGP('addFileButton'));
    elem.click();
    await sleep(1);
    elem = await waitForElement(srchPathIGP('uploadFileButton'));
    elem.click();
    
    await sleep(1);
    for (let attach of post.Attachments) {
        if (attach.Type.split('/')[0] != 'image')
            continue;
        elem = await waitForElement(srchPathIGP('fromFileUploadButton'));
        await uploadAttachment(elem, attach);
        break;
    }
    
    elem = await waitForElement(srchPathIGP('captionTextarea'));
    await insertText(elem, post.Body);
    
    elem = await waitForElement(srchPathIGP('postButton'));
    elem.click();
    
    console.log('Post made:', post);
    return NO_EXTERNAL_ID;
}

async function loopInstagram() {
    console.log(DateAndTime_Now() + " loopInstagram()");    // this is here so we can click on it in the console for easier debugging ;-)

    if (!await contentScriptInit('InstagramScrape'))
        return;
    
    let startTimestamp = 1612281780000;
    let accountInfo = null;
    
    while (true) {
        let delay = timings.BUSY_LOOP_DELAY;

        try {
            if (!await handleSocialAttacheLogin(true)) {
                await pingingSleep(timings.SA_NOT_LOGGED_IN_DELAY);
                continue;
            }
            
            let isMessaging = fuzzyUrlStartsWith(document.location.href, "https://www.instagram.com/direct") ||
               // when the user is not logged in go through the messaging flow below
               document.location.href.indexOf('/login/') != -1;
    
            if (accountInfo == null) {
                if (isMessaging) {
                    accountInfo = await getMessagingAccountInfo();
                    Log_WriteInfo('Got account info: ' + GetVariableAsString(accountInfo));
                }
                else {
                    // for posting we don't need to get the account info?
                    Log_WriteInfo('Using empty account info for posting');
                    accountInfo = { id: null, name: null };
                }
            }
            
            let resp = await reqGetAction(accountInfo.id, null);

            if (resp.hasOwnProperty('accountID') && resp.accountID != accountInfo.id && isMessaging) {
                Log_WriteInfo('Switching from account ' + accountInfo.id + ' to ' + resp.accountID);
                await selectAccount(resp.accountID);
                // I believe the above will reload the page but we can just wait and recheck if not
                await pingingSleep(delay);
                continue;
            }

            if (resp.action == 'getAccounts') {
                let accounts = isMessaging
                    ? await getMessagingAccounts()
                    : await getPostingAccounts();

                console.log(accounts)
                await reqSetAccounts(accounts);
            }
            else if (resp.action == 'getAccountInfo') {
                assert(resp.accountID == accountInfo.id);
                await reqSetAccountInfo(accountInfo);
            }
            else if (resp.action == 'getNextChat') {
                assert(isMessaging);
                assert(resp.accountID == accountInfo.id);
                let syncDatas = JSON.parse(resp.syncData) || {};
                
                let currentTab = await getCurrentTab();
                if (resp.currentTab != currentTab) {
                    Log_WriteError('Unable to get to ' + resp.currentTab + ' tab, stuck at ' + currentTab);
                    await reqParsedFinalChat(accountInfo.id, currentTab);
                    continue;   // no wait, just check again for next action
                }
                
                let chatName = await openNextChat(resp.checkedChats);
                if (chatName == null) {
                    Log_WriteInfo('Finished with the ' + currentTab + ' tab');
                    await reqParsedFinalChat(accountInfo.id, currentTab);
                    continue;   // no wait, just check again for next action
                }
                
                let syncData = {timestamp: 0, messageCount: 0};
                if (chatName in syncDatas) {
                    syncData = syncDatas[chatName];
                }
                let conversations = await parseMessages(accountInfo, chatName, startTimestamp, syncData);
                if (conversations.length > 0) {
                    syncDatas[chatName] = syncData;
                    await sendConversation(
                        accountInfo.id,
                        conversations,
                        JSON.stringify(syncDatas),
                        resp.checkedChats.concat(chatName)
                    );
                    // DRL FIXIT? We should be skipping this delay if there are no more chats to check.
                    delay = timings.INTER_CONVERSATION_CHECK_DELAY;
                }
                else {
                    // since we traverse the chats newest first when there are no messages we're done with this tab
                    await reqParsedFinalChat(accountInfo.id, currentTab);
                }
                console.log(conversations);
            }
            else if (resp.action == 'sendMessage') {
                assert(isMessaging);
                assert(resp.accountID == accountInfo.id);
                let messageID = await sendMessage(resp.message);
                let from = accountInfo.name + ' <' + accountInfo.id + '@igun.socialattache.com>';
                await reqSetMessageId(accountInfo.id, resp.message.Uid, messageID, from);
                delay = timings.INTER_MESSAGE_DELAY;
            }
            else if (resp.action == 'makePost') {
                assert(!isMessaging);
                let postID = await createPost(resp.accountID, resp.accountName, resp.post);
                let from = '<' + resp.accountID + '@igun.socialattache.com>';
                await reqSetPostId(resp.accountID, resp.post.Uid, postID, from);
                delay = timings.INTER_POST_DELAY;
            }
            else if (resp.action == 'getContact') {
                assert(!isMessaging);
                await sleep(4); // we have to wait for the page to load since the background script just set the URL
                let vCard = await getvCardFromInstagramProfile();
                await reqSendContact('InstagramScrape', resp.accountID, resp.syncCommandID, vCard);
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
            delay = await handleScraperException('InstagramScrape', e, 'https://www.instagram.com');
        }
    
        try {
            await pingingSleep(delay);
        }
        catch (e) {
            await handleScraperException('InstagramScrape', e, 'https://' + window.location.host);
        }
    }
}



DocumentLoad.AddCallback(function(rootNodes) {
    if (rootNodes.length != 1 || rootNodes[0] != document.body)
        return;     // this only needs to be done once on initial page load
    
    loopInstagram();
});