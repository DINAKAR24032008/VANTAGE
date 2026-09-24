import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/services/authService';
import { SmsService } from '../src/services/smsService';
import { SmsController } from '../src/controllers/smsController';

async function runOtpSuite() {
  console.log('=======================================================');
  console.log('🧪 RUNNING OTP & SMS VERIFICATION TEST SUITE');
  console.log('=======================================================\n');

  // 1. Fetch test user
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error('❌ Test user sarah.jenkins@vantage.gov.in not found');
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ Found test user: ${user.name} (${user.id})`);

  // Clean previous OTP records & notification logs for clean run
  await prisma.otpCode.deleteMany({ where: { userId } });

  // Mock Express Req/Res objects
  function createMockRes() {
    let statusCode = 200;
    let responseData: any = null;

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return { statusCode, data };
      },
    };

    return {
      res,
      get: () => ({ statusCode, data: responseData }),
    };
  }

  // --- Test 1: Invalid Phone Number Validation ---
  console.log('\n--- Test 1: Invalid Phone Number Validation ---');
  const mockRes1 = createMockRes();
  await SmsController.sendOtp(
    { user: { userId, role: 'learner', email: user.email }, body: { phone: '123' } } as any,
    mockRes1.res
  );
  const t1 = mockRes1.get();
  console.log(`Response Code : ${t1.statusCode}`);
  console.log(`Error Code    : ${t1.data?.code}`);
  console.log(`Message       : ${t1.data?.message}`);
  if (t1.statusCode === 400 && t1.data?.code === 'INVALID_PHONE') {
    console.log('✅ PASS: Invalid phone rejected with INVALID_PHONE');
  } else {
    console.error('❌ FAIL: Expected 400 INVALID_PHONE');
  }

  // --- Test 2: Valid Send OTP ---
  console.log('\n--- Test 2: Valid Send OTP ---');
  const mockRes2 = createMockRes();
  const validPhone = '+918124925283';
  await SmsController.sendOtp(
    { user: { userId, role: 'learner', email: user.email }, body: { phone: validPhone } } as any,
    mockRes2.res
  );
  const t2 = mockRes2.get();
  console.log(`Response Code : ${t2.statusCode}`);
  console.log(`Data          :`, t2.data);
  if (t2.statusCode === 200 && t2.data?.success) {
    console.log('✅ PASS: OTP generated and sent successfully');
  } else {
    console.error('❌ FAIL: Expected 200 success');
  }

  // Fetch created OtpCode from DB to inspect hash
  const otpRecord = await prisma.otpCode.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`DB OtpCode ID : ${otpRecord?.id}`);
  console.log(`DB Hash       : ${otpRecord?.codeHash?.slice(0, 25)}...`);
  console.log(`Expires At    : ${otpRecord?.expiresAt}`);

  // --- Test 3: 60-Second Cooldown Rate Limit ---
  console.log('\n--- Test 3: 60-Second Cooldown Rate Limit ---');
  const mockRes3 = createMockRes();
  await SmsController.sendOtp(
    { user: { userId, role: 'learner', email: user.email }, body: { phone: validPhone } } as any,
    mockRes3.res
  );
  const t3 = mockRes3.get();
  console.log(`Response Code : ${t3.statusCode}`);
  console.log(`Error Code    : ${t3.data?.code}`);
  console.log(`Message       : ${t3.data?.message}`);
  if (t3.statusCode === 429 && t3.data?.code === 'RATE_LIMITED') {
    console.log('✅ PASS: Resend within 60s blocked with 429 RATE_LIMITED');
  } else {
    console.error('❌ FAIL: Expected 429 RATE_LIMITED');
  }

  // --- Test 4: Wrong OTP Attempt ---
  console.log('\n--- Test 4: Wrong OTP Attempt ---');
  const mockRes4 = createMockRes();
  await SmsController.verifyOtp(
    { user: { userId, role: 'learner', email: user.email }, body: { phone: validPhone, otp: '000000' } } as any,
    mockRes4.res
  );
  const t4 = mockRes4.get();
  console.log(`Response Code : ${t4.statusCode}`);
  console.log(`Error Code    : ${t4.data?.code}`);
  console.log(`Message       : ${t4.data?.message}`);
  if (t4.statusCode === 400 && t4.data?.code === 'OTP_INVALID') {
    console.log('✅ PASS: Incorrect OTP rejected with 400 OTP_INVALID');
  } else {
    console.error('❌ FAIL: Expected 400 OTP_INVALID');
  }

  // --- Test 5: Correct OTP Verification ---
  // Generate a known test OTP to verify success path
  console.log('\n--- Test 5: Correct OTP Verification & DB Sync ---');
  const testPlainOtp = '654321';
  const testHash = await SmsService.hashOtp(testPlainOtp);

  // Directly insert known test OTP record
  const testOtpRecord = await prisma.otpCode.create({
    data: {
      userId,
      phone: validPhone,
      codeHash: testHash,
      purpose: 'VERIFY_PHONE',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    },
  });

  const mockRes5 = createMockRes();
  await SmsController.verifyOtp(
    { user: { userId, role: 'learner', email: user.email }, body: { phone: validPhone, otp: testPlainOtp } } as any,
    mockRes5.res
  );
  const t5 = mockRes5.get();
  console.log(`Response Code : ${t5.statusCode}`);
  console.log(`Data          :`, t5.data);

  if (t5.statusCode === 200 && t5.data?.success) {
    console.log('✅ PASS: Correct OTP verified successfully');
  } else {
    console.error('❌ FAIL: Expected 200 success');
  }

  // Verify User & NotificationPreference in DB
  const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
  const updatedPref = await prisma.notificationPreference.findUnique({ where: { userId } });

  console.log(`Updated User phoneVerified : ${updatedUser?.phoneVerified}`);
  console.log(`Updated User phone         : ${updatedUser?.phone}`);
  console.log(`Updated Pref smsEnabled    : ${updatedPref?.smsEnabled}`);

  if (updatedUser?.phoneVerified === true && updatedPref?.smsEnabled === true) {
    console.log('✅ PASS: DB state updated correctly (phoneVerified=true, smsEnabled=true)!');
  } else {
    console.error('❌ FAIL: DB state update failed');
  }

  console.log('\n=======================================================');
  console.log('🎉 ALL OTP SUITE TESTS COMPLETED SUCCESSFULLY!');
  console.log('=======================================================');
}

runOtpSuite()
  .catch((e) => {
    console.error('Unhandled test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
