const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const { performance } = require("perf_hooks");
const utils = require("../utils/tools");
const blockMult = require("../utils/blockmult");
const PROTO_PATH = "blockmult.proto";

//  Loading grpc definition file and creating our client server
const definition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

const BlockMultService = grpc.loadPackageDefinition(definition)
  .BlockMultService;

// written function creates an instance of the grpc client
function createGrpcClient(i) {
  const port = process.env.PORT || `3004${i}`;
  const host = process.env.HOST || "0.0.0.0";
  const address = `${host}:${port}`;
  const client = new BlockMultService(
    address,
    grpc.credentials.createInsecure()
  );

  return client;
}

const constants = {
  // deadline in ms
  deadline: 50,

  // -1 footprint (ms) means deadline has not been set yet
  footprint: -1,

  // 7 multiply calls
  numberOfCalls: 7,

  // tracking all the running clients, keep one ready initially.
  clients: [{ client: createGrpcClient(0), id: 0 }],

  // distribute clients evenly so set counterindex zero
  clientIndex: 0,
};

// coding function for aggregating the number of clients needed
function scale() {
  let numberOfClients = Math.ceil(
    (constants.footprint * constants.numberOfCalls) /
      Math.abs(constants.deadline - constants.footprint)
  );

  console.log("footprint: " + constants.footprint);

  // 8 clients max.
  if (numberOfClients > 8) {
    numberOfClients = 8;
  }

  console.log("Scaling to: " + numberOfClients);

  for (let i = 1; i < numberOfClients; i++) {
    constants.clients[i] = {
      id: i,
      client: createGrpcClient(i),
    };
  }
}

// Returns next client
function getClient() {
  // Our load balancing strategy is just a counter which balances around the length of the clients
  const client = constants.clients[constants.clientIndex];
  constants.clientIndex = ++constants.clientIndex % constants.clients.length;

  if (!client) {
    console.log("Could not find an available client.");
    process.exit(1);
  }

  return client;
}

function resetGrpcClient() {
  constants.footprint = -1;
  constants.clientIndex = 0;

  // shut all active connections
  for (const clientObj of constants.clients) {
    clientObj.client.close();
  }

  constants.clients = [{ client: createGrpcClient(0), id: 0 }];
}

function setDeadline(deadline) {
  constants.deadline = deadline;
}

// Wrapper code function to make protobuf acceptable block
// calls grpc multiplyBlock function
async function multiplyBlockRPC(A, B, MAX) {
  // Get next client
  const client = await getClient();

  console.log("Using client: " + (client.id + 1));

  return new Promise((resolve, reject) => {
    const block = utils.createBlock(A, B, MAX);
    const footPrintTimer1 = performance.now();

    client.client.multiplyBlock(block, (err, res) => {
      if (err) reject(err);

      // Set and calculate footprint during the first call then we scale up respectively
      if (constants.footprint === -1) {
        constants.footprint = performance.now() - footPrintTimer1;
        scale();
      }

      const matrix = utils.convertProtoBufToArray(res.block);
      resolve(matrix);
    });
  });
}

// Wrapper code function to make protobuf acceptable block
// calls grpc addBlock function
async function addBlockRPC(A, B, MAX) {
  // Get next client
  const client = await getClient();

  console.log("Using client: " + (client.id + 1));

  return new Promise((resolve, reject) => {
    const block = utils.createBlock(A, B, MAX);

    client.client.addBlock(block, (err, res) => {
      if (err) reject(err);
      // Make client available
      client.isAvailable = true;

      const matrix = utils.convertProtoBufToArray(res.block);
      resolve(matrix);
    });
  });
}

module.exports = {
  addBlockRPC,
  multiplyBlockRPC,
  resetGrpcClient,
  setDeadline,
};
