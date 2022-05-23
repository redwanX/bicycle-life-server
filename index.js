const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT||5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());



// Index
app.get('/',(req,res)=>{
    res.send("server is running");
})

//LISTENING TO PORT
app.listen(port,()=>{console.log(`listening to port: ${port}`)});
