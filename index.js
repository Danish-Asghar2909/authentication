import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import passport from "passport";
import bodyParser from "body-parser";
import session from "express-session";
import AuthenticateRouter from './routes/authenticate.js';

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});


app.use('/api', AuthenticateRouter)


app.get('/', async ( req, res )=>{
    return res.status(200).send('Server is running')
})

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
