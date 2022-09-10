const GroupsInit = {
    lastGroupsFetched: null,
    groupInfos: {}
}

async function getGroupInfos() {
    return new Promise( (resolve, reject) => {
        let localData = Storage.GetLocalVar('Groups', GroupsInit);
    
        let now = Date.now();
        if (getBrandID() != BrandID_LocalFile && now - localData.lastGroupsFetched < timings.GROUPS_CHECK_DELAY * 1000) {
            resolve(localData.groupInfos);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        localData.lastGroupsFetched = now - (timings.GROUPS_CHECK_DELAY / 5 * 1000);

        var params = {
            'Fields': 'GroupUid,ResourceID,GroupURL,ImportMembers'
        };
        const url = getBrandID() == BrandID_LocalFile
           ? Environment.GetAssetUrl('Data/CommunityGroups.json')
           : Form_RootUri + '/v2/CommunityGroups';
        
        ajax.get(url, params, function(resp, httpCode)
        {
            if (resp && httpCode == 200) {
                localData.groupInfos = {};
                
                resp = Json_FromString(resp);
                for (let groupID in resp.data) {
                    let groupInfo = resp.data[groupID];
                    
                    groupInfo.IsAdmin = Url_GetProtocol(groupInfo.GroupUid) == 'fb';
                    
                    // we want to index by FB group identifier instead of ID
                    let groupUid = groupInfo.GroupURL.split('/').at(-1);
                    
                    // if we have both a personal and a business entry keep the business one
                    if (localData.groupInfos.hasOwnProperty(groupUid) && !groupInfo.IsAdmin)
                        continue;
                    
                    localData.groupInfos[groupUid] = groupInfo;
                }
                
               localData.lastGroupsFetched = now;
               Storage.SetLocalVar('Groups', localData);
               
               resolve(localData.groupInfos);
            }
            else if (httpCode == 0 || httpCode == 401) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get group infos');
                resolve(localData.groupInfos);
            }
            else {
                Log_WriteError('Error getting groups info: ' + httpCode);
                resolve(localData.groupInfos);
            }
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function groupsBrandChanged() {
    // force refresh from new account
    let localData = Storage.GetLocalVar('Groups', GroupsInit);

    localData.lastGroupsFetched = null;

    Storage.SetLocalVar('Groups', localData);
}

