export interface CustomConfig {
    env: string,
    server: {
      url: string,
      maxResultsLimit: number,
      port: number
    },
    auth: {
      token: {
        secret: string,
        issuer: string,
        algorithm: string
      },
      key: string,
      passwordTtl: number
    },
  
    rateLimit: {
      window: string,
      requests: number
    },
  
    mongo: {
      db: string,
      url: string
    },
  
    logger: {
      sentry: {
        dsn: string
      },
      console: {
        level: string,
        timestamp: boolean,
        handleExceptions: boolean,
        humanReadableUnhandledException: boolean,
        colorize: boolean
      }
    },
  
    exchange: {
      interval: string,
      queryMinutes: string,
      timezone: string,
      enable: boolean
    }
  }
  