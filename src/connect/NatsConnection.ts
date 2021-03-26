/** @module connect */
const _ = require('lodash');
const nats = require('nats');

import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IOpenable } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { ConnectionException } from 'pip-services3-commons-node';
import { InvalidStateException } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { IMessageQueueConnection } from 'pip-services3-messaging-node';

import { NatsConnectionResolver } from './NatsConnectionResolver';
import { INatsMessageListener } from './INatsMessageListener';
import { NatsSubscription } from './NatsSubscription';

/**
 * NATS connection using plain driver.
 * 
 * By defining a connection and sharing it through multiple message queues
 * you can reduce number of used database connections.
 * 
 * ### Configuration parameters ###
 * 
 * - connection(s):    
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                      host name or IP address
 *   - port:                      port number (default: 27017)
 *   - uri:                       resource URI or connection string with all parameters in it
 * - credential(s):    
 *   - store_key:                 (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                  user name
 *   - password:                  user password
 * - options:
 *   - retry_connect:        (optional) turns on/off automated reconnect when connection is log (default: true)
 *   - max_reconnect:        (optional) maximum reconnection attempts (default: 3)
 *   - reconnect_timeout:    (optional) number of milliseconds to wait on each reconnection attempt (default: 3000)
 *   - flush_timeout:        (optional) number of milliseconds to wait on flushing messages (default: 3000)
 * 
 * ### References ###
 * 
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
 * 
 */
export class NatsConnection implements IMessageQueueConnection, IReferenceable, IConfigurable, IOpenable {

    private _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        // connections.*
        // credential.*

