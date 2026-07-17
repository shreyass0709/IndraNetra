/**
 * Seeds the one account the system cannot bootstrap without: a single admin.
 *
 * Deliberately nothing else. The old seed created four users sharing the password
 * "Password123", two events and three cameras, which meant every install shipped
 * with known credentials and the app was never exercised against an empty database.
 * Everything else -- events, zones, gates, cameras -- is now created through the UI
 * by a real user, which is the only way to know those flows actually work.
 *
 * Usage:
 *   npx ts-node src/seed.ts
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npx ts-node src/seed.ts
 *
 * With no ADMIN_PASSWORD, a strong one is generated and printed once. It is not
 * stored anywhere in plaintext -- copy it before closing the terminal.
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@indranetra.local').toLowerCase();

/** 24 random bytes as base64url: satisfies the password policy and is not guessable. */
function generatePassword(): string {
  return randomBytes(24).toString('base64url') + '7a';
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin ${ADMIN_EMAIL} already exists. Nothing to do.`);
    console.log('To reset the password, use the "Forgot password" flow or re-run after a db reset.');
    return;
  }

  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: 'Administrator',
      passwordHash,
      role: Role.ADMIN,
      // The admin is trusted by construction: there is nobody else to verify or
      // approve them, and this address never receives a verification email.
      emailVerified: true,
      isApproved: true,
      profileComplete: true,
    },
  });

  const line = '='.repeat(64);
  console.log(`\n${line}`);
  console.log('  Admin account created');
  console.log(line);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${password}`);
  if (generated) {
    console.log('\n  This password was generated and is shown ONCE. Copy it now.');
    console.log('  Change it after your first sign-in.');
  }
  console.log(`${line}\n`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
