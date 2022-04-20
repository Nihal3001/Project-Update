const size = parseInt(process.env.SIZE);
let arr = Array(size)
  .fill(null)
  .map(() => Array(size).fill(Math.floor(Math.random() * 6) + 1));

arr = arr.map((row) => row.join(" ")).join("\n");

const fs = require("fs");

fs.writeFileSync(`./test_files/M_${size}.txt`, arr);
