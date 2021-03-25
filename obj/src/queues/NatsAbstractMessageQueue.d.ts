import { IReferenceable } from 'pip-services3-commons-node';
import { IUnreferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IOpenable } from 'pip-services3-commons-node';
import { ICleanable } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { DependencyResolver } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { MessageQueue } from 'pip-services3-messaging-node';
import { MessagingCapabilities } from 'pip-services3-messaging-node';
import { MessageEnvelope } from 'pip-services3-messaging-node';
import { ConnectionParams } from 'pip-services3-components-node';
import { CredentialParams } from 'pip-services3-components-node';
import { NatsConnection } from '../connect/NatsConnection';
/**
 * Abstract NATS message queue with ability to connect to NATS server.
 */
export declare abstract class NatsAbstractMessageQueue extends MessageQueue implements IReferenceable, IUnreferenceable, IConfigurable, IOpenable, ICleanable {
    private static _defaultConfig;
    private _config;
    private _references;
    private _opened;
    private _localConnection;
    /**
     * The dependency resolver.
     */
    protected _dependencyResolver: DependencyResolver;
    /**
     * The logger.
     */
    protected _logger: CompositeLogger;
    /**
     * The NATS connection component.
     */
    protected _connection: NatsConnection;
    /**
     * The NATS connection pool object.
     */
    protected _client: any;
    protected _serializeEnvelop: boolean;
    protected _subject: string;
    protected _queueGroup: string;
    /**
     * Creates a new instance of the persistence component.
     *
     * @param name    (optional) a queue name.
     */
    constructor(name?: string, capabilities?: MessagingCapabilities);
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config: ConfigParams): void;
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references: IReferences): void;
    /**
     * Unsets (clears) previously set references to dependent components.
     */
    unsetReferences(): void;
    private createConnection;
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen(): boolean;
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Opens the component with given connection and credential parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param connection        connection parameters
     * @param credential        credential parameters
     * @param callback 			callback function that receives error or null no errors occured.
     */
    protected openWithParams(correlationId: string, connections: ConnectionParams[], credential: CredentialParams, callback: (err: any) => void): void;
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId: string, callback?: (err: any) => void): void;
    protected getSubject(): string;
    protected fromMessage(message: MessageEnvelope): any;
    protected toMessage(msg: any): MessageEnvelope;
    /**
     * Clears component state.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    clear(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Reads the current number of messages in the queue to be delivered.
     *
     * @param callback      callback function that receives number of messages or error.
     */
    readMessageCount(callback: (err: any, count: number) => void): void;
    /**
     * Sends a message into the queue.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param message           a message envelop to be sent.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    send(correlationId: string, message: MessageEnvelope, callback?: (err: any) => void): void;
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
    renewLock(message: MessageEnvelope, lockTimeout: number, callback?: (err: any) => void): void;
    /**
     * Permanently removes a message from the queue.
     * This method is usually used to remove the message after successful processing.
     *
     * Important: This method is not supported by NATS.
     *
     * @param message   a message to remove.
     * @param callback  (optional) callback function that receives an error or null for success.
     */
    complete(message: MessageEnvelope, callback: (err: any) => void): void;
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
    abandon(message: MessageEnvelope, callback: (err: any) => void): void;
    /**
     * Permanently removes a message from the queue and sends it to dead letter queue.
     *
     * Important: This method is not supported by NATS.
     *
     * @param message   a message to be removed.
     * @param callback  (optional) callback function that receives an error or null for success.
     */
    moveToDeadLetter(message: MessageEnvelope, callback: (err: any) => void): void;
}
