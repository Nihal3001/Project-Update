function convertArrayToProtoBuf(array) {
  return array.map((row) => {
    return {
      array: row,
    };
  });
}

function convertProtoBufToArray(array) {
  return array.map((row) => row.array);
}

function createBlock(A, B, MAX) {
  return {
    A: convertArrayToProtoBuf(A),
    B: convertArrayToProtoBuf(B),
    MAX,
  };
}

function textToMatrix(file) {
  return file
    .split("\n")
    .map((row) => row.split(" ").map((el) => parseInt(el)));
}

function powerOfTwo(x) {
  return (Math.log(x) / Math.log(2)) % 1 === 0;
}

module.exports = {
  convertArrayToProtoBuf,
  convertProtoBufToArray,
  createBlock,
  textToMatrix,
  powerOfTwo,
};
