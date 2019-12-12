const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
require('dotenv').config();

const LoginThrottlePubSub = require('./login_throttle_sub');
const LoginReminder = require('./login_reminder');

const RateLimit = require('./middleware/rate_limit');

const PORT = process.env.PORT;

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;
const redisDB = process.env.REDIS_DB;

// redis configuration
const redisOptions = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDB,

    // https://redis.io/topics/notifications
    // this will tell subscriber to subscribe expired event channel
    channel: '__keyevent@0__:expired'
};

const redisClient = redis.createClient({
    host: redisOptions.host,
    port: redisOptions.port,
    password: redisOptions.password,
    db: redisOptions.db,
    enable_offline_queue: false
});

// create RateLimit instance
const rateLimit = new RateLimit({redisClient: redisClient, points: 5, duration: 2});

// construct express
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set rate limit middleware
app.use(rateLimit.setRateLimiterMiddleware());

const loginThrottlePubSub = new LoginThrottlePubSub(redisOptions);
const loginReminder = new LoginReminder(redisOptions);

const userStatusActive = 'ACTIVE';
const userStatusBlocked = 'BLOCKED';

// user database dummy
let userDB = {
    'wury': {username: 'wury', password: '12345', status: userStatusActive},
    'alex': {username: 'alex', password: '12345', status: userStatusActive},
    'boby': {username: 'boby', password: '12345', status: userStatusActive}
};

app.get('/', (req, res, next) => {
	res.json({"hello": "helloooo"});
});

app.post('/login', async (req, res, next) => {
    const body = req.body;
    const username = body.username;
    const password = body.password;

    if (username == '' || password == '') {
        return res.json({'message': 'invalid username or password'});
    }

    // get user from db
    const user = userDB[username];

    const threshold = 3;

    if (user === undefined) {
        return res.json({'message': 'user not found'});
    }

    if (user.status === userStatusBlocked) {
        return res.json({'message': 'user blocked'});
    }

    if (user.password !== password) {
        
        const reply = await loginReminder.get(username);
        // if reply == null set attempt to 0
        if (reply == null) {
            await loginReminder.setZeroAttempt(username);
        } else {
            let attempt = await loginReminder.incrAttempt(username);
            // if attempt equal to threshold then set reminder
            if (attempt === threshold) {
                await loginReminder.setReminder(username, `${username}:${password}`, 30);

                // update user status to BLOCKED
                userDB[username].status = userStatusBlocked;

                return res.json({'message': 'you reach maximum login attempt, please try again in 30 seconds'});
            }
        }

        return res.json({'message': 'invalid username or password'});
    }

    return res.json({'message': 'success'});
});

// subscribe to data expired event
loginThrottlePubSub.subscribe();
loginThrottlePubSub.on('message', async (channel, message) => {
    const [type, key] = message.split(':');

    switch (type) {
        case 'LOGIN-ATTEMPT':
            // update user status to ACTIVE
            userDB[key].status = userStatusActive;

            // del attempt by user
            await loginReminder.del(key);
            console.log(key, ' active');
    }
});

app.listen(PORT, () => {
	console.log(`app listen on port ${PORT}`);
});