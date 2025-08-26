import 'dotenv/config';

import * as joi from 'joi';

interface Environment {
  PORT?: number;
  FB_VERIFY_TOKEN: string;
  GRAPH_API_URL: string;
}

const envSchema = joi
  .object({
    PORT: joi.number().integer().min(1).max(65535).default(3000),
    FB_VERIFY_TOKEN: joi.string().required(),
    GRAPH_API_URL: joi.string().uri().required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const envVars: Environment = value;

export const environment = {
  port: envVars.PORT,
  fb: {
    verifyToken: envVars.FB_VERIFY_TOKEN,
    graphApiUrl: envVars.GRAPH_API_URL,
  },
};
