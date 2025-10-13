// Import required modules
import v8 from "v8"; // Node.js v8 module for heap statistics
import log from "./log.js"; // Custom logging module

/**
 * MemoryMonitor class - Monitors Node.js application memory usage
 * and detects potential memory leaks or high memory consumption
 */
class MemoryMonitor {
  /**
   * Creates a new MemoryMonitor instance
   * @param {Object} options - Configuration options
   * @param {number} options.interval - Monitoring interval in milliseconds (default: 60000)
   * @param {number} options.thresholdMB - Memory threshold in MB for warnings (default: 1024)
   */
  constructor({ interval = 60000, thresholdMB = 1024 } = {}) {
    // Monitoring interval in milliseconds
    this.interval = interval;
    // Memory threshold in MB that triggers warnings
    this.thresholdMB = thresholdMB;
    // Array to store historical memory statistics
    this.history = [];
    // Auto-restart process if memory exceeds max limit (from environment variable)
    this.autoRestart = process.env.PROJECT_AUTO_RESTART === "true";
    // Maximum allowed memory before forced restart (from environment variable)
    this.maxMemory = parseInt(process.env.PROJECT_MAX_MEMORY || "1024", 10);
  }

  /**
   * Starts the memory monitoring process
   * Sets up a recurring interval to check memory usage
   */
  start() {
    // Set up monitoring interval
    this.timer = setInterval(() => {
      // Calculate current memory usage in MB
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Create memory stats object with current data
      const stats = {
        usedMB: used, // Current memory usage in MB
        heapStats: v8.getHeapStatistics(), // Detailed heap statistics from V8
        timestamp: new Date().toISOString(), // Current timestamp for tracking
      };

      // Add current stats to history
      this.history.push(stats);

      // Check if current usage exceeds threshold
      if (used > this.thresholdMB) {
        log.warn(
          "MemoryMonitor",
          `High memory usage detected: ${used.toFixed(2)} MB`
        );
      }

      // Memory leak detection logic
      // Only check if we have enough historical data (last 5 readings)
      if (this.history.length > 5) {
        // Get the last 5 memory readings and check if they were above threshold
        const lastFive = this.history
          .slice(-5)
          .map((h) => h.usedMB && h.usedMB > this.thresholdMB);
        
        // Check if memory usage is consistently increasing (potential memory leak)
        if (lastFive.every((val, i, arr) => i === 0 || val > arr[i - 1])) {
          log.warn(
            "MemoryMonitor",
            `Potential memory leak detected: ${used.toFixed(2)} MB`
          );
          
          // Emergency restart if auto-restart is enabled and memory exceeds max limit
          if (this.autoRestart && used > this.maxMemory)
            process.exit(1); // Forcefully exit the process
        }
      }
    }, this.interval); // Use the configured interval
  }

  /**
   * Stops the memory monitoring process
   * Clears the monitoring interval if it's running
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer); // Clear the monitoring interval
    }
  }
}

// Export the MemoryMonitor class as default export
export default MemoryMonitor;