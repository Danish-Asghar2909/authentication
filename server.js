import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import passport from "passport";
import bodyParser from "body-parser";
import session from "express-session";
import AuthenticateRouter from "./routes/authenticate.js";
import ProfileRouter from "./routes/profile.js";
import jwtAuth from "./middleware/isAuth.js";
import { GlobalExceptionHandler } from "./helper/index.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();
mongoose.connect(process.env.DATABASE_URL);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication",
      version: "1.0.0",
      description:
        "The enhanced authentication API, built on Node.js, introduces features for users to set their profiles as public or private. Admins can access both public and private profiles, while normal users are limited to public ones. With endpoints for listing and retrieving profiles based on user roles, the API ensures comprehensive profile management. It's secure, well-documented, and optionally hosted on platforms like Heroku. Swagger provides an API playground for interactive testing.",
    },
    servers: [
      {
        url: "http://authentication.us-east-1.elasticbeanstalk.com",
        description: "Development server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API routes
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Error handling middleware
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("Something went wrong!");
});

app.use("/api", AuthenticateRouter);
app.use("/profile", jwtAuth, ProfileRouter);

app.get("/", async (req, res) => {
  return res.status(200).send("Server is running");
});

app.use(GlobalExceptionHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  const db = mongoose.connection;
  db.on("error", (error) => {
    console.error("Error in connecting DataBase + ", error);
  });
  db.once("open", () => {
    console.log("Connected to DataBase");
  });
  console.log("App is running on port : " + PORT);
});
