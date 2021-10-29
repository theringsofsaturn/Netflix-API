import express from "express";
import fs from "fs-extra";
import createHttpError from "http-errors";
import uniqid from "uniqid";
import { mediaValidation, reviewsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import multer from "multer";
import axios from "axios";
import { mediaJSONPath, reviewsJSONPath } from "../lib/fsTools.js";
import { savePosterCloudinary } from "../lib/cloudinaryTools.js";

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

//**************** POST MEDIA *******************
mediaRouter.post("/", mediaValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);

    if (errorList.isEmpty()) {
      const bodyRequest = req.body;
      const mediaJsonArray = await readJSON(mediaJSONPath);

      const newMedia = {
        Title: bodyRequest.Title,
        Year: bodyRequest.Year,
        imdbID: uniqid(),
        Type: bodyRequest.Type,
        Poster: "",
      };

      mediaJsonArray.push(newMedia);
      await writeJSON(mediaJSONPath, mediaJsonArray);

      res
        .status(201)
        .send({ newMedia, message: "New media was created succesfully!" });
    } else {
      next(createHttpError(400, { errorList }));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//**************** GET MEDIA BY ID *******************
mediaRouter.get("/:id", async (req, res, next) => {
  try {
    const paramsID = req.params.id;
    const mediaJsonArray = await readJSON(mediaJSONPath);

    const filteredMedia = mediaJsonArray.find(
      (media) => media.imdbID === paramsID
    );

    if (filteredMedia) {
      const reviewsJsonArray = await readJSON(reviewsJSONPath);
      const filteredMediaReviews = reviewsJsonArray.filter(
        (reviews) => reviews.elementId === paramsID
      );
      res.send({ media: filteredMedia, reviews: filteredMediaReviews });
    } else {
      next(
        createHttpError(
          404,
          `Media with the imdbID: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//**************** UPDATE MEDIA *******************
mediaRouter.put("/:id", mediaValidation, async (req, res, next) => {
  try {
    const errorList = validationResult(req);

    if (errorList.isEmpty()) {
      const paramsID = req.params.id;
      const mediaJsonArray = await readJSON(mediaJSONPath);

      const filteredMedia = mediaJsonArray.find(
        (media) => media.imdbID === paramsID
      );

      if (filteredMedia) {
        const remainingMedia = mediaJsonArray.filter(
          (media) => media.imdbID !== paramsID
        );
        const updatedMedia = { ...filteredMedia, ...req.body };

        remainingMedia.push(updatedMedia);
        await writeJSON(mediaJSONPath, remainingMedia);
      }

      res.send({
        updatedMedia,
        message: `The media with imdbID: ${filteredMedia.imdbID} was updated succesfully. `,
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//**************** DELETE MEDIA *******************
mediaRouter.delete("/:id", async (req, res, next) => {
  try {
    const errorList = validationResult(req);

    if (errorList.isEmpty()) {
      const paramsID = req.params.id;
      const mediaJsonArray = await readJSON(mediaJSONPath);

      const filteredMedia = mediaJsonArray.find(
        (media) => media.imdbID === paramsID
      );
      const remainingMedia = mediaJsonArray.filter(
        (media) => media.imdbID !== paramsID
      );

      await writeJSON(mediaJSONPath, remainingMedia);

      res.send({
        filteredMedia,
        message: `The media with the id: ${filteredMedia.imdbID} was succesfully deleted`,
      });
    } else {
      next(
        createHttpError(
          404,
          `The media with the imdbID: ${paramsID} was not found.`
        )
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//**************** POST MEDIA POSTER *******************
mediaRouter.post(
  "/:id",
  multer({ storage: savePosterCloudinary }).single("poster"),
  async (req, res, next) => {
    try {
      const errorList = validationResult(req);
      if (errorList.isEmpty()) {
        const paramsID = req.params.id;
        const mediaJsonArray = await readJSON(mediaJSONPath);

        const filteredMedia = mediaJsonArray.find(
          (media) => media.imdbID === paramsID
        );

        const posterUrl = req.file.path;

        const updatedMedia = { ...filteredMedia, Poster: posterUrl };
        const remainingMedia = mediaJsonArray.filter(
          (media) => media.imdbID !== paramsID
        );

        remainingMedia.push(updatedMedia);
        await writeJSON(mediaJSONPath, remainingMedia);

        res.send({
          updatedMedia,
          message: `The Poster was added succesfully to the media with imdbID: ${filteredMedia.imdbID}. `,
        });
      } else {
        next(
          createHttpError(
            404,
            `The media with the id: ${paramsId} was not found.`
          )
        );
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

//**************** GET ALL MEDIA BY SEARCH *******************

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
