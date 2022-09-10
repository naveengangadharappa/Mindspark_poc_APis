const NotRead       = -1;
const NotResponded  = -2;
const IsOnline      = -3;
const NotTagged     = -4;
const NotDownloaded = -5;
const NoTask        = -6;
const UpcomingTask  = -7;
const OverdueTask   = -8;
const FilterStringToInt = {
    NotRead:        -1,
    NotResponded:   -2,
    IsOnline:       -3,
    NotTagged:      -4,
    NotDownloaded:  -5,
    NoTask:         -6,
    UpcomingTask:   -7,
    OverdueTask:    -8
};

const MessengerFilterInit = {
    lastMenuRefreshed: null,
    selectedFilterID: null,
    filteredTagIDs: []
}

// called when the search filters edit form has closed so we need to update the filter (in case the user
// was editing a different one) as well as the menu (in case a menu item was renamed)
async function updateSearchFilterMenu() {
    await reqReloadSearchFilters();
    
    // allow menu to be refreshed after any changes have had time to reload
    setTimeout(async function() {
        let localData = Storage.GetTabVar('MessengerFilter', MessengerFilterInit);
        localData.lastMenuRefreshed = null; // force menu update
        Storage.SetTabVar('MessengerFilter', localData);

        await updateMessengerFilterMenu();
    }, 5 * 1000);
}

async function setSearchFilter(filterID) {
    let localData = Storage.GetTabVar('MessengerFilter', MessengerFilterInit);
    
    if (localData.selectedFilterID == filterID)
        return;
    
    localData.lastMenuRefreshed = null;       // needed in order for menu to get refreshed
    localData.selectedFilterID = null;
    localData.filteredTagIDs = [];

    if (filterID == null) {
        DisplayMessage(Str('Not filtering'), 'success', null, 3);
        Storage.SetTabVar('MessengerFilter', localData);
        await updateMessengerFilterMenu();
        await messengerContactTagsFilterChats(true)
        return;
    }
    
    let filter = await reqGetSearchFilter(filterID);
    if (filter == null) {
        DisplayMessage(Str('Not filtering'), 'error', null, 3);
        Storage.SetTabVar('MessengerFilter', localData);
        await updateMessengerFilterMenu();
        await messengerContactTagsFilterChats(true)
        return;
    }
    
    DisplayMessage(Str('Filtering: <0>', filter.Name), 'success', null, 3);

    filter = filter.SearchFilter;
    for (const tagID of filter.TagID) {
        localData.filteredTagIDs.push(tagID);
    }
    for (const state of filter.ConversationState) {
        localData.filteredTagIDs.push(FilterStringToInt[state]);
    }
    for (const status of filter.TaskStatus) {
        localData.filteredTagIDs.push(FilterStringToInt[status]);
    }
    localData.selectedFilterID = filterID;
    
    Storage.SetTabVar('MessengerFilter', localData);
    
    await updateMessengerFilterMenu();
    await messengerContactTagsFilterChats(true)
}

function updateFilterActiveIndication() {
    let prependDropDownMenu = findElement(srchPathFBM('chatContactsActionBar'))
    if (prependDropDownMenu == null)
        return;
    
    let buttonElement = findElement('.SA', null, prependDropDownMenu);
    let filterActiveImg = findElement('.filterActive', null, buttonElement)
    
    let localData = Storage.GetTabVar('MessengerFilter', MessengerFilterInit);
    
    //If there is active filters will show the filterActiveImg and change the background color to green
    // if not just hide and keep the background color to default
    if (localData.filteredTagIDs.length > 0) {
        if(filterActiveImg != null)
            filterActiveImg.style['display'] = 'block';
        buttonElement.style['background-color'] = "#8bc18f";
    }
    else {
        if(filterActiveImg != null)
            filterActiveImg.style['display'] = 'none';
        buttonElement.style['background-color'] = "#e4e6eb";
    }
}

