function srchPathPoFB(item) {
    return srchPath('PostsFacebook', item);
}

async function getPostFromFacebook(elem, dontWarnAboutAttachments, action) {
    if (window.location.href.match(/facebook.com\/[^\/]+\/videos\/[0-9]+/g) ||
        window.location.href.match(/facebook.com\/watch\/live\//g)){
        return getPostFromFacebookVideoOrLivePage(dontWarnAboutAttachments, action);
    }

    if (elem == null) {
        // this is the saved post case where we've gone to the actual individual post for scraping
        elem = await waitForElement(srchPathPG('postAuthorFB'));  // the page might not be loaded yet so wait
    }
    if (!elem) {
        Log_WriteError('Post author not found at: ' + window.location.href);
        throw new Error("Unsupported Facebook post");
    }
    
    let authorName = findElement(srchPathPoFB('postAuthorName'), null, elem);
    let authorID = await getAddressFromFacebookProfilePageOrGroup(findElement(srchPathPoFB('postAuthorURL'), null, elem));
    if (authorID)
        authorID = authorName + ' <' + authorID + '>';
    
    let body = '';
    let images = [];
    let video = null;
    
    let wrapper = findElement(srchPathPoFB('postWrapperFromAuthor'), null, elem);
    
    let temp = findElement(srchPathPoFB('postSeeMore'), null, wrapper);
    if (temp != null) {
        temp.click();
        await sleep(1);
    }
    
    let temps = findElements(srchPathPoFB('postImages'), null, wrapper);
    for (let i = 0; i < temps.length; i++) {
        if (temps[i].alt != undefined) {
            if (body.length > 0)
                body += "\r\n";
            body += temps[i].alt;
        }
        images.push(temps[i].src);
    }
    
    // DRL FIXIT! In order to get the video we need to work around Facebooks attempts at hiding it. We can do
    // it by getting "Enlarge" link and swapping ""www.facebook.com" with "m.facebook.com" and loading that in
    // an iframe, and from there we can extract the video URL from a div with the data-store attribute containing
    // JSON with a "src" item with the MP4 URL.
    video = findElement(srchPathPoFB('postVideo'), null, wrapper);
    
    // DRL FIXIT? Is there sometimes a "see more" button?
    body = findElement(srchPathPoFB('postBody'), null, wrapper);
    
    // getting dynamically (by click event simulation) the post URL

    let postUrl = window.location.href;

    // DRL FIXIT? Do we want to do this after getFinalUrl() below?
    let postID = getPostIdFromFacebookUrl(postUrl);
    if (postID == null)
        throw new Error("Unsupported Facebook post");
    postID = postID + '@fbp_post.socialattache.com';
    
    // the URL could be an intermediate, and we need the final URL
    postUrl = await getFinalUrl(postUrl);
    
    // DRL FIXIT! Need to get the date! It's available on text posts for sure.
    let date = Date.now();
    
    return createPostObject('fbp_post', postID, authorID, date, body, images, video, postUrl, null, dontWarnAboutAttachments);
}

// this is for parsing a video or live post sitting on its own page, and is used for automation so we don't get
// all the fields, some of which aren't available anyways
async function getPostFromFacebookVideoOrLivePage(dontWarnAboutAttachments, savedPostInfo) {
    let postUrl = window.location.href;
    let date = Date.now();   // DRL FIXIT?
    let images = [];
    let video = null;   // we don't support videos now anyways
    
    assert(savedPostInfo != null);
    
    // these were parsed form the saved posts page since we don't have them here
    let authorID = savedPostInfo.authorID;
    let body = savedPostInfo.postBody;
    
    let postID = null;
    if (postUrl.match(/facebook.com\/[^\/]+\/videos\/[0-9]+/g)) {
        postID = postUrl.match(/videos\/[0-9]+/)[0].replace('videos/','');
    }
    else if (postUrl.match(/facebook.com\/watch\/live\//g)) {
        postID = Url_GetParam(postUrl, 'v')
    }
    else
        assert(0);
    
    assert(Utilities_IsInteger(postID));
    postID = postID + '@fbp_post.socialattache.com';
    
    return createPostObject('fbp_post', postID, authorID, date, body, images, video, postUrl, null, dontWarnAboutAttachments);
}

async function addPostToSavedAndScrape(element, action) {
    assert(action != null);
    
    DisplayMessage(Str('Saving post...'), 'busy');
    
    // here we loop twice in case we don't find the "done" button because if the post
    // was already saved this code would "unsave" it so then we have to save it again,
    // and this behavior is desireable because we need this post to be the last saved one
    let buttonSaveElement = null;
    for (let i = 0; buttonSaveElement == null && i < 2; i++) {
        let buttonElement = null;
        if(i == 1 && findElement(srchPathFBP('actionsDialog')) == null){
            buttonElement = findElement(srchPathFBP("articleActionsButton"), null, element);
            if (buttonElement == null){
                DisplayMessage("This post is not supported", 'error');
                Log_WriteError("articleActionsButton not found!");
                return;
            }
            buttonElement.click()
        }
        
        // if we find the "unsave" option we'll unsave and then save it again a it has to
        // be the first item in the saved list
        buttonSaveElement = await waitForElement(srchPathFBP("articleSave"), 2)
        let buttonUnsaveElement = await waitForElement(srchPathFBP("articleUnsave"), 2)
        if(buttonSaveElement == null && buttonUnsaveElement == null){
            DisplayMessage("This post is not supported", 'error');
            return;
        }
        if (buttonSaveElement)
            buttonSaveElement.click()
        else if (i == 0)
            buttonUnsaveElement.click()
        else {
            DisplayMessage("This post is not supported", 'error');
            Log_WriteError("articleSave not found!");
            return;
        }
        
        // with a menu we'll get a notice (click has no effect) and with a dialog it has to be closed
        let buttonDone = await waitForElement(srchPathFBP("articleSaveDone"), 3)
        if (buttonSaveElement && buttonDone == null) {
            DisplayMessage("This post is not supported", 'error');
            Log_WriteError("articleSaveDone not found!");
            return;
        }
        if (buttonDone)
            buttonDone.click()
    }
    
    DisplayMessage(Str('Going to saved post...'), 'busy');
    
    // it looks like if we don't wait a bit here the new tab can get to the page before the post does
    await sleep(2);
    
    // we will create a new tab to scrape the saved post, and it will handle the action
    reqCreateTab(null, 'GET', constantPaths.Facebook.savedPostsPage, {}, false, [{
        originalTabID: BACKGROUND_PROVIDED_TAB_ID,      // bit of a hack to avoid a round trip to get it
        action: 'scrapeFirstFacebookPostFromSavedPage', // this is the first thing the new tab will do
        nextAction: action                              // this is the second thing the new tab will do
    }]);
}

async function checkPostAvailableScrapingMethodAndScrape(elem, action){
    DisplayMessage(Str("Checking post..."), 'busy');
    
    let postContainer = findElement(srchPathFBP('postContainerForCheckingAvailableScrapingMethod'), null, elem)
    
    let postActionsBoxButton = findElement(srchPathFBP('postActionsBoxBtnForCheckingAvailableScrapingMethod'), null, postContainer)
    postActionsBoxButton.click()
    
    let postActionsBox = await waitForElement(srchPathFBP('postActionsBoxForCheckingAvailableScrapingMethod'));
    
    //Primary Method for scraping posts (Done over saving)
    let postCanBeScrapedOverSaving = await checkIfPostCanBeSavedForScraping(postActionsBox, postContainer)
    if(postCanBeScrapedOverSaving){
        addPostToSavedAndScrape(elem.closest(srchPathFBP('article')), action)
        return;
    }
    
    //2º Method for scraping posts (Done over Embed box)
    let postCanBeScrapedOverEmbed = await checkIfPostCanBeScrapedViaEmbed(postActionsBox)
    if(postCanBeScrapedOverEmbed){
        scrapingViaEmbed(postActionsBox, action);
        return;
    }
    postActionsBoxButton.click()
    //3º Method for scraping posts (Done over image tag <a> href)
    let postCanBeSavedByImageAHref = await checkIfPostCanBeSavedByImageAHref(postContainer)
    if(postCanBeSavedByImageAHref) {
        scrapePostByImageAHref(postContainer, action);
        return;
    }
    //4º Method for scraping posts (Done over share button to retrieve the href)
    let canRetrievePostHrefViaShareButton = await checkIfCanRetrievePostHrefViaShareButton(postContainer)
    if(canRetrievePostHrefViaShareButton) {
        scrapePostByShareButtonAHref(canRetrievePostHrefViaShareButton, action);
        return;
    }
    //5º Method for scraping posts (Done over postedTime href)
    let canRetrievePostHrefViaPostedTimeLink = await checkIfRetrievePostHrefViaPostedTimeLink(postContainer)
    if(canRetrievePostHrefViaPostedTimeLink) {
        scrapePostHrefViaPostedTimeLink(canRetrievePostHrefViaPostedTimeLink, action);
        return;
    }
    
    DisplayMessage(Str("Sorry, we don't support this post at the moment."), 'error', null, 5);
}

async function checkIfRetrievePostHrefViaPostedTimeLink(postContainer){
    let postedTimeLink = findElement(srchPathFBP('postHrefViaPostedTimeLink'), null, postContainer)
    if(postedTimeLink == null){
        return false;
    }
    return postedTimeLink;
}
async function scrapePostHrefViaPostedTimeLink(postHref, action){
    reqCreateTab(null, 'GET', postHref, {}, false, [{
        originalTabID: BACKGROUND_PROVIDED_TAB_ID,  // bit of a hack to avoid a round trip to get it
        action: 'scrapeFacebookPost',               // this is the first thing the new tab will do
        nextAction: action
    }]);
}

async function checkIfCanRetrievePostHrefViaShareButton(postContainer){
    let postShareButton = findElement(srchPathFBP('postShareButton'), null, postContainer)
    if(postShareButton == null){
        return false;
    }
    postShareButton.click()
    let copyLinkButton = await waitForElement(srchPathFBP('postShareDialogCopyLinkButton'), 2);
    if(copyLinkButton == null){
        postShareButton.click()
        return false;
    }
    copyLinkButton.click()
    await waitForElement(srchPathFBP('postShareDialogCopyConfirmationBox'))
    let href = false;
    for (let i = 0; !href || i < 5; i++){
        let testHref = MyClipboard.GetClipboardText();
        if(testHref.includes('facebook.com')){
            href = testHref
            break;
        }
        await sleep(1)
    }
    postShareButton.click()
    return href;
}
async function scrapePostByShareButtonAHref(postHref, action){
    reqCreateTab(null, 'GET', postHref, {}, false, [{
        originalTabID: BACKGROUND_PROVIDED_TAB_ID,  // bit of a hack to avoid a round trip to get it
        action: 'scrapeFacebookPost',               // this is the first thing the new tab will do
        nextAction: action
    }]);
}

async function checkIfPostCanBeSavedByImageAHref(postContainer){
    let postHref = findElement(srchPathFBP('checkImagePostHref'), null, postContainer)
    if(postHref == null){
        return false;
    }
    if(postHref.includes('facebook.com/photo')){
        return true;
    }
    return false;
}
async function scrapePostByImageAHref(postContainer, action){
    let postHref = findElement(srchPathFBP('imagePostHref'), null, postContainer)
    if(!postHref.includes('facebook.com/photo')){
        return null;
    }
    
    reqCreateTab(null, 'GET', postHref, {}, false, [{
        originalTabID: BACKGROUND_PROVIDED_TAB_ID,  // bit of a hack to avoid a round trip to get it
        action: 'scrapeFacebookPost',               // this is the first thing the new tab will do
        nextAction: action
    }]);
}

async function checkIfPostCanBeSavedForScraping(postActionsBox, postContainer) {
    let result = false;
    
    //Videos who have youtube.com/videocode or youtu.be/videocode inside the text or in the post
    //itself when the save video happens does redirect to the youtube instead of the post page,
    //should use a different scraping method than saving
    if(postContainer.innerHTML.includes('youtube.com') || postContainer.innerHTML.includes('youtu.be')){
        return false;
    }
    let postActionsBoxActionButtons = findElements(srchPathFBP('postActionBoxActionButtonsForScrapingViaSaving'), null, postActionsBox)
    //Checking if exists there
    if(postActionsBoxActionButtons != null && postActionsBoxActionButtons.length > 0){
        result = true;
    }
    return result;
}

async function checkIfPostCanBeScrapedViaEmbed(postActionsBox){
    let result = false;
    let postActionsBoxActionButtons = findElements(srchPathFBP('checkPostActionBoxActionButtonsForScrapingViaEmbed'), null, postActionsBox)
    //Checking if exists there
    if(postActionsBoxActionButtons != null && postActionsBoxActionButtons.length > 0){
        result = true;
    }
    return result;
}

async function scrapingViaEmbed(postActionsBox, action){
    let postActionsBoxActionButtons = findElement(srchPathFBP('postActionBoxActionButtonsForScrapingViaEmbed'), null, postActionsBox)
    
    postActionsBoxActionButtons.click()
    
    let postHref = await waitForElement(srchPathFBP('postHrefScrapingVieEmbed'));
    postHref = decodeURIComponent(postHref)
    
    let closeEmbedDialogBtn = findElement(srchPathFBP('closeEmbedDialogButton'))
    closeEmbedDialogBtn.click()
    
    reqCreateTab(null, 'GET', postHref, {}, false, [{
        originalTabID: BACKGROUND_PROVIDED_TAB_ID,  // bit of a hack to avoid a round trip to get it
        action: 'scrapeFacebookPost',               // this is the first thing the new tab will do
        nextAction: action
    }]);
}

async function checkIfSavedPostIsAnActionAllowedPostFromSavedPostActionContainer(element) {
    let selectors = srchPathFBP('savedPostTypeContainerParentPost');
    if(!Array.isArray(selectors)){
        selectors = [selectors]
    }
    let queryGetParentResult = null;
    await forEach(selectors, (querySelector) => {
        let resElement = Utilities_GetParentBySelector(element, querySelector)
        if(resElement != null){
            queryGetParentResult = resElement;
        }
    })
    if(queryGetParentResult == null){
        return false;
    }
    element = queryGetParentResult
    return checkIfSavedPostIsAnActionAllowedPost(element)
}
async function checkIfSavedPostIsAnActionAllowedPost(element){
    let result = false;
    
    // DRL FIXIT? This code should be using our findElement(s) functions, and I expect that all of this code
    // could be replaced with a selector that looks for the post types and checks if there are any matching elements.
    
    let selectors = srchPathFBP('savedPostTypeContainer')
    if(!Array.isArray(selectors)){
        selectors = [selectors]
    }
    await forEach(selectors, (querySelector) => {
        let typeContainer = findElement(querySelector, null, element)
        let allowedTypesOfPost = srchPathFBP('allowedSavedPostsFormatToExecuteAction');
        if(!Array.isArray(allowedTypesOfPost)){
            allowedTypesOfPost = [allowedTypesOfPost]
        }
        for (let allowedTypeOfPost of allowedTypesOfPost){
            if(typeContainer.innerHTML.includes(allowedTypeOfPost)){
                result = true;
            }
        }
    })
    return result;
}

