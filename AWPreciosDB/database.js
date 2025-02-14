const mysql = require('mysql2/promise');

class AWPriceService {
  constructor() {
    this.pool = mysql.createPool({
      host: '192.168.1.30',
      user: 'configurador',
      password: 'Zycu26928340',
      database: 'pricelist',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  /**
   * Obtiene los registros de la tabla "prices" según el modelo, tarifa y serie especificados.
   *
   * @param {string} modelo - El modelo del producto.
   * @param {string} [tarifa='1'] - La tarifa (por defecto '1').
   * @param {string} serie - La serie.
   * @returns {Promise<Array<Object>>} - Los registros obtenidos.
   * @throws {Error} - Si ocurre algún problema durante la consulta.
   */
  async fetchPrice(modelo, tarifa = '1', serie) {
    let tipo = '';
    if (serie.startsWith('S')) {
      const parts = serie.split('_');
      if (parts.length === 2) {
        serie = parts[0].substring(1);
        tipo = parts[1];
      }
    }

    console.log('modelo:', modelo);
    console.log('tarifa:', tarifa);
    console.log('serie:', serie);
    console.log('tipo:', tipo);

    const query = `
   SELECT modelo, serie, SUM(precio) AS precio
FROM (
      SELECT modelo, ' ' AS tipo, serie, precio, anyo 
      FROM prices
      WHERE modelo = ? AND tarifa = ? AND SERIE = ? AND anyo = '2025'
      UNION 
      SELECT modelo, tipo, serie, precio, anyo 
      FROM incrementos
      WHERE modelo = ? AND tarifa = ? AND SERIE = ? AND anyo = '2025' AND TIPO = ?
      ) AS combined;
    `;

    try {
      const [rows] = await this.pool.execute(query, [
        modelo, tarifa, tipo.length > 0  ? 'Z' : serie,   // Parameters for the first SELECT
        modelo, tarifa, serie, tipo  // Parameters for the second SELECT
      ]);
      return rows;
    } catch (error) {
      console.error('Error al obtener el precio del servicio:', error.message);
      throw new Error(`Error en fetchPrice: ${error.message}`);
    }
  }
}

module.exports = { AWPriceService };
