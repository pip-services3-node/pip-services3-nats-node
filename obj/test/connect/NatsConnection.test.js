"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('chai').assert;
const async = require('async');
const process = require('process');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const NatsConnection_1 = require("../../src/connect/NatsConnection");
suite('NatsConnection', () => {
    let connection;
    let brokerHost = process.env['NATS_SERVICE_HOST'] || 'localhost';
    let brokerPort = process.env['NATS_SERVICE_PORT'] || 4222;
    if (brokerHost == '' && brokerPort == '') {
        return;
    }
    let brokerQueue = process.env['NATS_QUEUE'] || 'test';
    let brokerUser = process.env['NATS_USER'];
    let brokerPass = process.env['NATS_PASS'];
    let brokerToken = process.env['NATS_TOKEN'];
    setup(() => {
        let config = pip_services3_commons_node_1.ConfigParams.fromTuples('queue', brokerQueue, 'connection.protocol', 'nats', 'connection.host', brokerHost, 'connection.port', brokerPort, 'credential.username', brokerUser, 'credential.password', brokerPass, 'credential.token', brokerToken);
        connection = new NatsConnection_1.NatsConnection();
        connection.configure(config);
    });
    test('Open/Close', (done) => {
        async.series([
            (callback) => {
                connection.open(null, (err) => {
                    assert.isNull(err);
                    assert.isTrue(connection.isOpen());
                    assert.isNotNull(connection.getConnection());
                    callback(err);
                });
            },
            (callback) => {
                connection.close(null, (err) => {
                    assert.isNull(err);
                    assert.isFalse(connection.isOpen());
                    assert.isNull(connection.getConnection());
                    callback(err);
                });
            }
        ], (err) => {
            done(err);
        });
    });
});
//# sourceMappingURL=NatsConnection.test.js.map