"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsAbstractMessageQueue = void 0;
/** @module queues */
/** @hidden */
const _ = require('lodash');
/** @hidden */
const nats = require('nats');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const pip_services3_commons_node_5 = require("pip-services3-commons-node");
const pip_services3_commons_node_6 = require("pip-services3-commons-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_messaging_node_1 = require("pip-services3-messaging-node");
const pip_services3_messaging_node_2 = require("pip-services3-messaging-node");
const NatsConnection_1 = require("../connect/NatsConnection");
/**
 * Abstract NATS message queue with ability to connect to NATS server.
 */
class NatsAbstractMessageQueue extends pip_services3_messaging_node_1.MessageQueue {
    /**
     * Creates a new instance of the persistence component.
     *
     * @param name    (optional) a queue name.
     */
    constructor(name, capabilities) {
        super(name, capabilities);
        /**
         * The dependency resolver.
         */
        this._dependencyResolver = new pip_services3_commons_node_6.DependencyResolver(NatsAbstractMessageQueue._defaultConfig);
        /**
         * The logger.
         */
        this._logger = new pip_services3_components_node_1.CompositeLogger();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        config = config.setDefaults(NatsAbstractMessageQueue._defaultConfig);
        this._config = config;
        this._dependencyResolver.configure(config);
        // this._serializeEnvelop = config.getAsBooleanWithDefault("options.serialize_envelop", this._serializeEnvelop)
        this._subject = config.getAsStringWithDefault("topic", this._subject);
        this._subject = config.getAsStringWithDefault("subject", this._subject);
        this._queueGroup = config.getAsStringWithDefault("group", this._queueGroup);
        this._queueGroup = config.getAsStringWithDefault("queue_group", this._queueGroup);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._references = references;
        this._logger.setReferences(references);
        // Get connection
        this._dependencyResolver.setReferences(references);
        this._connection = this._dependencyResolver.getOneOptional('connection');
        // Or create a local one
        if (this._connection == null) {
            this._connection = this.createConnection();
            this._localConnection = true;
        }
        else {
            this._localConnection = false;
        }
    }
    /**
     * Unsets (clears) previously set references to dependent components.
     */
    unsetReferences() {
        this._connection = null;
    }
    createConnection() {
        let connection = new NatsConnection_1.NatsConnection();
        if (this._config)
            connection.configure(this._config);
        if (this._references)
            connection.setReferences(this._references);
        return connection;
    }
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen() {
        return this._opened;
    }
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId, callback) {
        if (this._opened) {
            callback(null);
            return;
        }
        if (this._connection == null) {
            this._connection = this.createConnection();
            this._localConnection = true;
        }
        let openCurl = (err) => {
            if (err == null && this._connection == null) {
                err = new pip_services3_commons_node_5.InvalidStateException(correlationId, 'NO_CONNECTION', 'NATS connection is missing');
            }
            if (err == null && !this._connection.isOpen()) {
                err = new pip_services3_commons_node_4.ConnectionException(correlationId, "CONNECT_FAILED", "NATS connection is not opened");
            }
            this._opened = true;
            if (err) {
                if (callback)
                    callback(err);
            }
            else {
                this._client = this._connection.getConnection();
                if (callback)
                    callback(null);
            }
        };
        if (this._localConnection) {
            this._connection.open(correlationId, openCurl);
        }
        else {
            openCurl(null);
        }
    }
    /**
     * Opens the component with given connection and credential parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param connection        connection parameters
     * @param credential        credential parameters
     * @param callback 			callback function that receives error or null no errors occured.
     */
    openWithParams(correlationId, connections, credential, callback) {
        throw new Error("Not supported");
    }
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId, callback) {
        if (!this._opened) {
            callback(null);
            return;
        }
        if (this._connection == null) {
            callback(new pip_services3_commons_node_5.InvalidStateException(correlationId, 'NO_CONNECTION', 'Nats connection is missing'));
            return;
        }
        let closeCurl = (err) => {
            this._opened = false;
            this._client = null;
            if (callback)
                callback(err);
        };
        if (this._localConnection) {
            this._connection.close(correlationId, closeCurl);
        }
        else {
            closeCurl(null);
        }
    }
    getSubject() {
        return this._subject != null && this._subject != "" ? this._subject : this._name;
    }
    fromMessage(message) {
        if (message == null)
            return null;
        let data = message.message || nats.Empty;
        let headers = nats.headers();
        headers.append("message_id", message.message_id);
        headers.append("correlation_id", message.correlation_id);
        headers.append("message_type", message.message_type);
        headers.append("sent_time", pip_services3_commons_node_2.StringConverter.toNullableString(message.sent_time || new Date()));
        return {
            data: data,
            headers: headers
        };
    }
    toMessage(msg) {
        if (msg == null)
            return null;
        let correlationId = msg.headers.get("correlation_id");
        let messageType = msg.headers.get("message_type");
        let message = new pip_services3_messaging_node_2.MessageEnvelope(correlationId, messageType, Buffer.from(msg.data));
        message.message_id = msg.headers.get("message_id");
        message.sent_time = pip_services3_commons_node_1.DateTimeConverter.toNullableDateTime(msg.headers.get("sent_time"));
        message.message = msg.data;
        return message;
    }
    /**
     * Clears component state.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    clear(correlationId, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    /**
     * Reads the current number of messages in the queue to be delivered.
     *
     * @param callback      callback function that receives number of messages or error.
     */
    readMessageCount(callback) {
        // Not supported
        callback(null, 0);
    }
    /**
     * Sends a message into the queue.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param message           a message envelop to be sent.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    send(correlationId, message, callback) {
        let err = this.checkOpen(correlationId);
        if (err != null) {
            if (callback)
                callback(err);
            return;
        }
        let subject = this.getName() || this._subject;
        let msg = this.fromMessage(message);
        this._connection.publish(subject, msg, callback);
    }
    /**
     * Renews a lock on a message that makes it invisible from other receivers in the queue.
     * This method is usually used to extend the message processing time.
     *
     * Important: This method is not supported by NATS.
     *
     * @param message       a message to extend its lock.
     * @param lockTimeout   a locking timeout in milliseconds.
     * @param callback      (optional) callback function that receives an error or null for success.
     */
    renewLock(message, lockTimeout, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    /**
     * Permanently removes a message from the queue.
     * This method is usually used to remove the message after successful processing.
     *
     * Important: This method is not supported by NATS.
     *
     * @param message   a message to remove.
     * @param callback  (optional) callback function that receives an error or null for success.
     */
    complete(message, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    /**
     * Returnes message into the queue and makes it available for all subscribers to receive it again.
     * This method is usually used to return a message which could not be processed at the moment
     * to repeat the attempt. Messages that cause unrecoverable errors shall be removed permanently
     * or/and send to dead letter queue.
     *
     * Important: This method is not supported by NATS.
     *
     * @param message   a message to return.
     * @param callback  (optional) callback function that receives an error or null for success.
     */
    abandon(message, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
    /**
     * Permanently removes a message from the queue and sends it to dead letter queue.
     *
     * Important: This method is not supported by NATS.
     *
     * @param message   a message to be removed.
     * @param callback  (optional) callback function that receives an error or null for success.
     */
    moveToDeadLetter(message, callback) {
        // Not supported
        if (callback)
            callback(null);
    }
}
exports.NatsAbstractMessageQueue = NatsAbstractMessageQueue;
NatsAbstractMessageQueue._defaultConfig = pip_services3_commons_node_3.ConfigParams.fromTuples("subject", null, "queue_group", null, "options.serialize_envelop", true, "options.retry_connect", true, "options.connect_timeout", 0, "options.reconnect_timeout", 3000, "options.max_reconnect", 3, "options.flush_timeout", 3000);
//# sourceMappingURL=NatsAbstractMessageQueue.js.map