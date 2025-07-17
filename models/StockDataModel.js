import mongoose from "mongoose";

const StockDataSchema = new mongoose.Schema({
  metaData: {
    information: { type: String, required: false },
    symbol: { 
      type: String, 
      required: true,
      index: true,
      uppercase: true,
      trim: true
    },
    dataType: {
      type: String,
      enum: ['daily', 'intraday', 'weekly', 'monthly'],
      required: true
    },
    lastRefreshed: { 
      type: String,
      required: true
    },
    interval: { 
      type: String,
      required: true,
      enum: ['1min', '5min', '15min', '30min', '60min']
    },
    outputSize: { 
      type: String,
      enum: ['compact', 'full'],
      default: 'compact'
    },
    timeZone: { 
      type: String,
      default: 'US/Eastern'
    }
  },
  timeSeries: {
    type: Map,
    of: {
      '1. open': { type: String, required: true },
      '2. high': { type: String, required: true },
      '3. low': { type: String, required: true },
      '4. close': { type: String, required: true },
      '5. volume': { type: String, required: true }
    },
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true
  }
}, { 
  timestamps: true,
  strict: true
});

// Index for faster queries
StockDataSchema.index({ "metaData.symbol": 1, "metaData.lastRefreshed": 1 });
StockDataSchema.index({ "timeSeries.timestamp": 1 });

const StockData = mongoose.model("StockData", StockDataSchema);

export default StockData;
