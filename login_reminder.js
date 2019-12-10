const redis = require('redis');

class LoginReminder {
    constructor(options) {
        this.options = options;

        this.client = redis.createClient({
            host: options.host,
            port: options.port,
            password: options.password,
            db: options.db
        });

        // https://redis.io/topics/notifications
        // add notify options and set value to Ex where (E for Event and x for expired)
        this.client.on('ready', () => {
            this.client.config("SET", "notify-keyspace-events", "Ex");
        });
    }

    get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (error, reply) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (error, reply) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    setZeroAttempt(key) {
        return new Promise((resolve, reject) => {
            this.client.set(key, 0, (error, reply) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    incrAttempt(key) {
        return new Promise((resolve, reject) => {
            this.client.incr(key, (error, reply) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    setReminder(key, value, expire) {
        return new Promise((resolve, reject) => {
            this.client
            .multi()
            .set(`LOGIN-ATTEMPT:${key}`, value)
            .expire(`LOGIN-ATTEMPT:${key}`, expire)
            .exec((error, reply) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

}

module.exports = LoginReminder;