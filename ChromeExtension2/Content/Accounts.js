function srctAcs(item){
   return srchPath('Accounts', item);
}

function getFacebookSimpleAccountInfo(){
   let accountInfo = null;
   let acctID = findElement(srctAcs('facebookSimpleAccountId'));
   if (acctID) {
      accountInfo = {
         id: acctID,
         name: null
      }
   }
   return accountInfo;
}
function getFacebookAccountInfo(){
   let accountInfo = null;
   
   if (window.location.hostname == 'mbasic.facebook.com') {
      // in this case the account ID can be obtained from a cookie as the following code
      // doesn't seem to work here
      let cookieID = Utilities_GetDocumentCookie('c_user');
      if (cookieID)
         accountInfo = {id: cookieID, name: null}; // this is for mbasic.facebook.com
   }
   else
   {
      // in this case the account ID can be obtained from a script as the cookie code
      // doesn't seem to work here (returns the wrong ID?)
      let elems = findElements('SCRIPT');
      for (let elem of elems)
      {
         let text = elem.innerText;
         // DRL FIXIT? Perhaps we should JSON.parse() the text like we do for Pinterest to avoid errors with our parsing below?
         if (text.includes('ACCOUNT_ID') && text.includes('USER_ID'))
         {
            try
            {
               let acctID = text.split('"ACCOUNT_ID":"')[1].split('"')[0];
               let userID = text.split('"USER_ID":"')[1].split('"')[0];
               
               if (acctID == 0) {
                  Log_WriteInfo('Empty Facebook Account ID');
                  return null;
               }
               
               // since Facebook allows browsing as a page we only want to act as "logged in" when we are
               // browsing as the user
               if (acctID != userID) {
                  Log_WriteInfo('Not using mismatched Facebook Account ID: ' + acctID + ' User ID: ' + userID);
                  return null;
               }
   
               let err = findElement(srctAcs('facebookAccountErrorMessage'));
               if (err)
               {
                  Log_WriteInfo('Found Facebook account info but also found error message, assuming logged out: ' +
                     err.innerText);
                  return null;
               }

               accountInfo = {
                  name: text.split('"NAME":"')[1].split('"')[0],
                  id: userID
               };
            }
            catch (e)
            {
               // split fails if the content is unexpected, when not logged in
               accountInfo = null;
            }
            break;
         }
      }
      if (accountInfo == null)
         accountInfo = getFacebookSimpleAccountInfo();
      if (accountInfo == null)
         throw new Error("Facebook account info not found at: " + window.location.href);
   }
   return accountInfo;
}

function isLoggedInOnFacebook(){
   return getFacebookAccountInfo() != null;
}

function isLoggedInOnInstagram(){
   if(Utilities_GetDocumentCookie('ds_user_id') == null){
      return false;
   }
   return true;
}
function getInstagramId(){
   return Utilities_GetDocumentCookie('ds_user_id');
}
/*
    Tiktok is using username as uniqueId
 */
async function isLoggedInOnTikTok() {
   let tiktokLocalStorageConfirmation = typeof localStorage['webapp-common-config'] != "undefined";
   return tiktokLocalStorageConfirmation ||
       findElement(srctAcs('tiktokElemCheckLogin')) ||
       Utilities_GetDocumentCookie('cmpl_token');
}
function getTikTokId(){
   return findElement(srctAcs('tiktokGetUid'))
}
function getTikTokUsername(){
   let uid = findElement(srctAcs('tiktokGetUsername'))
   if(uid == null){
      return null;
   }
   uid = uid.split('"')[2]
   return uid;
}
/*
    Same as tiktok two possible methods for tiktok, over cookies or matching a
    variable on the document called uniqueId, is inside a (raw json)/(js object) they add to the document.
    I used the document var
 */
function isLoggedInOnTwitter(){
   if(findElement(srctAcs('twitterElemCheckLogin')) == null){
      return false;
   }
   return true;
}
function getTwitterUsername(){
   let uid = findElement(srctAcs('twitterGetUsername'))
   if(uid == null){
      return null;
   }
   uid = uid.split('"')[2]
   return uid;
}
function getTwitterId(){
   let uid = findElement(srctAcs('twitterGetId'));
   if(uid == null){
      return null;
   }
   uid = uid.replace(srctAcs('twitterGetIdReplace'), '')
   return uid;
}
function isLoggedInOnPinterest(){
   let isAuthenticated = findElement(srctAcs('pinterestElemCheckLogin'))
   if(isAuthenticated == null){
      return false;
   }else if(!isAuthenticated.includes(srctAcs('pinterestElemCheckLoginNeedToInclude'))){
      return false;
   }
   return true;
}

function getPinterestUsername(){
   let uid = null;
   try {
      uid = findElement(srctAcs('pinterestGetUsername'))
   }catch (e){
      return null;
   }
   return uid;
}