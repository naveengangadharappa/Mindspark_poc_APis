const HelpInit = {
    lastHelpFetched: null,
    help: {}
}

async function getHelpItems() {
    return new Promise( (resolve, reject) => {
        let localData = Storage.GetLocalVar('Help', HelpInit);
        
        if (!getBrandID()) {
            resolve(localData.help);
            return;
        }

        let now = Date.now();
        if (now - localData.lastHelpFetched < timings.HELP_CHECK_DELAY * 1000) {
            resolve(localData.help);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        localData.lastHelpFetched = now - (timings.HELP_CHECK_DELAY / 5 * 1000);

        var params = {
            'Fields': 'Name,IsDefaultShow,BookmarkPosition,BookmarkFinished,ResourceURL'
        };
        const url = Form_RootUri + '/v2/Help';
        
        ajax.get(url, params, function(resp2, httpCode)
        {
            if (resp2 && httpCode == 200) {
                localData.lastHelpFetched = now;
    
                localData.help = {};
                
                resp2 = Json_FromString(resp2);
                for (let id in resp2.data) {
                    let item = resp2.data[id];
                    let path = item.Name.split('/');

                    // the key ignores the venture and the root (Team, Personal, etc.) and the filename
                    let key = path.slice(2, path.length-1).join('/');

                    // the name is just the venture and the file name
                    let name = path.slice(0, 1).concat(path.slice(path.length-1)).join('/');
                    
                    if (!localData.help.hasOwnProperty(key))
                        localData.help[key] = [];
                    localData.help[key].push({
                        'Name': name,
                        'IsDefaultShow': item.IsDefaultShow && item.BookmarkPosition == null,
                        'ResourceURL': item.ResourceURL
                    });
                }
    
                Storage.SetLocalVar('Help', localData);
                
                resolve(localData.help);
            }
            else if (httpCode == 0 || httpCode == 401) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get help');
                resolve(localData.help);
            }
            else {
                Log_WriteError('Error getting help: ' + httpCode);
                resolve(localData.help);
            }
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

// DRL FIXIT? Does this need to be async?
async function markHelpItemRead(path) {
    return new Promise( (resolve, reject) => {
        let localData = Storage.GetLocalVar('Help', HelpInit);

        if (localData.help.hasOwnProperty(path)) {
            for (let i in localData.help[path]) {
                if (localData.help[path][i].IsDefaultShow) {
                    localData.help[path][i].IsDefaultShow = false;   // the first one should have been shown
                    break;
                }
            }
        }
    
        Storage.SetLocalVar('Help', localData);
        
        resolve();
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

function helpBrandChanged() {
    // force refresh from new account
    let localData = Storage.GetLocalVar('Help', HelpInit);
    
    localData.lastHelpFetched = null;
    
    Storage.SetLocalVar('Help', localData);
}


