function massageFacebookPage(contactInfos, groupInfos, helpItems) {
    let found = false;
/*
    let dataName = 'FacebookScrape';

    let accountInfo = getFacebookAccountInfo();
    if(accountInfo == null){
        assert(0);
        return;
    }
    let accountID = accountInfo.id;
*/
    
    removeOldMassaging(contactInfos);
    
    //START Deals with Facebook profile page
    if (!location.pathname.startsWith('/groups/') && !location.pathname.startsWith('/search/')) {
        // Facebook profile page
        let address = getAddressFromFacebookProfileOrPageUrl(window.location.href);
        //FIXIT The facebookProfileActions still not specific enough
        let elems = findElements(srchPathPG('facebookProfileActions'), ':not(.SA_augmented)');

        // DRL FIXIT? For a profile page should we just use the first match instead of all of them?
        forEach(elems, function(elem) {
            const [icon, label, classes] = contactIconAndLabel(contactInfos, 'fbp', address, 'contact_open', true);
            const [iconImport, labelImport, classesImport] = contactIconAndLabel(contactInfos, 'fbp', address, 'contact_import', true);
            
            classes.push('SA_augmented');
            Class_AddByElement(elem, classes);

            let options;
            let protoAddress = normalizeContactAddress('fbp:' + address);

            if (contactInfos.hasOwnProperty(protoAddress)) {
                options = [
                    {
                        //contact_open
                        label: label,
                        icon: icon,
                        cmd: function() {
                            DisplayMessage(Str('Loading...'), 'busy', null, 5);
                            DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'fbp', 'IsMessagingView', '0');
                        }
                    },
                    {
                        //contact_import
                        label: labelImport,
                        icon: iconImport,
                        cmd: function() {
                            DisplayMessage(Str('Getting profile...'), 'busy');
                            getvCardFromFacebookProfileOrPage(null)
                               .then(vCard => {
                                   reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                                       'FormProcessor': 'ContactResolver',
                                       'vCard': vCard,
                                       'ReferralUrl': contactsPageUrl(),
                                       'ByWhom': Str('one-click import from Facebook')
                                   });
                                   ClearMessage();
                               })
                               .catch(e => {
                                   Log_WriteException(e);
                                   DisplayMessage(Str('Error parsing profile!'), 'error');
                               });
                        }
                    }
                ];
            }else{
                options = [{
                    label: label,
                    icon: icon,
                    cmd: function() {
                        DisplayMessage(Str('Getting profile...'), 'busy');
                        getvCardFromFacebookProfileOrPage(null)
                           .then(vCard => {
                               reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                                   'FormProcessor': 'ContactResolver',
                                   'vCard': vCard,
                                   'ReferralUrl': contactsPageUrl(),
                                   'ByWhom': Str('one-click import from Facebook')
                               });
                               ClearMessage();
                           })
                           .catch(e => {
                               Log_WriteException(e);
                               DisplayMessage(Str('Error parsing profile!'), 'error');
                           });
                    }
                }];
            }

            for (let item of _handlePopUpHelp(helpItems, 'Chrome Extension/Facebook Profile'))
            {
                options.push(item);
            }

            let menu = dropDownMenu(options, constantStyles.Pages.Facebook.dropdownProfileActions, NULL,
               {triggerButtonImgStyles: constantStyles.Pages.Facebook.dropdownProfileActionsImg});
            //contactIconHtml(contactInfos, 'fbp', address, 'contact_open', true);
            elem.insertBefore(menu, elem.firstChild)
            found = true;
        });
    }
    //END Deals with Facebook profile page

    //START Deals with  Facebook Saved Posts
    if(window.location.pathname.includes('/saved')) {
        // Facebook Saved Posts
        let elems = findElements(srchPathPG('savedPostActionsContainerFB'), ':not(.SA_augmented)');
        forEach(elems, async (elem) => {
            let isAnAllowedDropdownActionSavedPost = await checkIfSavedPostIsAnActionAllowedPostFromSavedPostActionContainer(elem)
            if(!isAnAllowedDropdownActionSavedPost){
                return null;
            }
            Class_AddByElement(elem, 'SA_augmented');

            let options = [
                {
                    label: 'Download to Post Library',
                    icon: 'DownloadDk.svg',
                    cmd: function() {
                        scrapeSelectedFacebookPostFromSavedPage(elem, 'downloadToPostsLibrary');
                    }
                },
                {
                    label: 'Open in Publishing Calendar',
                    icon: 'ResourceSchedulerDk.svg',
                    cmd: function() {
                        scrapeSelectedFacebookPostFromSavedPage(elem, 'openInPublishingCalendar');
                    }
                },
                {
                    label: 'Add or Remove Automation',
                    icon: 'AutomationDk.svg',
                    cmd: function() {
                        scrapeSelectedFacebookPostFromSavedPage(elem, 'addOrRemoveAutomation');
                    }
                }
            ];

            let menu = dropDownMenu(options, constantStyles.Pages.Facebook.savedPostActionsDropdown);

            let appendTo = findElement(srchPathPG('savedPostActionsContainer'), null, elem)

            // we use the parent node because the current node is a link
            appendTo.appendChild(menu);
            found = true;
        });
/* DRL FIXIT? I'm not sure when this code is needed as it seems to create duplicate buttons to the above. If it is needed we'll
    have to add scraping of the ID and body on this page to pass on as is done for the above.
        elems = findElements(srchPathPG('savedPostActionsCollectionFB'), ':not(.SA_augmented)');
        forEach(elems, async (elem) => {
            let isAnAllowedDropdownActionSavedPost = await checkIfSavedPostIsAnActionAllowedPostFromSavedPostActionContainer(elem)
            if(!isAnAllowedDropdownActionSavedPost){
                return null;
            }

            Class_AddByElement(elem, 'SA_augmented');

            let options = [
                {
                    label: 'Download to Post Library',
                    icon: 'DownloadDk.svg',
                    cmd: function() {
                        scrapePostHrefViaPostedTimeLink(findElement(srchPathPG('savedPostActionsCollectionPermanentLinkFB'), null, elem), 'downloadToPostsLibrary')
                    }
                },
                {
                    label: 'Open in Publishing Calendar',
                    icon: 'ResourceSchedulerDk.svg',
                    cmd: function() {
                        scrapePostHrefViaPostedTimeLink(findElement(srchPathPG('savedPostActionsCollectionPermanentLinkFB'), null, elem), 'openInPublishingCalendar')
                    }
                },
                {
                    label: 'Add or Remove Automation',
                    icon: 'AutomationDk.svg',
                    cmd: function() {
                        scrapePostHrefViaPostedTimeLink(findElement(srchPathPG('savedPostActionsCollectionPermanentLinkFB'), null, elem), 'addOrRemoveAutomation')
                    }
                }
            ];

            let menu = dropDownMenu(options, constantStyles.Pages.Facebook.savedPostActionsDropdown);

            let appendTo = findElement(srchPathPG('savedPostActionsCollectionAppendMenuToFB'), null, elem)

            // we use the parent node because the current node is a link
            appendTo.appendChild(menu);
            found = true;
        });
*/
    }
    //END Deals with Facebook Saved Posts

    //START Deals with Facebook General Posts
    if(!window.location.pathname.includes('permalink')
        && !window.location.pathname.includes('watch')
        && !window.location.pathname.includes('posts')
        && !window.location.pathname.includes('videos')) {
        // Facebook General Posts
        let elems = findElements(srchPathPG('postMenuItem'), ':not(.SA_augmented)');
        forEach(elems, function (elem) {
            Class_AddByElement(elem, 'SA_augmented');
            let options = [
                {
                    label: 'Download to Post Library',
                    icon: 'DownloadDk.svg',
                    cmd: function () {
                        checkPostAvailableScrapingMethodAndScrape(elem, 'downloadToPostsLibrary')
                    }
                },
                {
                    label: 'Open in Publishing Calendar',
                    icon: 'ResourceSchedulerDk.svg',
                    cmd: function () {
                        checkPostAvailableScrapingMethodAndScrape(elem, 'openInPublishingCalendar');
                    }
                },
                {
                    label: 'Add or Remove Automation',
                    icon: 'AutomationDk.svg',
                    cmd: function () {
                        checkPostAvailableScrapingMethodAndScrape(elem, 'addOrRemoveAutomation');
                    }
                }
            ];

            let menu = dropDownMenu(options,null, null, {orientation: 'right'});

            // we use the parent node because the current node is a link
            elem.parentNode.appendChild(menu);
            found = true;
        });
    }
    //END Deals with Facebook General Posts

    //START Deals with Facebook Posts
    if(window.location.href.includes("/watch/live/?ref=watch_permalink&v=") || window.location.href.includes("/watch/?ref=saved")){
        let elems = findElements(srchPathPG('postMenuItem'), ':not(.SA_augmented)');
        forEach(elems, function(elem) {
            Class_AddByElement(elem, 'SA_augmented');

            let options = [
                {
                    label: 'Download to Posts Library',
                    icon: 'DownloadDk.svg',
                    cmd: function() {
                        scrapeFacebookPostFromRegularPage(elem, 'downloadToPostsLibrary');
                    }
                },
                {
                    label: 'Open in Publishing Calendar',
                    icon: 'ResourceSchedulerDk.svg',
                    cmd: function() {
                        scrapeFacebookPostFromRegularPage(elem, 'openInPublishingCalendar');
                    }
                },
                {
                    label: 'Add or Remove Automation',
                    icon: 'AutomationDk.svg',
                    cmd: function() {
                        scrapeFacebookPostFromRegularPage(elem, 'addOrRemoveAutomation');
                    }
                }
            ];

            let menu = dropDownMenu(options, null, null, {orientation: 'right'});

            // we use the parent node because the current node is a link
            elem.parentNode.appendChild(menu);
            found = true;
        });
    }else{
        // Facebook Post Page
        let elems = findElements(srchPathPG('postMenuItem'), ':not(.SA_augmented)');
        // DRL FIXIT! The above returns 4 items in my case and it should never return more than one. In order to
        // work around this I've put a "continue" at the top of the loop below which we'll want to keep for safety.
        if (elems.length > 1)
            Log_WriteWarning('The postMenuItem selector is returning ' + elems.length + ' matches on page ' + window.location.href);
        for (let elem of elems) {
            Class_AddByElement(elem, 'SA_augmented');

            if (elem != elems[0])
                continue;

            let options = [
                {
                    label: 'Download to Post Library',
                    icon: 'DownloadDk.svg',
                    cmd: function() {
                        scrapeFacebookPostFromRegularPage(elem, 'downloadToPostsLibrary');
                    }
                },
                {
                    label: 'Open in Publishing Calendar',
                    icon: 'ResourceSchedulerDk.svg',
                    cmd: function() {
                        scrapeFacebookPostFromRegularPage(elem, 'openInPublishingCalendar');
                    }
                },
                {
                    label: 'Add or Remove Automation',
                    icon: 'AutomationDk.svg',
                    cmd: function() {
                        scrapeFacebookPostFromRegularPage(elem, 'addOrRemoveAutomation');
                    }
                }
            ];

            let menu = dropDownMenu(options);

            // we use the parent node because the current node is a link
            elem.parentNode.appendChild(menu);
            found = true;
        }
    }
    //END Deals with Facebook Posts
    
    //START Deals with Facebook Groups
    if (location.pathname.startsWith('/groups/')) {
        // for now we only automate groups that have been imported into the DB (i.e. owned by the user)
        let groupUid = location.pathname.split('/').at(-1);
        if (!Utilities_IsInteger(groupUid)) {
            // the URL contains a "handle" instead of a UID so we fetch the UID from the page
            let elems = findElements('SCRIPT');
            for (let elem of elems)
            {
                let text = elem.innerText;
                // DRL FIXIT? Perhaps we should JSON.parse() the text like we do for Pinterest to avoid errors with our parsing below?
                if (text.includes('groupID'))
                {
                    try
                    {
                        groupUid = text.split('"groupID":"')[1].split('"')[0];
                    }
                    catch (e)
                    {
                        // split fails if the content is unexpected
                    }
                    break;
                }
            }
        }

        let elems = [];
        if (groupInfos.hasOwnProperty(groupUid) && UserHasFeature(UserFeaturesFacebookGroupAutomation))
            elems = findElements(srchPathPG('groupTitleFB'), ':not(.SA_augmented)');
        forEach(elems, function(elem) {
            Class_AddByElement(elem, 'SA_augmented');
            let options = [
                {
                    label: 'Add or Remove Automation',
                    icon: 'AutomationDk.svg',
                    cmd:
                        async function () {
                            DisplayMessage(Str('Loading...'), 'busy', null, 5);
                            DisplayEmbeddedItemForm('ResourceAutomationsEdit', 'ResourceID', groupInfos[groupUid].ResourceID);
                        }
                },
                {
                    label: 'Manage Notifications',
                    icon: 'WatcherDk.svg',
                    cmd:
                       async function () {
                           DisplayMessage(Str('Loading...'), 'busy', null, 5);
                           DisplayEmbeddedItemForm('ResourceNotificationsEdit', 'ResourceID', groupInfos[groupUid].ResourceID);
                       }
                }
            ];
    
            let menu = dropDownMenu(options, {top: 8, position: "relative"});
    
            elem.insertBefore(menu, elem.firstChild);
            found = true;
        })
/*
        if(window.location.href.includes('SA_getGroupQuestions')){
            scrapeGroupInfo(dataName);
        }else if(window.location.href.includes('SA_finishScraping')){
            history.pushState({}, null, window.location.href.replace('?action=SA_finishScraping', ''));
            scrapeGroupInfo(dataName);
        }
*/
    }
    //END Deals with Facebook Groups
    
    // the pop-up box shown when you hover over someone's name
    let elems = findElements(srchPathPG('personCardFB'), ':not(.SA_augmented)');
    forEach(elems, function (elem) {
        let url = findElement(srchPathPG('personCardFBProfileURL'), null, elem);
        let name = findElement(srchPathPG('personCardFBName'), null, elem);
        let address = getAddressFromFacebookProfilePageOrGroupUrl(url);
        const [icon, label, classes] = contactIconAndLabel(contactInfos, 'fbp', address, 'contact_open', true);
        const [iconImport, labelImport, classesImport] = contactIconAndLabel(contactInfos, 'fbp', address, 'contact_import', true);
    
        classes.push('SA_augmented');
        Class_AddByElement(elem, classes);
    
        let buttonRow = findElement(srchPathPG('personCardFBButtonRow'), null, elem);
        if (buttonRow == null) {
            Log_WriteError('Selector not found for personCardFBButtonRow at url ' + window.location.href);
            return;
        }
        let options;
        let protoAddress = normalizeContactAddress('fbp:' + address);
        
        if (contactInfos.hasOwnProperty(protoAddress)) {
            options = [
                {
                    //contact_open
                    label: label,
                    icon: icon,
                    cmd: function() {
                        DisplayMessage(Str('Loading...'), 'busy', null, 5);
                        DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'fbp', 'IsMessagingView', '0');
                    }
                },
                {
                    //contact_import
                    label: labelImport,
                    icon: iconImport,
                    cmd: async function() {
                        let vCard = await getvCardFromNameAndAddress(name, 'facebook', 'fbp', address);
                        reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                            'FormProcessor': 'ContactResolver',
                            'vCard': vCard,
                            'ReferralUrl': contactsPageUrl(),
                            'ByWhom': Str('one-click import from Facebook')
                        });
                    }
                }
            ];
        }else{
            options = [{
                label: label,
                icon: icon,
                cmd: async function() {
                    let vCard = await getvCardFromNameAndAddress(name, 'facebook', 'fbp', address);
                    reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                        'FormProcessor': 'ContactResolver',
                        'vCard': vCard,
                        'ReferralUrl': contactsPageUrl(),
                        'ByWhom': Str('one-click import from Facebook')
                    });
                }
            }];
        }
        
        for (let item of _handlePopUpHelp(helpItems, 'Chrome Extension/Facebook Profile'))
        {
            options.push(item);
        }
        
        let menu = dropDownMenu(options, constantStyles.Pages.Facebook.dropdownPersonCardActions, NULL,
           {triggerButtonImgStyles: constantStyles.Pages.Facebook.dropdownPersonCardActionsImg});
        //contactIconHtml(contactInfos, 'fbp', address, 'contact_open', true);
        buttonRow.insertBefore(menu, buttonRow.firstChild)
        found = true;
    });
    
    return found;
}
/*
async function scrapeGroupInfo(dataName) {
    let state = await reqGetPushedState()
    if(state == null){
        let groupInfo = {
            Uid: 'fbp:' + window.location.href.split('/')[4] + '@fbgroup.socialattache.com',
            Type: 'fb_group',
            Name: document.querySelector(srchPathFBG2('groupName')).innerText,
            Url: srchPathFBG2('groupUrlPrefix') + window.location.href.split('/')[4],
        }
        reqPushState(JSON.stringify(groupInfo))
        window.location.href = "https://www.facebook.com/groups/"+groupInfo.Uid.replace('@fbgroup.socialattache.com','')+"/membership_questions?action=SA_getGroupQuestions"
    }else if(window.location.href.includes('?action=SA_getGroupQuestions')){
        history.pushState({}, null, window.location.href.replace('?action=SA_getGroupQuestions', ''));
        let groupInfo = JSON.parse(state);

        let questions = findElements(srchPathPG('facebookGroupQuestions'))

        let parsedQuestions = []

        for (let i = 0; i < questions.length; i++){
            let typeElement = findElement(srchPathPG('facebookGroupQuestionsTypeElement'), null, questions[i])
            if(typeElement === 'Write your answer...'){
                typeElement = 'string'
                parsedQuestions.push({
                    Label: findElement(srchPathPG('facebookGroupQuestionsLabel'), null, questions[i]),
                    Type: typeElement,
                })
            }else{
                typeElement = 'list'
                let optionsElements = Array.from(findElement(srchPathPG('facebookGroupQuestionOptionElements'), null, questions[i]))
                let options = []
                for (let j in optionsElements){
                    options.push(findElement(srchPathPG('facebookGroupQuestionsOptionElementInnerText'), null, optionsElements[j]))
                }
                parsedQuestions.push({
                    Label: findElement(srchPathPG('facebookGroupQuestionsOptionElementLabel'), null, questions[i]),
                    Type: typeElement,
                    Options: options
                })
            }
        }
        groupInfo.Questions = parsedQuestions;
        //Do what ever I need to do here and go back
        reqPushState(JSON.stringify(groupInfo))
        window.location.href = "https://www.facebook.com/groups/"+groupInfo.Uid.replace('@fbgroup.socialattache.com','')+"?action=SA_finishScraping"
    }else{
        let groupInfo = JSON.parse(state);
        reqSendPost(dataName, groupInfo)
           .then(function (result) {
               ClearMessage();
               if (result) {
                   DisplayEmbeddedItemForm('WatchedGroupEdit', 'DataName', dataName,
                      'ExternalGroupID', groupInfo.Uid);
               }
           })
           .catch(e => {
               Log_WriteException(e);
               DisplayMessage(Str('Error sending post!'), 'error');
           });
    }
}
*/

