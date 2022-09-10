function srchPathVcFB(item) {
    return srchPath('vCardsFacebook', item);
}

function keywordVcFB(item) {
    return localizedKeyword('vCardsFacebook', item);
}

function srchPathVcIG(item) {
    return srchPath('vCardsInstagram', item);
}

function srchPathVcPI(item) {
    return srchPath('vCardsPinterest', item);
}

function srchPathVcTT(item) {
    return srchPath('vCardsTikTok', item);
}

function srchPathVcTW(item) {
    return srchPath('vCardsTwitter', item);
}

function srchPathVcSN(item) {
    return srchPath('vCardsSalesNavigator', item);
}

function vCardEncode(str) {
    let Replacements = {
        "\\": "\\\\",
        "\n": "\\n",
        ',': '\,',
        ';': '\;',
    };
    
    if (str == null)
        return '';
    
    for (let i in Replacements) {
        str = Utilities_ReplaceInString(str, i, Replacements[i]);
    }
    
    return str;
}

function vCardEncodeDate(str) {
    let d = DateAndTime_FromString(str);
    d = d.ToFormat('%-D');
    return d;
}

// address is an array with city, state, country and some items may be null
function vCardEncodeAddress(address) {
    // The vCard spec:
    //   the post office box;
    //   the extended address (e.g., apartment or suite number);
    //   the street address;
    //   the locality (e.g., city);
    //   the region (e.g., state or province);
    //   the postal code;
    //   the country name (full name)
    
    let city = '';
    let state = '';
    let country = '';
    
    if (address[0])
        city = vCardEncode(address[0]);
    if (address[1])
        state = vCardEncode(address[1]);
    if (address[2])
        country = vCardEncode(address[2]);
    
    return ';;;' + city + ';' + state + ';;' + country;
}

// typically the address is a string with city, state, country and items may be left off the front (i.e. only
// state and country) or the country may be left off for US and CA, but other formats may be supported,
// returns an array with those three parts (any may be null)
async function normalizeAddress(address) {
    let location = null;
    
    if (address.trim() == '')
        return null;
    
    if (GoogleApiKey) {
        let url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) +
            '&key=' + encodeURI(GoogleApiKey);
        let response = await ajax.asyncRequest('GET', url, {});
        if (response.httpCode != 200) {
            Log_WriteError("Error getting geocode for \"" + address + "\": " + response.httpCode);
            return null;
        }
        let data = Json_FromString(response.data);
        if (data.status != 'OK') {
            Log_WriteError("Error getting geocode for \"" + address + "\": " + data.error_message);
            return null;
        }
        location = data.results[0].formatted_address;
    }
    
    let parts = (location != null ? location : address).split(',');
    for (let i in parts)
        parts[i] = parts[i].trim();
    
    if (location == null) {
        // it's possible we are passed the city and state, so check if we find a country in the last part
        if (parts.length == 2)
        {
            let part1 = parts[1].toUpperCase();
            let isState = LocaleRegionCANamesByCode.hasOwnProperty(part1) ||
               LocaleRegionUSNamesByCode.hasOwnProperty(part1);
            let isCountry = LocaleCountryNamesByCode.hasOwnProperty(part1) ||
               LocaleCountryNamesLookup.hasOwnProperty(part1);
        
            // when we get a two character code that's a state and a country we'll prefer the state
            if (isState || !isCountry)
            {
                // we can try to guess the country from the state
                if (LocaleRegionUSNamesByCode.hasOwnProperty(part1))
                    parts[2] = 'US';
                else if (LocaleRegionCANamesByCode.hasOwnProperty(parts[1].toUpperCase()))
                    parts[2] = 'CA';
                else
                    parts.push(''); // country is not specified
            }
        }
    }
    
    if (parts.length > 3) { // sometimes the county is included and we don't want it
        assert(parts.length == 4);
        parts.splice(1, 1);
    }
    while (parts.length < 3)
        parts.unshift('');
    
    return parts;
}

