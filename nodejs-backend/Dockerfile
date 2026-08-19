FROM node:22-alpine

WORKDIR /app

# Install production dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

# Create uploads directory (persists via volume mount)
RUN mkdir -p uploads

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

CMD ["node", "src/server.js"]
