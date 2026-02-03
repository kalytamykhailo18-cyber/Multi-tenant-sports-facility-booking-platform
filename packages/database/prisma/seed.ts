import { PrismaClient, UserRole, TenantStatus, FacilityStatus, CourtStatus, SportType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Common password for all test users
  const defaultPassword = await bcrypt.hash('password123!', 10);

  // ===========================================
  // Super Admin (Platform Owner)
  // ===========================================
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sportsbook.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'admin@sportsbook.com',
      passwordHash: defaultPassword,
      fullName: 'Santiago Admin',
      phone: '+54 9 11 1234-5678',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`Created Super Admin: ${superAdmin.email}`);

  // ===========================================
  // Punto Gol - Client's Facility (Monte Grande)
  // ===========================================
  const tenantPuntoGol = await prisma.tenant.upsert({
    where: { slug: 'punto-gol' },
    update: {},
    create: {
      businessName: 'Punto Gol',
      slug: 'punto-gol',
      status: TenantStatus.ACTIVE,
    },
  });
  console.log(`Created Tenant: ${tenantPuntoGol.businessName}`);

  // Facility owner
  const ownerPuntoGol = await prisma.user.upsert({
    where: { email: 'owner@puntogol.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'owner@puntogol.com',
      passwordHash: defaultPassword,
      fullName: 'Owner Punto Gol',
      phone: '+54 11 2499 4196',
      role: UserRole.OWNER,
      tenantId: tenantPuntoGol.id,
      isActive: true,
    },
  });
  console.log(`Created Owner: ${ownerPuntoGol.email}`);

  // Facility
  const facilityPuntoGol = await prisma.facility.upsert({
    where: { id: 'facility-punto-gol' },
    update: {
      name: 'Punto Gol',
      address: 'Avenida Fair 1360',
      city: 'Monte Grande',
      phone: '+54 11 2499 4196',
      depositPercentage: 100, // 10,000 ARS deposit (will be set per booking)
      cancellationHours: 3,   // 3 hours before
    },
    create: {
      id: 'facility-punto-gol',
      tenantId: tenantPuntoGol.id,
      name: 'Punto Gol',
      address: 'Avenida Fair 1360',
      city: 'Monte Grande',
      country: 'Argentina',
      phone: '+54 11 2499 4196',
      email: 'info@puntogol.com',
      timezone: 'America/Argentina/Buenos_Aires',
      currencyCode: 'ARS',
      depositPercentage: 100, // Full deposit required (10,000 ARS)
      cancellationHours: 3,   // 3 hours cancellation policy
      minBookingNoticeHours: 1,
      maxBookingAdvanceDays: 30,
      bufferMinutes: 0,
      status: FacilityStatus.ACTIVE,
    },
  });
  console.log(`Created Facility: ${facilityPuntoGol.name}`);

  // Courts - 2 five-a-side artificial turf courts
  const courtsPuntoGol = await Promise.all([
    prisma.court.upsert({
      where: { id: 'puntogol-court-1' },
      update: {},
      create: {
        id: 'puntogol-court-1',
        tenantId: tenantPuntoGol.id,
        facilityId: facilityPuntoGol.id,
        name: 'Cancha 1',
        sportType: SportType.SOCCER,
        description: 'Futbol 5, pasto sintetico',
        surfaceType: 'synthetic',
        isIndoor: false,
        basePricePerHour: 10000.00, // 10,000 ARS per hour
        status: CourtStatus.ACTIVE,
        displayOrder: 1,
      },
    }),
    prisma.court.upsert({
      where: { id: 'puntogol-court-2' },
      update: {},
      create: {
        id: 'puntogol-court-2',
        tenantId: tenantPuntoGol.id,
        facilityId: facilityPuntoGol.id,
        name: 'Cancha 2',
        sportType: SportType.SOCCER,
        description: 'Futbol 5, pasto sintetico',
        surfaceType: 'synthetic',
        isIndoor: false,
        basePricePerHour: 10000.00, // 10,000 ARS per hour
        status: CourtStatus.ACTIVE,
        displayOrder: 2,
      },
    }),
  ]);
  console.log(`Created ${courtsPuntoGol.length} courts for Punto Gol`);

  // Operating hours: Monday to Sunday, 12:00 PM to 2:00 AM
  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  for (let day = 0; day <= 6; day++) {
    await prisma.operatingHours.upsert({
      where: {
        facilityId_dayOfWeek: {
          facilityId: facilityPuntoGol.id,
          dayOfWeek: day,
        },
      },
      update: {
        openTime: '12:00',
        closeTime: '02:00', // 2 AM next day
        isClosed: false,
        sessionDurationMinutes: 60, // 60, 90, or 120 min sessions
      },
      create: {
        tenantId: tenantPuntoGol.id,
        facilityId: facilityPuntoGol.id,
        dayOfWeek: day,
        openTime: '12:00',
        closeTime: '02:00', // 2 AM next day
        isClosed: false,
        sessionDurationMinutes: 60, // 60, 90, or 120 min sessions
      },
    });
  }
  console.log('Created operating hours for Punto Gol (12:00 PM - 2:00 AM daily)');

  // Staff member for Punto Gol
  const staffPuntoGol = await prisma.user.upsert({
    where: { email: 'staff@puntogol.com' },
    update: { passwordHash: defaultPassword },
    create: {
      email: 'staff@puntogol.com',
      passwordHash: defaultPassword,
      fullName: 'Staff Punto Gol',
      phone: '+54 11 0000-0000',
      role: UserRole.STAFF,
      tenantId: tenantPuntoGol.id,
      isActive: true,
    },
  });
  console.log(`Created Staff: ${staffPuntoGol.email}`);

  console.log('\n===========================================');
  console.log('Seeding completed!');
  console.log('===========================================');
  console.log('\nTest Credentials (password: password123!):');
  console.log('  Super Admin: admin@sportsbook.com');
  console.log('  Owner:       owner@puntogol.com');
  console.log('  Staff:       staff@puntogol.com');
  console.log('===========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
