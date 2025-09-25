// Use production URL for the API
const API_BASE_URL = 'https://safelink-api-0u29.onrender.com';

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

// Dino Game Variables
let gameRunning = false;
let gameScore = 0;
let gameSpeed = 3;
let baseSpawnRate = 2000; // Base spawn rate in milliseconds
let currentSpawnRate = 2000;
let obstacles = [];
let gameLoop;
let obstacleSpawnInterval;
let playerJumping = false;
let gameContainer;
let player;
let gameScoreElement;
let gameOverElement;

// Initialize game elements
function initGame() {
  gameContainer = document.getElementById('gameContainer');
  player = document.getElementById('player');
  gameScoreElement = document.getElementById('gameScore');
  gameOverElement = document.getElementById('gameOver');
  
  // Add retry button event listener
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      gameOverElement.style.display = 'none';
      startGame();
    });
  }
}

// Start the game
function startGame() {
  if (gameRunning) return;
  
  gameRunning = true;
  gameScore = 0;
  gameSpeed = 3;
  currentSpawnRate = baseSpawnRate;
  obstacles = [];
  playerJumping = false;
  
  // Reset player position
  player.style.bottom = '0px';
  player.classList.remove('jumping');
  
  // Clear any existing obstacles
  const existingObstacles = document.querySelectorAll('.obstacle');
  existingObstacles.forEach(obstacle => obstacle.remove());
  
  // Hide game over message
  gameOverElement.style.display = 'none';
  
  // Update score display
  gameScoreElement.textContent = '0';
  
  // Reset final score display
  const finalScoreElement = document.getElementById('finalScore');
  if (finalScoreElement) {
    finalScoreElement.textContent = '0';
  }
  
  // Show game container
  gameContainer.style.display = 'block';
  
  // Start game loop
  gameLoop = setInterval(updateGame, 16); // ~60 FPS
  
  // Start spawning obstacles
  obstacleSpawnInterval = setInterval(spawnObstacle, currentSpawnRate);
  
  // Add keyboard listener
  document.addEventListener('keydown', handleKeyPress);
}

// Stop the game
function stopGame() {
  if (!gameRunning) return;
  
  gameRunning = false;
  
  // Clear intervals
  if (gameLoop) clearInterval(gameLoop);
  if (obstacleSpawnInterval) clearInterval(obstacleSpawnInterval);
  
  // Remove keyboard listener
  document.removeEventListener('keydown', handleKeyPress);
  
  // Hide game container
  gameContainer.style.display = 'none';
  
  // Clear obstacles
  obstacles.forEach(obstacle => {
    if (obstacle.element && obstacle.element.parentNode) {
      obstacle.element.remove();
    }
  });
  obstacles = [];
}

// Handle keyboard input
function handleKeyPress(event) {
  if ((event.code === 'Space' || event.key === ' ') && !playerJumping && gameRunning) {
    event.preventDefault();
    jump();
  }
}

// Make player jump
function jump() {
  if (playerJumping) return;
  
  playerJumping = true;
  player.classList.add('jumping');
  
  setTimeout(() => {
    playerJumping = false;
    player.classList.remove('jumping');
  }, 500);
}

// Function to update spawn rate and spawn multiple obstacles based on score
function updateSpawnRate() {
  // Decrease spawn rate (faster spawning) every 10 points
  if (gameScore % 10 === 0 && gameScore > 0) {
    currentSpawnRate = Math.max(500, baseSpawnRate - (gameScore * 50)); // Minimum 500ms
    clearInterval(obstacleSpawnInterval);
    obstacleSpawnInterval = setInterval(spawnObstacle, currentSpawnRate);
  }
  
  // Spawn additional obstacles based on score
  if (gameScore >= 15 && gameScore % 5 === 0) {
    // Spawn 2 obstacles at once
    setTimeout(() => spawnObstacle(), 300);
  }
  
  if (gameScore >= 25 && gameScore % 3 === 0) {
    // Spawn 3 obstacles at once
    setTimeout(() => spawnObstacle(), 200);
    setTimeout(() => spawnObstacle(), 400);
  }
}

// Spawn a new obstacle
function spawnObstacle() {
  if (!gameRunning) return;
  
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle';
  obstacle.style.right = '-20px';
  
  const gameArea = document.querySelector('.game-area');
  gameArea.appendChild(obstacle);
  
  obstacles.push({
    element: obstacle,
    x: 280
  });
}

