const express = require('express');
const SQLServerConnector = require('./database');

const app = express();
const port = 13000;
const db = new SQLServerConnector();

// Deshabilitar CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.get('/precio/:modelo', async (req, res) => {
    try {
        const modelo = req.params.modelo;
        const data = await db.getModelData(modelo);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
