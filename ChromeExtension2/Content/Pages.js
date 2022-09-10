// create a class of the form "SA_fbperid_12345" so we can remove the HTML we added
// when this item changes, and the address is expected to be normalized
function createClassFromAddress(address) {
    assert(address.indexOf('@') !== -1);
    assert(address.indexOf(':') === -1);
    assert(address.indexOf('@fberid') === -1);
    assert(address.indexOf('@fbpage') === -1);
    address = address.toLowerCase();
    return 'SA_' + address.split('@')[1].split('.')[0] + '_' + Utilities_ReplaceInString(address.split('@')[0], '.', '_');
}

// create a class of the form "SA_updated_20220203_014311" so we can remove the HTML we added
// when this item changes
function createClassFromDate(dateStr) {
    return 'SA_updated_' + Utilities_ReplaceInString(Utilities_ReplaceInString(Utilities_ReplaceInString(dateStr, ' ', '_'), '-', ''), ':', '');
}

function contactIconAndLabel(contactInfos, protocol, address, usage, canImport) {
    address = normalizeContactAddress(address);
    let protoAddress = protocol + ':' + address;
    
    let contactInfo = null;
    let classes = [];
    if (contactInfos.hasOwnProperty(protoAddress)) {
        contactInfo = contactInfos[protoAddress];
        classes.push(createClassFromAddress(address));
        classes.push(createClassFromDate(contactInfo.Updated));
    }
    
    if (usage == 'contact_open') {
        if (contactInfo) {
            if (contactInfo.TaskStatus != 'none')
                usage = contactInfo.TaskStatus;
        }
        else if (canImport) {
            usage = 'contact_import';   // we have everything we can get so we may as well import it here
        }
        else {
            usage = 'contact_unknown';  // will be imported later as we can get more information from the profile
        }
    }

    let icon = '';
    let label = '';
    if (usage == 'contact_import') {
        icon = 'DownloadDk.svg';
        label = Str('Import Contact');
    }
    else if (usage == 'contact_open') {
        icon = 'ContactDk.svg';
        label = Str('Open Contact');
    }
    else if (usage == 'contact_unknown') {
        icon = 'Hourglass3Dk.svg';
        label = Str('Not yet downloaded, or not an individual');
    }
/*
    else if (usage == 'post_import') {
        icon = 'DownloadDk.svg';
        label = Str('Download Post');
        if(typeof top != 'object')
            top = {
                top : top,
                right : right,
                position : positionType
            };
        return dropDownMenuDownload(icon, label, positionType, top);
    }
*/
    else if (usage == 'overdue') {
        icon = 'TasksOverdueDk.svg';
        label = Str('Has an overdue task');
    }
    else if (usage == 'upcoming') {
        icon = 'TasksUpcomingDk.svg';
        label = Str('Has an upcoming task');
    }
    else
        assert(0);

    return [icon, label, classes];
}

function contactIconHtml(contactInfos, protocol, address, usage, canImport, styles = {a: "", img: constantStyles.Pages.defaultContactIconHtml.img}) {
    if(typeof styles != "object"){
        styles = {a: "", img: constantStyles.Pages.defaultContactIconHtml.img}
    }
    if(typeof styles.img == "undefined"){
        styles.img = constantStyles.Pages.defaultContactIconHtml.img;
    }
    if(typeof styles.a == "undefined"){
        styles.a = "";
    }

    let [icon, label, classes] = contactIconAndLabel(contactInfos, protocol, address, usage, canImport);

    classes.push('SA_ButtonIcon');
    classes = classes.join(' ');
    
    // DRL FIXIT! We need to encode the label below!
    return "<a href='javascript:void(0);' class='" + classes + "' title='" + label + "' style='"+styles.a+"'>" +
       "<img src='" + SkinsUrl + icon + "' style='"+styles.img+"' /></a>";
}

