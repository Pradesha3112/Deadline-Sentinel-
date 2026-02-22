// popup.js

class HackathonTracker {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadAndRenderEvents();
    this.startDateTimeUpdater();
  }

  initializeElements() {
    this.saveBtn = document.getElementById('saveCurrent');
    this.exportBtn = document.getElementById('exportCSV');
    this.clearBtn = document.getElementById('clearAll');
    this.tableBody = document.getElementById('tableBody');
    this.totalEventsSpan = document.getElementById('totalEvents');
    this.totalPlatformsSpan = document.getElementById('totalPlatforms');
    this.todayRegistrationsSpan = document.getElementById('todayRegistrations');
    this.avgDaysLeftSpan = document.getElementById('avgDaysLeft');
    this.currentDateTimeSpan = document.getElementById('currentDateTime');
  }

  attachEventListeners() {
    this.saveBtn.addEventListener('click', () => this.saveCurrentHackathon());
    this.exportBtn.addEventListener('click', () => this.exportToCSV());
    this.clearBtn.addEventListener('click', () => this.clearAllData());
  }

  startDateTimeUpdater() {
    this.updateCurrentDateTime();
    // Update every second
    setInterval(() => this.updateCurrentDateTime(), 1000);
  }

  updateCurrentDateTime() {
    if (this.currentDateTimeSpan) {
      const now = new Date();
      const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      this.currentDateTimeSpan.textContent = now.toLocaleString('en-US', options);
    }
  }

  calculateDaysLeft(deadlineString) {
    if (!deadlineString || deadlineString === 'Not specified' || deadlineString === 'Not found') {
      return null;
    }

    // Try to parse the deadline string
    const deadline = this.parseDeadline(deadlineString);
    if (!deadline) return null;

    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  parseDeadline(deadlineString) {
    // Common date formats
    const patterns = [
      // Format: "December 15, 2025" or "15 December 2025"
      {
        regex: /(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})/i,
        parse: (match) => {
          const month = this.getMonthNumber(match[2]);
          return new Date(parseInt(match[3]), month, parseInt(match[1]));
        }
      },
      // Format: "Jan 15, 2025"
      {
        regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i,
        parse: (match) => {
          const month = this.getMonthNumber(match[1]);
          return new Date(parseInt(match[3]), month, parseInt(match[2]));
        }
      },
      // Format: "2025-12-15" or "2025/12/15"
      {
        regex: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        parse: (match) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      },
      // Format: "15-12-2025" or "15/12/2025"
      {
        regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        parse: (match) => new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
      }
    ];

    for (const pattern of patterns) {
      const match = deadlineString.match(pattern.regex);
      if (match) {
        const date = pattern.parse(match);
        // Check if date is valid
        if (date instanceof Date && !isNaN(date)) {
          return date;
        }
      }
    }

    // Try native Date parsing as fallback
    const date = new Date(deadlineString);
    if (date instanceof Date && !isNaN(date)) {
      return date;
    }

    return null;
  }

  getMonthNumber(monthStr) {
    const months = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    const key = monthStr.toLowerCase().substring(0, 3);
    return months[key] || 0;
  }

  getDaysLeftDisplay(daysLeft) {
    if (daysLeft === null) {
      return '<span class="days-left-badge days-left-expired">❓</span>';
    }
    
    if (daysLeft < 0) {
      return `<span class="days-left-badge days-left-expired" title="Deadline passed ${Math.abs(daysLeft)} days ago">⏰ Expired</span>`;
    } else if (daysLeft === 0) {
      return '<span class="days-left-badge days-left-urgent" title="Due today!">🔥 Today!</span>';
    } else if (daysLeft <= 3) {
      return `<span class="days-left-badge days-left-urgent" title="Only ${daysLeft} days left!">⚠️ ${daysLeft}d</span>`;
    } else if (daysLeft <= 7) {
      return `<span class="days-left-badge days-left-warning" title="${daysLeft} days left">📅 ${daysLeft}d</span>`;
    } else {
      return `<span class="days-left-badge days-left-good" title="${daysLeft} days left">✅ ${daysLeft}d</span>`;
    }
  }

  calculateAverageDaysLeft(hackathons) {
    const validDays = hackathons
      .map(event => this.calculateDaysLeft(event.deadline))
      .filter(days => days !== null && days >= 0);
    
    if (validDays.length === 0) return '-';
    
    const average = validDays.reduce((a, b) => a + b, 0) / validDays.length;
    return average.toFixed(1);
  }

  async saveCurrentHackathon() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const pageTitle = document.title;
          const bodyText = document.body.innerText;
          const url = window.location.href;
          
          const deadlineElements = [];
          const selectors = [
            '[class*="deadline"]', '[class*="Deadline"]',
            '[class*="date"]', '[class*="Date"]',
            '[class*="time"]', '[class*="Time"]',
            '[id*="deadline"]', '[id*="Deadline"]',
            '[id*="date"]', '[id*="Date"]',
            '.submission-end', '.registration-close',
            '.event-date', '.hackathon-date'
          ];
          
          selectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el.textContent && el.textContent.trim()) {
                  deadlineElements.push(el.textContent.trim());
                }
              });
            } catch (e) {}
          });
          
          return { 
            pageTitle, 
            bodyText, 
            url,
            deadlineElements: [...new Set(deadlineElements)]
          };
        }
      });

      const { pageTitle, bodyText, url, deadlineElements } = results[0].result;
      
      const eventData = this.extractEventData(pageTitle, bodyText, url, deadlineElements);
      
      await this.saveEventToStorage(eventData);
      await this.loadAndRenderEvents();
      
      this.showNotification('✅ Event saved successfully!');
    } catch (error) {
      console.error('Error saving hackathon:', error);
      this.showNotification('❌ Error saving event', true);
    }
  }

  extractEventData(title, bodyText, url, deadlineElements = []) {
    // Platform detection
    let source = 'Other';
    if (url.includes('unstop.com')) source = 'Unstop';
    else if (url.includes('devpost.com')) source = 'Devpost';
    else if (url.includes('mlh.io')) source = 'MLH';
    else if (url.includes('hackathon.com')) source = 'Hackathon.com';
    else if (url.includes('lu.ma')) source = 'Luma';
    else if (url.includes('partiful.com')) source = 'Partiful';
    else if (url.includes('eventbrite.com')) source = 'Eventbrite';
    else if (url.includes('meetup.com')) source = 'Meetup';
    
    const deadline = this.extractDeadline(bodyText, deadlineElements);
    const action = this.determineAction(bodyText, title);
    
    let eventName = title
      .replace(/\s*\|\s*.*$/, '')
      .replace(/\s*-\s*.*$/, '')
      .replace(/(Unstop|Devpost|MLH).*$/i, '')
      .replace(/\s+\|\s+.*$/, '')
      .replace(/\s+-\s+.*$/, '')
      .trim();
    
    if (eventName.length < 5 || eventName === 'Unknown Event') {
      const h1Match = bodyText.match(/^([^\n]{10,100})/m);
      if (h1Match) {
        eventName = h1Match[1].trim();
      }
    }
    
    if (eventName.length > 50) {
      eventName = eventName.substring(0, 47) + '...';
    }
    
    const uniqueId = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + Math.floor(Math.random() * 10000);
    
    return {
      id: uniqueId,
      eventName: eventName || 'Unknown Event',
      deadline: deadline,
      source: source,
      action: action,
      link: url,
      registeredDate: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
  }

  extractDeadline(text, deadlineElements = []) {
    if (!text) return 'Not specified';
    
    const allText = text + ' ' + deadlineElements.join(' ');
    
    const patterns = [
      /deadline:\s*([^\n.!?]+)/i,
      /last date:\s*([^\n.!?]+)/i,
      /submission ends:\s*([^\n.!?]+)/i,
      /registration closes:\s*([^\n.!?]+)/i,
      /ends on:\s*([^\n.!?]+)/i,
      /closing date:\s*([^\n.!?]+)/i,
      /apply by:\s*([^\n.!?]+)/i,
      /due date:\s*([^\n.!?]+)/i,
      /(?:by|before|until)\s+(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
      /(?:by|before|until)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:by|before|until)\s+(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
      /submissions? dead\w*:?\s*([^\n.!?]+)/i,
      /registrations? dead\w*:?\s*([^\n.!?]+)/i,
      /applications? dead\w*:?\s*([^\n.!?]+)/i,
      /clos(?:es|ing)\s+(?:on|date)?:?\s*([^\n.!?]+)/i,
      /ends?\s+(?:on)?:?\s*([^\n.!?]+)/i,
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s+(?:on|,)?\s*[^.!?\n]{5,30})/i,
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})/i,
      /registrations?\s+(?:close|end)s?:?\s*([^\n.!?]+)/i,
      /submission\s+period\s+ends?\s*:?\s*([^\n.!?]+)/i,
      /hackathon\s+ends?\s*:?\s*([^\n.!?]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = allText.match(pattern);
      if (match && match[1]) {
        let deadline = match[1].trim();
        deadline = deadline.replace(/^(?:on|at|by|before|until)\s+/i, '');
        deadline = deadline.replace(/[.,;:\s]+$/, '');
        
        if (deadline.match(/\d+/) || deadline.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
          return deadline;
        }
      }
    }
    
    if (deadlineElements && deadlineElements.length > 0) {
      for (const element of deadlineElements) {
        if (element.match(/\d+/) || element.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
          return element.substring(0, 100);
        }
      }
    }
    
    const datePatterns = [
      /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/i,
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
      /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/i,
      /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return 'Not specified';
  }

  determineAction(text, title) {
    const textLower = (text + ' ' + title).toLowerCase();
    
    if (textLower.includes('submit project') || 
        textLower.includes('submission') || 
        textLower.includes('submit your') ||
        textLower.includes('project submission')) {
      return 'Submit project';
    } else if (textLower.includes('attend workshop') || 
               textLower.includes('workshop') ||
               textLower.includes('attend event')) {
      return 'Attend workshop';
    } else if (textLower.includes('register') || 
               textLower.includes('sign up') ||
               textLower.includes('registration')) {
      return 'Register only';
    }
    
    return 'Register only';
  }

  async saveEventToStorage(eventData) {
    const result = await chrome.storage.local.get(['hackathons']);
    let hackathons = result.hackathons || [];
    
    hackathons = hackathons.map(event => {
      if (!event.id) {
        event.id = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      return event;
    });
    
    const isDuplicate = hackathons.some(h => 
      h.link === eventData.link && 
      (Date.now() - h.timestamp) < 86400000
    );
    
    if (!isDuplicate) {
      hackathons.unshift(eventData);
      await chrome.storage.local.set({ hackathons });
    } else {
      throw new Error('Duplicate event');
    }
  }

  async loadAndRenderEvents() {
    const result = await chrome.storage.local.get(['hackathons']);
    let hackathons = result.hackathons || [];
    
    hackathons = hackathons.map(event => {
      if (!event.id) {
        event.id = 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      return event;
    });
    
    if (JSON.stringify(result.hackathons) !== JSON.stringify(hackathons)) {
      await chrome.storage.local.set({ hackathons });
    }
    
    this.renderTable(hackathons);
    this.updateStats(hackathons);
  }

  renderTable(hackathons) {
    if (!hackathons || hackathons.length === 0) {
      this.tableBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="8">
            <div class="empty-message">
              📋 No events saved yet. Click "Save Current" to start tracking!
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    hackathons.forEach(event => {
      const eventId = this.escapeHtml(event.id || 'no-id-' + Date.now());
      const daysLeft = this.calculateDaysLeft(event.deadline);
      const daysLeftDisplay = this.getDaysLeftDisplay(daysLeft);
      const deadlineTooltip = daysLeft !== null ? 
        `Deadline: ${event.deadline} (${daysLeft >= 0 ? daysLeft + ' days left' : 'Expired'})` : 
        `Deadline: ${event.deadline}`;
      
      html += `
        <tr data-id="${eventId}">
          <td title="${this.escapeHtml(event.eventName)}">${this.truncateText(this.escapeHtml(event.eventName), 25)}</td>
          <td><span class="deadline-badge deadline-tooltip" data-tooltip="${deadlineTooltip}">${this.escapeHtml(event.deadline)}</span></td>
          <td>${daysLeftDisplay}</td>
          <td><span class="platform-badge">${this.escapeHtml(event.source)}</span></td>
          <td>${this.escapeHtml(event.action)}</td>
          <td><a href="${this.escapeHtml(event.link)}" target="_blank" class="event-link" title="${this.escapeHtml(event.link)}">${this.truncateText(this.escapeHtml(event.link), 30)}</a></td>
          <td>${this.escapeHtml(event.registeredDate)}</td>
          <td>
            <button class="delete-btn" data-id="${eventId}" title="Delete event">
              🗑️
            </button>
          </td>
        </tr>
      `;
    });
    
    this.tableBody.innerHTML = html;
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const eventId = btn.getAttribute('data-id');
        if (eventId) {
          this.confirmDeleteEvent(eventId);
        }
      });
    });
  }

  confirmDeleteEvent(eventId) {
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'delete-confirm-dialog';
    dialog.style.cssText = `
      background-color: var(--bg-primary);
      border-radius: 12px;
      padding: 24px;
      max-width: 300px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    `;
    
    dialog.innerHTML = `
      <h3 style="margin-bottom: 12px; color: var(--text-primary);">Delete Event</h3>
      <p style="margin-bottom: 20px; color: var(--text-secondary);">Are you sure you want to delete this event?</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="delete-confirm-btn cancel" style="padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border);">Cancel</button>
        <button class="delete-confirm-btn delete" style="padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background-color: #ef4444; color: white;">Delete</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    dialog.querySelector('.cancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    dialog.querySelector('.delete').addEventListener('click', async () => {
      document.body.removeChild(overlay);
      await this.deleteEvent(eventId);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  async deleteEvent(eventId) {
    try {
      const result = await chrome.storage.local.get(['hackathons']);
      let hackathons = result.hackathons || [];
      
      const rowToDelete = document.querySelector(`tr[data-id="${eventId}"]`);
      
      if (rowToDelete) {
        rowToDelete.style.transition = 'all 0.3s ease';
        rowToDelete.style.opacity = '0';
        rowToDelete.style.transform = 'translateX(20px)';
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      hackathons = hackathons.filter(event => event.id !== eventId);
      
      await chrome.storage.local.set({ hackathons });
      
      await this.loadAndRenderEvents();
      
      this.showNotification('✅ Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event: ' + error.message);
    }
  }

  updateStats(hackathons) {
    this.totalEventsSpan.textContent = hackathons.length;
    
    const platforms = new Set(hackathons.map(h => h.source));
    this.totalPlatformsSpan.textContent = platforms.size;
    
    const today = new Date().toISOString().split('T')[0];
    const todayCount = hackathons.filter(h => h.registeredDate === today).length;
    this.todayRegistrationsSpan.textContent = todayCount;
    
    const avgDaysLeft = this.calculateAverageDaysLeft(hackathons);
    this.avgDaysLeftSpan.textContent = avgDaysLeft;
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  async exportToCSV() {
    const result = await chrome.storage.local.get(['hackathons']);
    const hackathons = result.hackathons || [];
    
    if (hackathons.length === 0) {
      this.showNotification('❌ No data to export', true);
      return;
    }
    
    const headers = ['Event Name', 'Deadline', 'Days Left', 'Source', 'Action', 'Link', 'Registered Date'];
    
    const csvContent = [
      headers.join(','),
      ...hackathons.map(event => {
        const daysLeft = this.calculateDaysLeft(event.deadline);
        const daysLeftText = daysLeft !== null ? daysLeft.toString() : 'N/A';
        
        return [
          `"${event.eventName.replace(/"/g, '""')}"`,
          `"${event.deadline.replace(/"/g, '""')}"`,
          `"${daysLeftText}"`,
          `"${event.source}"`,
          `"${event.action}"`,
          `"${event.link}"`,
          `"${event.registeredDate}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hackathon-deadlines-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('✅ CSV exported successfully!');
  }

  async clearAllData() {
    if (confirm('Are you sure you want to delete ALL saved events? This cannot be undone.')) {
      await chrome.storage.local.remove(['hackathons']);
      await this.loadAndRenderEvents();
      this.showNotification('🗑️ All events cleared');
    }
  }

  showNotification(message, isError = false) {
    if (isError) {
      alert(message);
    } else {
      console.log(message);
      if (this.saveBtn) {
        this.saveBtn.style.backgroundColor = '#10b981';
        setTimeout(() => {
          if (this.saveBtn) {
            this.saveBtn.style.backgroundColor = '';
          }
        }, 200);
      }
    }
  }
}

// Theme toggle and initialization
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  
  chrome.storage.local.get(['theme'], (result) => {
    const savedTheme = result.theme || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
      themeToggle.checked = savedTheme === 'dark';
    }
  });
  
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      chrome.storage.local.set({ theme: newTheme });
    });
  }
  
  // Initialize the tracker
  new HackathonTracker();
});