// Update game state
function updateGame() {
  if (!gameRunning) return;
  
  // Move obstacles
  obstacles.forEach((obstacle, index) => {
    obstacle.x -= gameSpeed;
    obstacle.element.style.right = `${280 - obstacle.x}px`;
    
    // Remove obstacles that are off screen
    if (obstacle.x < -20) {
      obstacle.element.remove();
      obstacles.splice(index, 1);
      // Increase score when obstacle is successfully dodged
      gameScore++;
      gameScoreElement.textContent = gameScore;
      
      // Increase game speed every 5 points
      if (gameScore % 5 === 0) {
        gameSpeed += 0.5;
      }
      
      // Update spawn rate based on score
      updateSpawnRate();
    }
  });
  
  // Check collisions
  if (checkCollision()) {
    endGame();
  }
}

// Check for collision between player and obstacles
function checkCollision() {
  if (playerJumping) return false;
  
  const playerRect = player.getBoundingClientRect();
  
  return obstacles.some(obstacle => {
    const obstacleRect = obstacle.element.getBoundingClientRect();
    
    return !(playerRect.right < obstacleRect.left || 
             playerRect.left > obstacleRect.right || 
             playerRect.bottom < obstacleRect.top || 
             playerRect.top > obstacleRect.bottom);
  });
}

// End the game
function endGame() {
  gameRunning = false;
  
  // Clear intervals
  if (gameLoop) clearInterval(gameLoop);
  if (obstacleSpawnInterval) clearInterval(obstacleSpawnInterval);
  
  // Remove keyboard listener
  document.removeEventListener('keydown', handleKeyPress);
  
  // Update final score display
  const finalScoreElement = document.getElementById('finalScore');
  if (finalScoreElement) {
    finalScoreElement.textContent = gameScore;
  }
  
  // Show game over message with retry button
  gameOverElement.style.display = 'block';
}

// Function to show error in the result div
function showError(message) {
  const resultDiv = document.getElementById('result');
  resultDiv.textContent = message;
  resultDiv.className = 'result phish';
}

// Comprehensive URL validation function
function isValidUrl(url) {
  // Basic URL format check
  try {
    new URL(url);
  } catch (error) {
    return false;
  }
  
  // Additional validation for common malformed patterns
  const urlLower = url.toLowerCase();
  
  // Check for malformed protocols (multiple characters repeated)
  const protocolPattern = /^https?:\/\/+/;
  if (!protocolPattern.test(urlLower)) {
    return false;
  }
  
  // Check for repeated characters in protocol (e.g., htttttp, hhttttps)
  if (urlLower.match(/h{2,}t{2,}p{2,}s?/)) {
    return false;
  }
  
  // Check for repeated 'w' characters in www (e.g., wwww, wwwww)
  if (urlLower.match(/w{4,}/)) {
    return false;
  }
  
  // Check for other common malformed patterns
  const malformedPatterns = [
    /\.{3,}/, // Multiple consecutive dots
    /\/{3,}/, // Multiple consecutive slashes
    /:{2,}/,  // Multiple consecutive colons
    /\s+/,    // Multiple spaces
    /[<>"|\\]/ // Invalid URL characters
  ];
  
  for (const pattern of malformedPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Check for valid domain structure
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  // Hostname should not be empty
  if (!hostname || hostname.length === 0) {
    return false;
  }
  
  // Check for valid TLD (top-level domain)
  const tldPattern = /\.[a-z]{2,}$/i;
  if (!tldPattern.test(hostname)) {
    return false;
  }
  
  return true;
}

// Function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to retry fetch with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // If we get a 502, wait and retry
      if (response.status === 502) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
        await delay(waitTime);
        continue;
      }
      
      return response; // Return other status codes
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const waitTime = Math.pow(2, i) * 1000;
      await delay(waitTime);
    }
  }
  throw new Error('Max retries reached');
}

// Function to store URL analysis result
async function storeAnalysisResult(url, result) {
  await chrome.storage.local.set({
    'lastAnalysis': {
      url: url,
      result: result,
      timestamp: new Date().toISOString()
    }
  });
}

// Function to get stored analysis result
async function getStoredAnalysis() {
  const data = await chrome.storage.local.get('lastAnalysis');
  return data.lastAnalysis;
}

// Function to store factor details
async function storeFactorDetails(url, factors) {
  await chrome.storage.local.set({
    'lastFactors': {
      url: url,
      factors: factors,
      timestamp: new Date().toISOString()
    }
  });
}

