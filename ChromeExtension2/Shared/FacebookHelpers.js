function getAddressFromFacebookProfileOrPageUrl(url) {
   if (url.indexOf('/groups/') != -1) {
      Log_WriteError('getAddressFromFacebookProfileOrPageUrl() called with invalid URL: ' + url);
      assert(0);  // get call stack
      return null;
   }
   
   if (url.indexOf('profile.php') == -1)   // the user hasn't set up a handle yet if we find this
   {
      // get the first segment from a URL like:
      //    https://www.facebook.com/brandyshvr/about_contact_and_basic_info
      let id = Url_GetPath(url).split('/')[0];
      
      // we don't know whether we have a username or a FB ID, so assume the latter if it's all numeric
      if (Utilities_IsInteger(id))
         return id + '@fbperid.socialattache.com';
      else
         return id + '@fbun.socialattache.com';
   }
   else    // the URL will have the format https://www.facebook.com/profile.php?id=100004310352161
   {
      // DRL FIXIT! We are not distinguishing between a profile and a page here.
      const urlParams = new URLSearchParams(new URL(url).search);
      return urlParams.get('id') + '@fbperid.socialattache.com';
   }
}

function getAddressFromFacebookProfilePageOrGroupUrl(url) {
   if (url.indexOf('profile.php') != -1)   // the user hasn't set up a handle yet if we find this
   {
      // the URL will have the format https://www.facebook.com/profile.php?id=100004310352161
      
      // DRL FIXIT! We are not distinguishing between a profile and a page here.
      const urlParams = new URLSearchParams(new URL(url).search);
      let id = urlParams.get('id');
      return id + '@fbperid.socialattache.com';
   }
   
   if (url.indexOf('/groups/') != -1) {
      let i = url.indexOf('/user/');
      if (i != -1) {
         i += 6;
         // the ID comes right after "/user/"
         let id = url.substr(i).split('/')[0]
         return id + '@fbperid.socialattache.com';
      }
      
      // remove the groups segment so we can grab the next one below
      url = Utilities_ReplaceInString(url, '/groups/', '');
   }
   
   // get the first segment from a URL like:
   //    https://www.facebook.com/brandyshvr/about_contact_and_basic_info
   let id = Url_GetPath(url).split('/')[0];
   
   // we don't know whether we have a username or a FB ID, so assume the latter if it's all numeric
   if (Utilities_IsInteger(id))
      return id + '@fbperid.socialattache.com';
   else
      return id + '@fbun.socialattache.com';
}

function getGroupIdAndUserIdFromFacebookGroupUrl(url) {
   // https://www.facebook.com/groups/278163009000489/user/100033656957535/
   if (url.indexOf('/groups/') == -1 || url.indexOf('/user/') == -1) {
      Log_WriteError('Got non-group user URL: ' + url);
      return [null, null];
   }
   
   let i = url.indexOf('?');
   if (i != -1)
      url = url.substr(0, i);
   
   let groupId = url.split('/')[4];
   let userId = url.split('/')[6];
   
   if (!Utilities_IsInteger(groupId) || !Utilities_IsInteger(userId)) {
      Log_WriteError('Got invalid group ID or user ID from group URL: ' + url);
      return [null, null];
   }
   
   return [groupId, userId];
}

async function getAddressFromFacebookProfilePageOrGroup(url) {
   // For group posts the author address looks like this so we grab just the user ID and
   // getFinalUrl() should give us the URL with their username.
   // https://www.facebook.com/groups/278163009000489/user/100033656957535/
   if (url.indexOf('/groups/') != -1) {
      const [groupId, userId] = getGroupIdAndUserIdFromFacebookGroupUrl(url);
      url = 'https://www.facebook.com/' + userId;
   }
      // For video posts the author address looks like this so we strip the ending.
   // https://www.facebook.com/someusername/videos/123456789
   else if (url.indexOf('/videos/') != -1) {
      url = url.substr(0, url.indexOf('/videos/'));
   }
      // For live posts the author address looks like this so we skip over the "watch".
   // https://www.facebook.com/watch/someusername/
   else if (url.indexOf('/watch/') != -1) {
      url = Utilities_ReplaceInString(url, '/watch/', '/');
   }
   
   return getAddressFromFacebookProfileOrPageUrl(await getFinalUrl(url));
}

// Get Post Id From Urls such as:
// https://www.facebook.com/groups/129526895774858/permalink/260904812637065/
// https://www.facebook.com/SurvivalistTips/photos/a.615417841881917/4295387313884933/?type=3
// https://www.facebook.com/radiogazetadojacui/posts/4456533514444729
// https://www.facebook.com/watch/?ref=saved&v=1062559677915713
// https://www.facebook.com/groups/1898519450164808/?hoisted_section_header_type=recently_seen&multi_permalinks=6179158048767572
function getPostIdFromFacebookUrl(url){
   let urlArray = url.split('/')
   let postID = 0;
   
   const multiPermalinksUrl = /(https:\/\/|http:\/\/)?(.*)facebook?(.*)\/groups\/?(.*)multi_permalinks=[0-9]*/gm;
   const groupUrl = /(https:\/\/|http:\/\/)?(.*)facebook?(.*)\/groups/gm;
   const picturePostUrl = /(https:\/\/|http:\/\/)?(.*)facebook?(.*)\/(.*)\/photos\/a.[0-9]*\/[0-9]*/gm;
   const videoWatchPostUrl = /(https:\/\/|http:\/\/)?(.*)facebook?(.*)\/watch\/\?(ref=(.*))(v=[0-9]+)/gm;
   const pagePostUrl = /(https:\/\/|http:\/\/)?(.*)facebook?(.*)\/(.*)\/posts\/([a-zA-Z0-9]+)/gm;
   if (multiPermalinksUrl.test(url)) {
      postID = urlArray[5].slice(urlArray[5].lastIndexOf('=' + 1));
   }
   else if(groupUrl.test(url)){
// DRL William, my URL looked like this and we want the permalink ID I believe?
// https://www.facebook.com/groups/TheGameofNetworking/permalink/2194254430724661/?SA_action=addOrRemoveAutomation
//        postID = urlArray[4]
      postID = urlArray[6]
   }else if(picturePostUrl.test(url)){
      postID = urlArray[6]
   }else if(videoWatchPostUrl.test(url)){
      const idRegex = /(v=[0-9]+)/gm;
      postID = url.match(idRegex)[0].replace('v=', "");
   }else if(pagePostUrl.test(url)){
      postID = urlArray[5]
   }else{
      let m = new URL(url);
      postID = m.searchParams.get('story_fbid');
      if(!postID) {
         m = url.match(/facebook\.([a-z]+)\/([a-z0-9._-]+)\/([a-z]+)\/([0-9]+)/i);
         if (m == null) {
            Log_WriteError('The format of this post URL is not supported: ' + url);
            return null;
         }
         postID = m[4];
      }
   }
   if (!Utilities_IsAlphaNumeric(postID)) {
      Log_WriteError("Got invalid post ID " + postID + " from URL: " + url);
      return null;
   }
   
   return postID;
}

function getMessengerConversationID(url)
{
   let originalUrl = url;
   
   url = Url_StripFragments(Url_StripParams(url));
   
   let i = url.indexOf('/t/');
   if (i == -1) {
      return null;
   }
   url = url.substr(i+3);
   i = url.indexOf('/');
   if (i != -1)
      url = url.substr(0, i);
   if (!Utilities_IsInteger(url)) {
      Log_WriteError("Non-integer conversation ID \"" + url + "\" from: " + originalUrl);
   }
   return url;
}
