async function reqSetChats(accountID, urls, currentCheck) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({ type: 'setChats', accountID: accountID, urls: urls, currentCheck: currentCheck}, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

// if cursor is not null it indicates that retrieval did not complete and this is where we should resume
async function reqSetMessages(accountID, cursor, messages) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setMessages',
            accountID: accountID,
            cursor: cursor,
            messages: messages
        }, function(data) {
            resolve(data);
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetComments(accountID, externalPostID, lastSynced, cursor, comments) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
            type: 'setComments',
            accountID: accountID,
            externalPostID: externalPostID,
            lastSynced: lastSynced,
            cursor: cursor,
            comments: comments
        }, function() {
            resolve();
        }
    )})
    .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetGroupMembers(accountID, groupId, currentCheck, memberType, groupMembers) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
                type: 'setGroupMembers',
                accountID: accountID,
                groupId: groupId,
                currentCheck: currentCheck,
                memberType: memberType,
                groupMembers: groupMembers
            }, function(data) {
                resolve(data);
            }
        )})
        .catch(e => { Log_WriteException(e); throw e; });
}

async function reqSetGroupQuestions(accountID, groupId, currentCheck, groupQuestions) {
    return new Promise( (resolve, reject) => {
        Messaging.SendMessageToBackground({
                type: 'setGroupQuestions',
                accountID: accountID,
                groupId: groupId,
                currentCheck: currentCheck,
                groupQuestions: groupQuestions
            }, function() {
                resolve();
            }
        )})
       .catch(e => { Log_WriteException(e); throw e; });
}

// ====================================================
// Parsing message helpers

/**
 * @description : PART 1 => Chat
 */

// chat timestamp are only the duration comparing to today ! Not like message, they don't got date but a duration in day, week ...
function getChatTimestampDelta(elem) {
    const elems = findElements(srchPathFBM('chatTimestamp'), null, elem);
    assert(elems.length <= 2);
    const data = Utilities_ArrayLastValue(elems).innerText;
    // to match multiple languages patterns
    // data in english version : 6w, 2h..
    // data in french version : 6 semaines, 2 mois.. 2 heures, 1 j, 2 h
    const time = timeToDelta(data);
    
    return isNaN(time) ? -1 : time;
}

// the need for this method is that when we have a time delta such as "10m" the host site may not be
// providing a very accurate time and we want to make sure we don't miss messages, so we round up 30%
// plus 15 minutes
function roundTimeUp(timestamp) {
    return timestamp + Math.floor((Date.now() - timestamp) * 0.3) + (15 * 60 * 1000);
}

async function getChats(lastCheck) {
    let totalCheckNb    = 0;
    let lastChatListNb  = 0;
    let waitNb          = 0;
    
    while(true) {
// this stopped working, maybe we need a different selector?
//        const chatScroll    = await waitForElement(srchPathFBM('chatScroll'));
        let chatsList       = await waitForElements(srchPathFBM('chatsList'));
        
        if (chatsList.length == 0) {
            if (findElement(srchPathFBM('chatParsingThrottled'))) {
                Log_WriteError('Facebook message scraping throttled!');
                return null;    // this indicates that we're being throttled
            }
            else {
                Log_WriteError('Facebook chatsList not found!');
                return [];
            }
        }
        
        if(lastChatListNb != chatsList.length)
            waitNb = 0;
        
        let timestampDelta   = getChatTimestampDelta(chatsList.length > 0 ? chatsList[chatsList.length-1] : null);
        
        // either we reach the lastcheck timestamp, or we wait that the chat load get stable (meaning that we already got all chats)
        if ((lastChatListNb == chatsList.length && waitNb > 10) ||
           (timestampDelta != -1 && roundTimeUp(Date.now() - timestampDelta) < lastCheck) ){
            await sleep(1);
            break;
        }
        
        lastChatListNb        = chatsList.length;
        if (chatsList.length > 0)
            chatsList[chatsList.length-1].scrollIntoView();
//        else
//            chatScroll.scrollTo(0, chatScroll.scrollHeight);    // this stopped working so I added the above
        waitNb ++;
        totalCheckNb ++;
        
        await sleep(1);
        reqPing();
    }
    
    
    let chatUrls = [];
    let elems = await waitForElements(srchPathFBM('chatsList'));
    
    for (let elem of elems) {
        const link = findElement(srchPathFBM('chatLink'), null, elem);
        if (link == null) {
            Log_WriteError('Facebook chatLink not found on chatsList item: ' + elem.outerHTML);
            continue;
        }
        const findConvId        = new RegExp(srchPathFBM('conversationIdChats'));
        const m                 = link.href.match(findConvId);
        const conversationId    = m[1];
        
        // DRL I believe we use ">= lastCheck" here because the last messages may all be in the same
        // time section, so when a new message arrives it has the same time as an older one?
        let timestampDelta = getChatTimestampDelta(elem);
        if(link && conversationId != '' && timestampDelta != -1 && roundTimeUp(Date.now() - timestampDelta) >= lastCheck)
            chatUrls.push(link.href);

        reqPing();
    }
    
    return chatUrls;
}



/**
 * @description : PART 1 => Messages
 */

// this return the true timestamp from the time/date row in a conversation
function getMessageTimestamp(elem) {
    elem = findElement(srchPathFBM('messageTimestamp'), null, elem);
    if(elem == null){
        return null;
    }
    const textTimeStamp = elem.innerText.trim();
    return textTimeStamp !== '' ? parseDateTimeToTimestamp(textTimeStamp) : null;
}

// DRL NOTE: We currently don't parse group chat messages because it's hard to get each senders info!
// chat room: chatParticipantAddress != conversationAddress
// one-on-one: chatParticipantAddress == conversationAddress
async function parseMessage(accountInfo, elem, timestamp, conversationAddress, conversationName,
    chatParticipantAddress, chatParticipantUsername, chatParticipantName) {
    let message = {
        Type: 'fbp_msg',
        Uid: NO_EXTERNAL_ID,
        Date: timestampToString(timestamp),
        Url: window.location.href,
        Attachments: []
    };
    
    // DRL FIXIT? We should be checking for both directions here and if neither match
    // throw an exception so we are not importing messages in the wrong folder.
    // DRL FIXIT! One problem I believe exists and would be caught by the above is that
    // a sent message containing only an image seems to fail this check!
    message.Folder = findElement(srchPathFBM('isSentChat'), null, elem) ? 'sent' : 'inbox'; 

    if (chatParticipantAddress != conversationAddress) {
        // group chat room

        // DRL NOTE: We currently don't parse group chat messages because it's hard to get each senders info!
        // If we want to implement this I believe we'll need to parse the sender info in the caller since
        // it will appear in a previous DIV, similar to how message timestamps are handled.
        assert(0);
        
        if (message.Folder == 'sent') {
            chatParticipantName = accountInfo.name;
            chatParticipantAddress = accountInfo.id + '@fbperid.socialattache.com>';
        }
        else {
            let chatParticipantID = findElement(srchPathFBM('messageRoomParticipantID'), null, elem);
            if (chartParticipantID == null) {
                Log_WriteError("Can't get participant ID for group conversation " + document.locaton.href);
                return null;
            }
            chatParticipantAddress = chatParticipantID + '@fbperid.socialattache.com';
    
            chatParticipantName = findElement(srchPathFBM('messageRoomParticipantName'), null, elem);
            if (chatParticipantName == null) {
                Log_WriteError("Can't get participant " + chatParticipantID + " name for group conversation " +
                   document.locaton.href + ", this may be a closed account or a user who's blocked me.");
                chatParticipantName = chatParticipantID;
            }
    
            // In order to get the handle we have to follow https://www.facebook.com/{id} and see where it redirects to something like https://www.facebook.com/TheNinjaNetworkerPage/
            let url = 'https://www.facebook.com/' + chatParticipantID;
            chatParticipantUsername = getAddressFromFacebookProfileOrPageUrl(await getFinalUrl(url));
            if (chatParticipantUsername == null) {
                Log_WriteError('Unable to get participant username from ' + url + ' when parsing group conversation ' + document.locaton.href);
                // keep going, we'll just not have a username for this participant
            }
        }
    
        message.From = chatParticipantName + ' <' + chatParticipantAddress + '>';
        message.To = conversationName + ' <' + conversationAddress + '>';
    }
    else {
        // one-on-one chat

        if (message.Folder == 'inbox'){
            // if there is a handle we provide it so we can add it to the contacts vCard
            message.FromContactID   = chatParticipantUsername;
            // DRL FIXIT! This could be a page or a person, it would be good to check to use the correct fbpage or fbperid!
            message.From            = chatParticipantName + ' <' + chatParticipantAddress + '>';
            message.To              = [accountInfo.name + ' <' + accountInfo.id + '@fbperid.socialattache.com>'];
        }
        else{
            message.From = accountInfo.name + ' <' + accountInfo.id + '@fbperid.socialattache.com>';
            message.To = [chatParticipantName + ' <' + chatParticipantAddress + '>'];
        }
    }

    message.Body = findElement(srchPathFBM('body'), null, elem);

    let attachs = findElements(srchPathFBM('attachmentA'), null, elem);

    for(let attach of attachs){
        if(attach.innerText.includes('/groups/') || attach.childNodes.length <= 1){
            break;
        }
        
        // DRL I added this loop because when the image is in a message request (i.e. the first
        // message received from a non-friend) you have to click it three times.
        let url = null;
        for (let i = 0; url == null && i < 3; i++) {
            attach.click();
            
            // DRL I added this sleep because in one case there were two images attached to a message
            // and when trying to close the dialog after parsing the second one the page was reloaded
            // resulting in an endless loop trying to parse this message. The sleep fixed it.
            // The problem conversation: https://www.facebook.com/messages/t/684294057
            // I also had a problem with this conversation, though I don't think it was the same
            // scenario because there's only one image: https://www.facebook.com/messages/t/563561982/
            await sleep(1)
    
            // DRL FIXIT? Combine these two selectors into a single selector?
            if (window.location.href.includes('messenger_photo')) {
                url = findElement(srchPathFBM('attachmentImageSrc'))
            }
            else {
                url = findElement(srchPathFBM('otherAttachmentsDownloadHref'))
            }
        }
        if (url == null) {
            Log_WriteError('For conversation ' + window.location.href + 'attachment source was not found!');
        }
        else {
            message.Attachments.push({URL : url})
        }

        let close = await waitForElement(srchPathFBM('closeAttachmentPopup'))
        if (close == null)
            Log_WriteError('For conversation ' + window.location.href + 'attachment close button was not found!');
        else {
            close.click()
            await sleep(1)
        }
    }

    attachs = findElements(srchPathFBM('inlineAttachmentUrl'), null, elem);
    for(let url of attachs)
        message.Attachments.push({URL : url})

    // links attachments downloadable attr
    // FIXIT sometimes attachments doesn't have the attr download, like pdf files, in the pdf case it opens a popup to preview
    // Identified Extensions .pdf, .txt
    // The automation would be clicking in the div, waiting for the popup, getting the download url on the popup closing the popup
    // This piece of the code doesn't work anymore, attachments needs to be added from the popup by clicking and then downloading
    /*
    attachs = findElement('a', null, elem);
    for(let attach of attachs){
        if($(attach).attr('download') !== undefined){
            message.Attachments.push({URL: attach.href})
            
            // removing text that are generated for the attachment and not a user type message
            const rg     = new RegExp(attach.innerText, 'ig');
            message.Body = message.Body.replace(rg, '');
        }
    }
    */
    
    await massageAttachments(message);
    
    return message;
}

