# Frontend Dockerfile
FROM node:22.11.0

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json /app/
RUN npm install --force --loglevel verbose
RUN npm install axios

# Copy project files
COPY . /app/

# Build the app
RUN npm run build

# Expose application port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
