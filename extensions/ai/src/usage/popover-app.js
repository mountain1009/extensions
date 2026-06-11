import { clear, cls, h } from "@/lib/dom";
import { icon, providerIcon } from "@/lib/icons";
import {
  composeSnapshots,
  computePace,
  fixtureFromSearch,
  parseFixture,
  providerCatalog,
  rowDisplay,
  selectPreview,
  statusBarPresentation,
  usageIsCritical,
} from "@/usage/core.mjs";
import { parseCachedSnapshots, serializeSnapshots } from "@/usage/cache.mjs";
import { fetchLiveSnapshots } from "@/usage/live.mjs";

const STORAGE_PREFIX = "ai-usage.";
const REFRESH_INTERVAL_MS = 60_000;
const DISPLAY_MODE = "used"; // fixed; the native popover keeps mode in app settings.

// User-configurable popover width. Defaults to the most compact option.
const WIDTH_OPTIONS = [
  { id: "narrow", label: "S", width: 260 },
  { id: "default", label: "M", width: 280 },
  { id: "wide", label: "L", width: 320 },
];
const DEFAULT_WIDTH_ID = "default";

function widthOption() {
  let stored = null;
  try {
    stored = localStorage.getItem(`${STORAGE_PREFIX}width`);
  } catch {
    stored = null;
  }
  return WIDTH_OPTIONS.find((option) => option.id === stored) || WIDTH_OPTIONS.find((o) => o.id === DEFAULT_WIDTH_ID);
}

function writeWidthID(id) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}width`, id);
  } catch {
    /* ignore storage failures */
  }
}

// Tracked providers are the ones the user chose to show; secondary windows
// (weekly, etc.) are included like the native popover did.
function buildPreferences() {
  const tracked = readTrackedProviderIDs();
  const allIDs = new Set(providerCatalog.map((provider) => provider.id));
  return {
    displayMode: DISPLAY_MODE,
    includeSecondary: true,
    trackedProviderIDs: tracked,
    enabledProviderIDs: allIDs,
    pinnedPreview: readPinnedPreview(),
  };
}

// Returns the set of provider IDs the user wants visible. Missing storage means
// "show all"; an empty stored array means the user hid everything.
function readTrackedProviderIDs() {
  const allIDs = providerCatalog.map((provider) => provider.id);
  let stored = null;
  try {
    stored = localStorage.getItem(`${STORAGE_PREFIX}tracked`);
  } catch {
    stored = null;
  }
  if (stored === null) return new Set(allIDs);
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return new Set(allIDs);
    const valid = allIDs.filter((id) => parsed.includes(id));
    return new Set(valid);
  } catch {
    return new Set(allIDs);
  }
}

function writeTrackedProviderIDs(ids) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}tracked`, JSON.stringify([...ids]));
  } catch {
    /* ignore storage failures */
  }
}

function readPinnedPreview() {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}pinnedPreview`) || "";
  } catch {
    return "";
  }
}

function writePinnedPreview(value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}pinnedPreview`, value);
  } catch {
    /* ignore storage failures */
  }
}

