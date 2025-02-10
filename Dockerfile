# Usa una imagen base oficial de Node.js
FROM node:20-alpine

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el package.json y el package-lock.json primero para aprovechar el cache de Docker
COPY package*.json ./

# Instala las dependencias
RUN npm install --include=dev

# Copia el resto de la aplicación al contenedor
COPY . .

# Expone el puerto en el que corre la aplicación
EXPOSE 10000

# Comando por defecto para iniciar la aplicación
CMD ["npm", "start"]
