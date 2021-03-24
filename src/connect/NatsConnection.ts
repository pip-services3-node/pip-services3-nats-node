/** @module connect */
const _ = require('lodash');
const nats = require('nats');

import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IOpenable } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { ConnectionException } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { IMessageQueueConnection } from 'pip-services3-messaging-node';

import { NatsConnectionResolver } from './NatsConnectionResolver';

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

    private _retryConnect: boolean = true;
    private _maxReconnect: number = 3;
    private _reconnectTimeout: number = 3000;
    private _flushTimeout: number = 3000;

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

        this._connection.close()
        .then(() => {
            this._connection = null;
            this._logger.debug(correlationId, "Disconnected from NATS server");
            if (callback) callback(null);
        })
        .catch((err) => {
            this._connection = null;
            err = new ConnectionException(correlationId, 'DISCONNECT_FAILED', 'Disconnect from NATS service failed: ') .withCause(err);
            if (callback) callback(err);
        });
    }

    public getConnection(): any {
        return this._connection;
    }

    /**
     * Gets a list of registered queue names.
     * If connection doesn't support this function returnes an empty list.
     * @returns a list with registered queue names.
     */
    public getQueueNames(): string[] {
        return [];
    }
}