// this is for getting the timestamp of a message or the timestamp title above him
function getLastMessageTimestamp(msgTarget){
    let elementToCheck = msgTarget.previousElementSibling
    if(elementToCheck == null){
        return null;
    }
    return getMessageTimestamp(elementToCheck);
}


// checking if the current chat it's a group chat
async function isGroupChat(){
    await sleep(1);
    let buttonSidebar = await waitForElement(srchPathFBM('sideBarButton'));
    if (buttonSidebar == null) {
        Log_WriteError('For conversation ' + window.location.href + ' sideBarButton not found to check if group chat!');
        return false;
    }
    if(findElement(srchPathFBM('sideBarMenu')) == null){
        buttonSidebar.click();
    }

    let sidebarContainer = await waitForElement(srchPathFBM('sideBarMenu')); // DRL FIXIT? Test if not found.
    if (sidebarContainer == null) {
        Log_WriteError('For conversation ' + window.location.href + ' sidebarContainer not found to check if group chat!');
        return false;
    }
    if(sidebarContainer.includes(keywordFBM('chatMembers'))){
        return true;
    }

    return false;
}

async function getMessages(accountInfo, lastCheck, currentCheck) {
    let totalCheckNb        = 0;
    let checkingNb          = 0;
    let lastMessageListNb   = 0;
    let box = null;
    let isGroup = null;
    let markAsUnread = false;
    let cursor = null;
    let messages = [];
    
    const findConvId        = new RegExp(srchPathFBM('conversationIdMessages'));
    const conversationId = document.location.href.match(findConvId)[4];
    
    while(true) {
        box = await waitForElement(srchPathFBM('messageBox'));
        if (box == null)
        {
            // I saw this a number of times when the window was in the background and the
            // web page looked empty. I'm not pinging in this case so that if we're stuck
            // here a long time the background process should try refreshing the page and
            // also focusing it and eventually give up this task after too many retries.
            if (checkingNb > 30) {  // 30 seconds of waiting
                throw new Error("Message box not found");
            }
        }
        else
        {
            if(isGroup === null) // == null for preventing loop check on isGroupChat method
                isGroup = await isGroupChat();
            if (isGroup) {
                let conversationAddress = conversationId + '@fbrmid.socialattache.com';
                let conversationName = findElement(srchPathFBM('messageBoxRoomName'), null, box);

                Log_WriteInfo('For group conversation ' + conversationName + ' (' + conversationId +
                   ') adding group imported message');

                // we add a single incoming message so we can create a contact for the room, and also update
                // the room name in case it changes
                let message = {
                    Type: 'fbp_msg',
                    Uid: NO_EXTERNAL_ID,
                    Date: timestampToString(currentCheck),
                    Url: window.location.href,
                    Folder: 'inbox',
                    IsChatRoom: true,
                    From: conversationName + ' <' + conversationAddress + '>',
                    To: [accountInfo.name + ' <' + accountInfo.id + '@fbperid.socialattache.com>'],
                    Body: Str('Messenger chat group imported but messages will not be imported.'),
                    Attachments: []
                };
                messages.push(message);
                return [messages, cursor];
            }

            //Check if was read already
            let elemContainerChatActionsStatus = findElement(srchPathFBM('elemContainerChatActionsStatus'))
            if(elemContainerChatActionsStatus != null){
                markAsUnread = true;
            }

            let scrollBox = findElement(srchPathFBM('messageScrollBox'), null, box);
            let scrollable = Utilities_GetScrollableParentElement(scrollBox);

            scrollable.scrollTo(0, 0);
            await sleep(1);

            // first we get all the message-container
            const msgList = findElements(srchPathFBM('messageContainer'));

            // we check at least 10 times the chat
            if(lastMessageListNb == msgList.length && checkingNb > 5)   // 5 times is 10 seconds since we sleep twice
                break;
            
            // new messages appear on screen, we reset the counter that break the loop if above 10 loop
            if(lastMessageListNb != msgList.length)
                checkingNb = 0;
            
            lastMessageListNb = msgList.length;
            
            // if any messages, we get the first one (that should be a timestamp message such as : Yesterday at 1:03)
            if (msgList.length > 0) {
                const timestamp = getMessageTimestamp(msgList[0]); // the first message row of the current chat is always a timestamp date text
                if (roundTimeUp(timestamp) < lastCheck){
                    break;
                }
            }
            
            reqPing();
        }
        
        checkingNb ++;
        totalCheckNb ++;
        await sleep(1);
    }
    
    let conversationAddress = null;
    let conversationName = null;
    let chatParticipantName = null;
    let chatParticipantAddress = null;  // address with numeric ID
    let chatParticipantUsername = null; // address with friendly ID
    if (isGroup) {
        assert(0);  // we don't currently import messages from group conversations
        conversationAddress = conversationId + '@fbrmid.socialattache.com';
        conversationName = findElement(srchPathFBM('messageBoxRoomName'), null, box);
    }
    else {
        conversationAddress = conversationId + '@fbperid.socialattache.com';
        chatParticipantAddress = conversationAddress;
        chatParticipantName = findElement(srchPathFBM('messageBoxParticipantName'), null, box);
        if (chatParticipantName == null) {
            // this seems to happen for a conversation with no messages
            Log_WriteError("Can't get participant name for conversation " + conversationId + ", this may be a closed account or a user who's blocked me.");
            return [messages, cursor];
        }
        conversationName = chatParticipantName;

        // In order to get the handle we have to follow https://www.facebook.com/{id} and see where it redirects to something like https://www.facebook.com/TheNinjaNetworkerPage/
        let url = 'https://www.facebook.com/' + conversationId;
        chatParticipantUsername = getAddressFromFacebookProfileOrPageUrl(await getFinalUrl(url));
        if (chatParticipantUsername == null) {
            Log_WriteError('Unable to get participant username from ' + url + ' when parsing conversation ' + document.locaton.href);
            return [messages, cursor];
        }
    }
    
    // this is only for the timestamp
    let elems = findElements(srchPathFBM('messageDiv'));
    if (elems.length == 0) {
        // this seems to happen for a conversation with no messages
        Log_WriteWarning("Can't find Facebook messageDiv, got " + messages.length + " message(s) so far");
        return [messages, cursor];
    }
    
    let lastUnparsedIndex = -1;
    let lastMessageTimestamp = null;
    // go through the array oldest first in case we drop out early
    for (let i = 0; i < elems.length; i++) {
        let messageDivClosestRow = findElement(srchPathFBM('messageDivClosestRow'), null, elems[i]);
        let timestamp = getLastMessageTimestamp(messageDivClosestRow);

        if(timestamp != null){
            lastUnparsedIndex = i;
            
            if (lastMessageTimestamp > timestamp) {
                // if our last message had a newer date than this one it means that we didn't have a date
                // and we instead used one of the workarounds below, but it was wrong, so we'll go back
                // and adjust those dates to be more correct by using this message date instead
                for (let j = 0; j < messages.length; j++) {
                    let t1 = DateAndTime_FromString(messages[j].Date);
                    let t2 = DateAndTime_FromString(timestampToString(lastMessageTimestamp));
                    assert(t1.Equal(t2));
                    messages[j].Date = timestampToString(timestamp);
                }
            }
        }else if(lastMessageTimestamp != null){
            timestamp = lastMessageTimestamp;
        }else{
            // use the conversation time as the next best thing, and if that fails use the current check time
            let activeChatButtonTimestamp = findElement(srchPathFBM('activeChatButtonTimestamp'))
            if (activeChatButtonTimestamp) {
                try {
                    timestamp = new Date(new Date() - timeToDelta(getChatTimestampDelta(activeChatButtonTimestamp)))
                    timestamp = timestamp.getTime();
                    if (isNaN(timestamp))
                        timestamp = currentCheck;
                }catch (e){
                    timestamp = currentCheck;
                }
            }
            else {
                // DRL FIXIT! In order to get around this issue perhaps we should be scraping the
                // conversation dates when we scrape the conversation list. We're scraping some of
                // them anyways in order to know when to stop going back, so do them all and save them.
                //
                // if we get here it means that we didn't find the conversation date which means either
                // the selector is wrong or the conversation hasn't been scrolled into view (which is
                // possible when scraping old conversations)
                timestamp = currentCheck;
            }
        }

        // DRL I believe we use ">= lastCheck" here because the last messages may all be in the same
        // time section, so when a new message arrives it has the same time as an older one?
        if (roundTimeUp(timestamp) >= lastCheck && timestamp <= currentCheck) {
            lastUnparsedIndex = -1;
            const message = await parseMessage(accountInfo, elems[i], timestamp, conversationAddress,
               conversationName, chatParticipantAddress, chatParticipantUsername, chatParticipantName);
            if (message)
                messages.push(message);
            
            // we need to break out after we get too many messages to keep things efficient, BUT we need to
            // break at a point where we have a timestamp that will allow us to resume at the correct spot
            // since our timestamps are not very accurate (especially the older they get)
            if (messages.length >= constants.MAXIMUM_MESSAGES_PER_CHUNK && lastMessageTimestamp != timestamp) {
                cursor = timestamp;
                Log_WriteInfo('Early exit ' + messages.length + ' messages retrieved. Using cursor: ' + cursor);
                break;
            }
        }
        lastMessageTimestamp = timestamp;
        reqPing();
    }
    while (lastUnparsedIndex != -1 && lastUnparsedIndex < elems.length-1) {
        //parse all the messages from lastUnparsedIndex+1 since they are newest and don't have timestamps
        lastUnparsedIndex++;
        const message = await parseMessage(accountInfo, elems[lastUnparsedIndex], lastMessageTimestamp, conversationAddress,
            conversationName, chatParticipantAddress, chatParticipantUsername, chatParticipantName);
        if (message)
            messages.push(message);
    }

    //Marking as Unread or Not
    if(markAsUnread){
        let elemContainerChatActionsButton = findElement(srchPathFBM('elemContainerChatActionsButton'))
        elemContainerChatActionsButton.click()
        let elemContainerChatActionsMarkAsUnreadButton = await waitForElement(srchPathFBM('elemContainerChatActionsMarkAsUnreadButton'))
        await sleep(1)
        if(elemContainerChatActionsMarkAsUnreadButton.innerText != "Mark as read"){
            elemContainerChatActionsMarkAsUnreadButton.click()
        }
    }

    return [messages, cursor];
}

