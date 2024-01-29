const express = require('express')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const app = express()
const stripe = require("stripe")(process.env.SECRET_KEY)
const port = process.env.PORT || 5000

app.use(express.static("public"));
app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktupw59.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const userCollection = client.db("bistroDB").collection("users");
        const menuCollection = client.db("bistroDB").collection("menu");
        const reviewsCollection = client.db("bistroDB").collection("reviews");
        const cartsCollection = client.db("bistroDB").collection("carts");

        // jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1h'
            })
            res.send({ token })
        })
        app.post('/carts', async (req, res) => {
            const cartItem = req.body
            const result = await cartsCollection.insertOne(cartItem)
            res.send(result)
        })
        // menu post
        app.post('/menu', async (req, res) => {
            const menuItem = req.body
            const result = await menuCollection.insertOne(menuItem)
            res.send(result)
        })
        // user post and get, delete
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already login', insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })
        // update
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // 
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })

        app.get('/carts', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await cartsCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartsCollection.deleteOne(query)
            res.send(result)
        })
        // PAYMENT API

        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_methods_type:
                    ['cart']
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World therer!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})