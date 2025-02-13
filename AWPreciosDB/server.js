const express = require('express');
const { AWPriceService } = require('./database');

const app = express();
const port = 13000;

const db = new AWPriceService();

// Deshabilitar CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Ruta que obtiene el precio basado en el modelo y serie
// Ejemplo de llamada: GET http://localhost:13000/precio/CZ19002?serie=ETOPTJ14
app.get('/precio/:modelo', async (req, res) => {
  try {
    const modelo = req.params.modelo;
    const serie = req.query.serie; // Se espera que la serie se envíe como query parameter
    if (!serie) {
      return res.status(400).json({ error: 'Se requiere el parámetro "serie" en la consulta.' });
    }
    // La tarifa se establece por defecto en '1'
    const data = await db.fetchPrice(modelo, '1', serie);
    res.json(data);
  } catch (error) {
    console.error('Error en la ruta /precio/:modelo:', error);
    res.status(500).json({ error: 'Error al obtener los datos.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
