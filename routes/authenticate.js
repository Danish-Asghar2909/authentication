import express from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv/config';
import jwt from 'jsonwebtoken'
import UserModel from '../model/user.js'
import bcrypt from 'bcrypt'

const router = express.Router()


// Configure JWT Strategy for authentication
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_KEY // Change this to your secret key
};

passport.use(new JwtStrategy(jwtOptions, (jwt_payload, done) => {
  // Check if the user exists in the database or any other storage mechanism
  // Here, jwt_payload will contain the decoded JWT token
  if (jwt_payload.user) {
    return done(null, jwt_payload.user);
  } else {
    return done(null, false);
  }
}));


// Configure Google OAuth2.0 Strategy for authentication
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK
}, (accessToken, refreshToken, profile, done) => {
  // You can save the user profile to your database or session here
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  // Serialize the user object here
  done(null, user);
});

passport.deserializeUser((user, done) => {
  // Deserialize the user object here
  done(null, user);
});


const validatePassword = async (password, hash) => await bcrypt.compare(password, hash)
const hashPassword = async (password) => await bcrypt.hash(password, 10)

// Endpoint for login
router.post('/login', async (req, res) => {
  // Authenticate user using Passport.js local strategy or any other method
  // If authentication succeeds, generate JWT token and send it back to the client
  try {

    if (!req.body.email || !req.body.password) {
      return res.status(403).json({ "message": "Missing value e-mail or password" })
    }

    const user = await UserModel.findOne({ email: req.body.email })

    if (!user) {
      return res.status(403).json({ "message": "No user with email exist" })
    }

    const passwordmatch = await validatePassword(
      req.body.password,
      user.password
    );

    if (!passwordmatch) {
      return res.status(403).json({ "message": "Password is incorrect" })
    }

    const now = Date.now();
    const data = {
      _id: user?._id, // important
      iat: now,
      email: user?.email,
      isAdmin : user?.isAdmin
    };
    const jwtToken = jwt.sign(data, process.env.SECRET_KEY, { expiresIn: "14d" });
    res.status(200).json({ token : jwtToken });
  } catch (err) {
    console.log("Error : ", err)
    return res.status(500).json({err : err.message})
  }

});

router.post('/register', async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const name = req.body.name
  const username = req.body.username
  if (!email || !password) return res.status(403).json({ message: 'Something went wront!' })

  const hashed = await hashPassword(password)


  try {

    const response = new UserModel({ email: email, password: hashed, name: name , username : username})
    const savedUser = await response.save()

    return res.status(201).json(savedUser)
  } catch (err) {
    return res.status(403).json(err)
  }


})

// Endpoint for logout (optional)
router.get('/logout', (req, res) => {
  // Perform logout actions here
  res.status(200).json({ 'message': 'Logged out successfully' });
});

// Endpoint for Google login
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback endpoint for Google login
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard or generate JWT token
    const token = jwt.sign({ user: req.user }, process.env.SECRET_KEY , { expiresIn: '1h' });
    res.redirect(`/api/dashboard?token=${token}`);
  }
);

// Protected endpoint (example: dashboard)
router.get('/dashboard', async (req, res) => {
  // Only accessible if the user is authenticated via JWT token
  console.log("Token ", req.query.token)
  if(!req.query.token){
    return res.status(401).json({'message' : "Unauthorized!"})
  }
  await jwt.verify(req.query.token , process.env.SECRET_KEY , async ( err , data)=>{
    console.log("Data : ", data)
  })
  res.send('Welcome to the dashboard!');
});

export default router