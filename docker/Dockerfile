FROM node:20-alpine AS web-builder
WORKDIR /app/void-ai
COPY void-ai/package*.json ./
RUN npm ci --only=production
COPY void-ai/ ./
RUN npm run build

FROM python:3.11-alpine
WORKDIR /void-ai

# Install minimal dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy web build
COPY --from=web-builder /app/void-ai/.next/standalone ./
COPY --from=web-builder /app/void-ai/.next/static ./.next/static
COPY --from=web-builder /app/void-ai/public ./public

# Copy core
COPY src/ ./src/
COPY bin/ ./bin/
COPY models/ ./models/
COPY void.config ./

# Make binaries executable
RUN chmod +x bin/void-ai bin/void-code

ENV PORT=3000
ENV VOID_MODE=production
ENV VOID_RAM_LIMIT=2147483648

EXPOSE 3000

CMD ["python3", "src/api/server.py"]
