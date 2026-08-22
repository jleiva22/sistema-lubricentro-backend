# 1. Imagen base oficial de Node.js (Alpine para menor tamaño)
FROM node:20-alpine

# 2. Definir el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar los archivos de dependencias primero (aprovecha la caché de Docker)
COPY package*.json ./

# 4. Instalar solo dependencias de producción (o 'npm install' si usas nodemon en dev)
RUN npm install

# 5. Copiar el resto del código de la aplicación
COPY . .

# 6. Exponer el puerto en el que corre tu servidor Express
EXPOSE 3000

# 7. Comando para iniciar la aplicación
CMD ["npm", "start"]