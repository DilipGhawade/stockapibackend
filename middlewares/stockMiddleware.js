import { body, query, param } from "express-validator";
import ApiError from "../utils/ApiError.js";

export const validateSymbol = [
  param("symbol")
    .exists()
    .withMessage("Symbol is required")
    .isString()
    .withMessage("Symbol must be a string")
    .isLength({ min: 1, max: 10 })
    .withMessage("Symbol must be 1-10 characters")
    .trim()
    .escape(),
];

export const validateInterval = [
  query("interval")
    .optional()
    .isIn(["1min", "5min", "15min", "30min", "60min"])
    .withMessage(
      "Invalid interval. Must be one of: 1min, 5min, 15min, 30min, 60min"
    ),
];

export const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO8601 date")
    .custom((value, { req }) => {
      if (
        req.query.startDate &&
        new Date(value) < new Date(req.query.startDate)
      ) {
        throw new Error("endDate must be after startDate");
      }
      return true;
    }),
];

export const checkCache = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { interval = "5min" } = req.query;

    const cachedData = await req.redisClient.get(`stock:${symbol}:${interval}`);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedData),
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateOutputSize = (req, res, next) => {
  const { outputsize = "compact" } = req.query;

  if (outputsize && !["compact", "full"].includes(outputsize.toLowerCase())) {
    return next(
      new ApiError(
        400,
        'Invalid output size. Must be either "compact" or "full"'
      )
    );
  }

  // Convert to lowercase for consistency
  req.query.outputsize = outputsize.toLowerCase();
  next();
};

export const rateLimiter = (req, res, next) => {
  // Implement rate limiting logic here
  next();
};
