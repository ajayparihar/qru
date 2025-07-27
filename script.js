/**
 * QRU v0.1
 * Developed by Bheb Developer
 * Uses the QR Server API to generate QR codes from text input
 */

// State variables
let currentQRData = '';
let debounceTimer;
let statusRegion = null;

// API configuration
const QR_API = {
  url: 'https://api.qrserver.com/v1/create-qr-code/',
  params: (text, size) => `?size=${size}x${size}&data=${encodeURIComponent(text)}`
};

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  statusRegion = document.getElementById('status-region');
  const contentInput = document.getElementById('contentInput');
  const clearBtn = document.getElementById('clearBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const shareBtn = document.getElementById('shareBtn');
  const copyBtn = document.getElementById('copyBtn');
  const mobileDownloadBtn = document.getElementById('mobileDownloadBtn');
  const themeToggle = document.querySelector('.theme-toggle');
  
  // Initialize theme
  initializeTheme();
  
  // Add event listeners
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  if (contentInput) {
    // Focus the input field on page load
    contentInput.focus();
    
    // Initialize button states
    setButtonState(true);
    togglePasteClearButton(contentInput.value.length === 0);
    
    // Announce initial status for screen readers
    announceStatus('Start typing to generate QR code');
    
    // Auto-resize the textarea
    autoResizeTextarea(contentInput);
    
    // Add input event listener
    contentInput.addEventListener('input', handleInputChange);
  }
  
  // Add button event listeners
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (contentInput.value.trim() === '') {
        handlePaste();
      } else {
        resetContent();
      }
    });
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadQR);
  }
  
  if (shareBtn) {
    shareBtn.addEventListener('click', shareQR);
  }
  
  if (copyBtn) {
    copyBtn.addEventListener('click', copyQR);
  }
  
  if (mobileDownloadBtn) {
    mobileDownloadBtn.addEventListener('click', downloadQR);
  }
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Load saved text and generate QR code if available
  loadSavedText();
  generateQR();
});

/**
 * Initialize theme based on user preference
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Apply theme based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDarkScheme)) {
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-theme');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
  }
}

/**
 * Enable or disable action buttons based on QR code availability
 * @param {boolean} disabled - Whether buttons should be disabled
 */
function setButtonState(disabled) {
  ['downloadBtn', 'mobileDownloadBtn', 'shareBtn', 'copyBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = disabled;
      // Update ARIA attributes for accessibility
      if (disabled) {
        el.setAttribute('aria-disabled', 'true');
      } else {
        el.setAttribute('aria-disabled', 'false');
      }
    }
  });
}

/**
 * Toggle between paste and clear icons based on input content
 * @param {boolean} isEmpty - Whether the input is empty
 */
function togglePasteClearButton(isEmpty) {
  const clearBtn = document.getElementById('clearBtn');
  if (!clearBtn) return;
  
  const pasteIcon = clearBtn.querySelector('.paste-icon');
  const clearIcon = clearBtn.querySelector('.clear-icon');
  
  if (isEmpty) {
    clearBtn.setAttribute('aria-label', 'Paste from clipboard');
    clearBtn.setAttribute('title', 'Paste from clipboard');
    pasteIcon.style.display = 'block';
    clearIcon.style.display = 'none';
  } else {
    clearBtn.setAttribute('aria-label', 'Clear content');
    clearBtn.setAttribute('title', 'Clear content');
    pasteIcon.style.display = 'none';
    clearIcon.style.display = 'block';
  }
}

/**
 * Auto-resize textarea to fit content
 * @param {HTMLTextAreaElement} textarea - The textarea element to resize
 */
function autoResizeTextarea(textarea) {
  if (!textarea) return;
  
  function resize() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  
  // Initial resize
  resize();
  
  // Add event listener for future resizing
  textarea.addEventListener('input', resize);
}

/**
 * Handle input changes in the textarea
 */
function handleInputChange() {
  updateCharCount();
  saveTextToStorage();
  setButtonState(this.value.trim() === '');
  togglePasteClearButton(this.value.trim() === '');
  
  // Debounce QR code generation to avoid excessive API calls
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generateQR, 200);
}

/**
 * Handle pasting content from clipboard
 */
async function handlePaste() {
  const contentInput = document.getElementById('contentInput');
  if (!contentInput) return;
  
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      contentInput.value = text;
      updateCharCount();
      saveTextToStorage();
      generateQR();
      announceStatus('Content pasted successfully');
    }
  } catch (e) {
    console.error('Clipboard access error:', e);
    announceStatus('Failed to paste from clipboard');
  }
}

