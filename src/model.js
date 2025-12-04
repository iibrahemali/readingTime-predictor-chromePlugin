// ML model logic using ml-regression library
import { MultivariateLinearRegression } from 'ml-regression';
import { Storage } from './storage.js';

export const Model = {
  // Minimum data points required for training
  MIN_DATA_POINTS: 20,

  // Train the model with collected data
  async train(trainingData) {
    if (trainingData.length < this.MIN_DATA_POINTS) {
      console.log(`Not enough data to train. Have ${trainingData.length}, need ${this.MIN_DATA_POINTS}`);
      return null;
    }

    // Filter out outliers (time > 30 minutes for short articles)
    const filteredData = trainingData.filter(d => {
      const expectedTime = (d.wordCount / 200) * 60; // Basic estimate
      return d.timeSpentSeconds < expectedTime * 10 && d.timeSpentSeconds > 10;
    });

    if (filteredData.length < this.MIN_DATA_POINTS) {
      console.log('Not enough clean data after filtering outliers');
      return null;
    }

    // Prepare features (X) and targets (y)
    const X = filteredData.map(d => [
      d.wordCount,
      d.imageCount,
      d.codeBlockCount,
      d.hasVideo ? 1 : 0
    ]);

    const y = filteredData.map(d => d.timeSpentSeconds);

    try {
      // Train multivariate linear regression
      const regression = new MultivariateLinearRegression(X, y);

      const model = {
        weights: regression.weights,
        trained: true,
        dataPoints: filteredData.length,
        trainedAt: Date.now()
      };

      // Save model to storage
      await Storage.saveModel(model);

      console.log('Model trained successfully!', model);
      return model;
    } catch (error) {
      console.error('Error training model:', error);
      return null;
    }
  },

  // Predict reading time for given features
  predict(model, features) {
    if (!model || !model.weights) {
      return null;
    }

    const [wordCount, imageCount, codeBlockCount, hasVideo] = features;

    // Manual prediction using weights: y = w0 + w1*x1 + w2*x2 + ...
    const weights = model.weights;
    
    let prediction;
    if (Array.isArray(weights[0])) {
      // MultivariateLinearRegression format
      prediction = weights[0][0] + 
                   weights[1][0] * wordCount +
                   weights[2][0] * imageCount +
                   weights[3][0] * codeBlockCount +
                   weights[4][0] * hasVideo;
    } else {
      // Simple format
      prediction = weights[0] + 
                   weights[1] * wordCount +
                   weights[2] * imageCount +
                   weights[3] * codeBlockCount +
                   weights[4] * hasVideo;
    }

    // Ensure prediction is positive and reasonable
    return Math.max(30, prediction); // Minimum 30 seconds
  },

  // Fallback prediction when model isn't trained
  fallbackPredict(wordCount) {
    // Assume 200 words per minute
    return (wordCount / 200) * 60;
  },

  // Check if retraining is needed
  shouldRetrain(dataCount, model) {
    if (!model) return dataCount >= this.MIN_DATA_POINTS;
    // Retrain every 10 new articles after initial training
    return dataCount >= this.MIN_DATA_POINTS && 
           (dataCount - model.dataPoints) >= 10;
  }
};

