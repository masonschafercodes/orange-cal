import { ButtonInteraction } from 'discord.js'
import { Reminder } from '../schemas/reminder'
import { userNotiQueue } from '..'
import { editReminderEmbed, reminderEmbedButtons } from '../utils/reminder'

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

    const member = interaction.guild?.members.cache.get(existingReminder.userId)
    const message = interaction.message
    const embed = await editReminderEmbed(existingReminder, member)

    const buttons = reminderEmbedButtons()

    await message.edit({
        embeds: [embed],
        components: [buttons],
    })
}
