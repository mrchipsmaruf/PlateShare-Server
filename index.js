const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rjffgqf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  ssl: true,
  tlsAllowInvalidCertificates: true, // Helps fix SSL issues on Windows
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
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`PlateShare server running on port: ${port}`);
});
