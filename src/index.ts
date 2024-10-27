import { Client } from 'discord.js'
import { config } from './config'
import { commands } from './commands'
import { buttons } from './buttons'
import { deployCommands } from './deploy-commands'
import { connect } from 'mongoose'
import { createReminderQueues } from './utils/reminder'

export const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
})

client.once('ready', () => {
    console.log('OrangeCal is Ready! 🍊📅')
})

client.on('guildCreate', async (guild) => {
    await deployCommands({ guildId: guild.id })
})

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const { commandName } = interaction
            if (commands[commandName as keyof typeof commands]) {
                commands[commandName as keyof typeof commands].execute(
                    interaction
                )
            }
        } else if (interaction.isButton()) {
            const { customId } = interaction
            if (buttons[customId as keyof typeof buttons]) {
                buttons[customId as keyof typeof buttons].execute(interaction)
            }
        } else {
            console.log('Unknown interaction type: ', interaction)
        }
    } catch (error) {
        console.error('Error handling interaction: ', error)
    }
})

createReminderQueues(client)

client
    .login(config.discordToken)
    .then(async () => {
        try {
            await connect(config.mongoUri)
        } catch (error) {
            console.error('❌ Error connecting to MongoDB: ', error)
            process.exit(1)
        }
    })
    .catch((error) => {
        console.error('❌ Error logging in: ', error)
    })
