const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { MongoClient, GridFSBucket } = require('mongodb');
const app = express();

app.use(cors());
app.get("/",(req,res) =>{
  res.setHeader("Access-control-Allow-Credentials","true");
  res.send("api is running")
})
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(express.json());

const mongoURI = 'mongodb+srv://sahil:sahil@flight.vdrclkj.mongodb.net/';
const dbName = 'upload';
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let bucket;

async function connectToMongo() {
  try {
    await client.connect();
    bucket = new GridFSBucket(client.db(dbName));
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToMongo();

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    if (!bucket) return res.status(500).json({ error: 'MongoDB connection not established' });

    const fileData = [];

    for (const file of req.files) {
      const uploadStream = bucket.openUploadStream(file.originalname);
      uploadStream.end(file.buffer);

      const fileInfo = {
        name: file.originalname,
        size: file.size,
        createdAt: new Date(),
      };

      fileData.push(fileInfo);
    }

    res.json(fileData);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/saved-files', async (req, res) => {
  try {
    if (!bucket) return res.status(500).json({ error: 'MongoDB connection not established' });

    const formattedMetadata = await bucket.find().toArray();

    res.json(formattedMetadata.map((file) => ({
      filename: file.filename,
      length: file.length,
      uploadDate: file.uploadDate,
    })));
  } catch (error) {
    console.error('Error fetching files metadata:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/download/:filename', async (req, res) => {
  try {
    if (!bucket) return res.status(500).json({ error: 'MongoDB connection not established' });

    const filename = req.params.filename;
    const downloadStream = bucket.openDownloadStreamByName(filename);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    downloadStream.pipe(res);
  } catch (error) {
    console.error(`Error downloading file '${req.params.filename}':`, error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(5000, () => {
  console.log(`Server is running on port 5000`);
});
