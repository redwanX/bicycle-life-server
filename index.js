const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT||5000;
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(cors());
app.use(express.json());

// Index
app.get('/',(req,res)=>{
    res.send("server is running");
})

//JWT VERIFICATION MIDDLEWARE
function JWTverify(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).send({message:"Unauthorized"});
    }
    const token = header.split(' ')[1];
    jwt.verify(token,process.env.JWT_SECRET,(err, decoded)=> {
      if (err) {
        return res.status(403).send({message:"Forbidden"})
      }
      req.decoded = decoded;
      next();
    });
  }



//MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uttsl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=>{
    try{
        await client.connect();
        const products = client.db('parts').collection('parts');
        const users = client.db('parts').collection('users');
        const order = client.db('parts').collection('order');
        const reviews = client.db('parts').collection('reviews');
        const quote = client.db('parts').collection('quote');

        //add quote
        app.post('/quote',async(req,res)=>{
            const result = await quote.insertOne(req.body);
            res.send(result);
        });
        //ADMIN
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await users.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              next();
            }
            else {
              res.status(403).send({ message: 'Forbidden Access' });
            }
          }
        
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await users.findOne({ email: email });
            const admin = user.role === 'admin';
            res.send({ admin })
          })
      
        app.put('/user/admin/:email', JWTverify, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
              $set: { role: 'admin' },
            };
            const result = await users.updateOne(filter, updateDoc);
            res.send(result);
          })

          //GET ALL USERS
          app.get('/users',JWTverify,async(req,res)=>{
            query={};
            const cursor = users.find(query);
            const result= await cursor.toArray();
            res.send(result);
            });
        


        // ADD PARTS
        app.post('/addProduct',JWTverify,verifyAdmin,async (req,res)=>{
                const result = await products.insertOne(req.body);
                res.send(result);
        });

        // DELETE PARTS BY ID
        app.delete('/deleteItem/:id',JWTverify,verifyAdmin,async(req,res)=>{
            try{
                const id=req.params.id;
            if(id){
                const query = {_id:ObjectId(id)};
                const result = await products.deleteOne(query);
                res.send(result);
            }
            else{
                res.send({message:"something went wrong"});
            }
            }
            catch{
                res.send({message:"something went wrong"});
            }
        });


        //GET ALL ORDERS
        app.get('/allorder',JWTverify,verifyAdmin,async(req,res)=>{
            try{
                const query={};
                const cursor = order.find(query);
                const result= await cursor.toArray();
                res.send(result);
            }
            catch{
                res.send({message:"something went wrong"});
            }
        });




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
            res.send({ result, token });
          });

        //UPDATE PROFILE
        app.put('/updateProfile',JWTverify,async(req, res) => {
            try{
                const user= req.body;
                if(user.email === req.decoded.email){
                    const email = user.email;
                    delete user._id
                    const filter = { email: email };
                    const options = { upsert: true };
                    const updateDoc = {
                      $set: user,
                    };
                    const result = await users.updateOne(filter, updateDoc, options);            
                    res.send(result);
                }
                else{
                    return res.status(401).send({message:"Unauthorized"});
                }
            }
                catch{
                    res.send({message:"something went wrong"})
                }

        });

        //GET PROFILE DATA
        app.get('/profile/:email',async(req,res)=>{
            try{
                const email = req?.params?.email;
                const query = {email:email}
                const result = await users.findOne(query)
                res.send(result);
            }
            catch{
                res.send({message:"something went wrong"})
            }
        })

        
        //ADD ORDER
        app.post('/order',JWTverify,async(req,res)=>{
            try{
            const data= req.body;
            if(data.email === req.decoded.email){
            data.status="unpaid";
            const result = await order.insertOne(data)
            res.send(result);
            }
            else{
                return res.status(401).send({message:"Unauthorized"});
            }
            }
            catch{
                res.send({message:"something went wrong"})
            }
        });


        //ADD REVIEW
        app.post('/review',JWTverify,async(req,res)=>{
            try{
            const data= req.body;
            if(data.email === req.decoded.email){
            const result = await reviews.insertOne(data)
            res.send(result);
            }
            else{
                return res.status(401).send({message:"Unauthorized"});
            }
            }
            catch{
                res.send({message:"something went wrong"})
            }
        });

        //GET ALL REVIEW
        app.get('/review',async(req,res)=>{
            query={};
            const cursor = reviews.find(query);
            const result= await cursor.toArray();
            res.send(result);
            });

        //GET ORDER BY EMAIL
        app.get('/order',JWTverify,async(req,res)=>{
            const decodedEmail=req?.decoded?.email;
            const QueryEmail = req?.query?.email;
            if(decodedEmail === QueryEmail){
            if(QueryEmail){
                const query={email:QueryEmail};
                const cursor = order.find(query);
                const result= await cursor.toArray();
                res.send(result);
            }
            else{
                res.send([]);
            }
            }
            else{
                res.status(403).send({message:"Forbidden Access!"});
            }
        });


        //GET ORDER BY ID
        app.get('/orderById/:id',JWTverify,async(req,res)=>{
            try{
                const id = req?.params?.id
                const query = {_id:ObjectId(id)}
                const result = await order.findOne(query)
                res.send(result);
                }
                catch{
                    res.send({})
                }
        });

        //UPDATE ORDER BY ID
        app.put('/updateOrder/:id',JWTverify,async(req, res) => {
            try{
                let orderBody= req.body;
                if(orderBody.email === req.decoded.email){
                    const id=req.params.id;
                    delete orderBody.email
                    const filter = {_id:ObjectId(id)};
                    const options = { upsert: true };
                    const updateDoc = {
                      $set: orderBody,
                    };
                    const result = await order.updateOne(filter, updateDoc, options);            
                    res.send(result);
                }
                else{
                    return res.status(401).send({message:"Unauthorized"});
                }
            }
                catch{
                    res.send({message:"something went wrong"})
                }

        });


        //DETE ORDER
        app.delete('/order/:id',JWTverify,async(req,res)=>{
            try{
                const id=req.params.id;
            if(id){
                const query = {_id:ObjectId(id)};
                const result = await order.deleteOne(query);
                res.send(result);
            }
            else{
                res.send({message:"something went wrong"})
            }
            }
            catch{
                res.send({message:"something went wrong"});
            }
        });



        //PAYMENT APIES

        app.post('/create-payment-intent', JWTverify, async(req, res) =>{
            const order = req.body;
            const price = order.price;
            const amount = parseInt(price)*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret})
          });

    }
    finally{
    }
}
run().catch(console.dir);




//LISTENING TO PORT
app.listen(port,()=>{console.log(`listening to port: ${port}`)});
