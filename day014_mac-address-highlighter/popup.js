document.addEventListener('DOMContentLoaded', () => {
  const toggleHighlight = document.getElementById('toggleHighlight');
  const colorPicker = document.getElementById('colorPicker');
  const macCount = document.getElementById('macCount');

  // Load saved settings
  chrome.storage.sync.get(['enabled', 'color'], (result) => {
    toggleHighlight.checked = result.enabled !== false;
    colorPicker.value = result.color || '#ffff00';
  });

  // Get current count from content script
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getCount'}, (response) => {
      if (response && response.count !== undefined) {
        macCount.textContent = response.count;
      }
    });
  });

  // Toggle highlighting
  toggleHighlight.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({enabled: enabled});
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggle',
        enabled: enabled
      });
    });
  });

  // Change highlight color
  colorPicker.addEventListener('change', (e) => {
    const color = e.target.value;
    chrome.storage.sync.set({color: color});
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'changeColor',
        color: color
      });
    });
  });
});

// Listen for count updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateCount') {
    const macCount = document.getElementById('macCount');
    if (macCount) {
      macCount.textContent = request.count;
    }
  }
});