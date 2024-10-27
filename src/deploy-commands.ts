import { REST, Routes } from 'discord.js'
import { config } from './config'
import { commands } from './commands'

const rest = new REST({ version: '10' }).setToken(config.discordToken)

type DeployCommandsProps = {
    guildId: string
}

export async function deregisterCommands({ guildId }: DeployCommandsProps) {
    try {
        console.log('Started deregistering application (/) commands.')

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, guildId),
            {
                body: [],
            }
        )

        await rest.put(Routes.applicationCommands(config.clientId), {
            body: [],
        })

        console.log('Successfully deregistered application (/) commands.')
    } catch (error) {
        console.error(error)
    }
}

export async function deployCommands({ guildId }: DeployCommandsProps) {
    const commandsData = Object.values(commands).map((command) => command.data)
    try {
        console.log('Started refreshing application (/) commands.')

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, guildId),
            {
                body: commandsData,
            }
        )

        console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
        console.error(error)
    }
}
