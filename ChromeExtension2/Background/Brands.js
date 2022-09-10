const CheckBrand_NoBrands = 'no_brands';
const CheckBrand_BrandNotSelected = 'brand_not_selected';
const CheckBrand_BrandReady = 'brand_ready';

let BrandsInit = {
    lastBrandsFetched: null,
    brands: {},
    brandID: null
}

async function getBrands() {
    return new Promise( (resolve, reject) => {
        BrandsInit.brandID = parseInt(DefaultBrandID);
        let localData = Storage.GetLocalVar('Brands', BrandsInit);
    
        let now = Date.now();
        if (DefaultBrandID != BrandID_LocalFile && /*Object.keys(localData.brands).length > 0 &&*/
            now - localData.lastBrandsFetched < timings.BRANDS_CHECK_DELAY * 1000) {
            resolve(localData.brands);
            return;
        }
        // don't recheck right away but if there's an error don't wait the full time to retry
        localData.lastBrandsFetched = now - (timings.BRANDS_CHECK_DELAY / 5 * 1000);

        var params = {
            'Fields': 'VentureID,Name,RootURL,ExtensionLoginResourceID'
        };
        const url = DefaultBrandID == BrandID_LocalFile
           ? Environment.GetAssetUrl('Data/Brands.json')
           // we always use socialattache.com to get brands except in local developer case where we'll use the chosen brands URL
           : (DefaultBrandID == BrandID_LocalFile ? getBrand(getBrandID()).RootURL : 'https://socialattache.com') + '/v2/Brands';
        
        ajax.get(url, params, function(resp, httpCode)
        {
            if (resp && httpCode == 200) {
                resp = Json_FromString(resp);
                localData.brands = resp.data
                
               localData.lastBrandsFetched = now;
               Storage.SetLocalVar('Brands', localData);
               
               resolve(localData.brands);
            }
            else if (httpCode == 0 || httpCode == 401) {
                // server unavailable, network error, etc.
                Log_WriteWarning('Server is not available to get brands');
                resolve(localData.brands);
            }
            else {
                Log_WriteError('Error getting brands: ' + httpCode);
                resolve(localData.brands);
            }
        }, true, timings.SHORT_AJAX_REQUEST * 1000);
    })
    .catch(e => { Log_WriteException(e); throw e; });
}

async function getBrandNames() {
    let brands = await getBrands();
    let result = {};
    for (let brandID in brands) {
        result[brandID] = brands[brandID].Name;
    }
    return result;
}

function getBrandID() {
    BrandsInit.brandID = parseInt(DefaultBrandID);
    let localData = Storage.GetLocalVar('Brands', BrandsInit);
    
    return localData.brandID;
}

function setBrandID(brandID) {
    BrandsInit.brandID = parseInt(DefaultBrandID);
    let localData = Storage.GetLocalVar('Brands', BrandsInit);
    
    assert(localData.brands.hasOwnProperty(brandID));
    if (localData.brandID == parseInt(brandID))
        return;
    localData.brandID = parseInt(brandID);
    
    Storage.SetLocalVar('Brands', localData);
    
    let brand = getBrand();
    assert(brand != null);
    _setupBrand(brand);
}

function getBrand() {
    BrandsInit.brandID = parseInt(DefaultBrandID);
    let localData = Storage.GetLocalVar('Brands', BrandsInit);
    
    if (!localData.brands.hasOwnProperty(localData.brandID) && localData.brandID != BrandID_MustChoose) {
        Log_WriteInfo('Brand ' + localData.brandID + ' not available in: ' + Object.keys(localData.brands).join(', '));
        return null;
    }

    return localData.brands[localData.brandID];
}

function _setupBrand(brand) {
    if (brand == null) {
        Log_WriteError('Passed null brand!');
        return CheckBrand_BrandNotSelected;
    }
    
    if (Form_RootUri == brand.RootURL)
        return CheckBrand_BrandReady;
    
    Log_WriteInfo('Setting up brand ' + brand.Name + ' (' + brand.VentureID + ') using ' + (brand.RootURL ? brand.RootURL : 'JSON files'));
    Form_RootUri = brand.RootURL;
    Form_MainUri = brand.RootURL ? brand.RootURL + '/Main.php' : null;
    
    // this must be done after the URLs are set
    if (brand.RootURL)
        InitializeCookies();
    
    userBrandChanged();         // may need to log in, or at least switch accounts
    contactsBrandChanged();
    tagsBrandChanged();
    filtersBrandChanged();
    groupsBrandChanged();
    helpBrandChanged();
    // DRL FIXIT? We should be refreshing the syncs here. For now I suspect each gets removed when the server responds in error (due to wrong account).
    tabManagerBrandChanged();   // refresh tabs so they are updated to use the new brand
    
    return CheckBrand_BrandReady;
}

// returns true if the brand is ready to go, otherwise false
function checkBrand() {
    let brand = getBrand();
    if (brand)
        return _setupBrand(brand);
    
    BrandsInit.brandID = parseInt(DefaultBrandID);
    let localData = Storage.GetLocalVar('Brands', BrandsInit);
    
    if (Object.keys(localData.brands).length > 0)
       return CheckBrand_BrandNotSelected;
    
    Log_WriteError('No branding info, loading it!');
    getBrands()
       .then(resp => {
           if (resp == null) {
               Log_WriteError("Error loading brands, got null!");
           }
           else
               _setupBrand(getBrand());
       })
       .catch(error => {
           Log_WriteError("Error loading brands: " + error);
       });
    
    return CheckBrand_NoBrands;
}