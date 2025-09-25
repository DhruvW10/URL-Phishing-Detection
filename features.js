// Theme management
let currentTheme = 'dark';

// Function to toggle theme
function toggleTheme() {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  
  if (currentTheme === 'dark') {
    currentTheme = 'light';
    root.setAttribute('data-theme', 'light');
    themeToggle.classList.add('active');
  } else {
    currentTheme = 'dark';
    root.removeAttribute('data-theme');
    themeToggle.classList.remove('active');
  }
  
  // Save theme preference
  chrome.storage.local.set({ 'theme': currentTheme });
}

// Function to load saved theme
async function loadTheme() {
  try {
    const data = await chrome.storage.local.get('theme');
    if (data.theme) {
      currentTheme = data.theme;
      const root = document.documentElement;
      const themeToggle = document.getElementById('themeToggle');
      
      if (currentTheme === 'light') {
        root.setAttribute('data-theme', 'light');
        themeToggle.classList.add('active');
      }
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
}

// Factors descriptions with detailed information
const factorDescriptions = {
    'UsingIP': 'Checks if the URL uses an IP address instead of a domain name. Phishing URLs often use IP addresses to hide the actual domain.',
    'LongURL': 'Analyzes the length of the URL. Phishing URLs tend to be unusually long with many subdomains or path segments.',
    'ShortURL': 'Detects if URL shortening services are used. Phishers often use these services to mask malicious URLs.',
    'Symbol@': 'Checks for @ symbol in the URL. The @ symbol in URLs can be used to confuse users about the actual destination.',
    'Redirecting//': 'Detects multiple forward slashes for redirection. Multiple slashes can indicate URL redirection attempts.',
    'PrefixSuffix-': 'Looks for prefix or suffix separated by "-". Phishing URLs often add prefixes or suffixes to mimic legitimate domains.',
    'SubDomains': 'Counts the number of subdomains. Multiple subdomains can be used to create URLs that appear legitimate.',
    'HTTPS': 'Checks if HTTPS is used properly. While HTTPS is secure, phishers may also use it to appear legitimate.',
    'DomainRegLen': 'Checks domain registration length. Phishing domains are often newly registered or have short registration periods.',
    'Favicon': 'Verifies if favicon is loaded from proper domain. Phishing sites may load favicons from different domains.',
    'NonStdPort': 'Checks if non-standard ports are used. Unusual port numbers can indicate suspicious activity.',
    'HTTPSDomainURL': 'Verifies HTTPS in domain part of URL. Inconsistent HTTPS usage can indicate phishing attempts.',
    'RequestURL': 'Analyzes external resource request URLs. Phishing sites often load resources from multiple suspicious domains.',
    'AnchorURL': 'Checks anchor tag destinations. Links may point to suspicious or unrelated domains.',
    'LinksInScriptTags': 'Analyzes links in script tags. Suspicious scripts may connect to external malicious domains.',
    'ServerFormHandler': 'Checks form handler reliability. Form submissions should go to trusted domains.',
    'InfoEmail': 'Looks for information submission to email. Legitimate sites rarely submit forms directly to email addresses.',
    'AbnormalURL': 'Detects abnormal URL patterns. Unusual character combinations or patterns may indicate phishing.',
    'WebsiteForwarding': 'Checks for website forwarding. Multiple redirections can hide the final malicious destination.',
    'StatusBarCust': 'Detects status bar customization. Phishing sites may try to hide or modify the status bar.',
    'DisableRightClick': 'Checks if right-click is disabled. Legitimate sites rarely disable right-click functionality.',
    'UsingPopupWindow': 'Detects popup window usage. Excessive popups can indicate malicious behavior.',
    'IframeRedirection': 'Checks for iframe-based redirection. Hidden iframes can be used for malicious redirects.',
    'AgeofDomain': 'Verifies domain age. Newly registered domains are more likely to be used for phishing.',
    'DNSRecording': 'Checks DNS record existence. Missing or suspicious DNS records can indicate phishing.',
    'WebsiteTraffic': 'Analyzes website traffic. Low traffic or sudden spikes can indicate suspicious activity.',
    'PageRank': 'Checks Google PageRank. Legitimate sites typically have established PageRank.',
    'GoogleIndex': 'Verifies Google indexing status. Non-indexed sites are more likely to be malicious.',
    'LinksPointingToPage': 'Counts links pointing to the page. Few external links can indicate a new or suspicious site.',
    'StatsReport': 'Analyzes statistical reports. Unusual traffic patterns can indicate malicious activity.'
};

function getStatusDisplay(value) {
    const numValue = Number(value);
    let status, className;
    
    switch(numValue) {
        case 1:
            status = 'Legitimate';
            className = 'legitimate';
            break;
        case 0:
            status = 'Neutral';
            className = 'neutral';
            break;
        case -1:
            status = 'Phishing';
            className = 'phishing';
            break;
        default:
            status = 'Unknown';
            className = 'neutral';
    }
    
    return `<span class="status ${className}">${status} (${numValue})</span>`;
}

function analyzeFactorsAndShowConclusion(factors) {
    let legitimateCount = 0;
    let phishingCount = 0;
    let neutralCount = 0;
    
    // Count the number of legitimate, phishing, and neutral factors
    Object.values(factors).forEach(value => {
        if (value === 1) legitimateCount++;
        else if (value === -1) phishingCount++;
        else neutralCount++;
    });

    // Update the factors summary
    document.getElementById('legitimateCount').textContent = legitimateCount;
    document.getElementById('phishingCount').textContent = phishingCount;
    document.getElementById('neutralCount').textContent = neutralCount;

    const conclusionBox = document.getElementById('conclusionBox');
    const verdictElement = conclusionBox.querySelector('.verdict');
    const detailsElement = conclusionBox.querySelector('.details');

    // Remove any existing classes
    conclusionBox.classList.remove('legitimate', 'phishing', 'neutral');

    // Calculate the verdict
    let verdict, details, className;
    const totalFactors = Object.keys(factors).length;
    const legitimatePercentage = (legitimateCount / totalFactors) * 100;
    const phishingPercentage = (phishingCount / totalFactors) * 100;

    // Classify based on which percentage is higher
    if (phishingPercentage >= legitimatePercentage) {
        verdict = '🔴 Potential Phishing URL Detected';
        details = '⚠️ Caution: The URL you entered has been identified as a phishing website. Phishing websites are designed to steal sensitive information such as login credentials, credit card details, or personal data. It is strongly recommended that you do not enter any personal information on this site and avoid interacting with it.';
        className = 'phishing';
    } else {
        verdict = '🟢 Safe to Visit';
        details = '✅ Safe to Visit: The analysis indicates that the URL does not exhibit characteristics of phishing. While no automated system is 100% accurate, this website appears to be safe for browsing. However, always exercise caution when entering sensitive information online.';
        className = 'legitimate';
    }

    // Update the conclusion box
    conclusionBox.classList.add(className);
    verdictElement.textContent = verdict;
    detailsElement.textContent = details;
}

function showError(message, isInvalidUrl = false) {
    const container = document.getElementById('featuresContainer');
    
    if (isInvalidUrl) {
        // For invalid URL, show only the specific message
        container.innerHTML = `<div class="error-message">Please enter a valid URL (e.g., https://www.example.com).</div>`;
        
        // Update conclusion box for invalid URL
        const conclusionBox = document.getElementById('conclusionBox');
        conclusionBox.classList.remove('legitimate', 'phishing', 'neutral');
        conclusionBox.classList.add('neutral');
        conclusionBox.querySelector('.verdict').textContent = 'Invalid URL';
        conclusionBox.querySelector('.details').textContent = 'Please enter a valid URL (e.g., https://www.example.com).';
    } else {
        // For other errors, show the original error message
        container.innerHTML = `<div class="error-message">${message}</div>`;
        
        // Also update conclusion box to show error state
        const conclusionBox = document.getElementById('conclusionBox');
        conclusionBox.classList.remove('legitimate', 'phishing', 'neutral');
        conclusionBox.classList.add('neutral');
        conclusionBox.querySelector('.verdict').textContent = 'Analysis Error';
        conclusionBox.querySelector('.details').textContent = message;
    }
}

// Main execution
window.addEventListener('DOMContentLoaded', async function() {
    // Load saved theme
    await loadTheme();
    
    // Add theme toggle event listener
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const url = urlParams.get('url');
        const factorsParam = urlParams.get('features');
        
        if (!url || !factorsParam) {
            showError('Missing URL or factors data', true);
            return;
        }

        // Display URL
        const decodedUrl = decodeURIComponent(url);
        document.getElementById('analyzedUrl').textContent = decodedUrl;

        // Parse and display factors
        let factors;
        try {
            factors = JSON.parse(decodeURIComponent(factorsParam));
        } catch (parseError) {
            showError('Invalid factors data format', true);
            return;
        }

        if (!factors || typeof factors !== 'object' || Object.keys(factors).length === 0) {
            showError('No factors data available', true);
            return;
        }

        // Analyze factors and show conclusion
        analyzeFactorsAndShowConclusion(factors);

        // Sort and display factors
        const sortedFactors = Object.entries(factors).sort(([a], [b]) => a.localeCompare(b));
        const tableBody = document.getElementById('featuresTableBody');
        
        let html = '';
        sortedFactors.forEach(([name, value]) => {
            html += `
                <tr>
                    <td>${name}</td>
                    <td>${getStatusDisplay(value)}</td>
                    <td>${factorDescriptions[name] || ''}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    } catch (error) {
        showError(error.message, true);
    }
}); 