const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../site/js/analytics.js"), "utf8");

function createEnvironment(storedConsent, options = {}) {
  const storage = new Map();
  const appendedScripts = [];
  const cookieWrites = [];
  const errors = [];
  const actions = {
    accepted: createAction("accepted"),
    rejected: createAction("rejected"),
  };

  if (storedConsent !== undefined) {
    storage.set("analyticsConsent", storedConsent);
  }

  const panel = {
    hidden: true,
    listener: null,
    addEventListener(_event, listener) {
      this.listener = listener;
    },
    querySelector() {
      return actions.rejected;
    },
  };

  const opener = {
    listener: null,
    focused: false,
    addEventListener(_event, listener) {
      this.listener = listener;
    },
    focus() {
      this.focused = true;
    },
  };

  const document = {
    currentScript: {
      dataset: {
        siteId: "2",
        matomoUrl: "https://analytics.marijan.pro/",
        consentKey: "analyticsConsent",
        consentVersion: "1",
        consentExpiryDays: "180",
      },
    },
    head: {
      appendChild(script) {
        appendedScripts.push(script);
      },
    },
    querySelector() {
      return panel;
    },
    querySelectorAll() {
      return [opener];
    },
    createElement() {
      return {};
    },
    get cookie() {
      return "_pk_id.2.example=value; unrelated=value";
    },
    set cookie(value) {
      cookieWrites.push(value);
    },
  };

  const location = {
    hostname: "simplistic.hr",
    reloads: 0,
    reload() {
      this.reloads += 1;
    },
  };

  const context = {
    console: {
      error(message) {
        errors.push(message);
      },
    },
    document,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        if (options.failStorageWrites) throw new Error("storage is read-only");
        storage.set(key, value);
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
    location,
  };

  context.window = context;
  vm.runInNewContext(source, context);

  return {
    actions,
    appendedScripts,
    cookieWrites,
    errors,
    location,
    opener,
    panel,
    storage,
    window: context,
  };
}

function createAction(decision) {
  return {
    dataset: { analyticsConsentAction: decision },
    focused: false,
    closest() {
      return this;
    },
    focus() {
      this.focused = true;
    },
  };
}

function storedDecision(decision, decidedAt = new Date().toISOString()) {
  return JSON.stringify({ decision, version: "1", decidedAt });
}

test("does not load analytics before a visitor decides", () => {
  const env = createEnvironment();

  assert.equal(env.panel.hidden, false);
  assert.equal(env.appendedScripts.length, 0);
  assert.equal(env.window._paq, undefined);
});

test("loads Matomo only for a current accepted decision", () => {
  const env = createEnvironment(storedDecision("accepted"));

  assert.equal(env.panel.hidden, true);
  assert.equal(env.appendedScripts.length, 1);
  assert.equal(env.appendedScripts[0].src, "https://analytics.marijan.pro/matomo.js");
  assert.deepEqual(
    Array.from(env.window._paq, (command) => command[0]),
    [
      "requireConsent",
      "setConsentGiven",
      "setTrackerUrl",
      "setSiteId",
      "setVisitorCookieTimeout",
      "setReferralCookieTimeout",
      "setSessionCookieTimeout",
      "trackPageView",
      "enableLinkTracking",
    ],
  );
});

test("persists acceptance and starts analytics", () => {
  const env = createEnvironment();

  env.panel.listener({ target: env.actions.accepted });

  assert.equal(env.panel.hidden, true);
  assert.equal(env.appendedScripts.length, 1);
  assert.equal(JSON.parse(env.storage.get("analyticsConsent")).decision, "accepted");
});

test("a rejected decision never loads analytics", () => {
  const env = createEnvironment(storedDecision("rejected"));

  assert.equal(env.panel.hidden, true);
  assert.equal(env.appendedScripts.length, 0);
  assert.equal(env.window._paq, undefined);
  assert.ok(env.cookieWrites.some((cookie) => cookie.startsWith("_pk_id.2.example=;")));
});

test("expired and malformed decisions fail closed", () => {
  const expired = new Date(Date.now() - 181 * 24 * 60 * 60 * 1000).toISOString();
  const expiredEnv = createEnvironment(storedDecision("accepted", expired));
  const malformedEnv = createEnvironment("not json");

  assert.equal(expiredEnv.panel.hidden, false);
  assert.equal(expiredEnv.appendedScripts.length, 0);
  assert.equal(malformedEnv.panel.hidden, false);
  assert.equal(malformedEnv.appendedScripts.length, 0);
});

test("withdrawal removes Matomo cookies and disables future page loads", () => {
  const env = createEnvironment(storedDecision("accepted"));

  env.opener.listener();
  env.panel.listener({ target: env.actions.rejected });

  assert.equal(JSON.parse(env.storage.get("analyticsConsent")).decision, "rejected");
  assert.equal(env.location.reloads, 1);
  assert.ok(env.cookieWrites.some((cookie) => cookie.startsWith("_pk_id.2.example=;")));
  assert.equal(env.opener.focused, true);
});

test("failed persistence removes stale acceptance without reloading", () => {
  const env = createEnvironment(storedDecision("accepted"), { failStorageWrites: true });

  env.opener.listener();
  env.panel.listener({ target: env.actions.rejected });

  assert.equal(env.storage.has("analyticsConsent"), false);
  assert.equal(env.location.reloads, 0);
  assert.deepEqual(Array.from(env.window._paq.slice(-2), (command) => command[0]), ["forgetConsentGiven", "deleteCookies"]);
});

test("the template cannot load Matomo before the consent controller", () => {
  const template = fs.readFileSync(path.join(__dirname, "../templates/base.html"), "utf8");

  assert.doesNotMatch(template, /src=["']https:\/\/analytics\.marijan\.pro\/matomo\.js/);
  assert.match(template, /data-matomo-url="https:\/\/analytics\.marijan\.pro\/"/);
  assert.match(template, /data-analytics-consent-action="accepted"/);
  assert.match(template, /data-analytics-consent-action="rejected"/);
});
