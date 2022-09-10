// DRL FIXIT! I believe this is not used, and if it is it should be replaced with: !Browser.IsExtension()
chrome = { IsApp: true };

webvViewDetails = {
  ...webvViewDetails,
    TabId: 0,
    WindowId: 0,
    Url: '',
    IsVisible: true,
}

var AddTabCreatedHandlers = [];

var AddTabRemovedHandlers = [];

var AddWindowCreatedHandlers = [];

var AddWindowRemovedHandlers = [];