// action is string
async function scrapeFacebookPostFromRegularPage(elem, action)
{
    assert(elem != null);
    assert(typeof action === 'string' || action instanceof String);

    // this is a request directly from the menu, so we've been given the element and
    // the action for it and we're on the correct page for scraping it
    assert(elem != null);
    action = {
        originalTabID: null,
        action: 'scrapeFacebookPost',
        nextAction: action,
        savedPostInfo: null
    };
    return scrapeFacebookPost(elem, action);
}

async function scrapeFacebookSavedPostBasics(elem) {
    // use the first one (the last saved one), and again the page might not be fully loaded, so wait
    let postUrl = await waitForElement(srchPathPG('savedPostHref'), 5, elem);
    
    // for some posts (video and live) when we open the individual post page we don't have access
    // to the post author so we get it here and pass it on
    let authorUrl = findElement(srchPathPG('savedPostAuthorURL'), null, elem);
    let authorName = findElement(srchPathPG('savedPostAuthorName'), null, elem);

    // DRL FIXIT! What we have here is a URL to the post, and NOT to the author, but we don't have
    // the author in some cases when parsing the post so we'll use this as the next best thing!
    // DRL FIXIT! The next problem is that often what we have here is the group/page friendly name instead
    // of an ID, so it would be good to convert it to at least provide an accurate ID!
    let authorID = getAddressFromFacebookProfilePageOrGroupUrl(authorUrl);
    if (authorID)
        authorID = authorName + ' <' + authorID + '>';

    let postBody = findElement(srchPathPG('savedPostBody'), null, elem);
    
    return {
        authorID: authorID,
        postBody: postBody
    };
}

