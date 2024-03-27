import { Types } from 'mongoose';

const { ObjectId } = Types;


const isValidMongoDbObjectId = (id) =>{
    if(ObjectId.isValid(id)){
        if((String)(new ObjectId(id)) === id)
            return true;
        return false;
    }
    return false;
}

const GlobalExceptionHandler = (err, req, res, next) => {
    // console.log(err)
    err.statusCode = err.status || 500;
    err.message =
      err instanceof BaseException ? err.message : "Something went wrong!";
  
    // Check if the response headers have already been sent
    if (res.headersSent) {
      return next(err);
    }
    console.log(err)
    return res.status(404).json({message : "Something went wrong"})

  };
  

export {isValidMongoDbObjectId , GlobalExceptionHandler}