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
    const query = `
      SELECT *
      FROM prices
      WHERE modelo = ? AND tarifa = ? AND SERIE = ? and anyo = '2025'
    `;

    try {
      const [rows] = await this.pool.execute(query, [modelo, tarifa, serie]);
      return rows;
    } catch (error) {
      console.error('Error al obtener el precio del servicio:', error.message);
      throw new Error(`Error en fetchPrice: ${error.message}`);
    }
  }
}

module.exports = { AWPriceService };
