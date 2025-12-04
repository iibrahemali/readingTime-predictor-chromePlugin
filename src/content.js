// Main content script - handles feature extraction, tracking, and prediction
import { Storage } from './storage.js';
import { Model } from './model.js';
import { UI } from './ui.js';

// Global tracking state
let pageData = {
  wordCount: 0,
  imageCount: 0,
  codeBlockCount: 0,
  hasVideo: false,
  startTime: Date.now(),
  completedReading: false,
  url: window.location.href
};

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Find article container
function findArticleContainer() {
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.post-body',
    '.article-body',
    '.content'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }

  return document.body;
}

// Count words in text
function countWords(text) {
  if (!text) return 0;
  
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length >= 2);
  
  return words.length;
}

// Extract features from the page
function extractFeatures() {
  const container = findArticleContainer();
  
  // Get text content, excluding scripts and styles
  const clone = container.cloneNode(true);
  const scripts = clone.querySelectorAll('script, style, nav, footer, aside, header');
  scripts.forEach(el => el.remove());
  
  const text = clone.innerText || clone.textContent;
  const wordCount = countWords(text);
  
  // Count images
  const images = container.querySelectorAll('img');
  const imageCount = images.length;
  
  // Count code blocks
  const codeBlocks = container.querySelectorAll('pre, code');
  const codeBlockCount = codeBlocks.length;
  
  // Check for videos
  const videos = container.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
  const hasVideo = videos.length > 0;

  return {
    wordCount,
    imageCount,
    codeBlockCount,
    hasVideo
  };
}

// Check if user scrolled to bottom
function checkScrollCompletion() {
  const scrollPosition = window.scrollY + window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;
  
  if (scrollPosition >= pageHeight - 100) {
    pageData.completedReading = true;
  }
}

// Debounced scroll handler
const handleScroll = debounce(checkScrollCompletion, 200);

// Save tracking data when leaving page
async function saveTrackingData() {
  const timeSpentSeconds = Math.round((Date.now() - pageData.startTime) / 1000);
  
  // Don't save if page is too short or time is too short
  if (pageData.wordCount < 100 || timeSpentSeconds < 10) {
    console.log('Reading Time Predictor: Page too short or time too short, not saving');
    return;
  }

  const dataPoint = {
    wordCount: pageData.wordCount,
    imageCount: pageData.imageCount,
    codeBlockCount: pageData.codeBlockCount,
    hasVideo: pageData.hasVideo,
    timeSpentSeconds,
    completedReading: pageData.completedReading,
    url: pageData.url,
    timestamp: Date.now()
  };

  console.log('Reading Time Predictor: Saving data', dataPoint);

  try {
    const totalDataPoints = await Storage.addTrainingData(dataPoint);
    
    // Update stats
    const trainingData = await Storage.getTrainingData();
    const totalTime = trainingData.reduce((sum, d) => sum + d.timeSpentSeconds, 0);
    const totalWords = trainingData.reduce((sum, d) => sum + d.wordCount, 0);
    const averageSpeed = totalWords > 0 ? Math.round(totalWords / (totalTime / 60)) : 200;
    
    await Storage.updateStats({
      totalArticles: totalDataPoints,
      averageSpeed
    });

    // Check if we should retrain
    const model = await Storage.getModel();
    if (Model.shouldRetrain(totalDataPoints, model)) {
      console.log('Reading Time Predictor: Retraining model...');
      await Model.train(trainingData);
    }
  } catch (error) {
    console.error('Reading Time Predictor: Error saving data', error);
  }
}

// Predict and display reading time
async function showPrediction() {
  const features = extractFeatures();
  pageData = { ...pageData, ...features };

  // Don't show for very short pages
  if (features.wordCount < 100) {
    console.log('Reading Time Predictor: Page too short, not showing prediction');
    return;
  }

  const model = await Storage.getModel();
  const trainingData = await Storage.getTrainingData();
  
  let predictedSeconds;
  let isLearning = true;

  if (model && model.trained) {
    // Use trained model
    predictedSeconds = Model.predict(model, [
      features.wordCount,
      features.imageCount,
      features.codeBlockCount,
      features.hasVideo ? 1 : 0
    ]);
    isLearning = false;
  } else {
    // Use fallback
    predictedSeconds = Model.fallbackPredict(features.wordCount);
    isLearning = trainingData.length < Model.MIN_DATA_POINTS;
  }

  const minutes = Math.max(1, Math.round(predictedSeconds / 60));
  
  console.log('Reading Time Predictor:', {
    features,
    predictedSeconds,
    minutes,
    isLearning,
    dataPoints: trainingData.length
  });

  UI.showBadge(minutes, isLearning);
}

// Initialize
function init() {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
}

function onReady() {
  // Small delay to let page content settle
  setTimeout(() => {
    pageData.startTime = Date.now();
    
    // Show prediction
    showPrediction();
    
    // Setup scroll tracking
    window.addEventListener('scroll', handleScroll);
    
    // Setup save on page unload
    window.addEventListener('beforeunload', saveTrackingData);
    
    // Also save when visibility changes (user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveTrackingData();
      }
    });
  }, 500);
}

// Start the extension
init();

