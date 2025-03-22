# Frontend Dockerfile
FROM node:22.11.0

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json /app/
RUN npm install --loglevel error

# Expose application port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start-watch"]
