"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsMessageQueueFactory = void 0;
/** @module build */
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const NatsMessageQueue_1 = require("../queues/NatsMessageQueue");
const NatsBareMessageQueue_1 = require("../queues/NatsBareMessageQueue");
/**
 * Creates [[NatsMessageQueue]] components by their descriptors.
 * Name of created message queue is taken from its descriptor.
 *
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/build.factory.html Factory]]
 * @see [[NatsMessageQueue]]
 */
class NatsMessageQueueFactory extends pip_services3_components_node_1.Factory {
    /**
     * Create a new instance of the factory.
     */
    constructor() {
        super();
        this.register(NatsMessageQueueFactory.NatsQueueDescriptor, (locator) => {
            let name = (typeof locator.getName === "function") ? locator.getName() : null;
            let queue = new NatsMessageQueue_1.NatsMessageQueue(name);
            if (this._config != null) {
                queue.configure(this._config);
            }
            if (this._references != null) {
                queue.setReferences(this._references);
            }
            return queue;
        });
        this.register(NatsMessageQueueFactory.NatsBareQueueDescriptor, (locator) => {
            let name = (typeof locator.getName === "function") ? locator.getName() : null;
            let queue = new NatsBareMessageQueue_1.NatsBareMessageQueue(name);
            if (this._config != null) {
                queue.configure(this._config);
            }
            if (this._references != null) {
                queue.setReferences(this._references);
            }
            return queue;
        });
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        this._config = config;
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._references = references;
    }
}
exports.NatsMessageQueueFactory = NatsMessageQueueFactory;
NatsMessageQueueFactory.NatsQueueDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services", "message-queue", "nats", "*", "1.0");
NatsMessageQueueFactory.NatsBareQueueDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services", "message-queue", "bare-nats", "*", "1.0");
//# sourceMappingURL=NatsMessageQueueFactory.js.map