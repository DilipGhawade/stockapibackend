import axios from "axios";
import StockData from "../models/StockDataModel.js";
import logger from "../config/logger.js";

export default class AlphaVantageService {
  constructor(apiKey) {
    this.apiKey = apiKey || "LF4QX2NVP67O0K45";
    this.baseUrl = "https://www.alphavantage.co/query";
  }

  async getDailyData(symbol, outputSize = "compact") {
    try {
      // Check if API key is configured
      if (!this.apiKey) {
        const errorMsg = "Alpha Vantage API key is not configured. Please set the ALPHA_VANTAGE_API_KEY environment variable.";
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Check if using demo key
      const isDemoKey = this.apiKey === 'demo' || this.apiKey.toLowerCase().includes('demo');
      
      if (isDemoKey) {
        const demoMessage = "The demo API key is for demonstration purposes only and has limited functionality. Please use a valid API key for full access to Alpha Vantage data.";
        logger.warn(demoMessage);
        throw new Error(demoMessage);
      }

      const params = {
        function: "TIME_SERIES_DAILY",
        symbol: symbol.toUpperCase(),
        outputsize: outputSize.toLowerCase(),
        apikey: this.apiKey,
        datatype: "json"
      };

      logger.info(`Fetching daily data for ${symbol}`);
      const apiUrl = `${this.baseUrl}?${new URLSearchParams(params).toString()}`;
      
      // Log the full request URL (without API key for security)
      const safeApiUrl = apiUrl.replace(/apikey=[^&]*/, 'apikey=***');
      logger.debug(`API Request: ${safeApiUrl}`);
      
      const response = await axios.get(this.baseUrl, { 
        params,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status >= 200 && status < 500
      });

      logger.debug('API Response Status: %d', response.status);
      
      // Log response data safely (truncate if too large)
      const responseDataStr = JSON.stringify(response.data);
      logger.debug('API Response Data (first 500 chars): %s', responseDataStr.substring(0, 500));
      
      // Check for rate limiting or other API notices
      if (response.data && response.data["Note"]) {
        const note = response.data["Note"];
        logger.warn('Alpha Vantage API Note: %s', note);
        
        // If we hit rate limits, throw an error
        if (note.includes('demo') || note.includes('rate limit')) {
          throw new Error('Rate limit exceeded');
        }
      }
      
      // Handle API errors
      if (response.status !== 200) {
        const errorMsg = response.data && response.data["Error Message"] 
          ? response.data["Error Message"] 
          : `API request failed with status ${response.status}: ${response.statusText}`;
          
        logger.error('API Error: %s', errorMsg);
        
        // For 404 or other client errors, throw an error
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMsg);
        }
        
        throw new Error(errorMsg);
      }

      if (!response.data) {
        logger.warn('No data received from Alpha Vantage API');
        throw new Error('No data received from Alpha Vantage API');
      }

      // Check if we have any data at all
      if (Object.keys(response.data).length === 0) {
        logger.warn('Empty response from Alpha Vantage API');
        throw new Error('Empty response from Alpha Vantage API');
      }

      // Try to transform the data
      try {
        const transformedData = this.transformDailyData(response.data, symbol);
        
        if (!transformedData.metaData || !transformedData.timeSeries) {
          logger.warn('Transformed data is missing required fields');
          throw new Error('Transformed data is missing required fields');
        }
        
        return transformedData;
      } catch (transformError) {
        logger.error('Error transforming API response: %s', transformError.message);
        logger.debug('Original response data: %j', response.data);
        throw new Error('Error transforming API response');
      }
    } catch (error) {
      logger.error('Error in getDailyData: %s', error.message);
      if (error.response) {
        logger.error('Error response data: %j', error.response.data);
        logger.error('Error response status: %d', error.response.status);
        logger.error('Error response headers: %j', error.response.headers);
      } else if (error.request) {
        logger.error('No response received from Alpha Vantage API');
      }
      throw new Error(`Failed to get daily data: ${error.message}`);
    }
  }

  async getIntradayData(symbol, interval = "5min") {
    try {
      // Check if API key is configured
      if (!this.apiKey) {
        const errorMsg = "Alpha Vantage API key is not configured. Please set the ALPHA_VANTAGE_API_KEY environment variable.";
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Check if using demo key
      const isDemoKey = this.apiKey === 'demo' || this.apiKey.toLowerCase().includes('demo');
      
      if (isDemoKey) {
        const demoMessage = "The demo API key is for demonstration purposes only and has limited functionality. Please use a valid API key for full access to Alpha Vantage data.";
        logger.warn(demoMessage);
        throw new Error(demoMessage);
      }

      const params = {
        function: "TIME_SERIES_INTRADAY",
        symbol: symbol.toUpperCase(),
        interval: interval.toLowerCase(),
        apikey: this.apiKey,
        outputsize: "compact",
        datatype: "json"
      };

      logger.info(`Fetching intraday data for ${symbol} with interval ${interval}`);
      const apiUrl = `${this.baseUrl}?${new URLSearchParams(params).toString()}`;
      
      // Log the full request URL (without API key for security)
      const safeApiUrl = apiUrl.replace(/apikey=[^&]*/, 'apikey=***');
      logger.debug(`API Request: ${safeApiUrl}`);
      
      const response = await axios.get(this.baseUrl, { 
        params,
        timeout: 15000, // Increased timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status >= 200 && status < 500
      });

      logger.debug('API Response Status: %d', response.status);
      
      // Log response data safely (truncate if too large)
      const responseDataStr = JSON.stringify(response.data);
      logger.debug('API Response Data (first 500 chars): %s', responseDataStr.substring(0, 500));
      
      // Check for rate limiting or other API notices
      if (response.data && response.data["Note"]) {
        const note = response.data["Note"];
        logger.warn('Alpha Vantage API Note: %s', note);
        
        // If we hit rate limits, return mock data instead of failing
        if (note.includes('demo') || note.includes('rate limit')) {
          logger.info('Falling back to mock data due to API limitations');
          return this.getMockIntradayData(symbol, interval);
        }
      }
      
      // Handle API errors
      if (response.status !== 200) {
        const errorMsg = response.data && response.data["Error Message"] 
          ? response.data["Error Message"] 
          : `API request failed with status ${response.status}: ${response.statusText}`;
          
        logger.error('API Error: %s', errorMsg);
        
        // For 404 or other client errors, try to return mock data
        if (response.status >= 400 && response.status < 500) {
          logger.info('Attempting to return mock data due to client error');
          return this.getMockIntradayData(symbol, interval);
        }
        
        throw new Error(errorMsg);
      }

      if (!response.data) {
        logger.warn('No data received from Alpha Vantage API, falling back to mock data');
        return this.getMockIntradayData(symbol, interval);
      }

      // Check if we have any data at all
      if (Object.keys(response.data).length === 0) {
        logger.warn('Empty response from Alpha Vantage API, falling back to mock data');
        return this.getMockIntradayData(symbol, interval);
      }

      // Try to transform the data
      try {
        const transformedData = this.transformData(response.data);
        
        if (!transformedData.metaData || !transformedData.timeSeries) {
          logger.warn('Transformed data is missing required fields, falling back to mock data');
          return this.getMockIntradayData(symbol, interval);
        }
        
        return transformedData;
      } catch (transformError) {
        logger.error('Error transforming API response: %s', transformError.message);
        logger.debug('Original response data: %j', response.data);
        logger.info('Falling back to mock data due to transformation error');
        return this.getMockIntradayData(symbol, interval);
      }
    } catch (error) {
      logger.error('Error in getIntradayData: %s', error.message);
      if (error.response) {
        logger.error('Error response data: %j', error.response.data);
        logger.error('Error response status: %s', error.response.status);
        logger.error('Error response headers: %j', error.response.headers);
      } else if (error.request) {
        logger.error('No response received: %j', error.request);
      } else {
        logger.error('Error: %s', error.message);
      }
      throw new Error(`Failed to get intraday data: ${error.message}`);
    }
  }

  async getHistoricalData(symbol, startDate, endDate, interval = "5min") {
    try {
      // Check if API key is configured
      if (!this.apiKey) {
        const errorMsg = "Alpha Vantage API key is not configured. Please set the ALPHA_VANTAGE_API_KEY environment variable.";
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const params = {
        function: "TIME_SERIES_INTRADAY",
        symbol: symbol,
        interval: interval,
        outputsize: "full",
        apikey: this.apiKey,
        datatype: "json"
      };

      logger.debug(`Fetching historical data for ${symbol} from ${startDate} to ${endDate}`);
      
      const response = await axios.get(this.baseUrl, { 
        params,
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = response.data;

      // Check for error in response
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      // Transform the data
      const transformedData = this.transformData(data);
      
      // Filter data by date range if provided
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        const filteredTimeSeries = {};
        for (const [timestamp, values] of Object.entries(transformedData.timeSeries)) {
          const entryDate = new Date(timestamp);
          if (entryDate >= start && entryDate <= end) {
            filteredTimeSeries[timestamp] = values;
          }
        }
        transformedData.timeSeries = filteredTimeSeries;
      }

      return transformedData;
      
    } catch (error) {
      logger.error('Error in getHistoricalData: %s', error.message);
      if (error.response) {
        logger.error('Error response data: %j', error.response.data);
        logger.error('Error response status: %s', error.response.status);
        logger.error('Error response headers: %j', error.response.headers);
      } else if (error.request) {
        logger.error('No response received: %j', error.request);
      }
      throw new Error(`Failed to get historical data: ${error.message}`);
    }
  }



  transformDailyData(data, symbol) {
    logger.debug('Starting daily data transformation');
    logger.debug('Received data keys: %j', Object.keys(data));
    
    // Log first 500 characters of the response for debugging
    const dataStr = JSON.stringify(data);
    logger.debug('Full response (first 500 chars): %s', dataStr.substring(0, 500));

    // Find the metadata and time series keys
    let metaKey = Object.keys(data).find(key => 
      key.toLowerCase().includes('meta') || 
      key.toLowerCase().includes('information')
    );
    
    let timeSeriesKey = Object.keys(data).find(key => 
      key.toLowerCase().includes('time series') || 
      key.toLowerCase().includes('daily')
    );

    logger.debug('Found meta key: %s', metaKey);
    logger.debug('Found time series key: %s', timeSeriesKey);

    if (!metaKey || !timeSeriesKey) {
      logger.error('No metadata key found in daily response. Available keys: %j', Object.keys(data));
      throw new Error('Invalid data format: Missing Meta Data or Time Series in daily data');
    }

    const metadata = data[metaKey];
    const timeSeries = data[timeSeriesKey];

    if (!metadata || !timeSeries) {
      logger.error('Missing required data in daily response');
      logger.debug('Metadata: %j', metadata);
      logger.debug('Time Series: %j', timeSeries);
      throw new Error('Invalid daily data format: Missing required fields');
    }

    // Transform the time series data to a consistent format
    const transformedTimeSeries = {};
    
    for (const [date, values] of Object.entries(timeSeries)) {
      // Skip if the values are not in the expected format
      if (!values || typeof values !== 'object') {
        logger.debug('Skipping invalid time series entry for date: %s', date);
        continue;
      }
      
      try {
        transformedTimeSeries[date] = {
          open: parseFloat(values['1. open'] || values['open'] || 0),
          high: parseFloat(values['2. high'] || values['high'] || 0),
          low: parseFloat(values['3. low'] || values['low'] || 0),
          close: parseFloat(values['4. close'] || values['close'] || 0),
          volume: parseInt(values['5. volume'] || values['volume'] || 0, 10),
          adjustedClose: parseFloat(values['5. adjusted close'] || values['adjusted close'] || values['4. close'] || values['close'] || 0),
          dividendAmount: parseFloat(values['7. dividend amount'] || values['dividend amount'] || 0),
          splitCoefficient: parseFloat(values['8. split coefficient'] || values['split coefficient'] || 1)
        };
      } catch (error) {
        logger.error('Error parsing time series data for date %s: %s', date, error.message);
        continue;
      }
    }

    // Extract and transform metadata
    const transformedMetadata = {
      information: metadata['1. Information'] || metadata['Information'] || 'Daily Time Series',
      symbol: metadata['2. Symbol'] || metadata['Symbol'] || symbol,
      lastRefreshed: metadata['3. Last Refreshed'] || metadata['Last Refreshed'] || new Date().toISOString(),
      outputSize: metadata['4. Output Size'] || metadata['Output Size'] || 'Compact',
      timeZone: metadata['5. Time Zone'] || metadata['Time Zone'] || 'US/Eastern',
      dataType: 'daily'
    };

    logger.debug('Successfully transformed daily data for %s', symbol);
    
    return {
      metaData: transformedMetadata,
      timeSeries: transformedTimeSeries
    };
  }

  transformData(data) {
    try {
      logger.debug('Starting data transformation');
      
      if (!data || typeof data !== 'object') {
        logger.error('Invalid data format: Expected an object, received:', typeof data);
        throw new Error('Invalid data format: Expected an object');
      }

      // Log the structure of the received data for debugging
      logger.debug('Received data keys: %j', Object.keys(data));
      
      // Check for error response
      if (data['Error Message']) {
        logger.error('API returned error: %s', data['Error Message']);
        throw new Error(data['Error Message']);
      }

      // Check for rate limit notice
      if (data.Note) {
        logger.warn('API rate limit notice: %s', data.Note);
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      // Find the metadata and time series keys
      const metaKey = Object.keys(data).find(key => 
        key.toLowerCase().includes('meta') || 
        key === 'Meta Data' ||
        key === 'MetaData'
      );
      
      const timeSeriesKey = Object.keys(data).find(key => 
        key.toLowerCase().includes('time series') || 
        key.toLowerCase().includes('timeseries') ||
        key.toLowerCase().includes('time_series')
      );

      logger.debug('Found meta key: %s', metaKey);
      logger.debug('Found time series key: %s', timeSeriesKey);

      if (!metaKey) {
        logger.error('No metadata key found in response. Available keys: %j', Object.keys(data));
        throw new Error('Invalid data format: Missing Meta Data');
      }

      if (!timeSeriesKey) {
        logger.error('No time series key found in response. Available keys: %j', Object.keys(data));
        throw new Error('Invalid data format: Missing Time Series Data');
      }

      const metaData = data[metaKey];
      const timeSeries = data[timeSeriesKey];

      if (!metaData) {
        logger.error('Meta data is empty');
        throw new Error('Invalid data format: Meta Data is empty');
      }

      if (!timeSeries || typeof timeSeries !== 'object') {
        logger.error('Time series data is invalid or empty: %j', timeSeries);
        throw new Error('Invalid data format: Time Series data is invalid or empty');
      }

      logger.debug('Meta data keys: %j', Object.keys(metaData));
      logger.debug('Sample time series entry: %j', Object.entries(timeSeries)[0]);

      // Transform the time series data to our format
      const transformedTimeSeries = {};
      for (const [timestamp, values] of Object.entries(timeSeries)) {
        if (!values || typeof values !== 'object') {
          logger.warn('Skipping invalid time series entry for timestamp: %s', timestamp);
          continue;
        }
        
        transformedTimeSeries[timestamp] = {
          '1. open': values['1. open'] || values['open'] || values['OPEN'] || '',
          '2. high': values['2. high'] || values['high'] || values['HIGH'] || '',
          '3. low': values['3. low'] || values['low'] || values['LOW'] || '',
          '4. close': values['4. close'] || values['close'] || values['CLOSE'] || '',
          '5. volume': values['5. volume'] || values['volume'] || values['VOLUME'] || ''
        };
      }

      // Extract metadata with fallback for different key formats
      const result = {
        metaData: {
          information: metaData['1. Information'] || metaData['Information'] || '',
          symbol: metaData['2. Symbol'] || metaData['Symbol'] || '',
          lastRefreshed: metaData['3. Last Refreshed'] || metaData['Last Refreshed'] || new Date().toISOString(),
          interval: metaData['4. Interval'] || metaData['Interval'] || '',
          outputSize: metaData['5. Output Size'] || metaData['Output Size'] || 'Compact',
          timeZone: metaData['6. Time Zone'] || metaData['Time Zone'] || 'US/Eastern',
          dataType: 'intraday'
        },
        timeSeries: transformedTimeSeries
      };

      logger.debug('Transformation completed successfully');
      return result;
    } catch (error) {
      logger.error("Error in transformData: %s", error.message);
      if (error.stack) {
        logger.error('Stack trace: %s', error.stack);
      }
      throw new Error(`Failed to transform data: ${error.message}`);
    }
  }

  async saveStockData(symbol, interval = "5min") {
    try {
      const latestData = await StockData.findOne({
        "metaData.symbol": symbol,
        "metaData.interval": interval,
      }).sort({ "metaData.lastRefreshed": -1 });

      const rawData = await this.getIntradayData(symbol, interval);

      if (
        latestData &&
        new Date(latestData.metaData.lastRefreshed).getTime() ===
          new Date(rawData.metaData.lastRefreshed).getTime()
      ) {
        console.log(`Data for ${symbol} (${interval}) is already up to date.`);
        return latestData;
      }

      const stockData = new StockData({
        metaData: rawData.metaData,
        timeSeries: rawData.timeSeries,
      });

      const savedData = await stockData.save();
      console.log(`Successfully saved data for ${symbol} (${interval})`);
      return savedData;
    } catch (error) {
      console.error("Error saving stock data:", error.message);
      throw error;
    }
  }
}
