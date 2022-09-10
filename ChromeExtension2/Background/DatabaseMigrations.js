let DatabaseMigrations =
{
   CurrentVersion: 2,
   
   // Add new migrations here and update the version number above!

   MigrateToVersion2: function ()
   {
      // added the skipCheckingMessagesUntil item to the Facebook background data

      let localData = Storage.GetLocalVar('BG_FB', BackGroundFacebookInit);

      if (!localData.hasOwnProperty('skipCheckingMessagesUntil'))
         localData.skipCheckingMessagesUntil = 0;
      else
         Log_WriteError('BG_FB -> skipCheckingMessagesUntil already exists!');

      Storage.SetLocalVar('BG_FB', localData);

      Migration.DatabaseMigratedOneVersion();
   },

   MigrateToVersion1: function ()
   {
      // the contactInfos are no longer stored in the DB so free up that space
      Storage.SetStorage('Session',
         {
            contactInfos: undefined
         },
         function ()
         {
            Migration.DatabaseMigratedOneVersion();
         });
   }
};