// ====================================================
// Sending message helpers

function checkIfBasicMessageIsSent(message) {
    let status = findElement(srchPathFBM('basicMessageCheckPermanentFailure'))
    if (status != null) {
        Log_WriteError('Permanent basic message send failure: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [ERROR_EXTERNAL_ID, Utilities_IsString(status) ? status : null];
    }
    
    status = findElement(srchPathFBM('basicMessageCheckRateLimitFailure'))
    if (status != null) {
        Log_WriteError('Rate limit basic message send failure: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [LIMITED_EXTERNAL_ID, Utilities_IsString(status) ? status : null];
    }
    
    status = findElement(srchPathFBM('basicMessageCheckTemporaryFailure'))
    if (status != null) {
        Log_WriteError('Temporary basic message send failure: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [RETRY_EXTERNAL_ID, Utilities_IsString(status) ? status : null];
    }
    
    status = findElement(srchPathFBM('basicMessageCheckSentSuccess'))
    if (status != null) {
        Log_WriteInfo('Basic message send success: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [NO_EXTERNAL_ID, null];
    }
    
    Log_WriteError('Unknown basic message send failure!');
    return [ERROR_EXTERNAL_ID, null];
}

async function sendBasicMessage(message) {
    await sleep(5);     // just to be safe that page has loaded

    let textArea = await waitForElement(srchPathFBM('basicEditBox'))
    if(textArea == null){
        Log_WriteError('Text area not found for sending message ' + message.Uid);
        return false;
    }
    textArea.value = message.Body;

    if(typeof message.Attachments != "undefined"){
        if(typeof message.Attachments[0] != "undefined" && message.Attachments[0] != null){
            await uploadAttachment(findElement(srchPathFBM('basicMessageAttachmentInputOne')), message.Attachments[0]);
        }
        if(typeof message.Attachments[1] != "undefined" && message.Attachments[1] != null){
            await uploadAttachment(findElement(srchPathFBM('basicMessageAttachmentInputTwo')), message.Attachments[1]);
        }
        if(typeof message.Attachments[2] != "undefined" && message.Attachments[2] != null){
            await uploadAttachment(findElement(srchPathFBM('basicMessageAttachmentInputThree')), message.Attachments[2]);
        }
    }
    let form = findElement(srchPathFBM('basicForm'));
    if(form == null){
        Log_WriteError('Form not found for sending message ' + message.Uid);
        return false;
    }
    form.submit()

    return true;
}

function checkIfMessageIsSent() {
    let status = findElement(srchPathFBM('messageCheckPermanentFailure'))
    if (status != null) {
        Log_WriteError('Permanent message send failure: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [ERROR_EXTERNAL_ID, Utilities_IsString(status) ? status : null];
    }
    
    status = findElement(srchPathFBM('messageCheckRateLimitFailure'))
    if (status != null) {
        Log_WriteError('Rate limit message send failure: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [LIMITED_EXTERNAL_ID, Utilities_IsString(status) ? status : null];
    }
    
    status = findElement(srchPathFBM('messageCheckTemporaryFailure'))
    if (status != null) {
        Log_WriteError('Temporary message send failure: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [RETRY_EXTERNAL_ID, Utilities_IsString(status) ? status : null];
    }
    
    status = findElement(srchPathFBM('messageCheckSentSuccess'))
    if (status != null) {
        Log_WriteInfo('Message send success: ' + (Utilities_IsString(status) ? status : 'unknown'));
        return [NO_EXTERNAL_ID, null];
    }
    
    Log_WriteError('Unknown message send failure!');
    return [ERROR_EXTERNAL_ID, null];
}

async function sendMessage(message) {
    // DRL FIXIT? It would be interesting to test whether we can simulate the state that allows us
    // to send a Facebook message by instead of creating a new pop up window to send the message,
    // if we could re-use the existing FB scraper tab and set the focus on the <BODY> element before
    // performing the code below. Although we may not be able to call focus() on the BODY element it
    // looks like in Chrome when the active element is no longer available the body element gains
    // the focus so we could use this to affect this behavior (i.e. add an <INPUT> element, focus it,
    // then remove it from the page, see https://allyjs.io/tutorials/mutating-active-element.html).


    await sleep(5);     // this seemed necessary to have it sent
    
    // we found with Facebook that when we pop up a new message in a new window the active element
    // is where we need to post the message, not the edit box, but we wait for the edit box to know
    // when the page is ready because the send button is hidden until the edit box has content
    
    let editBox = await waitForElement(srchPathFBM('editBox'));
    if (editBox == null) {
        Log_WriteError('Edit box not found for sending message ' + message.Uid);
        return [ERROR_EXTERNAL_ID, null];
    }
    
    let count = 0;
    let activeElement = document.activeElement;   // this seems to be the body element
    while (count < 5 && activeElement == null) {
        activeElement = document.activeElement;
        await sleep(2);
        count++;
    }
    if (activeElement == null) {
        Log_WriteError('Active element not found!');
        return [ERROR_EXTERNAL_ID, null];
    }
//    Log_WriteInfo('Active element is a ' + activeElement.tagName);

    if (message.Body != "") {
        try
        {
            await insertText(editBox, message.Body);
        }
        catch (e) {
            Log_WriteException(e, 'Unable to copy/paste message!');
            return [RETRY_EXTERNAL_ID, null];
        }
/* DRL This seemed unnecessary, given the above simple version and that the server now retries.
        let lockFocus = null;
        try
        {
            lockFocus = setInterval(()=>{
                editBox.focus();
            },10)
            let currentClipboardText = await navigator.clipboard.readText();
            await navigator.clipboard.writeText(message.Body);
            await document.execCommand('paste');
            await navigator.clipboard.writeText(currentClipboardText); // restoring the previous clipboard text
        }
        catch (e) {
            Log_WriteException(e, 'Unable to copy/paste message!');
            return RETRY_EXTERNAL_ID;
        }
        if (lockFocus) clearInterval(lockFocus)
        editBox.focus();
*/
        
        const sendButton = await waitForElement(srchPathFBM('sendButton'));
        if (sendButton == null) {
            Log_WriteError('Send button not found!');
            return [ERROR_EXTERNAL_ID, nul];
        }
    
// DRL I use this when debugging. When I see the message pasted I hit F12 and wait for the debugger to breakpoint.
//        await sleep(30);
//        debugger;
    
        for (let i = 0; i < message.Attachments.length; i++){
            let input = findElement(srchPathFBM('messageAttachmentInput'));
            if (input == null) {
                Log_WriteError('Unable to find input element for sending attachment!');
                return [ERROR_EXTERNAL_ID, null];
            }
            await uploadAttachment(input, message.Attachments[i]);
        }

        await sleep(1)
        sendButton.click();
    
        // the message status would be "Sending" and then "Sent" or "Delivered", but in every case it'll
        // start off as one of the latter (from the previous message?) so we look for the transition from
        // "Sending" to "Sent/Delivered"

        let status = await waitForElement(srchPathFBM('messageCheckSending'))
        if (status == null) {
            Log_WriteError('Unable to get message sending status!');
            return checkIfMessageIsSent();
        }
        Log_WriteInfo('Sending message status: ' + (Utilities_IsString(status) ? status : 'unknown'));
    
        // Detect Sent Status
        // Note that the new message may be placed in the list of messages with an error result so
        // we can't simply check the number of messages in the list for example.
        count = 0;
        do
        {
            count++;
            if (count > 6) {
                
                Log_WriteError('Unable to send the message 2');
                return checkIfMessageIsSent();
            }
            await sleep(0.5);
            status = findElement(srchPathFBM('messageCheckSending'));
        } while (status);
        Log_WriteInfo('Message sent or failed: ' + (Utilities_IsString(status) ? status : 'unknown'));
    }
    
    return checkIfMessageIsSent();
}


// ====================================================
// Feed helpers

async function groupMemberReview(action, userID, groupID){
    let container = await scrollGroupRequestsIntoView(groupID);
    
    if (userID.indexOf('@fbun.socialattache.com') != -1) {
        // if we have a fbun we need to convert it to a fbperid, so we look for all the user links on the page and see
        // whether any of them convert to our fbun
        let links = findElements(srchPathFBG('memberRequestLinks'), null, container);
        for (let url of links) {
            if (url.indexOf('/groups/') != -1 && url.indexOf('/user/') != -1) {
                let addr = await getAddressFromFacebookProfilePageOrGroup(url);
                if (addr == userID) {
                    const [_groupId, _userId] = getGroupIdAndUserIdFromFacebookGroupUrl(url);
                    userID = _userId + '@fbperid.socialattache.com';
                    break;
                }
            }
        }
    }
    if (userID.indexOf('@fbun.socialattache.com') != -1) {
        // could be that the user is already a member or cancelled their request, or there's a bug in our code
        Log_WriteInfo('User identifier ' + userID + ' not found on page');
        return Str('Member request not found.');
    }
    
    await sleep(1);
    let requestElem = findElement(srchPathFBG('memberRequestContainerItem')
       .replace('%%GROUPID%%', getEmailPrefix(groupID))
       .replace('%%USERID%%', getEmailPrefix(userID)), null, container);
    if(requestElem == null){
        Log_WriteError('User container ' + userID + ' not found on page');
        return Str('Member request not found.');
    }
    let actionButton = null;
    if(action === 'accept'){
        actionButton = findElement(srchPathFBG('memberRequestApproveButton'), null, requestElem);
    }else if(action === 'decline'){
        actionButton = findElement(srchPathFBG('memberRequestDeclineButton'), null, requestElem);
    }
    if(actionButton == null){
        Log_WriteError('Action button not found.');
        return Str('Action button not found.');
    }
    actionButton.click();
    await sleep(1);

    return null;
}

// returns null on success, or error message
async function makeFriend() {
    let elem = await waitForElement(srchPathFBPF('friendUnfriendButton'));

    //BackgroundScript FriendUnfriend Error, Profile Locket to Friends Only
    if (elem == null){
        return Str('Profile locked');
    }
    //BackgroundScript FriendUnfriend Error, Profile is already friend, or friendship already requested
    if (keywordFBPF('FriendOrPendingFriend').includes(elem.innerText)) {
        return null;
    }
    elem.click()
    await sleep(3)
    //BackgroundScript FriendUnfriend Success
    return null;
}

// returns null on success, or error message
async function unFriendSomeone() {
    let elem = await waitForElement(srchPathFBPF('friendUnfriendButton'));
    //BackgroundScript FriendUnfriend Error, Profile Locket to Friends Only
    if (elem == null) {
        return Str('Profile locked');
    }
    //BackgroundScript FriendUnfriend Error, Profile is not your friend or requested friend yet
    if (!keywordFBPF('FriendOrPendingFriend').includes(elem.innerText)) {
        return null;
    }
    elem.click()
    await sleep(1)

    // if we were friends there would be a drop down menu, otherwise clicking above would have
    // cancelled the request and this will return null
    elem = findElement(srchPathFBPF('unfriendButton'))
    if (elem == null)
        return null;    // request cancelled
    
    elem.click()
    await sleep(1)

    elem = findElement(srchPathFBPF('confirmUnfriend'))
    if(elem != null){
        elem.click()
    }
    //BackgroundScript FriendUnfriend Success
    return null;
}
async function openFbFeedPostComposerOnMobileBasicVersion(accountInfo, post){
    await reqPushAction(null, {
        action: 'makePost_OnComposerOpen',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    let elem = findElement(srchPathFBP('feedPostMbasic'));
    elem.click()
}
async function openFbPagePostComposerOnMobileBasicVersion(accountInfo, post){
    await reqPushAction(null, {
        action: 'makePagePost_OnComposerOpen',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    let elem = findElement(srchPathFBP('pagePostMbasic'));
    elem.click();
}
async function makeFbFeedPostOnMobileBasicVersion(accountInfo, post){
    let elem = findElement(srchPathFBP('feedPostTextField'));
    if (elem == null) {
        // means we are not in the right page
        let attachmentError = findElement(srchPathFBP('feedAttachmentError'));
        if (attachmentError != null) {
            let from = '<' + accountInfo.id + '@fbperid.socialattache.com>';
            Log_WriteError("Error posting to Facebook feed!");
            Log_WriteInfo("Post: " + post.Body);
            Log_WriteInfo(`Error message: ${attachmentError.innerText}`);
            return await reqSetPostId(accountInfo.id, post.Uid, ERROR_EXTERNAL_ID, from, `FB feed post Attachment ${attachmentError.innerText}`);
        }
        Log_WriteError("Error FB feed post, textarea not find");
        return await reqSetPostId(accountInfo.id, post.Uid, ERROR_EXTERNAL_ID, from);
    }
    
    let elemPrivacy = await waitForElement(srchPathFBP('feedPostPrivacy'));
    if (elemPrivacy.value.trim() != keywordFBP('Public')) {
        await reqPushAction(null, {
            action: 'makePost_OnPrivacyChange',
            message: {
                accountInfo: accountInfo,
                post: post
            }});
        elemPrivacy.click();
        return;
    }

    if(typeof post.Attachments != 'undefined' 
       && post.Attachments.length > 0 
       && findElements(srchPathFBP('feedPostAttachment')).length <= 0){
        
        await reqPushAction(null, {
            action: 'makePost_Attachments',
            message: {
                accountInfo: accountInfo,
                post: post
            }});
        (await waitForElement(srchPathFBP('feedPostAddAttachmentButton'))).click()
        return;
    }
    
    elem.value = post.Body
    await reqPushAction(null, {
        action: 'makePost_Finalize',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    elem = findElement(srchPathFBP('feedPostButton'));
    elem.click()
}
async function makeFbPagePostOnMobileBasicVersion(accountInfo, post){
    let elem = findElement(srchPathFBP('pagePostTextField'));
    if (elem == null) {
        // means we are not in the right page
        let attachmentError = findElement(srchPathFBP('pageAttachmentError'));
        if (attachmentError != null) {
            let from = '<' + accountInfo.id + '@fbperid.socialattache.com>';
            Log_WriteError("Error posting to Facebook page!");
            Log_WriteInfo("Post: " + post.Body);
            Log_WriteInfo(`Error message: ${attachmentError.innerText}`);
            return await reqSetPostId(accountInfo.id, post.Uid, ERROR_EXTERNAL_ID, from, `FB page post Attachment ${attachmentError.innerText}`);
        }
        Log_WriteError("Error FB page post, textarea not find");
        return await reqSetPostId(accountInfo.id, post.Uid, ERROR_EXTERNAL_ID, from);
    }
    if(typeof post.Attachments != 'undefined' 
       && post.Attachments.length > 0 
       && findElements(srchPathFBP('pagePostAttachment')).length <= 0){

        await reqPushAction(null, {
            action: 'makePagePost_Attachments',
            message: {
                accountInfo: accountInfo,
                post: post
            }});
        (await waitForElement(srchPathFBP('pagePostAddAttachmentButton'))).click();
        return;
    }

    elem.value = post.Body
    await reqPushAction(null, {
        action: 'makePost_Finalize',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    elem = findElement(srchPathFBP('pagePostButton'));
    elem.click();
}
async function changePrivacyOfPost(accountInfo, post){
    await reqPushAction(null, {
        action: 'makePost_OnComposerOpen',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    let elem = await waitForElement(srchPathFBP('publicAudienceLink'), 2);
    if(elem == null){
        location.redirect()
    }
    elem.click()
}
async function makePost_Attachments(accountInfo, post){
    let elem = await waitForElement(srchPathFBP('feedPostAttachment1'))
    if(typeof post.Attachments[0] != 'undefined'){
        await uploadAttachment(elem, post.Attachments[0])
    }
    elem = await waitForElement(srchPathFBP('feedPostAttachment2'))
    if(post.Attachments.length >= 2 && typeof post.Attachments[1] != 'undefined'){
        await uploadAttachment(elem, post.Attachments[1])
    }
    elem = await waitForElement(srchPathFBP('feedPostAttachment3'))
    if(post.Attachments.length >= 3 && typeof post.Attachments[3]!= 'undefined'){
        await uploadAttachment(elem, post.Attachments[2])
    }
    
    await reqPushAction(null, {
        action: 'makePost_OnComposerOpen',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    findElement(srchPathFBP('feedPostAttachmentPreviewButton')).click()
}
async function makePagePost_Attachments(accountInfo, post){
    let elem = await waitForElement(srchPathFBP('pagePostAttachment1'));
    if(typeof post.Attachments[0] != 'undefined'){
        await uploadAttachment(elem, post.Attachments[0])
    }
    elem = await waitForElement(srchPathFBP('pagePostAttachment2'));
    if(post.Attachments.length >= 2 && typeof post.Attachments[1] != 'undefined'){
        await uploadAttachment(elem, post.Attachments[1])
    }
    elem = await waitForElement(srchPathFBP('pagePostAttachment3'));
    if(post.Attachments.length >= 3 && typeof post.Attachments[3]!= 'undefined'){
        await uploadAttachment(elem, post.Attachments[2])
    }
    
    await reqPushAction(null, {
        action: 'makePagePost_OnComposerOpen',
        message: {
            accountInfo: accountInfo,
            post: post
        }});
    findElement(srchPathFBP('pagePostAttachmentPreviewButton')).click()
}

async function makeFbFeedPostOnMobileVersion(accountID, post){
    let elem = await waitForElement(srchPathFBP('mComposerBtn'));
    elem.click();

    elem = await waitForElement(srchPathFBP("mPrivacyBtn"));
    if (elem.innerText.trim() != keywordFBP('Public')) {
        elem.click();

        elem = await waitForElement(srchPathFBP('mAudienceOptions'));
        elem.click();
    }

    //Add the text to the box
    elem = await waitForElement(srchPathFBP('mComposerInput'))
    if (typeof post.Body != 'undefined' && post.Body !== "") {
        elem.value = post.Body
        findElement(srchPathFBP('mMentionsHidden')).value = post.Body
    }

    elem = findElement(srchPathFBP('mSubmitBtn'));
    elem.click()
}

async function makeFbFeedPost(accountID, post) {
    let elem = await waitForElement(srchPathFBP('composer'));
    elem.click();
    await sleep(2);

    elem = await waitForElement(srchPathFBP('shareWith'));
    if (elem.innerText.trim() != keywordFBP('Public')) {
        elem.click();
        
        elem = await waitForElement(srchPathFBP('sharePublic'));
        elem.click();
        await sleep(1);
    }

    let editBox = await waitForElement(srchPathFBP('postTextarea'));
    if (editBox == null) {
        Log_WriteError('Edit box not found for sending message ' + message.Uid);
        return ERROR_EXTERNAL_ID;
    }

    let count = 0;
    let activeElement = document.activeElement;   // this seems to be the body element
    while (count < 5 && activeElement == null) {
        activeElement = document.activeElement;
        await sleep(2);
        count++;
    }
    if (activeElement == null) {
        Log_WriteError('Active element not found!');
        return RETRY_EXTERNAL_ID;
    }
    //    Log_WriteInfo('Active element is a ' + activeElement.tagName);

    await sleep(1);
    editBox.focus();
    if (typeof post.Body != 'undefined' && post.Body !== "") {
        try {
            // DRL FIXIT? We should use MyClipboard instead of navigator.clipboard.
            let currentClipboardText = await navigator.clipboard.readText();
            editBox.focus();
            await navigator.clipboard.writeText(post.Body);
            editBox.focus();
            await document.execCommand('paste');
            editBox.focus();
            await navigator.clipboard.writeText(currentClipboardText); // restoring the previous clipboard text
        } catch (e) {
            Log_WriteException(e, 'Unable to copy/paste post!');
            return RETRY_EXTERNAL_ID;
        }

        editBox.focus();
    }

    await sleep(2);
    //Open the post attachment dropdownzone by clicking in the image button
    elem = findElement(srchPathFBP('openPostAttachmentInput'))

    elem.click()
    await sleep(1);

    if(typeof post.Attachments != "undefined"){
        for (let i = 0; i < post.Attachments.length; i++){
            elem = await waitForElement(srchPathFBP('postAttachmentInput'));
            await uploadAttachment(elem, post.Attachments[i]);
        }
    }

    let from = '<' + accountID + '@fbperid.socialattache.com>';
    //elem = await waitForElement(srchPathFBP('progressBar'), 3);

    elem = await waitForElement(srchPathFBP('postButton'));
    elem.click();

    elem = await waitForElement(srchPathFBP('successAlert'))
    if (elem == null) {
        Log_WriteError("Error posting to Facebook feed!");
        Log_WriteInfo("Post: " + post.toString());
        await reqSetPostId(accountID, post.Uid, ERROR_EXTERNAL_ID, from);
    }
    else
        await reqSetPostId(accountID, post.Uid, NO_EXTERNAL_ID, from);
}

async function makeFbGroupPost(accountID, post) {
    let elem = await waitForElement(srchPathFBGP('composer'));
    elem.click();

    let editBox = await waitForElement(srchPathFBGP('postTextarea'));
    if (editBox == null) {
        Log_WriteError('Edit box not found for sending message ' + message.Uid);
        return ERROR_EXTERNAL_ID;
    }

    let count = 0;
    let activeElement = document.activeElement;   // this seems to be the body element
    while (count < 5 && activeElement == null) {
        activeElement = document.activeElement;
        await sleep(2);
        count++;
    }
    if (activeElement == null) {
        Log_WriteError('Active element not found!');
        return RETRY_EXTERNAL_ID;
    }

    await sleep(1);
    editBox.focus();
    if (typeof post.Body != 'undefined' && post.Body !== "") {
        try {
            // DRL FIXIT? We should use MyClipboard instead of navigator.clipboard.
            let currentClipboardText = await navigator.clipboard.readText();
            await navigator.clipboard.writeText(post.Body);
            await document.execCommand('paste');
            await navigator.clipboard.writeText(currentClipboardText); // restoring the previous clipboard text
        } catch (e) {
            Log_WriteException(e, 'Unable to copy/paste post!');
            return RETRY_EXTERNAL_ID;
        }
        editBox.focus();
    }

    await sleep(1);

    if(typeof post.Attachments != "undefined"){
        for (let i = 0; i < post.Attachments.length; i++){
            elem = await waitForElement(srchPathFBGP('postAttachmentInput'));
            await uploadAttachment(elem, post.Attachments[i]);
        }
    }

    let from = '<' + accountID + '@fbperid.socialattache.com>';
    elem = await waitForElement(srchPathFBGP('progressBar'), 3);

    elem = await waitForElement(srchPathFBGP('postButton'));
    elem.click();

    await sleep(5);
    /*
    if (elem == null) {
        Log_WriteError("Error posting to Facebook feed!");
        Log_WriteInfo("Post: " + post.toString());
        await reqSetPostId(accountID, post.Uid, ERROR_EXTERNAL_ID, from);
    }
    else*/
    await reqSetPostId(accountID, post.Uid, NO_EXTERNAL_ID, from);
}

function getCommentTimestampDelta(postElement) {
    const linkElement   = Array.from(findElements(srchPathFBP('commentTimestamp'), null, postElement));
    // DRL FIXIT? I believe this check should be in the selector above?
    const timeButton    = linkElement.filter( btt => /^([0-9]+)/.test(btt.innerText) )
    // only links containing numbers, meaning it's a timestamp

    const time = timeButton.length > 0 ? timeToDelta(timeButton[0].innerText) : NaN;
    return isNaN(time) ? -1 : time;
}

function massageFromRoles(roles, addRole) {
    let referenceRoles = keywordFBM('MessageFromRoles');
    for (let i = 0; i < roles.length; i++) {
        let found = false;
        for (let role in referenceRoles) {
            if (roles[i] == referenceRoles[role]) { // if it matches translated version
                roles[i] = role;                    // set it to reference version
                found = true;
                break;
            }
        }
        if (!found) {
            if (roles[i].indexOf('+') !== 0)    // ignore "+2" style items appearing when there are many roles
                Log_WriteError('Found comment with unsupported role "' + roles[i] + '" in post ' + window.location.href);
            roles.splice(i, 1);
            i--;
        }
    }
    if (addRole)
        roles.push(addRole);
    Utilities_ArrayRemoveDuplicates(roles);
    return roles;
}

// postAuthorID could be NULL as we sometimes don't have it
async function parseComment(comment, externalPostID, postAuthorID){

    // waiting for the whole comment showing up
    while(true){
        // searching for a "See More" button of the comment
        let seeMoreButton = findElements(srchPathFBP('button'), null, comment);
        seeMoreButton = Array.from(seeMoreButton)
            .filter(btt=>{
                const rg = new RegExp(keywordFBP('SeeMore'));
                return rg.test(btt.innerText);
            })

        if(seeMoreButton.length > 0)
            seeMoreButton[0].click();
        else
        // if not, meaning that the comment is already full showed on screen (no text cut)
            break;
        
        await sleep(1);
    }

    const message   = {}
    message.Type    = 'fbp_comment';
    message.Uid     = NO_EXTERNAL_ID;
    message.Folder  = 'inbox';
    message.Url     = window.location.href;
    // currently the "to" is always the post
    message.To      = ['<' + externalPostID + '>'];

    // DRL FIXIT? Having these items (url, username, roles) related like this makes it difficult to update if it changes.

    // the author id/username are inside a link button of the comment
    const author = findElement(srchPathFBP('commentAuthor'), null, comment);
    const commentAuthorID = await getAddressFromFacebookProfilePageOrGroup(author.href);
    message.From = author.innerText.trim() + ' <' + commentAuthorID + '>';

    // the roles are relative to the author link
    message.FromRoles = findElements(srchPathFBP('commentAuthorRoles'), null, author)
    message.FromRoles = massageFromRoles(message.FromRoles, commentAuthorID == postAuthorID ? 'Author' : null);

    // comment text/message
    const commentText   = findElement(srchPathFBP('commentText'), null, comment);
    message.Body        = commentText ? commentText.innerText : '';

    // comment timestamp
    message.timestamp = Date.now() - getCommentTimestampDelta(comment);
    message.Date    = timestampToString(new Date(message.timestamp));

    // getting attachments of a comment
    let attachs = [];
    attachs     = attachs.concat(Array.from(findElements('img', null, comment)));
    attachs     = attachs.concat(Array.from(findElements('video', null, comment)));
    
    message.Attachments = [];
    for(let attach of attachs){
        message.Attachments.push({URL : attach.src})
    }

// We only need comments in a certain date range so instead of doing this expensive operation here we leave it
// up to the caller to do it only on the needed comments.
//    await massageAttachments(message);
    
    return message;
}

let commentsCache = null;
let commentsCacheCurrentCheck = null;
let commentsCacheCheckHash = null;
async function getComments(accountInfo, externalPostID, lastCheck, cursor, currentCheck){
    let checkHash = externalPostID + '_' + lastCheck;  // if any of these change we need to re-parse
    let comments = null;
    
    if (commentsCache != null && commentsCacheCheckHash === checkHash) {
        // we have already parsed the comments, just need to get the next chunk
        comments = commentsCache;
        // we haven't loaded anything that may have been received since this date, so we must use
        // it as the new lastSynced in order not to miss anything in the next pass
        currentCheck = commentsCacheCurrentCheck;
    }
    else {
        // save some memory by removing the cache that is no longer valid
        assert(commentsCache == null);  // if there was a change the page should have been refreshed, clearing this
        commentsCache = null;
        commentsCacheCurrentCheck = null;
        commentsCacheCheckHash = null;

        let box = await waitForElement(srchPathFBP('postContainer2'));
        if (box == null)
        {
            if (findElement(srchPathFBP('postUnavailable'))) {
                // DRL FIXIT? We should probably turn off automation so we stop trying to parse it?
                Log_WriteWarning('Post ' + externalPostID + ' is no longer available: ' + window.location.href);
            }
            else
                Log_WriteError('Unable to parse post ' + externalPostID + ': ' + window.location.href);
            return [[], null, null];
        }
        
        //Check keep checking if there is a pause button and in the case there is will pause avoiding from the video reaching the end and getting redirected to another page
        const videoPauseChecker = ()=>{
            let pauseBtn = findElement(srchPathFBP('postVideoPause'))
            if(pauseBtn != null){
                pauseBtn.click()
            }else{
                setTimeout(() => videoPauseChecker(), 1000)
            }
        }
        videoPauseChecker();
    
        let postAuthorID = null;
        let url = findElement(srchPathFBP('postAuthorURL'), null, box);
        let watchLivePath = srchPathFBP('watchLivePath');
        if (url == null && !window.location.href.includes(watchLivePath)) {    // live video doesn't have author we can easily get
            Log_WriteError('Post author not found for post: ' + window.location.href);
            return [[], cursor, currentCheck];
        }
        if (postAuthorID)
            postAuthorID = await getAddressFromFacebookProfilePageOrGroup(url);
        
        // searching all div[role=button] of a post element to tell when it is loaded
        await waitForElements(srchPathFBP('postLoaded'), null, box);
        
        //Open the comments if they are not open yet
        let commentsOpenButton = findElement(srchPathFBP('postOpenCommentsButton'))
        if (commentsOpenButton != null) {
            commentsOpenButton.click();
            let hide = await waitForElement(srchPathFBP('postHideCommentsButton'), 4);
            if (hide == null)
                Log_WriteWarning('Hide comments button not found for post: ' + window.location.href);
            let commentMostRelevant = findElement(srchPathFBP('postMostRelevantCommentSelector'));
            // For https://www.facebook.com/karlakeysersilver/videos/274426231345508/
            // the following is actually a drop down with the label "Most recent" and in
            // that drop down there is no "show all" but instead the selector here matches on
            // "Most recent", but things do seem to progress loading 50 comments at a time.
            // On https://www.facebook.com/fbrookes/posts/10159396469198855 the selector seems
            // to match on "Most relevant" so we're not getting all the comments, but from the
            // name of the selector I guess that is the intent?
            if (commentMostRelevant != null) {
                commentMostRelevant.click();
                let commentSelectAllComments = await waitForElement(srchPathFBP('postShowAllCommentsButtonOnMostRelevantCommentSelector'));
                if (commentSelectAllComments)
                    commentSelectAllComments.click();
                else    // this happened to me with the post linked above...
                    Log_WriteError("No result found for postShowAllCommentsButtonOnMostRelevantCommentSelector.");
            }
        }
        
        // keep loading more comments as long as there's a button to do so, or we run too long
        for (let i = 0; true; i++) {
            if (i == 150) { // we've waited long enough (about 10 minutes)
                Log_WriteError("Waited long enough for comments to arrive, breaking out and processing what we have: " + window.location.href);
                break;
            }
        
            // DRL FIXIT! Would be much better (but more complex) to have some indication that the rotating circle has gone away.
            await sleep(4);
            reqPing();
            
            const viewMoreButtons = findElements(srchPathFBP('viewMoreComments'), null, box);
            if (viewMoreButtons.length == 0)
                break;

            for (let viewMoreButton of viewMoreButtons)
                viewMoreButton.click();
        }
    
        // get all comments on screen
        const items = findElements(srchPathFBP('commentContainers'), null, box);
        if (items.length == 0) {
            Log_WriteError('Got no comments parsing post, check for potential scraping error: ' + window.location.href);
        }
    
        // parsing all comments that are after the lastCheck timestamp
        comments = [];
        for (let item of items) {
            const timestamp = Date.now() - getCommentTimestampDelta(item);
            if (roundTimeUp(timestamp) > lastCheck && timestamp <= currentCheck)
                comments.push(await parseComment(item, externalPostID, postAuthorID));
        }
        
        // sort by date
        comments.sort(function compareFn(a, b) {
            return a.timestamp - b.timestamp;
        });
    }

    if (comments.length > cursor + constants.MAXIMUM_COMMENTS_PER_CHUNK) {
        if (commentsCache == null) {
            // cache the results to save us having to parse them all over again
            commentsCache = comments;
            commentsCacheCurrentCheck = currentCheck;
            commentsCacheCheckHash = checkHash;
        }
        else
            assert(commentsCacheCheckHash === checkHash);

        comments = comments.slice(cursor, cursor + constants.MAXIMUM_COMMENTS_PER_CHUNK);
        cursor += constants.MAXIMUM_COMMENTS_PER_CHUNK;
    }
    else {
        commentsCache = null;
        commentsCacheCurrentCheck = null;
        commentsCacheCheckHash = null;
        
        comments = comments.slice(cursor, cursor + constants.MAXIMUM_COMMENTS_PER_CHUNK);
        cursor = 0;
    }
    
    // this was not done in parseComment() above for efficiency so we do it here
    for (let comment of comments)
        await massageAttachments(comment);

    return [comments, cursor, currentCheck];
}
/* Not used since reactions seem to vary each time we call and often can't get them all.
async function getReactions(accountInfo, externalPostID, lastCheck, currentCheck){
    // getting comments
    let box = null;
    box = await waitForElement(srchPathFBP('postContainer'));
    if (box == null)
    {
        Log_WriteError('It appears that post ' + externalPostID + ' is no longer available, or is not a supported format: ' + window.location.href);
        return [];
    }

    const viewAllReactionsButton = findElement(srchPathFBM('viewAllReactionsButton'), null, box)
    viewAllReactionsButton.click();
    let reactions = await waitForElements('div.rpm2j7zs.k7i0oixp.gvuykj2m.j83agx80.cbu4d94t.ni8dbmo4.du4w35lb.q5bimw55.ofs802cu.pohlnb88.dkue75c7.mb9wzai9.l56l04vs.r57mb794.l9j0dhe7.kh7kg01d.eg9m0zos.c3g1iek1.otl40fxz.cxgpxx05.rz4wbd8a.sj5x9vvc.a8nywdso > div.j83agx80.cbu4d94t.buofh1pr.l9j0dhe7 > div')
    let scrollableContainer = findElement('div.rpm2j7zs.k7i0oixp.gvuykj2m.j83agx80.cbu4d94t.ni8dbmo4.du4w35lb.q5bimw55.ofs802cu.pohlnb88.dkue75c7.mb9wzai9.l56l04vs.r57mb794.l9j0dhe7.kh7kg01d.eg9m0zos.c3g1iek1.otl40fxz.cxgpxx05.rz4wbd8a.sj5x9vvc.a8nywdso')
    let lastReactionsScrollHeight = scrollableContainer.scrollHeight;
    // waiting for post showing up
    while(true) {
        console.log("Box => ", box);
        scrollableContainer.scrollTo(0, scrollableContainer.scrollHeight);
        await sleep(3);
        reactions = await findElements('div.rpm2j7zs.k7i0oixp.gvuykj2m.j83agx80.cbu4d94t.ni8dbmo4.du4w35lb.q5bimw55.ofs802cu.pohlnb88.dkue75c7.mb9wzai9.l56l04vs.r57mb794.l9j0dhe7.kh7kg01d.eg9m0zos.c3g1iek1.otl40fxz.cxgpxx05.rz4wbd8a.sj5x9vvc.a8nywdso > div.j83agx80.cbu4d94t.buofh1pr.l9j0dhe7 > div')
        if(scrollableContainer.scrollHeight > lastReactionsScrollHeight){
            lastReactionsScrollHeight = scrollableContainer.scrollHeight
        }else{
            break;
        }
        reqPing();
    }

    // get all reactions on screen
    console.log("Reactions => ", reactions)
    return;
    // parsing all comments that are after the lastCheck timestamp
    const datas = [];
    for(let i = 0; i < reactions.length; i++){
        //datas.push(await parseComment(reactions[i], externalPostID));
    }

    return datas;
}
*/
function getGroupRequestTimestamp(groupMemberRequestsContainer) {
    let timestampSpan = findElement(srchPathFBG('memberRequestContainerTimestamp'), null, groupMemberRequestsContainer);
    const timestampRegex = new RegExp(srchPathFBG('timestamp'), 'g');
    let match = timestampSpan.innerText.match(timestampRegex);
    if (match == null) {
        Log_WriteError('Unable to decode timestamp from "' + timestampSpan.innerText + '" at ' + window.location.href);
        return null;
    }
    return convertTimeAgoToTimestamp(match[0])
}
async function parseGroupMemberRequest(memberRequestElement, groupId){
    let userName = findElement(srchPathFBG('memberRequestContainerName'), null, memberRequestElement);
    if (userName == null) {
        Log_WriteWarning('Username not found for profile, perhaps the account has been shut down.');
        return null;
    }
    let url = findElement(srchPathFBG('memberRequestsProfileUrl'), null, memberRequestElement)
    const [groupId2, userId] = getGroupIdAndUserIdFromFacebookGroupUrl(url);
    assert(groupId == groupId2);
    let uid = await getAddressFromFacebookProfilePageOrGroup(url);
    const timestamp = getGroupRequestTimestamp(memberRequestElement);

    let questionsElements = findElements(srchPathFBG('memberRequestQuestionElement'), null, memberRequestElement)
    let questions = [];

    for (let i = 0; i < questionsElements.length; i++){
        let questionAnswer = findElements(srchPathFBG('memberRequestQuestionElementQuestionAnswerText'), null, questionsElements[i])
        questions.push({
            Question: questionAnswer[0].innerText,
            Answer: questionAnswer[1].innerText,
        })
    }
    return {
        GroupUid: 'fbp:'+groupId+'@fbgroup.socialattache.com',
        Uid: uid,
        UserId: userId, // this is the numeric ID needed to get the answers, maybe we should save this as a fbperid?
        Name: userName,
        GroupRoles: ['JoinRequested'],
        RequestDate: timestampToString(timestamp),
        Questions: questions,
    }
}

async function scrollGroupRequestsIntoView(groupId) {
    let container = await waitForElement(srchPathFBG('memberRequestContainer'), 8);
    if (container == null) {
        // DRL FIXIT? We should try to figure out whether this is a code error, or the group has no requests, or the user isn't an admin.
        Log_WriteWarning('No group member requests container found for group ' + groupId + ' at ' + window.location.href);
        return [];
    }

    let scrollable = Utilities_GetScrollableParentElement(container);

    let lastHeight = scrollable.scrollHeight
    do {
        scrollable.scrollTo(0, scrollable.scrollHeight);
        await sleep(3)
        if(lastHeight < scrollable.scrollHeight){
            lastHeight = scrollable.scrollHeight
        }else{
            break;
        }
    }while (true);
    
    return container;
}

async function getGroupRequests(accountInfo, groupId, lastCheck, currentCheck){
    let container = await scrollGroupRequestsIntoView(groupId);
    
    let groupMemberRequestsContainers = findElements(srchPathFBG('memberRequestContainers'), null, container)
    let groupMemberRequests = [];
    await sleep(2)

    for(let i = 0; i < groupMemberRequestsContainers.length; i++){
        const timestamp = getGroupRequestTimestamp(groupMemberRequestsContainers[i]);
        if (timestamp > lastCheck && timestamp <= currentCheck) {
            let member = await parseGroupMemberRequest(groupMemberRequestsContainers[i], groupId);
            if (member != null)
                groupMemberRequests.push(member);

            reqPing();
        }
    }

    return groupMemberRequests;
}
async function parseStaffGroupMember(staffMemberElement, groupId){
    let name = findElement(srchPathFBGP('staffMemberName'), null, staffMemberElement)
    let url = findElement(srchPathFBGP('staffMemberProfileUrl'), null, staffMemberElement);
    let address = await getAddressFromFacebookProfilePageOrGroup(url);
    let roles = findElements(srchPathFBGP('staffMemberRoles'), null, staffMemberElement);
    roles = massageFromRoles(roles);  // "from" roles include the group roles so we can use this method
    return {
        GroupUid: 'fbp:'+groupId+"@fbgroup.socialattache.com",
        Uid: address,
        Name: name,
        GroupRoles: roles
        // Questions left out intentionally
    };
}

async function getGroupStaff(accountInfo, groupId, lastCheck, currentCheck){
    await sleep(5)

    let staffMembersContainer = await waitForElement(srchPathFBGP('staffMembersContainer'))
    if (staffMembersContainer == null) {
        // DRL FIXIT? We should try to figure out whether this is a code error, or the group has no requests, or the user isn't an admin.
        Log_WriteWarning('No group staff members container found for group ' + groupId + ' at ' + window.location.href);
        return [];
    }

    let staffMembers = [];
    await sleep(2)
    
    let scrollable = Utilities_GetScrollableParentElement(staffMembersContainer);
    let lastHeight = scrollable.scrollHeight
    while (true){
        scrollable.scrollTo(0, scrollable.scrollHeight)
        await sleep(3)
        if(lastHeight < scrollable.scrollHeight){
            lastHeight = scrollable.scrollHeight
        }else{
            break;
        }
    }
    let staffMembersElements = findElements(srchPathFBGP('staffMemberContainerElement'), null, staffMembersContainer)

    for(let i = 0; i < staffMembersElements.length; i++){
        staffMembers.push(await parseStaffGroupMember(staffMembersElements[i], groupId));

        reqPing();
    }

    return staffMembers;
}

async function getGroupMembers(accountInfo, groupId, lastCheck, currentCheck) {
    let container = await waitForElement(srchPathFBG("memberGatherContainer"));
    
    let scrollable = Utilities_GetScrollableParentElement(container);
    let lastHeight = scrollable.scrollHeight
    let latestTimestamp = null;
    do {
        let latest = findElements(srchPathFBG("allMembersGatheredToScrape"))
        latestTimestamp = findElement(srchPathFBG("memberGatherContainerDate"), null, latest[latest.length-1])

        scrollable.scrollTo(0, scrollable.scrollHeight);
        await sleep(3)
        if(lastHeight < scrollable.scrollHeight){
            lastHeight = scrollable.scrollHeight
        }else{
            break;
        }

        if(latestTimestamp.includes(keywordFBG('createdGroup'))){  // DRL FIXIT! This shouldn't be hardcoded, and I'm not sure
            Log_WriteError('Is this code is needed?');  // under which scenario this code would be necessary?
            break;
        }
        latestTimestamp = parseGroupLatestTimestamp(latestTimestamp)
    }while (lastCheck == null || lastCheck < latestTimestamp);

    let groupMembersToScrape = findElements(srchPathFBG("allMembersGatheredToScrape"));
    let groupMembers = []
    let cursor = null;
    for (let i = groupMembersToScrape.length-1; i >= 0; i--){   // go through group members oldest first
        let elem = groupMembersToScrape[i];
    
        let timestamp = findElement(srchPathFBG("memberGatherContainerDate"), null, elem)
        timestamp = parseGroupLatestTimestamp(timestamp)
        if (roundTimeUp(timestamp) > lastCheck && timestamp <= currentCheck) {
            groupMembers.push(await parseGroupMemberFromSelector(elem, groupId));

            if (groupMembers.length >= constants.MAXIMUM_MEMBERS_PER_CHUNK) {
                //set the currentCheck to the last one parsed here so we continue there next time around
                cursor = timestamp;
                break;
            }
        }
        
        reqPing();
    }

    return [groupMembers, cursor];
}
async function parseGroupMemberFromSelector(element, groupId){
    let url = findElement(srchPathFBG("memberGatherContainerUrl"), null, element)
    let name = findElement(srchPathFBG("memberGatherContainerName"), null, element)
    let timestamp = findElement(srchPathFBG("memberGatherContainerDate"), null, element);
    timestamp = parseGroupLatestTimestamp(timestamp);
    const [groupId2, userId] = getGroupIdAndUserIdFromFacebookGroupUrl(url);
    assert(groupId == groupId2);
    let uid = await getAddressFromFacebookProfilePageOrGroup(url);
    return {
        GroupUid: 'fbp:'+groupId+'@fbgroup.socialattache.com',
        Uid: uid,       // this should be a fbun
        UserId: userId, // this is the numeric ID needed to get the answers, maybe we should save this as a fbperid?
        Name: name,
        GroupRoles: ['GroupMember'],
        Questions: [],
        JoinDate: timestampToString(timestamp),
    }
}

// this clean date string before converting it
function parseGroupLatestTimestamp(timestampString){
    const toBeConvertible = keywordFBG('toBeConvertible');
    timestampString = RegExp(toBeConvertible).exec(timestampString) != null ? RegExp(toBeConvertible).exec(timestampString)[2]: timestampString;
    keywordFBG('toRemove').forEach(word => {
        timestampString = timestampString.replace(word, "");
    });
    return convertTimeAgoToTimestamp(timestampString);
}

// this parses the answers from the profile page after they have become a group member
async function getGroupMemberAnswers(accountInfo, groupMember) {
    groupMember.Questions = [];
    let buttonOpenAnswers = await waitForElement(srchPathFBG('memberViewAnswersButton'), 4);
    let buttonNoAnswersYet = findElement(srchPathFBG('memberViewNoAnswersYetButton'));
    if (buttonOpenAnswers == null) {
        assert(buttonNoAnswersYet != null); // sanity to check if selectors need to be updated
        return groupMember;
    }
    buttonOpenAnswers.click()

    let questionsDialog = await waitForElement(srchPathFBG('memberQuestionsDialog'))

    let questionsContainer = findElements(srchPathFBG('memberQuestionsContainer'), null, questionsDialog);
    for(let questionContainer of questionsContainer){
        let question = findElement(srchPathFBG('memberQuestionsContainerQuestion'), null, questionContainer);
        let answer = findElement(srchPathFBG('memberQuestionsContainerAnswer'), null, questionContainer);
        groupMember.Questions.push({
            Question: question,
            Answer: answer,
        })
    }
    return groupMember;
}

async function getGroupQuestions(groupId) {
    await sleep(5)

    let questions = findElements(srchPathPG('facebookGroupQuestions'))
    
    let parsedQuestions = []
    
    for (let i = 0; i < questions.length; i++){
        let typeElement = findElement(srchPathPG('facebookGroupQuestionsTypeElement'), null, questions[i])
        if (typeElement === keywordFBG('WriteYourAnswer')) {
            typeElement = 'string'
            let label = findElement(srchPathPG('facebookGroupQuestionsLabel'), null, questions[i]);
            parsedQuestions.push({
                Label: label,
                Type: typeElement,
            })
        }else{
            // DRL FIXIT? We can have checkboxes or multiple choice so it would be nice to know which it is.
            typeElement = 'list'
            let label = findElement(srchPathPG('facebookGroupQuestionsOptionElementLabel'), null, questions[i]);
            let optionsElements = Array.from(findElement(srchPathPG('facebookGroupQuestionOptionElements'), null, questions[i]))
            let options = []
            for (let j in optionsElements){
                options.push(findElement(srchPathPG('facebookGroupQuestionsOptionElementInnerText'), null, optionsElements[j]))
            }
            parsedQuestions.push({
                Label: label,
                Type: typeElement,
                Options: options
            })
        }
    }
    return {
        GroupUid: 'fbp:'+groupId+'@fbgroup.socialattache.com',
        Questions: parsedQuestions
    };
}

Log_WriteInfo("XXX ContentScriptFacebook.js");

async function loopFacebook() {
    console.log(DateAndTime_Now() + " loopFacebook()");    // this is here so we can click on it in the console for easier debugging ;-)
    
    if (!await contentScriptInit('FacebookScrape'))
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
                Log_WriteInfo('Getting Facebook account info');
                accountInfo = getFacebookAccountInfo();
                Log_WriteInfo('Account info: ' + GetVariableAsString(accountInfo));
                if (accountInfo == null) {
                    // some actions like fetching contacts are using pages where we don't always have the
                    // account info but we can still perform those actions
                    accountInfo = {
                        name: null,
                        id: null
                    };
                }
            }
            let currentCheck = Date.now();
            let resp = await reqGetAction(accountInfo.id, accountInfo.name);
            
            // added this to check for a global "throttled/blocked" response from Facebook since we started seeing this on 13 Jul 2022
            if (resp.action != null && findElement(elementPaths.Facebook.throttled)) {
                await reqSetThrottled('FacebookScrape', timings.FACEBOOK_THROTTLED_DELAY);
            }
            else if (resp.action == 'getChats') {
                let chats = await getChats(resp.lastCheck);
                await reqSetChats(accountInfo.id, chats, currentCheck);
            }
            else if (resp.action == 'getMessages') {
                let [messages, cursor] = await getMessages(accountInfo, resp.lastCheck, resp.currentCheck);
                if (await reqSetMessages(accountInfo.id, cursor, messages))
                    continue;   // no wait, just check again for next action
                delay = timings.INTER_CONVERSATION_CHECK_DELAY;
            }
            else if (resp.action == 'skipConversation') {
                await reqSetMessages(accountInfo.id, null, null);
                continue;   // no wait, just check again for next action
            }
            /* Not Used Since - 29/12/2021
            else if (resp.action == 'checkLastId') {
                await checkLastId(accountInfo, resp.message);
            }*/
            else if (resp.action == 'sendMessage') {
                let [messageID, errorMessage] = await sendMessage(resp.message);
                let from = accountInfo.name + ' <' + accountInfo.id + '@fbperid.socialattache.com>';
                await reqSetMessageId(accountInfo.id, resp.message.Uid, messageID, from, errorMessage);
                // background script will take care of waiting between messages as needed
            }
            else if (resp.action == 'sendBasicMessage') {
                if (!await sendBasicMessage(resp.message))  // returns false on error
                    await reqSetMessageId(accountInfo.id, resp.message.Uid, ERROR_EXTERNAL_ID, null);
                else {
                    // the page will reload and then we'll see if the send was successful
                    await reqPushAction(null, {
                        action: 'checkIfBasicMessageIsSent',
                        message: resp.message});
                    delay = 5;  // just wait long enough for page to reload
                }
            }
            else if (resp.action == 'checkIfBasicMessageIsSent') {
                let [messageID, errorMessage] = checkIfBasicMessageIsSent(resp.message);
                // for the basic case we don't usually have the account name and we don't want to use "null" for it
                let from = (accountInfo.name ? accountInfo.name + ' ' : '') +
                    '<' + accountInfo.id + '@fbperid.socialattache.com>';
                await reqSetMessageId(accountInfo.id, resp.message.Uid, messageID, from, errorMessage);
                // background script will take care of waiting between messages as needed
            }
            else if (resp.action == 'makePost') {
                let postID = null;

                if (resp.post.MessageBoxUid.indexOf('@fbgroup.socialattache.com') != -1){
                    //TODO Old code for group post
                    postID = await makeFbGroupPost(accountInfo.id, resp.post);

                    let from = accountInfo.name + ' <' + accountInfo.id + '@fbperid.socialattache.com>';
                    await reqSetPostId(accountInfo.id, resp.post.Uid, postID, from, null);
                    delay = timings.INTER_POST_DELAY;
                }
                else if (resp.post.MessageBoxUid.indexOf('@fbpage.socialattache.com') != -1) {
                    let postId = await openFbPagePostComposerOnMobileBasicVersion(accountInfo, resp.post)
                    delay = timings.INTER_POST_DELAY;
                }
                else {
                    let postId = await openFbFeedPostComposerOnMobileBasicVersion(accountInfo, resp.post)
                    delay = timings.INTER_POST_DELAY;
                    //postID = await makeFbFeedPost(accountInfo.id, resp.post);
                }
            }
            else if(resp.action == 'makePost_OnComposerOpen'){
                await makeFbFeedPostOnMobileBasicVersion(resp.message.accountInfo, resp.message.post)
            }
            else if(resp.action == 'makePagePost_OnComposerOpen'){
                await makeFbPagePostOnMobileBasicVersion(resp.message.accountInfo, resp.message.post)
            }
            else if(resp.action == 'makePost_OnPrivacyChange'){
                await changePrivacyOfPost(resp.message.accountInfo, resp.message.post)
            }
            else if(resp.action == 'makePost_Attachments'){
                await makePost_Attachments(resp.message.accountInfo, resp.message.post);
            }
            else if(resp.action == 'makePagePost_Attachments'){
                await makePagePost_Attachments(resp.message.accountInfo, resp.message.post);
            }
            else if(resp.action == 'makePost_Finalize'){
                let from = accountInfo.id + '@fbperid.socialattache.com';
                await reqSetPostId(accountInfo.id, resp.message.post.Uid, resp.message.post.Uid, from, null);
                window.location.href = "/";
            }
            else if (resp.action == 'getContact') {
                await sleep(4); // we have to wait for the page to load since the background script just set the URL
                let vCard = await getvCardFromFacebookProfileOrPage(resp.contactID);
                await reqSendContact('FacebookScrape', resp.accountID, resp.syncCommandID, vCard);
                delay = timings.INTER_CONTACT_DELAY;
            }
            else if (resp.action == 'getComments') {
                let [comments, cursor, newCurrentCheck] = await getComments(accountInfo, resp.externalPostID,
                    resp.lastCheck, resp.cursor, currentCheck);
                await reqSetComments(accountInfo.id, resp.externalPostID,
                    cursor ? resp.lastCheck : newCurrentCheck, cursor, comments);
                delay = cursor ? 0 : timings.INTER_POST_CHECK_DELAY;
            }
            else if (resp.action == 'Friend') {
                let result = await makeFriend();
                await reqCommandCompleted('FacebookScrape', accountInfo.id, resp.syncCommandID, result);
                delay = timings.INTER_POST_CHECK_DELAY;
            }
            else if (resp.action == 'Unfriend') {
                let result = await unFriendSomeone();
                await reqCommandCompleted('FacebookScrape', accountInfo.id, resp.syncCommandID, result);
                delay = timings.INTER_POST_CHECK_DELAY;
            }
            else if (resp.action == 'GroupAccept') {
                let result = await groupMemberReview('accept', resp.userID, resp.groupID);
                await reqCommandCompleted('FacebookScrape', accountInfo.id, resp.syncCommandID, result);
                delay = timings.INTER_POST_CHECK_DELAY;
            }
            else if (resp.action == 'GroupDecline') {
                let result = await groupMemberReview('decline', resp.userID, resp.groupID);
                await reqCommandCompleted('FacebookScrape', accountInfo.id, resp.syncCommandID, result);
                delay = timings.INTER_POST_CHECK_DELAY;
            }
            else if (resp.action == 'getGroupRequests') {
                let members = await getGroupRequests(accountInfo, resp.groupId, resp.lastCheck, currentCheck);
                if (await reqSetGroupMembers(accountInfo.id, resp.groupId, currentCheck, 'Requests', members))
                    continue;   // no wait, just check again for next action (get answers)
                delay = timings.INTER_GROUP_CHECK_DELAY;
            }
            else if(resp.action == 'getGroupStaff'){
                let members = await getGroupStaff(accountInfo, resp.groupId, resp.lastCheck, currentCheck);
                if (await reqSetGroupMembers(accountInfo.id, resp.groupId, currentCheck, 'Staff', members))
                    continue;   // no wait, just check again for next action (get answers)
                delay = timings.INTER_GROUP_CHECK_DELAY;
            }
            else if(resp.action == 'getGroupMembers'){
                let [members, cursor] = await getGroupMembers(accountInfo, resp.groupId, resp.lastCheck, currentCheck);
                if (await reqSetGroupMembers(accountInfo.id, resp.groupId, cursor ? cursor : currentCheck, 'Members', members))
                    continue;   // no wait, just check again for next action (get answers)
                delay = timings.INTER_GROUP_CHECK_DELAY;
            }
            else if(resp.action == 'getGroupMemberAnswers'){
                let member = await getGroupMemberAnswers(accountInfo, resp.groupMember);
                if (await reqSetGroupMembers(accountInfo.id, resp.groupMember.groupId, currentCheck, 'Answers', [member]))
                    continue;   // no wait, just check again for next action (get next answers)
                delay = timings.INTER_GROUP_CHECK_DELAY;
            }
            else if(resp.action == 'getGroupQuestions'){
                let groupQuestions = await getGroupQuestions(resp.groupId);
                await reqSetGroupQuestions(accountInfo.id, resp.groupId, currentCheck, groupQuestions);
                delay = timings.INTER_POST_CHECK_DELAY;
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
            delay = await handleScraperException('FacebookScrape', e, 'https://' + window.location.host);
        }
        
        try {
            await pingingSleep(delay);
        }
        catch (e) {
            await handleScraperException('FacebookScrape', e, 'https://' + window.location.host);
        }
    }
}

DocumentLoad.AddCallback(function(rootNodes) {
    if (rootNodes.length != 1 || rootNodes[0] != document.body)
        return;     // this only needs to be done once on initial page load
    
    // loopFacebook();
});

