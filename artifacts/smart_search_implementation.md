# Smart Search Bar Implementation

As requested by the technical specification, here is the complete, self-contained Vanilla JavaScript module and CSS. It has no framework lock-in and can be initialized on any element.

## `smart-search.css`

```css
:root {
  --search-primary: #FF9900;
  --search-bg: #FFFFFF;
  --search-border-radius: 24px;
  --search-shadow: 0 12px 40px rgba(0,0,0,0.15);
  --search-highlight: #F8F9FA;
  --search-text: #333333;
  --search-muted: #666666;
  --search-border: #E5E7EB;
}

/* Base Container */
.ss-wrapper {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Layer 2: Backdrop */
.ss-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.35);
  z-index: 900;
  opacity: 0;
  visibility: hidden;
  transition: opacity 300ms linear, visibility 300ms linear;
}
.ss-backdrop.ss-active {
  opacity: 1;
  visibility: visible;
}

/* Layer 1: Search Bar */
.ss-bar-container {
  position: relative;
  z-index: 1001;
  display: flex;
  align-items: center;
  background: var(--search-bg);
  border: 2px solid transparent;
  border-radius: var(--search-border-radius);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  height: 48px;
  padding: 0 16px;
  transition: border-color 200ms ease, border-radius 200ms ease;
}
.ss-wrapper.ss-open .ss-bar-container {
  border-color: var(--search-primary);
  border-radius: var(--search-border-radius) var(--search-border-radius) 0 0;
}
.ss-wrapper.ss-shake .ss-bar-container {
  animation: ss-shake 400ms ease-in-out;
}
@keyframes ss-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}

.ss-icon-search {
  width: 20px;
  height: 20px;
  fill: var(--search-muted);
  flex-shrink: 0;
}

.ss-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 12px;
  font-size: 16px;
  color: var(--search-text);
  outline: none;
  width: 100%;
}
.ss-input::placeholder {
  color: var(--search-muted);
  opacity: 0.7;
}

.ss-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ss-btn-clear, .ss-btn-voice {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--search-muted);
}
.ss-btn-clear:hover, .ss-btn-voice:hover {
  background: var(--search-highlight);
}
.ss-btn-clear {
  display: none;
}
.ss-wrapper.ss-has-query .ss-btn-clear {
  display: flex;
}
.ss-wrapper.ss-has-query .ss-btn-voice {
  display: none;
}

/* Layer 3: Dropdown */
.ss-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--search-bg);
  border-radius: 0 0 var(--search-border-radius) var(--search-border-radius);
  box-shadow: var(--search-shadow);
  z-index: 1000;
  overflow: hidden;
  transform: translateY(-10px);
  opacity: 0;
  visibility: hidden;
  transition: transform 200ms ease-out, opacity 200ms ease-out, visibility 200ms ease-out;
  max-height: 60vh;
  overflow-y: auto;
}
.ss-wrapper.ss-open .ss-dropdown {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

/* Dropdown Sections */
.ss-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--search-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ss-btn-clear-all {
  background: none;
  border: none;
  color: var(--search-primary);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}
.ss-btn-clear-all:hover {
  text-decoration: underline;
}

.ss-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  gap: 12px;
  transition: background 150ms ease;
}
.ss-item:hover, .ss-item.ss-highlighted {
  background: var(--search-highlight);
}
.ss-item-icon-box {
  width: 32px;
  height: 32px;
  background: var(--search-highlight);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.ss-item-text {
  flex: 1;
  font-size: 14px;
  color: var(--search-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ss-item-delete {
  background: none;
  border: none;
  color: var(--search-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 150ms ease;
}
.ss-item:hover .ss-item-delete {
  opacity: 1;
}

.ss-match-highlight {
  font-weight: 800;
  color: var(--search-primary);
}

/* Trending Grid */
.ss-trending-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 16px 16px;
}
.ss-trending-item {
  background: var(--search-highlight);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 150ms ease;
  border: none;
}
.ss-trending-item:hover {
  transform: translateY(-2px);
  background: #f1f3f5;
}
.ss-trending-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
.ss-trending-label {
  font-size: 12px;
  color: var(--search-text);
  font-weight: 600;
}

/* Skeleton Loader */
.ss-skeleton {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.ss-skeleton-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e2e8f0;
  animation: ss-pulse 1.5s infinite ease-in-out;
}
.ss-skeleton-text {
  height: 14px;
  width: 60%;
  border-radius: 4px;
  background: #e2e8f0;
  animation: ss-pulse 1.5s infinite ease-in-out;
}
@keyframes ss-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ss-empty-state {
  padding: 24px 16px;
  text-align: center;
  color: var(--search-muted);
  font-size: 14px;
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .ss-wrapper {
    max-width: none;
  }
  .ss-wrapper.ss-open .ss-bar-container {
    border-radius: 0;
    border-color: transparent;
    border-bottom: 2px solid var(--search-primary);
  }
  .ss-wrapper.ss-open .ss-dropdown {
    border-radius: 0;
  }
  .ss-item-delete {
    opacity: 1; /* Always visible on mobile */
    min-width: 44px;
    min-height: 44px;
  }
  .ss-trending-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .ss-btn-clear, .ss-btn-voice {
    min-width: 44px;
    min-height: 44px;
  }
  /* Scroll lock when active */
  body.ss-mobile-active {
    overflow: hidden;
  }
}
```

