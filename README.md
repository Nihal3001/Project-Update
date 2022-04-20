# grpc scaling for matrix multiplication

Using [the divide and conquer method](https://shivathudi.github.io/jekyll/update/2017/06/15/matr-mult.html) for matrix multiplication. 8 instances of the grpc server with `addBlock` and `multiplyBlock` functions are created. In the frontend two `.txt` files with matrices are uploaded to a REST API. The REST API uses the grpc client to call block functions in the server. The number of instances which the client connects is determined by the footprint, deadline, and number of calls being made. This is where  scaling occurs.

Upload two square matrices with dimensions of powers of 2 in txt files
- numbers seperated by spaces
- rows seperated by new lines

To run:
- `npm run server:grpc`
- `npm run server:rest`
- `localhost:8080`