let pageRefreshed = null;
let savedContactInfos = null;
function removeOldMassaging(contactInfos) {
    // make sure the filtering is always using the latest info
    savedContactInfos = contactInfos;
    let currentRefresh = DateAndTime_FromString('2000-01-01 00:00:00', 0);
    
    for (let address in contactInfos) {
        const contactInfo = contactInfos[address];
        
        let contactUpdated = DateAndTime_FromString(contactInfo.Updated, 0);
        if (currentRefresh.LessThan(contactUpdated))
            currentRefresh = contactUpdated;
        
        if (pageRefreshed != null && pageRefreshed.LessThan(contactUpdated)) {
            Log_WriteInfo('Contact ' + contactInfo.ContactID + ' changed so clearing out augmentations for ' + address + '.');
            
            let idClass = createClassFromAddress(Url_StripProtocol(address));
            let dateClass = createClassFromDate(contactInfo.Updated);
            let elems = Utilities_GetElementsBySelector('.'+idClass+':not(.'+dateClass+')');
            for (let elem of elems) {
                if (Class_HasByElement(elem, 'SA_augmented')) {
                    // we augmented the element so we can simply remove the class so it
                    // gets recalculated later
                    Class_RemoveByElement(elem, ['SA_augmented', idClass]); // we enhanced the element
                }
                else {
                    // we added the element, so we remove it, and remove the SA_augmented class from
                    // the ancestor so that it will be reprocessed later
                    let parent = Utilities_GetParentByClass(elem, 'SA_augmented');
                    if (parent)
                        Class_RemoveByElement(parent, 'SA_augmented');
                    elem.remove();
                }
            }
        }
    }
    
    pageRefreshed = currentRefresh;
}

FormSubmit.AddCallback(function(form)
{
    let params = Form_GetValues(form);

    if (params.hasOwnProperty('ContactID'))
        reqReloadContactInfo(params['ContactID']);
});

function massageInstagramPage(contactInfos, helpItems) {
    let found = false;
    let dataName = 'InstagramScrape';

    let address = getAddressFromInstagramProfile(); // invalid if not profile page
    
    removeOldMassaging(contactInfos);
    
    // Instagram profile page
    let elems = findElements(srchPathPG('profileNameInsta'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'ig', address, 'contact_open', true));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
            let protoAddress = normalizeContactAddress('ig:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'ig', 'IsMessagingView', '0');
            }
            else {
                DisplayMessage(Str('Getting profile...'), 'busy');
                getvCardFromInstagramProfile()
                   .then(vCard => {
                       reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                           'FormProcessor': 'ContactResolver',
                           'vCard': vCard,
                           'ReferralUrl': contactsPageUrl(),
                           'ByWhom': Str('one-click import from Instagram')
                       });
                       ClearMessage();
                   })
                   .catch(e => {
                       Log_WriteException(e);
                       DisplayMessage(Str('Error parsing profile!'), 'error');
                   });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        elem.appendChild(frag);

        found = true;
    });

    // Instagram posts
    elems = findElements(srchPathPG('postAuthorInsta'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let options = [
            {
                label: 'Download to Post Library',
                icon: 'DownloadDk.svg',
                cmd:
                   function ()
                   {
                       DisplayMessage(Str('Getting post...'), 'busy');
                       getPostFromInstagram(elem)
                          .then(post => {
                              reqSendPost(dataName, post)
                                 .then(function (result)
                                 {
                                     ClearMessage();
                                     if (result) {
                                         DisplayMessage(Str('Loading...'), 'busy', null, 5);
                                         DisplayEmbeddedItemForm('CuratePostEdit', 'DataName', dataName,
                                            'Type', post.Type, 'ExternalPostID', post.Uid);
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
                              DisplayMessage(Str('Error parsing post!'), 'error');
                          });
                   }
            }
        ];

        let menu = dropDownMenu(options, {top: 8, position: "relative"});
        elem.appendChild(menu);
        found = true;
    });

    return found;
}

function massageInstagramDirectPage(contactInfos, helpItems) {
    let found = false;
    
    removeOldMassaging(contactInfos);
    
    // Instagram direct page
    let elems = findElements(srchPathPG('instagramConversationHeader'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let name = findElement(srchPathPG('instagramConversationHeaderName'), null, elem);
        let address = findElement(srchPathPG('instagramConversationHeaderAddress'), null, elem);
        if (address == null)
            return;
        address = address + '@' + 'igun.socialattache.com';

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'ig', address, 'contact_open', false, {a:constantStyles.Pages.Instagram.massageInstagramDirectPageContactIconHtml}));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
    
            let protoAddress = normalizeContactAddress('ig:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'ig', 'IsMessagingView', '1');
            }
            else {
                let addr = name + ' <' + address + '>';
                reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                    'FormProcessor': 'ContactResolver',
                    'Protocol': 'ig',
                    'Address': addr,
                    'ReferralUrl': contactsPageUrl(),
                    'ByWhom': Str('one-click import from Instagram')
                });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        })
        elem.appendChild(frag);

        found = true;
    });

    return found;
}

