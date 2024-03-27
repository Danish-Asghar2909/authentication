import express from "express";
import UserModel from "../model/user.js";
import { isValidMongoDbObjectId } from "../helper/index.js";
import { uploadFile, downloadFile } from "../middleware/upload.js";
import upload from "../middleware/multer.js";
import "dotenv";
import { Readable } from "stream";
import mime from "mime-types";

const router = express.Router();

/**
 * @swagger
 *components:
 *  schemas:
 *    User:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *        username:
 *          type: string
 *        password:
 *          type: string
 *        email:
 *          type: string
 *        isAdmin:
 *          type: boolean
 *        isProfilePublic:
 *          type: boolean
 *        createdAt:
 *          type: string
 *          format: date-time
 *        updatedAt:
 *          type: string
 *          format: date-time
 *      required:
 *        - username
 *        - password
 *        - email
 *
 */

router.get("/", async (req, res) => {
  const user = req.user;
  const queryParams = { ...req.query };
  const excludeApiFields = [
    "page",
    "sort",
    "limit",
    "fields",
    "offset",
    "populate",
  ];
  excludeApiFields.forEach((e) => delete queryParams[e]);

  console.log("user: ", user, req.query);
  if (user.isAdmin) {
    console.log("Fetch All detail because he is admin");
    const users = await UserModel.find({ ...queryParams })
      .limit(Number(req.query.limit))
      .skip(Number(req.query.offset))
      .sort(req.query.sort)
      .select(req.query.fields)
      .populate(req.query.populate)
      .select("-password");

    return res.status(200).json({ data: users });
  }

  console.log("Fetch only public detail because he is user");
  const users = await UserModel.find({ ...queryParams, isProfilePublic: true })
    .limit(Number(req.query.limit))
    .skip(Number(req.query.offset))
    .sort(req.query.sort)
    .select(req.query.fields)
    .populate(req.query.populate)
    .select("-password");

  return res.status(200).json({ data: users });
});

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get users
 *     description: Retrieve a list of users
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Field to sort the results by
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Fields to include in the response
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *         description: Fields to populate in the response
 *     responses:
 *       '200':
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */

router.post("/upload", upload.single("file"), async (req, res) => {
  let fileS3Data = null;
  console.log(req.file);
  if (req.file === undefined || req.file === null) {
    return res.status(404).json({
      message: "Please upload a file",
    });
  }

  if (req.file !== undefined) {
    fileS3Data = await uploadFile(
      process.env.AWS_BUCKET_NAME + "/User",
      req.file
    );
  }

  if (!fileS3Data.Location) {
    return res.status(400).send("File Not uploaded please try again");
  }

  const FileUrl = fileS3Data.key;

  return res.status(201).json({ data: FileUrl });
});

/**
 * @swagger
 * /profile/upload:
 *   post:
 *     summary: Upload a file
 *     description: Upload a file for a user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: File uploaded successfully
 */

router.get("/download", async (req, res) => {
  let fileLocation = req.query.fileLocation;
  console.log(fileLocation);
  if (!fileLocation) {
    return res.status(403).send("Please provide details!");
  }
  fileLocation = fileLocation.toString();

  const fileData = await downloadFile(
    process.env.AWS_BUCKET_NAME + "/User",
    fileLocation
  );
  console.log("file data ", fileData);
  const file = new Readable({
    read() {
      this.push(fileData.Body);
      this.push(null);
    },
  });

  const fileNameArr = fileLocation.split("_");
  const filename = fileNameArr[fileNameArr.length - 1];
  const fileExtensionArr = fileLocation.split(".");
  const fileType = fileExtensionArr[fileExtensionArr.length - 1];

  res.setHeader(
    "Content-Disposition",
    'attachment: filename="' + filename + '"'
  );
  res.setHeader("Content-Type", mime.lookup(fileType));
  file.pipe(res);
  return res;
});

/**
 * @swagger
 * /profile/download:
 *   get:
 *     summary: Download a file
 *     description: Download a file for a user
 *     parameters:
 *       - in: query
 *         name: fileLocation
 *         schema:
 *           type: string
 *         required: true
 *         description: Location of the file to download
 *     responses:
 *       '200':
 *         description: File downloaded successfully
 */

router.patch("/:id", async (req, res) => {
  const query = req.params.id;
  const isValidId = isValidMongoDbObjectId(query);

  if (!isValidId) {
    return res.status(403).json({ message: "Please check the id" });
  }

  const body = req.body;
  const options = { upsert: false };

  const userStatusUpdated = await UserModel.findByIdAndUpdate(
    query,
    body,
    options
  );
  if (userStatusUpdated) {
    return res.status(200).json({ message: "Updated User" });
  } else {
    return res.status(403).json({ message: "Please check the id!" });
  }
});

/**
 * @swagger
 * /profile/{id}:
 *   patch:
 *     summary: Update user by ID
 *     description: Update user details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *               field2:
 *                 type: string
 *             example:
 *               field1: Updated Value
 *               field2: Updated Value
 *     responses:
 *       '200':
 *         description: User updated successfully
 *       '403':
 *         description: Invalid ID
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve
 *     responses:
 *       '200':
 *         description: User details retrieved successfully
 *       '404':
 *         description: User not found
 */

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const isValidId = isValidMongoDbObjectId(id);
  if (isValidId) {
    const userDetails = await UserModel.findById(id).select("-password");
    console.log("UserDetails : ", userDetails);
    return res.status(200).json({ data: userDetails });
  }
  console.log("error");
  return res.status(404).json({ message: "Something went wrong" });
});

export default router;
