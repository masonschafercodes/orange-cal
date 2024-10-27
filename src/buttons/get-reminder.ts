import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { Reminder } from '../schemas/reminder'
import { userNotiQueue } from '..'

export async function execute(interaction: ButtonInteraction) {
    await interaction.deferReply({
        ephemeral: true,
        fetchReply: true,
    })

    const { id } = interaction.user
    const guildId = interaction.guildId
    const messageId = interaction.message.id
    const channelId = interaction.channel?.id

    if (!channelId) {
        await interaction.editReply('This reminder does not exist anymore')
        return
    }

    const existingReminder = await Reminder.findOne({
        messageId,
        guildId,
    })

    if (!existingReminder) {
        await interaction.editReply('This reminder does not exist anymore')
        return
    }

    const isExpired = existingReminder.date.getTime() < Date.now()

    if (isExpired) {
        await interaction.editReply('This reminder has already expired')
        return
    }

    const attendees = existingReminder.attendees

    if (attendees.includes(id)) {
        await interaction.editReply('You are already attending this reminder')
        return
    }

    attendees.push(id)

    await Reminder.updateOne(
        {
            messageId,
            guildId,
        },
        {
            attendees,
        }
    )

    userNotiQueue.add(
        {
            userId: id,
            reminderId: existingReminder.id,
        },
        {
            delay: existingReminder.date.getTime() - Date.now(),
        }
    )

    await interaction.editReply('You are now attending this reminder')

    const utcTime = existingReminder.date.getTime().toString().slice(0, -3)
    let attendeesString = attendees
        .slice(0, 10)
        .map((id) => `<@${id}>`)
        .join('\n')

    if (attendees.length > 10) {
        attendeesString += `\nand ${attendees.length - 10} more...`
    }

    const member = interaction.guild?.members.cache.get(existingReminder.userId)
    const message = interaction.message
    const embed = new EmbedBuilder()
        .setTitle(`New Reminder: ${existingReminder.name}`)
        .addFields([
            {
                name: 'Date',
                value: `<t:${utcTime}> (<t:${utcTime}:R>)`,
            },
            {
                name: `Attendees (${attendees.length})`,
                value: `>>> ${attendeesString}`,
                inline: true,
            },
        ])
        .setFooter({
            text: `Created by ${member?.user.username || 'Unknown'}`,
        })
        .setColor('Orange')

    if (existingReminder.meetingChannelId) {
        embed.addFields({
            name: 'Meeting In',
            value: `<#${existingReminder.meetingChannelId}>`,
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

    await message.edit({
        embeds: [embed],
        components: [buttons],
    })
}
