const redis = require('redis');

// https://redis.io/topics/pubsub
// http://redis.js.org/#api-publish-subscribe
class LoginThrottlePubSub {
    constructor(options) {
        this.options = options;

        this.pubClient = redis.createClient({
            host: options.host,
            port: options.port,
            password: options.password,
            db: options.db
        });

        this.subClient = redis.createClient({
            host: options.host,
            port: options.port,
            password: options.password,
            db: options.db
        });
    }

    publish(message, cb) {
        this.pubClient.publish(this.options.channel, message, (error, reply) => {
            cb(error, reply);
        });
    }

    subscribe() {
        this.subClient.subscribe(this.options.channel);
    }

    on(event, cb) {
        this.subClient.on(event, (channel, message) => {
            cb(channel, message);
        });
    }


}

module.exports = LoginThrottlePubSub;