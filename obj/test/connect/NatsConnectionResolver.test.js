"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('chai').assert;
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const NatsConnectionResolver_1 = require("../../src/connect/NatsConnectionResolver");
suite('NatsConnectionResolver', () => {
    test('Single Connection', (done) => {
        let resolver = new NatsConnectionResolver_1.NatsConnectionResolver();
        resolver.configure(pip_services3_commons_node_1.ConfigParams.fromTuples("connection.protocol", "nats", "connection.host", "localhost", "connection.port", 4222));
        resolver.resolve(null, (err, connection) => {
            assert.isNull(err);
            assert.equal("localhost:4222", connection.getAsString("servers"));
            assert.isNull(connection.getAsString("username"));
            assert.isNull(connection.getAsString("password"));
            assert.isNull(connection.getAsString("token"));
            done();
        });
    });
    test('Cluster Connection', (done) => {
        let resolver = new NatsConnectionResolver_1.NatsConnectionResolver();
        resolver.configure(pip_services3_commons_node_1.ConfigParams.fromTuples("connections.0.protocol", "nats", "connections.0.host", "server1", "connections.0.port", 4222, "connections.1.protocol", "nats", "connections.1.host", "server2", "connections.1.port", 4222, "connections.2.protocol", "nats", "connections.2.host", "server3", "connections.2.port", 4222));
        resolver.resolve(null, (err, connection) => {
            assert.isNull(err);
            assert.isNotNull(connection.getAsString("servers"));
            assert.isNull(connection.getAsString("username"));
            assert.isNull(connection.getAsString("password"));
            assert.isNull(connection.getAsString("token"));
            done();
        });
    });
    test('Cluster Connection with Auth', (done) => {
        let resolver = new NatsConnectionResolver_1.NatsConnectionResolver();
        resolver.configure(pip_services3_commons_node_1.ConfigParams.fromTuples("connections.0.protocol", "nats", "connections.0.host", "server1", "connections.0.port", 4222, "connections.1.protocol", "nats", "connections.1.host", "server2", "connections.1.port", 4222, "connections.2.protocol", "nats", "connections.2.host", "server3", "connections.2.port", 4222, "credential.token", "ABC", "credential.username", "test", "credential.password", "pass123"));
        resolver.resolve(null, (err, connection) => {
            assert.isNull(err);
            assert.isNotNull(connection.getAsString("servers"));
            assert.equal("test", connection.getAsString("username"));
            assert.equal("pass123", connection.getAsString("password"));
            assert.equal("ABC", connection.getAsString("token"));
            done();
        });
    });
    test('Cluster URI', (done) => {
        let resolver = new NatsConnectionResolver_1.NatsConnectionResolver();
        resolver.configure(pip_services3_commons_node_1.ConfigParams.fromTuples("connection.uri", "nats://test:pass123@server1:4222,server2:4222,server3:4222?param=234"));
        resolver.resolve(null, (err, connection) => {
            assert.isNull(err);
            assert.isNotNull(connection.getAsString("servers"));
            assert.equal("test", connection.getAsString("username"));
            assert.equal("pass123", connection.getAsString("password"));
            assert.isNull(connection.getAsString("token"));
            done();
        });
    });
});
//# sourceMappingURL=NatsConnectionResolver.test.js.map