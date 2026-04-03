import Cooldown from "../models/cooldown.js";

export const checkCooldown = async (user, group, command, time) => {
  const now = Date.now();

  const data = await Cooldown.findOne({ user, group, command });

  if (data && now < data.expiresAt) {
    const remaining = ((data.expiresAt - now) / 1000).toFixed(1);
    return { active: true, remaining };
  }

  await Cooldown.findOneAndUpdate(
    { user, group, command },
    { expiresAt: now + time },
    { upsert: true, new: true }
  );

  return { active: false };
};