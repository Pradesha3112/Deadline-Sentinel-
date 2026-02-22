// background.js

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize storage with empty array
    chrome.storage.local.set({ hackathons: [] }, () => {
      console.log('Hackathon Deadline Tracker initialized');
    });
    
    // Open welcome page (optional - comment out if you don't want this)
    // chrome.tabs.create({
    //   url: 'https://github.com/yourusername/hackathon-deadline-tracker#readme'
    // });
  } else if (details.reason === 'update') {
    console.log('Extension updated to version', chrome.runtime.getManifest().version);
  }
  
  // Create context menu safely
  try {
    if (chrome.contextMenus) {
      chrome.contextMenus.create({
        id: 'save-hackathon',
        title: 'Save to Hackathon Tracker',
        contexts: ['page', 'link']
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('Context menu error (expected if already created):', chrome.runtime.lastError);
        }
      });
    }
  } catch (error) {
    console.log('Context menus not available:', error);
  }
});

// Listen for context menu clicks safely
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'save-hackathon') {
      // Trigger save action
      chrome.tabs.sendMessage(tab.id, { action: 'saveFromContextMenu' }).catch(() => {
        console.log('Could not send message to tab');
      });
    }
  });
}

// Listen for tab updates to detect hackathon pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a hackathon platform
    const hackathonPlatforms = ['unstop.com', 'devpost.com', 'mlh.io', 'hackathon.com'];
    const isHackathonPage = hackathonPlatforms.some(platform => tab.url.includes(platform));
    
    if (isHackathonPage) {
      // Optionally show page action or badge
      try {
        chrome.action.setBadgeText({
          tabId: tabId,
          text: '📅'
        });
        
        chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: '#6366f1'
        });
      } catch (error) {
        console.log('Could not set badge:', error);
      }
    }
  }
});

// Keep service worker alive
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes);
});

console.log('Hackathon Deadline Tracker background service worker running');