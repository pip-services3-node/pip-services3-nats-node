"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let process = require('process');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const MessageQueueFixture_1 = require("./MessageQueueFixture");
const NatsMessageQueue_1 = require("../../src/queues/NatsMessageQueue");
suite('NatsMessageQueue', () => {
    let queue;
    let fixture;
    let brokerHost = process.env['NATS_SERVICE_HOST'] || 'localhost';
    let brokerPort = process.env['NATS_SERVICE_PORT'] || 4222;
    if (brokerHost == '' && brokerPort == '') {
        return;
    }
    let brokerQueue = process.env['NATS_QUEUE'] || 'test';
    let brokerUser = process.env['NATS_USER'];
    let brokerPass = process.env['NATS_PASS'];
    let brokerToken = process.env['NATS_TOKEN'];
    let queueConfig = pip_services3_commons_node_1.ConfigParams.fromTuples('queue', brokerQueue, 'connection.protocol', 'nats', 'connection.host', brokerHost, 'connection.port', brokerPort, 'credential.username', brokerUser, 'credential.password', brokerPass, 'credential.token', brokerToken);
    setup((done) => {
        queue = new NatsMessageQueue_1.NatsMessageQueue(brokerQueue);
        queue.configure(queueConfig);
        fixture = new MessageQueueFixture_1.MessageQueueFixture(queue);
        queue.open(null, (err) => {
            // queue.clear(null, (err) => {
            //     done(err);
            // });
            done(err);
        });
    });
    teardown((done) => {
        queue.close(null, done);
    });
    test('Send and Receive Message', (done) => {
        fixture.testSendReceiveMessage(done);
    });
    test('Receive and Send Message', (done) => {
        fixture.testReceiveSendMessage(done);
    });
    test('Send Peek Message', (done) => {
        fixture.testSendPeekMessage(done);
    });
    test('Peek No Message', (done) => {
        fixture.testPeekNoMessage(done);
    });
    test('On Message', (done) => {
        fixture.testOnMessage(done);
    });
});
//# sourceMappingURL=NatsMessageQueue.test.js.map