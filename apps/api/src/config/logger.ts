import pino from 'pino'
import { isTest } from './env'

/** Logger com REDACTION (constituição §2): segredos nunca em log. */
export const logger = pino({
  level: isTest ? 'silent' : 'info',
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'refreshToken',
      '*.refreshToken',
      'accessToken',
      '*.accessToken',
      'authorization',
      '*.authorization',
      'cookie',
      '*.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
})
