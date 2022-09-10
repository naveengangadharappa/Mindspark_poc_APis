let FiltersInit = {
    lastFiltersFetched: null,
    searchFilters: {}
}

async function getSearchFilters() {
    return new Promise( (resolve, reject) => {
        let localData = Storage.GetLocalVar('Filters', FiltersInit);
        
        if (!getBrandID()) {
            resolve(localData.searchFilters);
            return;
        }
        
        let now = Date.now();
        if (now - localData.lastFiltersFetched < timings.FILTERS_CHECK_DELAY * 1000) {
            resolve(localData.searchFilters);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        localData.lastFiltersFetched = now - (timings.FILTERS_CHECK_DELAY / 5 * 1000);
        
        var params = {
            'Fields': 'SearchFilterID,Name,SearchFilter',
            'Filter': Json_ToString({
                'Category': 'fb_messenger'
            })
        };
        const url = Form_RootUri + '/v2/SearchFilters';
        
        ajax.get(url, params, function(resp2, httpCode)
        {
            if (resp2 && httpCode == 200) {
                localData.searchFilters = {};
                
                resp2 = Json_FromString(resp2);
                for (let filterID in resp2.data) {
                    localData.searchFilters[filterID] = resp2.data[filterID];
                }
                
                localData.lastFiltersFetched = now;
                Storage.SetLocalVar('Filters', localData);
                
                resolve(localData.searchFilters);
            }
            else if (httpCode == 0 || httpCode == 401) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get filter infos');
                resolve(localData.searchFilters);
            }
            else {
                Log_WriteError('Error getting filters info: ' + httpCode);
                resolve(localData.searchFilters);
            }
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
       .catch(e => { Log_WriteException(e); throw e; });
}

async function getSearchFilterNames() {
    let filters = await getSearchFilters();
    
    let result = {};
    for (let filterID in filters) {
        result[filterID] = filters[filterID].Name;
    }
    return result;
}

async function getSearchFilter(filterID) {
    let filters = await getSearchFilters();
    return filters[filterID];
}

function reloadSearchFilters() {
    let localData = Storage.GetLocalVar('Filters', FiltersInit);

    // we get notified after the edit form has closed so we don't have to wait
    localData.lastFiltersFetched = null;

    Storage.SetLocalVar('Filters', localData);
    
    let p = getSearchFilters(); // async method, we're just pre-fetching here
}

function filtersBrandChanged() {
    // force refresh from new account
    reloadSearchFilters();
}