/**
 * Update character count display and styling
 */
function updateCharCount() {
  const contentInput = document.getElementById('contentInput');
  const charCount = document.getElementById('char-count');
  if (!contentInput || !charCount) return;
  
  const count = contentInput.value.length;
  const max = 2048;
  const remaining = max - count;
  
  // Update the display
  charCount.textContent = `${count}/${max}`;
  
  // Update color based on character count
  if (count > 1800) {
    charCount.style.color = 'var(--color-error)';
    if (remaining <= 50) {
      // Add ARIA alert for screen readers when approaching limit
      charCount.setAttribute('role', 'alert');
    }
  } else if (count > 1500) {
    charCount.style.color = 'var(--color-accent)';
    charCount.removeAttribute('role');
  } else {
    charCount.style.color = 'var(--color-text-muted)';
    charCount.removeAttribute('role');
  }
  
  togglePasteClearButton(count === 0);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = !html.classList.contains('dark-theme');
  
  // Add transition class for smooth theme change
  html.classList.add('theme-transition');
  
  if (isDark) {
    html.classList.add('dark-theme');
    document.body.classList.add('dark-theme');
  } else {
    html.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
  }
  
  // Save theme preference
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Remove transition class after animation completes
  setTimeout(() => html.classList.remove('theme-transition'), 300);
  
  // Announce theme change for screen readers
  announceStatus(`Switched to ${isDark ? 'dark' : 'light'} theme`);
}

/**
 * Announce status messages for screen readers
 * @param {string} message - The message to announce
 */
function announceStatus(message) {
  if (!statusRegion) return;
  
  statusRegion.textContent = message;
  
  // Clear the message after a delay
  setTimeout(() => { 
    statusRegion.textContent = ''; 
  }, 2000);
}

/**
 * Load saved text from localStorage
 */
function loadSavedText() {
  const savedText = localStorage.getItem('text');
  const contentInput = document.getElementById('contentInput');
  
  if (savedText && contentInput) {
    contentInput.value = savedText;
    updateCharCount();
  }
}

/**
 * Save text to localStorage
 */
function saveTextToStorage() {
  const contentInput = document.getElementById('contentInput');
  if (!contentInput) return;
  
  const text = contentInput.value;
  
  if (text) {
    localStorage.setItem('text', text);
  } else {
    localStorage.removeItem('text');
  }
}

/**
 * Reset content and clear QR code
 */
function resetContent() {
  const contentInput = document.getElementById('contentInput');
  if (!contentInput) return;
  
  // Clear localStorage
  localStorage.removeItem('text');
  
  // Clear input and focus
  contentInput.value = '';
  contentInput.style.height = 'auto';
  contentInput.focus();
  
  // Update UI
  updateCharCount();
  generateQR();
  announceStatus('Content cleared');
  setButtonState(true);
}

/**
 * Generate QR code based on input content
 */
