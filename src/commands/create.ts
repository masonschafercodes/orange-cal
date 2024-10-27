import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js'
import * as chrono from 'chrono-node/en'
import { Reminder } from '../schemas/reminder'
import { reminderUpdateQueue } from '..'

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

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply()

    const { id, username } = interaction.user
    const guildId = interaction.guildId
    const channelId = interaction.channelId
    const name = interaction.options.get('name')?.value as string
    const date = interaction.options.get('date')?.value as string
    const channel = interaction.options.get('channel')?.value as string

    const parsedDate = chrono.parseDate(date)

    if (!parsedDate) {
        await interaction.editReply('Invalid date format')
        return
    }

    const utcTime = parsedDate.getTime().toString().slice(0, -3)

    const embed = new EmbedBuilder()
        .setTitle(`New Reminder: ${name}`)
        .addFields([
            {
                name: 'Date',
                value: `<t:${utcTime}> (<t:${utcTime}:R>)`,
            },
            {
                name: 'Attendees (0)',
                value: `>>> -`,
                inline: true,
            },
        ])
        .setFooter({
            text: `Created by ${username}`,
        })
        .setColor('Orange')

    if (channel) {
        embed.addFields({
            name: 'Meeting In',
            value: `<#${channel}>`,
        })
    }

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('getReminder')
            .setEmoji('🍊')
            .setLabel('Get Reminder')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('editReminder')
            .setEmoji('⚙️')
            .setLabel('Edit Reminder')
            .setStyle(ButtonStyle.Secondary)
    )

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
