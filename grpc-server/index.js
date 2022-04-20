const cluster = require("cluster");
const runGrpcServer = require("./grpcServer");
const numCPUs = 8; 

if (cluster.isMaster) {
  // Fork
  for (let i = 0; i < numCPUs; i++) {
    // each process has a unique port access given
    const port = `3004${i}`;
    cluster.fork({
      PORT: port,
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log("worker " + worker.process.pid + " died");
  });
} else {
  runGrpcServer();
}
