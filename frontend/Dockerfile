# Build React app
FROM node:22.11.0 as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine

# Copy built React files to Nginx HTML folder
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config (you'll create this file next)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
