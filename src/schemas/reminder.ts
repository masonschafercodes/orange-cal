import { Schema, model } from 'mongoose'

const reminderSchema = new Schema<IReminder>({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    attendees: { type: [String], required: true },
    meetingChannelId: { type: String },
})

export const Reminder = model<IReminder>('Reminder', reminderSchema)