// Function to handle factor details click
async function handleFactorDetailsClick(e, url) {
  e.preventDefault();
  
  // Show loading message
  const resultDiv = document.getElementById('result');
  resultDiv.textContent = 'Loading factor details...';
  resultDiv.className = 'result';
  
  // Set up a timeout to show "Server is waking up" message after 6 seconds
  let serverWakeupTimeout;
  const showServerWakeupMessage = () => {
    resultDiv.textContent = 'Server is waking up (may take up to 50s). If nothing loads, try again after 50s.';
    resultDiv.className = 'result';
  };
  
  serverWakeupTimeout = setTimeout(showServerWakeupMessage, 6000);
  
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/features`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) {
      if (response.status === 502) {
        throw new Error('Server is warming up. Please try again in a few moments.');
      }
      throw new Error('Failed to fetch feature details');
    }

    // Clear the server wakeup timeout since we got a response
    clearTimeout(serverWakeupTimeout);
    
    // Stop the game since server responded
    stopGame();
    
    const data = await response.json();
    if (!data.features || Object.keys(data.features).length === 0) {
      throw new Error('No factor data received from server');
    }
    
    // Store the factor details
    await storeFactorDetails(url, data.features);
    
    // Open features.html in a new tab with the factor data
    const featuresUrl = new URL(chrome.runtime.getURL('features.html'));
    featuresUrl.searchParams.set('url', encodeURIComponent(data.url));
    
    // Ensure factors are properly formatted before encoding
    const cleanedFactors = {};
    Object.entries(data.features).forEach(([key, value]) => {
      cleanedFactors[key] = typeof value === 'number' ? value : (value ? 1 : 0);
    });
    
    const encodedFactors = encodeURIComponent(JSON.stringify(cleanedFactors));
    featuresUrl.searchParams.set('features', encodedFactors);
    
    chrome.tabs.create({ url: featuresUrl.toString() });
  } catch (error) {
    // Clear the server wakeup timeout since we got an error
    clearTimeout(serverWakeupTimeout);
    
    // Stop the game since we got an error
    stopGame();
    
    console.error('Error fetching factor details:', error);
    showError(error.message || 'Failed to load factor details. Please try again in a few moments.');
  }
}

// Flag to prevent multiple simultaneous URL checks
let isCheckingUrl = false;

// Function to check URL
async function checkUrl(urlToCheck = null) {
  // Prevent multiple simultaneous checks
  if (isCheckingUrl) {
    return;
  }
  
  isCheckingUrl = true;
  
  const urlInput = document.getElementById('urlInput');
  const resultDiv = document.getElementById('result');
  const moreInfo = document.getElementById('moreInfo');

  // If no URL is provided, get it from the input field
  const url = urlToCheck || urlInput.value.trim();
  
  if (!url) {
    resultDiv.textContent = 'Please enter a URL.';
    resultDiv.className = 'result';
    isCheckingUrl = false;
    return;
  }
  
  // Use the comprehensive URL validation function
  if (!isValidUrl(url)) {
    resultDiv.textContent = 'Please enter a valid URL (e.g., https://www.example.com).';
    resultDiv.className = 'result phish';
    isCheckingUrl = false;
    return;
  }
  // Set the URL in the input field if it came from context menu
  if (urlToCheck) {
    urlInput.value = urlToCheck;
  }

  // Indicate checking in progress
  resultDiv.textContent = 'Checking...';
  resultDiv.className = 'result';

  // This will show time to wait before the sever gets ready
let serverWakeupTimeout;
let serverWakeupInterval;
const serverWakeupDurationMs = 50000; // countdown for 50 seconds after delay
const serverWakeupDelayMs = 6000;     // delay before showing countdown

const showServerWakeupCountdown = () => {
  const resultDiv = document.getElementById('result');
  let remainingSeconds = serverWakeupDurationMs / 1000;

  resultDiv.className = 'result';
  resultDiv.textContent = `Server is waking up (may take up to ${remainingSeconds}s)...`;

  // Start the game when countdown begins
  startGame();

  serverWakeupInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds > 0) {
      resultDiv.textContent = `Server is waking up (may take up to ${remainingSeconds}s)...`;
    } else {
      resultDiv.textContent = `Still waking up. If nothing loads, try again.`;
      clearInterval(serverWakeupInterval);
    }
  }, 1000);
};

// Trigger countdown after delay
serverWakeupTimeout = setTimeout(showServerWakeupCountdown, serverWakeupDelayMs);


  try {
    // First check if server is running with retry
    const serverCheck = await fetchWithRetry(API_BASE_URL, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds

    // Make a POST request to the Flask server with retry
    const response = await fetchWithRetry(`${API_BASE_URL}/detect`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({ url: url }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 502) {
        throw new Error('Server is warming up. Please try again in a few moments.');
      }
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    // Clear the server wakeup timeout since we got a response
    clearTimeout(serverWakeupTimeout);
    clearInterval(serverWakeupInterval);
    
    // Stop the game since server responded
    stopGame();

    const data = await response.json();
    
    if (!data || !data.result) {
      throw new Error('Invalid response from server');
    }

    const result = data.result;
    
    // Store the analysis result
    await storeAnalysisResult(url, result);

    if (result === 'Legitimate') {
      resultDiv.textContent = 'URL Status: Legitimate';
      resultDiv.className = 'result legit';
    } else {
      resultDiv.textContent = 'URL Status: Potential Phishing';
      resultDiv.className = 'result phish';
    }

    // Show factor details link and set up click handler
    moreInfo.style.display = 'block';
    moreInfo.onclick = (e) => handleFactorDetailsClick(e, url);
  } catch (error) {
    // Clear the server wakeup timeout since we got an error
    clearTimeout(serverWakeupTimeout);
    clearInterval(serverWakeupInterval);
    
    // Stop the game since we got an error
    stopGame();
    
    console.error('Error checking URL:', error);
    if (error.name === 'AbortError') {
      showError('Request timed out. Please try again in a few moments.');
    } else if (error.message.includes('Failed to fetch')) {
      showError('Cannot connect to server. Please try again in a few moments.');
    } else {
      showError(error.message || 'An error occurred while checking the URL.');
    }
  } finally {
    // Reset the flag to allow future checks
    isCheckingUrl = false;
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkContextMenuUrl") {
    checkUrl(message.url);
  }
});

// Function to get current tab URL
async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url;
  } catch (error) {
    console.error('Error getting current tab URL:', error);
    return null;
  }
}

// When the popup is opened, check if there's a stored URL from context menu
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved theme
  await loadTheme();
  
  // Add theme toggle event listener
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Initialize the game
  initGame();
  
  // Temporary: Auto-start game for testing (remove this line after testing)
  // startGame(), startGame, 6000;
  
  try {
    const urlInput = document.getElementById('urlInput');
    
    // Get the current tab's URL and set it in the input field
    const currentUrl = await getCurrentTabUrl();
    if (currentUrl && currentUrl.startsWith('http')) {
      urlInput.value = currentUrl;
      
      // Show auto-fill info message
      const autoFillInfo = document.getElementById('autoFillInfo');
      autoFillInfo.style.display = 'flex';
      
      // Add a visual indicator that the URL was auto-filled
      urlInput.style.borderColor = '#10B981';
      urlInput.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
      
      // Remove the visual indicator and hide info message after 1.5 seconds
      setTimeout(() => {
        urlInput.style.borderColor = '';
        urlInput.style.boxShadow = '';
        autoFillInfo.classList.add('fade-out');
        setTimeout(() => {
          autoFillInfo.style.display = 'none';
          autoFillInfo.classList.remove('fade-out');
        }, 300);
      }, 2000);
    } else {
      urlInput.value = ''; // Clear input if no valid URL
      
      // Show "Use Current URL" button if we're on a valid page
      const useCurrentUrlBtn = document.getElementById('useCurrentUrlBtn');
      if (currentUrl && (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://') || currentUrl.startsWith('about:'))) {
        // Don't show button for browser pages
        useCurrentUrlBtn.style.display = 'none';
      } else if (currentUrl) {
        useCurrentUrlBtn.style.display = 'flex';
      }
    }

    const storedAnalysis = await getStoredAnalysis();
    if (storedAnalysis) {
      console.log("Stored Analysis Found:", storedAnalysis);
    }
  } catch (error) {
    console.error('Error checking stored analysis:', error);
  }
});

// Function to use current URL
async function useCurrentUrl() {
  const urlInput = document.getElementById('urlInput');
  const currentUrl = await getCurrentTabUrl();
  
  if (currentUrl && currentUrl.startsWith('http')) {
    urlInput.value = currentUrl;
    
    // Show auto-fill info message
    const autoFillInfo = document.getElementById('autoFillInfo');
    autoFillInfo.style.display = 'flex';
    
    // Add visual indicator
    urlInput.style.borderColor = '#10B981';
    urlInput.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
    
    // Remove visual indicator and hide info message after 1.5 seconds
    setTimeout(() => {
      urlInput.style.borderColor = '';
      urlInput.style.boxShadow = '';
      autoFillInfo.classList.add('fade-out');
      setTimeout(() => {
        autoFillInfo.style.display = 'none';
        autoFillInfo.classList.remove('fade-out');
      }, 300);
    }, 2000);
  }
}

// Add click event listener to the button
document.getElementById('checkBtn').addEventListener('click', () => checkUrl());

// Add click event listener to the "Use Current URL" button
document.getElementById('useCurrentUrlBtn').addEventListener('click', useCurrentUrl);

// Add keypress event listener to the input field
document.getElementById('urlInput').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    checkUrl();
  }
});