if(chrome.declarativeNetRequest.setExtensionActionOptions) {  //Chrome 88
  chrome.declarativeNetRequest.setExtensionActionOptions({displayActionCountAsBadgeText: true});
} else {
  chrome.declarativeNetRequest.setActionCountAsBadgeText(true);
}

chrome.browserAction.onClicked.addListener(tab => {
  const origin = new URL(tab.url).origin;

  chrome.permissions.request({origins: [origin + "/*"]}, granted => {
    if(granted) {
      chrome.storage.local.get(origin, store => {
        if(!store[origin]) {

          const record = {};
          record[origin] = Date.now();

          chrome.storage.local.set(record, () => {
            refreshRules(() => {
              chrome.tabs.executeScript(tab.id, {
                allFrames: true,
                runAt: "document_start",
                file: "inject.js"
              });
            });
            showMsg("toastAdded", new URL(origin).hostname);
          });

        } else {
          chrome.storage.local.remove(origin, () => {
            refreshRules();
          });
          showMsg("toastRemoved", new URL(origin).hostname);
        }
      });
    } else {  //permission denied
      showMsg("toastNoPerm", new URL(origin).hostname);
    }
  });
});

function refreshRules(callback) {
  chrome.storage.local.get(null, store => {
    const origins = Object.keys(store);

    chrome.declarativeNetRequest.getDynamicRules(oldRules => {

      const removeRuleIds = oldRules.map(i => i.id);

      const addRules = origins.map((origin, i) => {
        return {
          id: ++i,
          action: {
            type: "redirect",
            redirect: {
              url: "https://accounts.google.com/gsi/client?"  //keep the ?
            }
          },
          condition: {
            "urlFilter": `|${origin}/accounts.google.com/gsi/client|`
          }
        };
      });

      chrome.declarativeNetRequest.updateDynamicRules(
        {removeRuleIds, addRules},
        () => {
          if(callback) callback();
        }
      );
    });
  });
}

chrome.webNavigation.onDOMContentLoaded.addListener(
  ({tabId, url, frameId}) => {
    if(tabId > 0 && url) {
      const origin = new URL(url).origin;
      if(!origin) return;

      chrome.storage.local.get(origin, store => {
        if(store[origin]) {
          const prop = {
            runAt: "document_start",
            file: "inject.js"
          };
          if(frameId) prop.frameId = frameId;
          chrome.tabs.executeScript(tabId, prop);
        }
      });
      /*chrome.scripting.executeScript({
        target: {
          frameIds: [frameId],
          tabId: tabId
        },
        function: runOnPage
      });*/
    }
  }  
);

function showMsg(id, param) {
  chrome.notifications.create({
    type: "basic",
    message: chrome.i18n.getMessage(id, param),
    title: "",
    iconUrl: chrome.runtime.getURL("icon_48.png")
  });
}