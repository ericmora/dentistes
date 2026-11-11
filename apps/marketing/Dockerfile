FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/marketing/package.json apps/marketing/package.json
COPY apps/cli/package.json apps/cli/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter "@dentistes/marketing..."
COPY . .
ARG VITE_API_URL=http://localhost:8080
ARG VITE_APP_URL=http://localhost:5175
ENV VITE_API_URL=$VITE_API_URL VITE_APP_URL=$VITE_APP_URL
RUN pnpm --filter @dentistes/sdk build && pnpm --filter @dentistes/marketing build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/marketing/dist /usr/share/nginx/html
EXPOSE 8080
