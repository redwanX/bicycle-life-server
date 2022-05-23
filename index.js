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
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uttsl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=>{
    try{
        await client.connect();
        const products = client.db('parts').collection('parts');
        const users = client.db('parts').collection('users');
        
        //GET ALL PARTS
        app.get('/allparts',async(req,res)=>{
            query={};
            const cursor = products.find(query);
            const result= await cursor.toArray();
            res.send(result);
            });
        //GET A SINGLE PART BY ID
        app.get('/part/:id',async(req,res)=>{
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
        //CREATING JWT TOKEN
        app.put('/login/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await users.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1d' })
            console.log(token);
            res.send({ result, token });
          });
    }
    finally{
    }
}
run().catch(console.dir);




//LISTENING TO PORT
app.listen(port,()=>{console.log(`listening to port: ${port}`)});
