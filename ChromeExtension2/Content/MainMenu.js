
// pops up any default help, returns menu options
function _handlePopUpHelp(helpItems, path)
{
    let popUp = null;
    let options = [];
    if (helpItems.hasOwnProperty(path))
    {
        for (let i in helpItems[path])
        {
            let item = helpItems[path][i];
            if (popUp == null && item.IsDefaultShow)
                popUp = item;
            
            options.push({
                label: item.Name,
                icon: '',
                cmd:
                   function () {
//                       DisplayMessage(Str('Loading...'), 'busy', null, 5);
                       DisplayEmbeddedItemForm('LandingPageVisit', 'Embedded', '1', 'ResourceID', Url_GetParam(item.ResourceURL, 'ResourceID'));
                   }
            });
        }
    }
    if (UserHasFeature(UserFeaturesHelp)) {
        options.push({
            label: Str('Edit Help'),
            icon: 'EditDk.svg',
            cmd:
               async function ()
               {
                   reqCreateTab('SAMainPage', 'GET', Form_MainUri, {
                       'View': 'Home,Admin,Help',
                       'ViewHelpPath': reqGetBrandID() + '/' + path
                   });
               }
        });
    }
    
    if (popUp) {
        DisplayMessage(Str('Loading...'), 'busy', null, 5);
        DisplayEmbeddedItemForm('LandingPageVisit', 'Embedded', '1', 'ResourceID', Url_GetParam(popUp.ResourceURL, 'ResourceID'));
        reqMarkHelpItemRead(path);
    }
    
    return options;
}

function getMainMenuOptions(loggedIn) {
    let options = [
        {
            label: Str("About the Extension"),
            icon: 'IconWithoutCircle.svg',
            cmd: () => {
                DisplayMessage(Str('<0> Chrome Extension <1>', chrome.runtime.getManifest().name, chrome.runtime.getManifest().version), 'busy', null);
            }
        },
        {
            label: Str("Select Provider"),
            icon: 'SynchronizeDk.svg',
            cmd: async () => {
                await displayBrandsMenu();
            }
        }
    ];
    if(loggedIn){
        if (UserHasFeature(UserFeaturesTasks))
            options = options.concat([
                {
                    label: Str("Open the Tasks Page"),
                    icon: 'TaskDk.svg',
                    cmd: () => {
                        reqCreateTab('SAMainPage', 'GET', Form_MainUri + "?View=Home%2CMyBusiness%2CTasks");
                    }
                }]);
        if (UserHasFeature(UserFeaturesContacts))
            options = options.concat([
                {
                    label: Str("Open the Contacts Page"),
                    icon: 'ContactDk.svg',
                    cmd: () => {
                        reqCreateTab('SAMainPage', 'GET', Form_MainUri + "?View=Home%2CMyBusiness%2CContacts");
                    }
                }
            ]);
        if (UserHasFeature(UserFeaturesWatchedPosts))
            options = options.concat([
                {
                    label: Str("Open the Watched Posts Page"),
                    icon: 'AutomationDk.svg',
                    cmd: () => {
                        reqCreateTab('SAMainPage', 'GET', Form_MainUri + "?View=Home%2CMarketing%2CWatchedPosts");
                    }
                }
            ]);
        options = options.concat([
            {
                label: Str("Open the Training Page"),
                icon: 'TrainingDk.svg',
                cmd: () => {
                    reqCreateTab('SAMainPage', 'GET', Form_MainUri + "?View=Home%2CMyBusiness%2CTrainings");
                }
            },
            {
                label: Str("Create a Support Ticket"),
                icon: 'IssueDk.svg',
                cmd: async () => {
                    await reqCreateIssue();
                }
            }
        ]);
    }else{
        options = options.concat([
            {
                label: Str('Create or Login to an Account'),
                icon: 'AccountDk.svg',
                cmd: () => {
                    reqCreateTab('SAMainPage', 'GET', LoginUri);
                }
            }
        ]);
    }
    
    return options;
}
/* Chrome extension main menu is now actioned off the extension icon in the toolbar, but we may want to use this in our React Native app case?
function globalDropdown(elem, loggedIn, type = 'prepend', otherOpts = null){
    if(findElement('.dropdown-menu.SA.SA_globalDropdown') != null){
        return;
    }
    
    let options = getMainMenuOptions(loggedIn);
    
    let dropdownMenuBtnStyle = null;
    if(typeof otherOpts.globalDropdownBtnStyle != "undefined" && otherOpts.globalDropdownBtnStyle != null){
        dropdownMenuBtnStyle = otherOpts.globalDropdownBtnStyle;
    }
    let dropdownMenuBtnImgStyle = null;
    if(typeof otherOpts.dropdownMenuBtnImgStyle != "undefined" && otherOpts.dropdownMenuBtnImgStyle != null){
        dropdownMenuBtnImgStyle = otherOpts.dropdownMenuBtnImgStyle;
    }
    
    let menu = dropDownMenu(options, dropdownMenuBtnStyle, null, {orientation: 'right', triggerButtonImgStyles: dropdownMenuBtnImgStyle, extraClassesButton: ['SA_globalDropdown']});
    if(type == 'prepend'){
        elem.insertBefore(menu, elem.firstChild);
    }else if(type == 'afterElement'){
        elem.parentNode.insertBefore(menu, elem.nextSibling);
    }else{
        elem.append(menu);
    }
}
*/
function displayMainMenu(loggedIn) {
    let options = getMainMenuOptions(loggedIn);
    showCenteredMenu(options, null);
}

