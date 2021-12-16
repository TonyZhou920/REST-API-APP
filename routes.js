'use strict'

const express = require('express');
const { User, Course } = require('./models');
const { authenticateUser, asyncHandler } = require('./middleware');
const course = require('./models/course');

// Construct a router instance
const router = express.Router();

/* ----------- */
/* USER ROUTES */
/* ----------- */

// /users GET current User and return a 200 status code --needs authentication
router.get('/users', authenticateUser, asyncHandler(async(req, res) => {
        const user = req.currentUser;

        res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress
        });
    })
);

// /users POST create a new user, set Location header to '/' and return a 201 status code
router.post('/users', asyncHandler(async(req, res) => {
        try {
            await User.create(req.body);
            res.status(201).location('/').end();
        } catch (error) {
            if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
                const errors = error.errors.map((err) => err.message);
                res.status(400).json({errors});
            } else {
                throw error;
            }
        }
    })
);

/* ------------- */
/* COURSE ROUTES */
/* ------------- */

// /courses GET all courses and the User associated with each course, return 200 status code
router.get('/courses', asyncHandler(async(req, res) => {
        const courses = await Course.findAll({
            attributes: ['id','title','description','estimatedTime','materialsNeeded'],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id','firstName','lastName','emailAddress']
            }],
        });
        res.status(200).json({courses});
    })
);

// /courses/:id GET corresponding course including the User associated with that course, return 200 status code
router.get('/courses/:id', asyncHandler(async(req, res) => {
        const course = await Course.findByPk(req.params.id, {
            attributes: ['id','title','description','estimatedTime','materialsNeeded'],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id','firstName','lastName','emailAddress']
            }],
        });
        if (course) {
            res.status(200).json({course});
        } else {
            res.status(404).json({message: "Sorry, the course you were looking for doesn't exist."})
        }
    })
);

// /courses POST  create a new course, set the Location header to the URI for the new course and return 201 status code and no content --needs authentication
router.post('/courses', authenticateUser, asyncHandler(async(req, res) => {
        const user = req.currentUser;
        try {
            const course = await Course.create(req.body);
            res.status(201).location(`api/courses/${course.id}`).end();
        } catch (error) {
            if (error.name === "SequelizeValidationError") {
                const errors = error.errors.map((err) => err.message);
                res.status(400).json({errors});
            } else {
                throw error;
            }
        }
    })
);

// /courses/:id PUT update the corresonding course and return 204 status code and no content --needs authentication
router.put('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
        const user = req.currentUser;

        const course = await Course.findByPk(req.params.id);
        if (course) {
            if (course.userId == user.id) {
                try {
                    await course.update(req.body);
                    res.status(204).end();
                } catch (error) {
                    if (error.name === "SequelizeValidationError") {
                        const errors = error.errors.map((err) => err.message);
                        res.status(400).json({errors});
                    } else {
                        throw error;
                    }
                }
            } else {
                res.status(403).json({message: "You don't have authorization to edit this course."})
            }
        } else {
            res.status(404).json({message: "Sorry, the course you were looking for doesn't exist."})
        }
    })
);

// /courses/:id DELETE delete the corresponding course and return 204 status code and no content --needs authentication
router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
        const user = req.currentUser;

        const course = await Course.findByPk(req.params.id);
        if (course) {
            if (course.userId == user.id) {
                await course.destroy();
                res.status(204).location('/api/courses').end();
            } else {
                res.status(403).json({message: "You don't have authorization to delete this course."})
            }
        } else {
            res.status(404).json({message: "Sorry, the course you were looking for doesn't exist."})
        }
    })
);

module.exports = router;