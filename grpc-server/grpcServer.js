const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const utils = require("../utils/tools");
const blockMult = require("../utils/blockmult");
const PROTO_PATH = "blockmult.proto";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
  creates a new instance of grpc server on a port between 30040-30047
*/
function runGrpcServer() {
  const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
  });
  const blockMultProto = grpc.loadPackageDefinition(definition);
  const server = new grpc.Server();

  const serviceFunctions = {
    multiplyBlock: (body, cb) => {
      console.log("=> multiplyBlock called");
      const { A, B, MAX } = body.request;
      const multMatrix = blockMult.multiplyBlock(
        utils.convertProtoBufToArray(A),
        utils.convertProtoBufToArray(B),
        MAX
      );

      const response = utils.convertArrayToProtoBuf(multMatrix);
      cb(null, { block: response });

    },
    addBlock: (body, cb) => {
      console.log("=> addBlock called");
      const { A, B, MAX } = body.request;
      const multMatrix = blockMult.addBlock(
        utils.convertProtoBufToArray(A),
        utils.convertProtoBufToArray(B),
        MAX
      );
      const response = utils.convertArrayToProtoBuf(multMatrix);
      cb(null, { block: response });
    },
  };

  server.addService(blockMultProto.BlockMultService.service, serviceFunctions);

  const port = process.env.PORT || 30043;
  const host = process.env.HOST || "0.0.0.0";
  const address = `${host}:${port}`;

  server.bind(address, grpc.ServerCredentials.createInsecure());
  console.log(`Server running at ${address}`);
  server.start();
}

module.exports = runGrpcServer;
