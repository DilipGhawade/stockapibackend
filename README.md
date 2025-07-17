# Stock API Backend

A robust Node.js backend API for retrieving real-time and historical stock market data using Alpha Vantage API. This RESTful API provides endpoints for fetching intraday, daily, and historical stock data with MongoDB integration for data persistence.

## Features

- 📈 **Real-time Stock Data**: Fetch live intraday stock prices with customizable intervals
- 📊 **Daily Stock Data**: Retrieve daily stock prices and historical data
- 📅 **Historical Data**: Access historical stock data with date range filtering
- 🗄️ **MongoDB Integration**: Automatic data persistence and caching
- 🔍 **Input Validation**: Comprehensive request validation middleware
- 📝 **Logging**: Structured logging with Winston and daily log rotation
- 🚀 **Production Ready**: Built with best practices for scalability and maintainability
- 🔧 **Error Handling**: Centralized error handling with custom error classes
- 🌐 **CORS Support**: Cross-origin resource sharing enabled
- 📋 **Health Check**: Built-in health check endpoint

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **External API**: Alpha Vantage API
- **Logging**: Winston with daily log rotation
- **Validation**: Express Validator
- **Development**: Nodemon for auto-restart
- **HTTP Client**: Axios for API calls

## Project Structure

```
stockapibackend/
├── ApiService/          # API service utilities
├── config/             # Configuration files
│   ├── db.js           # MongoDB connection
│   └── logger.js       # Winston logger setup
├── constants/          # Application constants
├── controllers/        # Route controllers
│   └── stockController.js
├── logs/              # Log files (auto-generated)
├── middlewares/       # Custom middleware
│   └── stockMiddleware.js
├── models/            # Mongoose models
│   ├── StockDataModel.js
│   └── DailyStockDataModel.js
├── modules/           # Business logic modules
├── routes/            # API routes
│   └── stockRoutes.js
├── services/          # External service integrations
│   └── AlphaVantageService.js
├── utils/             # Utility functions
│   └── ApiError.js
├── .env               # Environment variables
├── .gitignore         # Git ignore rules
├── package.json       # Project dependencies
└── StockApiServer.js  # Main server file
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DilipGhawade/stockapibackend.git
   cd stockapibackend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/stock_api
   LOG_LEVEL=debug
   LOG_DIR=logs
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
   ```

4. **Get Alpha Vantage API Key**:
   - Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - Sign up for a free API key
   - Replace `your_alpha_vantage_api_key` in the `.env` file

5. **Start MongoDB**:
   Make sure MongoDB is running on your system:
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Available Scripts
- `npm start` - Start the server in production mode
- `npm run dev` - Start with nodemon for development
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests (not implemented yet)

## API Endpoints

### Health Check
```http
GET /health
```
Returns server health status.

### Stock Endpoints

#### 1. Get Available Symbols
```http
GET /api/stocks/
```
Returns a list of available stock symbols.

#### 2. Get Intraday Data
```http
GET /api/stocks/{symbol}/intraday?interval={interval}
```
Fetch real-time intraday stock data.

**Parameters:**
- `symbol` (required): Stock symbol (e.g., AAPL, MSFT)
- `interval` (optional): Data interval - `1min`, `5min`, `15min`, `30min`, `60min` (default: `5min`)

**Example:**
```bash
curl "http://localhost:3000/api/stocks/AAPL/intraday?interval=5min"
```

#### 3. Get Daily Data
```http
GET /api/stocks/{symbol}/daily?outputsize={outputsize}
```
Fetch daily stock data.

**Parameters:**
- `symbol` (required): Stock symbol
- `outputsize` (optional): `compact` (last 100 days) or `full` (20+ years) (default: `compact`)

**Example:**
```bash
curl "http://localhost:3000/api/stocks/AAPL/daily?outputsize=compact"
```

#### 4. Get Historical Data
```http
GET /api/stocks/{symbol}/historical?start_date={start_date}&end_date={end_date}&interval={interval}
```
Fetch historical stock data within a date range.

**Parameters:**
- `symbol` (required): Stock symbol
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `interval` (optional): Data interval (default: `5min`)

**Example:**
```bash
curl "http://localhost:3000/api/stocks/AAPL/historical?start_date=2023-01-01&end_date=2023-12-31&interval=5min"
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    "metaData": {
      "information": "Intraday (5min) open, high, low, close prices and volume",
      "symbol": "AAPL",
      "lastRefreshed": "2023-12-15 16:00:00",
      "interval": "5min",
      "outputSize": "Compact",
      "timeZone": "US/Eastern"
    },
    "timeSeries": {
      "2023-12-15 16:00:00": {
        "open": "195.09",
        "high": "195.41",
        "low": "194.85",
        "close": "195.41",
        "volume": "4924628"
      }
    }
  },
  "message": "Data fetched successfully"
}
```

## Error Handling

The API uses centralized error handling with custom error classes:

```json
{
  "success": false,
  "message": "Invalid stock symbol provided",
  "stack": "Error stack trace (development mode only)"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/stock_api` |
| `LOG_LEVEL` | Logging level | `debug` |
| `LOG_DIR` | Log files directory | `logs` |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key | *required* |

## Development

### Code Style
- Uses ES6+ modules
- Follows Express.js best practices
- Implements proper error handling
- Uses async/await for asynchronous operations

### Logging
- Structured logging with Winston
- Daily log rotation
- Different log levels (error, warn, info, debug)
- Request logging with Morgan

### Database
- MongoDB with Mongoose ODM
- Automatic data persistence
- Model validation
- Bulk operations for performance

## API Rate Limits

Alpha Vantage API has rate limits:
- **Free Tier**: 5 API requests per minute, 500 requests per day
- **Premium Tiers**: Higher limits available

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Create an issue on [GitHub](https://github.com/DilipGhawade/stockapibackend/issues)
- Check the logs in the `logs/` directory for debugging

## Acknowledgments

- [Alpha Vantage](https://www.alphavantage.co/) for providing the stock market API
- [Express.js](https://expressjs.com/) for the web framework
- [MongoDB](https://www.mongodb.com/) for the database
- [Winston](https://github.com/winstonjs/winston) for logging
