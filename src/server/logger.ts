import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';

const logsDir = process.env.NEXUS_LOG_DIR ?? path.join(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

export const logger = pino(
  {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime
  },
  pino.destination(path.join(logsDir, 'nexus-profiling.log'))
);
