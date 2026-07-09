import { connectDB } from "@/lib/mongodb";
import DailyUsage from "@/models/DailyUsage";
import { getTodayDateKey } from "@/utils/date";

export async function getDailyUsageCount(
  userId: string,
  usageDate = getTodayDateKey()
): Promise<number> {
  await connectDB();

  const record = await DailyUsage.findOne({ userId, usageDate });
  return record?.count ?? 0;
}

export async function incrementDailyUsage(
  userId: string,
  usageDate = getTodayDateKey()
): Promise<number> {
  await connectDB();

  const record = await DailyUsage.findOneAndUpdate(
    { userId, usageDate },
    {
      $inc: { count: 1 },
      $setOnInsert: { userId, usageDate },
    },
    { upsert: true, new: true }
  );

  return record?.count ?? 1;
}

export async function resetDailyUsageForToday(
  userId: string,
  usageDate = getTodayDateKey()
): Promise<void> {
  await connectDB();

  await DailyUsage.updateOne({ userId, usageDate }, { $set: { count: 0 } });
}
