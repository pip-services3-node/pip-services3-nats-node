"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsBareMessageQueue = void 0;
/** @module queues */
/** @hidden */
const async = require('async');
const pip_services3_messaging_node_1 = require("pip-services3-messaging-node");
const NatsAbstractMessageQueue_1 = require("./NatsAbstractMessageQueue");
/**
 * Message queue that sends and receives messages via NATS message broker.
 *
 * ### Configuration parameters ###
 *
 * - subject:                       name of NATS topic (subject) to subscribe
 * - queue_group:                   name of NATS queue group
 * - connection(s):
 *   - discovery_key:               (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                        host name or IP address
 *   - port:                        port number
 *   - uri:                         resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:                   (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                    user name
 *   - password:                    user password
 * - options:
 *   - serialize_message:    (optional) true to serialize entire message as JSON, false to send only message payload (default: true)
 *   - retry_connect:        (optional) turns on/off automated reconnect when connection is log (default: true)
 *   - max_reconnect:        (optional) maximum reconnection attempts (default: 3)
 *   - reconnect_timeout:    (optional) number of milliseconds to wait on each reconnection attempt (default: 3000)
 *   - flush_timeout:        (optional) number of milliseconds to wait on flushing messages (default: 3000)
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>             (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:counters:\*:\*:1.0</code>           (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/count.icounters.html ICounters]] components to pass collected measurements
 * - <code>\*:discovery:\*:\*:1.0</code>          (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connections
 * - <code>\*:credential-store:\*:\*:1.0</code>   (optional) Credential stores to resolve credentials
 * - <code>\*:connection:nats:\*:1.0</code>       (optional) Shared connection to NATS service
 *
 * @see [[MessageQueue]]
 * @see [[MessagingCapabilities]]
 *
 * ### Example ###
 *
 *     let queue = new NatsBareMessageQueue("myqueue");
 *     queue.configure(ConfigParams.fromTuples(
 *       "topic", "mytopic",
 *       "connection.protocol", "nats"
 *       "connection.host", "localhost"
 *       "connection.port", 1883
 *     ));
 *
 *     queue.open("123", (err) => {
 *         ...
 *     });
 *
 *     queue.send("123", new MessageEnvelope(null, "mymessage", "ABC"));
 *
 *     queue.receive("123", (err, message) => {
 *         if (message != null) {
 *            ...
 *            queue.complete("123", message);
 *         }
 *     });
 */
class NatsBareMessageQueue extends NatsAbstractMessageQueue_1.NatsAbstractMessageQueue {
    /**
     * Creates a new instance of the message queue.
     *
     * @param name  (optional) a queue name.
     */
    constructor(name) {
        super(name, new pip_services3_messaging_node_1.MessagingCapabilities(false, true, true, false, false, false, false, false, false));
    }
    /**
     * Peeks a single incoming message from the queue without removing it.
     * If there are no messages available in the queue it returns null.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback          callback function that receives a message or error.
     */
    peek(correlationId, callback) {
        // Not supported
        callback(null, null);
    }
    /**
     * Peeks multiple incoming messages from the queue without removing them.
     * If there are no messages available in the queue it returns an empty list.
     *
     * Important: This method is not supported by NATS.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param messageCount      a maximum number of messages to peek.
     * @param callback          callback function that receives a list with messages or error.
     */
    peekBatch(correlationId, messageCount, callback) {
        // Not supported
        callback(null, []);
    }
    /**
     * Receives an incoming message and removes it from the queue.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param waitTimeout       a timeout in milliseconds to wait for a message to come.
     * @param callback          callback function that receives a message or error.
     */
    receive(correlationId, waitTimeout, callback) {
        let err = this.checkOpen(correlationId);
        if (err != null) {
            callback(err, null);
            return;
        }
        this._client.subscribe(this.getSubject(), {
            max: 1,
            timeout: waitTimeout,
            callback: (err, msg) => {
                if (err != null) {
                    callback(err, null);
                    return;
                }
                let message = this.toMessage(msg);
                if (message != null) {
                    this._counters.incrementOne("queue." + this.getName() + ".received_messages");
                    this._logger.debug(message.correlation_id, "Received message %s via %s", message, this.getName());
                }
                callback(null, message);
            }
        });
    }
    receiveMessage(msg, receiver) {
        // Deserialize message
        let message = this.toMessage(msg);
        if (message == null) {
            this._logger.error(null, null, "Failed to read received message");
            return;
        }
        this._counters.incrementOne("queue." + this.getName() + ".received_messages");
        this._logger.debug(message.correlation_id, "Received message %s via %s", message, this.getName());
        try {
            receiver.receiveMessage(message, this, (err) => {
                if (err != null) {
                    this._logger.error(message.correlation_id, err, "Failed to process the message");
                }
            });
        }
        catch (err) {
            this._logger.error(message.correlation_id, err, "Failed to process the message");
        }
    }
    /**
     * Listens for incoming messages and blocks the current thread until queue is closed.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param receiver          a receiver to receive incoming messages.
     *
     * @see [[IMessageReceiver]]
     * @see [[receive]]
     */
    listen(correlationId, receiver) {
        let err = this.checkOpen(correlationId);
        if (err != null) {
            throw err;
        }
        this._client.subscribe(this.getSubject(), {
            queue: this._queueGroup,
            callback: (err, msg) => {
                if (err != null) {
                    this._logger.error(correlationId, err, "Failed to subscribe to message queue");
                }
                else {
                    this.receiveMessage(msg, receiver);
                }
            }
        });
    }
    /**
     * Ends listening for incoming messages.
     * When this method is call [[listen]] unblocks the thread and execution continues.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     */
    endListen(correlationId) {
        if (this._subscription) {
            this._subscription.unsubscribe();
            this._subscription = null;
        }
    }
}
exports.NatsBareMessageQueue = NatsBareMessageQueue;
//# sourceMappingURL=NatsBareMessageQueue.js.map