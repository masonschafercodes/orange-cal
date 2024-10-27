import dotenv from 'dotenv'
dotenv.config()

const { DISCORD_TOKEN, CLIENT_ID, MONGO_URI, REDIS_HOST, REDIS_PORT } =
    process.env

if (!DISCORD_TOKEN || !CLIENT_ID || !MONGO_URI || !REDIS_HOST || !REDIS_PORT) {
    throw new Error('Missing ENV variables')
}

export const config = {
    discordToken: DISCORD_TOKEN,
    clientId: CLIENT_ID,
    mongoUri: MONGO_URI,
    redisHost: REDIS_HOST,
    redisPort: parseInt(REDIS_PORT),
}
