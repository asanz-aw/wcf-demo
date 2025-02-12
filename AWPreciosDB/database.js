const sql = require('mssql');

class SQLServerConnector {
    constructor() {
        this.config = {
            user: 'userapps',
            password: 'us3r4pps%',
            server: '192.168.1.39',
            database: 'apps',
            options: {
                encrypt: false, // Cambia a true si usas Azure
                trustServerCertificate: true
            }
        };
    }

    async getModelData(modelo) {
        try {
            await sql.connect(this.config);
            const query = `SELECT TOP (1) * FROM [apps].[dbo].[AW_datos_ES] WHERE Modelo = @modelo`;
            const request = new sql.Request();
            request.input('modelo', sql.VarChar, modelo);
            const result = await request.query(query);
            
            if (result.recordset.length === 0) {
                throw new Error('No se encontraron datos para el modelo especificado.');
            }

            // Convertir la fila en un array de objetos { columna: valor }
            const row = result.recordset[0];
            const formattedResult = Object.keys(row).map((key) => {
                const formattedKey = key.startsWith('_') ? key.replace(/^_/, '') : key;
                return { [formattedKey]: row[key] };
            });
            
            return formattedResult;
        } catch (error) {
            console.error('Error ejecutando la consulta:', error);
            throw error;
        } finally {
            await sql.close();
        }
    }
}

module.exports = SQLServerConnector;
