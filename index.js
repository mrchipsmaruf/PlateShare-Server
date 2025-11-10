let express = require('express');
let cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

let app = express();
let port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://PlateShareDB:zTBqUWgbGU3BppYO@cluster0.rjffgqf.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Smart server is running');
});

async function run() {
    try {
        await client.connect();

        let db = client.db('PlateShareDB')
        let foodsCollections = db.collection('foods');

        app.get('/foods', async(req, res) => {
            let result = await foodsCollections.find().toArray();
            res.send(result);
        })


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Smart server is running on port: ${port}`);
});
