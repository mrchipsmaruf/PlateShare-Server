const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rjffgqf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    ssl: true,
    tlsAllowInvalidCertificates: true,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

app.get('/', (req, res) => {
    res.send('PlateShare server is running');
});

async function run() {
    try {
        await client.connect();
        console.log('MongoDB connected successfully!');

        const db = client.db('PlateShareDB');
        const foodsCollection = db.collection('foods');
        const foodRequestsCollection = db.collection('foodRequests');

        app.get('/foods', async (req, res) => {
            const result = await foodsCollection.find().toArray();
            res.send(result);
        });

        app.post('/food-requests', async (req, res) => {
            try {
                const requestData = req.body;
                if (!requestData.requesterEmail || !requestData.foodId) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing requesterEmail or foodId",
                    });
                }

                const result = await foodRequestsCollection.insertOne(requestData);
                res.status(201).json({
                    success: true,
                    message: "Food request submitted successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                console.error("Error submitting request:", error);
                res.status(500).json({ success: false, message: "Error submitting request" });
            }
        });

        app.get('/food-requests', async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) {
                    return res.status(400).json({ success: false, message: "Missing email parameter" });
                }

                const result = await foodRequestsCollection
                    .find({ requesterEmail: email })
                    .toArray();

                res.status(200).json(result);
            } catch (error) {
                console.error("Error fetching requests:", error);
                res.status(500).json({ success: false, message: "Error fetching requests" });
            }
        });

    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

run().catch(console.error);

app.listen(port, () => {
    console.log(`PlateShare server running on port: ${port}`);
});
