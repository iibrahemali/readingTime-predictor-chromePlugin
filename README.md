# Reading Time Predictor

A Chrome extension that learns your personal reading speed and predicts how long articles will take you to read.

## Features

- **Personalized Predictions**: Uses machine learning to learn your unique reading speed
- **Automatic Tracking**: Tracks time spent on articles and whether you finished reading
- **Smart Detection**: Identifies article content on any webpage
- **Visual Badge**: Shows estimated reading time in a floating badge
- **Dashboard**: View your stats, training progress, and recent activity

## How It Works

1. **Data Collection**: When you visit articles, the extension extracts:
   - Word count
   - Number of images
   - Number of code blocks
   - Whether the page has video

2. **Training**: After reading 20+ articles, a linear regression model is trained on your personal reading data

3. **Prediction**: For new articles, the model predicts your reading time based on the learned patterns

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Build Steps

1. Clone or download this repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Copy static files to the dist folder:
   ```bash
   cp manifest.json styles.css dist/
   mkdir -p dist/popup
   cp popup/popup.html popup/popup.css dist/popup/
   ```

### Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist` folder

## Usage

- Visit any article or blog post
- A green badge will appear in the top-right corner showing estimated reading time
- While the model is learning, it will show "Learning..." indicator
- Click the extension icon to view your stats and training progress

## Project Structure

```
reading-chrome-plugin/
├── manifest.json        # Chrome extension manifest (v3)
├── package.json         # npm dependencies
├── webpack.config.js    # Webpack bundler config
├── styles.css           # Badge styling
├── src/
│   ├── content.js       # Main content script
│   ├── model.js         # ML model (linear regression)
│   ├── storage.js       # Chrome storage helpers
│   └── ui.js            # Badge UI component
└── popup/
    ├── popup.html       # Dashboard HTML
    ├── popup.js         # Dashboard logic
    └── popup.css        # Dashboard styling
```

## Tech Stack

- **Manifest V3** - Latest Chrome extension format
- **ml-regression** - JavaScript library for linear regression
- **Webpack** - Module bundler for npm packages

## How the ML Model Works

The extension uses multivariate linear regression with 4 features:
- `wordCount` - Total words in the article
- `imageCount` - Number of images
- `codeBlockCount` - Number of code blocks (pre/code tags)
- `hasVideo` - Whether the page has embedded video (0 or 1)

The model predicts `timeSpentSeconds` based on these features.

**Before training** (< 20 articles): Uses fallback estimate of 200 words per minute

**After training**: Uses personalized model that accounts for how images, code, and videos affect your reading speed

## Privacy

All data is stored locally in your browser using `chrome.storage.local`. No data is sent to external servers.

## License

MIT

