import { PrismaClient, UserRole, TenantStatus, FacilityStatus, CourtStatus, SportType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super Admin user (Santiago)
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sportsbook.com' },
    update: {},
    create: {
      email: 'admin@sportsbook.com',
      passwordHash: superAdminPassword,
      fullName: 'Santiago Admin',
      phone: '+54 9 11 1234-5678',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`Created Super Admin: ${superAdmin.email}`);

  // Create a sample tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cancha-los-amigos' },
    update: {},
    create: {
      businessName: 'Cancha Los Amigos SRL',
      slug: 'cancha-los-amigos',
      status: TenantStatus.ACTIVE,
    },
  });
  console.log(`Created Tenant: ${tenant.businessName}`);

  // Create facility owner for the tenant
  const ownerPassword = await bcrypt.hash('Owner123!', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@canchasamigos.com' },
    update: {},
    create: {
      email: 'owner@canchasamigos.com',
      passwordHash: ownerPassword,
      fullName: 'Juan Perez',
      phone: '+54 9 11 9876-5432',
      role: UserRole.OWNER,
      tenantId: tenant.id,
      isActive: true,
    },
  });
  console.log(`Created Owner: ${owner.email}`);

  // Create a facility
  const facility = await prisma.facility.upsert({
    where: { id: 'facility-los-amigos' },
    update: {},
    create: {
      id: 'facility-los-amigos',
      tenantId: tenant.id,
      name: 'Cancha Los Amigos',
      address: 'Av. Rivadavia 1234',
      city: 'Buenos Aires',
      country: 'Argentina',
      phone: '+54 11 4567-8901',
      email: 'info@canchasamigos.com',
      timezone: 'America/Argentina/Buenos_Aires',
      currencyCode: 'ARS',
      depositPercentage: 50,
      cancellationHours: 24,
      minBookingNoticeHours: 2,
      maxBookingAdvanceDays: 30,
      bufferMinutes: 15,
      status: FacilityStatus.ACTIVE,
    },
  });
  console.log(`Created Facility: ${facility.name}`);

  // Create courts/fields
  const courts = await Promise.all([
    prisma.court.upsert({
      where: { id: 'court-1' },
      update: {},
      create: {
        id: 'court-1',
        tenantId: tenant.id,
        facilityId: facility.id,
        name: 'Cancha 1',
        sportType: SportType.SOCCER,
        description: 'Pasto sintético, techada',
        surfaceType: 'synthetic',
        isIndoor: true,
        basePricePerHour: 15000.00,
        status: CourtStatus.ACTIVE,
        displayOrder: 1,
      },
    }),
    prisma.court.upsert({
      where: { id: 'court-2' },
      update: {},
      create: {
        id: 'court-2',
        tenantId: tenant.id,
        facilityId: facility.id,
        name: 'Cancha 2',
        sportType: SportType.SOCCER,
        description: 'Pasto sintético, al aire libre',
        surfaceType: 'synthetic',
        isIndoor: false,
        basePricePerHour: 12000.00,
        status: CourtStatus.ACTIVE,
        displayOrder: 2,
      },
    }),
    prisma.court.upsert({
      where: { id: 'court-3' },
      update: {},
      create: {
        id: 'court-3',
        tenantId: tenant.id,
        facilityId: facility.id,
        name: 'Cancha 3',
        sportType: SportType.PADEL,
        description: 'Cancha de pádel profesional',
        surfaceType: 'synthetic',
        isIndoor: true,
        basePricePerHour: 18000.00,
        status: CourtStatus.ACTIVE,
        displayOrder: 3,
      },
    }),
  ]);
  console.log(`Created ${courts.length} courts`);

  // Create a staff member
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@canchasamigos.com' },
    update: {},
    create: {
      email: 'staff@canchasamigos.com',
      passwordHash: staffPassword,
      fullName: 'Maria Garcia',
      phone: '+54 9 11 5555-1234',
      role: UserRole.STAFF,
      tenantId: tenant.id,
      isActive: true,
    },
  });
  console.log(`Created Staff: ${staff.email}`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
