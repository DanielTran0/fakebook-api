*status 401: unauthorized (needs header { auth: bearer token })  
coreDetails = { _id, email, firstName, lastName, profileImage }  
error1 = { location, msg, param, value }  
error2 = { msg }  
status = enum: ['friends', 'incoming', 'outgoing']  
postDetails = { user, text, postImage, date, likes, comments }  

User Routes
    
    GET /api/users (Get all users)
        Requirements:
            token
        Succuss:
            status:200
            res: { users: [ coreDetails ]}
        Fail:
            status:500

    GET /api/users/:userId (Get a specific user)
        Requirements:
            token
        Succuss:
          status: 200
          res: { user: coreDetails }
        Fail:
          status:500

    POST /api/users (Create a new user)
        Requirements:
            email
            firstName
            lastName
            password
            passwordConfirmation
        Succuss:
          status: 200
          res: { user: coreDetails }
        Fail:
          status:400
          res: { user: { filled in fields }, errors: [ error1 ] }

    PUT /api/users/:userId (Change an existing user's details)
        Requirements:
            token
            email
            firstName
            lastName
            password
            newPassword
            newPasswordConfirmation
            lastImage (keep or '')
            userImage (image file)
        Succuss:
          status: 200
          res: { user: coreDetails }
        Fail:
          status: 400
          res: { user: { filled in fields }, errors: [ error1 ] }
    
    Delete /api/users/
        Requirements:
            token
            password
        Succuss:
          status: 200
          res: { msg: 'successful delete' }
        Fail:
          status: 400
          res: { user: { filled in fields }, errors: [ error1 ] }
          
Session Routes

    POST /api/sessions (login and receive a token)
        Requirements:
          email
          password
        Succuss:
          status: 200
          res: { user: coreDetails ,token }
        Fail:
          status: 500
          res: { errors: error2 }

Friends Routes
    
    GET /api/friends (Get current user's friends)
        Requirements:
            token
        Succuss: 
          status: 200
          res: { friends: [ { coreDetails, status } ] }
        Fail:
          status: 500

    GET /api/friends/:userId (Get another user's friends, no pending requests)
        Requirements:
            token
        Succuss: 
          status: 200
          res: { friends: [ { coreDetails, status } ] }
        Fail:
          status: 500

      POST /api/friends/:userId (Send a friend request)
        Requirements:
            token
        Succuss: 
          status: 200
          res: { friends: [ { user: coreDetails, status } ] }
        Fail:
          status: 400
          res: { errors: [ error2 ] }

    Put /api/friends/:userId (Accept or reject a friend request)
        Requirements:
            token
            option ('accept' || 'reject')
        Succuss: 
          status: 200
          res: { friends: [ { user: coreDetails, status } ] }
        Fail:
          status: 400
          res: { errors: [ error2 ] }

    Delete /api/friends/:userId (Cancel a friend request or delete a friend)
        Requirements:
          token
        Succuss: 
          status: 200
          res: { friends: [ { user: coreDetails, status } ] }
        Fail:
          status: 400
          res: { errors: [ error2 ] }

Post Routes

    GET /api/posts (Get all of current user and friends posts)
        Requirements:
            token
        Succuss:
            status:200
            res: { posts : [ postDetails ] }
        Fail:
            status: 500

    GET /api/posts/:userId (Get all of another user's posts)
        Requirements:
            token
        Succuss:
          status: 200
          res: { posts : [ postDetails ] }
        Fail:
          status:500

    POST /api/posts (Create a new post)
        Requirements:
            token
            text
            postImage (image file)
        Succuss:
          status: 200
          res: { post: postDetails }
        Fail:
          status: 400
          res: { errors: [ error1 ] }
          
    PUT /api/posts/:postId  (Change a post's details)
        Requirements:
            token
            text
            postImage (image file)
            lastImage (keep or '')
        Succuss:
          status: 200
          res: { post: postDetails }
        Fail: { posts : [ postDetails ] }
          status: 400
          res: { errors: [ error1 ] }
        
    Delete /api/posts/:postId (Delete a post)
        Requirements:
            token
        Succuss: 
          status: 200
          res:
        Fail:  { posts : [ postDetails ] }
          status: 400
          res: { errors: [ error2 ] }

Post-Likes Routes

    PUT /api/likes/:postId (add like if none, delete like if it exists)
        Requirements:
          token
        Succuss:
          status: 200
          res: { post: { _id, likes} }
        Fail:
          status: 500

Post-Comments Routes

    POST /api/comments/:postId (Create a new comment on a post)
        Requirements:
            token
            text
        Succuss:
          status: 200
          res: { post: { _id, comments }
        Fail:
          status: 400
          res: { errors: [ error1 ] }
          
    PUT /api/comments/:commentId  (Change a post comment)
        Requirements:
            token
            text
            postId
        Succuss:
          status: 200
          res: { post: { _id, comments } }
        Fail:
          status: 400
          res: { errors: [ error1 ] }
        
    Delete /api/comments/:commentId (Delete a post)
        Requirements:
            token
            postId
        Succuss: 
          status: 200
          res: { post: { _id, comments } }
        Fail:
          status: 400
          res: { errors: [ error2 ] }
