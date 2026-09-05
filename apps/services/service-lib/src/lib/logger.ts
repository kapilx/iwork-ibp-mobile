import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import WinstonCloudWatch from 'winston-cloudwatch';
import { ENV } from "./environment";
import { TraceIdService } from './trace-id.service';

// Custom log formatter
const LoggerFormat = winston.format.printf((info: any) => {
  return `[Logger] ${info.timestamp} [${info.level}]: ${info.message}`;
});

// CloudWatch configuration
let cloudwatchConfig = {
  logGroupName: ENV.LOG_GROUP_NAME,
  logStreamName: `global-stream`,
  // awsAccessKeyId: ENV.AWS_ACCESS_KEY_ID,
  // awsSecretKey: ENV.AWS_SECRET_ACCESS_KEY,
  awsRegion: ENV.AWS_REGION,
  messageFormatter: ({ level, message }: { level: string; message: string; }) =>
    `[${level}] : ${message}`,
};

// Utility to generate log file paths dynamically
function getLogFilePaths() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const logDir = path.join(process.cwd(), `logs/${year}-${month}-logs`);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const errorLog = path.join(logDir, `${year}-${month}-${day}-error.log`);
  const systemLog = path.join(logDir, `${year}-${month}-${day}-system.log`);
  return { errorLog, systemLog };
}

export function createLogger(traceIdService?: TraceIdService, serviceName?: string) {
  const date = new Date().toISOString().split('T')[0];
  cloudwatchConfig.logStreamName = serviceName
    ? `${serviceName}-${date}`
    : 'global-stream';
  const { errorLog, systemLog } = getLogFilePaths();

  const transports: winston.transport[] = [];

  if ((ENV.CONSOLE_LOG ?? 'false') === 'true') {
    transports.push(
      new winston.transports.Console({
        level: 'silly',
        format: winston.format.combine(winston.format.colorize(), LoggerFormat),
      })
    );
  }

  if ((ENV.FILE_LOG ?? 'false') === 'true') {
    transports.push(
      new winston.transports.File({ filename: errorLog, level: 'error' }),
      new winston.transports.File({ filename: systemLog, level: 'silly' })
    );
  }

  if ((ENV.CLOUD_WATCH_LOG ?? 'false') === 'true') {
    transports.push(new WinstonCloudWatch(cloudwatchConfig));
  }

  const addTraceFormat = winston.format((info) => {
    const id = traceIdService?.traceId;
    if (id) {
      info.message = `[traceId=${id}] ${info.message}`;
    }
    return info;
  });

  return WinstonModule.createLogger({
    format: winston.format.combine(
      addTraceFormat(),
      winston.format.timestamp(),
      winston.format.json(),
      LoggerFormat,
    ),
    transports,
  });
}
