const TagsInit = {
    lastTagsFetched: null,
    contactTags: {}
}

async function getContactTags() {
    return new Promise( (resolve, reject) => {
        let localData = Storage.GetLocalVar('Tags', TagsInit);
    
        let now = Date.now();
        if (getBrandID() != BrandID_LocalFile && now - localData.lastTagsFetched < timings.CONTACT_TAGS_CHECK_DELAY * 1000) {
            resolve(localData.contactTags);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        localData.lastTagsFetched = now - (timings.CONTACT_TAGS_CHECK_DELAY / 5 * 1000);

        var params = {
            'Fields': 'TagID,Name'
        };
        const url = getBrandID() == BrandID_LocalFile
           ? Environment.GetAssetUrl('Data/ContactsTags.json')
           : Form_RootUri + '/v2/Contacts/Tags';
        
        ajax.get(url, params, function(resp, httpCode)
        {
            if (resp && httpCode == 200) {
                localData.contactTags = {};
                
                resp = Json_FromString(resp);
                for (let tagID in resp.data) {
                    localData.contactTags[tagID] = resp.data[tagID].Name;
                }
    
                localData.lastTagsFetched = now;
                Storage.SetLocalVar('Tags', localData);
                
                resolve(localData.contactTags);
            }
            else if (resp == null || httpCode == 0 || httpCode == 401) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get contact tags');
                resolve(localData.contactTags);
            }
            else {
                Log_WriteError('Error getting contact tags: ' + httpCode);
                resolve(localData.contactTags);
            }
        }, true, timings.MEDIUM_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function tagsBrandChanged() {
    // force refresh from new account
    let localData = Storage.GetLocalVar('Tags', HelpInit);
    
    localData.lastTagsFetched = null;
    
    Storage.SetLocalVar('Tags', localData);
}


