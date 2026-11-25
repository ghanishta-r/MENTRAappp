import 'dotenv/config';
import mongoose from 'mongoose';
import { Feedback, Goal, MentorshipConnection, MentorshipRequest, MentorProfile, MenteeProfile, Progress, Session, User } from './models.js';

// One-time, idempotent migration from the first MENTRA schema to the Milestone 2 model.
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentra');
const legacyUsers = await User.collection.find({}).toArray();
for (const user of legacyUsers) {
  if (user.role === 'mentor') await MentorProfile.updateOne({ user: user._id }, { $setOnInsert: {
    user: user._id, organization: user.university || '', department: user.field || '', headline: user.headline || '', bio: user.bio || '',
    skills: user.skills || [], expertise: user.skills || [], interests: user.interests || [], availabilityNotes: user.availability || [],
    isAcceptingMentees: true
  } }, { upsert: true });
  if (user.role === 'mentee') await MenteeProfile.updateOne({ user: user._id }, { $setOnInsert: {
    user: user._id, college: user.university || '', department: user.field || '', year: user.year || '', bio: user.bio || '',
    skills: user.skills || [], interests: user.interests || [], learningGoals: (user.goals || []).join(', ')
  } }, { upsert: true });
}

const legacyRequests = await MentorshipRequest.collection.find({}).toArray();
for (const request of legacyRequests) {
  if (request.note && !request.message) await MentorshipRequest.collection.updateOne({ _id: request._id }, { $set: { message: request.note } });
  if (request.status === 'accepted') await MentorshipConnection.updateOne({ request: request._id }, { $setOnInsert: {
    request: request._id, mentee: request.mentee, mentor: request.mentor, status: 'active', startedAt: request.updatedAt || new Date()
  } }, { upsert: true });
}

const legacySessions = await Session.collection.find({}).toArray();
for (const session of legacySessions) {
  const connection = await MentorshipConnection.findOne({ mentee: session.mentee, mentor: session.mentor }).lean();
  if (!connection) continue;
  await Session.collection.updateOne({ _id: session._id }, { $set: {
    connection: connection._id, scheduledAt: session.scheduledAt || session.startsAt,
    durationMin: session.durationMin || 45, mode: session.mode || 'online', agenda: session.agenda || ''
  } });
}

const legacyGoals = await Goal.collection.find({}).toArray();
for (const goal of legacyGoals) {
  const mentee = goal.mentee || goal.owner;
  const status = goal.status || (goal.completed || goal.progress === 100 ? 'completed' : goal.progress ? 'in-progress' : 'not-started');
  await Goal.collection.updateOne({ _id: goal._id }, { $set: { mentee, status, targetDate: goal.targetDate || goal.dueDate || null } });
  const hasHistory = await Progress.exists({ goal: goal._id });
  if (!hasHistory && mentee) await Progress.create({ goal: goal._id, author: mentee, byRole: 'mentee', percent: goal.progress || 0, note: 'Migrated from the previous MENTRA profile.' });
}

const legacyFeedback = await Feedback.collection.find({}).toArray();
for (const item of legacyFeedback) {
  if (item.session && item.from && item.to) continue;
  const from = item.from || item.author; const to = item.to || item.mentor;
  if (!from || !to) continue;
  const session = await Session.findOne({ mentee: from, mentor: to, status: 'completed' }).sort({ scheduledAt: -1 }).lean();
  if (!session) continue;
  await Feedback.collection.updateOne({ _id: item._id }, { $set: {
    session: session._id, connection: session.connection, from, to,
    comment: item.comment || item.note || ''
  } });
}

console.log(`Milestone 2 migration complete for ${legacyUsers.length} existing user(s).`);
await mongoose.disconnect();
