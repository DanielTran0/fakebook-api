# fakebook-api
Back end server for fakebook (Social Media Site)  

## Introduction

This is the RESTful API used for the MERN stack site [fakebook](https://fakebook-danieltran.netlify.app/#/login). As the stack implies this API server uses MongoDB, Express and Node on the back end. For more information about this site and the front end, check out the front end repository [fakebook-client](https://github.com/DanielTran0/fakebook-client). 

## API Routes

The resources provided are users, friends, posts, comments, likes and tokens. All but likes and tokens support all 4 CRUD operations. A snippet of the requirements for a get request on a specific user is:

    Server Site: https://fakebook-api-daniel-tran.herokuapp.com/
    
    GET /api/users/:userId (Get a specific user)
        Requirements:
            token
        Success:
          status: 200
          res: { user: coreDetails }
        Fail:
          status:500

For all the [routes](api-routes.md). This is no longer 100% accurate as it was mainly maintained at the beginning of the front end development, but it covers all the bases and generally has what is required and what will be given for each route.


## Authentication

Uses [Passport.js](http://www.passportjs.org/) and 3 passport strategies for route authentication. They are [local](http://www.passportjs.org/packages/passport-local/), [JSON Web Tokens](http://www.passportjs.org/packages/passport-jwt/) (JWT) and [Facebook tokens](https://www.npmjs.com/package/passport-facebook-token). The local strategy is used to verify the email and password in MongoDB, [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) will then sign it with the user id as the payload and pass a JWT to the client. The Facebook strategy verifies a token given by Facebook and creates a user with their Facebook profile if no one is found within the database.

* Passport
* Passport-local  
* Passport-jwt  
* Passport-facebook-token
* jsonwebtoken  

## Database & File Storage

Uses MongoDB to store all user data and [Mongoose](https://github.com/Automattic/mongoose) to perform all the Create, Read, Update and Delete (CRUD) operations on the documents. For images [Multer](https://github.com/expressjs/multer) is used to read the image files into memory and the buffer is sent to [Cloudinary](https://github.com/cloudinary/cloudinary_npm) for storage.

* MongoDB
* Mongoose  
* Multer  
* Cloudinary

## Data Handing 

Uses [Bcrypt](https://www.npmjs.com/package/bcrypt) to hash and compare user passwords. [Express-validator](https://express-validator.github.io/docs/) to sanitize and validate client form data.

* Bcrypt
* Express-validator

## Testing

Uses [Jest](https://jestjs.io/) as the testing framework with [Mongo Memory Server](https://github.com/nodkz/mongodb-memory-server) which creates and destroys a MongoDB sever for each test suite and [SuperTest](https://www.npmjs.com/package/supertest) to make HTTP requests. The tests can be found [here](tests).

* Jest
* Mongo Memory Server  
* SuperTest  



