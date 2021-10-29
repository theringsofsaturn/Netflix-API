import express from "express";
import fs from "fs-extra";
import createHttpError from "http-errors";
import uniqid from "uniqid";
import { mediaValidation, reviewsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import multer from "multer";
import axios from "axios";
import { mediaJSONPath } from "../lib/fsTools.js";

const {
  readJSON,
  writeJSON,
  writeFile,
  readFile,
  remove,
  createReadStream,
  createWriteStream,
} = fs;

const mediaRouter = express.Router();

//**************** GET ALL MEDIA BY SEARCH *******************
// Example
// Searching for batman

// exists in my media.json ?
//     return movie in response

// else

//     search that query (batman) in omdbapi

//         exist in omdb ?

//             put in our media.json (push inside of our collection)

//             return in response

//         else

//             return not found

mediaRouter.get("/", async (req, res, next) => {
  try {
    const mediaJsonArray = await readJSON(mediaJSONPath);
    const reviewsJsonArray = await readJSON(reviewsJSONPath);
    const query = req.query;

    // Example
    // Searching for q query
    if (query && query.Title) {

      // exists in my media.json ?
      const filteredMedia = mediaJsonArray.filter((media) =>
        media.Title.toLocaleLowerCase().includes(
          query.Title.toLocaleLowerCase()
        )
      );

      // return movie in response
      if (filteredMedia.length > 0) {
        res.send({ media: filteredMedia });
      } else {
        // search that query in omdbapi
        const omdbResponseByQueryTitle = await axios.get(
          `http://www.omdbapi.com/?apikey=a0871843&s="${query.Title.toLowerCase()}"&type=movie&page=1`
        ); //omdb url + query.Title
        const omdbDataByQueryTitle = omdbResponseByQueryTitle.data;

        // exist in omdb ?
        if (omdbDataByQueryTitle.Response === "True") {
          const ombdMediaBySearch = omdbDataByQueryTitle.Search;

          // put in our media.json (push inside of our collection)
          mediaJsonArray.push(...ombdMediaBySearch);
          await writeJSON(mediaJSONPath, mediaJsonArray);

        // return in response
          res.send({ mediaJsonArray: ombdMediaBySearch });
        } else {
          next(createHttpError(404, Error));
        }
      }
    } else {
      res.send({ mediaJsonArray, reviewsJsonArray });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export default mediaRouter;
