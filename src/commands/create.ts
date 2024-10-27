import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import * as chrono from 'chrono-node/en'
import { Reminder } from '../schemas/reminder'
import {
    editReminderEmbed,
    reminderEmbedButtons,
    reminderUpdateQueue,
} from '../utils/reminder'

export const data = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new event')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('The name of the event')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('date')
            .setDescription(
                'The date of the event (ex. "tomorrow at 3pm, in 2 days at 5pm")'
            )
            .setRequired(true)
    )
    .addChannelOption((option) =>
        option
            .setName('channel')
            .setDescription('The channel you want everyone to meet in')
    )
    .addStringOption((option) =>
        option
            .setName('description')
            .setDescription('A description of the event')
    )

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply()

    const { id } = interaction.user
    const member = interaction.guild?.members.cache.get(interaction.user.id)

    if (!member) {
        await interaction.editReply('You are not in a guild')
        return
    }

    const guildId = interaction.guildId
    const channelId = interaction.channelId
    const name = interaction.options.get('name')?.value as string
    const date = interaction.options.get('date')?.value as string
    const channel = interaction.options.get('channel')?.value as string
    const description = interaction.options.get('description')?.value as string

    const parsedDate = chrono.parseDate(date)

    if (!parsedDate) {
        await interaction.editReply('Invalid date format')
        return
    }

    const embed = await editReminderEmbed(
        {
            attendees: [],
            date: parsedDate,
            name,
            description,
            meetingChannelId: channel || undefined,
        },
        member
    )

    const buttons = reminderEmbedButtons()

    try {
        const message = await interaction.editReply({
            embeds: [embed],
            components: [buttons],
        })

        await Reminder.create({
            attendees: [],
            date: parsedDate,
            guildId,
            name,
            userId: id,
            messageId: message.id,
            channelId,
            meetingChannelId: channel || undefined,
            description: description || undefined,
        })

        reminderUpdateQueue.add(
            {
                messageId: message.id,
            },
            {
                delay: parsedDate.getTime() - Date.now(),
            }
        )
    } catch (error) {
        console.error(error)
        await interaction.editReply(
            'An error occurred while creating the reminder'
        )
    }
}
