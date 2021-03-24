"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let process = require('process');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const MessageQueueFixture_1 = require("./MessageQueueFixture");
const NatsBareMessageQueue_1 = require("../../src/queues/NatsBareMessageQueue");
suite('NatsBareMessageQueue', () => {
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
        queue = new NatsBareMessageQueue_1.NatsBareMessageQueue(brokerQueue);
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
    test('Receive and Send Message', (done) => {
        fixture.testReceiveSendMessage(done);
    });
    test('On Message', (done) => {
        fixture.testOnMessage(done);
    });
});
//# sourceMappingURL=NatsBareMessageQueue.test.js.map