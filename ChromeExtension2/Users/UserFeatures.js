// Must exactly match PHP code:

let UserFeaturesContacts =              'cont';
let UserFeaturesContactHistories =      'chis';
let UserFeaturesContactTracking =       'ctrk';
let UserFeaturesGroups =                'grps';
let UserFeaturesEvents =                'evnt';
let UserFeaturesTasks =                 'task';
let UserFeaturesTaskCompletions =       'tskc';
let UserFeaturesTags =                  'tags';
let UserFeaturesEditTags =              '+tag';
let UserFeaturesPipeline =              'pipe';
let UserFeaturesEditPipeline =          '+pip';
let UserFeaturesTaskTemplates =         'tskt';
let UserFeaturesEditTaskTemplates =     '+tkt';
let UserFeaturesViewMessages =          'msgs';
let UserFeaturesSendMessages =          'smsg';
let UserFeaturesViewSocialPosts =       'vpst';
let UserFeaturesSendSocialPosts =       'spst';
let UserFeaturesFriendUnfriend =        'frnd';
let UserFeaturesGroupAcceptDecline =    'grmr';
let UserFeaturesDocuments =             'docs';  // can view/edit but not add
let UserFeaturesAddDocuments =          '+doc';
let UserFeaturesTemplates =             'temp';  // can view/edit but not add
let UserFeaturesAddTemplates =          '+tmp';
let UserFeaturesPostsLibrary =          'plib';
let UserFeaturesAddPostsLibrary =       '+plb';
let UserFeaturesSchedulers =            'schd';
let UserFeaturesAddSchedulers =         '+sch';
let UserFeaturesQuizzes =               'quiz';
let UserFeaturesAddQuizzes =            '+quz';
let UserFeaturesTraining =              'trng';
let UserFeaturesCourses =               'crse';
let UserFeaturesHelp =                  'help';
let UserFeaturesVideoFunnels =          'vfnl';
let UserFeaturesWebSequences =          'wbsq';
let UserFeaturesFunnels =               'funl';
let UserFeaturesListservs =             'lsrv';
let UserFeaturesContactTagAutomation =  'ctga';
let UserFeaturesEventTagAutomation =    'etga';
let UserFeaturesFacebookPageAutomation ='fbpa';
let UserFeaturesFacebookGroupAutomation='fbga';
let UserFeaturesGiveawayAutomation =    'giva';
let UserFeaturesIncentiveAutomation =   'inca';
let UserFeaturesAffiliateAutomation =   'affa';
//let UserFeaturesFacebookPublishers =    'fbpu';
//let UserFeaturesBlogPublishers =        'blpu';
let UserFeaturesPublishingCalendar =    'puca';
let UserFeaturesWatchedPosts =          'wpst';
let UserFeaturesChatbots =              'bots';
let UserFeaturesBlogs =                 'blog';
let UserFeaturesDiscussions =           'disc';
let UserFeaturesForums =                'frum';
let UserFeaturesWebinars =              'wbnr';
let UserFeaturesAddWebinars =           '+wbr';
let UserFeaturesWebSites =              'webs';
let UserFeaturesWebSiteTunneling =      'wtun';
let UserFeaturesRequestNotifications =  'noti';
let UserFeaturesSendNotifications =     'snot';
let UserFeaturesSummaryNotifications =  'smry';
let UserFeaturesDefaultReplacements =   'defr';  // user default replacements are always available, this is for flow charts, ventures, etc.
let UserFeaturesECommerce =             'ecom';  // payment processing
let UserFeaturesPlans =                 'plan';  // creating plans to sell
let UserFeaturesTeams =                 'team';
let UserFeaturesCustomContactFields =   'cfld';
let UserFeaturesContactReferrals =      'crfr';
//let UserFeaturesNonCompanyVenture =     'nven';
let UserFeaturesLocales =               'locl';
let UserFeaturesLanguages =             'lang';
let UserFeaturesTranslation =           'trns';
let UserFeaturesSiteTranslator =        'strn';
let UserFeaturesTranscription =         'tscr';
let UserFeaturesInteractiveVideo =      'intv';
let UserFeaturesIssues =                'issu';
let UserFeaturesGiveaways =             'give';
let UserFeaturesTeamIncentives =        'incn';
let UserFeaturesTeamReports =           'tmrp';
let UserFeaturesPromotions =            'prom';
let UserFeaturesAffiliates =            'affi';
// sync providers
let UserFeaturesAppleSync =             '=apl';
let UserFeaturesGoogleSync =            '=ggl';
let UserFeaturesMicrosoftSync =         '=msf';
let UserFeaturesFacebookSync =          '=fbk';
let UserFeaturesInstagramSync =         '=ing';
let UserFeaturesPinterestSync =         '=pin';
let UserFeaturesTikTokSync =            '=tik';
let UserFeaturesTwitterSync =           '=twt';
let UserFeaturesVideoSync =             '=vid';  // GoToMeeting, Zoom
let UserFeaturesSmsSync =               '=sms';  // Twilio
let UserFeaturesEmailSync =             '=eml';  // POP/SMTP/IMAP
// sync data types
let UserFeaturesSyncMessages =          '=msg';
let UserFeaturesSyncContacts =          '=cnt';
let UserFeaturesSyncTasks =             '=tsk';
let UserFeaturesSyncEvents =            '=evt';
//
let UserFeaturesAdmin =                 'admn';

function UserHasFeature(feature)
{
   return Form_RootUri == null || GetCookie('AvailableFeatures', '').indexOf(feature) != -1;
}