async function generateQR() {
  // Get DOM elements
  const contentInput = document.getElementById('contentInput');
  const qrImage = document.getElementById('qrImage');
  const qrPlaceholder = document.getElementById('qrPlaceholder');
  const qrLoading = document.getElementById('qrLoading');
  
  // Validate required elements
  if (!contentInput || !qrImage || !qrPlaceholder || !qrLoading) {
    console.error('Required DOM elements not found');
    return;
  }

  // Get and validate content
  const content = contentInput.value.trim();

  // Handle empty content
  if (content === '') {
    qrImage.style.display = 'none';
    qrLoading.style.display = 'none';
    qrPlaceholder.style.display = 'flex';
    setButtonState(true);
    currentQRData = '';
    announceStatus('Enter content to generate QR code');
    return;
  }

  // Validate content length
  if (content.length > 2048) {
    announceStatus('Content too long. Maximum 2048 characters allowed.');
    return;
  }

  // Show loading state
  qrPlaceholder.style.display = 'none';
  qrImage.style.display = 'none';
  qrLoading.style.display = 'flex';
  announceStatus('Generating QR code...');

  try {
    // Generate QR code
    const size = getOptimalSize();
    const url = QR_API.url + QR_API.params(content, size);
    
    // Fetch QR code image
    const response = await fetch(url);
    
    // Handle API errors
    if (!response.ok) {
      throw new Error(`QR API Error: ${response.status} ${response.statusText}`);
    }
    
    // Process response
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    // Update image and state
    qrImage.src = imageUrl;
    qrImage.setAttribute('alt', `QR code for: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    setButtonState(false);
    currentQRData = content;
    
    // Handle image load
    qrImage.onload = function() {
      qrLoading.style.display = 'none';
      qrImage.style.display = 'block';
      qrImage.classList.add('fade-in');
      setTimeout(() => qrImage.classList.remove('fade-in'), 300);
      announceStatus('QR code generated successfully');
    };
    
    // Handle image load error
    qrImage.onerror = function() {
      throw new Error('Failed to load QR code image');
    };
  } catch (error) {
    console.error('QR generation error:', error);
    qrLoading.style.display = 'none';
    qrPlaceholder.style.display = 'flex';
    setButtonState(true);
    announceStatus('Error generating QR code. Please try again.');
  }
}

/**
 * Calculate optimal QR code size based on screen width
 * @returns {number} The optimal size in pixels
 */
function getOptimalSize() {
  const w = window.innerWidth;
  
  // Responsive sizing
  if (w < 576) return 256;      // Extra small devices
  if (w < 768) return 320;      // Small devices
  if (w < 992) return 384;      // Medium devices
  return 512;                   // Large devices
}

/**
 * Download the generated QR code as a PNG image
 */
function downloadQR() {
  const qrImage = document.getElementById('qrImage');
  const contentInput = document.getElementById('contentInput');
  
  // Validate QR code exists
  if (!qrImage || !qrImage.src || qrImage.style.display === 'none') {
    announceStatus('Please enter some content to generate a QR code first.');
    return;
  }
  
  try {
    // Generate filename based on content
    const content = contentInput ? contentInput.value.trim() : '';
    let filename = 'qrcode.png';
    
    if (content.length > 0) {
      // Create a safe filename from the content
      const safeContent = content.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-');
      filename = `qr-${safeContent}.png`;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = qrImage.src;
    link.download = filename;
    link.setAttribute('aria-label', `Download QR code for ${content.substring(0, 30)}`);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    announceStatus('QR code downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
    announceStatus('Failed to download QR code');
  }
}

/**
 * Share the generated QR code using Web Share API if available
 * Falls back to copy if sharing is not supported
 */
function shareQR() {
  const qrImage = document.getElementById('qrImage');
  const contentInput = document.getElementById('contentInput');
  
  // Validate QR code exists
  if (!qrImage || !qrImage.src || qrImage.style.display === 'none') {
    announceStatus('No QR code to share');
    return;
  }
  
  const content = contentInput ? contentInput.value.trim() : '';
  
  // Check if Web Share API is available
  if (navigator.share) {
    announceStatus('Preparing to share QR code...');
    
    fetch(qrImage.src)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch QR code image');
        return res.blob();
      })
      .then(blob => {
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        return navigator.share({ 
          title: 'QR Code', 
          text: `QR Code for: ${content.substring(0, 50)}`, 
          files: [file] 
        });
      })
      .then(() => announceStatus('QR code shared successfully'))
      .catch(error => {
        console.error('Share error:', error);
        if (error.name === 'AbortError') {
          announceStatus('Sharing cancelled');
        } else {
          announceStatus('Failed to share QR code');
          // Fall back to copy
          copyQR();
        }
      });
  } else {
    // Fall back to copy if sharing is not supported
    announceStatus('Sharing not supported on this device. Copying instead...');
    copyQR();
  }
}

/**
 * Copy the generated QR code to clipboard
 */
function copyQR() {
  const qrImage = document.getElementById('qrImage');
  
  // Validate QR code exists
  if (!qrImage || !qrImage.src || qrImage.style.display === 'none') {
    announceStatus('No QR code to copy');
    return;
  }
  
  // Check if Clipboard API is available
  if (!navigator.clipboard || !navigator.clipboard.write) {
    announceStatus('Copying images is not supported in this browser');
    return;
  }
  
  announceStatus('Copying QR code to clipboard...');
  
  fetch(qrImage.src)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch QR code image');
      return res.blob();
    })
    .then(blob => {
      const item = new ClipboardItem({ 'image/png': blob });
      return navigator.clipboard.write([item]);
    })
    .then(() => announceStatus('QR code copied to clipboard'))
    .catch(error => {
      console.error('Copy error:', error);
      announceStatus('Failed to copy QR code');
    });
}

/**
 * Setup keyboard shortcuts for common actions
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Generate QR code: Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateQR();
      announceStatus('Generating QR code with keyboard shortcut');
    }
    
    // Clear content: Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      resetContent();
      announceStatus('Content cleared with keyboard shortcut');
    }
    
    // Download QR code: Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      downloadQR();
    }
    
    // Copy QR code: Ctrl/Cmd + Shift + C (to avoid conflict with regular copy)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copyQR();
    }
  });
}