const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Swiftly API is running' });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`API service running on port ${PORT}`);
});
