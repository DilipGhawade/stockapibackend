import mongoose from "mongoose";

const DailyStockDataSchema = new mongoose.Schema({
  symbol: { 
    type: String, 
    required: true,
    index: true,
    uppercase: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  adjustedClose: {
    type: Number,
    required: false
  },
  dividendAmount: {
    type: Number,
    default: 0
  },
  splitCoefficient: {
    type: Number,
    default: 1
  },
  lastRefreshed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Create a compound index on symbol and date for faster queries
  // This ensures we don't have duplicate entries for the same symbol and date
  autoIndex: true
});

// Create a compound unique index on symbol and date
DailyStockDataSchema.index({ symbol: 1, date: 1 }, { unique: true });

// Helper function to safely parse number with fallback
const safeParseNumber = (value, fallback = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

// Static method to save multiple daily records at once
DailyStockDataSchema.statics.saveBulkDailyData = async function(symbol, timeSeriesData) {
  try {
    const operations = [];
    
    for (const [dateStr, data] of Object.entries(timeSeriesData)) {
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) continue; // Skip invalid dates
        
        const operation = {
          updateOne: {
            filter: { symbol, date },
            update: {
              $set: {
                symbol,
                date,
                open: safeParseNumber(data['1. open']),
                high: safeParseNumber(data['2. high']),
                low: safeParseNumber(data['3. low']),
                close: safeParseNumber(data['4. close']),
                volume: Math.floor(safeParseNumber(data['5. volume'])), // Ensure it's an integer
                adjustedClose: safeParseNumber(data['5. adjusted close'] || data['4. close']), // Fallback to close if adjusted close not available
                dividendAmount: safeParseNumber(data['7. dividend amount']),
                splitCoefficient: safeParseNumber(data['8. split coefficient'], 1),
                lastRefreshed: new Date()
              }
            },
            upsert: true
          }
        };
        operations.push(operation);
      } catch (error) {
        console.error(`Error processing data for ${symbol} on ${dateStr}:`, error);
        continue; // Skip this record and continue with the next one
      }
    }

    if (operations.length > 0) {
      await this.bulkWrite(operations);
    }
    return true;
  } catch (error) {
    console.error('Error saving bulk daily data:', error);
    throw error;
  }
};

// Create a model from the schema
const DailyStockData = mongoose.model('DailyStockData', DailyStockDataSchema);

export default DailyStockData;
