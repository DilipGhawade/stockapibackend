import { 
  getDailyData as getAlphaVantageDailyData,
  getIntradayData as getAlphaVantageIntradayData,
  getHistoricalData as getAlphaVantageHistoricalData
} from "../services/AlphaVantageService.js";
import ApiError from "../utils/ApiError.js";
import StockData from "../models/StockDataModel.js";
import DailyStockData from "../models/DailyStockDataModel.js";
import logger from "../config/logger.js";

function getAlphaVantageApiKey() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    logger.error('ALPHA_VANTAGE_API_KEY is not configured in environment variables');
    throw new Error('Alpha Vantage API key is not configured. Please set the ALPHA_VANTAGE_API_KEY environment variable.');
  }
  return apiKey;
}

export const getDailyData = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { outputsize = 'compact' } = req.query;

    logger.info(`Fetching daily data for ${symbol}`);
    
    const data = await getAlphaVantageDailyData(getAlphaVantageApiKey(), symbol, outputsize);
    
    // Save to MongoDB using the new DailyStockData model
    if (data && data.timeSeries) {
      try {
        await DailyStockData.saveBulkDailyData(symbol, data.timeSeries);
        logger.info(`Successfully saved/updated daily data for ${symbol} in MongoDB`);
      } catch (error) {
        logger.error(`Error saving daily data to MongoDB: ${error.message}`, { error });
        // Don't throw the error, just log it as we still want to return the data
      }
    }

    res.status(200).json({
      success: true,
      data: data || {},
      message: "Daily data fetched successfully"
    });
  } catch (error) {
    logger.error('Error in getDailyData: %s', error.message);
    next(new ApiError(500, `Failed to fetch daily data: ${error.message}`));
  }
};

export const getIntradayData = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { interval = "5min" } = req.query;

    logger.info(`Fetching real-time data for ${symbol} with interval ${interval}`);
    
    const data = await getAlphaVantageIntradayData(getAlphaVantageApiKey(), symbol, interval);
    
    // Save to MongoDB
    if (data && data.metaData) {
      try {
        await StockData.findOneAndUpdate(
          { 
            "metaData.symbol": symbol,
            "metaData.dataType": 'intraday',
            "metaData.interval": interval
          },
          {
            metaData: {
              information: data.metaData.information || '',
              symbol: data.metaData.symbol || symbol,
              lastRefreshed: data.metaData.lastRefreshed || new Date().toISOString(),
              interval: data.metaData.interval || interval,
              outputSize: data.metaData.outputSize || 'Compact',
              timeZone: data.metaData.timeZone || 'US/Eastern',
              dataType: 'intraday'
            },
            timeSeries: data.timeSeries || {},
            lastUpdated: new Date()
          },
          { 
            upsert: true, 
            new: true, 
            setDefaultsOnInsert: true,
            useFindAndModify: false
          }
        );
      } catch (dbError) {
        logger.error('Error saving to MongoDB: %s', dbError.message);
        // Continue even if there's a DB error
      }
    }

    res.status(200).json({
      success: true,
      data: data || {},
      message: "Intraday data fetched successfully"
    });
  } catch (error) {
    logger.error('Error in getIntradayData: %s', error.message);
    next(new ApiError(500, `Failed to fetch intraday data: ${error.message}`));
  }
};

export const getHistoricalData = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { start_date, end_date, interval = "5min" } = req.query;

    logger.info(`Fetching historical data for ${symbol} from ${start_date} to ${end_date}`);
    
    const data = await getAlphaVantageHistoricalData(
      getAlphaVantageApiKey(),
      symbol, 
      start_date, 
      end_date, 
      interval
    );

    if (!data || !data.timeSeries) {
      throw new ApiError(404, "No historical data found for the given parameters");
    }

    res.status(200).json({
      success: true,
      data: data,
      message: "Historical data fetched successfully"
    });
  } catch (error) {
    logger.error('Error in getHistoricalData: %s', error.message);
    next(new ApiError(500, `Failed to fetch historical data: ${error.message}`));
  }
};

export const listAvailableSymbols = async (req, res, next) => {
  try {
    // Return a list of some common stock symbols
    res.status(200).json({
      success: true,
      data: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'IBM', 'TSLA', 'NVDA', 'JPM', 'V']
    });
  } catch (error) {
    next(new ApiError(500, 'Failed to fetch available symbols'));
  }
};