function massagePinterestPage(contactInfos, helpItems) {
    let found = false;
    let dataName = 'PinterestScrape';
    
    removeOldMassaging(contactInfos);
    
    let address = getAddressFromPinterestProfile(); // invalid if not profile page

    // Pinterest profile page
    let elems = findElements(srchPathPG('profileNamePint'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'pint', address, 'contact_open', true));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
            let protoAddress = normalizeContactAddress('pint:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'pint', 'IsMessagingView', '0');
            }
            else {
                DisplayMessage(Str('Getting profile...'), 'busy');
                getvCardFromPinterestProfile()
                   .then(vCard => {
                       reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                           'FormProcessor': 'ContactResolver',
                           'vCard': vCard,
                           'ReferralUrl': contactsPageUrl(),
                           'ByWhom': Str('one-click import from Pinterest')
                       });
                       ClearMessage();
                   })
                   .catch(e => {
                       Log_WriteException(e);
                       DisplayMessage(Str('Error parsing profile!'), 'error');
                   });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        elem.appendChild(frag);
        found = true;
    });

    // Pinterest posts
    elems = findElements(srchPathPG('postWrapperPint'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');
        let options = [
            {
                label: 'Download to Post Library',
                icon: 'DownloadDk.svg',
                cmd: function () {
                       DisplayMessage(Str('Getting post...'), 'busy', null, 5);
                       let url = new URL(findElement('a {href}', null, elem));
                       url.searchParams.set('SA_action', 'downloadPostToLibrary');
                       window.open(url)
                   }
            }
        ];
        let menu = dropDownMenu(options, constantStyles.Pages.Pinterest.dropdownButtonForPosts);
        elem.appendChild(menu);
        elem.style.position = 'relative'; // to have our button inside the image

        found = true;
    });

    // Pinterest Post Page
    if(window.location.href.includes('/pin')){
        elems = findElements(srchPathPG('pinterestPostPageDropdownButtonLocationSelector'), ':not(.SA_augmented)');
        forEach(elems, function(elem) {
            Class_AddByElement(elem, 'SA_augmented');
            let cmds = new Map()
            cmds.set('downloadPostToLibrary', (callback = () => {}) => {
                DisplayMessage(Str('Getting post...'), 'busy');
                getPostFromPinterest(elem)
                   .then(post => {
                       reqSendPost(dataName, post)
                          .then(function (result)
                          {
                              ClearMessage();
                              if (result) {
                                  DisplayMessage(Str('Loading...'), 'busy', null, 5);
                                  DisplayEmbeddedItemForm('CuratePostEdit', 'DataName', dataName,
                                     'Type', post.Type, 'ExternalPostID', post.Uid);
                                  callback()
                              }
                              callback()
                          })
                          .catch(e =>
                          {
                              Log_WriteException(e);
                              DisplayMessage(Str('Error sending post!'), 'error');
                              callback()
                          });
                   })
                   .catch(e => {
                       Log_WriteException(e);
                       DisplayMessage(Str('Error parsing post!'), 'error');
                       callback()
                   });
            })

            if(Url_GetParam(window.location.href, 'SA_action') != null){
                cmds.get(Url_GetParam(window.location.href, 'SA_action'))()
                Url_RemoveParam(window.location.href, 'SA_action')
            }

            let options = [
                {
                    label: 'Download to Post Library',
                    icon: 'DownloadDk.svg',
                    cmd: cmds.get('downloadPostToLibrary')
                }
            ];

            let menu = dropDownMenu(options, {position: "relative"});
            elem.appendChild(menu);
            elem.style.position = 'relative'; // to have our button inside the image

            found = true;
        });
    }

    // Pinterest conversation
    elems = findElements(srchPathPG('pinterestConversationHeader'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');
    
        let name = findElement(srchPathPG('pinterestConversationHeaderName'), null, elem);
        let address = findElement(srchPathPG('pinterestConversationHeaderAddress'), null, elem);
        if (address == null)
            return;
        address = address + '@' + 'pintun.socialattache.com';

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'pint', address, 'contact_open', false, {a:constantStyles.Pages.Pinterest.conversationContactIconHtml}));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
    
            let protoAddress = normalizeContactAddress('pint:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'pint', 'IsMessagingView', '1');
            }
            else {
                let addr = name + ' <' + address + '>';
                reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                    'FormProcessor': 'ContactResolver',
                    'Protocol': 'pint',
                    'Address': addr,
                    'ReferralUrl': contactsPageUrl(),
                    'ByWhom': Str('one-click import from Pinterest')
                });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        })
        elem.appendChild(frag);

        found = true;
    });

    return found;
}

