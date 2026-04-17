FROM node:18-alpine

WORKDIR /app

# Copiar solo package.json
COPY package.json ./

# Instalar dependencias (npm install, no npm ci)
RUN npm install

# Copiar todo el código
COPY . .

# Build
RUN npm run build

# Servir
FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=0 /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
