import express from 'express';
import UserModel from '../model/user.js';
import { isValidMongoDbObjectId } from '../helper/index.js'

const router = express.Router()


router.get('/:id', async ( req , res )=>{
  
    const id = req.params.id
    const isValidId = isValidMongoDbObjectId(id)
    if(isValidId){
        const userDetails = await UserModel.findById(id).select('-password')
        console.log("UserDetails : ", userDetails)
        return res.status(200).json({data : userDetails})
    }

    return res.status(404).json({message : "Something went wrong"})
})


router.get('/' , async ( req , res )=>{

    const user = req.user
    const queryParams  = {...req.query}
    const excludeApiFields = ['page', 'sort', 'limit', 'fields', 'offset', 'populate'];
    excludeApiFields.forEach(e => delete queryParams[e]);

    console.log("user: ", user, req.query)
    if(user.isAdmin){
        console.log("Fetch All detail because he is admin")
        const users = await UserModel.find({ ...queryParams })
        .limit(Number(req.query.limit))
        .skip(Number(req.query.offset))
        .sort(req.query.sort)
        .select(req.query.fields)
        .populate(req.query.populate)
        .select('-password');

        return res.status(200).json({data : users})
    }

    console.log("Fetch only public detail because he is user")
    const users = await UserModel.find({ ...queryParams , isProfilePublic : true })
    .limit(Number(req.query.limit))
    .skip(Number(req.query.offset))
    .sort(req.query.sort)
    .select(req.query.fields)
    .populate(req.query.populate)
    .select('-password');

    return res.status(200).json({data : users})
})


export default router