function massageTikTokPage(contactInfos, helpItems) {
    let found = false;
    let dataName = 'TikTokScrape';
    
    removeOldMassaging(contactInfos);
    
    let address = getAddressFromTikTokProfile(); // invalid if not profile page

    // TikTok profile page
    let elems = findElements(srchPathPG('profileNameTikTok'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'tt', address, 'contact_open', true));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
            let protoAddress = normalizeContactAddress('tt:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'tt', 'IsMessagingView', '0');
            }
            else {
                DisplayMessage(Str('Getting profile...'), 'busy');
                getvCardFromTikTokProfile()
                   .then(vCard => {
                       reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                           'FormProcessor': 'ContactResolver',
                           'vCard': vCard,
                           'ReferralUrl': contactsPageUrl(),
                           'ByWhom': Str('one-click import from TikTok')
                       });
                       ClearMessage();
                   })
                   .catch(e => {
                       Log_WriteException(e);
                       DisplayMessage(Str('Error parsing profile!'), 'error');
                   });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        elem.appendChild(frag);

        found = true;
    });

    // TikTok posts
    elems = findElements(srchPathPG('postWrapperTikTok'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let options = [
            {
                label: 'Download to Post Library',
                icon: 'DownloadDk.svg',
                cmd:
                   function ()
                   {
                       DisplayMessage(Str('Getting post...'), 'busy');
                       getPostFromTikTok(elem)
                          .then(post => {
                              reqSendPost(dataName, post)
                                 .then(function (result)
                                 {
                                     ClearMessage();
                                     if (result) {
                                         DisplayMessage(Str('Loading...'), 'busy', null, 5);
                                         DisplayEmbeddedItemForm('CuratePostEdit', 'DataName', dataName,
                                            'Type', post.Type, 'ExternalPostID', post.Uid);
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
                              DisplayMessage(Str('Error parsing post!'), 'error');
                          });
                   }
            }
        ];

        let menu = dropDownMenu(options, constantStyles.Pages.TikTok.postSidebarDropdownTriggerButton, null, {triggerButtonImgStyles: constantStyles.Pages.TikTok.postSidebarDropdownTriggerButtonImg});
        let sidebar = findElement(srchPathPG('postSidebarFromPostWrapper'),null, elem)
        sidebar.insertBefore(menu, sidebar.firstChild);

        found = true;
    });

    // TikTok messages (in TikTok messages list)
    if(window.location.href.includes('messages')){
        
        // DRL FIXIT! The same header is used for all conversations so we need to update it when
        // the conversation changes!
        
        elems = findElements(srchPathPG('tiktokConversationHeader'), ':not(.SA_augmented)');
        forEach(elems, function(elem) {
    
            let name = findElement(srchPathPG('tiktokConversationHeaderName'), null, elem);
            let address = findElement(srchPathPG('tiktokConversationHeaderAddress'), null, elem);
            if (address == null)
                return;
            address = address + '@' + 'ttun.socialattache.com';
    
            let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'tt', address, 'contact_open', false, {a:constantStyles.Pages.TikTok.tiktokMessagesInMessageListContactIconHtml}));
    
            Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
        
                let protoAddress = normalizeContactAddress('tt:' + address);
                if (contactInfos.hasOwnProperty(protoAddress)) {
                    DisplayMessage(Str('Loading...'), 'busy', null, 5);
                    DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'tt', 'IsMessagingView', '1');
                }
                else {
                    let addr = name + ' <' + address + '>';
                    reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                        'FormProcessor': 'ContactResolver',
                        'Protocol': 'tt',
                        'Address': addr,
                        'ReferralUrl': contactsPageUrl(),
                        'ByWhom': Str('one-click import from TikTok')
                    });
                }
        
                // I'm trying to keep whatever might be on the page from triggering as well...
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            elem.appendChild(frag);

            Class_AddByElement(elem, 'SA_augmented');
            found = true;
        });

    }

    return found;
}

