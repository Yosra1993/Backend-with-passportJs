const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Post Schema
const Post = require("../../models/Post");
// Load Profile Schema
const Profile = require("../../models/Profile");
// Load Post Validation
const validatePostInput = require("../../validation/post");

// @route GET   api/posts/test
// @desc Tests  post route
// @ acess      Public
router.get("/test", (req, res) => res.json({ msg: "Posts Works" }));

// @route       Get api/posts/
// @desc Tests  Get all the post
// @ acess      Public
router.get("/", (req, res) => {
  Post.find()
    .then(posts => res.json(posts))
    .catch(err => res.status(404));
});

// @route       Get api/posts/:id
// @desc Tests  Get post by id
// @ acess      Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ nopostfound: "no post found by that id" })
    );
});

// @route       POST api/posts/
// @desc Tests  Create a post
// @ acess      Privates
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    //Check validation
    if (!isValid) {
      // if any error send 400 with errors object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @route       POST api/posts/:id
// @desc        post a post
// @ acess      Privates

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(post => {
      Post.findById(req.params.id)
        .then(post => {
          //Check if he is the owner of the post
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notAuthorized: "User not authorized" });
          }
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postNotFound: "no post found" }));
    });
  }
);

// @route       Post api/posts/like/:id
// @desc Tests  like a post
// @ acess      Privates

router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(post => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyLiked: "user already liked this post" });
          }
          // Add user id to the likes Array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postNotFound: "no post found" }));
    });
  }
);

// @route       Post api/posts/unlike/:id
// @desc Tests  like a post
// @ acess      Privates

router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(post => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notLiked: "You have not yet liked this post" });
          }
          // get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);
          //splice out of the array
          post.likes.splice(removeIndex, 1);

          // Save
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postNotFound: "no post found" }));
    });
  }
);

// @route       Post api/posts/commment/:id
// @desc Tests  add comment to post
// @ acess      Privates

router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    //Check validation
    if (!isValid) {
      // if any error send 400 with errors object
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };
        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

// @route       DELETE api/posts/commment/:id/:comment_id
// @desc Tests  remove comment from post
// @ acess      Privates

router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check if the comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: "Comment does not exist" });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        post.comments.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);
module.exports = router;
