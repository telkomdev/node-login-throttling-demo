const {RateLimiterRedis} = require('rate-limiter-flexible');

class RateLimit {
    constructor(options = {}) {
        this.rateLimiter = new RateLimiterRedis({
            redis: options.redisClient,
            keyPrefix: 'middleware',
            points: options.points, //  options.points requests
            duration: options.duration, // per options.duration /interval second by IP
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