function readFixture() {
  const fromSearch = fixtureFromSearch(window.location.search);
  if (fromSearch) return fromSearch;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}fixture`) || "";
  } catch {
    return "";
  }
}

export class UsagePopover {
  constructor(root) {
    this.root = root;
    this.snapshots = [];
    this.isRefreshing = false;
    this.lastRefreshAt = null;
    this.statusText = "";
    this.timer = null;
    this.settingsOpen = false;
  }

  start() {
    this.applyCache();
    this.render();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
  }

  applyCache() {
    let cached = [];
    try {
      cached = parseCachedSnapshots(localStorage.getItem(`${STORAGE_PREFIX}snapshots`));
    } catch {
      cached = [];
    }
    if (cached.length === 0) return;
    const preferences = buildPreferences();
    const composed = composeSnapshots({ catalog: providerCatalog, fetchedSnapshots: cached, preferences });
    if (hasAvailableUsage(composed)) {
      this.snapshots = composed;
      this.statusText = "Loaded cached usage. Refreshing…";
    }
  }

  async refresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    if (this.snapshots.length === 0) this.statusText = "Refreshing usage data…";
    this.render();

    const preferences = buildPreferences();
    const providerIDs = [...preferences.trackedProviderIDs].filter((id) => preferences.enabledProviderIDs.has(id));
    const fixture = readFixture();

    let fetched = [];
    try {
      fetched = fixture ? parseFixture(fixture) : await fetchLiveSnapshots({ exec: window.muxy?.exec, providerIDs });
    } catch (error) {
      console.warn("ai usage fetch failed", error);
      fetched = [];
    }

    const composed = composeSnapshots({ catalog: providerCatalog, fetchedSnapshots: fetched, preferences });
    if (hasAvailableUsage(composed)) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}snapshots`, serializeSnapshots(fetched));
      } catch {
        /* ignore storage failures */
      }
      this.snapshots = composed;
    } else if (this.snapshots.length === 0) {
      this.snapshots = composed;
    }

    this.lastRefreshAt = new Date();
    this.statusText = this.emptyStatusText();
    this.isRefreshing = false;
    this.render();
    this.updateStatusBar();
  }

  emptyStatusText() {
    if (readTrackedProviderIDs().size === 0) return "All providers hidden. Open settings to choose providers.";
    const available = this.snapshots.filter((snapshot) => snapshot.state.kind === "available").length;
    return available > 0 ? "" : "No usage data yet.";
  }

  updateStatusBar() {
    const setter = window.muxy?.statusbar?.set;
    if (typeof setter !== "function") return;
    const preferences = buildPreferences();
    const presentation = statusBarPresentation(selectPreview(this.snapshots, preferences.pinnedPreview), DISPLAY_MODE);
    try {
      setter({ id: "ai-usage", icon: presentation.icon, text: presentation.text });
    } catch (error) {
      console.warn("ai usage status bar update failed", error);
    }
  }

  togglePin(encoded) {
    const current = readPinnedPreview();
    writePinnedPreview(current === encoded ? "" : encoded);
    this.render();
    this.updateStatusBar();
  }

  toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
    this.render();
  }

  toggleProvider(providerID) {
    const tracked = readTrackedProviderIDs();
    if (tracked.has(providerID)) tracked.delete(providerID);
    else tracked.add(providerID);
    writeTrackedProviderIDs(tracked);
    // Hide instantly for snappy feedback; refresh() recomposes from cache + a
    // fresh fetch so a just-enabled provider gets pulled in.
    this.snapshots = this.snapshots.filter((snapshot) => tracked.has(snapshot.id));
    this.statusText = this.emptyStatusText();
    this.render();
    this.updateStatusBar();
    this.refresh();
  }

  render() {
    clear(this.root);
    this.root.appendChild(this.view());
    this.fit();
  }

  fit() {
    const resize = window.muxy?.popover?.resize;
    if (typeof resize !== "function") return;
    const width = widthOption().width;
    const measure = () => {
      // Measure the rendered content, not the viewport: html/body have no
      // min-height, so this collapses to exactly the content height.
      const content = this.root.firstElementChild;
      const height = Math.ceil(content?.getBoundingClientRect().height || document.body.scrollHeight);
      if (height > 0) resize(width, height);
    };
    measure();
    // Re-measure after layout settles (web fonts, icon reflow) so the host
    // shrinks to fit rather than keeping a taller previous size.
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(measure);
  }

  setWidth(id) {
    writeWidthID(id);
    this.render();
  }

  view() {
    return h(
      "div",
      { class: "popover", style: `width: ${widthOption().width}px` },
      this.header(),
      this.settingsOpen ? this.settingsPanel() : null,
      this.statusText ? h("p", { class: "status-text" }, this.statusText) : null,
      this.snapshots.length > 0
        ? h("div", { class: "providers" }, ...this.snapshots.map((snapshot) => this.providerSection(snapshot)))
        : null,
    );
  }

  iconButton({ name, label, active = false, disabled = false, spin = false, onclick }) {
    return h(
      "button",
      {
        type: "button",
        class: cls("icon-btn", active && "is-active"),
        title: label,
        "aria-label": label,
        "aria-pressed": String(active),
        disabled,
        onclick,
      },
      icon(name, 13, spin ? "spin" : ""),
    );
  }

  header() {
    return h(
      "div",
      { class: "header" },
      icon("sparkles", 14, "spark"),
      h("span", { class: "header__title" }, "AI Usage"),
      h("div", { class: "header__spacer" }),
      this.lastRefreshAt ? h("span", { class: "header__time" }, relativeTime(this.lastRefreshAt)) : null,
      this.iconButton({
        name: "refresh",
        label: "Refresh usage",
        disabled: this.isRefreshing,
        spin: this.isRefreshing,
        onclick: () => this.refresh(),
      }),
      this.iconButton({
        name: "sliders",
        label: "Choose providers",
        active: this.settingsOpen,
        onclick: () => this.toggleSettings(),
      }),
    );
  }

  settingsPanel() {
    const tracked = readTrackedProviderIDs();
    return h(
      "div",
      { class: "settings" },
      this.widthControl(),
      h("div", { class: "settings__divider" }),
      h("div", { class: "settings__label" }, "Show in popover"),
      ...providerCatalog.map((provider) => this.providerToggle(provider, tracked.has(provider.id))),
    );
  }

  widthControl() {
    const current = widthOption().id;
    return h(
      "div",
      { class: "width-row" },
      h("span", { class: "width-row__label" }, "Width"),
      h(
        "div",
        { class: "segmented" },
        ...WIDTH_OPTIONS.map((option) => {
          const active = option.id === current;
          return h(
            "button",
            {
              type: "button",
              class: cls("segmented__btn", active && "is-active"),
              title: `${option.width}px`,
              "aria-label": `Width ${option.width}px`,
              "aria-pressed": String(active),
              onclick: () => this.setWidth(option.id),
            },
            option.label,
          );
        }),
      ),
    );
  }

  providerToggle(provider, checked) {
    const box = h(
      "span",
      { class: cls("checkbox", checked && "is-checked") },
      checked ? icon("check", 11) : null,
    );

    return h(
      "button",
      {
        type: "button",
        role: "menuitemcheckbox",
        "aria-checked": String(checked),
        class: cls("provider-opt", checked && "is-checked"),
        onclick: () => this.toggleProvider(provider.id),
      },
      box,
      providerIcon(provider.icon, 13, "provider-glyph"),
      h("span", { class: "provider-opt__name" }, provider.name),
    );
  }

  providerSection(snapshot) {
    const head = h(
      "div",
      { class: "provider__head" },
      providerIcon(snapshot.icon, 14, "provider__icon"),
      h("span", { class: "provider__name" }, snapshot.name),
    );

    let body;
    if (snapshot.state.kind === "available") {
      body = h("div", { class: "provider__rows" }, ...snapshot.rows.map((row) => this.metricRow(snapshot, row)));
    } else {
      body = h("p", { class: "provider__message" }, snapshot.state.message || "No usage data");
    }

    return h("div", { class: "provider" }, head, body);
  }

  metricRow(snapshot, row) {
    const display = rowDisplay(row, DISPLAY_MODE);
    const pace =
      row.percent === null || !row.resetAt || !row.periodDuration
        ? null
        : computePace({
            usedPercent: row.percent,
            resetAt: row.resetAt,
            periodDuration: row.periodDuration,
            now: snapshot.fetchedAt,
          });

    const encoded = `${snapshot.id}::${row.label}`;
    const pinned = readPinnedPreview() === encoded;
    const canPin = row.percent !== null;
    const critical = usageIsCritical(row, DISPLAY_MODE);

    const headChildren = [
      h("span", { class: "metric__label" }, row.label),
      pace ? h("span", { class: cls("pace-dot", paceDotClass(pace.status)) }) : null,
      canPin
        ? h(
            "button",
            {
              type: "button",
              class: cls("icon-btn", pinned && "is-pinned"),
              title: pinned ? "Unpin from status bar" : "Pin to status bar",
              "aria-label": pinned ? "Unpin from status bar" : "Pin to status bar",
              "aria-pressed": String(pinned),
              onclick: () => this.togglePin(encoded),
            },
            icon("pin", 12, "pin-glyph", { fill: pinned }),
          )
        : null,
      h("div", { class: "metric__spacer" }),
      display.percentText
        ? h("span", { class: cls("metric__value", critical && "is-critical") }, display.percentText)
        : null,
      display.detail ? h("span", { class: "metric__detail" }, display.detail) : null,
    ];

    const children = [h("div", { class: "metric__head" }, ...headChildren)];

    if (display.percent !== null) {
      children.push(
        h(
          "div",
          { class: "bar" },
          h("div", { class: "bar__fill", style: `width: ${Math.max(0, Math.min(100, display.percent))}%` }),
        ),
      );
    }

    if (row.resetAt || pace?.detail) {
      children.push(
        h(
          "div",
          { class: "reset-row" },
          h("span", null, row.resetAt ? `Resets ${formatResetTime(row.resetAt)}` : ""),
          h("div", { class: "metric__spacer" }),
          pace?.detail ? h("span", { class: "reset-row__pace" }, pace.detail) : null,
        ),
      );
    }

    return h("div", { class: "metric" }, ...children);
  }
}

function hasAvailableUsage(items) {
  return items.some(
    (snapshot) => snapshot.state.kind === "available" && snapshot.rows.some((row) => row.percent !== null),
  );
}

function paceDotClass(status) {
  if (status === "ahead") return "is-ahead";
  if (status === "behind") return "is-behind";
  return "is-on-track";
}

function formatResetTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function relativeTime(date) {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
