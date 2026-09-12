(function () {
  "use strict";

  var controller = document.currentScript;
  var panel = document.querySelector("[data-analytics-consent]");
  var openers = document.querySelectorAll("[data-analytics-consent-open]");

  if (!controller || !panel) return;

  var siteId = controller.dataset.siteId;
  var matomoUrl = controller.dataset.matomoUrl;
  var storageKey = controller.dataset.consentKey || "analyticsConsent";
  var policyVersion = controller.dataset.consentVersion || "1";
  var expiryDays = Number(controller.dataset.consentExpiryDays || "180");
  var analyticsLoaded = false;
  var returnFocus = null;

  if (!/^\d+$/.test(siteId || "") || !/^https:\/\//.test(matomoUrl || "") || !Number.isFinite(expiryDays)) {
    console.error("Analytics consent configuration is invalid; analytics will remain disabled.");
    return;
  }

  matomoUrl = matomoUrl.replace(/\/?$/, "/");

  function readDecision() {
    try {
      var value = JSON.parse(localStorage.getItem(storageKey));
      var decidedAt = Date.parse(value.decidedAt);
      var expiresAt = decidedAt + expiryDays * 24 * 60 * 60 * 1000;

      if (
        value.version === policyVersion &&
        (value.decision === "accepted" || value.decision === "rejected") &&
        Number.isFinite(decidedAt) &&
        decidedAt <= Date.now() &&
        expiresAt > Date.now()
      ) {
        return value.decision;
      }
    } catch (_error) {
      // Storage may be unavailable or contain data from an older implementation.
    }

    return "unknown";
  }

  function writeDecision(decision) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          decision: decision,
          version: policyVersion,
          decidedAt: new Date().toISOString(),
        }),
      );
      return true;
    } catch (_error) {
      try {
        localStorage.removeItem(storageKey);
      } catch (_removeError) {
        // Consent still applies to this page when browser storage is unavailable.
      }

      return false;
    }
  }

  function showPanel(opener) {
    returnFocus = opener || null;
    panel.hidden = false;

    if (opener) {
      panel.querySelector("[data-analytics-consent-action]").focus();
    }
  }

  function hidePanel() {
    panel.hidden = true;

    if (returnFocus) {
      returnFocus.focus();
      returnFocus = null;
    }
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    var queue = (window._paq = window._paq || []);
    queue.push(["requireConsent"]);
    queue.push(["setConsentGiven"]);
    queue.push(["setTrackerUrl", matomoUrl + "matomo.php"]);
    queue.push(["setSiteId", siteId]);
    queue.push(["setVisitorCookieTimeout", 34128000]);
    queue.push(["setReferralCookieTimeout", 15768000]);
    queue.push(["setSessionCookieTimeout", 1800]);
    queue.push(["trackPageView"]);
    queue.push(["enableLinkTracking"]);

    var tracker = document.createElement("script");
    tracker.async = true;
    tracker.src = matomoUrl + "matomo.js";
    tracker.referrerPolicy = "strict-origin-when-cross-origin";
    document.head.appendChild(tracker);
  }

  function deleteMatomoCookies() {
    document.cookie.split(";").forEach(function (cookie) {
      var name = cookie.split("=")[0].trim();

      if (name.indexOf("_pk_") !== 0 && name.indexOf("mtm_") !== 0) return;

      document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = name + "=; Max-Age=0; path=/; domain=" + location.hostname + "; SameSite=Lax";
      document.cookie = name + "=; Max-Age=0; path=/; domain=." + location.hostname + "; SameSite=Lax";
    });
  }

  panel.addEventListener("click", function (event) {
    var action = event.target.closest("[data-analytics-consent-action]");
    if (!action) return;

    var decision = action.dataset.analyticsConsentAction;
    if (decision !== "accepted" && decision !== "rejected") return;

    var persisted = writeDecision(decision);
    hidePanel();

    if (decision === "accepted") {
      loadAnalytics();
      return;
    }

    deleteMatomoCookies();

    if (analyticsLoaded) {
      window._paq.push(["forgetConsentGiven"]);
      window._paq.push(["deleteCookies"]);
      if (persisted) {
        location.reload();
      }
    }
  });

  openers.forEach(function (opener) {
    opener.addEventListener("click", function () {
      showPanel(opener);
    });
  });

  var decision = readDecision();
  if (decision === "accepted") {
    loadAnalytics();
  } else {
    deleteMatomoCookies();

    if (decision === "unknown") {
      showPanel();
    }
  }
})();