async function downloadTwitterPost(action) {
    let elem = findElement(srchPathPG('postWrapperTwitter'));
    if (!elem) {
        // queue the message for after the new page loads
        reqPushDisplayMessage(null, Str('Post not found!'), 'error')
            .then(function() {
                history.back();
            })
            .catch(e => { Log_WriteException(e); throw e; });

        await sleep(10);    // let's make sure nothing more is done on this page while it reloads
        return;
    }
    
    DisplayMessage(Str('Getting post...'), 'busy');
    getPostFromTwitter(elem).then(post => {
        reqSendPost('TwitterScrape', post)
            .then(function (result)
            {
                ClearMessage();
    
                // queue some actions for after the new page loads
                reqPushDisplayMessage(null, Str('Loading form...'), 'busy', null, 5)
                    .then(function() {
                        return reqPushDisplayEmbeddedItemForm(null, 'CuratePostEdit', 'DataName', 'TwitterScrape',
                           'Type', post.Type, 'ExternalPostID', post.Uid);
                    })
                    .then(function() {
                        history.back();
                    })
                    .catch(e => { Log_WriteException(e); throw e; });
            })
            .catch(e =>
            {
                Log_WriteException(e);
                DisplayMessage(Str('Error sending post!'), 'error');
            });
    })
    .catch(e => {
        Log_WriteException(e);
        DisplayMessage(Str('Error parsing post!'), 'error');
    });
}

