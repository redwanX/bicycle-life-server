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

//MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uttsl.mongodb.net/?retryWrites=true&w=majority";`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=>{
    try{
        await client.connect();
        const products = client.db('furnitures').collection('parts');
        
        //GET ALL TOOLS
        app.get('/alltools',async(req,res)=>{
            query={};
            const cursor = products.find(query);
            const result= await cursor.toArray();
            res.send(result);
            });
        //GET A SINGLE TOOL BY ID
        app.get('/tool/:id',async(req,res)=>{
                try{
                const id = req?.params?.id
                const query = {_id:ObjectId(id)}
                const result = await products.findOne(query)
                res.send(result);
                }
                catch{
                    res.send({})
                }
            });
    }
    finally{
    }
}
run().catch(console.dir);




//LISTENING TO PORT
app.listen(port,()=>{console.log(`listening to port: ${port}`)});
