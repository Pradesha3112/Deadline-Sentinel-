// contentScript.js

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      text: document.body.innerText.substring(0, 5000), // First 5000 chars
      meta: extractMetaInfo()
    };
    sendResponse(pageInfo);
  }
  return true;
});

// Extract meta information from the page
function extractMetaInfo() {
  const metaInfo = {
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: ''
  };
  
  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaInfo.description = metaDesc.getAttribute('content') || '';
  
  // Get meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) metaInfo.keywords = metaKeywords.getAttribute('content') || '';
  
  // Get Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) metaInfo.ogTitle = ogTitle.getAttribute('content') || '';
  
  // Get Open Graph description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) metaInfo.ogDescription = ogDesc.getAttribute('content') || '';
  
  return metaInfo;
}

// Optional: Highlight deadlines on the page
function highlightDeadlines() {
  const deadlineKeywords = ['deadline', 'last date', 'submission ends', 'registration closes'];
  const textNodes = [];
  
  // Find text nodes containing deadline keywords
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.tagName === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        
        const text = node.textContent.toLowerCase();
        if (deadlineKeywords.some(keyword => text.includes(keyword))) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const span = document.createElement('span');
    span.style.backgroundColor = '#fef9c3';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '4px';
    span.style.fontWeight = 'bold';
    span.textContent = node.textContent;
    node.parentNode.replaceChild(span, node);
  }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
  // You can enable this if you want visual highlighting
  // highlightDeadlines();
});

console.log('Hackathon Deadline Tracker content script loaded');