// action is string
async function scrapeSelectedFacebookPostFromSavedPage(elem, action) {
    assert(elem != null);
    assert(typeof action === 'string' || action instanceof String);
    assert(window.location.pathname.includes('/saved'));
    
    // Facebook Saved Posts, need to open the post to do the scraping
    
    // the page might not be fully loaded, so wait
    let postUrl = await waitForElement(srchPathPG('savedPostHref'), 5, elem);
    
    // we will create a new tab to scrape the saved post, and it will handle the action
    reqCreateTab(null, 'GET', postUrl, {}, false, [{
        originalTabID: BACKGROUND_PROVIDED_TAB_ID,  // bit of a hack to avoid a round trip to get it
        action: 'scrapeFacebookPost',               // this is the first thing the new tab will do
        nextAction: action,                         // this is the second thing the new tab will do
        savedPostInfo: await scrapeFacebookSavedPostBasics(elem)
    }]);
}

// action is an object
async function scrapeFirstFacebookPostFromSavedPage(action) {
    assert(!(typeof action === 'string' || action instanceof String));
    assert(window.location.pathname.includes('/saved'));

    // Facebook Saved Posts, need to open the post to do the scraping
    DisplayMessage(Str('Going to post...'), 'busy');
    
    let elem = await waitForElement(srchPathPG('savedPostActionsContainerFB'));
    if (elem == null) {
        // queue the message for the original tab
        reqPushDisplayMessage(action.originalTabID, Str('Post not found!'), 'error')
            .then(function(){
                if (action.originalTabID != null)
                    reqRemoveTab();
            })
            .catch(e => { Log_WriteException(e); throw e; });
        return;
    }
    
    // the page might not be fully loaded, so wait
    let postUrl = await waitForElement(srchPathPG('savedPostHref'), 5, elem);
    
    // DRL FIXIT! At this point we should be un-saving the post!
    
    // we're already in a new tab, push the action so it comes back to us on the correct
    // page after the reload, and scrape the post then
    action.action = 'scrapeFacebookPost';
    action.savedPostInfo = await scrapeFacebookSavedPostBasics(elem);
    
    reqPushAction(null, action)
        .then(resp => {
            window.location.href = postUrl;
        })
        .catch(e => { Log_WriteException(e); });
    await sleep(10);    // let's make sure nothing more is done on this page while it reloads (like loading the action we just pushed)
}

