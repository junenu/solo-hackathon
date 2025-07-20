// MAC address patterns
const macPatterns = [
  // Standard format: XX:XX:XX:XX:XX:XX
  /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
  // Cisco format: XXXX.XXXX.XXXX
  /\b([0-9A-Fa-f]{4}\.){2}([0-9A-Fa-f]{4})\b/g,
  // No delimiter format: XXXXXXXXXXXX (12 hex digits)
  /\b(?:[0-9A-Fa-f]{12})\b/g
];

let highlightEnabled = true;
let highlightColor = '#ffff00';
let foundCount = 0;

// Load settings from storage
chrome.storage.sync.get(['enabled', 'color'], (result) => {
  highlightEnabled = result.enabled !== false;
  highlightColor = result.color || '#ffff00';
  if (highlightEnabled) {
    highlightMacAddresses();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    highlightEnabled = request.enabled;
    if (highlightEnabled) {
      highlightMacAddresses();
    } else {
      removeHighlights();
    }
  } else if (request.action === 'changeColor') {
    highlightColor = request.color;
    removeHighlights();
    if (highlightEnabled) {
      highlightMacAddresses();
    }
  } else if (request.action === 'getCount') {
    sendResponse({ count: foundCount });
  }
});

function highlightMacAddresses() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script and style elements
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.classList.contains('mac-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodesToReplace = [];
  let node;

  while (node = walker.nextNode()) {
    const text = node.textContent;
    let hasMatch = false;

    for (const pattern of macPatterns) {
      if (pattern.test(text)) {
        hasMatch = true;
        break;
      }
    }

    if (hasMatch) {
      nodesToReplace.push(node);
    }
  }

  foundCount = 0;
  nodesToReplace.forEach(node => {
    const parent = node.parentNode;
    const text = node.textContent;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const pattern of macPatterns) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, match.index))
          );
        }

        // Add highlighted MAC address
        const span = document.createElement('span');
        span.className = 'mac-highlight';
        span.style.backgroundColor = highlightColor;
        span.style.color = '#000';
        span.style.padding = '2px 4px';
        span.style.borderRadius = '3px';
        span.style.fontWeight = 'bold';
        span.textContent = match[0];
        fragment.appendChild(span);

        lastIndex = match.index + match[0].length;
        foundCount++;
      }
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex))
      );
    }

    if (fragment.childNodes.length > 0) {
      parent.replaceChild(fragment, node);
    }
  });

  // Notify popup of the count
  chrome.runtime.sendMessage({ action: 'updateCount', count: foundCount });
}

function removeHighlights() {
  const highlights = document.querySelectorAll('.mac-highlight');
  highlights.forEach(span => {
    const parent = span.parentNode;
    const text = document.createTextNode(span.textContent);
    parent.replaceChild(text, span);
    parent.normalize();
  });
  foundCount = 0;
}