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

        app.get('/foods', async (req, res) => {
            try {
                const result = await foodsCollection.find().toArray();
                res.status(200).json(result);
            } catch (error) {
                console.error('Error fetching foods:', error);
                res.status(500).json({ message: 'Error fetching foods' });
            }
        });

        app.get('/my-foods', async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) {
                    return res.status(400).json({ message: 'Missing email query parameter' });
                }

                const result = await foodsCollection.find({ donator_email: email }).toArray();
                res.status(200).json(result);
            } catch (error) {
                console.error('Error fetching user foods:', error);
                res.status(500).json({ message: 'Error fetching user foods' });
            }
        });

        app.get('/foods/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const query = { _id: new ObjectId(id) };
                const result = await foodsCollection.findOne(query);

                if (!result) {
                    return res.status(404).json({ message: 'Food not found' });
                }

                res.status(200).json(result);
            } catch (error) {
                console.error('Error fetching food by ID:', error);
                res.status(500).json({ message: 'Error fetching food by ID' });
            }
        });

        app.post('/foods', async (req, res) => {
            try {
                const foodData = req.body;
                if (!foodData.food_name || !foodData.food_image || !foodData.donator_email) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                const result = await foodsCollection.insertOne(foodData);
                res.status(201).json({
                    success: true,
                    message: 'Food added successfully',
                    insertedId: result.insertedId,
                });
            } catch (error) {
                console.error('Error adding food:', error);
                res.status(500).json({ message: 'Error adding food' });
            }
        });

        app.put("/foods/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;

                const result = await foodsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ success: false, message: "Food not found" });
                }

                if (result.modifiedCount === 0) {
                    return res.status(200).json({ success: true, message: "No changes made" });
                }

                res.status(200).json({ success: true, message: "Food updated successfully" });
            } catch (error) {
                console.error("Error updating food:", error);
                res.status(500).json({ success: false, message: "Error updating food" });
            }
        });

        app.delete("/foods/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await foodsCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ success: false, message: "Food not found" });
                }

                res.status(200).json({ success: true, message: "Food deleted successfully" });
            } catch (error) {
                console.error("Error deleting food:", error);
                res.status(500).json({ success: false, message: "Error deleting food" });
            }
        });

        app.get('/featured-foods', async (req, res) => {
            try {
                const foods = await foodsCollection.find().toArray();
                const featuredFoods = foods
                    .map(food => ({
                        ...food,
                        serves: parseInt(food.food_quantity.match(/\d+/)?.[0] || 0),
                    }))
                    .sort((a, b) => b.serves - a.serves)
                    .slice(0, 6);

                res.status(200).json(featuredFoods);
            } catch (error) {
                console.error('Error fetching featured foods:', error);
                res.status(500).json({ message: 'Error fetching featured foods' });
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
