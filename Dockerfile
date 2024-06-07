# Utilisez une image de Node.js 18 LTS comme base
FROM node:18

# Définissez le répertoire de travail dans le conteneur
WORKDIR /app

# Copiez le package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Installez spécifiquement bcrypt pour garantir la compatibilité
#RUN npm install bcrypt@5.0.1

# Copiez le reste des fichiers de l'application
COPY . .

# Exposez le port sur lequel votre application fonctionne
EXPOSE 5000

# Commande pour démarrer votre application
CMD ["npm", "start"]
