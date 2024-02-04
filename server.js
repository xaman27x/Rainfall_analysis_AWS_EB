const express = require('express');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000 || 8080;

const sharedData = {
  currentUniqueId: null,
};

app.use(express.static('public'));

app.get('/run-python-script', (req, res) => {
  const { latitude, longitude } = req.query;
  const uniqueId = uuidv4();
  sharedData.currentUniqueId = uniqueId;
// Python script for MeteoStat API
  exec(`python3 api.py ${latitude} ${longitude} ${uniqueId}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (stderr) {
      console.error('stderr:', stderr);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.log('stdout:', stdout);
    res.json({ message: 'Script executed successfully' });
  });
});

app.get('/run-new-script', async (req, res) => {
  let array = [];
  const url = process.env.MONGODB_URI;
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to the database');
    const dbo = client.db('UserData');

    const query = { "id": sharedData.currentUniqueId };
    const document = await dbo.collection('Coefficients').find(query).toArray();

    if (document.length === 0) {
      console.error('Data not found in the database');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    console.log(document)
    const { tavg, wdir, wspd, pres } = req.query;
    const predicted_rainfall = tavg * document[0].coefficients[0] + wdir * document[0].coefficients[1] + wspd * document[0].coefficients[2] + pres * document[0].coefficients[3] + document[0].coefficients[4];
    
    console.log(predicted_rainfall);

    res.json({ predicted_rainfall });
    await dbo.collection('Coefficients').deleteOne(query);
  } catch (err) {
    console.error(`Error connecting to the database. ${err}`);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