// address is an array with city, state, country and some items may be null
async function getTimeZoneForAddress(address) {
    if (GoogleApiKey == null) {
        return null;
    }
    
    address = address.slice();  // get a copy since we'll be changing it
    Utilities_RemoveFromArray(address, null);
    address = address.join(', ');
    // DRL FIXIT! We likely already performed this request via normalizeAddress() so we are paying twice!
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) +
       '&key=' + encodeURI(GoogleApiKey);
    let response = await ajax.asyncRequest('GET', url, {});
    if (response.httpCode != 200) {
        Log_WriteError("Error getting geocode for \"" + address + "\": " + response.httpCode);
        return null;
    }
    let data = Json_FromString(response.data);
    if (data.status != 'OK') {
        Log_WriteError("Error getting geocode for \"" + address + "\": " + data.error_message);
        return null;
    }
    let location = data.results[0].geometry.location;

    url = 'https://maps.googleapis.com/maps/api/timezone/json?location=' +
        encodeURI(location.lat + ',' + location.lng) +
        '&timestamp=' + parseInt(Date.now() / 1000) + '&sensor=false' +
       '&key=' + encodeURI(GoogleApiKey);
    response = await ajax.asyncRequest('GET', url, {});
    if (response.httpCode != 200) {
        Log_WriteError("Error getting geocode for \"" + address + "\": " + response.httpCode);
        return null;
    }
    data = Json_FromString(response.data);
    if (data.status != 'OK') {
        Log_WriteError("Error getting time zone for \"" + address + "\": " + data.error_message);
        return null;
    }
    return data.timeZoneId;
}

// if we have a URL that likely points to a social profile we'll convert it to an IM
function convertUrlToSocialOrWebsite(url) {
    const SocialDomains = [
        'facebook',
        'instagram',
        'pinterest',
        'tiktok',
        'linkedin',
        'twitter',
    ];
    
    url = normalizeUrl(url);
    
    // DRL FIXIT? Not sure this is needed since we're likely parsing a profile and already have the
    // social handle? It may result in false handles being created.
    // check for a profile URL like "https://www.facebook.com/saltyfoam" and convert it to
    // a social handle like "facebook:saltyfoam"
    if (url.indexOf('://') != -1) {
        
        let path = Url_GetPath(url);
        let pathParts = path.split('/');

        if (pathParts.length == 1) {
            for (let i in SocialDomains) {
                let domain = SocialDomains[i];
                if (fuzzyDomainsMatch('https://' + domain, url)) {
                    url = domain + ':' + pathParts[0];
                    break;
                }
            }
        }
    }
    
    return url;
}

