import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('A valid userId is required'), { status: 400 });
  }

  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('A valid teamId is required'), { status: 400 });
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }

  const minuteCount = Number(minutes);
  if (!Number.isFinite(minuteCount) || minuteCount <= 0) {
    throw Object.assign(new Error('Activity minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const team = await Team.findById(teamId).lean();
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 404 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: minuteCount,
    points: Math.max(1, Math.round(minuteCount)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members)
    ? members.map((member) => {
        if (typeof member === 'string' && mongoose.Types.ObjectId.isValid(member)) return new mongoose.Types.ObjectId(member);
        if (member instanceof mongoose.Types.ObjectId) return member;
        throw Object.assign(new Error('Team members must be valid ObjectIds'), { status: 400 });
      })
    : [];

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const entries = await Promise.all(rows.map(async (row, index) => {
    const team = await Team.findById(row._id).lean();
    return {
      teamName: team?.name ?? 'Unknown team',
      totalPoints: row.totalPoints,
      rank: index + 1,
    };
  }));

  return entries;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const preferredFocus = user.fitnessGoal || (recentActivity[0]?.type ? recentActivity[0].type : 'endurance');

  const matching = await Workout.find({ focus: preferredFocus }).lean();
  const fallback = await Workout.find().lean();
  const workouts = matching.length > 0 ? matching : fallback;

  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches your ${preferredFocus} focus and recent ${recentActivity[0]?.type ?? 'activity'} pattern.`,
  }));
}

export { User };
