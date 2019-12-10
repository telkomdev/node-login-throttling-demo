const restify = require('restify');
const redis = require('redis');

require('dotenv').config();

const RateLimit = require('./middleware/rate_limit');

const PORT = process.env.PORT;

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;
const redisDB = process.env.REDIS_DB;


const redisClient = redis.createClient({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDB
});

// create RateLimit instance
const rateLimit = new RateLimit({redisClient: redisClient, points: 5, duration: 1});

// create restify
const server = restify.createServer();

// set rate limit middleware
server.use(rateLimit.setRateLimiterMiddleware());

server.get('/', (req, res, next) => {
    res.send({'message': 'hello'});
    next();
  });

server.listen(PORT, function() {
  console.log('%s listening at %s', server.name, server.url);
});