async function displayBrandsMenu() {
    reqGetBrandInfos()
       .then(data => {
           let options = [];
           
           for (const brandID in data.brandNames) {
               options.push({
                   label: data.brandNames[brandID],
                   icon: brandID == data.brandID ? 'CheckedDkOn.svg' : 'CheckedDkOff.svg',
                   cmd:
                      async function ()
                      {
                          await reqSetBrandID(brandID);
                      }
               });
           }
           
           popUpMenu(Str('Choose your provider:'), options, null, {orientation: 'right'});
       })
       .catch(e => {
           Log_WriteException(e);
           DisplayMessage(Str('Error getting providers!'), 'error');
       });
}
/* Chrome extension main menu is now actioned off the extension icon in the toolbar, but we may want to use this in our React Native app case?
function displayMainMenu(isLoggedInToBackOffice) {
    let siteName = null;
    let domain = window.location.host;
    
    let location = 'prepend';       // DRL FIXIT! Move this value to the Constants.js file.
    if (domain.includes('messenger'))
        siteName = 'Messenger';
    else if (domain.includes('facebook'))
        siteName = 'Facebook';
    else if (domain.includes('instagram'))
        siteName = 'Instagram';
    else if (domain.includes('pinterest'))
        siteName = 'Pinterest';
    else if (domain.includes('tiktok'))
        siteName = 'TikTok';
    else if (domain.includes('twitter'))
        siteName = 'Twitter';
    else if (domain.includes('google'))
        siteName = 'Gmail';
    else if (domain.includes('outlook')) {
        siteName = 'Outlook';
        location = 'afterElement';  // DRL FIXIT! Move this value to the Constants.js file.
    }
    else {
        Log_WriteError('Unsupported site: ' + url);
        return;
    }
    
    let globalDropdownPosition = findElement(srchPath('Pages', 'globalDropdownBtnLocation' + siteName))
    if (globalDropdownPosition != null) {
        globalDropdown(globalDropdownPosition, isLoggedInToBackOffice, location, {
            globalDropdownBtnStyle: constantStyles.Pages[siteName].globalDropdownBtn,
            dropdownMenuBtnImgStyle:constantStyles.Pages[siteName].globalDropdownBtnImg
        });
    }
}
*/