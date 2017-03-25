module.exports = function(RED) {
    var lora_packet = require('lora-packet');

    function LoraDecryptNode(config) {
        RED.nodes.createNode(this,config);

        this.name = config.name;
        this.path = config.path;

        if(typeof this.path !== "string") {
            this.error("Path has to be a valid string!");
            return;
        }

        var pathParts = this.path.split('.');

        var node = this;
        this.on('input', function(msg) {
            var payload = msg.payload;

            if(typeof payload === "string") {
                msg.payload = decryptPayload(payload);
                node.send(msg);
                return;
            }

            if(typeof payload !== "object") {
                node.error("The payload has to be a string or an object!");
                return;
            }

            var lastPart;
            var rawPayload = pathParts.reduce((last, part) => {
                if(!last) return;
                lastPart = last;
                return last[part];
            }, payload);

            if(!rawPayload) {
                node.error(`Could not find the path '${node.path}' in the payload!`);
                return;
            }

            var decryptedPayload = decryptPayload(rawPayload);
            lastPart[pathParts[pathParts.length - 1]] = decryptedPayload;

            node.send(msg);
        });
    }

    function decryptPayload(payload) {
        var packet =
            lora_packet.fromWire(new Buffer(payload, 'hex'));
        
        var buffers = packet.getBuffers();

        Object.keys(buffers).forEach(key => {
            buffers[key] = buffers[key].toString();
        });

        return buffers;
    }

    RED.nodes.registerType("lora-decrypt",LoraDecryptNode);
}