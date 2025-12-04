// Popup dashboard script

const MIN_DATA_POINTS = 20;

// Format seconds to readable time
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

// Truncate URL for display
function truncateUrl(url, maxLength = 40) {
  try {
    const urlObj = new URL(url);
    let display = urlObj.hostname + urlObj.pathname;
    if (display.length > maxLength) {
      display = display.substring(0, maxLength) + '...';
    }
    return display;
  } catch {
    return url.substring(0, maxLength);
  }
}

// Load and display stats
async function loadStats() {
  const result = await chrome.storage.local.get(['trainingData', 'model', 'stats']);
  
  const trainingData = result.trainingData || [];
  const model = result.model || null;
  const stats = result.stats || { totalArticles: 0, averageSpeed: 200 };
  
  // Update total articles
  document.getElementById('total-articles').textContent = trainingData.length;
  
  // Update average speed
  if (trainingData.length > 0) {
    document.getElementById('avg-speed').textContent = `${stats.averageSpeed} wpm`;
  } else {
    document.getElementById('avg-speed').textContent = '-- wpm';
  }
  
  // Update progress bar
  const progress = Math.min(100, (trainingData.length / MIN_DATA_POINTS) * 100);
  document.getElementById('progress-fill').style.width = `${progress}%`;
  document.getElementById('progress-text').textContent = 
    `${trainingData.length}/${MIN_DATA_POINTS} articles`;
  
  // Update model status
  const statusEl = document.getElementById('model-status');
  if (model && model.trained) {
    statusEl.classList.add('trained');
    statusEl.querySelector('.status-text').textContent = 
      `Model trained with ${model.dataPoints} articles`;
  } else if (trainingData.length >= MIN_DATA_POINTS) {
    statusEl.classList.add('ready');
    statusEl.querySelector('.status-text').textContent = 'Ready to train...';
  } else {
    statusEl.classList.remove('trained', 'ready');
    statusEl.querySelector('.status-text').textContent = 
      `Learning... need ${MIN_DATA_POINTS - trainingData.length} more articles`;
  }
  
  // Update recent list
  const recentList = document.getElementById('recent-list');
  if (trainingData.length === 0) {
    recentList.innerHTML = '<p class="empty-state">No articles tracked yet. Start reading!</p>';
  } else {
    const recent = trainingData.slice(-5).reverse();
    recentList.innerHTML = recent.map(item => `
      <div class="recent-item">
        <div class="recent-url">${truncateUrl(item.url)}</div>
        <div class="recent-details">
          <span>${item.wordCount} words</span>
          <span>•</span>
          <span>${formatTime(item.timeSpentSeconds)}</span>
          ${item.completedReading ? '<span class="completed">✓</span>' : ''}
        </div>
      </div>
    `).join('');
  }
}

// Reset all data
async function resetData() {
  if (confirm('Are you sure you want to reset all training data? This cannot be undone.')) {
    await chrome.storage.local.set({
      trainingData: [],
      model: null,
      stats: { totalArticles: 0, averageSpeed: 200 }
    });
    loadStats();
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  document.getElementById('reset-btn').addEventListener('click', resetData);
});

