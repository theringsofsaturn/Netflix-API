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

    if (query && query.Title) {
      const filteredMedia = mediaJsonArray.filter((media) =>
        media.Title.toLocaleLowerCase().includes(
          query.Title.toLocaleLowerCase()
        )
      );

      if (filteredMedia.length > 0) {
        res.send({ media: filteredMedia });
      } else {
        const omdbResponseByQueryTitle = await axios.get(""); //omdb url + query.Title
        const omdbDataByQueryTitle = omdbResponseByQueryTitle.data;

        if (omdbDataByQueryTitle.Response === "True") {
          const ombdMediaBySearch = omdbDataByQueryTitle.Search;

          media.push(...ombdMediaBySearch);
          await writeJSON(mediaJSONPath, mediaJsonArray);

          res.send({ mediaJsonArray: ombdMediaBySearch });
        } else {
          next(createHttpError(404, omdbData.Error));
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
