let process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';

import { MessageQueueFixture } from './MessageQueueFixture';
import { NatsBareMessageQueue } from '../../src/queues/NatsBareMessageQueue';

suite('NatsBareMessageQueue', ()=> {
    let queue: NatsBareMessageQueue;
    let fixture: MessageQueueFixture;

    let brokerHost = process.env['NATS_SERVICE_HOST'] || 'localhost';
    let brokerPort = process.env['NATS_SERVICE_PORT'] || 4222;
    if (brokerHost == '' && brokerPort == '') {
        return;
    }
    let brokerQueue = process.env['NATS_QUEUE'] || 'test';
    let brokerUser = process.env['NATS_USER'];
    let brokerPass = process.env['NATS_PASS'];
    let brokerToken = process.env['NATS_TOKEN'];

    let queueConfig = ConfigParams.fromTuples(
        'queue', brokerQueue,
        'connection.protocol', 'nats',
        'connection.host', brokerHost,
        'connection.port', brokerPort,
        'credential.username', brokerUser,
        'credential.password', brokerPass,
        'credential.token', brokerToken,
    );        

    setup((done) => {
        queue = new NatsBareMessageQueue(brokerQueue);
        queue.configure(queueConfig);

        fixture = new MessageQueueFixture(queue);

        queue.open(null, (err: any) => {
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