// elem is null for a page hosting a single post
// action is object
async function scrapeFacebookPost(elem, action) {
    assert(!(typeof action === 'string' || action instanceof String));
    
    // at this point we must be viewing a post or a saved version of a post
    DisplayMessage(Str('Getting post...'), 'busy');

    let dontWarnAboutAttachments = action.nextAction == 'addOrRemoveAutomation';
    getPostFromFacebook(elem, dontWarnAboutAttachments, action.savedPostInfo)
        .then(post =>
        {
            reqSendPost('FacebookScrape', post)
                .then(function (result)
                {
                    if (!result) {
                        reqPushDisplayMessage(action.originalTabID, Str('Error sending post!'), 'error')
                            .then(function() {
                                if (action.originalTabID != null)
                                    reqRemoveTab();
                            })
                            .catch(e => { Log_WriteException(e); throw e; });
                        return;
                    }
                    
                    if (action.nextAction == 'downloadToPostsLibrary') {
                        reqPushDisplayMessage(action.originalTabID, Str('Loading form...'), 'busy', null, 5)
                            .then(function() {
                                return reqPushDisplayEmbeddedItemForm(action.originalTabID, 'CuratePostEdit', 'DataName', 'FacebookScrape',
                                   'Type', post.Type, 'ExternalPostID', post.Uid);
                            })
                            .then(function() {
                                if (action.originalTabID != null)
                                    reqRemoveTab();
                            })
                            .catch(e => { Log_WriteException(e); throw e; });
                    }
                    else if (action.nextAction == 'openInPublishingCalendar') {
                        reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                            'FormProcessor': 'PostEdit',
                            'DataName': 'FacebookScrape',
                            'Type': post.Type,
                            'ExternalPostID': post.Uid,
                            'ReferralUrl': publisherPageUrl()
                        })
                        .then(function() {
                            if (action.originalTabID != null)
                                reqRemoveTab();
                        })
                    }
                    else if (action.nextAction == 'addOrRemoveAutomation') {
                        reqPushDisplayMessage(action.originalTabID, Str('Loading form...'), 'busy', null, 5)
                            .then(function() {
                                return reqPushDisplayEmbeddedItemForm(action.originalTabID, 'WatchedPostEdit', 'DataName', 'FacebookScrape',
                                   'Type', post.Type, 'ExternalPostID', post.Uid);
                            })
                            .then(function() {
                                if (action.originalTabID != null)
                                    reqRemoveTab();
                            })
                            .catch(e => { Log_WriteException(e); throw e; });
                    }
                    else {
                        Log_WriteError('Unrecognized action: ' + action.nextAction);
                        reqPushDisplayMessage(action.originalTabID, Str('Error handling post!'), 'error')
                            .then(function() {
                                if (action.originalTabID != null)
                                    reqRemoveTab();
                            })
                            .catch(e => { Log_WriteException(e); throw e; });
                    }
                })
                .catch(e =>
                {
                    Log_WriteException(e);
                    DisplayMessage(Str('Error sending post!'), 'error');
                });
            })
        .catch(e => {
            Log_WriteException(e);
            reqPushDisplayMessage(action.originalTabID, Str('Error handling post!'), 'error')
                .then(function() {
                    if (action.originalTabID != null)
                        reqRemoveTab();
                })
                .catch(e => { Log_WriteException(e); /*throw e;*/ });
        });
}
