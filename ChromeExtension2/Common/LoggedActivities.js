// ========================================================================
//        Copyright � 2020 Dominique Lacerte, All Rights Reserved.
// 
// Redistribution and use in source and binary forms are prohibited without 
//   prior written consent from Dominique Lacerte (internet@lacerte.org).
// ========================================================================

// Log client activity to the server.

LoggedActivities =
{
	MiniumSettleTime:	1000,	// page must be viewed at lease this many milliseconds before marking this as a "hit"
	ServerUrl: '/v2/LoggedActivities/',

	queuedActivities: [],

	Init: function(rootNodes)
	{
		// This method can be called multiple times in the Chrome case with an embedded page, so we handle
		// being called multiple times.

		// if the user has stayed on the page for the minimum time we'll send the queued updates
		setTimeout(function()
		{
			// It would be more efficient to combine these into one HTTP request but I believe
			// the case of there being more than one would be very very rare.
			var item = null;
			while (item = LoggedActivities.queuedActivities.shift())
			{
				let resourceID = item['ResourceID'];
				delete(item['ResourceID']);
				item['PageURL'] = window.location.href;
				ajax.post(Form_RootUri + LoggedActivities.ServerUrl + resourceID, item, function(result, httpCode) { });
			}
		}, LoggedActivities.MinimumSettleTime);
	},

	QueueActivities: function(activities)
	{
		LoggedActivities.queuedActivities = LoggedActivities.queuedActivities.concat(activities);
	},

	// bookmarkPosition can be a number or it can be 'read', 'unfinished', 'finished'
	AddViewActivity: function(resourceID, bookmarkPosition, bookmarkFinished)
	{
		ajax.post(
			Form_RootUri + LoggedActivities.ServerUrl + resourceID,
			{
				'BookmarkPosition': bookmarkPosition.toString(),
				'BookmarkFinished': bookmarkFinished.toString(),
				'PageURL': window.location.href
			},
			function(result, httpCode) { }
		);
	},

	GetActivity: function(resourceID, callback)
	{
		ajax.get(
			Form_RootUri + LoggedActivities.ServerUrl + resourceID, {},
			function(data, httpCode)
			{
				data = Json_FromString(data);
				
				if (httpCode != 200) {
					BusyIndicatorStop();
					let msg = data ? data.message : Str('Server is not available to get activity: <0>', httpCode);
					let status = data ? data.status : 'error';
					Log_WriteError(msg);
					DisplayMessage(msg, status);
					return;
				}
				
				callback(data.data);
			}, true, 10 * 1000
		);
	},
}

DocumentLoad.AddCallback(LoggedActivities.Init);
