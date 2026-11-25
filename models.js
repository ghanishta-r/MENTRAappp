import mongoose from 'mongoose';

const { Schema } = mongoose;
const ref = (model, required = true) => ({ type: Schema.Types.ObjectId, ref: model, required });

// Authentication identity is kept separate from role-specific public profile data.
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['mentee', 'mentor', 'admin'], required: true },
  avatar: { type: String, trim: true, maxlength: 500, default: '' },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null }
}, { timestamps: true });
userSchema.index({ role: 1, isActive: 1 });
export const User = mongoose.model('User', userSchema);

const mentorProfileSchema = new Schema({
  user: { ...ref('User'), unique: true },
  headline: { type: String, trim: true, maxlength: 150, default: '' },
  bio: { type: String, trim: true, maxlength: 1200, default: '' },
  department: { type: String, trim: true, maxlength: 100, default: '' },
  organization: { type: String, trim: true, maxlength: 120, default: '' },
  yearsExperience: { type: Number, min: 0, max: 80, default: 0 },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  expertise: [{ type: String, trim: true, maxlength: 60 }],
  interests: [{ type: String, trim: true, maxlength: 60 }],
  availability: [{ day: { type: String, trim: true, maxlength: 16 }, start: { type: String, trim: true, maxlength: 8 }, end: { type: String, trim: true, maxlength: 8 } }],
  availabilityNotes: [{ type: String, trim: true, maxlength: 40 }],
  maxMentees: { type: Number, min: 1, max: 100, default: 5 },
  isAcceptingMentees: { type: Boolean, default: true },
  ratingAvg: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 }
}, { timestamps: true });
mentorProfileSchema.index({ department: 1, isAcceptingMentees: 1 });
export const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);

const menteeProfileSchema = new Schema({
  user: { ...ref('User'), unique: true },
  college: { type: String, trim: true, maxlength: 120, default: '' },
  department: { type: String, trim: true, maxlength: 100, default: '' },
  year: { type: String, trim: true, maxlength: 40, default: '' },
  bio: { type: String, trim: true, maxlength: 1200, default: '' },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  interests: [{ type: String, trim: true, maxlength: 60 }],
  learningGoals: { type: String, trim: true, maxlength: 1200, default: '' }
}, { timestamps: true });
menteeProfileSchema.index({ department: 1 });
export const MenteeProfile = mongoose.model('MenteeProfile', menteeProfileSchema);

const requestSchema = new Schema({
  mentee: ref('User'), mentor: ref('User'),
  message: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
  matchScore: { type: Number, min: 0, max: 100, default: null },
  respondedAt: { type: Date, default: null }
}, { timestamps: true });
requestSchema.index({ mentee: 1, mentor: 1 }, { unique: true });
requestSchema.index({ mentor: 1, status: 1, createdAt: -1 });
export const MentorshipRequest = mongoose.model('MentorshipRequest', requestSchema);

const connectionSchema = new Schema({
  mentee: ref('User'), mentor: ref('User'), request: { ...ref('MentorshipRequest'), unique: true },
  status: { type: String, enum: ['active', 'completed', 'ended'], default: 'active' },
  startedAt: { type: Date, default: Date.now }, endedAt: { type: Date, default: null }
}, { timestamps: true });
connectionSchema.index({ mentee: 1, status: 1 });
connectionSchema.index({ mentor: 1, status: 1 });
export const MentorshipConnection = mongoose.model('MentorshipConnection', connectionSchema);

const sessionSchema = new Schema({
  connection: ref('MentorshipConnection'), mentor: ref('User'), mentee: ref('User'),
  title: { type: String, required: true, trim: true, maxlength: 120 },
  agenda: { type: String, trim: true, maxlength: 1000, default: '' },
  notes: { type: String, trim: true, maxlength: 2000, default: '' },
  scheduledAt: { type: Date, required: true, alias: 'startsAt' },
  durationMin: { type: Number, min: 15, max: 240, default: 45 },
  mode: { type: String, enum: ['online', 'in-person'], default: 'online' },
  meetingLink: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });
sessionSchema.index({ mentee: 1, scheduledAt: 1 });
sessionSchema.index({ mentor: 1, scheduledAt: 1 });
sessionSchema.index({ connection: 1, scheduledAt: 1 });
export const Session = mongoose.model('Session', sessionSchema);

const goalSchema = new Schema({
  mentee: ref('User'),
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  category: { type: String, trim: true, maxlength: 40, default: 'Growth' },
  targetDate: { type: Date, default: null },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' }
}, { timestamps: true });
goalSchema.index({ mentee: 1, updatedAt: -1 });
export const Goal = mongoose.model('Goal', goalSchema);

const progressSchema = new Schema({
  goal: ref('Goal'), author: ref('User'),
  byRole: { type: String, enum: ['mentee', 'mentor'], required: true },
  percent: { type: Number, min: 0, max: 100, required: true },
  note: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });
progressSchema.index({ goal: 1, createdAt: -1 });
export const Progress = mongoose.model('Progress', progressSchema);

const resourceSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  url: { type: String, required: true, trim: true, maxlength: 500 },
  type: { type: String, enum: ['article', 'video', 'course', 'book', 'tool'], default: 'article' },
  tags: [{ type: String, trim: true, maxlength: 40 }],
  author: ref('User'), sharedWith: ref('User', false)
}, { timestamps: true });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ sharedWith: 1, createdAt: -1 });
export const Resource = mongoose.model('Resource', resourceSchema);

const feedbackSchema = new Schema({
  session: ref('Session'), connection: ref('MentorshipConnection'), from: ref('User'), to: ref('User'),
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });
feedbackSchema.index({ session: 1, from: 1 }, { unique: true });
feedbackSchema.index({ to: 1, createdAt: -1 });
export const Feedback = mongoose.model('Feedback', feedbackSchema);

const notificationSchema = new Schema({
  user: ref('User'),
  type: { type: String, enum: ['request', 'session', 'feedback', 'goal', 'system'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  message: { type: String, required: true, trim: true, maxlength: 400 },
  link: { type: String, trim: true, maxlength: 300, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);
