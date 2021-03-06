const assert = require('chai').assert;
const async = require('async');
const process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';

import { NatsConnection } from '../../src/connect/NatsConnection';

suite('NatsConnection', ()=> {
    let connection: NatsConnection;

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
        let config = ConfigParams.fromTuples(
            'queue', brokerQueue,
            'connection.protocol', 'nats',
            'connection.host', brokerHost,
            'connection.port', brokerPort,
            'credential.username', brokerUser,
            'credential.password', brokerPass,
            'credential.token', brokerToken,
        );        

        connection = new NatsConnection();
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