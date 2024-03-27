import jwt from 'jsonwebtoken'
import 'dotenv'

export const jwtAuth = ( req , res , next ) =>{
    const token = req.headers.authorization

    if(!token){
        return res.status(401).json({"message" : "User is Unauthorized"})
    }

    jwt.verify(token , process.env.SECRET_KEY , ( err , verified )=>{

        if(err){
            return res.status(401).json({"message":"User is Unauthorized"})
        }

        req.user = verified
        return next()

    })
}

export default jwtAuth