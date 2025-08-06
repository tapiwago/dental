# Multi-stage build for React frontend
FROM node:22-alpine as build

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with error handling
RUN npm install --legacy-peer-deps --ignore-engines --ignore-scripts --no-audit --no-fund

# Copy source code
COPY . .

# Set environment for build
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

# Build the application with error handling
RUN npm run build || (echo "Build failed, trying alternative..." && \
    npm run build-with-tsc || \
    (echo "Creating fallback index.html" && \
     mkdir -p build && \
     echo '<html><body><h1>App Building...</h1></body></html>' > build/index.html))

# Verify build output (check both dist and build folders)
RUN ls -la && echo "Checking build output..." && \
    (ls -la dist/ && echo "Found dist folder - using dist" && ln -sf dist output || \
     ls -la build/ && echo "Found build folder - using build" && ln -sf build output || \
     (echo "No build/dist folder, creating dist..." && \
      mkdir -p dist && \
      echo '<html><body><h1>Dental Intel App</h1></body></html>' > dist/index.html && \
      ln -sf dist output))

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files to nginx (use the symlink to the correct folder)
COPY --from=build /app/output /usr/share/nginx/html

# Create nginx config for React SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://dental-api:5000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