function convertAddressesForvCard(addresses) {
    let result = '';
    
    for (let i in addresses) {
        addresses[i] = convertUrlToSocialOrWebsite(addresses[i]);
    }
    Utilities_ArrayRemoveDuplicates(addresses);
    
    for (let i in addresses) {
        let address = addresses[i];
        let prefix = Url_GetProtocol(address);
        if (prefix == 'tel')
            result += "TEL:" + vCardEncode(Url_StripProtocol(address)) + "\n";
        else if (prefix == 'mailto')
            result += "EMAIL:" + vCardEncode(Url_StripProtocol(address)) + "\n";
        else if (address.indexOf('://') != -1)
            result += "URL:" + vCardEncode(address) + "\n";
        else
            result += "IMPP:" + vCardEncode(address) + "\n";
    }
    
    return result;
}
/*
function createErrorVCard(id) {
    // return an empty vCard so the server knows there was an error
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\n";
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    return vCard;
}
*/
// DRL FIXIT! Sometimes a profile seems unavailable (such as https://www.facebook.com/1192523757434002)
// and in that case we should return an error instead of returning an empty profile.
// The contactID can be provided if known so we will add it if we don't see it in the parsed results
// as I have seen a page that had two IDs (the page ID 100063841410442 and the conversation ID 545405342287704
// did not match).
async function getvCardFromFacebookProfileOrPage(contactID) {
    let url = window.location.href;
    assert(url.indexOf('/groups/') == -1);
    assert(url.indexOf('/messages/') == -1);

    let id = getAddressFromFacebookProfileOrPageUrl(url);
    
    let name = null;
    
    let elems = findElements(srchPathVcFB('profileName'));
    if (elems.length > 0)
        name = Utilities_ReplaceInString(elems[0].innerText.trim(), "\n", ' ');
    
    let intro = null;
    let addresses = []
    let socialID = null;
    if (id.indexOf('@fbun.') != -1)   // the user hasn't set up a handle yet if it's not a username ID
    {
        let username = Url_GetEmailPrefix(id);
        addresses = ['facebook:' + username];

        // we need to get the person ID too so we can match conversations to this user
        let elems = await findElements('SCRIPT');
        for (let elem of elems) {
            let text = $(elem).text();
            // DRL FIXIT? Perhaps we should JSON.parse() the text like we do for Pinterest to avoid errors with our parsing below?
            if (text.includes(username + '"')) {  // use known username just for safety in case there's multiple userIDs
                try {
                    if (text.includes('"userID":"'))
                        socialID = text.split('"userID":"')[1].split('"')[0];
                    if (socialID != null)
                        socialID += '@fbperid.socialattache.com';
                    else if (text.includes('"pageID":"')) {
                        socialID = text.split('"pageID":"')[1].split('"')[0];
                        if (socialID != null)
                            socialID += '@fbpage.socialattache.com';
                    }
                }
                catch (e) {
                    Log_WriteException(e);
                }
                if (socialID != null)
                    break;
            }
        }
        if (socialID == null) {
            Log_WriteError("Unable to get person ID or page ID for Facebook username " + username);
        }
    }
    else {
        assert(id.indexOf('@fbperid.') != -1);
        socialID = id;  // this is already a person ID
    }
    if (socialID)
        socialID = 'fbp:' + socialID;
    if (contactID)
        contactID = Url_SetProtocol(contactID, 'fbp');  // make sure it has a protocol and matches the above for the comparison below
    
    let photo = null;
    let address = null;
    
    let temps = findElements(srchPathVcFB('links'));
    forEach(temps, function(temp) {
        addresses.push(temp);
    });
    temps = findElements(srchPathVcFB('phone'));
    forEach(temps, function(temp) {
        addresses.push(temp);
    });
    temps = findElements(srchPathVcFB('introItems'));
    forEach(temps, function(temp) {
        temp = temp.innerText.trim();
        if (temp.startsWith(keywordVcFB('Lives in'))) {
            address = temp.substr(9);
        }
    });
    let temp = findElement(srchPathVcFB('intro'));
    if (temp != null)
        intro = temp.innerText.trim();
    
    // this is for getting the photo from a profile...
    
    // - some profile photos don't seem to have a larger version we can access (should use smaller one?): https://www.facebook.com/dean.middleburgh
    // - some profile photos have a larger version that pops up when you click on it: https://www.facebook.com/jbnet
    // - some profile photos have a pop-up menu with an option you can click on to get a larger image: https://www.facebook.com/Jason.D.Grossman
    
    // DRL FIXIT! I think this code needs to be improved so we use the big image when we have one and
    // use the smaller image when we don't (i.e. https://www.facebook.com/holly.hanerlo). We also want
    // to improve the code to make it easier to update via Constants.js as there is logic here that could
    // be moved there.
    // For some profiles we need to click the menu item to get to the photo page (but not all!!).
    let profileLink = findElement(srchPathVcFB('photoImageBtn'));
    if (profileLink != null)
    {
        profileLink.click()
        // DRL FIXIT? Why are we checking the number of circle elements here? In one case it failed but
        // there was a button to open the image in the drop down menu: https://www.facebook.com/morgan.fassett
        if(findElements(srchPathVcFB('checkIfShouldOpenProfilePictureBigScreenBtn')).length > 2){
            let viewPictureBtn = await waitForElement(srchPathVcFB('drodownMenuOpenImageButton'), 5)
            if(viewPictureBtn != null){
                viewPictureBtn.click()
            }
            temp = await waitForElement(srchPathVcFB('bigImage'), 4);
            // DRL FIXIT? Sometimes I see there's no src but there is an href: https://www.facebook.com/SANDYDHUMPEL
            if (temp != null && temp.hasAttribute('src')) {
                photo = temp.getAttribute('src');
                if (photo == null && temp.hasAttribute('data-store')) {
                    data = JSON.parse(temp.getAttribute('data-store'));
                    photo = data.imgsrc;
                }
                temp = await waitForElement(srchPathVcFB('closeImage'));
                temp.click();
                await sleep(1);
            }
        }
    }else{
        temp = await waitForElement(srchPathVcFB('normalProfilePictureHref2'), 4);
        if (photo == null && temp != null) {
            photo = temp;
        }
    }

    let timeZone = null;
    if (address)
        address = await normalizeAddress(address);
    if (address)
        timeZone = await getTimeZoneForAddress(address);
    
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\nFN:" + vCardEncode(name) + "\n";
    if (intro)
        vCard += "NOTE:" + vCardEncode(intro) + "\n";
    if (photo)
        vCard += "PHOTO;VALUE=uri:" + vCardEncode(photo) + "\n";
    if (address)
        vCard += "ADR:" + vCardEncodeAddress(address) + "\n";
    if (socialID)
        vCard += "X-SOCIAL-ID:" + vCardEncode(socialID) + "\n";
    if (contactID && contactID != id && contactID != socialID)
        vCard += "X-SOCIAL-ID:" + vCardEncode(contactID) + "\n";
    if (timeZone)
        vCard += "TZ:" + vCardEncode(timeZone) + "\n";

    vCard += convertAddressesForvCard(addresses);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

async function getvCardFromNameAndAddress(name, imType, protocol, address) {
    let socialID = null;
    
    if (address.indexOf('fbperid.socialattache.com') != -1) {
        socialID = protocol + ':' + address;
        address = getAddressFromFacebookProfileOrPageUrl(await getFinalUrl('https://www.facebook.com/' + Url_GetEmailPrefix(address)));
    }
    
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(address) + "\nFN:" + vCardEncode(name) + "\n";
    
    if (socialID)
        vCard += "X-SOCIAL-ID:" + vCardEncode(socialID) + "\n";

    vCard += convertAddressesForvCard([imType + ':' + Url_GetEmailPrefix(address)]);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

function getAddressFromInstagramProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    return id.length > 0 ? id + '@igun.socialattache.com' : null;
}

async function getvCardFromInstagramProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];

    let name = null;
    let intro = null;
    let photo = null;
    let addresses = ['instagram:' + id];
    
    let temp = findElement(srchPathVcIG('profileName'));
    if (temp != null)
        name = Utilities_ReplaceInString(temp.innerText.trim(), "\n", ' ');
    temp = findElement(srchPathVcIG('profileIntro'));
    if (temp != null)
        intro = temp.innerText.trim();
    temp = findElement(srchPathVcIG('photoImage'));
    if (temp != null)
        photo = temp.src;
    
    id = id + '@igun.socialattache.com';
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\nFN:" + vCardEncode(name) + "\n";
    if (intro)
        vCard += "NOTE:" + vCardEncode(intro) + "\n";
    if (photo)
        vCard += "PHOTO;VALUE=uri:" + vCardEncode(photo) + "\n";

    vCard += convertAddressesForvCard(addresses);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

function getAddressFromTikTokProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    if (id.startsWith('@'))
        id = id.substr(1);
    
    return id.length > 0 ? id + '@ttun.socialattache.com' : null;
}

async function getvCardFromTikTokProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    if (id.startsWith('@'))
        id = id.substr(1);
    
    let name = null;
    let intro = null;
    let photo = null;
    let addresses = ['tiktok:' + id];
    
    name = findElement(srchPathVcTT('profileName'));
    intro = findElement(srchPathVcTT('profileIntro'));
    // DRL FIXIT! The URLs seem to go to a TikTok provided warning page and the user has to click
    // through to the website! We should convert these (but it's not as easy as redirection)!
    let temps = findElements(srchPathVcTT('websiteA'));
    forEach(temps, function(temp) {
        addresses.push(temp);
    });
    photo = findElement(srchPathVcTT('photoImage'));
    
    id = id + '@ttun.socialattache.com';
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\nFN:" + vCardEncode(name) + "\n";
    if (intro)
        vCard += "NOTE:" + vCardEncode(intro) + "\n";
    if (photo)
        vCard += "PHOTO;VALUE=uri:" + vCardEncode(photo) + "\n";

    vCard += convertAddressesForvCard(addresses);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

function getAddressFromPinterestProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    return id.length > 0 ? id + '@pintun.socialattache.com' : null;
}

