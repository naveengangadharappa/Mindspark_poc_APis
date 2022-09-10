let lastBrandingTried = 0;
let lastLoginCheck = 0;
let lastLoginTried = 0;
let lastLoginOffered = 0;
let lastLoginRefused = 0;
let lastLoginType = 'logged_out';   // only logged_in or logged_out

let languageCodes = null;   // will be an array
let availableFeatures = [];
let canGetFeatures = [];

// we use this to initialize the languages until we can get them from the logged in user account on the server, so
// that we can show messages to the user in their language while they're not yet logged in
// IMPROVMENT user language accuracy: Facebook displays the account language in one <html> attribute | <html lang="en">
// just need to getElementByTagName("html") with one content script
Environment.ClientLanguages(function(languages) {
    if (languageCodes == null)
        languageCodes = languages;
});

function isSocialAttacheLoggedIn() {
    return lastLoginType == 'logged_in';
}

async function checkSocialAttacheLogin() {
    return new Promise( (resolve, reject) => {
        let result = {
            type: lastLoginType,
            languages: languageCodes,
            extensionName: Environment.ApplicationName,
            brandName: Environment.ApplicationName
        };

        if (Migration.IsMigrating) {
            Log_WriteInfo('Migration in process, simulating Social Attache logged out.');
            result.type = 'logged_out';
            resolve(result);
            return;
        }
    
        if (!getBrandID()) {
            // local development case
            languageCodes = result.languages = ['en-US'];
            result.type = 'logged_in';
            resolve(result);
            return;
        }
    
        // we must have a brand before we can log in
        let brandingResult = checkBrand();
        if (brandingResult == CheckBrand_BrandNotSelected) {
            Log_WriteInfo('Brand has not been selected');
            let now = Date.now();
            if (now - lastBrandingTried >= timings.BRAND_SELECTION_TRIED_REOFFER * 1000)
                result.type = 'offer_brand';
            else
                result.type = 'logged_out';
Log_WriteInfo('Sending login response 1 from background: ' + result.type);
            resolve(result);
            return;
        }
        if (brandingResult == CheckBrand_NoBrands) {
            Log_WriteInfo('The brands have not been loaded, simulating Social Attache logged out.');
            result.type = 'logged_out';
Log_WriteInfo('Sending login response 2 from background: ' + result.type);
            resolve(result);
            return;
        }
        assert(brandingResult == CheckBrand_BrandReady);
        lastBrandingTried = 0;
        result.brandName = getBrand()['Name'];
    
        if (!navigator.onLine) {
            Log_WriteInfo('The browser appears to be offline, simulating Social Attache logged out.');
            result.type = 'logged_out';
Log_WriteInfo('Sending login response 3 from background: ' + result.type);
            resolve(result);
            return;
        }
    
        let now = Date.now();
        let ajaxTimeout = timings.SHORT_AJAX_REQUEST * 1000;
        
        // we don't want to make this server request every time, so we cache it, and while logging in we'll check every time
        if ((lastLoginType == 'logged_in' || now - lastLoginTried >= timings.ACCOUNT_LOGIN_TRIED_REOFFER * 1000) &&
            now - lastLoginCheck < timings.ACCOUNT_LOGIN_CHECK * 1000) {
    
            // don't offer login until we've checked login state
            if (lastLoginCheck && result.type == 'logged_out' &&
                // don't offer login if it's been offered in the past while (could be the prompt up still showing)
                now - lastLoginOffered >= timings.ACCOUNT_LOGIN_OFFERED_REOFFER * 1000 &&
                // don't offer login if he's refused it in the past while
                now - lastLoginRefused >= timings.ACCOUNT_LOGIN_REFUSED_REOFFER * 1000 &&
                // or if we could be still in the process of waiting for a response (double it to be sure)
                now - (lastLoginCheck + (timings.ACCOUNT_LOGIN_CHECK / 5 * 1000)) > ajaxTimeout * 2) {
                lastLoginOffered = now;
                result.type = 'offer_login';
            }
    
Log_WriteInfo('Sending login response 4 from background: ' + result.type);
            resolve(result);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
Log_WriteInfo('*** Checking login ***');
        lastLoginCheck = now - (timings.ACCOUNT_LOGIN_CHECK / 5 * 1000);
        
        try
        {
            // DRL FIXIT? I'd rather we don't use a cookie and would prefer an HTTP header.
            // we set a cookie so that we can check on the server side to see if the extension has been installed
            // we expect that the name used here exactly matches the brand venture name
            SetCookie(
               Utilities_ReplaceInString(Environment.ApplicationName + ' extension', ' ', '_'),
               Environment.ApplicationVersion);
        }
        catch (e) {
            Log_WriteException(e);
        }
        
        Log_WriteInfo('Checking user login');
        ajax.get(Form_RootUri + '/v2/Users/me', {}, function(resp, httpCode)
        {
            Log_WriteInfo('*** Login Response ***');
            
            if (httpCode == 0) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get session');
Log_WriteInfo('Sending login response 5 from background: ' + result.type);
                resolve(result);
                return;
            }
    
            let temp = Json_FromString(resp);
            if (temp == null) {
                Log_WriteError('Error converting user info from server: ' + resp);
Log_WriteInfo('Sending login response 6 from background: ' + result.type);
                resolve(result);
                return;
            }
            resp = temp;
    
            lastLoginCheck = now;
            languageCodes = result.languages = resp.data.Languages; // always provided
            availableFeatures = [];
            canGetFeatures = [];
    
            if (resp.result_code == 200) {
                lastLoginType = result.type = 'logged_in';
                lastLoginTried = 0;
                availableFeatures = resp.data.AvailableFeatures;
                Utilities_RemoveFromArray(availableFeatures, resp.data.DisabledFeatures);
                canGetFeatures = resp.data.CanGetFeatures;
    
                Log_SetFullLogging(Utilities_ArrayContains(resp.data.LoggingEnabled, 'chro'));
    
                // DRL FIXIT! For some reason we're not getting all the cookies via the Chrome API so
                // we hack a workaround here to set some cookies that we need in the extension.
                SetCookie('LanguageCodes', languageCodes.join(','));
                SetCookie('AvailableFeatures', availableFeatures.join(','));
                SetCookie('CanGetFeatures', canGetFeatures.join(','));
    
                Log_WriteInfo('Logged in as user ' + resp.data.UserID);
            }
            else if (resp.result_code != 401) {
                Log_WriteError('Got unexpected response from server for login check: ' + Json_ToString(resp));
            }
            else {
                lastLoginType = result.type = 'logged_out';
    
                // don't offer login if he's refused it in the past while, or has tried recently
                // don't offer login if it's been offered in the past while (could be the prompt up still showing)
                if (now - lastLoginOffered >= timings.ACCOUNT_LOGIN_OFFERED_REOFFER * 1000 &&
                    now - lastLoginTried >= timings.ACCOUNT_LOGIN_TRIED_REOFFER * 1000 &&
                    now - lastLoginRefused >= timings.ACCOUNT_LOGIN_REFUSED_REOFFER * 1000) {
                    lastLoginOffered = now;
                    result.type = 'offer_login';
                }
            }

/* Only available in Manifest V3
            let isPinned = await Environment.IsPinned();
            if (!isPinned && now - lastPinTried >= timings.EXTENSION_PIN_TRIED_REOFFER) {
                lastPinTried = now;
                pushTabNextAction(tabID, {
                    action: 'displayMessage',
                    message: Str('The main menu of the <0> Chrome extension is available from its icon in the toolbar. In order to add it to the toolbar click the "Extensions" toolbar button and click the <0> pin.', Environment.ApplicationName),
                    messageType: 'warning',
                    displayType: null,
                    timeoutSeconds: null,
                    resp: null
                });
            }
*/
            
Log_WriteInfo('Sending login response 7 from background: ' + result.type);
            resolve(result);
        }, true, ajaxTimeout);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function userBrandChanged() {
    // when the brand changes we have to recheck login so may as well reset everything as if we just started up
    lastLoginCheck = 0;
    lastLoginTried = 0;
    lastLoginRefused = 0;
    lastLoginType = 'logged_out';
}

function userTryingBranding() {
    lastBrandingTried = Date.now();
}

function userTryingLogin() {
    lastLoginTried = Date.now();
}

function userRefusedLogin() {
    lastLoginRefused = Date.now();
}

function userHasFeature(feature) {
    return Form_RootUri == null || Utilities_ArrayContains(availableFeatures, feature);
}

function userCanGetFeature(feature) {
    return Utilities_ArrayContains(canGetFeatures, feature);
}
