# TrialScale API — multi-stage. O api serve TAMBÉM o build estático do web
# (same-origin: o cookie httpOnly do refresh funciona sem SameSite=None).
# Build a partir da RAIZ do repo:  docker build -f apps/api/Dockerfile .

FROM node:24-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY apps/web apps/web
COPY specs/000-modelo-de-dados/schema.sql specs/000-modelo-de-dados/schema.sql
RUN npm run build -w apps/api && npm run build -w apps/web

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev -w apps/api && npm cache clean --force
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/web/dist apps/web/dist
COPY --from=build /repo/specs/000-modelo-de-dados/schema.sql specs/000-modelo-de-dados/schema.sql
ENV WEB_DIST=/app/apps/web/dist
ENV PORT=3333
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3333)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/server.js"]
