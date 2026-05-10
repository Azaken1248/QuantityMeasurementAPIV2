const BASE = 'http://localhost:8179/api/v1';
let passed = 0;
let failed = 0;
const failures = [];

async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json();
    return { status: res.status, body: json };
}

function assert(condition, testName, detail = '') {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ ${testName}${detail ? ' — ' + detail : ''}`);
        failed++;
        failures.push(testName);
    }
}

const UNIQUE = Date.now();
const TEST_USER = {
    email: `testuser_${UNIQUE}@test.com`,
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
};

async function testAuth() {
    console.log('\n AUTH — Registration');

    const reg = await request('POST', '/auth/register', TEST_USER);
    assert(reg.status === 201, 'Register: 201 Created', `Got ${reg.status}`);
    assert(reg.body.success === true, 'Register: success=true');
    assert(reg.body.data?.email === TEST_USER.email, 'Register: returns email');
    assert(reg.body.data?.id !== undefined, 'Register: returns UUID');

    const dup = await request('POST', '/auth/register', TEST_USER);
    assert(dup.status === 409, 'Register duplicate: 409 Conflict', `Got ${dup.status}`);
    assert(dup.body.success === false, 'Register duplicate: success=false');

    const missing = await request('POST', '/auth/register', { email: 'a@b.com' });
    assert(missing.status === 400, 'Register missing fields: 400', `Got ${missing.status}`);

    const badEmail = await request('POST', '/auth/register', {
        ...TEST_USER,
        email: 'not-an-email',
    });
    assert(badEmail.status === 400, 'Register bad email: 400', `Got ${badEmail.status}`);

    const shortPw = await request('POST', '/auth/register', {
        ...TEST_USER,
        email: `short_${UNIQUE}@test.com`,
        password: '123',
    });
    assert(shortPw.status === 400, 'Register short password: 400', `Got ${shortPw.status}`);

    console.log('\n AUTH — Login');

    const login = await request('POST', '/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password,
    });
    assert(login.status === 200, 'Login: 200 OK', `Got ${login.status}`);
    assert(login.body.success === true, 'Login: success=true');
    assert(typeof login.body.data?.accessToken === 'string', 'Login: returns accessToken');

    const wrongPw = await request('POST', '/auth/login', {
        email: TEST_USER.email,
        password: 'WrongPassword!',
    });
    assert(wrongPw.status === 401, 'Login wrong password: 401', `Got ${wrongPw.status}`);

    const noUser = await request('POST', '/auth/login', {
        email: 'ghost@nowhere.com',
        password: 'anything',
    });
    assert(noUser.status === 401, 'Login non-existent user: 401', `Got ${noUser.status}`);

    return login.body.data?.accessToken;
}

async function testConvertAuthGuard() {
    console.log('\n CONVERT — Auth Guard');

    const noToken = await request('POST', '/measure/convert', {
        value: 100, sourceUnit: 'CELSIUS', targetUnit: 'FAHRENHEIT',
    });
    assert(noToken.status === 401, 'No token: 401', `Got ${noToken.status}`);
    assert(noToken.body.error?.code === 'MISSING_TOKEN', 'No token: MISSING_TOKEN code');

    const badToken = await request('POST', '/measure/convert', {
        value: 100, sourceUnit: 'CELSIUS', targetUnit: 'FAHRENHEIT',
    }, 'this.is.not.a.jwt');
    assert(badToken.status === 403, 'Bad token: 403', `Got ${badToken.status}`);
    assert(badToken.body.error?.code === 'INVALID_TOKEN', 'Bad token: INVALID_TOKEN code');

    const expiredToken = await request('POST', '/measure/convert', {
        value: 100, sourceUnit: 'CELSIUS', targetUnit: 'FAHRENHEIT',
    }, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTAwMDAwMDAwMCwiZXhwIjoxMDAwMDAwMDAxfQ.invalid');
    assert(expiredToken.status === 403, 'Expired/invalid token: 403', `Got ${expiredToken.status}`);
}

async function testConvertValidation(token) {
    console.log('\n CONVERT — Input Validation');

    const empty = await request('POST', '/measure/convert', {}, token);
    assert(empty.status === 400, 'Empty body: 400', `Got ${empty.status}`);
    assert(empty.body.error?.code === 'VALIDATION_ERROR', 'Empty body: VALIDATION_ERROR');

    const noVal = await request('POST', '/measure/convert', {
        sourceUnit: 'FEET', targetUnit: 'INCH',
    }, token);
    assert(noVal.status === 400, 'Missing value: 400', `Got ${noVal.status}`);

    const noSrc = await request('POST', '/measure/convert', {
        value: 10, targetUnit: 'INCH',
    }, token);
    assert(noSrc.status === 400, 'Missing sourceUnit: 400', `Got ${noSrc.status}`);

    const noTgt = await request('POST', '/measure/convert', {
        value: 10, sourceUnit: 'FEET',
    }, token);
    assert(noTgt.status === 400, 'Missing targetUnit: 400', `Got ${noTgt.status}`);

    const badUnit = await request('POST', '/measure/convert', {
        value: 10, sourceUnit: 'BANANA', targetUnit: 'INCH',
    }, token);
    assert(badUnit.status === 400, 'Invalid unit (BANANA): 400', `Got ${badUnit.status}`);

    const strVal = await request('POST', '/measure/convert', {
        value: 'abc', sourceUnit: 'FEET', targetUnit: 'INCH',
    }, token);
    assert(strVal.status === 400, 'String value: 400', `Got ${strVal.status}`);

    const crossType = await request('POST', '/measure/convert', {
        value: 10, sourceUnit: 'FEET', targetUnit: 'LITRE',
    }, token);
    assert(crossType.status === 400, 'Cross-type (FEET→LITRE): 400', `Got ${crossType.status}`);
    assert(crossType.body.error?.code === 'INVALID_UNIT_TYPE', 'Cross-type: INVALID_UNIT_TYPE code',
        `Got ${crossType.body.error?.code}`);
    assert(crossType.body.error?.message?.includes('LENGTH') && crossType.body.error?.message?.includes('VOLUME'),
        'Cross-type: message mentions both types');

    const crossType2 = await request('POST', '/measure/convert', {
        value: 100, sourceUnit: 'CELSIUS', targetUnit: 'KG',
    }, token);
    assert(crossType2.status === 400, 'Cross-type (CELSIUS→KG): 400', `Got ${crossType2.status}`);
}

async function testConvertLength(token) {
    console.log('\n CONVERT — Length');

    const r1 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'FEET', targetUnit: 'INCH',
    }, token);
    assert(r1.status === 200, 'FEET→INCH: 200', `Got ${r1.status}`);
    assert(r1.body.data?.resultValue === 12, 'FEET→INCH: 1ft = 12in', `Got ${r1.body.data?.resultValue}`);
    assert(r1.body.data?.resultUnit === 'INCH', 'FEET→INCH: resultUnit=INCH');

    const r2 = await request('POST', '/measure/convert', {
        value: 12, sourceUnit: 'INCH', targetUnit: 'FEET',
    }, token);
    assert(r2.body.data?.resultValue === 1, 'INCH→FEET: 12in = 1ft', `Got ${r2.body.data?.resultValue}`);

    const r3 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'YARD', targetUnit: 'INCH',
    }, token);
    assert(r3.body.data?.resultValue === 36, 'YARD→INCH: 1yd = 36in', `Got ${r3.body.data?.resultValue}`);

    const r4 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'YARD', targetUnit: 'FEET',
    }, token);
    assert(r4.body.data?.resultValue === 3, 'YARD→FEET: 1yd = 3ft', `Got ${r4.body.data?.resultValue}`);

    const r5 = await request('POST', '/measure/convert', {
        value: 42, sourceUnit: 'FEET', targetUnit: 'FEET',
    }, token);
    assert(r5.body.data?.resultValue === 42, 'FEET→FEET: identity = 42', `Got ${r5.body.data?.resultValue}`);

    const r6 = await request('POST', '/measure/convert', {
        value: 2.54, sourceUnit: 'CENTIMETER', targetUnit: 'INCH',
    }, token);
    assert(Math.abs(r6.body.data?.resultValue - 1) < 0.001, 'CM→INCH: 2.54cm ≈ 1in', `Got ${r6.body.data?.resultValue}`);
}

async function testConvertVolume(token) {
    console.log('\n CONVERT — Volume');

    const r1 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'LITRE', targetUnit: 'ML',
    }, token);
    assert(r1.body.data?.resultValue === 1000, 'LITRE→ML: 1L = 1000mL', `Got ${r1.body.data?.resultValue}`);

    const r2 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'GALLON', targetUnit: 'LITRE',
    }, token);
    assert(Math.abs(r2.body.data?.resultValue - 3.78541) < 0.001, 'GALLON→LITRE: 1gal ≈ 3.785L', `Got ${r2.body.data?.resultValue}`);

    const r3 = await request('POST', '/measure/convert', {
        value: 3785.41, sourceUnit: 'ML', targetUnit: 'GALLON',
    }, token);
    assert(Math.abs(r3.body.data?.resultValue - 1) < 0.001, 'ML→GALLON: 3785.41mL ≈ 1gal', `Got ${r3.body.data?.resultValue}`);
}

async function testConvertWeight(token) {
    console.log('\n CONVERT — Weight');

    const r1 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'KG', targetUnit: 'GRAM',
    }, token);
    assert(r1.body.data?.resultValue === 1000, 'KG→GRAM: 1kg = 1000g', `Got ${r1.body.data?.resultValue}`);

    const r2 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'TONNE', targetUnit: 'KG',
    }, token);
    assert(r2.body.data?.resultValue === 1000, 'TONNE→KG: 1t = 1000kg', `Got ${r2.body.data?.resultValue}`);

    const r3 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'GRAM', targetUnit: 'TONNE',
    }, token);
    assert(r3.body.data?.resultValue === 0.000001, 'GRAM→TONNE: 1g = 0.000001t', `Got ${r3.body.data?.resultValue}`);

    const r4 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'TONNE', targetUnit: 'GRAM',
    }, token);
    assert(r4.body.data?.resultValue === 1000000, 'TONNE→GRAM: 1t = 1000000g', `Got ${r4.body.data?.resultValue}`);
}

async function testConvertTemperature(token) {
    console.log('\n CONVERT — Temperature');

    const r1 = await request('POST', '/measure/convert', {
        value: 100, sourceUnit: 'CELSIUS', targetUnit: 'FAHRENHEIT',
    }, token);
    assert(r1.body.data?.resultValue === 212, 'C→F: 100C = 212F', `Got ${r1.body.data?.resultValue}`);

    const r2 = await request('POST', '/measure/convert', {
        value: 32, sourceUnit: 'FAHRENHEIT', targetUnit: 'CELSIUS',
    }, token);
    assert(r2.body.data?.resultValue === 0, 'F→C: 32F = 0C', `Got ${r2.body.data?.resultValue}`);

    const r3 = await request('POST', '/measure/convert', {
        value: 0, sourceUnit: 'CELSIUS', targetUnit: 'KELVIN',
    }, token);
    assert(r3.body.data?.resultValue === 273.15, 'C→K: 0C = 273.15K', `Got ${r3.body.data?.resultValue}`);

    const r4 = await request('POST', '/measure/convert', {
        value: 373.15, sourceUnit: 'KELVIN', targetUnit: 'CELSIUS',
    }, token);
    assert(r4.body.data?.resultValue === 100, 'K→C: 373.15K = 100C', `Got ${r4.body.data?.resultValue}`);

    const r5 = await request('POST', '/measure/convert', {
        value: 212, sourceUnit: 'FAHRENHEIT', targetUnit: 'KELVIN',
    }, token);
    assert(Math.abs(r5.body.data?.resultValue - 373.15) < 0.01, 'F→K: 212F = 373.15K', `Got ${r5.body.data?.resultValue}`);

    const r6 = await request('POST', '/measure/convert', {
        value: -40, sourceUnit: 'CELSIUS', targetUnit: 'CELSIUS',
    }, token);
    assert(r6.body.data?.resultValue === -40, 'C→C: identity = -40', `Got ${r6.body.data?.resultValue}`);

    const r7 = await request('POST', '/measure/convert', {
        value: -40, sourceUnit: 'CELSIUS', targetUnit: 'FAHRENHEIT',
    }, token);
    assert(r7.body.data?.resultValue === -40, 'C→F: -40C = -40F', `Got ${r7.body.data?.resultValue}`);
}

async function testEdgeCases(token) {
    console.log('\n CONVERT — Edge Cases');

    const r1 = await request('POST', '/measure/convert', {
        value: 0, sourceUnit: 'FEET', targetUnit: 'INCH',
    }, token);
    assert(r1.status === 200, 'Zero value: 200', `Got ${r1.status}`);
    assert(r1.body.data?.resultValue === 0, 'Zero: 0 FEET = 0 INCH', `Got ${r1.body.data?.resultValue}`);

    const r2 = await request('POST', '/measure/convert', {
        value: -273.15, sourceUnit: 'CELSIUS', targetUnit: 'KELVIN',
    }, token);
    assert(r2.status === 200, 'Absolute zero: 200', `Got ${r2.status}`);
    assert(r2.body.data?.resultValue === 0, 'Absolute zero: -273.15C = 0K', `Got ${r2.body.data?.resultValue}`);

    const r3 = await request('POST', '/measure/convert', {
        value: 1000000, sourceUnit: 'GRAM', targetUnit: 'TONNE',
    }, token);
    assert(r3.body.data?.resultValue === 1, 'Large: 1000000g = 1t', `Got ${r3.body.data?.resultValue}`);

    const r4 = await request('POST', '/measure/convert', {
        value: 0.001, sourceUnit: 'KG', targetUnit: 'GRAM',
    }, token);
    assert(r4.body.data?.resultValue === 1, 'Small: 0.001kg = 1g', `Got ${r4.body.data?.resultValue}`);

    const r5 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'CENTIMETER', targetUnit: 'INCH',
    }, token);
    assert(r5.body.data?.resultValue === 0.393701, 'Precision: 1cm = 0.393701in', `Got ${r5.body.data?.resultValue}`);

    const r6 = await request('POST', '/measure/convert', {
        value: -5, sourceUnit: 'FEET', targetUnit: 'INCH',
    }, token);
    assert(r6.body.data?.resultValue === -60, 'Negative length: -5ft = -60in', `Got ${r6.body.data?.resultValue}`);

    const r7 = await request('POST', '/measure/convert', {
        value: 1, sourceUnit: 'FEET', targetUnit: 'INCH',
    }, token);
    assert(r7.body.success === true, 'Response has success=true');
    assert(r7.body.data !== undefined, 'Response has data');
    assert(r7.body.message !== undefined, 'Response has message');
    assert(r7.body.timestamp !== undefined, 'Response has timestamp');
    assert(typeof r7.body.timestamp === 'string', 'Timestamp is ISO string');
}

async function testCompareValidation(token) {
    console.log('\n COMPARE — Input Validation');

    const empty = await request('POST', '/measure/compare', {}, token);
    assert(empty.status === 400, 'Empty body: 400', `Got ${empty.status}`);

    const missingQty2 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'FEET' },
    }, token);
    assert(missingQty2.status === 400, 'Missing qty2: 400', `Got ${missingQty2.status}`);

    const missingQty1 = await request('POST', '/measure/compare', {
        qty2: { value: 1, unit: 'FEET' },
    }, token);
    assert(missingQty1.status === 400, 'Missing qty1: 400', `Got ${missingQty1.status}`);

    const badUnit = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'BANANA' },
        qty2: { value: 1, unit: 'FEET' },
    }, token);
    assert(badUnit.status === 400, 'Invalid unit: 400', `Got ${badUnit.status}`);

    const missingValue = await request('POST', '/measure/compare', {
        qty1: { unit: 'FEET' },
        qty2: { value: 1, unit: 'FEET' },
    }, token);
    assert(missingValue.status === 400, 'Missing value in qty1: 400', `Got ${missingValue.status}`);

    const crossType = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'FEET' },
        qty2: { value: 1, unit: 'LITRE' },
    }, token);
    assert(crossType.status === 400, 'Cross-type (LENGTH vs VOLUME): 400', `Got ${crossType.status}`);
    assert(crossType.body.error?.code === 'INVALID_UNIT_TYPE', 'Cross-type: INVALID_UNIT_TYPE code');
}

async function testCompareEqual(token) {
    console.log('\n COMPARE — Equal Cases');

    const r1 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'YARD' },
        qty2: { value: 3, unit: 'FEET' },
    }, token);
    assert(r1.status === 200, '1 YARD vs 3 FEET: 200', `Got ${r1.status}`);
    assert(r1.body.data?.result === 'Equal', '1 YARD = 3 FEET', `Got ${r1.body.data?.result}`);

    const r2 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'FEET' },
        qty2: { value: 12, unit: 'INCH' },
    }, token);
    assert(r2.body.data?.result === 'Equal', '1 FEET = 12 INCH', `Got ${r2.body.data?.result}`);

    const r3 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'LITRE' },
        qty2: { value: 1000, unit: 'ML' },
    }, token);
    assert(r3.body.data?.result === 'Equal', '1 LITRE = 1000 ML', `Got ${r3.body.data?.result}`);

    const r4 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'KG' },
        qty2: { value: 1000, unit: 'GRAM' },
    }, token);
    assert(r4.body.data?.result === 'Equal', '1 KG = 1000 GRAM', `Got ${r4.body.data?.result}`);

    const r5 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'TONNE' },
        qty2: { value: 1000, unit: 'KG' },
    }, token);
    assert(r5.body.data?.result === 'Equal', '1 TONNE = 1000 KG', `Got ${r5.body.data?.result}`);

    const r6 = await request('POST', '/measure/compare', {
        qty1: { value: 212, unit: 'FAHRENHEIT' },
        qty2: { value: 100, unit: 'CELSIUS' },
    }, token);
    assert(r6.body.data?.result === 'Equal', '212 F = 100 C', `Got ${r6.body.data?.result}`);

    const r7 = await request('POST', '/measure/compare', {
        qty1: { value: 0, unit: 'CELSIUS' },
        qty2: { value: 273.15, unit: 'KELVIN' },
    }, token);
    assert(r7.body.data?.result === 'Equal', '0 C = 273.15 K', `Got ${r7.body.data?.result}`);

    const r8 = await request('POST', '/measure/compare', {
        qty1: { value: 5, unit: 'FEET' },
        qty2: { value: 5, unit: 'FEET' },
    }, token);
    assert(r8.body.data?.result === 'Equal', 'Same unit same value: Equal', `Got ${r8.body.data?.result}`);
}

async function testCompareNotEqual(token) {
    console.log('\n COMPARE — Not Equal Cases');

    const r1 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'FEET' },
        qty2: { value: 1, unit: 'INCH' },
    }, token);
    assert(r1.body.data?.result === 'Not Equal', '1 FEET != 1 INCH', `Got ${r1.body.data?.result}`);

    const r2 = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'GALLON' },
        qty2: { value: 1, unit: 'LITRE' },
    }, token);
    assert(r2.body.data?.result === 'Not Equal', '1 GALLON != 1 LITRE', `Got ${r2.body.data?.result}`);

    const r3 = await request('POST', '/measure/compare', {
        qty1: { value: 100, unit: 'CELSIUS' },
        qty2: { value: 100, unit: 'FAHRENHEIT' },
    }, token);
    assert(r3.body.data?.result === 'Not Equal', '100 C != 100 F', `Got ${r3.body.data?.result}`);

    const r4 = await request('POST', '/measure/compare', {
        qty1: { value: 0, unit: 'FEET' },
        qty2: { value: 0, unit: 'INCH' },
    }, token);
    assert(r4.body.data?.result === 'Equal', '0 FEET = 0 INCH (both zero)', `Got ${r4.body.data?.result}`);

    const r5 = await request('POST', '/measure/compare', {
        qty1: { value: -40, unit: 'CELSIUS' },
        qty2: { value: -40, unit: 'FAHRENHEIT' },
    }, token);
    assert(r5.body.data?.result === 'Equal', '-40 C = -40 F (crossover)', `Got ${r5.body.data?.result}`);
}

async function testCompareResponseStructure(token) {
    console.log('\n COMPARE — Response Structure');

    const r = await request('POST', '/measure/compare', {
        qty1: { value: 1, unit: 'YARD' },
        qty2: { value: 3, unit: 'FEET' },
    }, token);
    assert(r.body.success === true, 'Response has success=true');
    assert(r.body.data?.result !== undefined, 'Response has data.result');
    assert(r.body.message !== undefined, 'Response has message');
    assert(r.body.timestamp !== undefined, 'Response has timestamp');
    assert(typeof r.body.timestamp === 'string', 'Timestamp is ISO string');
}

async function main() {
    console.log('===================================================');
    console.log('  Quantity Measurement API — Integration Tests');
    console.log('  Target: http://localhost:8179');
    console.log('===================================================');

    try {
        const token = await testAuth();
        if (!token) {
            console.log('\n Cannot proceed — login failed, no token.');
            process.exit(1);
        }

        await testConvertAuthGuard();
        await testConvertValidation(token);
        await testConvertLength(token);
        await testConvertVolume(token);
        await testConvertWeight(token);
        await testConvertTemperature(token);
        await testEdgeCases(token);
        await testCompareValidation(token);
        await testCompareEqual(token);
        await testCompareNotEqual(token);
        await testCompareResponseStructure(token);

    } catch (err) {
        console.error('\n FATAL ERROR:', err.message);
        failed++;
    }

    console.log('\n===================================================');
    console.log(`  RESULTS:  ${passed} passed  |  ${failed} failed  |  ${passed + failed} total`);
    if (failures.length > 0) {
        console.log('\n  FAILURES:');
        failures.forEach(f => console.log(`    - ${f}`));
    }
    console.log('===================================================\n');
    process.exit(failed > 0 ? 1 : 0);
}

main();

