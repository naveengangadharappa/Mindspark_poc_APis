function getWebsiteContactProtocol() {
    let domain = window.location.hostname;
    
    if (domain.indexOf('messenger') != -1 || domain.indexOf('facebook') != -1)
        return 'fbp';
    if (domain.indexOf('instagram') != -1)
        return 'ig';
    if (domain.indexOf('pinterest') != -1)
        return 'pint';
    if (domain.indexOf('tiktok') != -1)
        return 'tt';
    if (domain.indexOf('twitter') != -1)
        return 'twit';
    if (domain.indexOf('google') != -1 || domain.indexOf('outlook') != -1)
        return 'mailto';
    Log_WriteError('No protocol for page URL: ' + domain);
    return null;
}

Log_WriteInfo("XXX ContentScriptAugmentation.js");

async function loopAug() {
    console.log(DateAndTime_Now() + " loopAug()");    // this is here so we can click on it in the console for easier debugging ;-)

    if (!await contentScriptInit(null))
        return;

//    let pageLoadTime = Date.now();
    
    while (true) {
        let delay = timings.UI_RECHECK_DELAY;
    
        try
        {
            // DRL FIXIT? Not sure about this, and if we should have it here why not in the other content scripts as well?
            if (Browser.IsExtension() && chrome.extension == undefined)
                location.reload();  // background script unloaded or reloaded
    
            let isLoggedInToBackOffice = true;
    
            let resp = await reqGetAction(null, null);
            if (resp.action == 'displayMessage') {
                DisplayMessage(resp.message, resp.messageType, resp.displayType, resp.timeoutSeconds, resp.icon);
                continue;   // check right away for another action
            }
            // all other actions require to be logged in to back office
            else if (!isLoggedInToBackOffice) {
                await sleep(delay);
                continue;
            }
            else if (resp.action == 'displayEmbeddedItemForm') {
                DisplayEmbeddedItemForm(resp.form, resp.params[0], resp.params[1], resp.params[2], resp.params[3],
                   resp.params[4], resp.params[5], resp.params[6], resp.params[7], resp.params[8], resp.params[9],
                   resp.params[10], resp.params[11], resp.params[12], resp.params[13], resp.params[14], resp.params[15]);
                continue;   // check right away for another action
            }
            else if (resp.action == 'downloadTwitterPost') {
                await downloadTwitterPost(resp);
                continue;   // check right away for another action
            }
            else if (resp.action == 'scrapeFirstFacebookPostFromSavedPage') {
                await scrapeFirstFacebookPostFromSavedPage(resp);
                continue;   // check right away for another action
            }
            else if (resp.action == 'scrapeFacebookPost') {
                await scrapeFacebookPost(null, resp);
                continue;   // check right away for another action
            }
            else if (resp.action != null)
                Log_WriteError("Unrecognized action: " + resp.action);
    
            let url = location.protocol + '//' + location.host + location.pathname

// DRL This is annoying when the user is watching a video for example so we need to rework this.
//            // we periodically reload the page (when idle) in order to incorporate any changes that may have occurred
//            // for example new profiles that have been loaded or tasks created that affect the icons we display
//            if (await reqIsBrowserTabIdle() && Date.now() - pageLoadTime > timings.AUGMENTATION_PAGE_RELOAD_FREQUENCY * 1000) {
//                Log_WriteInfo('Reloading idle tab at ' + url + ' to get latest changes');
//                location.reload();
//            }
    
            let contactInfos = {};
            let helpItems = await reqGetHelpItems();
        
            let facebookLoggedIn = false;
            let instagramLoggedIn = false;
            let pinterestLoggedIn = false;
            let tikTokLoggedIn = false;
            let twitterLoggedIn = false;
            let googleLoggedIn = false;
            let microsoftLoggedIn = false;
            let appleLoggedIn = false;

            if ((url.includes('messenger.com/') || url.includes('facebook.com/messages/')) && isLoggedInOnFacebook())
            {
                facebookLoggedIn = true;
                let contactTags = await reqGetContactTags();
                await massageMessengerPage(contactInfos, contactTags, helpItems);
            }else
            if ((url.startsWith('https://www.facebook.com') || url.startsWith('https://web.facebook.com')) && isLoggedInOnFacebook())
            {
                facebookLoggedIn = true;
                let groupInfos = await reqGetGroupInfos();
                massageFacebookPage(contactInfos, groupInfos, helpItems)
            }else
            if (url.startsWith('https://www.instagram.com/direct') && isLoggedInOnInstagram()) {
                instagramLoggedIn = true;
                massageInstagramDirectPage(contactInfos, helpItems)
            }else
            if (url.startsWith('https://www.instagram.com') && isLoggedInOnInstagram()) {
                instagramLoggedIn = true;
                massageInstagramPage(contactInfos, helpItems)
            }else
            if (url.startsWith('https://www.pinterest.') && isLoggedInOnPinterest()){
                pinterestLoggedIn = true;
                massagePinterestPage(contactInfos, helpItems)
            }else                
            if (url.startsWith('https://www.tiktok.com') && await isLoggedInOnTikTok()){
                tikTokLoggedIn = true;
                massageTikTokPage(contactInfos, helpItems)
            }else
            if ((url.startsWith('https://www.twitter.com') || url.startsWith('https://twitter.com')) && isLoggedInOnTwitter()){
                twitterLoggedIn = true;
                massageTwitterPage(contactInfos, helpItems)
            }else
            if (url.startsWith('https://mail.google.com') && massageGmailPage(contactInfos, helpItems))
            {
                googleLoggedIn = true;
            }else
            if (url.startsWith('https://outlook.live.com') && massageOutlookPage(contactInfos, helpItems))
            {
                microsoftLoggedIn = true;
            }
    
            if (Browser.GetOS() == 'Android')
                googleLoggedIn = true;
    
            if (Browser.GetOS() == 'Windows')
                microsoftLoggedIn = true;
    
            if (Browser.GetOS() == 'Mac')
                appleLoggedIn = true;
    
            // NOTE: If we are prompted for one sync here, any subsequent one that also matches won't
            // be requested until the page is re-scraped.
            // if ((facebookLoggedIn && await handleDataSource('Facebook')) ||
            //     (instagramLoggedIn && await handleDataSource('Instagram')) ||
            //     (pinterestLoggedIn && await handleDataSource('Pinterest')) ||
            //     (tikTokLoggedIn && await handleDataSource('TikTok')) ||
            //     (twitterLoggedIn && await handleDataSource('Twitter')) /*||
            //     (googleLoggedIn && await handleDataSource('Google')) ||
            //     (microsoftLoggedIn && await handleDataSource('Microsoft')) ||
            //     (appleLoggedIn && await handleDataSource('Apple'))*/)
            //     delay = timings.SYNC_LOGIN_DELAY;
        }
        catch (e) {
            if (e.message.indexOf('Extension context invalidated') != -1)
                // DRL FIXIT! We should ask the user before reloading the page!
                location.reload();  // background script unloaded or reloaded
            else
                Log_WriteException(e);
        }

        await sleep(delay);
    }
}

DocumentLoad.AddCallback(function(rootNodes) {
    if (rootNodes.length != 1 || rootNodes[0] != document.body)
        return;     // this only needs to be done once on initial page load
    
    loopAug();
});