async function updateMessengerFilterMenu(){
    let prependDropDownMenu = findElement(srchPathFBM('chatContactsActionBar'))
    if (prependDropDownMenu == null)
        return;
    
    let localData = Storage.GetTabVar('MessengerFilter', MessengerFilterInit);
    
    let menuIfThereIsOne = findElement('.SA', null, prependDropDownMenu)
    if(menuIfThereIsOne != null){
        // only need to refresh if there have been changes (and the page would have been refreshed)
        if (localData.lastMenuRefreshed != null && localData.lastMenuRefreshed.Equal(pageRefreshed))
            return;
        
        menuIfThereIsOne.remove();
    }
    localData.lastMenuRefreshed = pageRefreshed;
    Storage.SetTabVar('MessengerFilter', localData);

    let options = [];
    let found = localData.selectedFilterID == null;
    
    options.push({
        icon: localData.selectedFilterID == null ? 'CheckedDkOn.svg' : 'CheckedDkOff.svg',
        label: 'No Filtering',
        cmd: async function () {
            setSearchFilter(null);
        }
    })
    
    let filterNames = await reqGetSearchFilterNames();
    for (let filterID in filterNames) {
        if (localData.selectedFilterID == filterID)
            found = true;
        options.push({
            icon: localData.selectedFilterID == filterID ? 'CheckedDkOn.svg' : 'CheckedDkOff.svg',
            label: filterNames[filterID],
            cmd: async function () {
                setSearchFilter(filterID);
            }
        })
    }
    
    options.push({
        icon: 'CheckedDkOff.svg',
        label: 'Edit Filters...',
        cmd: async function () {
            DisplayMessage(Str('Loading...'), 'busy', null, 5);
            DisplayEmbeddedItemForm('SearchFiltersEdit', 'Category', 'fb_messenger', 'CallbackMethod', 'updateSearchFilterMenu',
               'SearchFilterID', Storage.GetTabVar('MessengerFilter', MessengerFilterInit).selectedFilterID);
        }
    })
    
    let menu = dropDownMenu(options, constantStyles.Pages.Facebook.dropdownFilterContactsOnMessagesPage, null,
       {triggerButtonImgStyles: constantStyles.Pages.Facebook.dropdownFilterContactsOnMessagesPageImg});
    prependDropDownMenu.appendChild(menu)
    
    if (!found)
        await setSearchFilter(null);  // selected filter was removed, set no filtering
    else
        updateFilterActiveIndication();
}

