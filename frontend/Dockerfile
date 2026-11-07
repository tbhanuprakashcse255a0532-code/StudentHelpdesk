# Stage 1: Build React application
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Install frontend dependencies
COPY package*.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Use the existing website domain for API requests
ARG REACT_APP_API_BASE_URL=http://studenthelpdesk.test
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

# Build React application
RUN npm run build

# Stage 2: Serve frontend using Nginx
FROM nginx:stable-alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Preserve the existing frontend route
RUN mkdir -p /usr/share/nginx/html/StudentHelpdesk

COPY --from=build /app/build/ /usr/share/nginx/html/StudentHelpdesk/

EXPOSE 80