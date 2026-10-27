const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, mocks) {
  const filename = path.join(__dirname, '..', relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, console: { log() {}, warn() {}, error() {} }, fetch: (...args) => global.fetch(...args),
    require(name) { if (name in mocks) return mocks[name]; throw new Error(`Unexpected import: ${name}`); },
  }, { filename });
  return module.exports;
}

function readiness(attribution) {
  const calls = [];
  const module = load('services/purchaseReadiness.ts', {
    './iapService': { iapService: { initialize: async uid => { calls.push(`revenuecat:init:${uid}`); return true; }, login: async () => { calls.push('revenuecat:login'); return {}; } } },
    './referralService': { referralService: { checkPendingAttribution: async () => { calls.push('affiliate:track'); return attribution; } } },
  });
  return { ...module, calls };
}

test('identifies RevenueCat before submitting attribution', async () => {
  const subject = readiness({ status: 'attributed' });
  assert.equal((await subject.preparePurchaseIdentity('firebase-uid')).status, 'ready');
  assert.ok(subject.calls.indexOf('revenuecat:login') < subject.calls.indexOf('affiliate:track'));
});

test('routes unauthenticated onboarding to signup instead of paywall', () => {
  const subject = readiness({ status: 'no_referral' });
  assert.equal(subject.resolveOnboardingDestination(false), 'SIGNUP');
  assert.notEqual(subject.resolveOnboardingDestination(false), 'PAYWALL');
});

test('returns ready_without_referral when no code is stored', async () => {
  assert.equal((await readiness({ status: 'no_referral' }).preparePurchaseIdentity('uid')).status, 'ready_without_referral');
});

function referralSubject(fetchImpl) {
  const values = new Map([['@fitswap_referral_code', 'CREATOR10'], ['@fitswap_referral_pending_owner', 'uid']]);
  const storage = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => values.set(key, value),
    multiRemove: async keys => keys.forEach(key => values.delete(key)),
  };
  const module = load('services/referralService.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'expo-crypto': { randomUUID: () => 'device-id' },
    './firebaseConfig': { auth: { currentUser: { uid: 'uid', getIdToken: async () => 'token' } } },
    './config': { AFFILIATES_API_URL: 'https://affiliate.test' },
  });
  const originalFetch = global.fetch;
  global.fetch = fetchImpl;
  return { ...module, values, restore: () => { global.fetch = originalFetch; } };
}

test('keeps referral code on retryable failure', async () => {
  const subject = referralSubject(async () => { throw new Error('offline'); });
  try {
    assert.equal((await subject.referralService.checkPendingAttribution('uid')).status, 'retryable_error');
    assert.equal(subject.values.get('@fitswap_referral_code'), 'CREATOR10');
  } finally { subject.restore(); }
});

test('returns invalid_referral for a rejected creator code without clearing it', async () => {
  const subject = referralSubject(async () => ({ ok: false, status: 404, json: async () => ({ error: 'invalid_referral_code' }) }));
  try {
    assert.equal((await subject.referralService.checkPendingAttribution('uid')).status, 'invalid_referral');
    assert.equal(subject.values.get('@fitswap_referral_code'), 'CREATOR10');
  } finally { subject.restore(); }
});

test('clears an invalid referral only after explicit continuation', async () => {
  const subject = referralSubject(async () => ({ ok: false, status: 404, json: async () => ({ error: 'invalid_referral_code' }) }));
  try {
    await subject.referralService.checkPendingAttribution('uid');
    assert.equal(subject.values.get('@fitswap_referral_code'), 'CREATOR10');
    await subject.referralService.clearPendingReferral();
    assert.equal(subject.values.has('@fitswap_referral_code'), false);
    assert.equal(subject.values.has('@fitswap_referral_pending_owner'), false);
  } finally { subject.restore(); }
});
