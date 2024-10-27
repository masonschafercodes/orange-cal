import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
} from 'discord.js'

export async function editReminderEmbed(
    reminder: IEditReminderEmbedInput,
    member: GuildMember | undefined
) {
    const utcTime = reminder.date.getTime().toString().slice(0, -3)
    let attendeesString = reminder.attendees
        .slice(0, 10)
        .map((id) => `<@${id}>`)
        .join('\n')

    if (reminder.attendees.length > 10) {
        attendeesString += `\nand ${reminder.attendees.length - 10} more...`
    }

    if (reminder.attendees.length === 0) {
        attendeesString = '-'
    }

    const isOld = reminder.date.getTime() < Date.now()

    const embed = new EmbedBuilder()
        .setTitle(`New Reminder: ${reminder.name}`)
        .addFields([
            {
                name: 'Date',
                value: `<t:${utcTime}> (${isOld ? 'Already Started' : `<t:${utcTime}:R>`})`,
            },
            {
                name: `Attendees (${reminder.attendees.length})`,
                value: `>>> ${attendeesString}`,
                inline: true,
            },
        ])
        .setFooter({
            text: `Created by ${member?.user.username || 'Unknown'}`,
        })
        .setColor('Orange')

    if (reminder.meetingChannelId) {
        embed.addFields({
            name: 'Meeting In',
            value: `<#${reminder.meetingChannelId}>`,
        })
    }

    if (reminder.description) {
        embed.setDescription(reminder.description)
    }

    return embed
}

export function reminderEmbedButtons() {
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

    return buttons
}
