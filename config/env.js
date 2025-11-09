// config/env.js
// Centralized environment validation and configuration
const Joi = require('joi');
const logger = require('../logger');

// Ensure .env is loaded if present
require('dotenv').config();

// Define validation schema for required environment variables
const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  JWT_SECRET: Joi.string().min(32).messages({
    'string.min': 'JWT_SECRET must be at least 32 characters. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  }),
  JWT_EXPIRES_IN: Joi.string().default('2h'),
}).unknown(true); // allow other vars

const { value: env, error } = schema.validate(process.env, { abortEarly: false });

// If running in test, allow an implicit test secret to avoid noisy setup
if (!env.JWT_SECRET && env.NODE_ENV === 'test') {
  env.JWT_SECRET = 'test-secret-key';
}

if (!env.JWT_SECRET) {
  const msg = 'Missing required env var JWT_SECRET. Refusing to start. Set a strong secret (>= 32 chars).';
  // Use console.error early in boot in case logger depends on config
  try { logger.error(msg); } catch (_) { /* ignore if logger not ready */ }
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(1);
}

// Enforce length outside of Joi when not in test
if (env.NODE_ENV !== 'test' && env.JWT_SECRET.length < 32) {
  const msg = 'JWT_SECRET too short. It must be at least 32 characters in non-test environments.';
  try { logger.error(msg); } catch (_) {}
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(1);
}

module.exports = {
  NODE_ENV: env.NODE_ENV,
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
};