        "options.retry_connect", true,
        "options.connect_timeout", 0,
        "options.reconnect_timeout", 3000,
        "options.max_reconnect", 3,
        "options.flush_timeout", 3000
    );

    /** 
     * The logger.
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    /**
     * The connection resolver.
     */
    protected _connectionResolver: NatsConnectionResolver = new NatsConnectionResolver();
    /**
     * The configuration options.
     */
    protected _options: ConfigParams = new ConfigParams();

    /**
     * The NATS connection pool object.
     */
    protected _connection: any;

    /**
     * Topic subscriptions
     */
    protected _subscriptions: NatsSubscription[] = [];

    protected _retryConnect: boolean = true;
    protected _maxReconnect: number = 3;
    protected _reconnectTimeout: number = 3000;
    protected _flushTimeout: number = 3000;

    /**
     * Creates a new instance of the connection component.
     */
    public constructor() {}

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        config = config.setDefaults(this._defaultConfig);
        this._connectionResolver.configure(config);
        this._options = this._options.override(config.getSection("options"));

        this._retryConnect = config.getAsBooleanWithDefault("options.retry_connect", this._retryConnect);
        this._maxReconnect = config.getAsIntegerWithDefault("options.max_reconnect", this._maxReconnect);
        this._reconnectTimeout = config.getAsIntegerWithDefault("options.reconnect_timeout", this._reconnectTimeout);
        this._flushTimeout = config.getAsIntegerWithDefault("options.flush_timeout", this._flushTimeout);
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
    }

    /**
	 * Checks if the component is opened.
	 * 
	 * @returns true if the component has been opened and false otherwise.
     */
    public isOpen(): boolean {
        return this._connection != null;
    }

    /**
	 * Opens the component.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    public open(correlationId: string, callback?: (err: any) => void): void {
        if (this._connection != null) {
            if (callback) callback(null);
            return;
        }

        this._connectionResolver.resolve(correlationId, (err, config) => {
            if (err) {
                if (callback) callback(err);
                else this._logger.error(correlationId, err, 'Failed to resolve NAS connection');
                return;
            }

            try {
                let options: any = {
                    "reconnect": this._retryConnect,
                    "maxReconnectAttempts": this._maxReconnect,
                    "reconnectTimeWait": this._reconnectTimeout
                };

                let servers = config.getAsString("servers");
                servers = servers.split(",");
                options["servers"] = servers;

                let username = config.getAsString("usernames");
                let password = config.getAsString("password");
                if (username != null) {
                    options["username"] = username;
                    options["password"] = password;
                }
                let token = config.getAsString("token");
                if (token != null) {
                    options["token"] = token;
                }                

                nats.connect(options)
                .then((connection) => {
                    this._connection = connection;
                    this._logger.debug(correlationId, "Connected to NATS server at "+servers);
                    if (callback) callback(null);
                })
                .catch((err) => {                    
                    this._logger.error(correlationId, err, "Failed to connect to NATS server at "+servers);
                    err = new ConnectionException(correlationId, "CONNECT_FAILED", "Connection to NATS service failed").withCause(err);
                    if (callback) callback(err);
                });            
            } catch (ex) {
                this._logger.error(correlationId, ex, "Failed to connect to NATS server");
                let err = new ConnectionException(correlationId, "CONNECT_FAILED", "Connection to NATS service failed").withCause(ex);
                if (callback) callback(err);
            }
        });
    }

    /**
	 * Closes component and frees used resources.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    public close(correlationId: string, callback?: (err: any) => void): void {
        if (this._connection == null) {
            if (callback) callback(null);
            return;
        }

        this._connection.close();
        this._connection = null;
        this._subscriptions = [];
        this._logger.debug(correlationId, "Disconnected from NATS server");
        if (callback) callback(null);
    }

    public getConnection(): any {
        return this._connection;
    }

    /**
     * Reads a list of registered queue names.
     * If connection doesn't support this function returnes an empty list.
     * @callback to receive a list with registered queue names or an error.
     */
    public readQueueNames(callback: (err: any, queueNames: string[]) => void): void {
        callback(null, []);
    }

    /**
     * Checks if connection is open
     * @returns an error is connection is closed or <code>null<code> otherwise.
     */
     protected checkOpen(): any {
        if (this.isOpen()) return null;

        return new InvalidStateException(
            null,
            "NOT_OPEN",
            "Connection was not opened"
        );
    }    

    /**
     * Publish a message to a specified topic
     * @param subject a subject(topic) where the message will be placed
     * @param message a message to be published
     * @param callback (optional) callback to receive notification on operation result
     */
     public publish(subject: string, message: any, callback?: (err: any) => void): void {
        // Check for open connection
        let err = this.checkOpen();
        if (err) {
            if (callback) callback(err);
            return;
        }

        subject = subject || message.subject;
        this._connection.publish(subject, message.data, { headers: message.headers });
        if (callback) callback(null)
    }

    /**
     * Subscribe to a topic
     * @param subject a subject(topic) name
     * @param options subscription options
     * @param listener a message listener
     * @param callback (optional) callback to receive notification on operation result
     */
     public subscribe(subject: string, options: any, listener: INatsMessageListener,
        callback?: (err: any) => void): void {
        // Check for open connection
        let err = this.checkOpen();
        if (err != null) {
            if (callback) callback(err);
            return;
        }

        // Subscribe to topic
        let handler = this._connection.subscribe(
            subject, 
            {
                max: options.max,
                timeout: options.timeout,
                queue: options.queue,
                callback: (err, message) => {                    
                    listener.onMessage(err, message);
                }
            }
        );

        // Determine if messages shall be filtered (topic without wildcarts)
        let filter = subject.indexOf("*") < 0;

        // Add the subscription
        let subscription = <NatsSubscription>{
            subject: subject,
            options: options,
            filter: filter,
            handler: handler,
            listener: listener
        };
        this._subscriptions.push(subscription);
        if (callback) callback(null);
    }

    /**
     * Unsubscribe from a previously subscribed topic
     * @param subject a subject(topic) name
     * @param listener a message listener
     * @param callback (optional) callback to receive notification on operation result
     */
    public unsubscribe(subject: string, listener: INatsMessageListener, callback?: (err: any) => void): void {
        // Find the subscription index
        let index = this._subscriptions.findIndex((s) => s.subject == subject && s.listener == listener);
        if (index < 0) {
            if (callback) callback(null);
            return;
        }
        
        // Remove the subscription
        let subscription = this._subscriptions.splice(index, 1)[0];

        // Unsubscribe from the topic
        if (this.isOpen() && subscription.handler != null) {
            subscription.handler.unsubscribe();
        }

        if (callback) callback(null);
    }    
}