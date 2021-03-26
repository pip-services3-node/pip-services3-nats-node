let process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';

import { MessageQueueFixture } from './MessageQueueFixture';
import { NatsMessageQueue } from '../../src/queues/NatsMessageQueue';

suite('NatsMessageQueue', ()=> {
    let queue: NatsMessageQueue;
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
        'options.autosubscribe', true
    );        

    setup((done) => {
        queue = new NatsMessageQueue(brokerQueue);
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