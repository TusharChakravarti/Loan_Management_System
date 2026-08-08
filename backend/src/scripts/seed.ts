import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User, UserRole } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import mongoose from 'mongoose';

dotenv.config();

const SEED_USERS = [
  {
    fullName: 'System Administrator',
    email: 'admin@lms.local',
    password: 'Admin@12345',
    role: UserRole.ADMIN,
  },
  {
    fullName: 'Sales Executive',
    email: 'sales@lms.local',
    password: 'Sales@12345',
    role: UserRole.SALES,
  },
  {
    fullName: 'Sanction Officer',
    email: 'sanction@lms.local',
    password: 'Sanction@12345',
    role: UserRole.SANCTION,
  },
  {
    fullName: 'Disbursement Manager',
    email: 'disbursement@lms.local',
    password: 'Disburse@12345',
    role: UserRole.DISBURSEMENT,
  },
  {
    fullName: 'Collection Officer',
    email: 'collection@lms.local',
    password: 'Collection@12345',
    role: UserRole.COLLECTION,
  },
  {
    fullName: 'Jane Borrower',
    email: 'borrower@lms.local',
    password: 'Borrower@12345',
    role: UserRole.BORROWER,
  },
];

export const seedDatabase = async (): Promise<void> => {
  console.log('[Seed] Starting database seed process...');
  await connectDB();

  let createdCount = 0;
  let skippedCount = 0;

  for (const seedUser of SEED_USERS) {
    const existing = await User.findOne({ email: seedUser.email.toLowerCase() });
    if (existing) {
      console.log(`[Seed] User already exists: ${seedUser.email} (${seedUser.role}) - Skipped`);
      skippedCount++;
    } else {
      const passwordHash = await hashPassword(seedUser.password);
      await User.create({
        fullName: seedUser.fullName,
        email: seedUser.email.toLowerCase(),
        passwordHash,
        role: seedUser.role,
      });
      console.log(`[Seed] Successfully created user: ${seedUser.email} (${seedUser.role})`);
      createdCount++;
    }
  }

  console.log(`[Seed] Complete! Created: ${createdCount}, Skipped (Already existed): ${skippedCount}`);
  await mongoose.disconnect();
  console.log('[Seed] Disconnected from MongoDB');
};

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
