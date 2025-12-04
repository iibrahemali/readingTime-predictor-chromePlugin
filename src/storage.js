// Storage helper functions for chrome.storage.local

export const Storage = {
  // Get data from storage
  async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    });
  },

  // Set data to storage
  async set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  },

  // Get training data array
  async getTrainingData() {
    const result = await this.get(['trainingData']);
    return result.trainingData || [];
  },

  // Add a new training data point
  async addTrainingData(dataPoint) {
    const trainingData = await this.getTrainingData();
    trainingData.push(dataPoint);
    await this.set({ trainingData });
    return trainingData.length;
  },

  // Get saved model
  async getModel() {
    const result = await this.get(['model']);
    return result.model || null;
  },

  // Save trained model
  async saveModel(model) {
    await this.set({ model });
  },

  // Get stats
  async getStats() {
    const result = await this.get(['stats']);
    return result.stats || { totalArticles: 0, averageSpeed: 200 };
  },

  // Update stats
  async updateStats(stats) {
    await this.set({ stats });
  },

  // Clear all data
  async clearAll() {
    await this.set({ 
      trainingData: [], 
      model: null, 
      stats: { totalArticles: 0, averageSpeed: 200 } 
    });
  }
};

