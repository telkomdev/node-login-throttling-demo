const {RateLimiterRedis} = require('rate-limiter-flexible');

class RateLimit {
    constructor(options = {}) {
        this.rateLimiter = new RateLimiterRedis({
            redis: options.redisClient,
            keyPrefix: 'middleware',
            points: options.points, //  options.points requests
            duration: options.duration, // per options.duration second by IP
        });
    }

    setRateLimiterMiddleware() {
        return (req, res, next) => {
            console.log(req.ip);
            this.rateLimiter.consume(req.ip)
              .then(() => {
                next();
              })
              .catch(() => {
                res.status(429).json({'message': 'too many requests'});
              });
          };
    }
}

module.exports = RateLimit;