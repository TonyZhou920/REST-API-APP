'use strict'

const auth = require('basic-auth');
const { User } = require('./models');
const bcrypt = require ('bcryptjs');

//Middleware to authenticate the request using Basic Authentication

exports.authenticateUser = async (req, res, next) => {
    let errorMessage;
    const credentials = auth(req);

    if (credentials) {
        const user = await User.findOne({
            where: { emailAddress: credentials.name }
        });
        if (user) {
            const authenticated = bcrypt.compareSync(credentials.pass, user.password); //returns true or false
            if (authenticated) {
                console.log(`Authentication successful. Welcome ${user.firstName} ${user.lastName}.`);

                //store user on the Request object
                req.currentUser = user;
            } else { // if authentication fails
                errorMessage = `Authentication failure for username: ${user.emailAddress}`
            }
        } else { //user not found
            errorMessage = `User not found with email address ${credentials.name}.`
        }
    } else {
        errorMessage = 'Auth header not found.';
    }

    if (errorMessage) {
        console.warn(errorMessage);
        res.status(401).json({ message: 'Access Denied.' })
    } else {
        next();
    }

};

// helper function to eliminate try catch blocks in routes
exports.asyncHandler = (callback) => {
    return async (req, res, next) => {
        try {
            await callback(req, res, next);
        } catch (error) {
            next(error);
        }
    }
}