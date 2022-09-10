function normalizeUrl(url) {
   if (url.startsWith('https://l.facebook.com/l.php?u=')) {
      url = Url_GetParam(url, 'u');             // get the redirect URL
      url = Url_SetParam(url, 'fbclid', null);  // remove this useless thing
   }
   return url;
}

// the incoming format could be with a name prefix "Me <me@me.com>" or basic "me@me.com"
function getRawEmail(email) {
   let i = email.indexOf('<');
   if (i >= 0) {
      i++;
      email = email.substr(i, email.length - i - 1);
   }
   return email;
}

function getEmailPrefix(email) {
   return Url_GetEmailPrefix(getRawEmail(email));
}

function getEmailSuffix(email) {
   return Url_GetEmailSuffix(getRawEmail(email));
}

// this compares the domains in URLs and allows for different suffixes due to
// Pinterest using country specific domains and also ignores the "www" prefix
function fuzzyDomainsMatch(url1, url2) {
   let domain1 = Url_GetDomain(url1).toLowerCase();
   let domain2 = Url_GetDomain(url2).toLowerCase();
   
   domain1 = domain1.substr(0, domain1.lastIndexOf('.'));
   domain2 = domain2.substr(0, domain2.lastIndexOf('.'));
   
   if (domain1.startsWith('www.')) domain1 = domain1.substr(4);
   if (domain2.startsWith('www.')) domain2 = domain2.substr(4);
   
   return domain1 == domain2;
}

function fuzzyUrlStartsWith(url1, url2) {
   if (!fuzzyDomainsMatch(url1, url2))          // ignores minor domain differences
      return false;
   
   // ignores parameters, except for our "View" and "FormProcessor" parameters handled below
   let path1 = Url_GetPath(url1);
   let path2 = Url_GetPath(url2);
   
   // ignores terminating slash
   if (path1.substr(path1.length-1) == '/') path1 = path1.substr(0, path1.length-1);
   if (path2.substr(path2.length-1) == '/') path2 = path2.substr(0, path2.length-1);
   
   // add our "View" and "FormProcessor" parameters
   path1 += '|' + Url_GetParam(url1, 'View') + '|' + Url_GetParam(url1, 'FormProcessor');
   path2 += '|' + Url_GetParam(url2, 'View') + '|' + Url_GetParam(url2, 'FormProcessor');
   
   return path1.startsWith(path2);
}

function fuzzyUrlsMatch(url1, url2) {
   if (url1 == null || url2 == null) {
      Log_WriteWarning('One of the urls was null while comparing, first "' + url1 + '" second "' + url2 + '"');
      return false;
   }
   
   if (!fuzzyDomainsMatch(url1, url2))          // ignores minor domain differences
      return false;
   
   // ignores parameters, except for our "View" and "FormProcessor" parameters handled below
   let path1 = Url_GetPath(url1);
   let path2 = Url_GetPath(url2);
   
   // ignores terminating slash
   if (path1.substr(path1.length-1) == '/') path1 = path1.substr(0, path1.length-1);
   if (path2.substr(path2.length-1) == '/') path2 = path2.substr(0, path2.length-1);
   
   // add our "View" and "FormProcessor" parameters
   path1 += '|' + Url_GetParam(url1, 'View') + '|' + Url_GetParam(url1, 'FormProcessor');
   path2 += '|' + Url_GetParam(url2, 'View') + '|' + Url_GetParam(url2, 'FormProcessor');
   
   return path1 == path2;
}

function contactsPageUrl() {
    if (Form_MainUri != null)
        return Form_MainUri + '?View=Home,MyBusiness,Contacts';
    return null;
}

function publisherPageUrl() {
    if (Form_MainUri != null)
        return Form_MainUri + '?View=Home,MyBusiness,Publisher';
    return null;
}

function syncsPageUrl() {
    if (Form_MainUri != null)
        return Form_MainUri + '?View=Home,Settings,Syncs';
    return null;
}

// pattern: would usually be an entry from constantPaths in Constants.js
// replacements: is a name=>value hash of replacements to use in the pattern (i.e. "{{name}}" is replaced with "value")
function buildUrl(pattern, replacements) {
   // provide some defaults from the current page if not passed in (only makes sense from content script)
   if (!replacements.hasOwnProperty('Scheme')) replacements['Scheme'] = window.location.protocol + '//';
   if (!replacements.hasOwnProperty('Domain')) replacements['Domain'] = window.location.hostname;
   if (!replacements.hasOwnProperty('Path')) replacements['Path'] = window.location.pathname;
   if (!replacements.hasOwnProperty('Parameters')) replacements['Parameters'] = window.location.search;
   
   let url = pattern;
   for (let name in replacements)
   {
      url = Utilities_ReplaceInString(url, '{{' + name + '}}', replacements[name]);
   }
   return url;
}

function loadConstantsFromJson(str) {
   // The response contains some variables that we need to extract, parse and assign locally.
   // Theses variables must appear in this order:
   const variables = [
      'constants',
      'timings',
      'elementPaths',
      'localizedKeywords',
      'constantStyles',
      'constantPaths'
   ];
   let iStart = [];
   let i = 0;
   for (let varName of variables)
   {
      iStart[i] = str.indexOf(varName + ' =');
      if (iStart[i] == -1) {
         Log_WriteError('Got invalid constants from server with length ' + str.length + ' while looking for ' + varName);
         return;
      }
      iStart[i] += varName.length + 2;
      i++;
   }
   for (i = 0; i < variables.length; i++)
   {
      let varName = variables[i];
      let nextStart = iStart.length > i+1
         ? iStart[i+1]
         : str.length;
      let iEnd = str.lastIndexOf(';', nextStart);
      assert(iEnd != -1);
      let value = Json_FromString(Json_ConvertJavaScriptToJson(str.substr(iStart[i], iEnd - iStart[i])));
      window[varName] = value;
   }
}

// takes the form "fbp:username@fbun.socialattache.com" in it's various social ID types and the PROTOCOL IS OPTIONAL
// generalizes numeric FB page and FB person IDs into a common format so they are interchangeable for lookup
function normalizeContactAddress(addr)
{
   // make sure we're dealing with just the raw address
//   assert(addr.indexOf(':') != -1);
   assert(addr.indexOf('<') == -1);
   // use lowercase here so we can find case insensitive
   addr = addr.toLowerCase();
   // the Messenger client code can't tell the difference between pages and contacts so
   // we use a common ID style so they're interchangeable for lookups
   addr = Utilities_ReplaceInString(addr, '@fbperid.socialattache.com', '@numid.socialattache.com')
   addr = Utilities_ReplaceInString(addr, '@fbpage.socialattache.com', '@numid.socialattache.com')
   
   return addr;
}