async function messengerContactTagsFilterChats(filterChanged) {
    let localData = Storage.GetTabVar('MessengerFilter', MessengerFilterInit);
    
    let contactButtons = findElements(srchPathFBM('chatContactButtonsElements',
       filterChanged ? null : ':not(.SA_Filtered)'))
    
    if(localData.filteredTagIDs.length <= 0){
        //Make all contacts visible
        for(let contactButton of contactButtons){
            Class_RemoveByElement(contactButton, 'SA_Filtered');
            contactButton.style.display = "block"
        }
        return;
    }
    
    // pre-calculate some flags to make the code more efficient in the loop
    let hasTaskFilter = false
    let hasTagFilter = false
    let wantNotRead = false;
    let wantNotResponded = false;
    let wantIsOnline = false;
    let wantNotTagged = false;
    let wantNotTasked = false;
    let keepNotDownloaded = false;
    for (let filteredTagID of localData.filteredTagIDs) {
        if (filteredTagID == NotRead)
            wantNotRead = true;
        else if (filteredTagID == NotResponded)
            wantNotResponded = true;
        else if (filteredTagID == IsOnline)
            wantIsOnline = true;
        else if (filteredTagID == NotDownloaded) {
            keepNotDownloaded = true;
            hasTaskFilter = true;
        }
        else if (filteredTagID == NoTask)
            wantNotTasked = true;
        else if (filteredTagID == UpcomingTask || filteredTagID == OverdueTask)
            hasTaskFilter = true;
        else if (filteredTagID == NotTagged) {
            wantNotTagged = true;
            hasTagFilter = true;
        }
        else
            hasTagFilter = true;
    }
    // if there is both a task filter and a tag filter then both types must have a match to show a contact
    let minTypesToShow = 0;
    if (wantNotRead || wantNotResponded || wantIsOnline)
        minTypesToShow++;
    if (wantNotTasked || hasTaskFilter)
        minTypesToShow++;
    if (wantNotTagged || hasTagFilter)
        minTypesToShow++;
    
    //Go thought the list of contacts and check if they have the filter active tags, if not, hide, if have, keep visible
    for(let contactButton of contactButtons){
        Class_AddByElement(contactButton, 'SA_Filtered');
        let protoAddress = normalizeContactAddress('fbp:'+getContactFromMessengerElement(contactButton));
        let unreadMatched = 0;
        let taskMatched = 0;
        let tagMatched = 0;
        if(savedContactInfos && savedContactInfos.hasOwnProperty(protoAddress)){
            let contactInfo = savedContactInfos[protoAddress];
            for (let filteredTagID of localData.filteredTagIDs){
                if (contactInfo.TagIDs.includes(filteredTagID) ||
                   (filteredTagID == NotTagged && contactInfo.TagIDs.length == 0))
                    tagMatched = 1;

                if((filteredTagID == NoTask && contactInfo.TaskStatus == 'none') ||
                   (filteredTagID == UpcomingTask && contactInfo.TaskStatus == 'upcoming') || 
                   (filteredTagID == OverdueTask && contactInfo.TaskStatus == 'overdue'))
                    taskMatched = 1;
            }
        }
        else {
            if (keepNotDownloaded) {
                if (wantNotTagged)
                    tagMatched = 1;
                taskMatched = 1;
            }
        }
        if ((wantNotRead && findElement(srchPathFBM('messageIsUnread'), null, contactButton)) ||
            (wantNotResponded && findElement(srchPathFBM('messageIsNotResponded'), null, contactButton)) ||
            (wantIsOnline && findElement(srchPathFBM('messageIsOnline'), null, contactButton)))
            unreadMatched = 1;

        contactButton.style.display = unreadMatched + tagMatched + taskMatched >= minTypesToShow ? "block" : "none";
    }
}

function getContactFromMessengerElement(elem){
    return findElement(srchPathFBM('messageElementWithId'), null, elem)+"@fbperid.socialattache.com"
}

async function messengerContactTagsCreator(contactTags) {
    if(findElement('.SA_tags') != null){
        return;
    }

    let elem = await waitForElement(srchPathFBM('messageHeaderTitleContainer'));
    
    // We don't know whether this is a page or a person, and Contacts.js massages the IDs for us.
    let convID = getMessengerConversationID(window.location.href);
    let address = normalizeContactAddress(convID + '@fbperid.socialattache.com');
    let contactInfoProp = 'fbp:' + address;

    if (!savedContactInfos.hasOwnProperty(contactInfoProp)) {
        return;
    }

    let userTags = []
    for (let i = 0; i < savedContactInfos[contactInfoProp].TagIDs.length; i++){
        userTags.push(contactTags[savedContactInfos[contactInfoProp].TagIDs[i]])
    }

    let contactTagsElem = Utilities_CreateHtmlNode(messengerContactTagsHTML(address, userTags))
    elem.parentNode.insertBefore(contactTagsElem, elem.nextSibling)
}

function messengerContactTagsHTML(address, contactTags){
    let htmlTags = '';
    for (let i = 0; i < contactTags.length; i++){
        htmlTags += '<div>' + contactTags[i] + '</div>';
    }

    let idClass = createClassFromAddress(address);
    
    return '<div class="SA_tags ' + idClass + '">'+htmlTags+'</div>';
}

