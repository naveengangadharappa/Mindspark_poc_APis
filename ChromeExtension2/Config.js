const BrandID_LocalFile = 0;                 // local developer setup (Brands.json provides choices such as no server or local server)
const BrandID_MustChoose = -1;               // force the user to choose a brand (from the server options)
const DefaultBrandID = BrandID_LocalFile;   // one of the above or a live brand ID - should be commit as BrandID_MustChoose

// these are defined in Form.js for the content scripts but they may also be used in the background script so
// they must be initialized for that case as well, so we have them here
var Form_RootUri = null;
var Form_MainUri = null;

let LoginUri = null;   // used only for the extension, initialized for the brand

// used just to identify the extension Window so the value doesn't really matter
let ExtensionInfoUrl = 'https://socialattache.com/x550/off-menu/chrome-extension';

// ========================================
// don't touch these...

// used for normalizing mailing addresses and getting the time zone for an address
let GoogleApiKey = 'AIzaSyByOc_tzdSkBKpOz_oq3IDgYxm9cW-2aYQ';
