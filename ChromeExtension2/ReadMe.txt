The extension solves a number of issues:
- the contentScriptAugmentation.js script adds buttons to the social media site allowing the user to download posts to our server (to be posted elsewhere), download a persons profile to our server (as a contact), and open the contact record in a new browser tab for a profile.
- the scraper scripts (contentScriptFacebook.js, contentScriptInstagram.js, contentScriptPinterest.js, contentScriptTikTok.js, contentScriptTwitter.js) work in their own tabs that the user doesn't touch, and check the social media site periodically for new messages (sent or received) and imports them to the server, it also polls the server periodically for new actions to perform which can include sending a message, making a post, or importing a profile


This extension usually communicates with a server in order to access an account on the server and get/setup synchronizations between social media accounts and that server account.

For development purposes this extension can be setup to work without a server by reading from files (instead of the server) in the "Data" folder and taking appropriate actions. Content that would normally be sent to the server is sent to a URL like "http://localhost.com/v2/Syncs/" and the response is ignored.

In order to use this extension without a server, in the Config.js file set the URLs to null. Then create the necessary files in the data folder to communicate with your social media accounts. The name of each file is "[Sync Name]_[username or ID].json". You can start by copying one of the existing files and change the name to match the username/ID for your account.

The content of each file is the JSON response that the server would have returned when querying for the sync state for that social media account. An example content follows, comments were added and are not valid for JSON:

{
// the status of the response, a status of "error" would be accompanied by a message
	"status": "success",
	"message": null,
// the actual response data appears here
	"data":
	{
// this is information about the user account on the server
		"UserID": 500,
// this is information about the synchronization account for the requested data source
		"SyncID": 6063,
		"Created": "2021-01-01 00: 26: 12",
		"DataName": "TwitterScrape",
		"AccountID": "560147316",	// this is the account ID for the external data source and sometimes this is a "handle"
		"AccountName": "SaltyFoam",	// the is the account handle and therefore sometimes matches the above
		"SyncTypes": ["message boxes","messages","contacts"],	// the supported data types fo sync, note that posts and user to user messages all fall under "messages" and each message has a "Type" field to denote the difference 
		"AccessToken": "unused",
		"LastSynced": "2021-01-01 00: 26: 12",
		"NextSync": null,
		"SyncData": null,
		"HasTask": 0,
// if there are any posts to post or messages to send they appear here
		"messages":
		[
			{
// this is the ID on the server for this item, and when importing items is should be the ID from the external data source or NO_EXTERNAL_ID if this isn't available (the server will generate an ID), there's also ERROR_EXTERNAL_ID to be used when there is an error sending a message or post
				"Uid": 1,
				"Type": "twitter_msg",
// note that To and From taking an email style identifier and may include the name part
// the ID (1234567) is usually the username but on some social media sites (like Facebook) it's an ID
// the "To" field is always an array (to support group chat later) whereas "From" is always singular
				"To": ["Tom Smith <1234567@fbperid.socialattache.com>"],
				"Body": "Test Message",
// attachments are rarely supported for imported or for outgoing messages, for an outgoing post this could be an image or video (in some cases more than one can be provided)
				"Attachments": [
					{
                        "Type": "image/jpeg",
                        "URL": "https://scontent.frix2-1.fna.fbcdn.net/v/t1.0-9/149067506_2212416525557585_3758536409239667402_o.jpg?_nc_cat=104&ccb=3&_nc_sid=2c4854&_nc_ohc=TJ-fb3nO_XQAX-Gz7OS&_nc_ht=scontent.frix2-1.fna&oh=de4e249cb41de15a4efc7d3a6f1fdfa8&oe=604D3AD8"
                    }
				]
			}
		],
// here the server can request to have a user profile scraped
		"contacts":
		[
			"fran.loubser@fbun.socialattache.com",
			"mylifestyleacademy@fbun.socialattache.com",
			"cliff.halayko@fbun.socialattache.com"
		],
// here the server can request to have new comments for a post downloaded
		"watched_posts":
		[
			{
				"Type": "fbp_post",
				"MessageID": 1,
				"Uid":  "10228338757873298@fb_post.socialattache.com",
				"Url":  "https://www.facebook.com/kat.krasilnikov/posts/10228338757873298",
				"WatcherExpires": "2021-05-01 00:26:12",
				"WatcherResourceID":  null
			}
		]
	}
}

Steps:
1) Make the changes for Config.js
2) Install the extension in Chrome
3) Open the background page
4) Open Common/Log.js and set a breakpoint in Log_WriteError() to catch errors
5) Open a new tab and navigate to a social media site (ie. https://Instagram.com)
6) Open the debugger for the tab and you should see some logging such as "loopInstagram()" and "loopAug()", one will match the site you're viewing (Instagram in this case) whereas the other will always be "loopAug()". The one matching the site is the scraper created by the extension whereas the loopAug() is used in the case of a user opened tab and t will enhance the page in some ways. Each of the two scripts will check whether this is a user tab or a scraper tab and one of the scripts will exit and one will not as a result.
7) While viewing the tab you created and looking at the feed you should see a new icon added to most posts allowing you to download it. This tells you the script is running and has identified this page as a valid and logged in social page.
8) Now if you go to the scraper tab and open the debugger you should see that it's scraped the account info and is polling the background scripts periodically for getAction() which will tell it what to do.
9) If you don't have a file setup for this account in the data folder yet you can create it now containing the information above. Set a breakpoint in the background script Syncs.js inside _getSync() at the ajax.get to see what the filename is that it's looking for and a file to match. My last test was running with "InstagramScrape_socialattache.json" so it's likely the most recent.
10) You can set a breakpoint in the content script after reqGetAction() to check the resp.action to see what it's going to do and then step through anything that interests you 