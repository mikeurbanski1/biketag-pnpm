Biketag! PNPM version

## Setup

-   Install MongoDB
-   Install nvm and the version in the nvm config
-   Install pnpm
-   `pnpm install`

### Setup Mongo config

```
cd apps/server
cp .env.example .env
```

Add Mongo config (add user / password to connection string) to `.env` - it will be git-ignored

## Build

`pnpm build-all` (this is really only necessary to generate the tsoa routes to help the typescript run correctly)

## Bootstrap

Create a few users, games, and tags in the DB

```
>> cd apps/server
>> pnpm bootstrap
```

## Run (dev mode only)

### Server:

```
cd apps/server
pnpm dev
```

Starts with `nodemon` to reload on the fly

### Client:

```
cd apps/client
pnpm dev
```

Will also reload on the fly.
