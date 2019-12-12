const {RateLimiterRedis, RateLimiterMemory} = require('rate-limiter-flexible');

class RateLimit {
    constructor(options = {}) {
      // assume you are not confidence with your redis instance
      // so take care your Redis rate limiter
      const rateLimiterMemory = new RateLimiterMemory({
        points: options.points, // 300 / 5 if there are 5 processes at all
        duration: options.duration,
      });

        this.rateLimiter = new RateLimiterRedis({
            redis: options.redisClient,
            keyPrefix: 'rate-limit',
            points: options.points, //  options.points requests
            duration: options.duration, // per options.duration /interval second by IP
            insuranceLimiter: rateLimiterMemory
        });
    }

    setRateLimiterMiddleware() {
        return (req, res, next) => {
          // restify user
          // const ip = req.connection.remoteAddress || req.headers['x-forwarded-for'];
          // this.rateLimiter.consume(ip)

          // express user
          const ip = req.ip || req.headers['x-forwarded-for'];
          this.rateLimiter.consume(ip)
            .then(() => {
              next();
            })
            .catch(() => {
              // restify user
              //res.send(429, {'message': 'too many requests'});
              // express user
              res.status(429).json({'message': 'too many requests'});
            });
        };
    }
}

module.exports = RateLimit;