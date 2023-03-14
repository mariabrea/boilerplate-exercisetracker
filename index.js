const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");


app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

//Connect to DB and create schemas
mongoose.connect(process.env.MONGODB_URI);
const { Schema } = mongoose;

const log = new Schema({
  description: String, 
  duration: Number, 
  date: String
}, { _id : false });

const userSchema = new Schema({
  username: String,
  count: Number,
  log: [log]
}, { __v : false });
  
const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  console.log("get /api/users");
  User.find().then((foundUsers) =>{
    if (foundUsers){
      console.log(foundUsers);
      res.send(foundUsers);
      // res.redirect(foundUrl.originalUrl);
    }
  }).catch((err) => {
    console.log(err);
  });
});

app.post('/api/users', (req, res) => {
  console.log("post /api/users");
  const newUser = new User({
    username: req.body.username,
    count: 0
  });
    
  newUser.save().then((savedUser)=>{
    console.log("saved user");
    res.json({ 
      username: savedUser.username,
      _id: savedUser._id});
  }).catch((err)=>{
    console.log(err);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  console.log("post /api/users/:_id/exercises");
  const logDate = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString();
  const newLog = {
    description: req.body.description,
    duration: req.body.duration,
    date: logDate
  };
  console.log(newLog);
  User.findByIdAndUpdate(req.params._id, {$inc: {count: 1}, $push: {log: newLog}}).then((foundUser) =>{
    if (foundUser){
      console.log(foundUser);
      res.json({ 
        _id: foundUser._id,
        username: foundUser.username,
        date: logDate,
        duration: Number(req.body.duration),
        description: req.body.description
        });
    }
  }).catch((err) => {
    console.log(err);
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  console.log("get /api/users/:_id/logs");
  
    User.findById(req.params._id, {"__v": 0}).then((foundUser) =>{
      if (foundUser){
        console.log(foundUser);
        let fromDate;
        let toDate;
        
        if (req.query.from) {
          fromDate = new Date(req.query.from);
        }
        if (req.query.to) {
          toDate = new Date(req.query.to);
        }
    
        if (fromDate && toDate){
          console.log("from: " + fromDate);
          console.log("to: " + toDate);
          logUser = foundUser.log.filter((item) => {
            let itemDate = new Date(item.date);
            // console.log(itemDate);
            return fromDate <= itemDate && itemDate <= toDate;
          });
          console.log(logUser);
        } else if (fromDate) {
          console.log("from: " + fromDate);
          logUser = foundUser.log.filter((item) => {
            let itemDate = new Date(item.date);
            // console.log(itemDate);
            return fromDate <= itemDate;
          });
          console.log(logUser);
        } else if (toDate) {
          console.log("to: " + toDate);
          logUser = foundUser.log.filter((item) => {
            let itemDate = new Date(item.date);
            // console.log(itemDate);
            return itemDate <= toDate;
          });
          console.log(logUser);
        } else {
          logUser = foundUser.log;
          console.log(logUser);
        }

        if (req.query.limit) {
          limit = Number(req.query.limit);
        }
        if (limit && limit < logUser.length) {
          logUser = logUser.slice(0, limit)
        }
        
        res.send({
          "_id": foundUser._id,
          "username": foundUser.username,
          "count": foundUser.count,
          "log": logUser
        });
        // res.redirect(foundUrl.originalUrl);
      }
    }).catch((err) => {
      console.log(err);
    });
  
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
