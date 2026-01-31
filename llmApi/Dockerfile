FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install packages on a temp folder (docker will cache this layer if package.json and bun.lock didn't change)
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

USER bun
EXPOSE 8000/tcp
ENTRYPOINT ["bun", "run", "src/index.ts"]