function _processMessengerLink(contactInfos, helpItems, accountID, elem, id, name, style = {contactIconHtml: ""}) {
    assert(id != null && name != null);

    // DRL FIXIT! We don't know whether this is a page or person, so we pick person, but we could be wrong!
    let address = id + '@' + 'fbperid.socialattache.com';
    let normalized = normalizeContactAddress(address);

    // it looks like sometimes the SA_augmented class gets removed from a conversation entry, perhaps when
    // the user clicks on it, but the elements we added inside it continue to exist so in this case we'll
    // skip creating them again
    let idClass = createClassFromAddress(normalized);
    if (Utilities_GetElementsByClass(idClass, null, elem).length > 0)
        return;

    let protoAddress = 'fbp:' + normalized;

    let frag = Utilities_CreateHtmlNode(contactIconHtml(contactInfos, 'fbp', address, 'contact_open', false, style.contactIconHtml));

    Utilities_AddEvent(frag.firstElementChild, 'click', async function(e) {
        DisplayMessage(Str('Loading...'), 'busy', null, 5);
        if (contactInfos.hasOwnProperty(protoAddress)) {
            DisplayEmbeddedItemForm('ContactQuickView', 'ContactID', contactInfos[protoAddress].ContactID, 'Protocol', 'fbp', 'IsMessagingView', '1');
        }
        else {
            let vCard = await getvCardFromNameAndAddress(name, 'facebook', 'fbp', address);
            reqCreateTab('SAMainPage', vCard.length > 1024 ? 'POST' : 'GET', Form_MainUri, {
                'FormProcessor': 'ContactResolver',
                'vCard': vCard,
                'ReferralUrl': contactsPageUrl(),
                'ByWhom': Str('one-click import from Messenger')
            });
        }

        // I'm trying to keep whatever might be on the page from triggering as well...
        e.stopPropagation();
        e.preventDefault();
        return false;
    })
    elem.appendChild(frag);

}

async function massageMessengerPage(contactInfos, contactTags, helpItems) {
    let found = false;

    // Messenger page
    let accountInfo = getFacebookAccountInfo()
    if (accountInfo == null) {
        assert(0);
        return;
    }
    let accountID = accountInfo.id;
    
    await messengerContactTagsFilterChats(false);
    
    removeOldMassaging(contactInfos);
    
    await messengerContactTagsCreator(contactTags)
    await updateMessengerFilterMenu()

    // the header above the selected conversation
    // DRL I added the SA_ButtonIcon check because the button we add may also match the selector.
    elems = findElements(srchPathPG('profileNameMsngr'), ':not(.SA_augmented):not(.SA_ButtonIcon)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');
    
        let id = Utilities_ReplaceInString(
           location.pathname.substring(location.pathname.lastIndexOf('/t/') + 3),
           '/', '');
        let name = elem.innerText;
    
        _processMessengerLink(contactInfos, helpItems, accountID, elem, id, name);
        
        found = true;
    });
    
    // conversations in the conversation list
    // DRL I added the SA_ButtonIcon check because the button we add may also match the selector.
    elems = findElements(srchPathPG('profileNameMsngrList'), ':not(.SA_augmented):not(.SA_ButtonIcon)');
    forEach(elems, function(elem) {
        Class_AddByElement(elem, 'SA_augmented');
    
        let id = Utilities_ReplaceInString(
           elem.href.substring(elem.href.lastIndexOf('/t/') + 3),
           '/', '');
        
        // name might be in a SPAN sub-item along with another SPAN with other text so we want the first one
        let temp = findElement(srchPathPG('profileNameMsngrListName'), null, elem);
        if (temp == null)
            return; // the window may be too narrow so we're seeing the version without the name??
        let name = temp.innerText;
    
        _processMessengerLink(contactInfos, helpItems, accountID, elem, id, name, {contactIconHtml: {a:constantStyles.Pages.Facebook.facebookMessagesInMessageListContactIconHtml}});
        
        found = true;
    });
    
    return found;
}
