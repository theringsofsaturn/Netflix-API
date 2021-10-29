import express from "express";
import mediaRouter from "./services/index.js"; 
import cors from "cors"; // will enable the frontend to communicate with the backend
import listEndpoints from "express-list-endpoints"; // showing the tree with endpoints
import {
  notFoundHandler,
  badRequestHandler,
  forbiddenHandler,
  genericServerErrorHandler,
} from "./services/errorHandler.js";

const server = express();
const port = 3001; // the port that the server will run

//**************** GLOBAL MIDDLEWARES ******************
server.use(cors());
server.use(express.json()); // this will enable reading of the bodies of requests, THIS HAS TO BE BEFORE THE ROUTES (server.use("/router", routerHandler))

//**************** ROUTES *******************
server.use("/media", mediaRouter); // all the endpoints which are in the mediaRouter will have "/media" as a prefix to POST, GET, PUT and DELETE

//**************** ERROR HANDLERS *******************
// Error handlers need to be defined after all the routes

server.use(notFoundHandler);
server.use(badRequestHandler);
server.use(forbiddenHandler);
server.use(genericServerErrorHandler);

console.table(listEndpoints(server)); // showing the tree with endpoints in the terminal

server.listen(port, () => {
  console.log("Server running on port: ", port);
});
