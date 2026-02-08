FROM node:25.2.0-slim

WORKDIR /app

RUN apt update && apt install -y \
    curl git ca-certificates python3 python3-pip make g++ \
    libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libx11-xcb1 libxext6 libxshmfence1 libasound2 libx11-6 libxcb1 \
    libgbm1 libpangocairo-1.0-0 libgtk-3-0 fonts-liberation xdg-utils

RUN npm install -g purescript spago@next

COPY testing/package* testing/spago* ./

RUN groupadd -r appuser && \
    useradd -r -m -g appuser -G audio,video appuser && \
    chown -R appuser:appuser /app

USER appuser

RUN npm ci

COPY script.user.js /
COPY testing .

CMD ["spago", "run", "-q"]
