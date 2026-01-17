const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

app.post('/login', (req, res) => {
    // Mock login
    const token = jwt.sign({ user: 'test' }, 'secret');
    res.json({ token });
});

const PORT = 3004;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});
