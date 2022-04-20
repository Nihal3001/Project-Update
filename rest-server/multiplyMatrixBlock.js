const {
  addBlockRPC,
  multiplyBlockRPC,
  resetGrpcClient,
  setDeadline,
} = require("./grpcClient");

//  Main function is called in the rest server/ index.js file where both matrices are uploaded to client
//  All errors are processed in or to the server
async function multiplyMatrixBlock(A, B, deadline) {
  // Set deadline of process to whatever user given input
  setDeadline(deadline);

  // dimensions of the result
  const MAX = A.length;

  // Block size
  const bSize = 2;

  let A1 = [...Array(MAX)].map((_) => Array(MAX));
  let A2 = [...Array(MAX)].map((_) => Array(MAX));
  let A3 = [...Array(MAX)].map((_) => Array(MAX));
  let B1 = [...Array(MAX)].map((_) => Array(MAX));
  let B2 = [...Array(MAX)].map((_) => Array(MAX));
  let B3 = [...Array(MAX)].map((_) => Array(MAX));
  let C1 = [...Array(MAX)].map((_) => Array(MAX));
  let C2 = [...Array(MAX)].map((_) => Array(MAX));
  let C3 = [...Array(MAX)].map((_) => Array(MAX));
  let D1 = [...Array(MAX)].map((_) => Array(MAX));
  let D2 = [...Array(MAX)].map((_) => Array(MAX));
  let D3 = [...Array(MAX)].map((_) => Array(MAX));
  let res = [...Array(MAX)].map((_) => Array(MAX));

  for (let i = 0; i < bSize; i++) {
    for (let j = 0; j < bSize; j++) {
      A1[i][j] = A[i][j];
      A2[i][j] = B[i][j];
    }
  }

  for (let i = 0; i < bSize; i++) {
    for (let j = bSize; j < MAX; j++) {
      B1[i][j - bSize] = A[i][j];
      B2[i][j - bSize] = B[i][j];
    }
  }

  for (let i = bSize; i < MAX; i++) {
    for (let j = 0; j < bSize; j++) {
      C1[i - bSize][j] = A[i][j];
      C2[i - bSize][j] = B[i][j];
    }
  }

  for (let i = bSize; i < MAX; i++) {
    for (let j = bSize; j < MAX; j++) {
      D1[i - bSize][j - bSize] = A[i][j];
      D2[i - bSize][j - bSize] = B[i][j];
    }
  }

  // seperate call to get footprint and then scale up respectively
  const A1A2 = await multiplyBlockRPC(A1, A2, MAX);

  // collect all functions
  const multiplyMatrixCalls = [
    multiplyBlockRPC(B1, C2, MAX),
    multiplyBlockRPC(A1, B2, MAX),
    multiplyBlockRPC(B1, D2, MAX),
    multiplyBlockRPC(C1, A2, MAX),
    multiplyBlockRPC(D1, C2, MAX),
    multiplyBlockRPC(C1, B2, MAX),
    multiplyBlockRPC(D1, D2, MAX),
  ];

  // run multiplications in sync
  // for scaled up clients
  const [B1C2, A1B2, B1D2, C1A2, D1C2, C1B2, D1D2] = await Promise.all(
    multiplyMatrixCalls
  );

  A3 = await addBlockRPC(A1A2, B1C2, MAX);
  B3 = await addBlockRPC(A1B2, B1D2, MAX);
  C3 = await addBlockRPC(C1A2, D1C2, MAX);
  D3 = await addBlockRPC(C1B2, D1D2, MAX);

  for (let i = 0; i < bSize; i++) {
    for (let j = 0; j < bSize; j++) {
      res[i][j] = A3[i][j];
    }
  }

  for (let i = 0; i < bSize; i++) {
    for (let j = bSize; j < MAX; j++) {
      res[i][j] = B3[i][j - bSize];
    }
  }

  for (let i = bSize; i < MAX; i++) {
    for (let j = 0; j < bSize; j++) {
      res[i][j] = C3[i - bSize][j];
    }
  }

  for (let i = bSize; i < MAX; i++) {
    for (let j = bSize; j < MAX; j++) {
      res[i][j] = D3[i - bSize][j - bSize];
    }
  }

  // Reset the grpc client 
  resetGrpcClient();
  return res;
}

module.exports = multiplyMatrixBlock;
