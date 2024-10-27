import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { deployCommands, deregisterCommands } from '../deploy-commands'

export const data = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all commands for OrangeCal.')

export async function execute(interaction: CommandInteraction) {
    const guildId = interaction.guildId

    if (!guildId) {
        await interaction.reply('This command can only be used in a server.')
        return
    }

    await deregisterCommands({ guildId })
    await deployCommands({ guildId })

    await interaction.reply({
        content: 'All commands have been reloaded.',
        ephemeral: true,
    })
}
