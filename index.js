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
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        console.log("MongoDB connected successfully!");

        const db = client.db("PlateShareDB");
        const foodsCollection = db.collection("foods");
        const foodRequestsCollection = db.collection("foodRequests");

        app.post('/foods', async (req, res) => {
            try {
                const newFood = req.body;
                newFood.food_status = newFood.food_status || "Available";
                const result = await foodsCollection.insertOne(newFood);
                res.status(201).json({ success: true, insertedId: result.insertedId });
            } catch (error) {
                console.error("Error adding food:", error);
                res.status(500).json({ success: false, message: "Failed to add food" });
            }
        });

        app.get('/foods', async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { donator_email: email } : {};
                const foods = await foodsCollection.find(query).toArray();
                res.json(foods);
            } catch (error) {
                console.error("Error fetching foods:", error);
                res.status(500).json({ message: "Failed to fetch foods" });
            }
        });

        app.get('/my-foods', async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) {
                    return res.status(400).json({ success: false, message: "Email is required" });
                }

                const myFoods = await foodsCollection.find({ donator_email: email }).toArray();
                res.status(200).json(myFoods);
            } catch (error) {
                console.error("Error fetching my foods:", error);
                res.status(500).json({ success: false, message: "Failed to fetch my foods" });
            }
        });

        app.get('/foods/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const food = await foodsCollection.findOne({ _id: new ObjectId(id) });
                if (!food) return res.status(404).json({ message: "Food not found" });
                res.json(food);
            } catch (error) {
                console.error("Error fetching food:", error);
                res.status(500).json({ message: "Failed to fetch food" });
            }
        });

        app.patch('/foods/:id', async (req, res) => {
            try {
                const id = req.params.id.trim();

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ success: false, message: "Invalid food ID format" });
                }

                const updatedData = req.body;

                const result = await foodsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ success: false, message: "Food not found" });
                }

                res.json({ success: true, message: "Food updated successfully" });
            } catch (error) {
                console.error("Error updating food:", error);
                res.status(500).json({ success: false, message: "Server error while updating food" });
            }
        });

        app.delete('/foods/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await foodsCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.status(404).json({ success: false, message: "Food not found" });
                }
                res.json({ success: true, message: "Food deleted successfully" });
            } catch (error) {
                console.error("Error deleting food:", error);
                res.status(500).json({ success: false, message: "Error deleting food" });
            }
        });

        app.post('/food-requests', async (req, res) => {
            try {
                const foodRequest = req.body;
                const result = await foodRequestsCollection.insertOne(foodRequest);
                res.status(201).json({ success: true, insertedId: result.insertedId });
            } catch (error) {
                console.error("Error adding food request:", error);
                res.status(500).json({ message: "Failed to add food request" });
            }
        });

        app.get('/food-requests', async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { requester_email: email } : {};
                const requests = await foodRequestsCollection.find(query).toArray();
                res.json(requests);
            } catch (error) {
                console.error("Error fetching food requests:", error);
                res.status(500).json({ message: "Failed to fetch food requests" });
            }
        });

        app.put('/food-requests/:id', async (req, res) => {
            try {
                const id = req.params.id.trim();
                const { status } = req.body;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ success: false, message: "Invalid request ID format" });
                }

                // Update request status
                const request = await foodRequestsCollection.findOne({ _id: new ObjectId(id) });
                if (!request) {
                    return res.status(404).json({ success: false, message: "Request not found" });
                }

                const result = await foodRequestsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status } }
                );

                if (status === "accepted") {
                    await foodsCollection.updateOne(
                        { _id: new ObjectId(request.foodId) },
                        { $set: { food_status: "donated" } }
                    );
                }

                res.json({ success: true, message: `Request ${status} successfully.` });
            } catch (error) {
                console.error("Error updating food request:", error);
                res.status(500).json({ success: false, message: "Server error while updating food request" });
            }
        });

        app.get('/food-requests/:foodId', async (req, res) => {
            try {
                const foodId = req.params.foodId;
                const requests = await foodRequestsCollection
                    .find({ foodId: foodId })
                    .toArray();
                res.json(requests);
            } catch (error) {
                console.error("Error fetching food requests by foodId:", error);
                res.status(500).json({ message: "Failed to fetch food requests" });
            }
        });

        app.get('/my-requests', async (req, res) => {
            try {
                const email = req.query.email;
                const query = email ? { requesterEmail: email } : {};
                const requests = await foodRequestsCollection.find(query).toArray();
                res.json(requests);
            } catch (error) {
                console.error("Error fetching user requests:", error);
                res.status(500).json({ message: "Failed to fetch user requests" });
            }
        });

        app.delete("/my-requests/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await foodRequestsCollection.deleteOne(query);

                if (result.deletedCount > 0) {
                    res.send({ success: true, deletedCount: result.deletedCount });
                } else {
                    res.status(404).send({ success: false, message: "Request not found" });
                }
            } catch (error) {
                console.error("Error deleting request:", error);
                res.status(500).send({ success: false, message: "Internal server error" });
            }
        });

        app.get('/', (req, res) => {
            res.send("PlateShare Server is running successfully!");
        });

        app.listen(port, () => {
            console.log(`PlateShare server running on port: ${port}`);
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run().catch(console.dir);
