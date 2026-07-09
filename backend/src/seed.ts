import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password123', 10);

  // 0. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@indranetra.com' },
    update: {
      role: Role.ADMIN,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
    create: {
      email: 'admin@indranetra.com',
      name: 'System Admin',
      passwordHash,
      role: Role.ADMIN,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
  });

  // 1. Create Organizer
  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@indranetra.com' },
    update: {
      role: Role.ORGANIZER,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
    create: {
      email: 'organizer@indranetra.com',
      name: 'Main Organizer',
      passwordHash,
      role: Role.ORGANIZER,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
  });

  await prisma.organizerProfile.upsert({
    where: { userId: organizerUser.id },
    update: {},
    create: {
      userId: organizerUser.id,
      organizationName: 'Indra Crowd Control Ltd',
      designation: 'Chief Operator',
      contactNumber: '+919876543210',
    },
  });

  // 2. Create Volunteer
  const volunteerUser = await prisma.user.upsert({
    where: { email: 'volunteer@indranetra.com' },
    update: {
      role: Role.VOLUNTEER,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
    create: {
      email: 'volunteer@indranetra.com',
      name: 'Rohan Sharma',
      passwordHash,
      role: Role.VOLUNTEER,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
  });

  await prisma.volunteer.upsert({
    where: { userId: volunteerUser.id },
    update: {
      status: 'AVAILABLE',
      latitude: 13.0827,
      longitude: 80.2707,
      assignedArea: 'Gate A Entry',
    },
    create: {
      userId: volunteerUser.id,
      status: 'AVAILABLE',
      latitude: 13.0827,
      longitude: 80.2707,
      assignedArea: 'Gate A Entry',
      phoneNumber: '+919876543211',
      skills: 'First Aid, Crowd Control',
      availability: 'Full-time',
    },
  });

  // 3. Create Public User
  const publicUser = await prisma.user.upsert({
    where: { email: 'public@indranetra.com' },
    update: {
      role: Role.PUBLIC,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
    create: {
      email: 'public@indranetra.com',
      name: 'Public Citizen',
      passwordHash,
      role: Role.PUBLIC,
      emailVerified: true,
      profileComplete: true,
      isApproved: true,
    },
  });

  await prisma.publicUserProfile.upsert({
    where: { userId: publicUser.id },
    update: {},
    create: {
      userId: publicUser.id,
      phoneNumber: '+919888877777',
      emergencyContact: '+919111122222',
    },
  });

  // 4. Create Active Event
  const activeEvent = await prisma.event.upsert({
    where: { id: 'indra-festival-event-id' },
    update: {
      name: 'Indra National Festival 2026',
      maxCapacity: 1200,
      thresholdLimit: 960,
      status: 'Live',
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
      createdBy: organizerUser.id,
    },
    create: {
      id: 'indra-festival-event-id',
      name: 'Indra National Festival 2026',
      eventType: 'FESTIVAL',
      description: 'Annual cultural festival with high crowd density monitoring.',
      location: 'Indra National Stadium, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      expectedCrowd: 800,
      maxCapacity: 1200,
      thresholdLimit: 960,
      status: 'Live',
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000),
      entryGates: 4,
      exitGates: 4,
      cameraCount: 3,
      volunteerCount: 40,
      createdBy: organizerUser.id,
    },
  });

  // 4b. Create Upcoming Event
  await prisma.event.upsert({
    where: { id: 'indra-upcoming-event-id' },
    update: {},
    create: {
      id: 'indra-upcoming-event-id',
      name: 'Tech Summit 2026',
      eventType: 'SUMMIT',
      description: 'Upcoming technology and developer conference.',
      location: 'Trade Center, Hall 3, Chennai',
      latitude: 13.0401,
      longitude: 80.2435,
      expectedCrowd: 500,
      maxCapacity: 750,
      thresholdLimit: 600,
      status: 'Upcoming',
      startTime: new Date(Date.now() + 2 * 86400000), // in 2 days
      endTime: new Date(Date.now() + 2.5 * 86400000),
      entryGates: 2,
      exitGates: 2,
      cameraCount: 2,
      volunteerCount: 15,
      createdBy: organizerUser.id,
    },
  });

  // 5. Create Cameras
  await prisma.camera.upsert({
    where: { id: 'cam-1' },
    update: {
      rtspUrl: 'webcam',
    },
    create: {
      id: 'cam-1',
      name: 'North Entry Gate A',
      location: 'Gate A',
      rtspUrl: 'webcam',
      eventId: activeEvent.id,
    },
  });

  await prisma.camera.upsert({
    where: { id: 'cam-2' },
    update: {},
    create: {
      id: 'cam-2',
      name: 'South Exit Gate B',
      location: 'Gate B',
      rtspUrl: 'rtsp://mock-stream.local/gate-b',
      eventId: activeEvent.id,
    },
  });

  await prisma.camera.upsert({
    where: { id: 'cam-3' },
    update: {},
    create: {
      id: 'cam-3',
      name: 'Concourse Main Hall',
      location: 'Main Hall',
      rtspUrl: 'rtsp://mock-stream.local/hallway',
      eventId: activeEvent.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
