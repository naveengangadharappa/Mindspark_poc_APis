const ContactsInit = {
    lastContactsFetched: {},  // indexed by protocol
    contactInfos: {}          // indexed by protocol, then by address
}

async function getContactInfos(protocol) {
    return new Promise( (resolve, reject) => {
        let localData = Storage.GetLocalVar('Contacts', ContactsInit);

        let now = Date.now();
        if (getBrandID() != BrandID_LocalFile && localData.contactInfos.hasOwnProperty(protocol) &&
            now - localData.lastContactsFetched[protocol] < timings.CONTACTS_CHECK_DELAY * 1000) {
            resolve(localData.contactInfos.hasOwnProperty(protocol) ? localData.contactInfos[protocol] : []);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        localData.lastContactsFetched[protocol] = now - (timings.CONTACTS_CHECK_DELAY / 5 * 1000);

        var params = {
            'Protocol': protocol,
            'Fields': 'ContactID,TaskStatus,Updated'
        };
        const url = getBrandID() == BrandID_LocalFile
           ? Environment.GetAssetUrl('Data/Contacts.json')
           : Form_RootUri + '/v2/Contacts';
        
        ajax.get(url, params, function(resp, httpCode)
        {
            if (resp && httpCode == 200) {
                localData.contactInfos[protocol] = {};
                
                let index = {}; // used to find the contacts by contact ID below, values are an array since a
                                // contact may have several addresses and could appear multiple times in contactInfos
                resp = Json_FromString(resp);
                for (let addr in resp.data) {
                    assert(addr.indexOf(':') != -1);   // must have protocol
                    let normalized = normalizeContactAddress(addr);
                    resp.data[addr].TagIDs = [];   // in case it has no tags below we'll initialize this
                    localData.contactInfos[protocol][normalized] = resp.data[addr];
                    if (index.hasOwnProperty(resp.data[addr].ContactID))
                        index[resp.data[addr].ContactID].push(normalized);
                    else
                        index[resp.data[addr].ContactID] = [normalized];
                }

                var params = {
                };
                const url = getBrandID() == BrandID_LocalFile
                   ? Environment.GetAssetUrl('Data/ContactsTagged.json')
                   : Form_RootUri + '/v2/Contacts/Tagged';

                ajax.get(url, params, function(resp, httpCode)
                {
                    if (resp && httpCode == 200) {
                        
                        resp = Json_FromString(resp);
                        // add the TagIDs to the info we've already accumulated
                        for (let contactID in resp.data) {
                            if (index.hasOwnProperty(contactID)){
                                for (let normalized of index[contactID]) {
                                    if (localData.contactInfos[protocol][normalized] == undefined)
                                        Log_WriteError("Contact " + contactID + " was not found by address " + normalized + " in contactInfos!");
                                    else {
                                        localData.contactInfos[protocol][normalized].TagIDs = resp.data[contactID];
                                    }
                                }
                            }
                        }
    
                        localData.lastContactsFetched[protocol] = now;
                        Storage.SetLocalVar('Contacts', localData);

                        resolve(localData.contactInfos[protocol]);
                    }
                    else if (httpCode == 0 || httpCode == 401) {
                        // server unavailable, network error, etc.
                        Log_WriteWarning('Server is not available to get contacts tagged');
                        resolve(localData.contactInfos[protocol]);
                    }
                    else {
                        Log_WriteError('Error getting contacts tagged: ' + httpCode);
                        resolve(localData.contactInfos[protocol]);
                    }
                }, true, timings.MEDIUM_AJAX_REQUEST * 1000);
            }
            else if (httpCode == 0 || httpCode == 401) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get contact infos');
                resolve(localData.contactInfos[protocol]);
            }
            else {
                Log_WriteError('Error getting contacts info: ' + httpCode);
                resolve(localData.contactInfos[protocol]);
            }
        }, true, timings.MEDIUM_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function reloadContactInfo(contactID) {
    let localData = Storage.GetLocalVar('Contacts', ContactsInit);
    
    // reload soon, allow a little time (10s) for server to save changes
    for (let protocol in localData.lastContactsFetched)
        localData.lastContactsFetched[protocol] = Date.now() - ((timings.CONTACTS_CHECK_DELAY - 10) * 1000);

    Storage.SetLocalVar('Contacts', localData);
}

function contactsBrandChanged() {
    // force refresh from new account
    let localData = Storage.GetLocalVar('Contacts', ContactsInit);
    
    localData.lastContactsFetched = {};
    
    Storage.SetLocalVar('Contacts', localData);
}