async function getvCardFromPinterestProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    
    let name = null;
    let intro = null;
    let photo = null;
    let addresses = ['pinterest:' + id];
    
    let temp = findElement(srchPathVcPI('profileName'));
    if (temp != null)
        name = Utilities_ReplaceInString(temp.innerText.trim(), "\n", ' ');
    temp = findElement(srchPathVcPI('profileWebsite'));
    if (temp != null)
        addresses.push(temp.href);
    let temps = findElements(srchPathVcPI('profileIntro'));
    forEach(temps, function(temp) {
        temp = temp.innerText.trim();
        if (temp[0] != '@') // Looks like the @ marks the same as the IM handle we already got above.
            intro = temp;
    });
    temp = findElement(srchPathVcPI('photoImage'));
    if (temp != null && !temp.src.startsWith('chrome-extension:'))  // if no photo, don't upload our icon
        photo = temp.src;
    
    id = id + '@pintun.socialattache.com';
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\nFN:" + vCardEncode(name) + "\n";
    if (intro)
        vCard += "NOTE:" + vCardEncode(intro) + "\n";
    if (photo)
        vCard += "PHOTO;VALUE=uri:" + vCardEncode(photo) + "\n";

    vCard += convertAddressesForvCard(addresses);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

async function getvCardFromSalesNavigatorProfile() {
    let id = null;
    let name = null;
    let title = null;
    let company = null;
    let intro = null;
    let address = null;
    let birthday = null;
    let photo = null;
    let addresses = [];
    
    let temp = findElement(srchPathVcSN('profileName'));
    if (temp != null)
        name = Utilities_ReplaceInString(temp.innerText.trim(), "\n", ' ');
    temp = findElement(srchPathVcSN('profileTitle'));
    if (temp != null)
        title = temp.innerText.trim();
    temp = findElement(srchPathVcSN('profileCompany'));
    if (temp != null)
        company = temp.innerText.trim();
    temp = findElement(srchPathVcSN('profileAbout'));
    if (temp != null) {
        let bttn = findElement(srchPathVcSN('profileAboutSeeMore'), null, temp);
        if (bttn == null)
        {
            intro = temp.innerText.trim();
        }
        else
        {
            bttn.click();
            temp = findElement(srchPathVcSN('profileAboutPopUp'));
            intro = temp.innerText.trim();
            bttn = findElement(srchPathVcSN('profileAboutClose'));
            bttn.click();
        }
    }
    temp = findElement(srchPathVcSN('profileLocation'));
    if (temp != null)
        address = temp.innerText.trim();
    temp = findElement(srchPathVcSN('photoImage'));
    if (temp != null && !temp.src.startsWith('data:'))  // DRL Looks like when the data is provided it's a placeholder?
        photo = temp.src;
    let temps = findElements(srchPathVcSN('profileLinks'));
    forEach(temps, function (temp)
    {
        addresses.push(temp.href);
    });
    bttn = findElement(srchPathVcSN('profileMoreMenu'));
    if (bttn != null) {
        bttn.click();   // DRL FIXIT! Clicking the button has no effect!!
        await sleep(1);
        bttn = findElement(srchPathVcSN('profileCopyProfileLink'));
        if (bttn != null) {
            let saved = MyClipboard.GetClipboardText();
            bttn.click();
            await sleep(1);
            id = MyClipboard.GetClipboardText();
            MyClipboard.CopyTextToClipboard(saved);
            id = id.substr(id.indexOf('/in/')+4);
            addresses.push('linkedin:' + id);
        }
    }
    
    let timeZone = null;
    if (address)
        address = await normalizeAddress(address);
    if (address)
        timeZone = await getTimeZoneForAddress(address);
    
    if (id == null) {
        Log_WriteError('Could not get ID for profile at ' . window.location);
        return null;
    }
    
    id = id + '@liun.socialattache.com';
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\nFN:" + vCardEncode(name) + "\n";
    if (title)
        vCard += "TITLE:" + vCardEncode(title) + "\n";
    if (company)
        vCard += "ORG:" + vCardEncode(company) + "\n";
    if (intro)
        vCard += "NOTE:" + vCardEncode(intro) + "\n";
    if (photo)
        vCard += "PHOTO;VALUE=uri:" + vCardEncode(photo) + "\n";
    if (address)
        vCard += "ADR:" + vCardEncodeAddress(address) + "\n";
    if (timeZone)
        vCard += "TZ:" + vCardEncode(timeZone) + "\n";
    if (birthday)
        vCard += "BDAY:" + vCardEncodeDate(birthday) + "\n";
    
    vCard += convertAddressesForvCard(addresses);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

function getAddressFromTwitterProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    return id.length > 0 ? id + '@twitun.socialattache.com' : null;
}

