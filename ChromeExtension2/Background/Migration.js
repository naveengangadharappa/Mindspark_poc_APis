let Migration =
{
   IsMigrating: false,  // other code can check this flag to delay operations during migration

   MigrateDatabase: function ()
   {
      Storage.GetStorage('Migration', 'databaseVersion', function (data)
         {
            if (!data.hasOwnProperty('databaseVersion'))
               data.databaseVersion = DatabaseMigrations.CurrentVersion;
            
            if (data.databaseVersion < DatabaseMigrations.CurrentVersion)
            {
               Migration.IsMigrating = true;

               data.databaseVersion++;
               Log_WriteInfo("**** Migrating to version " + data.databaseVersion);
               
               DatabaseMigrations['MigrateToVersion' + data.databaseVersion]();
            }
         });
   },
   
   DatabaseMigratedOneVersion: function()
   {
      Storage.GetStorage('Migration', 'databaseVersion', function (data)
      {
         assert(data.hasOwnProperty('databaseVersion'));
         assert(data.databaseVersion < DatabaseMigrations.CurrentVersion);

         data.databaseVersion++;
      
         Storage.SetStorage('Migration',
            {
               databaseVersion: data.databaseVersion
            },
            function ()
            {
               Log_WriteInfo("**** Migrated to version " + data.databaseVersion);
               
               if (data.databaseVersion < DatabaseMigrations.CurrentVersion)
                  Migration.MigrateDatabase();  // migrate to next version
               else
                  Migration.IsMigrating = false;// finished migrations
            });
      });
   }
};

Migration.MigrateDatabase();  // initiate database migration