let BackGroundFacebookInit = {
   fetchFBContacts: {},
   contactFetchFBAccountID: null,
   groupMembersNeedingAnswersGroupId: null,
   groupMembersNeedingAnswersCurrentCheck: null,
   groupMembersNeedingAnswers: [],
   skipSendingBasicMessengerMessagesUntil: 0,
   skipSendingAnyMessengerMessagesUntil: 0,
   skipCheckingMessagesUntil: 0
};

function onMessageFacebook(request, sender, sendResponse) {
    Log_WriteInfo('backgroundFacebook got request: ' + request.type);
   
    if (request.type == 'setMessageId') {
        if (isTemporaryTab(sender.tab.id)) { // in the basic case we don't use a temporary tab so we check first
            ActionCheck_Completed('sendMessage');

            Log_WriteInfo('Removing temporary tab ' + sender.tab.id + ' now that message was sent (' +
                (request.externalMessageID == ERROR_EXTERNAL_ID || request.externalMessageID == RETRY_EXTERNAL_ID || request.externalMessageID == LIMITED_EXTERNAL_ID
                ? 'failure' : 'success') + ')');
            Tabs.RemoveTab(sender.tab.id);
        }
        else {
            ActionCheck_Completed('sendBasicMessage');

            // it is important to set a standard URL so that the code in getAction doesn't think we're
            // still processing a message send
            let baseUrl = 'https://www.facebook.com/';
            Tabs.SetTabUrl(sender.tab.id, baseUrl);
        }
   
        let localData = Storage.GetLocalVar('BG_FB', BackGroundFacebookInit);
        
        let now = Date.now();
        if (request.externalMessageID == LIMITED_EXTERNAL_ID) {
            if (localData.skipSendingBasicMessengerMessagesUntil <= now) {
                localData.skipSendingBasicMessengerMessagesUntil = now + timings.BLOCKED_MESSAGE_DELAY * 1000;
                Log_WriteError('Sending via basic messaging is blocked. Switching to regular messaging for a while.')
            }
            else {
                localData.skipSendingAnyMessengerMessagesUntil = now + timings.BLOCKED_MESSAGE_DELAY * 1000;
                Log_WriteError('Sending via regular messaging is blocked. Stop sending messages for a while.')
            }
            
            // don't send LIMITED_EXTERNAL_ID constant to server, it doesn't know about it
            request.externalMessageID = RETRY_EXTERNAL_ID;
        }
        else
        {
           localData.skipSendingAnyMessengerMessagesUntil = now + timings.INTER_MESSAGE_DELAY * 1000;
        }
   
        Storage.SetLocalVar('BG_FB', localData);
        
        let message = {
            'MessageID': request.messageID,
            'ExternalMessageID': request.externalMessageID,
            'From': request.from,
            'ErrorMessage': request.errorMessage
        };
        
        setServerState('FacebookScrape', request.accountID, null, null, [message])
            .then(resp => {
                sendResponse();
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setPostId') {
        ActionCheck_Completed('makePost');

        // DRL FIXIT? This is currently here for testing, remove if not used.
        if (isTemporaryTab(sender.tab.id)) {
            Log_WriteInfo('Removing temporary tab ' + sender.tab.id + ' now that message was sent (' +
                (request.externalMessageID == ERROR_EXTERNAL_ID || request.externalMessageID == RETRY_EXTERNAL_ID || request.externalMessageID == LIMITED_EXTERNAL_ID
                    ? 'failure' : 'success') + ')');
            Tabs.RemoveTab(sender.tab.id);
        }
       
        setServerState('FacebookScrape', request.accountID, null, null,
            [{'MessageID': request.postID, 'ExternalMessageID': request.externalPostID, 'From': request.from}])
            .then(resp => sendResponse())
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setChats') {
        ActionCheck_Completed('getChats');
   
        if (request.urls == null) {  // this indicates that we're being throttled
            Log_WriteInfo('getChats is being throttled!')
           
            let localData = Storage.GetLocalVar('BG_FB', BackGroundFacebookInit);
            
            localData.skipCheckingMessagesUntil = Date.now() + timings.MESSAGES_THROTTLED_DELAY * 1000;
            
            Storage.SetLocalVar('BG_FB', localData);

            sendResponse();
            return;
        }
   
        getServerState('FacebookScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse();
                    return;
                }
         
                let syncData = decodeFacebookSyncData(resp.SyncData);
             
                syncData.messages.currentSync = request.currentCheck;
                syncData.messages.conversationsLeft = request.urls;
                syncData.messages.conversationCursor = null;
             
                let lastCheck = null;
                if (syncData.messages.conversationsLeft.length == 0) {
                    // no conversations, finished this pass
                    lastCheck = Date.now();
                    assert(syncData.messages.currentSync != null);
                    syncData.messages.lastSynced = syncData.messages.currentSync;
                    syncData.messages.currentSync = null;
                }
   
                syncData = encodeFacebookSyncData(syncData);
                
                setServerState('FacebookScrape', request.accountID, lastCheck, syncData, null)
                    .then(resp => {
                        sendResponse();
                    })
                    .catch(e => {
                        Log_WriteException(e, request.type);
                        sendResponse();
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setMessages') {
        // NOTE: request.messages == null means skip conversation
        if (request.messages == null)
            ActionCheck_Aborting();
        else
            ActionCheck_Completed('getMessages');
        getServerState('FacebookScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse(true);
                    return;
                }
         
                let syncData = resp.SyncData;
                assert(syncData && syncData.indexOf('conversationsLeft') != -1);
                syncData = Json_FromString(syncData);
         
                // NOTE: request.messages == null means skip conversation
                if (request.messages != null && syncData.messages.conversationsLeft.length && sender.url != syncData.messages.conversationsLeft[0]) {
                   // saw this happen but not sure the circumstances, we need to retry this conversation I think
                   Log_WriteError('Conversation URL ' + sender.url+ ' doesn\'t match expected ' +
                      syncData.messages.conversationsLeft[0] + ', will try again');
                }
                else if (request.cursor == null) {
                   // we've retrieved all new messages for this conversation so we can remove it from the list to check
                   if (request.messages == null) {
                      Log_WriteError('Conversation URL ' + syncData.messages.conversationsLeft[0] + ' is being skipped!');
                      request.messages = [];
                   }
                   syncData.messages.conversationsLeft.shift();
                   syncData.messages.conversationCursor = null;
                }
                else {
                    // we still have more messages to get from this conversation
                    syncData.messages.conversationCursor = request.cursor;
                }
   
                let hasMoreMessages = request.cursor != null;
                let lastCheck = null;
                if (request.cursor == null && syncData.messages.conversationsLeft.length == 0) {
                    // finished this pass
                    lastCheck = Date.now();
                    assert(syncData.messages.currentSync != null);
                    syncData.messages.lastSynced = syncData.messages.currentSync;
                    syncData.messages.currentSync = null;
                }
   
                syncData = encodeFacebookSyncData(syncData);
   
                startingLongRunningOperation('FacebookScrape');  // processing messages will take a while
   
                setServerState('FacebookScrape', request.accountID, lastCheck, syncData, request.messages)
                    .then(resp => {
                        finishedLongRunningOperation('FacebookScrape');
   
                        // if we have been scraping for too long this is a good time to break out
                        if (getSyncControlDuration('FacebookScrape') > (request.cursor ? timings.SYNC_MAX_SCRAPE_TIME_LONG : timings.SYNC_MAX_SCRAPE_TIME)) {
                            releaseSyncControl(sender.tab.id, 'FacebookScrape');
                        }
                       
                        sendResponse(hasMoreMessages);
                    })
                    .catch(e=> {
                        Log_WriteException(e, request.type);
                        finishedLongRunningOperation('FacebookScrape');
                        sendResponse(true);
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                finishedLongRunningOperation('FacebookScrape');
                sendResponse(true);
            });
    }
    else if (request.type == 'setComments') {
        ActionCheck_Completed('getComments');
        getServerState('FacebookScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse();
                    return;
                }
         
                let syncData = decodeFacebookSyncData(resp.SyncData);

                syncData.watchedPosts[request.externalPostID] = {
                    lastSynced: request.lastSynced,
                    cursor: request.cursor
                };

                // remove posts that are no longer being watched (could include the above)
                let index = {};
                for (const i in resp.watched_posts) {
                    index[resp.watched_posts[i].Uid] = i;
                }
                Utilities_TrimArrayByKey(syncData.watchedPosts, Object.keys(index));
   
                syncData = encodeFacebookSyncData(syncData);
   
                startingLongRunningOperation('FacebookScrape');  // processing comments will take a while
   
                setServerState('FacebookScrape', request.accountID, null, syncData, request.comments)
                    .then(resp => {
                        finishedLongRunningOperation('FacebookScrape');
   
                        // if we have been scraping for too long this is a good time to break out
                        if (getSyncControlDuration('FacebookScrape') > (request.cursor ? timings.SYNC_MAX_SCRAPE_TIME_LONG : timings.SYNC_MAX_SCRAPE_TIME)) {
                            releaseSyncControl(sender.tab.id, 'FacebookScrape');
                        }
                        
                        sendResponse();
                    })
                    .catch(e => {
                        finishedLongRunningOperation('FacebookScrape');
   
                        Log_WriteException(e, request.type);
                        sendResponse();
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'setGroupMembers') {
        ActionCheck_Completed(request.memberType == 'Requests'
            ? 'getGroupRequests'
            : (request.memberType == 'Staff'
               ? 'getGroupStaff'
               : (request.memberType == 'Members'
                 ? 'getGroupMembers'
                 : 'getGroupMemberAnswers')));
        getServerState('FacebookScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse(false);
                    return;
                }

                let syncData = decodeFacebookSyncData(resp.SyncData);
   
                getGroupInfos()
                    .then(groupInfos =>
                    {
                        Log_WriteInfo('Retrieved ' + request.groupMembers.length + ' ' + request.memberType);
   
                        let localData = Storage.GetLocalVar('BG_FB', BackGroundFacebookInit);
                        
                        // add or update the group members
                        if (request.memberType == 'Requests') {
                            syncData.watchedGroupRequestsLastSynced[request.groupId] = request.currentCheck;
                            // remove groups that are no longer being watched (could include the above)
                            Utilities_TrimArrayByKey(syncData.watchedGroupRequestsLastSynced, Object.keys(groupInfos));
                        }
                        else if (request.memberType == 'Staff') {
                            syncData.watchedGroupStaffLastSynced[request.groupId] = request.currentCheck;
                            // remove groups that are no longer being watched (could include the above)
                            Utilities_TrimArrayByKey(syncData.watchedGroupStaffLastSynced, Object.keys(groupInfos));
                        }
                        else if (request.memberType == 'Members') {
                            assert(localData.groupMembersNeedingAnswersGroupId == null);
                            if (request.groupMembers.length > 0 &&
                                groupInfos.hasOwnProperty(request.groupId)) { // ignore if group was removed
                                // for members we need to do a second pass to get the group question answers
                                localData.groupMembersNeedingAnswersGroupId = request.groupId;
                                localData.groupMembersNeedingAnswers = request.groupMembers;
                                assert(Utilities_IsInteger(request.currentCheck));
                                localData.groupMembersNeedingAnswersCurrentCheck = request.currentCheck;
                                request.groupMembers = []; // don't send to server until we have the question answers
                            }
                            else {
                                syncData.watchedGroupMembersLastSynced[request.groupId] = request.currentCheck;
                            }
   
                            // remove groups that are no longer being watched (could include the above)
                            Utilities_TrimArrayByKey(syncData.watchedGroupMembersLastSynced, Object.keys(groupInfos));
                        }
                        else if (request.memberType == 'Answers') {  // second pass for the above
                            for (let groupMember of request.groupMembers) { // should be only one item
                                assert(localData.groupMembersNeedingAnswersGroupId == getEmailPrefix(groupMember.GroupUid));
                                for (let i in localData.groupMembersNeedingAnswers) {
                                    if (groupMember.Uid == localData.groupMembersNeedingAnswers[i].Uid) {
                                        localData.groupMembersNeedingAnswers.splice(i, 1);
                                        break;
                                    }
                                }
                            }
   
                            if (localData.groupMembersNeedingAnswers.length == 0) { // have we retrieved the answers for all the members?
                                assert(localData.groupMembersNeedingAnswersGroupId != null);
                                assert(localData.groupMembersNeedingAnswersCurrentCheck != null);
                                assert(Utilities_IsInteger(localData.groupMembersNeedingAnswersCurrentCheck));
                                syncData.watchedGroupMembersLastSynced[localData.groupMembersNeedingAnswersGroupId] =
                                    localData.groupMembersNeedingAnswersCurrentCheck;
                                localData.groupMembersNeedingAnswersGroupId = null;
                                localData.groupMembersNeedingAnswersCurrentCheck = null;
                            }
   
                            // remove groups that are no longer being watched (could include the above)
                            Utilities_TrimArrayByKey(syncData.watchedGroupMembersLastSynced, Object.keys(groupInfos));
                        }
                        else
                            assert(0);
   
                        Storage.SetLocalVar('BG_FB', localData);
                        
                        syncData = encodeFacebookSyncData(syncData);
   
                        startingLongRunningOperation('FacebookScrape');  // processing members will take a while
                       
                        setServerState('FacebookScrape', request.accountID, null, syncData, null, null, null,
                            request.groupMembers)
                            .then(resp =>
                            {
                                finishedLongRunningOperation('FacebookScrape');
                                
                                sendResponse(localData.groupMembersNeedingAnswersGroupId != null);   // more to do?
                            })
                            .catch(e =>
                            {
                                finishedLongRunningOperation('FacebookScrape');
                                Log_WriteException(e, request.type);
                                sendResponse(false);
                            });
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse(false);
            });
    }
    else if (request.type == 'setGroupQuestions') {
        ActionCheck_Completed('getGroupQuestions');
        getServerState('FacebookScrape', request.accountID, null)
            .then(resp => {
                if (resp == null) {
                    sendResponse();
                    return;
                }
         
                let syncData = decodeFacebookSyncData(resp.SyncData);
         
                getGroupInfos()
                    .then(groupInfos =>
                    {
                        // add or update the group
                        syncData.watchedGroupQuestionsLastSynced[request.groupId] = request.currentCheck;
               
                        // remove posts that are no longer being watched (could include the above)
                        Utilities_TrimArrayByKey(syncData.watchedGroupQuestionsLastSynced, Object.keys(groupInfos));
               
                        syncData = encodeFacebookSyncData(syncData);
               
                        setServerState('FacebookScrape', request.accountID, null, syncData, null, null, null, null,
                            request.groupQuestions)
                           .then(resp =>
                           {
                               sendResponse();
                           })
                           .catch(e =>
                           {
                               Log_WriteException(e, request.type);
                               sendResponse();
                           });
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                sendResponse();
            });
    }
    else if (request.type == 'getAction') {
        if (hasTemporaryTab('FacebookScrape') && !isTemporaryTab(sender.tab.id)) {
            Log_WriteInfo('There is a temporary tab for FacebookScrape and this is not it.');
            sendResponse({action: null});
            return;
        }
        if (!getSyncControl(sender.tab.id, 'FacebookScrape')) {
            sendResponse({action: null});
            ActionCheck_Aborting();
            return;
        }

        let baseUrl = 'https://';
        if (window.location.host == 'web.facebook.com')
            baseUrl += 'web.facebook.com';
        else
            baseUrl += 'www.facebook.com';
   
        let localData = Storage.GetLocalVar('BG_FB', BackGroundFacebookInit);
        
        // retrieving contacts doesn't require any server intervention or account information
        // (actually we may not have the account ID on this page) so we handle it here
        if (initiateContactFetch(sender, 'FacebookScrape', localData.contactFetchFBAccountID, localData.fetchFBContacts,
            baseUrl + '/{contact_id}', sendResponse)) {
            Storage.SetLocalVar('BG_FB', localData);
            return;
        }
        
        if (request.accountID == null) {
            Log_WriteError('We don\'t have a Facebook account ID, loading with base URL!');
            
            // when scraping FB profiles we don't have an account ID from the content so if we
            // get here it's likely we just scraped a profile and now we need to take the tab to
            // a page where we can get an account ID to continue
            // another situation I saw was a Web page that was empty so the page didn't load
            Log_WriteInfo('Switching from ' + sender.url + ' to ' + baseUrl);
            Tabs.SetTabUrl(sender.tab.id, baseUrl);
            return;
        }
        
        getServerState('FacebookScrape', request.accountID, request.accountName)
            .then(resp => {
                if (resp == null) {
                    releaseSyncControl(sender.tab.id, 'FacebookScrape');
                    sendResponse({action: null});
                    return;
                }
                
                if (UserHasFeature(UserFeaturesSyncMessages)) {
                    // we only process the first message, and we'll get any other messages on the next request, 
                    // and sometimes we're not sending messenger messages
                    let message = null;
                    for (let i = 0; i < resp.messages.length; i++) {
                        if (resp.messages[i].Type != 'fbp_msg' || Date.now() >= localData.skipSendingAnyMessengerMessagesUntil) {
                            message = resp.messages[i];
                            break;
                        }
                    }
                   
                    if (message == null) {
                        // nothing to send
                    }
                    else if (message.Type == 'fbp_msg') {
                        let params = {
                            Origin: baseUrl,
                            // extract just the numeric user ID OR the username from our "fake email" format of
                            // "Some Name <userid@fbperid.socialattache.com>" OR "Some Name <username@fbun.socialattache.com>"
                            ConversationID: getEmailPrefix(message.To[0]),
                            AccountID: request.accountID
                        };
                        
                        // DRL FIXIT! At this point we need a fbperid/fbpage in order to use the basic method!
                        // We need to find a way to convert a fbun into a fbperid! One way would be to navigate to the
                        // profile on mbasic and then click the message button there, but isn't there an easier way?
                        if ((message.To[0].indexOf('@fbperid') != -1 || message.To[0].indexOf('@fbpage') != -1 || message.To[0].indexOf('@fbrmid') != -1) &&
                           // basic method can only handle 3 attachments max and doesn't support video
                           (message.Attachments == null ||
                               (message.Attachments.length <= 3 && !Utilities_CheckIfAttachmentsHaveVideos(message.Attachments))) &&
                           // if we have been blocked on the basic method, switch to the normal method for a while
                           Date.now() >= localData.skipSendingBasicMessengerMessagesUntil) {
                           let url = null;
                           if (message.To[0].indexOf('@fbrmid') != -1)
                              url = buildUrl(constantPaths.Facebook.basicSendMessengerRoomMsg, params);
                           else
                              url = buildUrl(constantPaths.Facebook.basicSendMessengerMsg, params);
                           if (sender.url == url)
                           {
                              ActionCheck_SendResponse(url, sendResponse, {
                                 action: 'sendBasicMessage',
                                 message: message});
                              return;
                           }
                           else {
                              ActionCheck_SetUrl('sendBasicMessage', sender, url);
                           }
                        }else{
                           let url = buildUrl(constantPaths.Facebook.sendMessengerMsg, params);
                           if (isTemporaryTab(sender.tab.id) && sender.url == url) {
                              ActionCheck_SendResponse(url, sendResponse, {
                                 action: 'sendMessage',
                                 message: message});
                              return;
                           }

                           if (!hasTemporaryTab('FacebookScrape')) {
                              // we create a new tab to handle this message, we do this to get around FB trying to
                              // prevent sending a message using scraping, but if we use a new window this works,
                              // I believe because the document element is given the focus
                              createTab('FacebookScrape', 'GET', url, {}, true, true)
                                  .then(resp => {
                                      sendResponse({action: null});
                                  })
                                  .catch(e => {
                                      Log_WriteException(e, request.type);
                                      sendResponse({action: null});
                                  });
                              return;
                           }
                        }

                        // we don't want the main scraper tab doing anything while another is sending a message
                        sendResponse({action: null});
                        return;
                    }
                    else if (message.Type == 'fbp_post') {
                        // DRL FIXIT! Here we should be checking that the box ID matches the account ID for
                        // sending to the personal feed, and we should be adding support to post to a page!
                        let isGroupPost = message.MessageBoxUid.indexOf('@fbgroup.socialattache.com') != -1;
                        let isPagePost = message.MessageBoxUid.indexOf('@fbpage.socialattache.com') != -1;
                        let url = isGroupPost 
                            ? "https://www.facebook.com/groups/" + getEmailPrefix(message.MessageBoxUid)
                            : isPagePost ? "https://mbasic.facebook.com/"+getEmailPrefix(message.MessageBoxUid) 
                            :"https://mbasic.facebook.com/";
if (true) { // DRL This is the original code...
   
                        if (fuzzyUrlsMatch(sender.url, url)) {
                            // DRL FIXIT? Can we safely reduce the time?
                            showSyncWindowAndTab(sender.tab.id, 15, constants.MINIMUM_TAB_WIDTH);
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'makePost',
                                post: message});
                        }
                        else {
                           ActionCheck_SetUrl('makePost', sender, url);
                        }

} else { // DRL Tried to use a pop-up for focus but it doesn't seem to work either...

                        if (isTemporaryTab(sender.tab.id) && fuzzyUrlsMatch(sender.url, url)) {
                            sendResponse({ action: 'makePost', post: message });
                            return;
                        }
   
                        if (!hasTemporaryTab('FacebookScrape')) {
                            // we create a new tab to handle this post, we do this to get around FB trying to
                            // prevent sending a post using scraping, but if we use a new window this works,
                            // I believe because the document element is given the focus
                            createTab('FacebookScrape', 'GET', url, {}, true, true)
                                .then(resp => {
                                    sendResponse({action: null});
                                })
                                .catch(e => {
                                    Log_WriteException(e, request.type);
                                    sendResponse({action: null});
                                });
                            return;
                        }

                        assert(0);  // should never happen because we check above and also farther above for all cases
}
                        // we don't want the main scraper tab doing anything while another is sending a message
                        sendResponse({action: null});
                        return;
                    }
                    else {
                        Log_WriteError("Unexpected Facebook message type " + message.Type);
                    }
                }
 
                 // if the sender tab is one of our temporary tabs for sending a message/post we can close it now
                if (isTemporaryTab(sender.tab.id)) {
                    Log_WriteError('Closing temporary message/post send tab ' + sender.tab.id + ', should have been closed!');
                    Tabs.RemoveTab(sender.tab.id);
                    return;
                }
   
                localData.contactFetchFBAccountID = resp.AccountID;
                if (parseContactFetches(resp.commands, localData.fetchFBContacts, sendResponse)) {
                    Storage.SetLocalVar('BG_FB', localData);
                    return;
                }
   
                if (UserHasFeature(UserFeaturesFriendUnfriend) && Object.keys(resp.commands).length > 0) {
                    for (const id in resp.commands) {
                        let command = resp.commands[id];
                        if (command.SyncCommand == 'Friend' || command.SyncCommand == 'Unfriend') {
                            let url = "https://www.facebook.com/" + getEmailPrefix(command.ExternalContactID);
                            if (fuzzyUrlsMatch(sender.url, url)) {
                                ActionCheck_SendResponse(url, sendResponse, {
                                    action: command.SyncCommand,
                                    syncCommandID: command.SyncCommandID});
                            }
                            else {
                                ActionCheck_SetUrl(command.SyncCommand, sender, url);
                            }
                            return;
                        }
                    }
                }
   
                if (UserHasFeature(UserFeaturesGroupAcceptDecline) && Object.keys(resp.commands).length > 0) {
                    for (const id in resp.commands) {
                        let command = resp.commands[id];
                        if (command.SyncCommand == 'GroupAccept' || command.SyncCommand == 'GroupDecline') {
                            let url = "https://www.facebook.com/groups/" +
                            getEmailPrefix(command.ExternalCommunityGroupID) + '/member-requests';
                            if (fuzzyUrlsMatch(sender.url, url)) {
                                ActionCheck_SendResponse(url, sendResponse, {
                                    action: command.SyncCommand,
                                    syncCommandID: command.SyncCommandID,
                                    userID: command.ExternalContactID,
                                    groupID: command.ExternalCommunityGroupID})
                            }
                            else {
                                ActionCheck_SetUrl(command.SyncCommand, sender, url);
                            }
                            return;
                        }
                    }
                }

                let syncData = decodeFacebookSyncData(resp.SyncData);

                getGroupInfos()
                    .then(groupInfos => {
                    // =================================================
                    // Get the times that each action was last performed
                  
                    let now = Date.now();
                    let actions = {};
                    let lastUrl = ActionCheck_GetUrl();
                   
                    if (UserHasFeature(UserFeaturesSyncMessages) &&
                        // we aren't waiting for throttling to end
                        now >= localData.skipCheckingMessagesUntil &&
                        // it's time to scrape again
                        now - syncData.messages.lastSynced >= timings.MESSAGES_SCRAPE_DELAY * 1000) {
                        actions['Messages'] = {
                            lastSynced: syncData.messages.lastSynced
                        };
                    }
      
                    // find the post we should be working on, either the last one we started working on or the one
                    // that has not been checked for the longest time
                    // NOTE: we are not saving this back to the server here, the new items will be added and saved
                    // back to the server when we handle the comments that are retrieved
                    if (UserHasFeature(UserFeaturesWatchedPosts)) {
                        let postUid = null;
                        let postUrl = null;
                        for (const i in resp.watched_posts) {
                            let uid = resp.watched_posts[i].Uid;
            
                            if (!syncData.watchedPosts.hasOwnProperty(uid))
                                syncData.watchedPosts[uid] = {
                                    lastSynced: 0,
                                    cursor: 0
                                };
   
                            if (postUid == null || syncData.watchedPosts[uid].lastSynced < syncData.watchedPosts[postUid].lastSynced) {
                                postUid = uid;
                                postUrl = resp.watched_posts[i].Url;
                                assert(postUrl != null); // the URL was null below so trying to track this down

                               // a post that hasn't finished parsing takes precedence because we've cached
                               // the unparsed bits in the client for efficiency (as long as the page wasn't
                               // reloaded)
                               if (resp.watched_posts[i].Url == lastUrl) {
                                  Log_WriteInfo('URL still points to post ' + uid + ' so resuming...');
                                  break;   // finished searching
                               }
                            }
                        }
                        if (postUid && now - syncData.watchedPosts[postUid].lastSynced >= timings.WATCHED_POSTS_CHECK_DELAY * 1000)
                            actions['WatchedPosts'] = {
                                lastSynced: syncData.watchedPosts[postUid].lastSynced,
                                postUid: postUid,
                                postUrl: postUrl
                            };
                    }
      
                    // find the group we should be working on, either the last one we started working on or the one
                    // that has not been checked for the longest time
                    // NOTE: we are not saving this back to the server here, the new items will be added and saved
                    // back to the server when we handle the items that are retrieved
                    if (UserHasFeature(UserFeaturesFacebookGroupAutomation)) {
                       
                        // NOTE: Order of the below is important!
                       
                        let groupId = null;
                        for (const id in groupInfos) {
                            if (!groupInfos[id].IsAdmin)
                                continue;  // we only import group questions from groups the user administers
      
                            if (!syncData.watchedGroupQuestionsLastSynced.hasOwnProperty(id))
                                syncData.watchedGroupQuestionsLastSynced[id] = 0;
      
                            if (groupId == null || syncData.watchedGroupQuestionsLastSynced[id] < syncData.watchedGroupQuestionsLastSynced[groupId]) {
                                groupId = id;
                            }
                        }
                        if (groupId && now - syncData.watchedGroupQuestionsLastSynced[groupId] >= timings.WATCHED_GROUP_QUESTIONS_DELAY * 1000) {
                            actions['WatchedGroupQuestions'] = {
                                lastSynced: syncData.watchedGroupQuestionsLastSynced[groupId],
                                groupId: groupId
                            };
                        }
                        
                        groupId = null;
                        for (const id in groupInfos) {
                            if (!groupInfos[id].IsAdmin || !groupInfos[id].ImportMembers)
                                continue;  // we only import group members from groups the user administers and that have automation configured
      
                            if (!syncData.watchedGroupStaffLastSynced.hasOwnProperty(id))
                                syncData.watchedGroupStaffLastSynced[id] = 0;
      
                            if (groupId == null || syncData.watchedGroupStaffLastSynced[id] < syncData.watchedGroupStaffLastSynced[groupId]) {
                                groupId = id;
                            }
                        }
                        if (groupId && now - syncData.watchedGroupStaffLastSynced[groupId] >= timings.WATCHED_GROUP_STAFF_DELAY * 1000) {
                            actions['WatchedGroupStaff'] = {
                                lastSynced: syncData.watchedGroupStaffLastSynced[groupId],
                                groupId: groupId
                            };
                        }
   
                        groupId = null;
                        for (const id in groupInfos) {
                            if (!groupInfos[id].IsAdmin || !groupInfos[id].ImportMembers)
                                continue;  // we only import group members from groups the user administers and that have automation configured
   
                            if (!syncData.watchedGroupRequestsLastSynced.hasOwnProperty(id))
                                syncData.watchedGroupRequestsLastSynced[id] = 0;
                         
                            if (!Utilities_IsInteger(syncData.watchedGroupRequestsLastSynced[id])) {
                                Log_WriteError('last synced of group ' + id + ' requests was non-numeric: ' + syncData.watchedGroupRequestsLastSynced[id]);
                                assert(Utilities_IsInteger(now));
                                syncData.watchedGroupRequestsLastSynced[id] = now;
                            }
   
                            if (groupId == null || syncData.watchedGroupRequestsLastSynced[id] < syncData.watchedGroupRequestsLastSynced[groupId]) {
                                groupId = id;
                            }
                        }
                        if (groupId && now - syncData.watchedGroupRequestsLastSynced[groupId] >= timings.WATCHED_GROUP_REQUESTS_DELAY * 1000) {
                            actions['WatchedGroupRequests'] = {
                                lastSynced: syncData.watchedGroupRequestsLastSynced[groupId],
                                groupId: groupId
                            };
                        }
   
                        groupId = null;
                        if (localData.groupMembersNeedingAnswersGroupId) {
                            if (!groupInfos.hasOwnProperty(localData.groupMembersNeedingAnswersGroupId)) {
                                Log_WriteInfo('Group ' + localData.groupMembersNeedingAnswersGroupId + ' has been removed, aborting getting answers to group questions');
                                localData.groupMembersNeedingAnswersGroupId = null;
                                localData.groupMembersNeedingAnswersCurrentCheck = null;
                                localData.groupMembersNeedingAnswers = [];
                            }
                            else {
                                // continue with the group we were working on
                                groupId = localData.groupMembersNeedingAnswersGroupId;

                                // new group wouldn't be in the list yet
                                if (!syncData.watchedGroupMembersLastSynced.hasOwnProperty(groupId))
                                    syncData.watchedGroupMembersLastSynced[groupId] = 0;
   
                               Log_WriteInfo('Continuing with group ' + groupId + ' to get answers to group questions');
                            }
                        }
                        else {
                            for (const id in groupInfos) {
                                if (!groupInfos[id].IsAdmin || !groupInfos[id].ImportMembers)
                                    continue;  // we only import group members from groups the user administers and that have automation configured
   
                                if (!syncData.watchedGroupMembersLastSynced.hasOwnProperty(id))
                                    syncData.watchedGroupMembersLastSynced[id] = 0;
   
                                if (groupId == null || syncData.watchedGroupMembersLastSynced[id] < syncData.watchedGroupMembersLastSynced[groupId])
                                {
                                    groupId = id;
                                }
                            }
                        }
                        if (groupId && now - syncData.watchedGroupMembersLastSynced[groupId] >= timings.WATCHED_GROUP_MEMBERS_DELAY * 1000) {
                            if (localData.groupMembersNeedingAnswers.length > 0) {
                                // we have questions needing to be imported as a second pass
                                assert(localData.groupMembersNeedingAnswersGroupId == groupId);
                                actions['WatchedGroupMemberAnswers'] = {
                                    lastSynced: syncData.watchedGroupMembersLastSynced[groupId],
                                    groupMember: localData.groupMembersNeedingAnswers[0]
                                };
                            }
                            else {
                                assert(localData.groupMembersNeedingAnswersGroupId == null);
                                actions['WatchedGroupMembers'] = {
                                    lastSynced: syncData.watchedGroupMembersLastSynced[groupId],
                                    groupId: groupId
                                };
                            }
                        }
                    }
   
                    Storage.SetLocalVar('BG_FB', localData);
                    
                    // =================================================
                    // Decide which action should run next so they all get a turn
                    
                    let action = { action: null, lastSynced: now };
                    for (const i in actions) {
                        if (actions[i].lastSynced < action.lastSynced) {
                            action = actions[i];
                            action.action = i;
                        }
                    }
   
                    // =================================================
                    // Messages import
      
                    if (action.action == 'Messages') {
                        if (syncData.messages.currentSync == null) {
                            // start of new sync

                            assert(syncData.messages.lastSynced != null);
                            if (sender.url.startsWith(baseUrl + '/messages/t/') && ActionCheck_OK(sender)) {
                                ActionCheck_SendResponse(sender.url, sendResponse, {
                                   action: 'getChats',
                                   lastCheck: syncData.messages.lastSynced });
                            }
                            else if (ActionCheck_OK(sender)) {
                                // when we get blocked it looks like we can get around it by providing an ID
                                let url = baseUrl + '/messages/t/' + Utilities_IntRand(10000, 1000000);
                                ActionCheck_SetUrl('getChats', sender, url);
                            }
                            else {
                               Log_WriteInfo('Setting URL for getChats is failing!')
                               localData.skipCheckingMessagesUntil = Date.now() + timings.MESSAGES_THROTTLED_DELAY * 1000;
                               Storage.SetLocalVar('BG_FB', localData);
                            }
                        }
                        else {
                            let url = syncData.messages.conversationsLeft[0];
                            if (sender.url == url && ActionCheck_OK(sender)) {
                                // continue where we left off

                                assert(syncData.messages.currentSync != null);
                                let lastSynced = syncData.messages.lastSynced;
                                let cursor = syncData.messages.conversationCursor;
                                ActionCheck_SendResponse(url, sendResponse, {
                                    action: 'getMessages',
                                    lastCheck: cursor ? cursor : lastSynced,
                                    currentCheck: syncData.messages.currentSync});
                            }
                            else if (ActionCheck_OK(sender)) {
                                ActionCheck_SetUrl('getMessages', sender, url);
                            }
                            else {
                                // the conversation has been removed, or for some reason we're in a processing loop, skip it
                                Log_WriteError('Skipping conversation as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                                sendResponse({action: 'skipConversation', currentCheck: syncData.messages.currentSync});
                            }
                        }
                        return;
                    }
      
                    // =================================================
                    // Post comments import
      
                    if (action.action == 'WatchedPosts') {
                        let postUid = action.postUid;
                        let url = action.postUrl;
                        if (sender.url == url && ActionCheck_OK(sender)) {
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'getComments',
                                externalPostID: postUid,
                                lastCheck: action.lastSynced,
                                cursor: syncData.watchedPosts[postUid].cursor
                            });
                            return;
                        }
                        else if (ActionCheck_OK(sender)) {
                            ActionCheck_SetUrl('getComments', sender, url);
                            return;
                        }
                        else {
                            // DRL FIXIT? We need better handling here, such as flagging this item on the server?
                            
                            // the item is not available, skip it for a day (just in case it's a temporary issue)
                            Log_WriteError('Skipping post ' + postUid + ' as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                            ActionCheck_Aborting();
                            syncData.watchedPosts[postUid].lastSynced = now + (SecondsPerDay * 1000);
                            syncData.watchedPosts[postUid].cursor = 0;
                        }
                    }
   
                    // =================================================
                    // Group join requests import
                    
                    if (action.action == 'WatchedGroupRequests') {
                        let url = buildUrl(constantPaths.Facebook.watchedGroupRequests, {groupId: action.groupId});
                        if (sender.url == url && ActionCheck_OK(sender)) {
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'getGroupRequests',
                                groupId: action.groupId,
                                lastCheck: action.lastSynced
                            });
                            return;
                        } else if (ActionCheck_OK(sender)) {
                            ActionCheck_SetUrl('getGroupRequests', sender, url);
                            return;
                        } else {
                            // DRL FIXIT? We need better handling here, such as flagging this item on the server?
   
                            // the item is not available, skip it for a day (just in case it's a temporary issue)
                            Log_WriteError('Skipping group ' + action.groupId + ' for group requests handling as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                            ActionCheck_Aborting();
                            syncData.watchedGroupRequestsLastSynced[action.groupId] = now + (SecondsPerDay * 1000);
                        }
                    }
   
                    // =================================================
                    // Group staff import

                    if (action.action == 'WatchedGroupStaff') {
                        let url = buildUrl(constantPaths.Facebook.watchedGroupStaff, {groupId: action.groupId});
                        if (sender.url == url && ActionCheck_OK(sender)) {
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'getGroupStaff',
                                groupId: action.groupId,
                                lastCheck: action.lastSynced
                            });
                            return;
                        } else if (ActionCheck_GetUrl () != url && ActionCheck_OK(sender)) {
                            ActionCheck_SetUrl('getGroupStaff', sender, url);
                            return;
                        } else {
                            // DRL FIXIT? We need better handling here, such as flagging this item on the server?
      
                            // the item is not available, skip it for a day (just in case it's a temporary issue)
                            if (sender.url.indexOf('should_open_welcome_member_composer') !== -1)  // not a group admin?
                                Log_WriteWarning('Skipping group ' + action.groupId + ' for group staff handling as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                            else
                                Log_WriteError('Skipping group ' + action.groupId + ' for group staff handling as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                            ActionCheck_Aborting();
                            syncData.watchedGroupStaffLastSynced[action.groupId] = now + (SecondsPerDay * 1000);
                        }
                    }
   
                    // =================================================
                    // Group members import

                    if (action.action == 'WatchedGroupMembers') {
                        let url = buildUrl(constantPaths.Facebook.watchedGroupMembers, {groupId: action.groupId});
                        if (sender.url == url && ActionCheck_OK(sender)) {
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'getGroupMembers',
                                groupId: action.groupId,
                                lastCheck: action.lastSynced
                            });
                           return;
                        } else if (ActionCheck_OK(sender, 'should_open_welcome_member_composer')) {
                            ActionCheck_SetUrl('getGroupMembers', sender, url);
                            return;
                        } else {
                            // DRL FIXIT? We need better handling here, such as flagging this item on the server?
      
                            // the item is not available, skip it for a day (just in case it's a temporary issue)
                            if (sender.url.indexOf('should_open_welcome_member_composer') !== -1)  // not a group admin?
                                Log_WriteWarning('Skipping group ' + action.groupId + ' for group members handling as the URL ' + url + ' went to ' + sender.url);
                            else
                                Log_WriteError('Skipping group ' + action.groupId + ' for group members handling as the URL ' + url + ' went to ' + sender.url);
                            ActionCheck_Aborting();
                            assert(Utilities_IsInteger(now + (SecondsPerDay * 1000)));
                            syncData.watchedGroupMembersLastSynced[action.groupId] = now + (SecondsPerDay * 1000);
                        }
                    }
   
                    // =================================================
                    // Group member import - second pass (answers)
   
                    if (action.action == 'WatchedGroupMemberAnswers') {
                        let url = buildUrl(constantPaths.Facebook.watchedGroupMemberAnswers, {
                            groupId: getEmailPrefix(action.groupMember.GroupUid),
                            userId: action.groupMember.UserId   // this was saved for us since Uid is the username style ID
                        });
                        if (sender.url == url && ActionCheck_OK(sender)) {
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'getGroupMemberAnswers',
                                groupMember: action.groupMember
                            });
                            return;
                        } else if (ActionCheck_OK(sender)) {
                            ActionCheck_SetUrl('getGroupMemberAnswers', sender, url);
                            return;
                        } else {
                            // DRL FIXIT? We need better handling here, such as flagging this item on the server?
                            // I get here when visiting https://www.facebook.com/groups/702826986773274/user/403093716788396
                            // which may be because the user is actually a page??
                            Log_WriteError('Skipping group ' + action.groupMember.GroupUid + ' member ' + action.groupMember.Uid + ' for group member answers handling as the URL ' + url + ' went to ' + sender.url);
                            ActionCheck_Aborting();
                            assert(localData.groupMembersNeedingAnswers[0].Uid == action.groupMember.Uid);
                            localData.groupMembersNeedingAnswers.splice(0, 1);
                            if (localData.groupMembersNeedingAnswers.length == 0) {
                                // no more items in second pass
                                assert(localData.groupMembersNeedingAnswersGroupId != null);
                                assert(localData.groupMembersNeedingAnswersCurrentCheck != null);
                                assert(Utilities_IsInteger(localData.groupMembersNeedingAnswersCurrentCheck));
                                syncData.watchedGroupMembersLastSynced[localData.groupMembersNeedingAnswersGroupId] =
                                   localData.groupMembersNeedingAnswersCurrentCheck;
                                localData.groupMembersNeedingAnswersGroupId = null;
                                localData.groupMembersNeedingAnswersCurrentCheck = null;

                                Storage.SetLocalVar('BG_FB', localData);
                            }
                        }
                    }
   
                    // =================================================
                    // Group questions import

                    if (action.action == 'WatchedGroupQuestions') {
                        let url = buildUrl(constantPaths.Facebook.watchedGroupQuestions, {groupId: action.groupId});
                        if (sender.url == url && ActionCheck_OK(sender)) {
                            ActionCheck_SendResponse(url, sendResponse, {
                                action: 'getGroupQuestions',
                                groupId: action.groupId,
                                lastCheck: action.lastSynced
                            });
                            return;
                        } else if (ActionCheck_OK(sender)) {
                            ActionCheck_SetUrl('getGroupQuestions', sender, url);
                            return;
                        } else {
                            // DRL FIXIT? We need better handling here, such as flagging this item on the server?
      
                            // the item is not available, skip it for a day (just in case it's a temporary issue)
                            if (sender.url.indexOf('should_open_welcome_member_composer') !== -1)  // not a group admin?
                                Log_WriteWarning('Skipping group ' + action.groupId + ' for group questions handling as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                            else
                                Log_WriteError('Skipping group ' + action.groupId + ' for group questions handling as tried "' + url + '" and was sent to "' + sender.url + '" instead.');
                            ActionCheck_Aborting();
                            syncData.watchedGroupQuestionsLastSynced[action.groupId] = now + (SecondsPerDay * 1000);
                        }
                    }

                    // =================================================
                    // Save the state to the server
   
                    syncData = encodeFacebookSyncData(syncData);
   
                    setServerState('FacebookScrape', request.accountID, null, syncData, null)
                        .then(resp => {
                            releaseSyncControl(sender.tab.id, 'FacebookScrape');
                            sendResponse({action: null});
                        })
                        .catch(e => {
                            Log_WriteException(e, request.type);
                            releaseSyncControl(sender.tab.id, 'FacebookScrape');
                            sendResponse({action: null});
                        });
                    });
            })
            .catch(e => {
                Log_WriteException(e, request.type);
                releaseSyncControl(sender.tab.id, 'FacebookScrape');
                sendResponse({action: null});
            });
    }
    else {
        Log_WriteError("Got unrecognized request:\n" + GetVariableAsString(request));
    }
}

function encodeFacebookSyncData(syncData) {
   assert(typeof syncData !== 'string'); // must not already be encoded
   return Json_ToString(syncData);
}

function decodeFacebookSyncData(syncData) {
   assert(syncData == null || typeof syncData === 'string'); // must be encoded
   let data = syncData ? Json_FromString(syncData) : null;
   if (data == null) {
      if (syncData) {
         Log_WriteError('Error deserializing sync data: ' + syncData);
      }
      data = {
         messages: {
            lastSynced: getLatestSyncTimestamp(),
            currentSync: null,
            conversationsLeft: [],
            conversationCursor: null
         },
      };
   }
   
   // migrate legacy data by adding missing pieces
   if (!data.hasOwnProperty('watchedPosts')) data['watchedPosts'] = {};
   if (!data.hasOwnProperty('watchedGroupRequestsLastSynced')) data['watchedGroupRequestsLastSynced'] = {};
   if (!data.hasOwnProperty('watchedGroupStaffLastSynced')) data['watchedGroupStaffLastSynced'] = {};
   if (!data.hasOwnProperty('watchedGroupMembersLastSynced')) data['watchedGroupMembersLastSynced'] = {};
   if (!data.hasOwnProperty('watchedGroupQuestionsLastSynced')) data['watchedGroupQuestionsLastSynced'] = {};
   
   return data;
}