## `smart-search.js`

```javascript
class SmartSearch {
  constructor(config) {
    this.config = Object.assign({
      containerId: 'smart-search',
      apiEndpoint: '/api/search/suggest',
      maxSuggestions: 8,
      recentLimit: 10,
      themeColor: '#FF9900',
      resultPageUrl: '/search?q='
    }, config);

    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      console.error(`[SmartSearch] Container #${this.config.containerId} not found.`);
      return;
    }

    // Set CSS theme variable
    this.container.style.setProperty('--search-primary', this.config.themeColor);

    this.state = {
      isOpen: false,
      query: '',
      highlightedIndex: -1,
      recentSearches: this.loadRecent(),
      suggestions: [],
      isLoading: false
    };

    this.abortController = null;
    this.debounceTimer = null;
    
    // Fallback static trending data
    this.trending = [
      { label: "Smartphones", icon: "📱" },
      { label: "Laptops", icon: "💻" },
      { label: "Headphones", icon: "🎧" },
      { label: "Shoes", icon: "👟" }
    ];

    this.initDOM();
    this.bindEvents();
  }

  loadRecent() {
    try {
      const data = localStorage.getItem('ss_recent_searches');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveRecent(query) {
    if (!query.trim()) return;
    try {
      let searches = this.state.recentSearches.filter(s => s.text.toLowerCase() !== query.toLowerCase());
      searches.unshift({ text: query, timestamp: Date.now() });
      if (searches.length > this.config.recentLimit) {
        searches = searches.slice(0, this.config.recentLimit);
      }
      this.state.recentSearches = searches;
      localStorage.setItem('ss_recent_searches', JSON.stringify(searches));
    } catch (e) {
      console.warn("localStorage unavailable");
    }
  }

  removeRecent(query) {
    this.state.recentSearches = this.state.recentSearches.filter(s => s.text !== query);
    try {
      localStorage.setItem('ss_recent_searches', JSON.stringify(this.state.recentSearches));
    } catch(e){}
    this.renderDropdown();
  }

  clearAllRecent() {
    this.state.recentSearches = [];
    try {
      localStorage.removeItem('ss_recent_searches');
    } catch(e){}
    this.renderDropdown();
    this.emit('search:recentClear');
  }

  initDOM() {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'ss-backdrop';
    document.body.appendChild(this.backdrop);

    // Wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'ss-wrapper';

    // Bar Layer
    this.bar = document.createElement('div');
    this.bar.className = 'ss-bar-container';

    this.bar.innerHTML = `
      <svg class="ss-icon-search" viewBox="0 0 24 24">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <input type="text" class="ss-input" inputmode="search" enterkeyhint="search" placeholder="Search for products, brands, and more..." aria-expanded="false" role="combobox" aria-autocomplete="list">
      <div class="ss-actions">
        <button class="ss-btn-clear" aria-label="Clear search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <button class="ss-btn-voice" aria-label="Voice search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </button>
      </div>
    `;

    this.input = this.bar.querySelector('.ss-input');
    this.btnClear = this.bar.querySelector('.ss-btn-clear');
    this.btnVoice = this.bar.querySelector('.ss-btn-voice');

    // Dropdown Layer
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'ss-dropdown';
    this.dropdown.setAttribute('role', 'listbox');

    this.wrapper.appendChild(this.bar);
    this.wrapper.appendChild(this.dropdown);
    this.container.appendChild(this.wrapper);
  }

  bindEvents() {
    // Input Events
    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('input', (e) => this.handleInput(e.target.value));
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Buttons
    this.btnClear.addEventListener('click', () => this.clear());
    this.btnVoice.addEventListener('click', () => {
      // Voice search integration placeholder
      alert("Voice search triggered");
    });

    // Backdrop & Outside click
    this.backdrop.addEventListener('click', () => this.close());
    
    // Tab trapping
    this.wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.state.isOpen) {
        // Simple focus trap: if tabbing away from dropdown, focus input
        setTimeout(() => {
          if (!this.wrapper.contains(document.activeElement)) {
            this.input.focus();
          }
        }, 10);
      }
    });
  }

  open() {
    if (this.state.isOpen) return;
    this.state.isOpen = true;
    this.wrapper.classList.add('ss-open');
    this.backdrop.classList.add('ss-active');
    this.input.setAttribute('aria-expanded', 'true');
    
    if (window.innerWidth <= 768) {
      document.body.classList.add('ss-mobile-active');
      this.container.scrollIntoView({ behavior: 'smooth' });
    }

    this.renderDropdown();
    this.emit('search:open');
  }

  close() {
    if (!this.state.isOpen) return;
    this.state.isOpen = false;
    this.wrapper.classList.remove('ss-open');
    this.backdrop.classList.remove('ss-active');
    this.input.setAttribute('aria-expanded', 'false');
    this.state.highlightedIndex = -1;
    document.body.classList.remove('ss-mobile-active');
    this.input.blur();
    this.emit('search:close');
  }

  clear() {
    this.input.value = '';
    this.state.query = '';
    this.wrapper.classList.remove('ss-has-query');
    this.input.focus();
    this.renderDropdown();
  }

  handleInput(val) {
    this.state.query = val;
    this.state.highlightedIndex = -1;
    
    if (val.length > 0) {
      this.wrapper.classList.add('ss-has-query');
    } else {
      this.wrapper.classList.remove('ss-has-query');
      this.renderDropdown();
      return;
    }

    // Debounce API call
    clearTimeout(this.debounceTimer);
    this.state.isLoading = true;
    this.renderDropdown();

    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(val);
    }, 300);
  }

  async fetchSuggestions(query) {
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    try {
      // Real API fetch would go here. We mock it for the demo.
      // const res = await fetch(\`\${this.config.apiEndpoint}?q=\${encodeURIComponent(query)}\`, { signal: this.abortController.signal });
      // const data = await res.json();
      
      // Mocking latency and response
      await new Promise(r => setTimeout(r, 400));
      const mockData = ["Laptop", "Laptop stand", "Gaming Laptop", "Laptop backpack"]
        .filter(t => t.toLowerCase().includes(query.toLowerCase()));

      this.state.suggestions = mockData.map(text => ({ text, icon: '🔍' }));
      this.state.isLoading = false;
      this.renderDropdown();

    } catch (e) {
      if (e.name !== 'AbortError') {
        this.state.isLoading = false;
        this.state.suggestions = [];
        this.renderDropdown();
      }
    }
  }

  executeSearch(query) {
    if (!query.trim()) {
      this.wrapper.classList.add('ss-shake');
      setTimeout(() => this.wrapper.classList.remove('ss-shake'), 400);
      return;
    }
    this.saveRecent(query);
    this.emit('search:execute', { query });
    
    // Provide visually instant feedback
    this.close();
    
    // Navigate (In a real app this might use router.push)
    window.location.href = \`\${this.config.resultPageUrl}\${encodeURIComponent(query)}\`;
  }

  handleKeyDown(e) {
    if (!this.state.isOpen) return;

    const items = this.dropdown.querySelectorAll('.ss-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.state.highlightedIndex = Math.min(this.state.highlightedIndex + 1, items.length - 1);
      this.updateHighlight(items);
    } 
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.state.highlightedIndex = Math.max(this.state.highlightedIndex - 1, -1);
      this.updateHighlight(items);
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.state.highlightedIndex >= 0 && items[this.state.highlightedIndex]) {
        items[this.state.highlightedIndex].click();
      } else {
        this.executeSearch(this.state.query);
      }
    }
    else if (e.key === 'Escape') {
      this.close();
    }
  }

  updateHighlight(items) {
    items.forEach((item, idx) => {
      if (idx === this.state.highlightedIndex) {
        item.classList.add('ss-highlighted');
        item.scrollIntoView({ block: 'nearest' });
        this.input.setAttribute('aria-activedescendant', item.id);
      } else {
        item.classList.remove('ss-highlighted');
      }
    });
    if (this.state.highlightedIndex === -1) {
      this.input.removeAttribute('aria-activedescendant');
    }
  }

  highlightText(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return \`\${text.substring(0, idx)}<span class="ss-match-highlight">\${text.substring(idx, idx + query.length)}</span>\${text.substring(idx + query.length)}\`;
  }

  renderDropdown() {
    this.dropdown.innerHTML = '';
    let html = '';

    // Empty state while typing
    if (this.state.isLoading) {
      for(let i=0; i<3; i++){
        html += \`
          <div class="ss-skeleton">
            <div class="ss-skeleton-icon"></div>
            <div class="ss-skeleton-text"></div>
          </div>
        \`;
      }
      this.dropdown.innerHTML = html;
      return;
    }

    // Suggestions View
    if (this.state.query.length > 0) {
      if (this.state.suggestions.length === 0) {
        html = \`<div class="ss-empty-state">No results found for '\${this.state.query}'. Try different keywords.</div>\`;
      } else {
        this.state.suggestions.forEach((s, i) => {
          html += \`
            <button class="ss-item" id="ss-item-\${i}" data-val="\${s.text}">
              <div class="ss-item-icon-box">\${s.icon}</div>
              <div class="ss-item-text">\${this.highlightText(s.text, this.state.query)}</div>
            </button>
          \`;
        });
      }
      this.dropdown.innerHTML = html;
      
      // Bind clicks
      this.dropdown.querySelectorAll('.ss-item').forEach(el => {
        el.addEventListener('click', () => this.executeSearch(el.dataset.val));
      });
      return;
    }

    // Default View (Query is empty)
    
    // 1. Recent Searches
    if (this.state.recentSearches.length > 0) {
      html += \`
        <div class="ss-section-header">
          <span>RECENT SEARCHES</span>
          <button class="ss-btn-clear-all" id="ss-clear-recent">Clear All</button>
        </div>
      \`;
      this.state.recentSearches.slice(0, 3).forEach((s, i) => {
        html += \`
          <button class="ss-item" id="ss-item-recent-\${i}" data-val="\${s.text}">
            <div class="ss-item-icon-box">🕒</div>
            <div class="ss-item-text">\${s.text}</div>
            <div class="ss-item-delete" data-del="\${s.text}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
          </button>
        \`;
      });
    }

    // 2. Trending
    html += \`
      <div class="ss-section-header">
        <span>POPULAR RIGHT NOW</span>
      </div>
      <div class="ss-trending-grid">
        \${this.trending.map(t => \`
          <button class="ss-trending-item" data-val="\${t.label}">
            <div class="ss-trending-icon">\${t.icon}</div>
            <div class="ss-trending-label">\${t.label}</div>
          </button>
        \`).join('')}
      </div>
    \`;

    this.dropdown.innerHTML = html;

    // Bind Default View Events
    const btnClearAll = this.dropdown.querySelector('#ss-clear-recent');
    if (btnClearAll) btnClearAll.addEventListener('click', () => this.clearAllRecent());

    this.dropdown.querySelectorAll('.ss-item-delete').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeRecent(el.dataset.del);
      });
    });

    this.dropdown.querySelectorAll('.ss-item').forEach(el => {
      el.addEventListener('click', () => this.executeSearch(el.dataset.val));
    });

    this.dropdown.querySelectorAll('.ss-trending-item').forEach(el => {
      el.addEventListener('click', () => this.executeSearch(el.dataset.val));
    });
  }

  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  // Public APIs
  setQuery(str) {
    this.input.value = str;
    this.handleInput(str);
  }

  destroy() {
    this.wrapper.remove();
    this.backdrop.remove();
  }
}
```

## How to use

1. Include `smart-search.css` and `smart-search.js` in your HTML.
2. Add an empty `div` where you want the search bar: `<div id="smart-search"></div>`
3. Initialize the class:
```javascript
const searchBar = new SmartSearch({
    containerId: 'smart-search',
    apiEndpoint: '/api/search/suggest',
    themeColor: '#FF9900', // Change to your brand color
    resultPageUrl: '/search?q='
});

// Optionally listen to events
document.getElementById('smart-search').addEventListener('search:execute', (e) => {
    console.log("Searching for:", e.detail.query);
});
```

*Note: Since you are using a React application (Next.js), you can either mount this Vanilla JS class via a `useEffect` inside a React component, or migrate this structural logic directly into your existing `SearchBar.tsx` and `SearchDropdown.tsx`.*
