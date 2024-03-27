import express from "express";
import UserModel from "../model/user.js";
import { isValidMongoDbObjectId } from "../helper/index.js";
import { uploadFile, downloadFile } from "../middleware/upload.js";
import upload from "../middleware/multer.js";
import "dotenv";
import { Readable } from "stream";
import mime from "mime-types";

const router = express.Router();

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