async function getvCardFromTwitterProfile() {
    let url = window.location.pathname;
    
    let id = url.split('/')[1];
    
    let name = null;
    let intro = null;
    let address = null;
    let birthday = null;
    let photo = null;
    let addresses = ['twitter:' + id];
    
    let temp = findElement(srchPathVcTW('profileName'));
    if (temp != null)
        name = Utilities_ReplaceInString(temp.innerText.trim(), "\n", ' ');
    temp = findElement(srchPathVcTW('profileIntro'));
    if (temp != null)
        intro = temp.innerText.trim();
    temp = findElement(srchPathVcTW('profileLocation'));
    if (temp != null)
        address = temp.innerText.trim();
    temp = findElement(srchPathVcTW('profileWebsite'));
    if (temp != null && !temp.innerText.trim().includes('twitter.com')) // no point having handle and URL to same profile
        addresses.push('https://' + temp.innerText.trim());
    temp = findElement(srchPathVcTW('profileBirthday'));
    if (temp != null && !temp.innerText.trim().startsWith('Joined')) {
        birthday = temp.innerText.trim();
        if (birthday.startsWith('Born'))
            birthday = birthday.substr(5);
    }
    temp = findElement(srchPathVcTW('photoImage'));
    if (temp != null)
        photo = temp.src;
    
    let timeZone = null;
    if (address)
        address = await normalizeAddress(address);
    if (address)
        timeZone = await getTimeZoneForAddress(address);
    
    id = id + '@twitun.socialattache.com';
    let vCard = "BEGIN:VCARD\nVERSION:2.1\nUID:" + vCardEncode(id) + "\nFN:" + vCardEncode(name) + "\n";
    if (intro)
        vCard += "NOTE:" + vCardEncode(intro) + "\n";
    if (photo)
        vCard += "PHOTO;VALUE=uri:" + vCardEncode(photo) + "\n";
    if (address)
        vCard += "ADR:" + vCardEncodeAddress(address) + "\n";
    if (timeZone)
        vCard += "TZ:" + vCardEncode(timeZone) + "\n";
    if (birthday)
        vCard += "BDAY:" + vCardEncodeDate(birthday) + "\n";
    
    vCard += convertAddressesForvCard(addresses);
    
    vCard += "REV:" + (new Date()).toISOString()
       .replaceAll('-', '').replaceAll(':', '')
       .substr(0, 15) + "Z\nEND:VCARD";
    
    return vCard;
}

