FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY src ./src
COPY public ./public
# Fail the build if content corpus or PDFs ever land in the image
# (Railpack switch, COPY . ., a dropped .dockerignore, etc.).
RUN set -e; \
  for p in pack cards refs source ceiling; do \
    if [ -e "/app/$p" ]; then echo "LEAK: /$p must not ship in the image" >&2; exit 1; fi; \
  done; \
  if find /app -iname '*.pdf' -print | grep -q .; then \
    echo "LEAK: PDF in image" >&2; find /app -iname '*.pdf' >&2; exit 1; \
  fi
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
