import express from "express";
import fs from "fs-extra";
import createHttpError from "http-errors";
import uniqid from "uniqid";
import { mediaValidation, reviewsValidation } from "./validation.js";
import { validationResult } from "express-validator";
import multer from "multer";
import axios from "axios";

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

  export default mediaRouter;