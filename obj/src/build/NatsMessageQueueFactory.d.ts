/** @module build */
import { Factory } from 'pip-services3-components-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { IReferenceable } from 'pip-services3-commons-node';
/**
 * Creates [[NatsMessageQueue]] components by their descriptors.
 * Name of created message queue is taken from its descriptor.
 *
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/build.factory.html Factory]]
 * @see [[NatsMessageQueue]]
 */
export declare class NatsMessageQueueFactory extends Factory implements IConfigurable, IReferenceable {
    private static readonly NatsQueueDescriptor;
    private static readonly NatsBareQueueDescriptor;
    private _config;
    private _references;
    /**
     * Create a new instance of the factory.
     */
    constructor();
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
}
