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
  vm.runInNewContext(code, { module, exports: module.exports, __DEV__: false,
    console: { log() {}, warn() {}, error() {} }, setTimeout,
    require(name) { if (name in mocks) return mocks[name]; throw new Error(`Unexpected import: ${name}`); },
  }, { filename });
  return module.exports;
}
function service(sdk = {}) {
  return load('services/iapService.ts', {
    'react-native': { Platform: { select: o => o.ios } },
    'react-native-purchases': { __esModule: true, default: { setLogLevel() {}, configure() {}, ...sdk }, LOG_LEVEL: { ERROR: 0 } },
    'expo-constants': { __esModule: true, default: { executionEnvironment: 'standalone' }, ExecutionEnvironment: { StoreClient: 'storeClient' } },
  });
}
test('native initialization failure never grants a simulated purchase', async () => {
  const { iapService } = service({ configure() { throw new Error('configuration failed'); } });
  assert.equal(await iapService.initialize('firebase-uid'), false);
  assert.equal((await iapService.purchasePackage({ product: { identifier: 'Plano_Pro_Anual' } })).success, false);
  assert.equal((await iapService.checkSubscriptionStatus()).verificationState, 'unknown');
});
test('native RevenueCat initialization requires a Firebase UID', async () => {
  const configured = [];
  const { iapService } = service({ configure(options) { configured.push(options); } });
  assert.equal(await iapService.initialize(), false);
  assert.equal(configured.length, 0);
  assert.equal(await iapService.initialize('firebase-uid'), true);
  assert.equal(configured[0].appUserID, 'firebase-uid');
});
test('only a verified Pro entitlement grants purchase success', async () => {
  const { iapService } = service({ purchasePackage: async () => ({ customerInfo: { entitlements: { active: {} } }, transaction: {} }) });
  assert.equal((await iapService.purchasePackage({})).success, false);
});
test('real Apple product IDs map to the paid plans', () => {
  const { PRODUCT_IDS } = service();
  const plan = { MONTHLY: 'monthly', YEARLY: 'yearly', FREE: 'free' };
  const hooks = load('hooks/useSubscription.ts', {
    react: { useRef: v => ({ current: v }) }, '../services/userService': {}, '../services/storage': {},
    '../services/iapService': { PRODUCT_IDS }, '../types': { SubscriptionPlan: plan },
  });
  assert.equal(hooks.getPlanFromProductId('Plano_Pro_Nutriverse'), plan.MONTHLY);
  assert.equal(hooks.getPlanFromProductId('Plano_Pro_Anual'), plan.YEARLY);
  assert.equal(hooks.getPlanFromProductId('unrecognized'), plan.FREE);
});
test('unknown verification preserves Pro; verified inactivity removes it', async () => {
  let state = 'unknown'; const writes = [];
  const hooks = load('hooks/useSubscription.ts', {
    react: { useRef: v => ({ current: v }) },
    '../services/userService': { updateUserProfile: async (...a) => writes.push(a) },
    '../services/storage': { storageService: { saveProfile: async () => {} } },
    '../services/iapService': { PRODUCT_IDS: {}, iapService: { initialize: async () => true, checkSubscriptionStatus: async () => ({ isActive: false, verificationState: state }) } },
    '../types': { SubscriptionPlan: { FREE: 'free' } },
  });
  const hook = hooks.useSubscription(() => {}, () => {});
  const profile = { isPro: true, plan: 'yearly', name: 'Test' };
  assert.equal((await hook.reconcileAppleSubscription('uid', profile, profile)).isPro, true);
  assert.equal(writes.length, 0);
  state = 'verified_inactive';
  assert.equal((await hook.reconcileAppleSubscription('uid', profile, profile)).isPro, false);
  assert.equal(writes.length, 1);
});

test('production config refuses incomplete Branch setup', () => {
  const source = fs.readFileSync(path.join(__dirname, '../app.config.js'), 'utf8');
  const evaluate = env => {
    const module = { exports: {} };
    vm.runInNewContext(source, { module, process: { env }, require: () => ({ config() {} }) });
    return module.exports.expo;
  };
  assert.throws(() => evaluate({ EAS_BUILD_PROFILE: 'production' }), /Production requires/);
  const config = evaluate({ EAS_BUILD_PROFILE: 'production', BRANCH_API_KEY: 'key_live_test',
    BRANCH_DOMAIN_LINK: 'example.app.link', BRANCH_DOMAIN_LINK_ALT: 'example-alternate.app.link',
    EXPO_PUBLIC_AFFILIATES_API_URL: 'https://example.com' });
  assert.equal(config.ios.associatedDomains.length, 3);
  assert.ok(config.plugins.some(p => Array.isArray(p) && p[0] === '@config-plugins/react-native-branch'));
});
