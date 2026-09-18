import { PrismaClient, Role, AppointmentStatus, ServiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning existing data ---');
  await prisma.payment.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.service.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Seeding Users ---');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      name: 'Service Advisor John',
      email: 'staff@example.com',
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: 'Technician Sarah',
      email: 'sarah@example.com',
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  console.log('Users created:', admin.email, staff1.email, staff2.email);

  console.log('--- Seeding Customers ---');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Kasun Perera',
      phone: '0771234567',
      email: 'kasun@gmail.com',
      address: '124 Galle Road, Colombo 03',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Amara Silva',
      phone: '0719876543',
      email: 'amara.silva@yahoo.com',
      address: '45 Kandy Road, Kiribathgoda',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Nimal Fernando',
      phone: '0754321098',
      email: 'nimal.f@outlook.com',
      address: '78 Negombo Road, Wattala',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Dilshan Jayasinghe',
      phone: '0768901234',
      email: 'dilshan.j@gmail.com',
      address: '12 Flower Road, Colombo 07',
    },
  });

  console.log('--- Seeding Vehicles ---');
  const v1 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'CAB-4521',
      brand: 'Toyota',
      model: 'Prius',
      vehicleType: 'Car',
      year: 2018,
      engineNumber: 'ENG-883921',
      customerId: customer1.id,
    },
  });

  const v2 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'CAD-7890',
      brand: 'Honda',
      model: 'Vezel',
      vehicleType: 'SUV',
      year: 2019,
      engineNumber: 'ENG-992310',
      customerId: customer1.id,
    },
  });

  const v3 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'BAP-1234',
      brand: 'Suzuki',
      model: 'Wagon R',
      vehicleType: 'Car',
      year: 2017,
      engineNumber: 'ENG-443120',
      customerId: customer2.id,
    },
  });

  const v4 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'KY-8910',
      brand: 'Nissan',
      model: 'Caravan',
      vehicleType: 'Van',
      year: 2016,
      engineNumber: 'ENG-556102',
      customerId: customer3.id,
    },
  });

  const v5 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'CAL-6721',
      brand: 'Hyundai',
      model: 'Tucson',
      vehicleType: 'SUV',
      year: 2021,
      engineNumber: 'ENG-772914',
      customerId: customer4.id,
    },
  });

  console.log('--- Seeding Appointments ---');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const appt1 = await prisma.appointment.create({
    data: {
      customerId: customer1.id,
      vehicleId: v1.id,
      date: today,
      time: '09:30 AM',
      serviceType: 'Full Service',
      notes: 'Customer requested comprehensive inspection before a long journey.',
      status: AppointmentStatus.IN_PROGRESS,
    },
  });

  await prisma.appointment.create({
    data: {
      customerId: customer2.id,
      vehicleId: v3.id,
      date: today,
      time: '11:00 AM',
      serviceType: 'Oil Change',
      notes: 'Periodic 5,000 km synthetic engine oil change.',
      status: AppointmentStatus.CONFIRMED,
    },
  });

  await prisma.appointment.create({
    data: {
      customerId: customer3.id,
      vehicleId: v4.id,
      date: tomorrow,
      time: '02:00 PM',
      serviceType: 'Brake Service',
      notes: 'Customer reported squeaking noise from front disc brakes.',
      status: AppointmentStatus.PENDING,
    },
  });

  const appt4 = await prisma.appointment.create({
    data: {
      customerId: customer4.id,
      vehicleId: v5.id,
      date: yesterday,
      time: '10:00 AM',
      serviceType: 'General Repair',
      notes: 'Suspension clunking sound over uneven roads.',
      status: AppointmentStatus.COMPLETED,
    },
  });

  console.log('--- Seeding Services & Items ---');
  // Service 1: Current In Progress for v1
  const s1 = await prisma.service.create({
    data: {
      appointmentId: appt1.id,
      vehicleId: v1.id,
      serviceType: 'Full Service',
      customerComplaint: 'Periodic service check and slight vibration on idle',
      workPerformed: 'Replaced spark plugs, cleaned throttle body, oil flush',
      partsUsed: 'Mobil 1 0W-20 (4L), Genuine Oil Filter, NGK Iridium Plugs',
      labourCost: 8000,
      partsCost: 17000,
      totalCost: 25000,
      serviceDate: today,
      status: ServiceStatus.IN_PROGRESS,
      serviceItems: {
        create: [
          { itemName: 'Mobil 1 0W-20 (4L)', itemType: 'PART', quantity: 1, unitPrice: 12000, totalPrice: 12000 },
          { itemName: 'Toyota Oil Filter', itemType: 'PART', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
          { itemName: 'Air Filter Element', itemType: 'PART', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
          { itemName: 'Full Inspection & System Scan', itemType: 'LABOUR', quantity: 1, unitPrice: 8000, totalPrice: 8000 },
        ],
      },
      payment: {
        create: {
          amount: 25000,
          paymentDate: today,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.PENDING,
          notes: 'To be settled upon vehicle collection',
        },
      },
    },
  });

  // Service 2: Completed yesterday for v5
  await prisma.service.create({
    data: {
      appointmentId: appt4.id,
      vehicleId: v5.id,
      serviceType: 'General Repair',
      customerComplaint: 'Suspension clunking noise on front passenger side',
      workPerformed: 'Replaced front stabilizer link rods and performed wheel alignment',
      partsUsed: 'OEM Stabilizer Links (Pair), Bushing Kit',
      labourCost: 7500,
      partsCost: 14500,
      totalCost: 22000,
      serviceDate: yesterday,
      status: ServiceStatus.COMPLETED,
      serviceItems: {
        create: [
          { itemName: 'Front Stabilizer Link Pair', itemType: 'PART', quantity: 1, unitPrice: 11000, totalPrice: 11000 },
          { itemName: 'Suspension Bushing Kit', itemType: 'PART', quantity: 1, unitPrice: 3500, totalPrice: 3500 },
          { itemName: 'Suspension Replacement Labour', itemType: 'LABOUR', quantity: 1, unitPrice: 5000, totalPrice: 5000 },
          { itemName: '4-Wheel Computer Alignment', itemType: 'LABOUR', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
        ],
      },
      payment: {
        create: {
          amount: 22000,
          paymentDate: yesterday,
          paymentMethod: PaymentMethod.CARD,
          paymentStatus: PaymentStatus.PAID,
          notes: 'Paid with Visa card ending in 4102',
        },
      },
    },
  });

  // Service 3: History for v3 (BAP-1234) - 2 months ago
  const date2MonthsAgo = new Date();
  date2MonthsAgo.setMonth(date2MonthsAgo.getMonth() - 2);

  await prisma.service.create({
    data: {
      vehicleId: v3.id,
      serviceType: 'Oil Change',
      customerComplaint: 'Routine 40,000km oil service',
      workPerformed: 'Engine oil and filter replaced, tyre pressures checked',
      partsUsed: 'Castrol Magnatec 5W-30 (3L), Suzuki Oil Filter',
      labourCost: 2500,
      partsCost: 6000,
      totalCost: 8500,
      serviceDate: date2MonthsAgo,
      status: ServiceStatus.COMPLETED,
      serviceItems: {
        create: [
          { itemName: 'Castrol Magnatec 5W-30 (3L)', itemType: 'PART', quantity: 1, unitPrice: 4800, totalPrice: 4800 },
          { itemName: 'Suzuki Genuine Oil Filter', itemType: 'PART', quantity: 1, unitPrice: 1200, totalPrice: 1200 },
          { itemName: 'Lube Service Labour', itemType: 'LABOUR', quantity: 1, unitPrice: 2500, totalPrice: 2500 },
        ],
      },
      payment: {
        create: {
          amount: 8500,
          paymentDate: date2MonthsAgo,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.PAID,
          notes: 'Paid in cash',
        },
      },
    },
  });

  // Service 4: History for v3 (BAP-1234) - 4 months ago
  const date4MonthsAgo = new Date();
  date4MonthsAgo.setMonth(date4MonthsAgo.getMonth() - 4);

  await prisma.service.create({
    data: {
      vehicleId: v3.id,
      serviceType: 'Brake Service',
      customerComplaint: 'Brake pedal feels soft and slight squeal',
      workPerformed: 'Front brake pads replaced and brake fluid bleed',
      partsUsed: 'Akebono Ceramic Brake Pads, DOT 4 Brake Fluid',
      labourCost: 5000,
      partsCost: 10000,
      totalCost: 15000,
      serviceDate: date4MonthsAgo,
      status: ServiceStatus.COMPLETED,
      serviceItems: {
        create: [
          { itemName: 'Akebono Front Brake Pads', itemType: 'PART', quantity: 1, unitPrice: 8500, totalPrice: 8500 },
          { itemName: 'DOT 4 Brake Fluid 1L', itemType: 'PART', quantity: 1, unitPrice: 1500, totalPrice: 1500 },
          { itemName: 'Brake Overhaul & Bleeding Labour', itemType: 'LABOUR', quantity: 1, unitPrice: 5000, totalPrice: 5000 },
        ],
      },
      payment: {
        create: {
          amount: 15000,
          paymentDate: date4MonthsAgo,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentStatus: PaymentStatus.PAID,
          notes: 'Commercial Bank transfer Ref #TXN88921',
        },
      },
    },
  });

  console.log('--- Database seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