function massageTwitterPage(contactInfos, helpItems) {
    let found = false;
    
    removeOldMassaging(contactInfos);
    
    let address = getAddressFromTwitterProfile(); // invalid if not profile page

    // Twitter profile page
    let elems = findElements(srchPathPG('profileNameTwitter'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'twit', address, 'contact_open', true));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
            let protoAddress = normalizeContactAddress('twit:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'twit', 'IsMessagingView', '0');
            }
            else {
                DisplayMessage(Str('Getting profile...'), 'busy');
                getvCardFromTwitterProfile()
                   .then(vCard => {
                       reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                           'FormProcessor': 'ContactResolver',
                           'vCard': vCard,
                           'ReferralUrl': contactsPageUrl(),
                           'ByWhom': Str('one-click import from Twitter')
                       });
                       ClearMessage();
                   })
                   .catch(e => {
                       Log_WriteException(e);
                       DisplayMessage(Str('Error parsing profile!'), 'error');
                   });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
        elem.appendChild(frag);

        found = true;
    });

    // Twitter posts
    elems = findElements(srchPathPG('postWrapperTwitter'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let options = [
            {
                label: 'Download to Post Library',
                icon: 'DownloadDk.svg',
                cmd:
                   function ()
                   {
                       DisplayMessage(Str('Getting post...'), 'busy', 5);
    
                       // push the action so it comes back to us on the correct page after the click
                       reqPushAction(null, {action: 'downloadTwitterPost'})
                           .then(function() {
                               elem.click();
                           })
                           .catch(e => { Log_WriteException(e); throw e; });
                   }
            }
        ];

        let menu = dropDownMenu(options, constantStyles.Pages.Twitter.feedPostsDropdownMenu);
        elem.appendChild(menu);
        // prevent twitter to trigger his own click event, when clicking on the dropdown button
        Utilities_AddEvent(elem, 'click', (e)=>{
            // DRL not sure if this is still needed after I added the e.Xxx() calls to the menu event handler above
            if(menu.contains(e.target)){
                e.preventDefault();
                return false;
            }
        });
        found = true;
    });

    // Twitter conversation, or the profile page past the conversation
    elems = findElements(srchPathPG('twitterConversationHeader'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');
    
        let name = findElement(srchPathPG('twitterConversationHeaderName'), null, elem);
        let address = findElement(srchPathPG('twitterConversationHeaderAddress'), null, elem);
        if (address == null)
            return;
        address = address + '@' + 'twitun.socialattache.com';

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'twit', address, 'contact_open', false, {a:constantStyles.Pages.Twitter.conversationOrProfilePagePastConversationContactIconHtml}));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
    
            let protoAddress = normalizeContactAddress('twit:' + address);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'twit', 'IsMessagingView', '1');
            }
            else {
                let addr = name + ' <' + address + '>';
                reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                    'FormProcessor': 'ContactResolver',
                    'Protocol': 'twit',
                    'Address': addr,
                    'ReferralUrl': contactsPageUrl(),
                    'ByWhom': Str('one-click import from Twitter')
                });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        })
        elem.appendChild(frag);

        found = true;
    });

    return found;
}

function massageGmailPage(contactInfos, helpItems) {
    let found = false;
    
    removeOldMassaging(contactInfos);
    
    // Opened email
    let elems = findElements(srchPathPG('gmailSender'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let name = findElement(srchPathPG('gmailSenderName'), null, elem);
        let email = findElement(srchPathPG('gmailSenderEmail'), null, elem);

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'mailto', email, 'contact_open', false));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {

            let protoAddress = normalizeContactAddress('mailto:' + email);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'mailto', 'IsMessagingView', '1');
            }
            else {
                let addr = name + ' <' + email + '>';
                reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                    'FormProcessor': 'ContactResolver',
                    'Protocol': 'mailto',
                    'Address': addr,
                    'ReferralUrl': contactsPageUrl(),
                    'ByWhom': Str('one-click import from Gmail')
                });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        })
        elem.parentNode.insertBefore(frag, elem);

        found = true;
    });

    return found;
}

function massageOutlookPage(contactInfos, helpItems) {
    let found = false;
    
    removeOldMassaging(contactInfos);
    
    // Message list
    let elems = findElements(srchPathPG('outlookSender'), ':not(.SA_augmented)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');

        let name = findElement(srchPathPG('outlookSenderName'), null, elem);
        let email = findElement(srchPathPG('outlookSenderEmail'), null, elem);

        let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'mailto', email, 'contact_open', false));
        Utilities_AddEvent(frag.firstElementChild, 'click', function(e) {
    
            let protoAddress = normalizeContactAddress('mailto:' + email);
            if (contactInfos.hasOwnProperty(protoAddress)) {
                DisplayMessage(Str('Loading...'), 'busy', null, 5);
                DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'mailto', 'IsMessagingView', '1');
            }
            else {
                let addr = name + ' <' + email + '>';
                reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                    'FormProcessor': 'ContactResolver',
                    'Protocol': 'mailto',
                    'Address': addr,
                    'ReferralUrl': contactsPageUrl(),
                    'ByWhom': Str('one-click import from Outlook')
                });
            }

            // I'm trying to keep whatever might be on the page from triggering as well...
            e.stopPropagation();
            e.preventDefault();
            return false;
        })
        elem.parentNode.insertBefore(frag, elem);

        found = true;
    });

    return found;
}
