FROM buildkite/puppeteer:24.4.0

WORKDIR /app

ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY dist ./dist
COPY src/bfsg-map.json ./dist/bfsg-map.json

RUN npm install -g pa11y-ci@^4

ENTRYPOINT ["node", "/app/dist/cli.js"]
CMD ["--help"]
