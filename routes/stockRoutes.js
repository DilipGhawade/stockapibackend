import express from "express";
import {
  getIntradayData,
  getDailyData,
  getHistoricalData,
  listAvailableSymbols,
} from "../controllers/stockController.js";
import {
  validateSymbol,
  validateInterval,
  validateDateRange,
  validateOutputSize,
} from "../middlewares/stockMiddleware.js";

const router = express.Router();

// Get intraday stock data
router.get(
  "/:symbol/intraday",
  validateSymbol,
  validateInterval,
  getIntradayData
);

// Get daily stock data
router.get(
  "/:symbol/daily",
  validateSymbol,
  validateOutputSize,
  getDailyData
);

// Get historical stock data (deprecated, use daily instead)
router.get(
  "/:symbol/historical",
  validateSymbol,
  validateInterval,
  validateDateRange,
  getHistoricalData
);

// List available stock symbols
router.get("/", listAvailableSymbols);

export default router;
