import { renderIcons } from "./icons";

const dialog = document.querySelector<HTMLDialogElement>(".element-demo-dialog");
const dialogTitle = dialog?.querySelector<HTMLElement>("#element-demo-title");
const dialogDescription = dialog?.querySelector<HTMLElement>(".element-demo-description");
const dialogStage = dialog?.querySelector<HTMLElement>(".element-demo-stage");
let sampleInstance = 0;
let fieldInstance = 0;
const scrollspyCleanups = new WeakMap<HTMLElement, () => void>();
const scrollspyNavigationHandlers = new WeakMap<HTMLElement, (key: string) => void>();
const progressDemoControllers = new WeakMap<HTMLElement, { toggle: () => void; reset: () => void; cleanup: () => void }>();
const progressDemoCleanups = new WeakMap<HTMLElement, () => void>();
const navigationDrawerTimers = new WeakMap<HTMLElement, number>();
const calendarCloseTimers = new WeakMap<HTMLElement, number>();
const toolbarFeedbackTimers = new WeakMap<HTMLElement, number>();
const initializedSurfaceDialogs = new WeakSet<HTMLDialogElement>();
const initializedOverlayPopovers = new WeakSet<HTMLElement>();
const macWindowFrameAnimations = new WeakMap<HTMLElement, Animation>();
type ToastTimerState = { timer: number | null; exitTimer: number | null; deadline: number; remaining: number };
const toastTimerStates = new WeakMap<HTMLElement, ToastTimerState>();
const toastSampleCleanups = new WeakMap<HTMLElement, () => void>();
const textScrambleControllers = new WeakMap<HTMLElement, { replay: () => void; cleanup: () => void }>();
const contextMenuOpeners = new WeakMap<HTMLElement, HTMLElement>();
const commandPaletteOpeners = new WeakMap<HTMLElement, HTMLElement>();
const commandPaletteCloseTimers = new WeakMap<HTMLElement, number>();
const comboMenuCloseTimers = new WeakMap<HTMLElement, number>();
const menuBarCloseTimers = new WeakMap<HTMLElement, number>();
let activeDraggedTask: HTMLElement | null = null;
let activeDragBoard: HTMLElement | null = null;
let activeDragPreview: HTMLElement | null = null;
let activeDragCompleted = false;
let activeSelectionResize: {
  handle: HTMLButtonElement;
  sample: HTMLElement;
  selection: HTMLElement;
  workspace: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  left: number;
  top: number;
  width: number;
  height: number;
} | null = null;
const emptyTrashSuppressionKey = "vinasig-empty-trash-alert-suppressed";

function setComboMenuOpen(menu: HTMLElement, open: boolean) {
  const existingTimer = comboMenuCloseTimers.get(menu);
  if (existingTimer !== undefined) window.clearTimeout(existingTimer);
  comboMenuCloseTimers.delete(menu);

  if (open) {
    menu.hidden = false;
    menu.inert = false;
    menu.removeAttribute("aria-hidden");
    menu.dataset.motion = "opening";
    return;
  }

  if (menu.hidden) return;
  menu.setAttribute("aria-hidden", "true");
  menu.inert = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    menu.hidden = true;
    menu.dataset.motion = "closed";
    menu.removeAttribute("aria-hidden");
    menu.inert = false;
    return;
  }

  menu.dataset.motion = "closing";
  const timer = window.setTimeout(() => {
    if (menu.dataset.motion !== "closing") return;
    menu.hidden = true;
    menu.dataset.motion = "closed";
    menu.removeAttribute("aria-hidden");
    menu.inert = false;
    comboMenuCloseTimers.delete(menu);
  }, 140);
  comboMenuCloseTimers.set(menu, timer);
}

function setAction(element: HTMLElement, action: string, label?: string) {
  element.dataset.action = action;
  if (label) element.setAttribute("aria-label", label);
}

function asButton(element: HTMLElement, action: string, label?: string) {
  if (element instanceof HTMLButtonElement) {
    setAction(element, action, label);
    return element;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = element.className;
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name !== "class") button.setAttribute(attribute.name, attribute.value);
  }
  button.append(...Array.from(element.childNodes));
  setAction(button, action, label);
  element.replaceWith(button);
  return button;
}

function liveStatus(sample: HTMLElement) {
  let status = sample.querySelector<HTMLElement>(":scope > .sample-live-status");
  if (!status) {
    status = document.createElement("span");
    status.className = "sample-live-status";
    status.setAttribute("aria-live", "polite");
    status.setAttribute("role", "status");
    sample.append(status);
  }
  return status;
}

function announce(sample: HTMLElement, message: string) {
  liveStatus(sample).textContent = message;
}

function showToolbarFeedback(feedback: HTMLElement, message: string) {
  const previousTimer = toolbarFeedbackTimers.get(feedback);
  if (previousTimer !== undefined) window.clearTimeout(previousTimer);

  feedback.classList.remove("is-leaving");
  feedback.textContent = message;
  feedback.hidden = false;

  const dismissTimer = window.setTimeout(() => {
    feedback.classList.add("is-leaving");
    const hideTimer = window.setTimeout(() => {
      feedback.hidden = true;
      feedback.classList.remove("is-leaving");
      toolbarFeedbackTimers.delete(feedback);
    }, 180);
    toolbarFeedbackTimers.set(feedback, hideTimer);
  }, 2500);

  toolbarFeedbackTimers.set(feedback, dismissTimer);
}

function animateMacWindowEntry(element: HTMLElement | null | undefined) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof element.animate !== "function") return;
  element.getAnimations().forEach((animation) => animation.cancel());
  element.animate(
    [
      { opacity: 0.55, transform: "translateY(4px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 210, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  );
}

function updateMacWindowFrame(macWindow: HTMLElement, update: () => void) {
  const frame = macWindow.querySelector<HTMLElement>(".sample-mac-window-frame");
  if (!frame) {
    update();
    return;
  }

  const previousAnimation = macWindowFrameAnimations.get(frame);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof frame.animate !== "function") {
    previousAnimation?.cancel();
    update();
    return;
  }

  const startHeight = frame.getBoundingClientRect().height;
  previousAnimation?.cancel();
  update();
  const endHeight = frame.getBoundingClientRect().height;
  if (Math.abs(endHeight - startHeight) < 1) return;

  const animation = frame.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    { duration: 270, easing: "cubic-bezier(0.22, 0.7, 0.25, 1)" },
  );
  macWindowFrameAnimations.set(frame, animation);
  animation.addEventListener("finish", () => {
    if (macWindowFrameAnimations.get(frame) === animation) macWindowFrameAnimations.delete(frame);
  }, { once: true });
}

function setCarouselSlide(sample: HTMLElement, demo: HTMLElement, requestedIndex: number, options: { scroll?: boolean; announce?: boolean } = {}) {
  const viewport = demo.querySelector<HTMLElement>(".sample-carousel-viewport");
  const slides = Array.from(demo.querySelectorAll<HTMLElement>(".sample-carousel-card"));
  const tabs = Array.from(demo.querySelectorAll<HTMLButtonElement>(".sample-carousel-picker [role='tab']"));
  if (!viewport || slides.length === 0) return;

  const previousIndex = Number(demo.dataset.currentSlide ?? "0");
  const index = Math.max(0, Math.min(slides.length - 1, requestedIndex));
  demo.dataset.currentSlide = String(index);
  slides.forEach((slide, slideIndex) => {
    const isCurrent = slideIndex === index;
    slide.classList.toggle("is-current", isCurrent);
    slide.setAttribute("aria-hidden", String(!isCurrent));
    slide.inert = !isCurrent;
  });
  tabs.forEach((tab, tabIndex) => {
    const isCurrent = tabIndex === index;
    tab.setAttribute("aria-selected", String(isCurrent));
    tab.tabIndex = isCurrent ? 0 : -1;
    tab.classList.toggle("is-current", isCurrent);
  });
  const previous = demo.querySelector<HTMLButtonElement>("[data-action='carousel-prev']");
  const next = demo.querySelector<HTMLButtonElement>("[data-action='carousel-next']");
  if (previous) previous.disabled = index === 0;
  if (next) next.disabled = index === slides.length - 1;

  if (options.scroll !== false) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetLeft = index * viewport.clientWidth;
    const shouldSmoothScroll = !reducedMotion && Math.abs(viewport.scrollLeft - targetLeft) > 1;
    if (shouldSmoothScroll) viewport.dataset.programmaticScroll = "true";
    else delete viewport.dataset.programmaticScroll;
    viewport.scrollTo({
      left: targetLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }
  if (options.announce !== false && previousIndex !== index) {
    const title = slides[index]?.querySelector<HTMLElement>("h3, b, strong")?.textContent?.trim() ?? `Slide ${index + 1}`;
    announce(sample, `Slide ${index + 1} of ${slides.length}: ${title}.`);
  }
}

function initializeCarousel(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-carousel-demo");
  const viewport = demo?.querySelector<HTMLElement>(".sample-carousel-viewport");
  const slides = Array.from(demo?.querySelectorAll<HTMLElement>(".sample-carousel-card") ?? []);
  const picker = demo?.querySelector<HTMLElement>(".sample-carousel-picker");
  if (!demo || !viewport || !picker || slides.length === 0) return;

  const prefix = `carousel-${sample.dataset.sampleInstance ?? "example"}`;
  picker.replaceChildren();
  slides.forEach((slide, index) => {
    const title = slide.querySelector<HTMLElement>("h3, b, strong")?.textContent?.trim() ?? `Slide ${index + 1}`;
    slide.id = `${prefix}-slide-${index + 1}`;
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${index + 1} of ${slides.length}: ${title}`);

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "sample-carousel-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-label", `Show slide ${index + 1} of ${slides.length}: ${title}`);
    tab.setAttribute("aria-controls", slide.id);
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.setAttribute("aria-selected", String(index === 0));
    tab.dataset.action = "carousel-slide";
    tab.dataset.index = String(index);
    tab.innerHTML = "<span></span>";
    picker.append(tab);
  });
  demo.dataset.currentSlide = "0";
  setCarouselSlide(sample, demo, 0, { scroll: false, announce: false });

  let scheduledFrame = 0;
  let scrollSettleTimer = 0;
  const syncSlideFromScroll = () => {
    if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(() => {
      scheduledFrame = 0;
      const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
      setCarouselSlide(sample, demo, index, { scroll: false });
    });
  };
  const finishProgrammaticScroll = () => {
    if (viewport.dataset.programmaticScroll !== "true") return;
    delete viewport.dataset.programmaticScroll;
    window.clearTimeout(scrollSettleTimer);
    scrollSettleTimer = 0;
    syncSlideFromScroll();
  };
  viewport.addEventListener("scroll", () => {
    if (viewport.dataset.programmaticScroll === "true") {
      window.clearTimeout(scrollSettleTimer);
      scrollSettleTimer = window.setTimeout(finishProgrammaticScroll, 160);
      return;
    }
    syncSlideFromScroll();
  }, { passive: true });
  viewport.addEventListener("scrollend", finishProgrammaticScroll, { passive: true });
}

function initializeTextScramble(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-scramble");
  const output = demo?.querySelector<HTMLElement>(".sample-scramble-output");
  const status = demo?.querySelector<HTMLElement>("[data-scramble-status]");
  const progress = demo?.querySelector<HTMLElement>(".sample-scramble-progress > span");
  if (!demo || !output || !status) return;

  textScrambleControllers.get(sample)?.cleanup();
  const target = demo.dataset.scrambleTarget ?? output.textContent ?? "";
  const characters = Array.from(target);
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!?#+";
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let holdTimer = 0;
  let observer: IntersectionObserver | null = null;

  const showFinalText = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    demo.classList.remove("is-running");
    output.textContent = target;
    status.textContent = "DECODED";
    if (progress) progress.style.transform = "scaleX(1)";
  };

  const replay = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = 0;
    demo.classList.remove("is-running");
    output.textContent = target;
    if (progress) progress.style.transform = "scaleX(1)";
    if (motionPreference.matches) {
      status.textContent = "DECODED";
      return;
    }

    demo.classList.add("is-running");
    status.textContent = "DECRYPTING…";
    if (progress) progress.style.transform = "scaleX(0)";
    const leadIn = 400;
    const lockInterval = 128;
    const duration = leadIn + lockInterval * (characters.length + 2);
    const decodedHold = 2160;
    let startedAt: number | null = null;
    const tick = (timestamp: number) => {
      startedAt ??= timestamp;
      const elapsed = timestamp - startedAt;
      const amount = Math.min(1, Math.max(0, (elapsed - leadIn) / (duration - leadIn)));
      const settledCount = Math.min(characters.length, Math.max(0, Math.floor((elapsed - leadIn) / lockInterval)));
      output.textContent = characters.map((character, index) => {
        if (character === " " || index < settledCount) return character;
        return charset[Math.floor(Math.random() * charset.length)];
      }).join("");
      if (progress) progress.style.transform = `scaleX(${amount})`;
      if (elapsed >= duration) {
        showFinalText();
        holdTimer = window.setTimeout(replay, decodedHold);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
    if (!event.matches) return;
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = 0;
    showFinalText();
  };
  motionPreference.addEventListener("change", onMotionPreferenceChange);
  const cleanup = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = 0;
    observer?.disconnect();
    observer = null;
    motionPreference.removeEventListener("change", onMotionPreferenceChange);
  };
  textScrambleControllers.set(sample, { replay, cleanup });

  output.textContent = target;
  status.textContent = "DECODE SEQUENCE";
  if (progress) progress.style.transform = "scaleX(1)";
  if (motionPreference.matches) {
    status.textContent = "DECODED";
    return;
  }

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      observer = null;
      replay();
    }, { threshold: 0.3 });
    observer.observe(demo);
  } else {
    replay();
  }
}

const paginationResultPages = [
  [
    ["Brand foundations", "Identity basics for teams building a consistent brand."],
    ["Website structure", "A practical guide to organizing pages and content."],
    ["Project kickoff", "Start a new project with clear goals and ownership."],
  ],
  [
    ["Brand system", "Shared colors, type, and interface guidance."],
    ["Design principles", "A common language for everyday product decisions."],
    ["Launch checklist", "The final details to review before release."],
  ],
  [
    ["Component library", "Reusable patterns for a consistent product experience."],
    ["Content guide", "Write helpful interface copy with a consistent voice."],
    ["Accessibility notes", "Small implementation choices with a wider impact."],
  ],
  [
    ["Research summary", "Bring user findings together in one useful overview."],
    ["Product roadmap", "Keep upcoming work visible to the whole team."],
    ["Design review", "Collect focused feedback before the next iteration."],
  ],
  [
    ["Campaign planning", "Coordinate messages, assets, and launch dates."],
    ["Team workspace", "A shared home for the work your team is doing."],
    ["Release notes", "Make recent improvements easy to discover."],
  ],
  [
    ["Customer stories", "Share how people use the product in their work."],
    ["Visual direction", "Explore the look and feel for an upcoming project."],
    ["Site map", "See the structure behind the public website."],
  ],
  [
    ["Content library", "Find approved language and reusable resources."],
    ["Project archive", "Keep completed work easy to revisit."],
    ["Team updates", "Stay current on what changed across the workspace."],
  ],
  [
    ["Getting started", "A short route to the most useful resources."],
    ["Brand assets", "Download current marks, colors, and templates."],
    ["Contact the team", "Find the right person for your next question."],
  ],
] as const;

function renderPaginationResults(owner: HTMLElement, page: number, animate = false) {
  const results = owner.querySelector<HTMLElement>("[data-pagination-results]");
  if (!results) return;
  const entries = paginationResultPages[page - 1] ?? paginationResultPages[0];
  results.replaceChildren(...entries.map(([title, description]) => {
    const item = document.createElement("article");
    item.className = "sample-pagination-result";
    const heading = document.createElement("strong");
    heading.textContent = title;
    const copy = document.createElement("span");
    copy.textContent = description;
    item.append(heading, copy);
    return item;
  }));
  results.setAttribute("aria-label", `Search results, page ${page}`);
  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    results.classList.remove("is-changing");
    void results.offsetWidth;
    results.classList.add("is-changing");
  }
}

function renderPagination(owner: HTMLElement, animateResults = false) {
  const total = Math.max(1, Number(owner.dataset.totalPages) || 1);
  const page = Math.max(1, Math.min(total, Number(owner.dataset.currentPage) || 1));
  owner.dataset.currentPage = String(page);
  const list = owner.querySelector<HTMLOListElement>("[data-pagination-pages]");
  const summary = owner.querySelector<HTMLElement>("[data-pagination-summary]");
  const previous = owner.querySelector<HTMLButtonElement>("[data-action='pagination-previous']");
  const next = owner.querySelector<HTMLButtonElement>("[data-action='pagination-next']");
  if (!list || !summary || !previous || !next) return;

  const visible = total <= 5
    ? Array.from({ length: total }, (_, index) => index + 1)
    : [...new Set([1, page - 1, page, page + 1, total])]
      .filter((value) => value >= 1 && value <= total)
      .sort((left, right) => left - right);
  const items: Array<number | "ellipsis"> = [];
  visible.forEach((value, index) => {
    const prior = visible[index - 1];
    if (prior !== undefined && value - prior === 2) items.push(prior + 1);
    else if (prior !== undefined && value - prior > 2) items.push("ellipsis");
    items.push(value);
  });

  list.replaceChildren(...items.map((value) => {
    const item = document.createElement("li");
    if (value === "ellipsis") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "sample-pagination-ellipsis";
      ellipsis.setAttribute("aria-label", "More pages");
      const glyph = document.createElement("span");
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = "…";
      const label = document.createElement("span");
      label.className = "sample-pagination-sr-only";
      label.textContent = "More pages";
      ellipsis.append(glyph, label);
      item.append(ellipsis);
      return item;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-pagination-page";
    button.dataset.action = "pagination-page-select";
    button.dataset.page = String(value);
    button.setAttribute("aria-label", `Go to page ${value}`);
    button.textContent = String(value);
    if (value === page) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "page");
    }
    item.append(button);
    return item;
  }));

  previous.disabled = page === 1;
  next.disabled = page === total;
  summary.textContent = `Page ${page} of ${total}`;
  renderPaginationResults(owner, page, animateResults);
}

function changePaginationPage(owner: HTMLElement, page: number) {
  const total = Math.max(1, Number(owner.dataset.totalPages) || 1);
  const current = Math.max(1, Math.min(total, Number(owner.dataset.currentPage) || 1));
  const next = Math.max(1, Math.min(total, page));
  if (next === current) return;
  owner.dataset.currentPage = String(next);
  renderPagination(owner, true);
  owner.querySelector<HTMLButtonElement>(`[data-action='pagination-page-select'][data-page='${next}']`)?.focus({ preventScroll: true });
  const sample = owner.closest<HTMLElement>(".ui-sample");
  if (sample) announce(sample, `Page ${next} of ${total} search results.`);
}

function setPaginationSlide(owner: HTMLElement, slide: number, announceChange = false) {
  const slides = Array.from(owner.querySelectorAll<HTMLElement>("[data-pagination-slide-panel]"));
  const next = Math.max(1, Math.min(slides.length, slide));
  owner.dataset.currentSlide = String(next);
  slides.forEach((panel) => {
    panel.hidden = Number(panel.dataset.paginationSlidePanel) !== next;
  });
  owner.querySelectorAll<HTMLButtonElement>("[data-action='pagination-slide']").forEach((button) => {
    const selected = Number(button.dataset.slide) === next;
    if (selected) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
    button.classList.toggle("is-current", selected);
  });
  const active = slides.find((panel) => Number(panel.dataset.paginationSlidePanel) === next);
  active?.classList.remove("is-entering");
  if (active && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    void active.offsetWidth;
    active.classList.add("is-entering");
  }
  if (announceChange) {
    const sample = owner.closest<HTMLElement>(".ui-sample");
    const title = active?.querySelector("strong")?.textContent?.trim() ?? `Slide ${next}`;
    if (sample) announce(sample, `${title}, slide ${next} of ${slides.length}.`);
  }
}

function initializePagination(sample: HTMLElement) {
  const owner = sample.querySelector<HTMLElement>(".sample-pagination-demo");
  if (!owner) return;
  renderPagination(owner);
  setPaginationSlide(owner, Number(owner.dataset.currentSlide) || 1);
}

function pauseToastDismissal(toast: HTMLElement) {
  const state = toastTimerStates.get(toast);
  if (!state || state.timer === null) return;
  window.clearTimeout(state.timer);
  state.timer = null;
  state.remaining = Math.max(0, state.deadline - Date.now());
}

function resumeToastDismissal(toast: HTMLElement) {
  const state = toastTimerStates.get(toast);
  if (!state || state.timer !== null || state.exitTimer !== null || toast.hidden) return;
  const delay = Math.max(0, state.remaining);
  state.deadline = Date.now() + delay;
  state.timer = window.setTimeout(() => {
    state.timer = null;
    state.remaining = 0;
    dismissToastWithExit(toast);
  }, delay);
}

function finishToastDismissal(toast: HTMLElement) {
  const state = toastTimerStates.get(toast);
  if (state?.exitTimer !== null && state?.exitTimer !== undefined) {
    window.clearTimeout(state.exitTimer);
    state.exitTimer = null;
  }
  toast.hidden = true;
  toast.inert = true;
  toast.removeAttribute("data-toast-state");
}

function dismissToastWithExit(toast: HTMLElement) {
  const state = toastTimerStates.get(toast);
  if (toast.hidden || (state && state.exitTimer !== null)) return;
  if (state?.timer !== null && state?.timer !== undefined) {
    window.clearTimeout(state.timer);
    state.timer = null;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishToastDismissal(toast);
    return;
  }

  toast.inert = true;
  toast.dataset.toastState = "exiting";
  if (state) state.exitTimer = window.setTimeout(() => finishToastDismissal(toast), 180);
  else window.setTimeout(() => finishToastDismissal(toast), 180);
}

function startToastDismissal(toast: HTMLElement) {
  const state = toastTimerStates.get(toast);
  if (!state) return;
  if (state.timer !== null) window.clearTimeout(state.timer);
  if (state.exitTimer !== null) window.clearTimeout(state.exitTimer);
  state.timer = null;
  state.exitTimer = null;
  state.remaining = 5000;
  toast.hidden = false;
  toast.inert = false;
  toast.removeAttribute("data-toast-state");
  resumeToastDismissal(toast);
}

function initializeToastSample(sample: HTMLElement) {
  const toast = sample.querySelector<HTMLElement>(".sample-toast");
  if (!toast || toastTimerStates.has(toast)) return;

  const state: ToastTimerState = { timer: null, exitTimer: null, deadline: 0, remaining: 5000 };
  const pause = () => pauseToastDismissal(toast);
  const resume = () => resumeToastDismissal(toast);
  const resumeAfterFocus = (event: FocusEvent) => {
    if (!toast.contains(event.relatedTarget as Node | null)) resume();
  };
  toast.addEventListener("pointerenter", pause);
  toast.addEventListener("pointerleave", resume);
  toast.addEventListener("focusin", pause);
  toast.addEventListener("focusout", resumeAfterFocus);
  toastTimerStates.set(toast, state);
  toastSampleCleanups.set(sample, () => {
    if (state.timer !== null) window.clearTimeout(state.timer);
    if (state.exitTimer !== null) window.clearTimeout(state.exitTimer);
    toast.removeEventListener("pointerenter", pause);
    toast.removeEventListener("pointerleave", resume);
    toast.removeEventListener("focusin", pause);
    toast.removeEventListener("focusout", resumeAfterFocus);
    toastTimerStates.delete(toast);
  });
}

function positionOverlayPopover(trigger: HTMLElement, popover: HTMLElement, keepBelow = false) {
  let triggerBounds = trigger.getBoundingClientRect();
  const popoverBounds = popover.getBoundingClientRect();
  const margin = 12;
  const gap = 8;
  const popupBuffer = 4;
  const maxLeft = Math.max(margin, window.innerWidth - popoverBounds.width - margin);
  const left = Math.min(Math.max(margin, triggerBounds.left), maxLeft);
  const desiredHeight = Math.min(384, popover.scrollHeight);
  let below = triggerBounds.bottom + gap;

  if (keepBelow && below + desiredHeight + popupBuffer > window.innerHeight - margin) {
    window.scrollBy({ top: below + desiredHeight + popupBuffer - (window.innerHeight - margin), behavior: "instant" });
    triggerBounds = trigger.getBoundingClientRect();
    below = triggerBounds.bottom + gap;
  }

  popover.style.left = `${left}px`;
  popover.style.top = `${below}px`;
  popover.style.removeProperty("max-height");
}

function repositionOverlayPopovers() {
  document.querySelectorAll<HTMLElement>(".sample-overlay-popover:popover-open").forEach((popover) => {
    const trigger = document.querySelector<HTMLElement>(`[popovertarget='${popover.id}']`);
    if (trigger) positionOverlayPopover(trigger, popover);
  });
}

window.addEventListener("resize", repositionOverlayPopovers);
document.addEventListener("scroll", repositionOverlayPopovers, true);

function initializeOverlayTrio(sample: HTMLElement) {
  const instance = sample.dataset.sampleInstance ?? "example";
  const popoverTrigger = sample.querySelector<HTMLButtonElement>(".sample-overlay-popover-example .sample-anchor");
  const popover = sample.querySelector<HTMLElement>(".sample-overlay-popover");
  if (popoverTrigger && popover) {
    const id = `sample-overlay-popover-${instance}`;
    popover.id = id;
    popover.setAttribute("aria-label", "Filter projects");
    popoverTrigger.setAttribute("aria-controls", id);
    popoverTrigger.setAttribute("aria-expanded", String(popover.matches(":popover-open")));
    popoverTrigger.setAttribute("aria-haspopup", "dialog");
    popoverTrigger.setAttribute("popovertarget", id);
    popoverTrigger.setAttribute("popovertargetaction", "toggle");
    const close = popover.querySelector<HTMLButtonElement>("[data-action='overlay-close']");
    if (close) setAction(close, "overlay-close");

    if (!initializedOverlayPopovers.has(popover)) {
      popover.addEventListener("toggle", (event) => {
        const state = (event as Event & { newState?: string }).newState;
        const isOpen = state === "open" || popover.matches(":popover-open");
        popoverTrigger.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) requestAnimationFrame(() => positionOverlayPopover(popoverTrigger, popover, true));
        else if (popover.contains(document.activeElement)) popoverTrigger.focus({ preventScroll: true });
      });
      popoverTrigger.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" || popover.matches(":popover-open")) return;
        event.preventDefault();
        popover.showPopover();
        requestAnimationFrame(() => popover.querySelector<HTMLInputElement>("input:not([disabled])")?.focus());
      });
      initializedOverlayPopovers.add(popover);
    }
  }

  const menuTrigger = sample.querySelector<HTMLButtonElement>(".sample-overlay-menu-example .sample-anchor");
  const menu = sample.querySelector<HTMLElement>(".sample-overlay-menu-example [role='menu']");
  if (menuTrigger && menu) {
    const id = `sample-overlay-menu-${instance}`;
    menu.id = id;
    menuTrigger.setAttribute("aria-controls", id);
    menuTrigger.setAttribute("aria-expanded", String(!menu.hidden));
    menuTrigger.setAttribute("aria-haspopup", "menu");
    setAction(menuTrigger, "toggle-popover");
    menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']").forEach((item) => {
      setAction(item, "menu-command");
    });
  }

  const tooltipTrigger = sample.querySelector<HTMLButtonElement>(".sample-overlay-tooltip-example [data-tooltip-trigger]");
  const tooltip = sample.querySelector<HTMLElement>(".sample-overlay-tooltip-example [role='tooltip']");
  if (tooltipTrigger && tooltip) {
    tooltip.id = `sample-overlay-tooltip-${instance}`;
    tooltipTrigger.setAttribute("aria-describedby", tooltip.id);
    tooltipTrigger.removeAttribute("aria-expanded");
    tooltipTrigger.removeAttribute("aria-haspopup");
    tooltipTrigger.removeAttribute("data-action");
  }
}

const surfaceFeedbackTimers = new WeakMap<HTMLElement, number>();

function hideSurfaceFeedback(feedback: HTMLElement) {
  const timer = surfaceFeedbackTimers.get(feedback);
  if (timer !== undefined) window.clearTimeout(timer);
  surfaceFeedbackTimers.delete(feedback);
  feedback.hidden = true;
  feedback.textContent = "";
}

function showSurfaceFeedback(feedback: HTMLElement, message: string) {
  const previousTimer = surfaceFeedbackTimers.get(feedback);
  if (previousTimer !== undefined) window.clearTimeout(previousTimer);
  feedback.hidden = false;
  feedback.textContent = message;
  const timer = window.setTimeout(() => {
    if (surfaceFeedbackTimers.get(feedback) !== timer) return;
    feedback.hidden = true;
    feedback.textContent = "";
    surfaceFeedbackTimers.delete(feedback);
  }, 3000);
  surfaceFeedbackTimers.set(feedback, timer);
}

function initializeSurfaceDemo(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-surface-demo");
  const controls = demo?.querySelectorAll<HTMLButtonElement>(".sample-surface-options [data-action='surface-select']");
  const panels = Array.from(demo?.querySelectorAll<HTMLDialogElement>("dialog[data-surface-panel]") ?? []);
  if (!demo || !controls || panels.length === 0) return;

  const selectedSurface = demo.dataset.surface ?? "dialog";
  const field = demo.querySelector<HTMLInputElement>(".sample-surface-field input");
  const label = demo.querySelector<HTMLLabelElement>(".sample-surface-field label");
  if (field && label) {
    field.id = `surface-project-name-${sample.dataset.sampleInstance ?? "example"}`;
    label.htmlFor = field.id;
  }

  const instance = sample.dataset.sampleInstance ?? "example";
  const feedback = demo.querySelector<HTMLElement>("[data-surface-feedback]");
  panels.forEach((panel) => {
    const surface = panel.dataset.surfacePanel ?? "dialog";
    const title = panel.querySelector<HTMLElement>("h3");
    const description = panel.querySelector<HTMLElement>(":scope > p");
    panel.id = `sample-surface-${surface}-${instance}`;
    if (title) {
      title.id = `${panel.id}-title`;
      panel.setAttribute("aria-labelledby", title.id);
    }
    if (description) {
      description.id = `${panel.id}-description`;
      panel.setAttribute("aria-describedby", description.id);
    }

    if (!initializedSurfaceDialogs.has(panel)) {
      panel.addEventListener("close", () => {
        const openPanel = panels.find((candidate) => candidate.open);
        demo.dataset.surfaceOpen = String(Boolean(openPanel));
        controls.forEach((control) => {
          control.setAttribute("aria-expanded", String(control.dataset.surface === openPanel?.dataset.surfacePanel));
        });

        if (feedback?.hidden) {
          const label = surface.charAt(0).toUpperCase() + surface.slice(1);
          showSurfaceFeedback(feedback, `${label} example closed.`);
        }
      });
      panel.addEventListener("click", (event) => {
        if (event.target !== panel) return;
        const rect = panel.getBoundingClientRect();
        const { clientX, clientY } = event as MouseEvent;
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          const label = surface.charAt(0).toUpperCase() + surface.slice(1);
          closeSurfaceDemo(sample, `${label} example closed.`);
        }
      });
      initializedSurfaceDialogs.add(panel);
    }
  });

  controls.forEach((control) => {
    const panel = panels.find((candidate) => candidate.dataset.surfacePanel === control.dataset.surface);
    if (panel) {
      control.setAttribute("aria-controls", panel.id);
      control.setAttribute("aria-haspopup", "dialog");
      control.setAttribute("aria-expanded", String(panel.open));
    }
  });

  const openPanel = panels.find((panel) => panel.open);
  demo.dataset.surface = openPanel?.dataset.surfacePanel ?? selectedSurface;
  demo.dataset.surfaceOpen = String(Boolean(openPanel));
}

function closeSurfaceDemo(sample: HTMLElement, message: string) {
  const demo = sample.querySelector<HTMLElement>(".sample-surface-demo");
  const panel = demo?.querySelector<HTMLDialogElement>("dialog[data-surface-panel][open]");
  const feedback = demo?.querySelector<HTMLElement>("[data-surface-feedback]");
  if (!demo || !panel || !feedback) return;

  demo.dataset.surfaceOpen = "false";
  showSurfaceFeedback(feedback, message);
  panel.close();
}

function initializeScrimDemo(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-scrim-demo");
  const background = demo?.querySelector<HTMLElement>(".sample-scrim-workspace");
  const backdrop = demo?.querySelector<HTMLElement>(".sample-scrim-backdrop");
  const panel = demo?.querySelector<HTMLElement>(".sample-scrim-dialog");
  const trigger = demo?.querySelector<HTMLButtonElement>(".sample-scrim-open");
  const title = demo?.querySelector<HTMLElement>(".sample-scrim-dialog h3");
  const description = demo?.querySelector<HTMLElement>(".sample-scrim-dialog p");
  if (!demo || !background || !backdrop || !panel || !trigger || !title || !description) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  const previewDialog = sample.closest<HTMLDialogElement>(".element-demo-dialog");
  const previewClose = previewDialog?.querySelector<HTMLButtonElement>("[data-close-demo]");
  title.id = `sample-scrim-title-${instance}`;
  description.id = `sample-scrim-description-${instance}`;
  panel.setAttribute("aria-labelledby", title.id);
  panel.setAttribute("aria-describedby", description.id);
  panel.setAttribute("aria-modal", String(Boolean(previewDialog)));
  trigger.setAttribute("aria-controls", panel.id = `sample-scrim-dialog-${instance}`);
  trigger.setAttribute("aria-expanded", String(demo.dataset.scrimOpen !== "false"));
  setAction(trigger, "scrim-open");
  panel.querySelectorAll<HTMLButtonElement>("[data-action='scrim-close']").forEach((button) => {
    setAction(button, "scrim-close");
  });

  const isOpen = demo.dataset.scrimOpen !== "false";
  demo.dataset.scrimOpen = String(isOpen);
  demo.dataset.scrimClosing = "false";
  background.inert = isOpen;
  backdrop.hidden = !isOpen;
  panel.hidden = !isOpen;
  if (previewClose) previewClose.disabled = isOpen;
}

const keyRepeatValueLabels: Record<string, string> = {
  "0": "Slowest",
  "25": "Slow",
  "50": "Normal",
  "75": "Fast",
  "100": "Fastest",
};

function updateKeyRepeatSlider(sample: HTMLElement) {
  const slider = sample.querySelector<HTMLInputElement>("[data-tick-range]");
  const output = sample.querySelector<HTMLOutputElement>("[data-repeat-output]");
  if (!slider || !output) return;
  const label = keyRepeatValueLabels[slider.value] ?? "Normal";
  slider.setAttribute("aria-valuetext", label);
  output.textContent = label;
}

function updateVolumeSlider(sample: HTMLElement) {
  const slider = sample.querySelector<HTMLInputElement>("[data-volume-control]");
  const output = sample.querySelector<HTMLOutputElement>("[data-volume-output]");
  const muteButton = sample.querySelector<HTMLButtonElement>("[data-action='volume-mute']");
  if (!slider || !output || !muteButton) return;

  const isMuted = Number(slider.value) === 0;
  output.textContent = isMuted ? "Muted" : `${slider.value}%`;
  slider.setAttribute("aria-valuetext", isMuted ? "Muted" : `${slider.value}%`);
  muteButton.setAttribute("aria-pressed", String(isMuted));
  muteButton.setAttribute("aria-label", isMuted ? "Unmute volume" : "Mute volume");
  const icon = muteButton.querySelector<HTMLElement>(".ui-icon");
  if (icon) {
    icon.dataset.lucide = isMuted ? "volume-x" : "volume-2";
    renderIcons(muteButton);
  }
}

function initializeVolumeSlider(sample: HTMLElement) {
  const instance = sample.dataset.sampleInstance ?? "example";
  const volume = sample.querySelector<HTMLInputElement>("[data-volume-control]");
  const keyRepeat = sample.querySelector<HTMLInputElement>("[data-tick-range]");
  const volumeLabel = sample.querySelector<HTMLLabelElement>(".sample-volume-setting:first-child label");
  const keyRepeatLabel = sample.querySelector<HTMLLabelElement>(".sample-volume-discrete label");
  const volumeOutput = sample.querySelector<HTMLOutputElement>("[data-volume-output]");
  const keyRepeatOutput = sample.querySelector<HTMLOutputElement>("[data-repeat-output]");
  const volumeHint = sample.querySelector<HTMLElement>("[data-volume-hint]");
  const keyRepeatHint = sample.querySelector<HTMLElement>("[data-repeat-hint]");
  const muteButton = sample.querySelector<HTMLButtonElement>("[data-action='volume-mute']");
  if (!volume || !keyRepeat || !volumeLabel || !keyRepeatLabel || !volumeOutput || !keyRepeatOutput || !volumeHint || !keyRepeatHint || !muteButton) return;

  volume.id = `volume-level-${instance}`;
  keyRepeat.id = `key-repeat-level-${instance}`;
  volumeLabel.htmlFor = volume.id;
  keyRepeatLabel.htmlFor = keyRepeat.id;
  volumeHint.id = `volume-hint-${instance}`;
  keyRepeatHint.id = `key-repeat-hint-${instance}`;
  volumeOutput.htmlFor = volume.id;
  keyRepeatOutput.htmlFor = keyRepeat.id;
  volume.setAttribute("aria-describedby", volumeHint.id);
  keyRepeat.setAttribute("aria-describedby", keyRepeatHint.id);
  volume.dataset.inputAction = "volume";
  keyRepeat.dataset.inputAction = "volume-ticks";
  setAction(muteButton, "volume-mute", "Mute volume");
  volume.dataset.previousVolume = volume.value === "0" ? "65" : volume.value;
  updateVolumeSlider(sample);
  updateKeyRepeatSlider(sample);
}

function emptyTrashPreferenceIsSaved() {
  try {
    return window.localStorage.getItem(emptyTrashSuppressionKey) === "true";
  } catch {
    return false;
  }
}

function setEmptyTrashPreference(saved: boolean) {
  try {
    if (saved) window.localStorage.setItem(emptyTrashSuppressionKey, "true");
    else window.localStorage.removeItem(emptyTrashSuppressionKey);
  } catch {
    // The example still works when browser storage is unavailable.
  }
}

function initializeEmptyTrashAlert(sample: HTMLElement) {
  const instance = sample.dataset.sampleInstance ?? "example";
  const demo = sample.querySelector<HTMLElement>(".sample-trash");
  const trigger = demo?.querySelector<HTMLButtonElement>("[data-action='trash-open']");
  const dialog = demo?.querySelector<HTMLDialogElement>("[data-trash-dialog]");
  const title = dialog?.querySelector<HTMLElement>("#sample-trash-title");
  const description = dialog?.querySelector<HTMLElement>("#sample-trash-description");
  const checkbox = dialog?.querySelector<HTMLInputElement>("[data-trash-suppression]");
  const count = demo?.querySelector<HTMLElement>("[data-trash-count]");
  const items = demo?.querySelector<HTMLElement>(".sample-trash-items");
  const emptyState = demo?.querySelector<HTMLElement>("[data-trash-empty]");
  const resetPreference = demo?.querySelector<HTMLButtonElement>("[data-action='trash-reset-preference']");
  if (!demo || !trigger || !dialog || !title || !description || !checkbox || !count || !items || !emptyState || !resetPreference) return;

  title.id = `sample-trash-title-${instance}`;
  description.id = `sample-trash-description-${instance}`;
  dialog.id = `sample-trash-dialog-${instance}`;
  dialog.setAttribute("aria-labelledby", title.id);
  dialog.setAttribute("aria-describedby", description.id);
  trigger.setAttribute("aria-controls", dialog.id);
  trigger.setAttribute("aria-expanded", "false");
  checkbox.checked = emptyTrashPreferenceIsSaved();
  resetPreference.hidden = !checkbox.checked;

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeEmptyTrashAlert(sample, "Empty Trash canceled. All 8 example items remain.");
  });
}

function openEmptyTrashAlert(sample: HTMLElement) {
  const dialog = sample.querySelector<HTMLDialogElement>("[data-trash-dialog]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='trash-open']");
  const checkbox = sample.querySelector<HTMLInputElement>("[data-trash-suppression]");
  if (!dialog || !trigger || !checkbox) return;

  if (emptyTrashPreferenceIsSaved()) {
    checkbox.checked = true;
    completeEmptyTrash(sample, "The saved preference skipped this confirmation. No files were changed in the preview.");
    return;
  }

  checkbox.checked = false;
  if (!dialog.open) dialog.showModal();
  trigger.setAttribute("aria-expanded", "true");
}

function closeEmptyTrashAlert(sample: HTMLElement, message: string) {
  const dialog = sample.querySelector<HTMLDialogElement>("[data-trash-dialog]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='trash-open']");
  if (dialog?.open) dialog.close();
  trigger?.setAttribute("aria-expanded", "false");
  const feedback = sample.querySelector<HTMLElement>("[data-trash-feedback]");
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = false;
  }
  trigger?.focus({ preventScroll: true });
}

function completeEmptyTrash(sample: HTMLElement, message = "The example Trash was emptied. No files were changed on your device.") {
  const dialog = sample.querySelector<HTMLDialogElement>("[data-trash-dialog]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='trash-open']");
  const checkbox = sample.querySelector<HTMLInputElement>("[data-trash-suppression]");
  const count = sample.querySelector<HTMLElement>("[data-trash-count]");
  const items = sample.querySelector<HTMLElement>(".sample-trash-items");
  const emptyState = sample.querySelector<HTMLElement>("[data-trash-empty]");
  const resetPreference = sample.querySelector<HTMLButtonElement>("[data-action='trash-reset-preference']");
  const feedback = sample.querySelector<HTMLElement>("[data-trash-feedback]");
  if (checkbox?.checked) setEmptyTrashPreference(true);
  if (dialog?.open) dialog.close();
  if (trigger) {
    trigger.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
  if (count) count.textContent = "0 items";
  if (items) items.hidden = true;
  if (emptyState) emptyState.hidden = false;
  if (resetPreference) resetPreference.hidden = !emptyTrashPreferenceIsSaved();
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = false;
  }
  feedback?.focus({ preventScroll: true });
}

function restoreEmptyTrashSample(sample: HTMLElement) {
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='trash-open']");
  const count = sample.querySelector<HTMLElement>("[data-trash-count]");
  const items = sample.querySelector<HTMLElement>(".sample-trash-items");
  const emptyState = sample.querySelector<HTMLElement>("[data-trash-empty]");
  const feedback = sample.querySelector<HTMLElement>("[data-trash-feedback]");
  if (trigger) trigger.hidden = false;
  if (count) count.textContent = "8 items";
  if (items) items.hidden = false;
  if (emptyState) emptyState.hidden = true;
  if (feedback) {
    feedback.textContent = "Restored the 8 example items. The saved alert preference is unchanged.";
    feedback.hidden = false;
  }
  trigger?.focus({ preventScroll: true });
}

function setScrimDemoOpen(sample: HTMLElement, isOpen: boolean, moveFocus = false) {
  const demo = sample.querySelector<HTMLElement>(".sample-scrim-demo");
  const background = demo?.querySelector<HTMLElement>(".sample-scrim-workspace");
  const backdrop = demo?.querySelector<HTMLElement>(".sample-scrim-backdrop");
  const panel = demo?.querySelector<HTMLElement>(".sample-scrim-dialog");
  const trigger = demo?.querySelector<HTMLButtonElement>(".sample-scrim-open");
  if (!demo || !background || !backdrop || !panel || !trigger) return;
  if ((demo.dataset.scrimOpen === "true") === isOpen) return;

  demo.dataset.scrimOpen = String(isOpen);
  trigger.setAttribute("aria-expanded", String(isOpen));
  const previewClose = sample.closest<HTMLDialogElement>(".element-demo-dialog")
    ?.querySelector<HTMLButtonElement>("[data-close-demo]");

  if (isOpen) {
    demo.dataset.scrimClosing = "false";
    background.inert = true;
    backdrop.inert = false;
    panel.inert = false;
    backdrop.hidden = false;
    panel.hidden = false;
    if (previewClose) previewClose.disabled = true;
    if (moveFocus) panel.querySelector<HTMLButtonElement>(".sample-scrim-close")?.focus({ preventScroll: true });
    announce(sample, "Focused task opened. The workspace is dimmed and inactive.");
    return;
  }

  demo.dataset.scrimClosing = "true";
  background.inert = true;
  if (previewClose) previewClose.disabled = true;

  const finishClose = () => {
    if (demo.dataset.scrimOpen !== "false") return;
    backdrop.hidden = true;
    panel.hidden = true;
    background.inert = false;
    demo.dataset.scrimClosing = "false";
    if (previewClose) previewClose.disabled = false;
    if (moveFocus) trigger.focus({ preventScroll: true });
    announce(sample, "Focused task closed. The workspace is active again.");
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finishClose();
  else window.setTimeout(finishClose, 180);
}

function cleanupToastSample(sample: HTMLElement) {
  toastSampleCleanups.get(sample)?.();
  toastSampleCleanups.delete(sample);
}

function visibleStatus(className: string) {
  const status = document.createElement("p");
  status.className = `${className} sample-feedback-status`;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.tabIndex = -1;
  status.hidden = true;
  return status;
}

function initializeDisclosureSample(sample: HTMLElement) {
  sample.querySelectorAll<HTMLButtonElement>(".sample-disclosure-row[data-action='toggle-disclosure']").forEach((button, index) => {
    const branch = button.closest<HTMLElement>(".sample-disclosure-branch");
    const children = branch?.querySelector<HTMLElement>(":scope > .sample-disclosure-children");
    if (!children) return;

    const contentId = `sample-disclosure-${sample.dataset.sampleInstance}-${index + 1}`;
    const expanded = button.getAttribute("aria-expanded") === "true";
    children.id = contentId;
    children.dataset.state = expanded ? "open" : "closed";
    button.setAttribute("aria-controls", contentId);
    children.hidden = !expanded;
    children.inert = !expanded;
    if (expanded) children.removeAttribute("aria-hidden");
    else children.setAttribute("aria-hidden", "true");
  });
}

const disclosurePanelAnimations = new WeakMap<HTMLElement, Animation>();

function transitionDisclosurePanel(button: HTMLButtonElement, panel: HTMLElement, open: boolean) {
  const currentHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  const currentOpacity = panel.hidden ? 0 : Number.parseFloat(window.getComputedStyle(panel).opacity) || 1;
  disclosurePanelAnimations.get(panel)?.cancel();
  disclosurePanelAnimations.delete(panel);
  button.setAttribute("aria-expanded", String(open));

  if (open) {
    panel.hidden = false;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
  } else {
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
  }

  panel.dataset.state = open ? "opening" : "closing";
  panel.style.height = `${currentHeight}px`;
  panel.style.overflow = "hidden";

  const targetHeight = open ? panel.scrollHeight : 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(currentHeight - targetHeight) < 0.5) {
    panel.style.removeProperty("height");
    panel.style.removeProperty("overflow");
    panel.hidden = !open;
    panel.inert = !open;
    panel.dataset.state = open ? "open" : "closed";
    if (open) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    return;
  }

  void panel.offsetHeight;
  const animation = panel.animate(
    [
      { height: `${currentHeight}px`, opacity: currentOpacity },
      { height: `${targetHeight}px`, opacity: open ? 1 : 0 },
    ],
    { duration: 190, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
  );
  disclosurePanelAnimations.set(panel, animation);

  void animation.finished.then(() => {
    if (disclosurePanelAnimations.get(panel) !== animation) return;
    disclosurePanelAnimations.delete(panel);
    animation.cancel();
    panel.style.removeProperty("height");
    panel.style.removeProperty("overflow");
    panel.hidden = !open;
    panel.inert = !open;
    panel.dataset.state = open ? "open" : "closed";
    if (open) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  }).catch(() => undefined);
}

const accordionPanelAnimations = new WeakMap<HTMLElement, Animation>();

function transitionAccordionPanel(details: HTMLDetailsElement, panel: HTMLElement, open: boolean) {
  const currentHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  const currentOpacity = panel.hidden ? 0 : Number.parseFloat(window.getComputedStyle(panel).opacity) || 0;
  accordionPanelAnimations.get(panel)?.cancel();
  accordionPanelAnimations.delete(panel);

  if (open) panel.hidden = false;
  panel.dataset.state = open ? "opening" : "closing";
  panel.style.height = `${currentHeight}px`;
  panel.style.overflow = "hidden";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targetHeight = open ? panel.scrollHeight : 0;
  if (reducedMotion || Math.abs(currentHeight - targetHeight) < 0.5) {
    panel.style.removeProperty("height");
    panel.style.removeProperty("overflow");
    panel.hidden = !open;
    panel.dataset.state = open ? "open" : "closed";
    if (details.open !== open) details.open = open;
    return;
  }

  void panel.offsetHeight;
  const animation = panel.animate(
    [
      { height: `${currentHeight}px`, opacity: currentOpacity },
      { height: `${targetHeight}px`, opacity: open ? 1 : 0 },
    ],
    { duration: 230, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
  );
  accordionPanelAnimations.set(panel, animation);

  if (!open && details.open) details.open = false;

  void animation.finished.then(() => {
    if (accordionPanelAnimations.get(panel) !== animation) return;
    accordionPanelAnimations.delete(panel);
    animation.cancel();
    panel.style.removeProperty("height");
    panel.style.removeProperty("overflow");
    panel.hidden = !open;
    panel.dataset.state = open ? "open" : "closed";
  }).catch(() => undefined);
}

function initializeAccordionSample(sample: HTMLElement) {
  sample.querySelectorAll<HTMLDetailsElement>(".sample-accordion details").forEach((details) => {
    const summary = details.querySelector<HTMLElement>(":scope > summary");
    const panel = details.querySelector<HTMLElement>(":scope > .sample-accordion-panel");
    if (!summary || !panel) return;

    panel.hidden = !details.open;
    panel.dataset.state = details.open ? "open" : "closed";

    details.addEventListener("toggle", () => {
      if (!details.open && panel.dataset.state === "closing") return;
      if (!details.open && panel.hidden) {
        panel.dataset.state = "closed";
        return;
      }
      transitionAccordionPanel(details, panel, details.open);
    });

    summary.addEventListener("click", (event) => {
      if (!details.open) return;
      event.preventDefault();
      transitionAccordionPanel(details, panel, false);
    });
  });
}

function updateTabsIndicator(tablist: HTMLElement) {
  const activeTab = tablist.querySelector<HTMLElement>("[role='tab'][aria-selected='true']");
  if (!activeTab) return;
  tablist.style.setProperty("--tabs-indicator-offset", `${activeTab.offsetLeft}px`);
  tablist.style.setProperty("--tabs-indicator-width", `${activeTab.offsetWidth}px`);
}

function initializeTabsSample(sample: HTMLElement) {
  const tablist = sample.querySelector<HTMLElement>(".sample-tabs-list");
  const tabs = Array.from(tablist?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? []);
  const panels = Array.from(sample.querySelectorAll<HTMLElement>(".sample-tabs-panel[role='tabpanel']"));
  if (!tablist || !tabs.length || !panels.length) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  tablist.setAttribute("aria-label", "Project details");
  tabs.forEach((tab, index) => {
    const key = tab.dataset.tabKey ?? String(index + 1);
    tab.id = `sample-tabs-${instance}-tab-${key}`;
    tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
  });

  panels.forEach((panel) => {
    const key = panel.dataset.tabPanel ?? "panel";
    const tab = tabs.find((item) => item.dataset.tabKey === key);
    panel.id = `sample-tabs-${instance}-panel-${key}`;
    panel.setAttribute("aria-labelledby", tab?.id ?? tabs[0]!.id);
    panel.tabIndex = 0;
    panel.hidden = tab !== tabs.find((item) => item.getAttribute("aria-selected") === "true");
    tab?.setAttribute("aria-controls", panel.id);
  });

  const resizeObserver = new ResizeObserver(() => updateTabsIndicator(tablist));
  resizeObserver.observe(tablist);
  tabs.forEach((tab) => resizeObserver.observe(tab));
  updateTabsIndicator(tablist);
}

function animateDockBadge(badge: HTMLElement, direction: "in" | "out") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof badge.animate !== "function") return null;

  badge.getAnimations().forEach((animation) => animation.cancel());
  const keyframes: Keyframe[] = direction === "in"
    ? [
        { opacity: 0, transform: "scale(0.72)" },
        { opacity: 1, transform: "scale(1.06)", offset: 0.72 },
        { opacity: 1, transform: "scale(1)" },
      ]
    : [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.78)" },
      ];

  return badge.animate(keyframes, {
    duration: direction === "in" ? 220 : 140,
    easing: direction === "in" ? "cubic-bezier(0.2, 0.75, 0.3, 1.15)" : "ease-in",
    fill: "both",
  });
}

function updateDockBadge(sample: HTMLElement, requestedCount: number) {
  const dock = sample.querySelector<HTMLElement>(".sample-dock");
  const app = dock?.querySelector<HTMLElement>("[data-dock-app]");
  const badge = dock?.querySelector<HTMLElement>("[data-dock-badge]");
  const countLabel = dock?.querySelector<HTMLElement>("[data-dock-count-label]");
  const clearButton = dock?.querySelector<HTMLButtonElement>("[data-action='dock-clear-badge']");
  if (!dock || !app || !badge || !countLabel) return 0;

  const previousCount = Number(dock.dataset.badgeCount ?? "0");
  const count = Math.max(0, Math.min(100, requestedCount));
  const hasBadge = count > 0;
  dock.dataset.badgeCount = String(count);
  badge.textContent = count > 99 ? "99+" : String(count);
  if (hasBadge) {
    badge.hidden = false;
    animateDockBadge(badge, "in");
  } else if (previousCount > 0 && !badge.hidden) {
    const animation = animateDockBadge(badge, "out");
    if (animation) {
      animation.onfinish = () => {
        if (dock.dataset.badgeCount === "0") badge.hidden = true;
      };
    } else {
      badge.hidden = true;
    }
  } else {
    badge.hidden = true;
  }
  countLabel.textContent = hasBadge ? `${count} unread ${count === 1 ? "item" : "items"}` : "All caught up · no badge";
  app.setAttribute("aria-label", hasBadge ? `Projects app icon with ${count} unread ${count === 1 ? "item" : "items"}` : "Projects app icon with no unread items");
  if (clearButton) clearButton.disabled = !hasBadge;
  return count;
}

function updateStepsSample(sample: HTMLElement, nextIndex?: number) {
  const demo = sample.querySelector<HTMLElement>(".sample-steps-demo");
  const items = Array.from(demo?.querySelectorAll<HTMLElement>(".sample-steps > li") ?? []);
  if (!demo || items.length === 0) return;

  const currentIndex = Math.max(0, Math.min(items.length - 1, nextIndex ?? Number(demo.dataset.currentStep ?? "0")));
  demo.dataset.currentStep = String(currentIndex);
  items.forEach((item, index) => {
    const button = item.querySelector<HTMLButtonElement>(".sample-step-button");
    const number = item.querySelector<HTMLElement>(".sample-step-number");
    const check = item.querySelector<Element>(".sample-step-indicator .ui-icon");
    const label = item.querySelector<HTMLElement>(".sample-step-label")?.textContent?.trim() ?? `Step ${index + 1}`;
    const completed = index < currentIndex;
    const current = index === currentIndex;
    const canSelect = index <= currentIndex + 1;

    item.classList.toggle("is-done", completed);
    item.classList.toggle("is-current", current);
    if (button) {
      button.disabled = !canSelect;
      if (current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
      button.setAttribute("aria-label", `${label}, ${completed ? "completed" : current ? "current step" : canSelect ? "next step" : "upcoming step"}`);
    }
    number?.removeAttribute("hidden");
    check?.removeAttribute("hidden");
  });

  const status = demo.querySelector<HTMLElement>(".sample-steps-status");
  const label = items[currentIndex]?.querySelector<HTMLElement>(".sample-step-label")?.textContent?.trim() ?? `Step ${currentIndex + 1}`;
  if (status) status.textContent = `${label} · Step ${currentIndex + 1} of ${items.length}`;
}

function initializeStepsSample(sample: HTMLElement) {
  updateStepsSample(sample);
}

function updateStepperButtons(sample: HTMLElement) {
  const input = sample.querySelector<HTMLInputElement>(".sample-stepper-input");
  const decrease = sample.querySelector<HTMLButtonElement>("[data-action='stepper-dec']");
  const increase = sample.querySelector<HTMLButtonElement>("[data-action='stepper-inc']");
  if (!input) return;

  const value = input.valueAsNumber;
  const min = Number(input.min || "0");
  const max = Number(input.max || "0");
  if (decrease) decrease.disabled = !Number.isFinite(value) || value <= min;
  if (increase) increase.disabled = !Number.isFinite(value) || value >= max;
}

function animateStepperChange(input: HTMLInputElement, action: "stepper-dec" | "stepper-inc") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const animationClass = action === "stepper-inc" ? "is-stepping-up" : "is-stepping-down";
  const restartAnimation = (element: HTMLElement) => {
    element.classList.remove("is-stepping-up", "is-stepping-down");
    void element.offsetWidth;
    element.classList.add(animationClass);
  };

  restartAnimation(input);
  const button = input.closest(".sample-stepper-control")?.querySelector<HTMLButtonElement>(`[data-action='${action}']`);
  if (button) restartAnimation(button);
}

function changeStepperValue(sample: HTMLElement, action: "stepper-dec" | "stepper-inc") {
  const input = sample.querySelector<HTMLInputElement>(".sample-stepper-input");
  if (!input) return;

  const min = Number(input.min || "0");
  const max = Number(input.max || "0");
  const current = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : min;
  const step = Number(input.step || "1");
  const next = Math.min(max, Math.max(min, current + (action === "stepper-inc" ? step : -step)));
  input.value = String(next);
  animateStepperChange(input, action);
  updateStepperButtons(sample);
  announce(sample, `Quantity ${next}.`);
}

function initializeStepper(sample: HTMLElement) {
  const input = sample.querySelector<HTMLInputElement>(".sample-stepper-input");
  const buttons = sample.querySelectorAll<HTMLButtonElement>(".sample-stepper-buttons button[data-action]");
  if (!input) return;

  updateStepperButtons(sample);
  input.addEventListener("input", () => updateStepperButtons(sample));
  const normalizeInput = () => {
    const value = input.valueAsNumber;
    if (!Number.isFinite(value)) input.value = input.min;
    else input.value = String(Math.min(Number(input.max || "0"), Math.max(Number(input.min || "0"), value)));
    updateStepperButtons(sample);
    announce(sample, `Quantity ${input.value}.`);
  };
  input.addEventListener("change", normalizeInput);
  input.addEventListener("blur", normalizeInput);

  buttons.forEach((button) => {
    let holdDelay = 0;
    let repeatInterval = 0;
    let suppressPointerClick = false;
    const action = button.dataset.action;
    if (action !== "stepper-dec" && action !== "stepper-inc") return;

    const stopRepeating = () => {
      window.clearTimeout(holdDelay);
      window.clearInterval(repeatInterval);
      holdDelay = 0;
      repeatInterval = 0;
      if (suppressPointerClick) window.setTimeout(() => { suppressPointerClick = false; }, 0);
    };

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || button.disabled) return;
      suppressPointerClick = true;
      changeStepperValue(sample, action);
      button.setPointerCapture(event.pointerId);
      holdDelay = window.setTimeout(() => {
        repeatInterval = window.setInterval(() => {
          if (button.disabled) {
            window.clearInterval(repeatInterval);
            repeatInterval = 0;
            return;
          }
          changeStepperValue(sample, action);
        }, 110);
      }, 450);
    });
    button.addEventListener("pointerup", stopRepeating);
    button.addEventListener("pointercancel", stopRepeating);
    button.addEventListener("lostpointercapture", stopRepeating);
    button.addEventListener("click", (event) => {
      if (!suppressPointerClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressPointerClick = false;
    }, true);
  });
}

function initializeAvatarGroupSample(sample: HTMLElement) {
  const group = sample.querySelector<HTMLElement>("[data-avatar-group]");
  const list = group?.querySelector<HTMLElement>(".sample-avatar-list");
  const toggle = group?.querySelector<HTMLButtonElement>("[data-action='avatar-group-toggle']");
  const hint = group?.querySelector<HTMLElement>("[data-avatar-hint]");
  if (!group || !list || !toggle || !hint) return;

  const members = Array.from(list.querySelectorAll<HTMLElement>(".sample-avatar-member"));
  const total = members.length;
  const visibleCount = Math.max(1, Math.min(total, Number(group.dataset.visibleCount ?? "4")));
  const expanded = group.dataset.expanded === "true";
  const instance = sample.dataset.sampleInstance ?? "example";
  list.id = `sample-avatar-list-${instance}`;
  const groupName = group.querySelector<HTMLElement>(".sample-avatar-heading strong")?.textContent?.trim() ?? "Group";
  list.setAttribute("aria-label", `${groupName} collaborators`);
  toggle.setAttribute("aria-controls", list.id);

  members.forEach((member, index) => {
    member.style.setProperty("--avatar-order", String(total - index));
    member.hidden = !expanded && index >= visibleCount;
    member.classList.remove("is-entering");
  });
  group.classList.toggle("is-expanded", expanded);
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.setAttribute("aria-label", expanded ? "Collapse the avatar group" : `Show all ${total} collaborators`);
  const count = toggle.querySelector<HTMLElement>("[data-avatar-overflow-count]");
  const closeIcon = toggle.querySelector(".ui-icon");
  const toggleSlot = toggle.closest<HTMLElement>(".sample-avatar-toggle-slot");
  if (count) {
    count.textContent = `+${Math.max(0, total - visibleCount)}`;
    count.hidden = expanded;
  }
  closeIcon?.toggleAttribute("hidden", !expanded);
  if (toggleSlot) toggleSlot.hidden = total <= visibleCount;
  hint.textContent = expanded
    ? `All ${total} collaborators shown.`
    : `Select +${Math.max(0, total - visibleCount)} to see all collaborators.`;
}

function updateAvatarGroupSample(sample: HTMLElement) {
  const group = sample.querySelector<HTMLElement>("[data-avatar-group]");
  const list = group?.querySelector<HTMLElement>(".sample-avatar-list");
  const toggle = group?.querySelector<HTMLButtonElement>("[data-action='avatar-group-toggle']");
  const hint = group?.querySelector<HTMLElement>("[data-avatar-hint]");
  if (!group || !list || !toggle || !hint) return;

  const members = Array.from(list.querySelectorAll<HTMLElement>(".sample-avatar-member"));
  const total = members.length;
  const visibleCount = Math.max(1, Math.min(total, Number(group.dataset.visibleCount ?? "4")));
  const expanded = group.dataset.expanded !== "true";
  group.dataset.expanded = String(expanded);
  group.classList.toggle("is-expanded", expanded);

  members.forEach((member, index) => {
    const isOverflowMember = index >= visibleCount;
    if (expanded && isOverflowMember) {
      member.hidden = false;
      member.classList.add("is-entering");
      requestAnimationFrame(() => member.classList.remove("is-entering"));
    } else {
      member.hidden = !expanded && isOverflowMember;
      member.classList.remove("is-entering");
    }
  });

  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.setAttribute("aria-label", expanded ? "Collapse the avatar group" : `Show all ${total} collaborators`);
  const count = toggle.querySelector<HTMLElement>("[data-avatar-overflow-count]");
  const closeIcon = toggle.querySelector(".ui-icon");
  if (count) count.hidden = expanded;
  closeIcon?.toggleAttribute("hidden", !expanded);
  const message = expanded
    ? `All ${total} collaborators shown.`
    : `Select +${Math.max(0, total - visibleCount)} to see all collaborators.`;
  hint.textContent = message;
  announce(sample, message);
}

const dataTableRowAnimationListeners = new WeakMap<HTMLTableRowElement, EventListener>();

function clearDataTableRowAnimation(row: HTMLTableRowElement) {
  const finalCell = row.cells.item(row.cells.length - 1);
  const listener = dataTableRowAnimationListeners.get(row);
  if (finalCell && listener) finalCell.removeEventListener("animationend", listener);
  dataTableRowAnimationListeners.delete(row);
  row.classList.remove("is-entering");
  row.style.removeProperty("--table-row-delay");
}

function renderDataTable(table: HTMLElement, animateRows = false) {
  const body = table.querySelector<HTMLTableSectionElement>("tbody");
  if (!body) return;

  const sortKey = table.dataset.sortKey ?? "amount";
  const sortDirection = table.dataset.sortDirection === "ascending" ? "ascending" : "descending";
  const rows = Array.from(body.querySelectorAll<HTMLTableRowElement>("tr[data-row-id]"));
  rows.sort((left, right) => {
    const leftValue = left.dataset[sortKey] ?? "";
    const rightValue = right.dataset[sortKey] ?? "";
    const comparison = sortKey === "amount"
      ? Number(leftValue) - Number(rightValue)
      : leftValue.localeCompare(rightValue, undefined, { sensitivity: "base" });
    return sortDirection === "ascending" ? comparison : -comparison;
  });
  body.replaceChildren(...rows);

  table.querySelectorAll<HTMLElement>("thead th[data-sort-column]").forEach((header) => {
    if (header.dataset.sortColumn === sortKey) header.setAttribute("aria-sort", sortDirection);
    else header.removeAttribute("aria-sort");

    const sortIcon = header.querySelector<SVGElement>(".sample-sort-icon");
    if (sortIcon) {
      sortIcon.dataset.lucide = header.getAttribute("aria-sort") === "ascending"
        ? "arrow-up"
        : header.getAttribute("aria-sort") === "descending"
          ? "arrow-down"
          : "arrow-up-down";
    }
  });
  renderIcons(table);

  const pageSize = Math.max(1, Number(table.dataset.pageSize ?? "5"));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(table.dataset.page ?? "1")));
  table.dataset.page = String(page);
  const firstIndex = (page - 1) * pageSize;
  const lastIndex = Math.min(firstIndex + pageSize, rows.length);
  const visibleRows = rows.slice(firstIndex, lastIndex);
  const shouldAnimateRows = animateRows && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  rows.forEach((row, index) => {
    const visible = index >= firstIndex && index < lastIndex;
    row.hidden = !visible;
    if (animateRows) {
      clearDataTableRowAnimation(row);
      if (visible && shouldAnimateRows) {
        row.style.setProperty("--table-row-delay", `${Math.min(index - firstIndex, 4) * 16}ms`);
        void row.offsetWidth;
        row.classList.add("is-entering");
        const finalCell = row.cells.item(row.cells.length - 1);
        if (finalCell) {
          const finishAnimation: EventListener = () => clearDataTableRowAnimation(row);
          finalCell.addEventListener("animationend", finishAnimation, { once: true });
          dataTableRowAnimationListeners.set(row, finishAnimation);
        } else {
          clearDataTableRowAnimation(row);
        }
      }
    } else if (!visible) {
      clearDataTableRowAnimation(row);
    }
    const selected = Boolean(row.querySelector<HTMLInputElement>("input[data-input-action='table-row-select']")?.checked);
    row.classList.toggle("is-selected", selected);
    row.setAttribute("aria-selected", String(selected));
  });

  const selectedCount = rows.filter((row) => row.querySelector<HTMLInputElement>("input[data-input-action='table-row-select']")?.checked).length;
  const selectedOnPage = visibleRows.filter((row) => row.querySelector<HTMLInputElement>("input[data-input-action='table-row-select']")?.checked).length;
  const selectAll = table.querySelector<HTMLInputElement>("input[data-input-action='table-select-all']");
  if (selectAll) {
    selectAll.checked = visibleRows.length > 0 && selectedOnPage === visibleRows.length;
    selectAll.indeterminate = selectedOnPage > 0 && selectedOnPage < visibleRows.length;
    selectAll.setAttribute("aria-checked", selectAll.indeterminate ? "mixed" : String(selectAll.checked));
  }

  const selection = table.querySelector<HTMLElement>("[data-table-selection]");
  if (selection) selection.textContent = `${selectedCount} selected`;
  const range = table.querySelector<HTMLElement>("[data-table-range]");
  if (range) range.textContent = rows.length ? `Rows ${firstIndex + 1}–${lastIndex} of ${rows.length}` : "No customers";
  const pageLabel = table.querySelector<HTMLElement>("[data-table-page]");
  if (pageLabel) pageLabel.textContent = `Page ${page} of ${pageCount}`;
  const previous = table.querySelector<HTMLButtonElement>("[data-action='table-page-prev']");
  const next = table.querySelector<HTMLButtonElement>("[data-action='table-page-next']");
  if (previous) previous.disabled = page <= 1;
  if (next) next.disabled = page >= pageCount;
}

function initializeDataTable(sample: HTMLElement) {
  const table = sample.querySelector<HTMLElement>(".sample-data-table");
  if (!table) return;

  initializeDataTableResizers(table);
  renderDataTable(table);
}

function initializeDataTableResizers(table: HTMLElement) {
  if (table.dataset.resizersInitialized === "true") return;
  table.dataset.resizersInitialized = "true";

  const scrollRegion = table.querySelector<HTMLElement>(".sample-data-table-scroll");
  const columns = Array.from(table.querySelectorAll<HTMLTableColElement>("colgroup col[data-column-key]"));
  const minFlexibleWidth = 88;

  const readColumnWidths = () => new Map(columns.map((column) => {
    const header = table.querySelector<HTMLElement>(`thead th[data-column-key="${column.dataset.columnKey}"]`);
    return [column.dataset.columnKey ?? "", header?.getBoundingClientRect().width ?? column.getBoundingClientRect().width];
  }));

  const applyColumnWidths = (widths: Map<string, number>) => {
    if (!scrollRegion || columns.length === 0) return;
    const keys = columns.map((column) => column.dataset.columnKey ?? "");
    const flexibleKey = keys.at(-1);
    const baseWidth = Number(table.dataset.resizerBaseWidth ?? scrollRegion.clientWidth);
    table.dataset.resizerBaseWidth = String(baseWidth);
    const fixedWidth = keys
      .filter((key) => key !== flexibleKey)
      .reduce((total, key) => total + (widths.get(key) ?? 0), 0);
    const flexibleWidth = Math.max(minFlexibleWidth, Math.max(scrollRegion.clientWidth, baseWidth) - fixedWidth);
    if (flexibleKey) widths.set(flexibleKey, flexibleWidth);
    const totalWidth = keys.reduce((total, key) => total + (widths.get(key) ?? 0), 0);

    columns.forEach((column) => {
      const width = widths.get(column.dataset.columnKey ?? "");
      if (width) column.style.width = `${Math.round(width)}px`;
    });
    table.style.setProperty("--sample-table-width", `${Math.ceil(Math.max(scrollRegion.clientWidth, baseWidth, totalWidth))}px`);
    table.dataset.customColumnWidths = "true";
  };

  const resizeHandle = (handle: HTMLElement, width: number) => {
    const beforeKey = handle.dataset.resizeBefore;
    if (!beforeKey) return;
    const min = Number(handle.getAttribute("aria-valuemin") ?? "80");
    const max = Number(handle.getAttribute("aria-valuemax") ?? "280");
    const nextWidth = Math.min(max, Math.max(min, width));
    const widths = readColumnWidths();
    widths.set(beforeKey, nextWidth);
    applyColumnWidths(widths);
    const currentWidth = Math.round(widths.get(beforeKey) ?? nextWidth);
    handle.setAttribute("aria-valuenow", String(currentWidth));
    handle.setAttribute("aria-valuetext", `${currentWidth} pixels`);
  };

  table.querySelectorAll<HTMLElement>("[data-table-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const beforeKey = handle.dataset.resizeBefore;
      if (!beforeKey) return;
      event.preventDefault();
      handle.focus();
      handle.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startWidth = readColumnWidths().get(beforeKey) ?? Number(handle.getAttribute("aria-valuenow"));

      const move = (moveEvent: PointerEvent) => resizeHandle(handle, startWidth + moveEvent.clientX - startX);
      const finish = (finishEvent: PointerEvent) => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        if (handle.hasPointerCapture(finishEvent.pointerId)) handle.releasePointerCapture(finishEvent.pointerId);
      };

      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });

    handle.addEventListener("keydown", (event) => {
      const beforeKey = handle.dataset.resizeBefore;
      if (!beforeKey) return;
      const current = readColumnWidths().get(beforeKey) ?? Number(handle.getAttribute("aria-valuenow"));
      const step = event.shiftKey ? 16 : 8;
      const next = event.key === "ArrowRight" ? current + step
        : event.key === "ArrowLeft" ? current - step
          : event.key === "Home" ? Number(handle.getAttribute("aria-valuemin"))
            : event.key === "End" ? Number(handle.getAttribute("aria-valuemax"))
              : null;
      if (next === null) return;
      event.preventDefault();
      resizeHandle(handle, next);
    });
  });

  if (scrollRegion && "ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (table.dataset.customColumnWidths !== "true") return;
      const minWidth = Number.parseFloat(getComputedStyle(table).minWidth) || 0;
      table.dataset.resizerBaseWidth = String(Math.ceil(Math.max(scrollRegion.clientWidth, minWidth)));
      applyColumnWidths(readColumnWidths());
      table.querySelectorAll<HTMLElement>("[data-table-resize]").forEach((handle) => {
        const key = handle.dataset.resizeBefore;
        const width = key ? readColumnWidths().get(key) : undefined;
        if (!width) return;
        handle.setAttribute("aria-valuenow", String(Math.round(width)));
        handle.setAttribute("aria-valuetext", `${Math.round(width)} pixels`);
      });
    }).observe(scrollRegion);
  }

  table.querySelectorAll<HTMLElement>("[data-table-resize]").forEach((handle) => {
    const key = handle.dataset.resizeBefore;
    const width = key ? readColumnWidths().get(key) : undefined;
    if (!width) return;
    handle.setAttribute("aria-valuenow", String(Math.round(width)));
    handle.setAttribute("aria-valuetext", `${Math.round(width)} pixels`);
  });
}

function positionScrollspyIndicator(nav: HTMLElement) {
  const currentLink = nav.querySelector<HTMLAnchorElement>("a[aria-current='location']");
  if (!currentLink) return;

  const navBounds = nav.getBoundingClientRect();
  const linkBounds = currentLink.getBoundingClientRect();
  const round = (value: number) => `${Math.round(value * 100) / 100}px`;
  const values: Record<string, string> = {
    "--scrollspy-indicator-y": round(linkBounds.top - navBounds.top),
    "--scrollspy-indicator-mobile-y": round(linkBounds.bottom - navBounds.top - 2),
    "--scrollspy-indicator-x": round(linkBounds.left - navBounds.left),
    "--scrollspy-indicator-width": `${linkBounds.width}px`,
    "--scrollspy-indicator-height": `${linkBounds.height}px`,
  };

  Object.entries(values).forEach(([property, value]) => {
    if (nav.style.getPropertyValue(property) !== value) nav.style.setProperty(property, value);
  });
  nav.classList.add("is-scrollspy-ready");
}

function setCurrentScrollspyLink(sample: HTMLElement, key: string) {
  const nav = sample.querySelector<HTMLElement>(".sample-scrollspy nav");
  if (nav?.dataset.scrollspyCurrent === key) return;
  if (nav) nav.dataset.scrollspyCurrent = key;
  sample.querySelectorAll<HTMLAnchorElement>(".sample-scrollspy nav a[data-scrollspy-key]").forEach((link) => {
    const current = link.dataset.scrollspyKey === key;
    link.classList.toggle("is-current", current);
    if (current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  if (nav) positionScrollspyIndicator(nav);
}

function initializeScrollspy(sample: HTMLElement) {
  const nav = sample.querySelector<HTMLElement>(".sample-scrollspy nav");
  const content = sample.querySelector<HTMLElement>(".sample-scrollspy-content");
  if (!nav || !content) return;

  scrollspyCleanups.get(sample)?.();
  const prefix = `sample-scrollspy-${sample.dataset.sampleInstance ?? "example"}`;
  const sections = Array.from(content.querySelectorAll<HTMLElement>("section[data-scrollspy-key]"));
  const headings: HTMLElement[] = [];
  let navigationLock = false;
  let navigationTimer: number | undefined;
  sections.forEach((section) => {
    const key = section.dataset.scrollspyKey;
    if (!key) return;
    const heading = section.querySelector<HTMLElement>(":scope > h4");
    if (!heading) return;
    heading.id = `${prefix}-${key}`;
    heading.dataset.scrollspyKey = key;
    heading.tabIndex = -1;
    nav.querySelector<HTMLAnchorElement>(`a[data-scrollspy-key="${key}"]`)?.setAttribute("href", `#${heading.id}`);
    headings.push(heading);
  });

  const updateCurrentSection = () => {
    if (navigationLock || headings.length === 0) return;
    const bounds = content.getBoundingClientRect();
    const activationLine = bounds.top + content.clientHeight * 0.24;
    const passed = headings.filter((heading) => heading.getBoundingClientRect().top <= activationLine);
    const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;
    const current = atBottom ? headings[headings.length - 1] : passed[passed.length - 1] ?? headings[0];
    if (current?.dataset.scrollspyKey) setCurrentScrollspyLink(sample, current.dataset.scrollspyKey);
  };

  const releaseNavigationLock = () => {
    if (navigationTimer !== undefined) window.clearTimeout(navigationTimer);
    navigationTimer = undefined;
    if (!navigationLock) return;
    navigationLock = false;
    updateCurrentSection();
  };
  const handleNavigationClick = (key: string) => {
    navigationLock = true;
    setCurrentScrollspyLink(sample, key);
    if (navigationTimer !== undefined) window.clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(releaseNavigationLock, 1800);
  };
  const handleContentScroll = () => {
    if (navigationLock) {
      if (navigationTimer !== undefined) window.clearTimeout(navigationTimer);
      navigationTimer = window.setTimeout(releaseNavigationLock, 140);
      return;
    }
    updateCurrentSection();
  };

  scrollspyNavigationHandlers.set(sample, handleNavigationClick);
  content.addEventListener("scroll", handleContentScroll, { passive: true });
  let observer: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(updateCurrentSection, {
      root: content,
      rootMargin: "-24% 0px -74% 0px",
      threshold: 0,
    });
    headings.forEach((heading) => observer?.observe(heading));
  }
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => positionScrollspyIndicator(nav));
    resizeObserver.observe(nav);
  }
  scrollspyCleanups.set(sample, () => {
    observer?.disconnect();
    resizeObserver?.disconnect();
    if (navigationTimer !== undefined) window.clearTimeout(navigationTimer);
    scrollspyNavigationHandlers.delete(sample);
    content.removeEventListener("scroll", handleContentScroll);
  });
  updateCurrentSection();
}

function initializeScrollView(sample: HTMLElement) {
  const shell = sample.querySelector<HTMLElement>(".sample-scroll-shell");
  const viewport = shell?.querySelector<HTMLElement>("[data-scroll-viewport]");
  const rail = shell?.querySelector<HTMLElement>("[data-scrollbar]");
  const thumb = rail?.querySelector<HTMLElement>("[data-scrollbar-thumb]");
  const toggle = shell?.querySelector<HTMLButtonElement>("[data-action='scroll-view-toggle-style']");
  const caption = shell?.querySelector<HTMLElement>("[data-scroll-caption]");
  const status = shell?.querySelector<HTMLElement>("[data-scroll-status]");
  if (!shell || !viewport || !rail || !thumb || !toggle) return;

  const viewportId = `sample-scroll-viewport-${sample.dataset.sampleInstance ?? "example"}`;
  viewport.id = viewportId;
  rail.setAttribute("aria-controls", viewportId);
  const scrollItems = Array.from(viewport.querySelectorAll<HTMLElement>("ol > li"));
  if (typeof IntersectionObserver !== "undefined" && scrollItems.length) {
    scrollItems.forEach((item, index) => {
      item.style.setProperty("--scroll-entry-delay", `${(index % 4) * 18}ms`);
    });
    viewport.classList.add("has-scroll-motion");
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
        entry.target.classList.add("is-visible");
        itemObserver.unobserve(entry.target);
      });
    }, { root: viewport, threshold: 0.12 });
    scrollItems.forEach((item) => itemObserver.observe(item));
  }
  let scrollTimer: number | undefined;
  let dragPointer: number | undefined;
  let dragOffset = 0;

  const update = () => {
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const trackHeight = rail.clientHeight;
    const thumbHeight = Math.min(trackHeight, Math.max(24, trackHeight * (viewport.clientHeight / Math.max(viewport.scrollHeight, 1))));
    const travel = Math.max(0, trackHeight - thumbHeight);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${maxScroll ? (viewport.scrollTop / maxScroll) * travel : 0}px)`;
    rail.setAttribute("aria-valuemax", String(maxScroll));
    rail.setAttribute("aria-valuenow", String(Math.round(viewport.scrollTop)));
    rail.setAttribute("aria-valuetext", maxScroll ? `${Math.round((viewport.scrollTop / maxScroll) * 100)}% scrolled` : "No overflow");
    rail.setAttribute("aria-disabled", String(maxScroll === 0));
    rail.tabIndex = maxScroll ? 0 : -1;
  };

  const scrollToPointer = (clientY: number) => {
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const bounds = rail.getBoundingClientRect();
    const trackHeight = Math.max(0, bounds.height);
    const thumbHeight = thumb.getBoundingClientRect().height;
    const travel = Math.max(1, trackHeight - thumbHeight);
    const thumbTop = Math.min(travel, Math.max(0, clientY - bounds.top - dragOffset));
    viewport.scrollTop = maxScroll * (thumbTop / travel);
  };

  const revealOverlay = () => {
    if (shell.dataset.scrollMode !== "overlay") return;
    const body = viewport.parentElement;
    body?.classList.add("is-scrolling");
    if (scrollTimer !== undefined) window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => body?.classList.remove("is-scrolling"), 850);
  };

  viewport.addEventListener("scroll", () => {
    update();
    revealOverlay();
  }, { passive: true });
  rail.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || rail.getAttribute("aria-disabled") === "true") return;
    const target = event.target;
    const onThumb = target instanceof Element && target.closest("[data-scrollbar-thumb]") === thumb;
    dragOffset = onThumb ? event.clientY - thumb.getBoundingClientRect().top : thumb.getBoundingClientRect().height / 2;
    dragPointer = event.pointerId;
    rail.setPointerCapture(event.pointerId);
    rail.classList.add("is-dragging");
    scrollToPointer(event.clientY);
    event.preventDefault();
  });
  rail.addEventListener("pointermove", (event) => {
    if (dragPointer !== event.pointerId) return;
    scrollToPointer(event.clientY);
  });
  const finishDrag = (event: PointerEvent) => {
    if (dragPointer !== event.pointerId) return;
    dragPointer = undefined;
    rail.classList.remove("is-dragging");
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  };
  rail.addEventListener("pointerup", finishDrag);
  rail.addEventListener("pointercancel", finishDrag);
  rail.addEventListener("keydown", (event) => {
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const step = event.key === "PageDown" || event.key === "PageUp" ? Math.max(1, viewport.clientHeight * 0.85) : 40;
    let next: number | undefined;
    if (event.key === "ArrowDown" || event.key === "PageDown") next = viewport.scrollTop + step;
    else if (event.key === "ArrowUp" || event.key === "PageUp") next = viewport.scrollTop - step;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = maxScroll;
    if (next === undefined) return;
    event.preventDefault();
    viewport.scrollTop = Math.max(0, Math.min(maxScroll, next));
    revealOverlay();
  });
  toggle.addEventListener("click", () => {
    const overlay = shell.dataset.scrollMode !== "overlay";
    shell.dataset.scrollMode = overlay ? "overlay" : "legacy";
    toggle.setAttribute("aria-pressed", String(overlay));
    if (caption) caption.textContent = overlay
      ? "Overlay scroller · floats over content and fades when idle."
      : "Legacy scroller · the track reserves space beside the content.";
    if (status) status.textContent = `${overlay ? "Overlay" : "Legacy"} scroller style selected.`;
    update();
    if (overlay) revealOverlay();
  });

  update();
  requestAnimationFrame(update);
}

function destroyScrollspy(sample: HTMLElement) {
  scrollspyCleanups.get(sample)?.();
  scrollspyCleanups.delete(sample);
}

function updateDragTaskControls(board: HTMLElement) {
  board.querySelectorAll<HTMLElement>(".sample-task-card").forEach((task) => {
    const title = task.dataset.taskTitle ?? task.querySelector<HTMLElement>(".sample-task-title")?.textContent?.trim() ?? "Task";
    const sourceColumn = task.closest<HTMLElement>(".sample-kanban-column");
    const sourceName = sourceColumn?.querySelector("h3")?.textContent?.trim() ?? "current column";
    const destination = Array.from(board.querySelectorAll<HTMLElement>(".sample-kanban-column"))
      .find((column) => column !== sourceColumn);
    const destinationName = destination?.querySelector("h3")?.textContent?.trim() ?? "other column";
    const grip = task.querySelector<HTMLButtonElement>(".sample-task-grip");
    if (grip) setAction(grip, "move-task", `Move ${title} from ${sourceName} to ${destinationName}. Drag to reposition.`);
  });
  board.querySelectorAll<HTMLElement>(".sample-kanban-column").forEach((column) => {
    const count = column.querySelector<HTMLElement>("[data-column-count]");
    if (count) count.textContent = String(column.querySelectorAll(".sample-kanban-list > .sample-task-card").length);
  });
}

function initializeDragDropSample(sample: HTMLElement) {
  const board = sample.querySelector<HTMLElement>(".sample-kanban");
  if (board) updateDragTaskControls(board);
}

function clearDragIndicators(board: HTMLElement) {
  board.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
    element.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
  });
}

function moveTask(task: HTMLElement, destination: HTMLElement, before: HTMLElement | null, sample: HTMLElement) {
  const board = task.closest<HTMLElement>(".sample-kanban");
  const sourceColumn = task.closest<HTMLElement>(".sample-kanban-column");
  const destinationColumn = destination.closest<HTMLElement>(".sample-kanban-column");
  if (!board || !sourceColumn || !destinationColumn) return false;
  if (sourceColumn === destinationColumn && (before === task || before === task.nextElementSibling || before === null && task.nextElementSibling === null)) return false;

  const previousRects = new Map(
    Array.from(board.querySelectorAll<HTMLElement>(".sample-task-card"), (card) => [card, card.getBoundingClientRect()] as const),
  );
  const taskName = task.dataset.taskTitle ?? "Task";
  const sourceName = sourceColumn.querySelector("h3")?.textContent?.trim() ?? "current column";
  const destinationName = destinationColumn.querySelector("h3")?.textContent?.trim() ?? "destination";
  destination.insertBefore(task, before);
  task.dataset.column = destinationColumn.dataset.dropColumn ?? "";
  updateDragTaskControls(board);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    board.querySelectorAll<HTMLElement>(".sample-task-card").forEach((card) => {
      const previous = previousRects.get(card);
      if (!previous) return;
      const next = card.getBoundingClientRect();
      const x = previous.left - next.left;
      const y = previous.top - next.top;
      if (!x && !y) return;
      card.animate(
        [{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }],
        { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
    });
  }
  task.querySelector<HTMLButtonElement>(".sample-task-grip")?.focus({ preventScroll: true });
  announce(sample, `Moved ${taskName} from ${sourceName} to ${destinationName}.`);
  return true;
}

function resizeCanvasSelection(
  selection: HTMLElement,
  workspace: HTMLElement,
  handle: HTMLButtonElement,
  deltaX: number,
  deltaY: number,
) {
  const direction = handle.dataset.selectionHandle ?? "se";
  const style = getComputedStyle(selection);
  const initial = activeSelectionResize?.selection === selection
    ? activeSelectionResize
    : {
        left: Number.parseFloat(style.left) || 0,
        top: Number.parseFloat(style.top) || 0,
        width: Number.parseFloat(style.width) || selection.offsetWidth,
        height: Number.parseFloat(style.height) || selection.offsetHeight,
      };
  const areaWidth = workspace.clientWidth;
  const areaHeight = workspace.clientHeight;
  const minWidth = Math.min(Number.parseFloat(getComputedStyle(selection).minWidth) || 3.25 * 16, areaWidth);
  const minHeight = Math.min(Number.parseFloat(getComputedStyle(selection).minHeight) || 2.5 * 16, areaHeight);
  let left = Math.min(Math.max(0, initial.left), Math.max(0, areaWidth - minWidth));
  let top = Math.min(Math.max(0, initial.top), Math.max(0, areaHeight - minHeight));
  let width = Math.min(Math.max(minWidth, initial.width), Math.max(minWidth, areaWidth - left));
  let height = Math.min(Math.max(minHeight, initial.height), Math.max(minHeight, areaHeight - top));
  if (direction.includes("w")) {
    const right = left + width;
    left = Math.min(Math.max(0, left + deltaX), right - minWidth);
    width = right - left;
  } else if (direction.includes("e")) {
    const right = Math.min(Math.max(left + minWidth, left + width + deltaX), areaWidth);
    width = right - left;
  }
  if (direction.includes("n")) {
    const bottom = top + height;
    top = Math.min(Math.max(0, top + deltaY), bottom - minHeight);
    height = bottom - top;
  } else if (direction.includes("s")) {
    const bottom = Math.min(Math.max(top + minHeight, top + height + deltaY), areaHeight);
    height = bottom - top;
  }

  if (direction.includes("w")) selection.style.left = `${left}px`;
  if (direction.includes("e") || direction.includes("w")) selection.style.width = `${width}px`;
  if (direction.includes("n")) selection.style.top = `${top}px`;
  if (direction.includes("n") || direction.includes("s")) selection.style.height = `${height}px`;
  const status = selection.closest<HTMLElement>(".sample-selection-panel")?.querySelector<HTMLElement>("[data-selection-status]");
  if (status) status.textContent = `Selection ${Math.round(width)} × ${Math.round(height)} px.`;
}

function addChip(container: HTMLElement, label: string, className = "sample-selected") {
  const chip = document.createElement("span");
  chip.className = className;
  const text = document.createElement("span");
  text.textContent = label;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "sample-chip-remove";
  const removeIcon = document.createElement("i");
  removeIcon.className = "ui-icon";
  removeIcon.dataset.lucide = "x";
  removeIcon.setAttribute("aria-hidden", "true");
  remove.append(removeIcon);
  renderIcons(remove);
  setAction(remove, "remove-chip", `Remove ${label}`);
  chip.append(text, remove);
  const multiSelectInput = container.matches(".sample-multiselect")
    ? container.querySelector<HTMLElement>(".sample-input-line")
    : null;
  const tokenFieldInput = container.matches(".sample-token-field > div")
    ? container.querySelector<HTMLElement>(".sample-token-input")
    : null;
  if (multiSelectInput) container.insertBefore(chip, multiSelectInput);
  else if (tokenFieldInput) container.insertBefore(chip, tokenFieldInput);
  else container.append(chip);
}

type RecipientToken = { label: string; value: string; detail: string };

const recipientSuggestions: RecipientToken[] = [
  { label: "Lan Anh", value: "lan.anh@vinasig.com", detail: "lan.anh@vinasig.com" },
  { label: "Minh Tran", value: "minh.tran@vinasig.com", detail: "minh.tran@vinasig.com" },
  { label: "Mai Tran", value: "mai.tran@vinasig.com", detail: "mai.tran@vinasig.com" },
  { label: "Duy Khoa", value: "duy.khoa@vinasig.com", detail: "duy.khoa@vinasig.com" },
  { label: "Huy Nguyen", value: "huy.nguyen@vinasig.com", detail: "huy.nguyen@vinasig.com" },
];

function recipientKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function isRecipientEmail(value: string) {
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(value.trim());
}

function setRecipientMessage(field: HTMLElement, message = "") {
  const status = field.querySelector<HTMLElement>("[data-token-message]");
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
}

function clearRecipientSelection(field: HTMLElement) {
  field.querySelectorAll<HTMLButtonElement>(".sample-token-select[aria-pressed='true']")
    .forEach((button) => button.setAttribute("aria-pressed", "false"));
}

function makeRecipientToken(recipient: RecipientToken, entering = false) {
  const pill = document.createElement("span");
  pill.className = "sample-token-pill";
  pill.setAttribute("role", "listitem");
  pill.classList.toggle("is-entering", entering);
  pill.dataset.recipientToken = "true";

  const select = document.createElement("button");
  select.type = "button";
  select.className = "sample-token-select";
  select.dataset.action = "token-select";
  select.dataset.tokenValue = recipient.value;
  select.dataset.tokenLabel = recipient.label;
  select.setAttribute("aria-pressed", "false");
  select.setAttribute("aria-label", `Select ${recipient.label} token`);
  select.textContent = recipient.label;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "sample-token-remove";
  remove.dataset.action = "token-remove";
  remove.setAttribute("aria-label", `Remove ${recipient.label}`);
  const icon = document.createElement("i");
  icon.className = "ui-icon";
  icon.dataset.lucide = "x";
  icon.setAttribute("aria-hidden", "true");
  remove.append(icon);
  pill.append(select, remove);
  renderIcons(pill);
  return pill;
}

function updateRecipientSuggestions(field: HTMLElement) {
  const input = field.querySelector<HTMLInputElement>(".sample-token-input");
  const list = field.querySelector<HTMLElement>("[data-token-options]");
  if (!input || !list) return;

  const query = input.value.trim();
  const selected = new Set(Array.from(field.querySelectorAll<HTMLButtonElement>(".sample-token-pill:not(.is-removing) .sample-token-select"))
    .map((button) => recipientKey(button.dataset.tokenValue ?? "")));
  const candidates = query
    ? recipientSuggestions.filter((person) => !selected.has(recipientKey(person.value))
      && `${person.label} ${person.detail}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    : [];

  if (query && isRecipientEmail(query) && !selected.has(recipientKey(query))
    && !candidates.some((person) => recipientKey(person.value) === recipientKey(query))) {
    candidates.push({ label: query, value: query, detail: "Add email address" });
  }

  list.replaceChildren();
  candidates.forEach((person, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "sample-token-option";
    option.dataset.action = "token-suggestion";
    option.dataset.tokenValue = person.value;
    option.dataset.tokenLabel = person.label;
    option.id = `${list.id}-option-${index + 1}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === 0));
    option.tabIndex = -1;
    const label = document.createElement("span");
    label.textContent = person.label;
    const detail = document.createElement("small");
    detail.textContent = person.detail;
    option.append(label, detail);
    list.append(option);
  });

  const isOpen = query.length > 0 && candidates.length > 0;
  list.hidden = !isOpen;
  input.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) input.setAttribute("aria-activedescendant", `${list.id}-option-1`);
  else input.removeAttribute("aria-activedescendant");
  field.dataset.tokenActiveIndex = isOpen ? "0" : "-1";
  setRecipientMessage(field, query && candidates.length === 0
    ? "No matching recipient. Enter a valid email address or choose a suggestion."
    : "");
}

function closeRecipientSuggestions(field: HTMLElement) {
  const input = field.querySelector<HTMLInputElement>(".sample-token-input");
  const list = field.querySelector<HTMLElement>("[data-token-options]");
  if (list) list.hidden = true;
  input?.setAttribute("aria-expanded", "false");
  input?.removeAttribute("aria-activedescendant");
  field.dataset.tokenActiveIndex = "-1";
}

function initializeTokenField(sample: HTMLElement) {
  const field = sample.querySelector<HTMLElement>(".sample-token-field");
  const input = field?.querySelector<HTMLInputElement>(".sample-token-input");
  const list = field?.querySelector<HTMLElement>("[data-token-list]");
  const entry = field?.querySelector<HTMLElement>("[data-token-entry]");
  const options = field?.querySelector<HTMLElement>("[data-token-options]");
  const label = field?.querySelector<HTMLElement>("[data-token-label]");
  const hint = field?.querySelector<HTMLElement>("[data-token-hint]");
  if (!field || !input || !list || !entry || !options || !label || !hint) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  label.id = `sample-token-label-${instance}`;
  input.id = `sample-token-input-${instance}`;
  (label as HTMLLabelElement).htmlFor = input.id;
  entry.setAttribute("role", "group");
  entry.setAttribute("aria-labelledby", label.id);
  list.setAttribute("role", "list");
  list.setAttribute("aria-label", "Selected recipients");
  input.setAttribute("aria-labelledby", label.id);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", options.id = `sample-token-options-${instance}`);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-describedby", hint.id = `sample-token-hint-${instance}`);
  input.dataset.inputAction = "add-recipient";

  const existingTokens = list.querySelectorAll(".sample-token-select");
  if (!existingTokens.length) {
    const initialTokens = Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-token-value]"))
      .map((token) => ({
        label: token.dataset.tokenLabel ?? token.textContent?.trim() ?? "Recipient",
        value: token.dataset.tokenValue ?? token.textContent?.trim() ?? "",
        detail: token.dataset.tokenValue ?? "",
      }));
    list.replaceChildren(...initialTokens.map((recipient) => makeRecipientToken(recipient)));
  }
  closeRecipientSuggestions(field);
  updateRecipientSuggestions(field);
}

function appendRecipientToken(field: HTMLElement, recipient: RecipientToken) {
  const list = field.querySelector<HTMLElement>("[data-token-list]");
  if (!list || !recipient.value.trim()) return false;
  if (Array.from(list.querySelectorAll<HTMLButtonElement>(".sample-token-select"))
    .some((button) => recipientKey(button.dataset.tokenValue ?? "") === recipientKey(recipient.value))) {
    setRecipientMessage(field, `${recipient.label} is already in the field.`);
    return false;
  }
  list.append(makeRecipientToken(recipient, true));
  return true;
}

function animateRecipientTokenRemoval(select: HTMLButtonElement) {
  const pill = select.closest<HTMLElement>(".sample-token-pill");
  if (!pill) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pill.remove();
    return;
  }

  pill.classList.remove("is-entering");
  pill.classList.add("is-removing");
  pill.inert = true;
  pill.setAttribute("aria-hidden", "true");
  window.setTimeout(() => pill.remove(), 120);
}

function commitRecipient(field: HTMLElement, rawValue: string) {
  const value = rawValue.trim();
  const input = field.querySelector<HTMLInputElement>(".sample-token-input");
  const known = recipientSuggestions.find((person) => recipientKey(person.label) === recipientKey(value)
    || recipientKey(person.value) === recipientKey(value));
  const recipient = known ?? (isRecipientEmail(value)
    ? { label: value, value, detail: "Email recipient" }
    : null);

  if (!value) {
    setRecipientMessage(field, "Enter a recipient name or email address.");
    return false;
  }
  if (!recipient) {
    setRecipientMessage(field, "Choose a suggested recipient or enter a valid email address.");
    updateRecipientSuggestions(field);
    return false;
  }
  if (!appendRecipientToken(field, recipient)) {
    updateRecipientSuggestions(field);
    return false;
  }

  if (input) input.value = "";
  clearRecipientSelection(field);
  closeRecipientSuggestions(field);
  setRecipientMessage(field, `${recipient.label} added.`);
  const sample = field.closest<HTMLElement>(".ui-sample");
  if (sample) announce(sample, `${recipient.label} added to recipients.`);
  input?.focus({ preventScroll: true });
  return true;
}

function removeRecipientToken(field: HTMLElement, select: HTMLButtonElement) {
  const label = select.dataset.tokenLabel ?? "Recipient";
  animateRecipientTokenRemoval(select);
  clearRecipientSelection(field);
  updateRecipientSuggestions(field);
  setRecipientMessage(field, `${label} removed.`);
  const sample = field.closest<HTMLElement>(".ui-sample");
  if (sample) announce(sample, `${label} removed from recipients.`);
  field.querySelector<HTMLInputElement>(".sample-token-input")?.focus({ preventScroll: true });
}

function editRecipientToken(field: HTMLElement, select: HTMLButtonElement) {
  const input = field.querySelector<HTMLInputElement>(".sample-token-input");
  if (!input) return;
  const label = select.dataset.tokenLabel ?? "";
  animateRecipientTokenRemoval(select);
  clearRecipientSelection(field);
  input.value = label;
  updateRecipientSuggestions(field);
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
  setRecipientMessage(field, `${label} is ready to edit. Press Return to save the token.`);
}

const multiSelectTeams = ["Design", "Research", "Ops", "Sales", "Support"];
const multiSelectPanelCloseTimers = new WeakMap<HTMLElement, number>();
let multiCheckboxPointerOwner: HTMLElement | null = null;

function setMultiSelectPanelOpen(panel: HTMLElement | null, open: boolean, control?: HTMLElement | null) {
  if (!panel) return;

  const closeTimer = multiSelectPanelCloseTimers.get(panel);
  if (closeTimer !== undefined) window.clearTimeout(closeTimer);
  multiSelectPanelCloseTimers.delete(panel);

  if (open) {
    control?.setAttribute("aria-expanded", "true");
    if (!panel.hidden && panel.dataset.multiSelectMotion !== "closing") return;
    panel.dataset.multiSelectMotion = "open";
    panel.classList.remove("is-closing");
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.hidden = false;
    return;
  }

  control?.setAttribute("aria-expanded", "false");
  if (panel.matches(".sample-multi-token-options")) {
    const field = panel.closest<HTMLElement>(".sample-multi-token-field");
    const input = field?.querySelector<HTMLInputElement>(".sample-multi-token-input");
    const empty = field?.querySelector<HTMLElement>("[data-token-empty]");
    if (input) delete input.dataset.tokenExplicitOpen;
    if (empty) empty.hidden = true;
  }
  if (panel.hidden) return;

  panel.dataset.multiSelectMotion = "closing";
  panel.inert = true;
  panel.setAttribute("aria-hidden", "true");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    panel.hidden = true;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.classList.remove("is-closing");
    panel.dataset.multiSelectMotion = "closed";
    return;
  }

  panel.classList.add("is-closing");
  multiSelectPanelCloseTimers.set(panel, window.setTimeout(() => {
    if (panel.dataset.multiSelectMotion !== "closing") return;
    panel.hidden = true;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.classList.remove("is-closing");
    panel.dataset.multiSelectMotion = "closed";
    multiSelectPanelCloseTimers.delete(panel);
  }, 140));
}

function initializeMultiSelectIds(sample: HTMLElement, suffix: string) {
  const checkbox = sample.querySelector<HTMLElement>(".sample-multi-checkbox");
  const checkboxTrigger = checkbox?.querySelector<HTMLButtonElement>("[data-action='multi-dropdown-toggle']");
  const checkboxOptions = checkbox?.querySelector<HTMLElement>(".sample-multi-checkbox-options");
  if (checkboxTrigger && checkboxOptions) {
    checkboxOptions.id = "multi-select-" + suffix + "-checkbox-options";
    checkboxTrigger.setAttribute("aria-controls", checkboxOptions.id);
  }

  const tokenField = sample.querySelector<HTMLElement>(".sample-multi-token-field");
  const tokenInput = tokenField?.querySelector<HTMLInputElement>(".sample-multi-token-input");
  const tokenOptions = tokenField?.querySelector<HTMLElement>(".sample-multi-token-options");
  if (tokenInput && tokenOptions) {
    tokenOptions.id = "multi-select-" + suffix + "-token-options";
    tokenInput.setAttribute("aria-controls", tokenOptions.id);
  }

  sample.querySelectorAll<HTMLElement>(".sample-multi-transfer-list").forEach((list) => {
    list.id = "multi-select-" + suffix + "-transfer-" + (list.dataset.transferSide ?? "list");
  });
}

function synchronizeMultiSelectOptionTabStops(list: HTMLElement | null) {
  if (!list) return;
  const options = Array.from(list.querySelectorAll<HTMLButtonElement>("[role='option']:not([hidden]):not(:disabled)"));
  if (!options.length) return;
  const active = options.find((option) => option === document.activeElement)
    ?? options.find((option) => option.tabIndex === 0)
    ?? options[0];
  options.forEach((option) => { option.tabIndex = option === active ? 0 : -1; });
}

function refreshMultiSelectShowcase(showcase: HTMLElement) {
  const checkbox = showcase.querySelector<HTMLElement>(".sample-multi-checkbox");
  const selectedCheckboxes = Array.from(checkbox?.querySelectorAll<HTMLInputElement>("input[data-input-action='multi-checkbox-option']:checked") ?? []);
  const checkboxCount = checkbox?.querySelector<HTMLElement>("[data-multi-count]");
  const checkboxTrigger = checkbox?.querySelector<HTMLButtonElement>("[data-action='multi-dropdown-toggle']");
  if (checkboxCount) checkboxCount.textContent = selectedCheckboxes.length + " selected";
  if (checkboxTrigger) checkboxTrigger.setAttribute("aria-label", selectedCheckboxes.length + " teams selected. Choose teams.");

  const tokenField = showcase.querySelector<HTMLElement>(".sample-multi-token-field");
  if (tokenField) {
    const selected = new Set(Array.from(tokenField.querySelectorAll<HTMLElement>("[data-multi-token]")).map((chip) => chip.dataset.multiToken ?? ""));
    const input = tokenField.querySelector<HTMLInputElement>(".sample-multi-token-input");
    const query = input?.value.trim().toLocaleLowerCase() ?? "";
    let visibleCount = 0;
    let availableCount = 0;
    tokenField.querySelectorAll<HTMLButtonElement>(".sample-multi-token-options [data-action='multi-token-option']").forEach((option) => {
      const value = option.dataset.value ?? "";
      if (!selected.has(value)) availableCount += 1;
      option.hidden = selected.has(value) || !value.toLocaleLowerCase().includes(query);
      if (!option.hidden) visibleCount += 1;
    });
    const empty = tokenField.querySelector<HTMLElement>("[data-token-empty]");
    const panel = tokenField.querySelector<HTMLElement>(".sample-multi-token-options");
    const panelOpen = Boolean(panel && !panel.hidden && panel.dataset.multiSelectMotion !== "closing");
    if (empty) empty.hidden = visibleCount > 0 || !panelOpen
      || (availableCount === 0 && input?.dataset.tokenExplicitOpen !== "true");
    if (input && panel) {
      if (availableCount === 0 && input.dataset.tokenExplicitOpen !== "true") {
        input.dataset.tokenDismissed = "true";
        setMultiSelectPanelOpen(panel, false, input);
      } else {
        input.setAttribute("aria-expanded", String(!panel.hidden && panel.dataset.multiSelectMotion !== "closing"));
      }
    }
    synchronizeMultiSelectOptionTabStops(panel);
  }

  const available = showcase.querySelector<HTMLElement>("[data-transfer-side='available']");
  const selected = showcase.querySelector<HTMLElement>("[data-transfer-side='selected']");
  const selectedAvailable = available?.querySelectorAll<HTMLElement>("[role='option'][aria-selected='true']").length ?? 0;
  const selectedChosen = selected?.querySelectorAll<HTMLElement>("[role='option'][aria-selected='true']").length ?? 0;
  const toSelected = showcase.querySelector<HTMLButtonElement>("[data-action='multi-transfer'][data-direction='to-selected']");
  const toAvailable = showcase.querySelector<HTMLButtonElement>("[data-action='multi-transfer'][data-direction='to-available']");
  if (toSelected) toSelected.disabled = selectedAvailable === 0;
  if (toAvailable) toAvailable.disabled = selectedChosen === 0;
  const availableEmpty = showcase.querySelector<HTMLElement>("[data-transfer-empty='available']");
  const selectedEmpty = showcase.querySelector<HTMLElement>("[data-transfer-empty='selected']");
  if (availableEmpty) availableEmpty.hidden = Boolean(available?.querySelector("[role='option']"));
  if (selectedEmpty) selectedEmpty.hidden = Boolean(selected?.querySelector("[role='option']"));
  synchronizeMultiSelectOptionTabStops(available);
  synchronizeMultiSelectOptionTabStops(selected);
}

function addMultiSelectToken(field: HTMLElement, value: string) {
  if (!multiSelectTeams.includes(value)) return false;
  const input = field.querySelector<HTMLInputElement>(".sample-multi-token-input");
  const alreadySelected = Array.from(field.querySelectorAll<HTMLElement>("[data-multi-token]"))
    .some((chip) => chip.dataset.multiToken === value);
  if (!input || alreadySelected) return false;

  const chip = document.createElement("span");
  const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  chip.className = "sample-multi-token-chip" + (animate ? " is-entering" : "");
  chip.dataset.multiToken = value;
  const label = document.createElement("span");
  label.textContent = value;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "sample-chip-remove";
  remove.dataset.action = "multi-token-remove";
  remove.dataset.value = value;
  remove.setAttribute("aria-label", "Remove " + value);
  const icon = document.createElement("i");
  icon.className = "ui-icon";
  icon.dataset.lucide = "x";
  icon.setAttribute("aria-hidden", "true");
  remove.append(icon);
  renderIcons(remove);
  chip.append(label, remove);
  field.insertBefore(chip, input);
  if (animate) requestAnimationFrame(() => chip.classList.remove("is-entering"));
  return true;
}

function setComboboxPopupOpen(input: HTMLInputElement, listbox: HTMLElement, open: boolean) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (open) {
    const wasHidden = listbox.hidden;
    const wasClosing = listbox.classList.contains("is-closing");
    listbox.classList.remove("is-closing");
    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
    if (reduceMotion) {
      listbox.classList.remove("is-entering");
      return;
    }
    if (!wasHidden && !wasClosing) return;
    listbox.classList.remove("is-entering");
    void listbox.offsetHeight;
    listbox.classList.add("is-entering");
    return;
  }

  input.setAttribute("aria-expanded", "false");
  if (listbox.hidden) return;
  listbox.classList.remove("is-entering");
  if (reduceMotion) {
    listbox.classList.remove("is-closing");
    listbox.hidden = true;
    return;
  }
  listbox.classList.add("is-closing");
}

function comboboxOptions(input: HTMLInputElement) {
  const owner = input.closest<HTMLElement>(".sample-combobox");
  return Array.from(owner?.querySelectorAll<HTMLElement>(".sample-combobox-popup [role='option']") ?? []);
}

function setComboboxActive(input: HTMLInputElement, option: HTMLElement | null) {
  const options = comboboxOptions(input);
  options.forEach((item) => { item.dataset.active = String(item === option); });
  if (option?.id) input.setAttribute("aria-activedescendant", option.id);
  else input.removeAttribute("aria-activedescendant");
}

function filterCombobox(input: HTMLInputElement, animateResults = false) {
  const owner = input.closest<HTMLElement>(".sample-combobox");
  const listbox = owner?.querySelector<HTMLElement>(".sample-combobox-popup");
  const emptyState = owner?.querySelector<HTMLElement>(".sample-combobox-empty");
  if (!owner || !listbox) return [];

  const query = input.value.trim().toLocaleLowerCase();
  const options = comboboxOptions(input);
  const visibleOptions = options.filter((option) => {
    const label = option.querySelector<HTMLElement>(".sample-option-label")?.textContent?.trim() ?? option.textContent?.trim() ?? "";
    const matches = label.toLocaleLowerCase().includes(query);
    option.classList.remove("is-entering");
    option.style.removeProperty("--combobox-option-delay");
    option.hidden = !matches;
    return matches;
  });

  setComboboxPopupOpen(input, listbox, true);
  const shouldAnimateResults = animateResults && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (shouldAnimateResults && visibleOptions.length) {
    void listbox.offsetHeight;
    visibleOptions.forEach((option, index) => {
      option.style.setProperty("--combobox-option-delay", `${Math.min(index * 16, 48)}ms`);
      option.classList.add("is-entering");
    });
  }
  if (emptyState) {
    emptyState.classList.remove("is-entering", "is-closing");
    emptyState.hidden = visibleOptions.length > 0;
    if (shouldAnimateResults && !emptyState.hidden) {
      void emptyState.offsetHeight;
      emptyState.classList.add("is-entering");
    }
  }

  const activeOption = query
    ? visibleOptions[0]
    : visibleOptions.find((option) => option.getAttribute("aria-selected") === "true") ?? visibleOptions[0];
  setComboboxActive(input, activeOption ?? null);
  return visibleOptions;
}

function openCombobox(input: HTMLInputElement) {
  const owner = input.closest<HTMLElement>(".sample-combobox");
  const selected = owner?.querySelector<HTMLElement>(".sample-combobox-popup [role='option'][aria-selected='true']");
  const selectedLabel = selected?.querySelector<HTMLElement>(".sample-option-label")?.textContent?.trim();
  if (input.dataset.selectionCommitted === "true" && selectedLabel === input.value) {
    input.value = "";
    input.dataset.selectionCommitted = "false";
  }
  filterCombobox(input);
}

function closeCombobox(input: HTMLInputElement) {
  const owner = input.closest<HTMLElement>(".sample-combobox");
  const listbox = owner?.querySelector<HTMLElement>(".sample-combobox-popup");
  if (!listbox) return;
  setComboboxPopupOpen(input, listbox, false);
  const emptyState = owner?.querySelector<HTMLElement>(".sample-combobox-empty");
  if (emptyState && !emptyState.hidden) {
    emptyState.classList.remove("is-entering");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      emptyState.classList.remove("is-closing");
      emptyState.hidden = true;
    } else {
      emptyState.classList.add("is-closing");
    }
  }
  setComboboxActive(input, null);
}

function selectComboboxOption(input: HTMLInputElement, option: HTMLElement) {
  const owner = input.closest<HTMLElement>(".sample-combobox");
  const sample = input.closest<HTMLElement>(".ui-sample");
  if (!owner || !sample || option.hidden || !owner.contains(option)) return;

  const label = option.querySelector<HTMLElement>(".sample-option-label")?.textContent?.trim() ?? option.textContent?.trim() ?? "";
  comboboxOptions(input).forEach((item) => item.setAttribute("aria-selected", String(item === option)));
  owner.dataset.selectedValue = option.dataset.optionKey ?? label;
  input.value = label;
  input.dataset.selectionCommitted = "true";
  closeCombobox(input);
  announce(sample, `${label} selected.`);
  input.focus({ preventScroll: true });
}

function selectToggleRadio(button: HTMLElement, focus = false) {
  const group = button.closest<HTMLElement>(".sample-toggle-group[role='radiogroup']");
  const sample = button.closest<HTMLElement>(".ui-sample");
  const value = button.dataset.value;
  if (!group || !sample || !value) return;

  const selectionChanged = button.getAttribute("aria-checked") !== "true";
  group.querySelectorAll<HTMLElement>("[role='radio']").forEach((option) => {
    const selected = option === button;
    option.setAttribute("aria-checked", String(selected));
    option.tabIndex = selected ? 0 : -1;
    option.classList.toggle("is-current", selected);
  });

  const preview = sample.querySelector<HTMLElement>(".sample-toggle-preview");
  if (preview) {
    preview.dataset.align = value;
    preview.style.textAlign = value;
  }
  const status = sample.querySelector<HTMLElement>(".sample-toggle-status");
  if (status) status.textContent = `Single selection · ${value[0]?.toUpperCase()}${value.slice(1)}`;
  if (selectionChanged && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    [preview, status].forEach((element) => {
      if (!element) return;
      element.classList.remove("is-changing");
      void element.offsetWidth;
      element.classList.add("is-changing");
    });
  }
  if (focus) button.focus();
}

function initializeToggleGroup(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const label = sample.querySelector<HTMLElement>("[data-toggle-label]");
  const group = sample.querySelector<HTMLElement>(".sample-toggle-group");
  if (!label || !group) return;

  label.id = `sample-toggle-label-${instance.replace(/[^a-z0-9_-]/gi, "-")}`;
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-orientation", "horizontal");
  group.setAttribute("aria-labelledby", label.id);
  group.querySelectorAll<HTMLElement>("[data-value]").forEach((button) => {
    button.setAttribute("role", "radio");
    setAction(button, "select-toggle-radio");
  });

  const selected = group.querySelector<HTMLElement>("[role='radio'][aria-checked='true']")
    ?? group.querySelector<HTMLElement>("[role='radio']");
  if (selected) selectToggleRadio(selected);
}

function initializeMacSegmentedControl(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const group = sample.querySelector<HTMLElement>(".sample-mac-segmented-control");
  const preview = sample.querySelector<HTMLElement>("[data-segmented-preview]");
  if (!group || !preview) return;

  const suffix = instance.replace(/[^a-z0-9_-]/gi, "-");
  preview.id = `sample-mac-segmented-preview-${suffix}`;
  group.setAttribute("aria-controls", preview.id);
  const radios = Array.from(group.querySelectorAll<HTMLButtonElement>("button[data-view]"));
  if (radios.length === 0) return;
  const selected = radios.find((radio) => radio.getAttribute("aria-checked") === "true") ?? radios[0];
  if (!selected) return;
  group.style.setProperty("--segment-index", String(radios.indexOf(selected)));
  radios.forEach((radio) => {
    radio.setAttribute("role", "radio");
    radio.setAttribute("aria-controls", preview.id);
    radio.setAttribute("aria-checked", String(radio === selected));
    radio.tabIndex = radio === selected ? 0 : -1;
    setAction(radio, "select-mac-segment");
  });

  const view = selected.dataset.view;
  if (view) {
    sample.dataset.segmentedView = view;
    sample.querySelectorAll<HTMLElement>("[data-segmented-view]").forEach((panel) => {
      panel.hidden = panel.dataset.segmentedView !== view;
    });
  }
}

function selectMacSegment(button: HTMLButtonElement, focus = false) {
  const sample = button.closest<HTMLElement>(".ui-sample");
  const group = button.closest<HTMLElement>(".sample-mac-segmented-control");
  const view = button.dataset.view;
  if (!sample || !group || !view) return;

  const previousView = sample.dataset.segmentedView;
  const radios = Array.from(group.querySelectorAll<HTMLButtonElement>("[role='radio']"));
  radios.forEach((radio) => {
    const selected = radio === button;
    radio.setAttribute("aria-checked", String(selected));
    radio.tabIndex = selected ? 0 : -1;
  });
  group.style.setProperty("--segment-index", String(radios.indexOf(button)));

  sample.dataset.segmentedView = view;
  sample.querySelectorAll<HTMLElement>("[data-segmented-view]").forEach((panel) => {
    const selected = panel.dataset.segmentedView === view;
    if (!selected) {
      panel.hidden = true;
      panel.classList.remove("is-entering");
      return;
    }

    panel.hidden = false;
    panel.classList.remove("is-entering");
    if (previousView !== view && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void panel.offsetWidth;
      panel.classList.add("is-entering");
      panel.addEventListener("animationend", () => panel.classList.remove("is-entering"), { once: true });
    }
  });

  const label = button.querySelector("span")?.textContent?.trim() ?? view;
  const current = sample.querySelector<HTMLElement>("[data-segmented-current]");
  if (current) current.textContent = `${label} view`;
  const note = sample.querySelector<HTMLElement>("[data-segmented-note]");
  if (note) note.textContent = `${label} view selected. The same folders are arranged for this browsing style.`;
  announce(sample, `${label} view selected.`);
  if (focus) button.focus({ preventScroll: true });
}

const deleteSheetCloseTimers = new WeakMap<HTMLElement, number>();

function initializeDeleteSheet(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const panel = sample.querySelector<HTMLElement>("[data-delete-panel]");
  const scrim = sample.querySelector<HTMLElement>("[data-delete-scrim]");
  const titlebar = sample.querySelector<HTMLElement>(".sample-delete-titlebar");
  const surface = sample.querySelector<HTMLElement>("[data-delete-document-surface]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-open']");
  const title = panel?.querySelector<HTMLElement>("h3");
  const description = panel?.querySelector<HTMLElement>("p");
  if (!panel || !scrim || !titlebar || !surface || !trigger || !title || !description) return;

  const suffix = instance.replace(/[^a-z0-9_-]/gi, "-");
  panel.id = `sample-delete-sheet-${suffix}`;
  title.id = `sample-delete-sheet-title-${suffix}`;
  description.id = `sample-delete-sheet-description-${suffix}`;
  panel.setAttribute("aria-labelledby", title.id);
  panel.setAttribute("aria-describedby", description.id);
  trigger.setAttribute("aria-controls", panel.id);
  trigger.setAttribute("aria-expanded", "false");
  panel.hidden = true;
  panel.inert = true;
  scrim.hidden = true;
  scrim.setAttribute("aria-hidden", "true");
  sample.dataset.deleteSheetOpen = "false";

  if (sample.dataset.deleteSheetReady === "true") return;
  sample.dataset.deleteSheetReady = "true";
  sample.addEventListener("keydown", (event: KeyboardEvent) => {
    if (sample.dataset.deleteSheetOpen !== "true" || !panel.contains(event.target as Node)) return;
    if (event.key === "Escape") {
      // A native <dialog> emits its cancel event for Escape. Let its owner
      // dismiss this window-level sheet first, then keep the preview open.
      if (sample.closest<HTMLDialogElement>(".element-demo-dialog")?.open) return;
      event.preventDefault();
      event.stopPropagation();
      setDeleteSheetOpen(sample, false);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(panel.querySelectorAll<HTMLElement>("button:not(:disabled)"));
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function setDeleteSheetOpen(sample: HTMLElement, open: boolean, returnFocus?: HTMLElement | null) {
  const panel = sample.querySelector<HTMLElement>("[data-delete-panel]");
  const scrim = sample.querySelector<HTMLElement>("[data-delete-scrim]");
  const titlebar = sample.querySelector<HTMLElement>(".sample-delete-window--parent > .sample-delete-titlebar");
  const surface = sample.querySelector<HTMLElement>("[data-delete-document-surface]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-open']");
  const cancel = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-cancel']");
  if (!panel || !scrim || !titlebar || !surface || !trigger) return;

  const timer = deleteSheetCloseTimers.get(sample);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    deleteSheetCloseTimers.delete(sample);
  }

  if (open) {
    panel.hidden = false;
    panel.inert = false;
    panel.setAttribute("aria-hidden", "false");
    scrim.hidden = false;
    scrim.setAttribute("aria-hidden", "false");
    titlebar.inert = true;
    surface.inert = true;
    trigger.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => {
      sample.dataset.deleteSheetOpen = "true";
      cancel?.focus({ preventScroll: true });
    });
    return;
  }

  if (sample.dataset.deleteSheetOpen !== "true") {
    returnFocus?.focus({ preventScroll: true });
    return;
  }
  sample.dataset.deleteSheetOpen = "false";
  trigger.setAttribute("aria-expanded", "false");
  panel.setAttribute("aria-hidden", "true");
  panel.inert = true;
  scrim.setAttribute("aria-hidden", "true");
  titlebar.inert = false;
  surface.inert = false;
  (returnFocus ?? trigger).focus({ preventScroll: true });

  const finishClose = () => {
    panel.hidden = true;
    scrim.hidden = true;
    deleteSheetCloseTimers.delete(sample);
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishClose();
    return;
  }
  deleteSheetCloseTimers.set(sample, window.setTimeout(finishClose, 210));
}

function confirmDeleteSheet(sample: HTMLElement) {
  const file = sample.querySelector<HTMLElement>("[data-delete-file]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-open']");
  const status = sample.querySelector<HTMLElement>("[data-delete-parent-status]");
  const reset = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-reset']");
  if (file) file.hidden = true;
  if (trigger) trigger.hidden = true;
  if (status) status.textContent = "Q3 Report.pdf removed from this demo. Restore it to replay the sheet.";
  if (reset) reset.hidden = false;
  setDeleteSheetOpen(sample, false, reset);
}

function resetDeleteSheet(sample: HTMLElement) {
  const file = sample.querySelector<HTMLElement>("[data-delete-file]");
  const trigger = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-open']");
  const status = sample.querySelector<HTMLElement>("[data-delete-parent-status]");
  const reset = sample.querySelector<HTMLButtonElement>("[data-action='delete-sheet-reset']");
  if (file) file.hidden = false;
  if (trigger) trigger.hidden = false;
  if (status) status.textContent = "Q3 Report.pdf restored in this demo. No real file was changed.";
  if (reset) reset.hidden = true;
  setDeleteSheetOpen(sample, false, trigger);
}

function updateLevelMeter(meter: HTMLElement, requestedValue: number) {
  const min = Number(meter.getAttribute("aria-valuemin") ?? 0);
  const max = Number(meter.getAttribute("aria-valuemax") ?? 10);
  const value = Math.max(min, Math.min(max, Math.round(requestedValue)));
  const previousValue = Number(meter.getAttribute("aria-valuenow") ?? value);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const kind = meter.dataset.levelKind;
  const warning = Number(meter.dataset.warning ?? Number.POSITIVE_INFINITY);
  const critical = Number(meter.dataset.critical ?? Number.POSITIVE_INFINITY);
  let state = "normal";
  let status = "Normal";
  if (kind === "capacity") {
    if (value >= critical) {
      state = "critical";
      status = "Critical";
    } else if (value >= warning) {
      state = "warning";
      status = "Warning";
    }
  } else if (kind === "relevance") {
    status = value >= 8 ? "Strong match" : value >= 4 ? "Moderate match" : "Low match";
  }

  meter.dataset.levelState = state;
  meter.setAttribute("aria-valuenow", String(value));
  meter.setAttribute("aria-valuetext", kind === "capacity"
    ? `${value} of ${max} units used. ${status}.`
    : `${value} of ${max}. ${status}.`);
  meter.querySelectorAll<HTMLElement>("[data-level-segment], :scope > span").forEach((segment, index) => {
    let delay = 0;
    if (!reduceMotion && Number.isFinite(previousValue) && value > previousValue && index >= previousValue && index < value) {
      delay = (index - previousValue) * 16;
    } else if (!reduceMotion && Number.isFinite(previousValue) && value < previousValue && index >= value && index < previousValue) {
      delay = (previousValue - index - 1) * 16;
    }
    if (delay > 0) segment.style.setProperty("--sample-level-delay", `${delay}ms`);
    else segment.style.removeProperty("--sample-level-delay");
    segment.classList.toggle("is-filled", index < value);
  });

  const card = meter.closest<HTMLElement>(".sample-level-card");
  const output = card?.querySelector<HTMLOutputElement>("[data-level-output]");
  if (output) output.textContent = `${value} of ${max} · ${status}`;
  const range = card?.querySelector<HTMLInputElement>("input[type='range']");
  if (range && Number(range.value) !== value) range.value = String(value);
}

function selectLevelRating(button: HTMLElement, focus = false) {
  const group = button.closest<HTMLElement>(".sample-level-rating-group");
  const value = Number(button.dataset.value);
  const radios = Array.from(group?.querySelectorAll<HTMLElement>("[role='radio']") ?? []);
  if (!group || !Number.isFinite(value) || radios.length === 0) return;

  radios.forEach((radio) => {
    const selected = radio === button;
    const rating = Number(radio.dataset.value);
    radio.setAttribute("aria-checked", String(selected));
    radio.tabIndex = selected ? 0 : -1;
    radio.classList.toggle("is-selected", rating <= value);
  });
  const output = group.closest<HTMLElement>(".sample-level-card")?.querySelector<HTMLOutputElement>("[data-level-rating-output]");
  if (output) output.textContent = `${value} of ${radios.length} stars`;
  if (focus) button.focus({ preventScroll: true });
}

function initializeLevelIndicator(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const prefix = `sample-level-${instance.replace(/[^a-z0-9_-]/gi, "-")}`;
  sample.querySelectorAll<HTMLElement>("[data-level-title]").forEach((title) => {
    const kind = title.dataset.levelTitle;
    if (kind) title.id = `${prefix}-${kind}-title`;
  });
  sample.querySelectorAll<HTMLElement>("[data-level-kind]").forEach((meter) => {
    const kind = meter.dataset.levelKind;
    const title = kind ? sample.querySelector<HTMLElement>(`[data-level-title='${kind}']`) : null;
    if (title) meter.setAttribute("aria-labelledby", title.id);
    updateLevelMeter(meter, Number(meter.getAttribute("aria-valuenow") ?? 0));
  });
  sample.querySelectorAll<HTMLElement>("[data-level-help]").forEach((help) => {
    const kind = help.dataset.levelHelp;
    if (!kind) return;
    help.id = `${prefix}-${kind}-help`;
    sample.querySelector<HTMLInputElement>(`.sample-level-card input[data-input-action='level-value'][aria-label='${kind === "capacity" ? "Units used" : "Match score"}']`)
      ?.setAttribute("aria-describedby", help.id);
  });

  const group = sample.querySelector<HTMLElement>(".sample-level-rating-group");
  const ratingTitle = sample.querySelector<HTMLElement>("[data-level-title='rating']");
  if (group && ratingTitle) {
    group.id = `${prefix}-rating-group`;
    group.setAttribute("aria-labelledby", ratingTitle.id);
    group.querySelectorAll<HTMLElement>("[data-action='level-rating']").forEach((button) => {
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", `${button.dataset.value} ${button.dataset.value === "1" ? "star" : "stars"}`);
    });
    const selected = group.querySelector<HTMLElement>("[role='radio'][aria-checked='true']")
      ?? group.querySelector<HTMLElement>("[role='radio']");
    if (selected) selectLevelRating(selected);
  }
}

type ColumnBrowserEntry = {
  id: string;
  label: string;
  kind: "folder" | "file";
  detail?: string;
  children?: ColumnBrowserEntry[];
};

const columnBrowserTree: ColumnBrowserEntry[] = [
  {
    id: "projects",
    label: "Projects",
    kind: "folder",
    children: [
      {
        id: "namethat",
        label: "NameThat",
        kind: "folder",
        children: [
          {
            id: "research",
            label: "research",
            kind: "folder",
            children: [
              { id: "research-notes", label: "Research notes.md", kind: "file", detail: "Interview notes and terminology findings." },
              { id: "user-interviews", label: "User interviews.csv", kind: "file", detail: "Eight product interviews, updated today." },
            ],
          },
          {
            id: "content",
            label: "content",
            kind: "folder",
            children: [
              { id: "element-copy", label: "Element copy.md", kind: "file", detail: "Definitions and interface guidance for the library." },
              { id: "release-notes", label: "Release notes.md", kind: "file", detail: "Changes prepared for the next release." },
            ],
          },
          {
            id: "design",
            label: "design",
            kind: "folder",
            children: [
              { id: "color-study", label: "Color study.fig", kind: "file", detail: "A working study of interface color roles." },
              { id: "layout-review", label: "Layout review.pdf", kind: "file", detail: "A review of the current product layouts." },
            ],
          },
        ],
      },
      {
        id: "fowlvoice",
        label: "FowlVoice",
        kind: "folder",
        children: [
          { id: "fowlvoice-brief", label: "Project brief.md", kind: "file", detail: "Project goals, audience, and delivery notes." },
          { id: "fowlvoice-assets", label: "Assets", kind: "folder", children: [
            { id: "fowlvoice-logo", label: "Logo.svg", kind: "file", detail: "The current FowlVoice logo artwork." },
          ] },
        ],
      },
      {
        id: "vinasig",
        label: "VINASIG",
        kind: "folder",
        children: [
          { id: "vinasig-brand", label: "Brand guide.pdf", kind: "file", detail: "The current identity and usage guidance." },
          { id: "vinasig-assets", label: "Exports", kind: "folder", children: [
            { id: "vinasig-mark", label: "Brand mark.svg", kind: "file", detail: "The primary vector brand mark." },
          ] },
        ],
      },
    ],
  },
  {
    id: "archive",
    label: "Archive",
    kind: "folder",
    children: [
      { id: "archive-2025", label: "2025", kind: "folder", children: [
        { id: "archive-summary", label: "Annual summary.pdf", kind: "file", detail: "A summary of archived project work from 2025." },
      ] },
      { id: "archive-legacy", label: "Legacy exports", kind: "folder", children: [
        { id: "archive-mark", label: "Old brand mark.svg", kind: "file", detail: "A retired brand mark kept for reference." },
      ] },
    ],
  },
];

function columnBrowserPath(browser: HTMLElement) {
  return (browser.dataset.columnPath ?? "").split("/").filter(Boolean);
}

function renderColumnBrowser(browser: HTMLElement, focusItem?: { id: string; columnIndex: number }, revealLastColumn = false) {
  const viewport = browser.querySelector<HTMLElement>("[data-column-view]");
  if (!viewport) return;

  const previousColumnCount = viewport.querySelectorAll(".sample-column-pane").length;
  const previousScrollLeft = viewport.scrollLeft;
  const path = columnBrowserPath(browser);
  const fragment = document.createDocumentFragment();
  const selectedEntries: ColumnBrowserEntry[] = [];
  let entries = columnBrowserTree;

  for (let columnIndex = 0; columnIndex <= path.length && entries.length > 0; columnIndex += 1) {
    const selectedId = path[columnIndex];
    const selectedEntry = selectedId ? entries.find((entry) => entry.id === selectedId) : undefined;
    if (selectedId && !selectedEntry) break;

    const pane = document.createElement("section");
    pane.className = "sample-column-pane";
    pane.dataset.columnIndex = String(columnIndex);
    if (columnIndex >= previousColumnCount || (focusItem && columnIndex > focusItem.columnIndex)) pane.classList.add("is-entering");

    const heading = document.createElement("span");
    heading.className = "sample-column-heading";
    heading.textContent = columnIndex === 0 ? "Files" : selectedEntries[columnIndex - 1]?.label ?? "Files";
    pane.append(heading);

    const list = document.createElement("div");
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", heading.textContent);
    list.setAttribute("aria-orientation", "vertical");

    entries.forEach((entry, entryIndex) => {
      const isSelected = entry === selectedEntry;
      const hasChildren = entry.kind === "folder" && Boolean(entry.children?.length);
      const option = document.createElement("button");
      option.type = "button";
      option.className = "sample-column-item";
      option.dataset.action = "column-select";
      option.dataset.columnId = entry.id;
      option.dataset.columnIndex = String(columnIndex);
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(isSelected));
      if (hasChildren) {
        option.dataset.hasChildren = "true";
        option.setAttribute("aria-description", "Folder. Opens the next column.");
      }
      option.tabIndex = isSelected || (!selectedEntry && entryIndex === 0) ? 0 : -1;

      const icon = document.createElement("i");
      icon.className = "ui-icon";
      icon.dataset.lucide = entry.kind === "folder" ? "folder" : "file-text";
      icon.setAttribute("aria-hidden", "true");
      option.append(icon);

      const label = document.createElement("span");
      label.textContent = entry.label;
      option.append(label);

      if (hasChildren) {
        const branch = document.createElement("i");
        branch.className = "ui-icon sample-column-branch";
        branch.dataset.lucide = "chevron-right";
        branch.setAttribute("aria-hidden", "true");
        option.append(branch);
      }
      list.append(option);
    });

    pane.append(list);
    fragment.append(pane);

    if (!selectedEntry) break;
    selectedEntries.push(selectedEntry);
    if (!selectedEntry.children?.length) break;
    entries = selectedEntry.children;
  }

  viewport.replaceChildren(fragment);
  renderIcons(viewport);

  const pathLabels = selectedEntries.map((entry) => entry.label);
  const visiblePath = pathLabels.length ? pathLabels.join(" / ") : "Files";
  const pathOutput = browser.querySelector<HTMLOutputElement>("[data-column-path-output]");
  const status = browser.querySelector<HTMLElement>("[data-column-status]");
  const lastEntry = selectedEntries.at(-1);
  if (pathOutput) pathOutput.textContent = visiblePath;
  if (status) {
    status.textContent = lastEntry?.kind === "file"
      ? `${visiblePath} · ${lastEntry.detail ?? "File selected."}`
      : lastEntry?.kind === "folder" && !lastEntry.children?.length
        ? `${visiblePath} · This folder is empty.`
        : `${visiblePath} · Select a folder to reveal its contents in the next column.`;
  }

  const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  viewport.scrollLeft = Math.min(previousScrollLeft, maxScrollLeft);
  const lastPane = viewport.querySelector<HTMLElement>(`.sample-column-pane[data-column-index='${Math.max(0, path.length)}']`);
  if (revealLastColumn && lastPane && lastPane.offsetLeft + lastPane.offsetWidth > viewport.scrollLeft + viewport.clientWidth) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({
      left: Math.min(maxScrollLeft, lastPane.offsetLeft + lastPane.offsetWidth - viewport.clientWidth),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }

  if (focusItem) {
    viewport.querySelector<HTMLButtonElement>(`.sample-column-pane[data-column-index='${focusItem.columnIndex}'] [data-column-id='${focusItem.id}']`)
      ?.focus({ preventScroll: true });
  }
}

function initializeColumnBrowser(sample: HTMLElement) {
  sample.querySelectorAll<HTMLElement>("[data-column-browser]").forEach((browser) => {
    if (!browser.dataset.columnPath) browser.dataset.columnPath = "projects/namethat";
    renderColumnBrowser(browser);
  });
}

function selectColumnBrowserItem(button: HTMLElement, focusNextColumn = false) {
  const browser = button.closest<HTMLElement>("[data-column-browser]");
  const id = button.dataset.columnId;
  const columnIndex = Number(button.dataset.columnIndex);
  const viewport = browser?.querySelector<HTMLElement>("[data-column-view]");
  if (!browser || !viewport || !id || !Number.isInteger(columnIndex)) return;

  const nextPath = columnBrowserPath(browser).slice(0, columnIndex).concat(id);
  browser.dataset.columnPath = nextPath.join("/");
  renderColumnBrowser(browser, { id, columnIndex }, true);

  if (focusNextColumn) {
    const nextOption = viewport.querySelector<HTMLButtonElement>(`.sample-column-pane[data-column-index='${columnIndex + 1}'] [role='option']`);
    nextOption?.focus({ preventScroll: true });
  }
}

function initializeComboboxSample(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const owner = sample.querySelector<HTMLElement>(".sample-combobox");
  const label = owner?.querySelector<HTMLLabelElement>("[data-combobox-label]");
  const input = owner?.querySelector<HTMLInputElement>(".sample-combo-input");
  const listbox = owner?.querySelector<HTMLElement>(".sample-combobox-popup");
  const emptyState = owner?.querySelector<HTMLElement>(".sample-combobox-empty");
  if (!owner || !label || !input || !listbox) return;

  const prefix = `sample-combobox-${instance.replace(/[^a-z0-9_-]/gi, "-")}`;
  label.id = `${prefix}-label`;
  input.id = `${prefix}-input`;
  label.htmlFor = input.id;
  input.setAttribute("aria-labelledby", label.id);
  input.setAttribute("aria-controls", `${prefix}-options`);
  input.setAttribute("aria-autocomplete", "list");
  input.dataset.inputAction = "combobox-filter";
  listbox.id = `${prefix}-options`;

  const options = comboboxOptions(input);
  options.forEach((option, index) => {
    const key = option.dataset.optionKey ?? String(index + 1);
    option.id = `${prefix}-option-${key.replace(/[^a-z0-9_-]/gi, "-")}`;
    option.setAttribute("role", "option");
    if (!option.hasAttribute("aria-selected")) option.setAttribute("aria-selected", "false");
  });
  listbox.setAttribute("role", "listbox");
  if (listbox.dataset.animationBound !== "true") {
    listbox.dataset.animationBound = "true";
    listbox.addEventListener("animationend", (event) => {
      if (event.target !== listbox || event.animationName !== "sample-combobox-popup-exit") return;
      if (input.getAttribute("aria-expanded") !== "false") return;
      listbox.classList.remove("is-closing");
      listbox.hidden = true;
    });
  }
  if (emptyState && emptyState.dataset.animationBound !== "true") {
    emptyState.dataset.animationBound = "true";
    emptyState.addEventListener("animationend", (event) => {
      if (event.target !== emptyState || event.animationName !== "sample-combobox-popup-exit") return;
      if (input.getAttribute("aria-expanded") !== "false") return;
      emptyState.classList.remove("is-closing");
      emptyState.hidden = true;
    });
  }
  if (!input.hasAttribute("aria-expanded")) input.setAttribute("aria-expanded", "true");
  if (input.getAttribute("aria-expanded") === "true") {
    listbox.hidden = false;
    filterCombobox(input);
  } else {
    listbox.hidden = true;
    setComboboxActive(input, null);
  }
}

function commandPaletteOptions(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(".sample-command-dialog [role='option']"));
}

function setCommandPaletteActive(root: HTMLElement, option: HTMLElement | null) {
  const input = root.querySelector<HTMLInputElement>(".sample-command-input");
  commandPaletteOptions(root).forEach((item) => {
    const active = item === option;
    item.dataset.active = String(active);
    item.setAttribute("aria-selected", String(active));
  });
  if (option?.id) input?.setAttribute("aria-activedescendant", option.id);
  else input?.removeAttribute("aria-activedescendant");
}

function filterCommandPalette(input: HTMLInputElement, animateResults = false) {
  const root = input.closest<HTMLElement>(".sample-command-demo");
  if (!root) return [];
  const query = input.value.trim().toLocaleLowerCase();
  const options = commandPaletteOptions(root);
  const shouldAnimate = animateResults && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visible = options.filter((option) => {
    const search = `${option.dataset.commandSearch ?? ""} ${option.dataset.commandLabel ?? option.textContent ?? ""}`.toLocaleLowerCase();
    const matches = search.includes(query);
    option.hidden = !matches;
    option.classList.remove("is-entering");
    return matches;
  });
  root.querySelectorAll<HTMLElement>(".sample-command-group").forEach((group) => {
    group.hidden = !group.querySelector<HTMLElement>("[role='option']:not([hidden])");
  });
  const empty = root.querySelector<HTMLElement>("[data-command-empty]");
  if (empty) {
    empty.hidden = visible.length > 0;
    empty.classList.remove("is-entering");
  }
  setCommandPaletteActive(root, visible[0] ?? null);
  if (shouldAnimate) {
    const listbox = root.querySelector<HTMLElement>(".sample-command-results");
    if (listbox) void listbox.offsetWidth;
    visible.forEach((option, index) => {
      option.style.setProperty("--command-result-delay", `${Math.min(index * 18, 72)}ms`);
      option.classList.add("is-entering");
    });
    if (empty && !empty.hidden) empty.classList.add("is-entering");
  }
  return visible;
}

function openCommandPalette(root: HTMLElement, opener?: HTMLElement) {
  const panel = root.querySelector<HTMLDialogElement>(".sample-command-dialog");
  const input = root.querySelector<HTMLInputElement>(".sample-command-input");
  const trigger = opener ?? root.querySelector<HTMLElement>(".sample-command-trigger");
  if (!panel || !input || !trigger) return;

  const closeTimer = commandPaletteCloseTimers.get(root);
  if (closeTimer !== undefined) window.clearTimeout(closeTimer);
  commandPaletteCloseTimers.delete(root);
  if (root.dataset.commandOpen === "true") {
    panel.dataset.state = "open";
    input.focus({ preventScroll: true });
    return;
  }

  commandPaletteOpeners.set(root, trigger);
  root.dataset.commandOpen = "true";
  trigger.setAttribute("aria-expanded", "true");
  panel.dataset.state = "opening";
  if (!panel.open) panel.showModal();
  input.value = "";
  input.setAttribute("aria-expanded", "true");
  filterCommandPalette(input);
  requestAnimationFrame(() => {
    if (root.dataset.commandOpen !== "true") return;
    panel.dataset.state = "open";
  });
  input.focus({ preventScroll: true });
}

function closeCommandPalette(root: HTMLElement, restoreFocus = true) {
  const panel = root.querySelector<HTMLDialogElement>(".sample-command-dialog");
  const input = root.querySelector<HTMLInputElement>(".sample-command-input");
  const trigger = commandPaletteOpeners.get(root) ?? root.querySelector<HTMLElement>(".sample-command-trigger");
  if (!panel || !input || root.dataset.commandOpen !== "true") return;

  root.dataset.commandOpen = "false";
  trigger?.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  panel.dataset.state = "closing";
  const finishClose = () => {
    if (panel.open) panel.close();
    panel.dataset.state = "closed";
    commandPaletteCloseTimers.delete(root);
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishClose();
  } else {
    commandPaletteCloseTimers.set(root, window.setTimeout(finishClose, 170));
  }
}

function selectCommandPaletteOption(option: HTMLElement) {
  const root = option.closest<HTMLElement>(".sample-command-demo");
  const sample = option.closest<HTMLElement>(".ui-sample");
  const label = option.dataset.commandLabel ?? option.textContent?.trim() ?? "Command";
  const workspaceStatus = root?.querySelector<HTMLElement>("[data-command-workspace-status]");
  if (!root || !sample || option.hidden) return;
  if (workspaceStatus) workspaceStatus.textContent = `${label} selected in this preview.`;
  announce(sample, `${label} selected. The command palette preview does not navigate or create project data.`);
  closeCommandPalette(root);
}

function initializeCommandPalette(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const root = sample.querySelector<HTMLElement>(".sample-command-demo");
  const trigger = root?.querySelector<HTMLButtonElement>(".sample-command-trigger");
  const panel = root?.querySelector<HTMLDialogElement>(".sample-command-dialog");
  const input = root?.querySelector<HTMLInputElement>(".sample-command-input");
  const listbox = root?.querySelector<HTMLElement>(".sample-command-results");
  const title = root?.querySelector<HTMLElement>("#sample-command-title");
  const help = root?.querySelector<HTMLElement>(".sample-command-help");
  if (!root || !trigger || !panel || !input || !listbox || !title || !help) return;

  const prefix = `sample-command-${instance.replace(/[^a-z0-9_-]/gi, "-")}`;
  panel.id = `${prefix}-dialog`;
  trigger.setAttribute("aria-controls", panel.id);
  title.id = `${prefix}-title`;
  panel.setAttribute("aria-labelledby", title.id);
  listbox.id = `${prefix}-results`;
  input.id = `${prefix}-input`;
  input.setAttribute("aria-controls", listbox.id);
  help.id = `${prefix}-key-help`;
  input.setAttribute("aria-describedby", help.id);
  root.querySelectorAll<HTMLElement>(".sample-command-group").forEach((group, groupIndex) => {
    const heading = group.querySelector<HTMLElement>("h4");
    if (!heading) return;
    heading.id = `${prefix}-group-${groupIndex + 1}`;
    group.setAttribute("aria-labelledby", heading.id);
  });
  commandPaletteOptions(root).forEach((option, index) => {
    option.id = `${prefix}-option-${index + 1}`;
    option.setAttribute("aria-selected", "false");
    option.dataset.active = "false";
  });
  root.dataset.commandOpen = "false";
  if (panel.open) panel.close();
  panel.dataset.state = "closed";
  panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeCommandPalette(root);
  });
  trigger.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
}

function updateFormFieldState(input: HTMLInputElement, touched = false) {
  const field = input.closest<HTMLElement>(".sample-form-field");
  const helper = field?.querySelector<HTMLElement>("[data-form-helper]");
  const error = field?.querySelector<HTMLElement>("[data-form-error]");
  if (!field || !helper || !error) return;

  if (touched) input.dataset.touched = "true";
  const value = input.value.trim();
  let message = "";

  if (!value && input.required && input.dataset.touched === "true") {
    message = input.dataset.formField === "email" ? "Enter your email address." : "Enter a username.";
  } else if (value && input.type === "email" && input.validity.typeMismatch) {
    message = "Enter a valid email address.";
  } else if (value && input.validity.patternMismatch) {
    message = "No punctuation allowed.";
  }

  const invalid = message.length > 0;
  error.textContent = message;
  error.hidden = !invalid;
  helper.hidden = invalid;
  if (invalid) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", error.id);
    input.setAttribute("aria-errormessage", error.id);
  } else {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-errormessage");
    input.setAttribute("aria-describedby", helper.id);
  }
}

function initializeFormFieldSample(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  sample.querySelectorAll<HTMLElement>(".sample-form-field").forEach((field, index) => {
    const input = field.querySelector<HTMLInputElement>("[data-form-field]");
    const label = field.querySelector<HTMLLabelElement>(".sample-form-field-label label");
    const helper = field.querySelector<HTMLElement>("[data-form-helper]");
    const error = field.querySelector<HTMLElement>("[data-form-error]");
    if (!input || !label || !helper || !error) return;

    const key = input.dataset.formField ?? String(index + 1);
    input.id = `sample-form-${instance}-${key}`;
    label.htmlFor = input.id;
    helper.id = `${input.id}-hint`;
    error.id = `${input.id}-error`;
    if (key === "username" && input.value) input.dataset.touched = "true";
    updateFormFieldState(input);
  });
}

function toCivilDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromCivilDate(value: string) {
  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function calendarMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCalendarDate(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en", options).format(fromCivilDate(value));
}

function updateCalendarDisplay(picker: HTMLElement) {
  const calendar = picker.querySelector<HTMLElement>(".sample-calendar");
  const value = picker.querySelector<HTMLElement>("[data-calendar-value]");
  const hint = calendar?.querySelector<HTMLElement>("[data-calendar-hint]");
  if (!calendar || !value) return;

  const start = calendar.dataset.rangeStart;
  const end = calendar.dataset.rangeEnd;
  if (picker.dataset.calendarMode !== "range") {
    value.textContent = start ? formatCalendarDate(start, { month: "short", day: "numeric", year: "numeric" }) : "Choose a date";
    if (hint) hint.textContent = "Choose a date from the calendar.";
    return;
  }
  if (start && end) {
    const startDate = fromCivilDate(start);
    const endDate = fromCivilDate(end);
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const startLabel = formatCalendarDate(start, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
    const endLabel = formatCalendarDate(end, { month: "short", day: "numeric", year: "numeric" });
    value.textContent = `${startLabel} – ${endLabel}`;
    if (hint) hint.textContent = "Choose a new start date to change this range.";
  } else if (start) {
    value.textContent = `${formatCalendarDate(start)} – Choose end date`;
    if (hint) hint.textContent = `Choose an end date on or after ${formatCalendarDate(start, { month: "long", day: "numeric", year: "numeric" })}.`;
  } else {
    value.textContent = "Choose a date range";
    if (hint) hint.textContent = "Choose a start date, then an end date.";
  }
}

function enhanceCalendar(sample: HTMLElement) {
  const picker = sample.querySelector<HTMLElement>(".sample-date-picker");
  const calendar = picker?.querySelector<HTMLElement>(".sample-calendar");
  const title = calendar?.querySelector<HTMLElement>("[data-calendar-title]");
  const grid = calendar?.querySelector<HTMLElement>(".sample-calendar-grid");
  const hint = calendar?.querySelector<HTMLElement>("[data-calendar-hint]");
  const trigger = picker?.querySelector<HTMLButtonElement>("[data-action='calendar-toggle']");
  if (!picker || !calendar || !title || !grid || !trigger) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  const today = new Date();
  const todayValue = toCivilDate(today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startDay = Math.min(5, daysInMonth);
  const endDay = Math.min(16, daysInMonth);
  calendar.dataset.calendarMonth = calendarMonthValue(today);
  calendar.dataset.today = todayValue;
  calendar.dataset.rangeStart = `${calendarMonthValue(today)}-${String(startDay).padStart(2, "0")}`;
  calendar.dataset.rangeEnd = `${calendarMonthValue(today)}-${String(endDay).padStart(2, "0")}`;
  calendar.dataset.calendarFocusDate = calendar.dataset.rangeStart;
  calendar.id = `sample-calendar-${instance}`;
  title.id = `${calendar.id}-title`;
  title.setAttribute("aria-live", "polite");
  if (hint) hint.id = `${calendar.id}-hint`;
  grid.setAttribute("aria-labelledby", title.id);
  calendar.setAttribute("aria-labelledby", title.id);
  trigger.setAttribute("aria-controls", calendar.id);
  if (hint) trigger.setAttribute("aria-describedby", hint.id);
  picker.dataset.calendarOpen = "true";
  calendar.dataset.calendarMotion = "open";
  calendar.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  updateCalendarDisplay(picker);
  renderCalendar(calendar);
}

function renderCalendar(calendar: HTMLElement) {
  const title = calendar.querySelector<HTMLElement>("[data-calendar-title]");
  const grid = calendar.querySelector<HTMLElement>(".sample-calendar-grid");
  if (!title || !grid) return;

  const monthValue = calendar.dataset.calendarMonth ?? "2026-09";
  const firstDate = fromCivilDate(`${monthValue}-01`);
  if (!Number.isFinite(firstDate.getTime())) return;
  const year = firstDate.getFullYear();
  const month = firstDate.getMonth() + 1;
  title.textContent = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(firstDate);
  grid.setAttribute("aria-label", `Dates in ${title.textContent}`);
  grid.replaceChildren();

  const headingRow = document.createElement("div");
  headingRow.setAttribute("role", "row");
  headingRow.className = "sample-calendar-weekdays";
  for (const [short, long] of [["Su", "Sunday"], ["Mo", "Monday"], ["Tu", "Tuesday"], ["We", "Wednesday"], ["Th", "Thursday"], ["Fr", "Friday"], ["Sa", "Saturday"]] as const) {
    const weekday = document.createElement("span");
    weekday.setAttribute("role", "columnheader");
    weekday.setAttribute("aria-label", long);
    weekday.textContent = short;
    headingRow.append(weekday);
  }
  grid.append(headingRow);

  const offset = firstDate.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const rowCount = Math.ceil((offset + daysInMonth) / 7);
  const start = calendar.dataset.rangeStart;
  const end = calendar.dataset.rangeEnd;
  const today = calendar.dataset.today;
  let focusDate = calendar.dataset.calendarFocusDate;
  if (!focusDate || !focusDate.startsWith(monthValue)) {
    focusDate = start?.startsWith(monthValue) ? start : `${monthValue}-01`;
    calendar.dataset.calendarFocusDate = focusDate;
  }

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("div");
    row.setAttribute("role", "row");
    row.className = "sample-calendar-week";
    for (let column = 0; column < 7; column += 1) {
      const day = rowIndex * 7 + column - offset + 1;
      if (day < 1 || day > daysInMonth) {
        const spacer = document.createElement("span");
        spacer.setAttribute("role", "gridcell");
        spacer.setAttribute("aria-hidden", "true");
        row.append(spacer);
        continue;
      }

      const dateValue = `${monthValue}-${String(day).padStart(2, "0")}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sample-calendar-day";
      button.textContent = String(day);
      button.dataset.date = dateValue;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", formatCalendarDate(dateValue, { dateStyle: "full" }));
      const isStart = dateValue === start;
      const isEnd = dateValue === end;
      const isBetween = Boolean(start && end && dateValue > start && dateValue < end);
      const isSelected = isStart || isEnd || isBetween;
      button.setAttribute("aria-selected", String(isSelected));
      button.tabIndex = dateValue === focusDate ? 0 : -1;
      if (dateValue === today) button.setAttribute("aria-current", "date");
      if (isStart) button.classList.add("is-selected", "is-range-start");
      if (isEnd) button.classList.add("is-selected", "is-range-end");
      if (isBetween) button.classList.add("is-range-middle");
      if (dateValue === today) button.classList.add("is-today");
      setAction(button, "calendar-day");
      row.append(button);
    }
    grid.append(row);
  }
}

function initializeLoginSample(sample: HTMLElement) {
  const form = sample.querySelector<HTMLFormElement>("[data-login-form]");
  if (!form) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  const email = form.querySelector<HTMLInputElement>("[data-login-field='email']");
  const password = form.querySelector<HTMLInputElement>("[data-login-field='password']");
  const error = form.querySelector<HTMLElement>("[data-login-error]");
  const submit = form.querySelector<HTMLButtonElement>("[data-action='submit-demo']");

  if (email) {
    email.id = `sample-login-email-${instance}`;
    email.name = "username";
    email.autocomplete = "username";
    email.setAttribute("aria-invalid", "false");
  }
  if (password) {
    password.id = `sample-login-password-${instance}`;
    password.name = "password";
    password.autocomplete = "current-password";
    password.setAttribute("aria-invalid", "false");
  }
  if (error) {
    error.id = `sample-login-error-${instance}`;
    error.hidden = true;
    error.textContent = "";
  }

  const emailLabel = form.querySelector<HTMLLabelElement>(":scope > label");
  const passwordLabel = form.querySelector<HTMLLabelElement>(".sample-login-password-heading label");
  if (emailLabel && email) emailLabel.htmlFor = email.id;
  if (passwordLabel && password) passwordLabel.htmlFor = password.id;
  if (error) {
    email?.setAttribute("aria-describedby", error.id);
    password?.setAttribute("aria-describedby", error.id);
  }
  if (submit) submit.type = "submit";
  form.dataset.validationAttempted = "false";
}

function validateLoginForm(sample: HTMLElement) {
  const email = sample.querySelector<HTMLInputElement>("[data-login-field='email']");
  const password = sample.querySelector<HTMLInputElement>("[data-login-field='password']");
  const error = sample.querySelector<HTMLElement>("[data-login-error]");
  const emailValid = Boolean(email?.validity.valid);
  const passwordValid = Boolean(password?.validity.valid);
  const valid = emailValid && passwordValid;

  if (email) email.setAttribute("aria-invalid", String(!emailValid));
  if (password) password.setAttribute("aria-invalid", String(!passwordValid));
  if (error) {
    if (!emailValid) email?.setAttribute("aria-describedby", error.id);
    else email?.removeAttribute("aria-describedby");
    if (!passwordValid) password?.setAttribute("aria-describedby", error.id);
    else password?.removeAttribute("aria-describedby");
  }
  if (error) {
    error.hidden = valid;
    error.textContent = !emailValid && !passwordValid
      ? "Enter a valid email address and password."
      : !emailValid
        ? "Enter a valid email address."
        : !passwordValid
          ? "Enter your password."
          : "";
  }

  return { valid, email, password };
}

function initializeProgressDemo(
  sample: HTMLElement,
  options: { autoStart?: boolean; autoStartWhenVisible?: boolean; reset?: boolean } = {},
) {
  progressDemoCleanups.get(sample)?.();

  const targetValue = 72;
  const ring = sample.querySelector<HTMLElement>(".sample-progress-ring");
  const arc = sample.querySelector<SVGCircleElement>("[data-progress-arc]");
  const bar = sample.querySelector<HTMLProgressElement>("[data-progress-bar]");
  const percent = sample.querySelector<HTMLElement>("[data-progress-percent]");
  const caption = sample.querySelector<HTMLElement>("[data-progress-caption]");
  const toggleButton = sample.querySelector<HTMLButtonElement>("[data-action='progress-toggle']");
  const status = sample.querySelector<HTMLElement>("[data-progress-status]");
  if (!ring || !arc || !bar || !percent || !caption || !toggleButton || !status) return;

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let value = options.reset ? 27 : Math.max(0, Math.min(targetValue, Number(sample.dataset.progressValue ?? 27)));
  let state: "ready" | "running" | "paused" | "complete" = "ready";
  let frame = 0;
  let observer: IntersectionObserver | null = null;
  let animationStartedAt = 0;
  let animationFrom = value;
  let lastPaintAt = 0;

  const setProgress = (nextValue: number) => {
    value = Math.max(0, Math.min(targetValue, Math.round(nextValue)));
    sample.dataset.progressValue = String(value);
    ring.setAttribute("aria-valuenow", String(value));
    percent.textContent = `${value}%`;
    arc.style.strokeDashoffset = String(125.66 * (1 - value / 100));
    bar.value = value;
    bar.textContent = `${value}%`;
    caption.textContent = `Upload, ${value}%`;
  };

  const renderButton = () => {
    if (state === "running") toggleButton.textContent = "Pause progress";
    else if (state === "complete") toggleButton.textContent = "Replay progress";
    else if (motionPreference.matches && value < targetValue) toggleButton.textContent = "Advance progress";
    else if (state === "paused") toggleButton.textContent = "Resume progress";
    else toggleButton.textContent = "Start progress";
  };

  const stopFrame = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    animationStartedAt = 0;
  };

  const announceStatus = (message: string) => {
    status.textContent = message;
  };

  const complete = () => {
    stopFrame();
    setProgress(targetValue);
    state = "complete";
    renderButton();
    announceStatus("Upload progress reached 72 percent. The spinner still has no time estimate.");
  };

  const animate = (timestamp: number) => {
    if (state !== "running") return;
    if (!animationStartedAt) animationStartedAt = timestamp;
    const duration = Math.max(900, ((targetValue - animationFrom) / 45) * 3000);
    const progress = Math.min(1, (timestamp - animationStartedAt) / duration);

    if (timestamp - lastPaintAt >= 120 || progress === 1) {
      setProgress(animationFrom + (targetValue - animationFrom) * progress);
      lastPaintAt = timestamp;
    }

    if (progress === 1) complete();
    else frame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    observer?.disconnect();
    observer = null;
    if (motionPreference.matches) {
      stopFrame();
      setProgress(targetValue);
      state = "complete";
      renderButton();
      announceStatus("Progress advanced without animation because reduced motion is enabled.");
      return;
    }
    if (value >= targetValue) setProgress(27);
    animationFrom = value;
    lastPaintAt = 0;
    state = "running";
    renderButton();
    announceStatus("Upload progress is moving toward 72 percent. The spinner remains indeterminate.");
    frame = window.requestAnimationFrame(animate);
  };

  const toggle = () => {
    if (state === "running") {
      stopFrame();
      state = "paused";
      renderButton();
      announceStatus(`Upload progress paused at ${value} percent. The spinner remains indeterminate.`);
      return;
    }
    if (state === "complete") setProgress(27);
    start();
  };

  const reset = () => {
    stopFrame();
    observer?.disconnect();
    observer = null;
    state = "ready";
    setProgress(27);
    renderButton();
    announceStatus("Upload progress reset to 27 percent.");
  };

  const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
    if (event.matches && state === "running") {
      stopFrame();
      state = "paused";
      renderButton();
      announceStatus("Progress paused because reduced motion is enabled. You can advance the value without animation.");
    } else {
      renderButton();
    }
  };

  setProgress(value);
  renderButton();
  if (motionPreference.matches) {
    announceStatus("Reduced motion is enabled. Advance the progress value without animation.");
  }
  motionPreference.addEventListener("change", onMotionPreferenceChange);

  const cleanup = () => {
    stopFrame();
    observer?.disconnect();
    motionPreference.removeEventListener("change", onMotionPreferenceChange);
  };
  progressDemoControllers.set(sample, { toggle, reset, cleanup });
  progressDemoCleanups.set(sample, cleanup);

  if (options.autoStart && !motionPreference.matches) start();
  else if (options.autoStartWhenVisible && !motionPreference.matches) {
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
      }, { threshold: 0.2 });
      observer.observe(sample);
    } else {
      start();
    }
  }
}

const inboxMailboxLabels: Record<string, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
};

function inboxMessageRows(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLButtonElement>(".sample-inbox-message"));
}

function inboxVisibleRows(root: HTMLElement) {
  const mailbox = root.dataset.activeMailbox ?? "inbox";
  const query = root.querySelector<HTMLInputElement>("[data-input-action='inbox-search']")?.value.trim().toLocaleLowerCase() ?? "";
  return inboxMessageRows(root).filter((row) => {
    const mailboxes = (row.dataset.mailboxes ?? "").split(",");
    if (!mailboxes.includes(mailbox)) return false;
    const searchable = [row.dataset.sender, row.dataset.subject, row.dataset.preview].join(" ").toLocaleLowerCase();
    return !query || searchable.includes(query);
  });
}

function setInboxBody(element: HTMLElement, body: string) {
  element.replaceChildren();
  body.split("\n").forEach((line, index) => {
    if (index > 0) element.append(document.createElement("br"));
    if (line) element.append(document.createTextNode(line));
  });
}

function renderInboxSplitView(root: HTMLElement, options: { preserveSelection?: boolean; markRead?: boolean; animateList?: boolean; animateDetail?: boolean } = {}) {
  const rows = inboxVisibleRows(root);
  const selectedId = root.dataset.selectedMessage;
  const selected = (options.preserveSelection === false ? null : rows.find((row) => row.dataset.messageId === selectedId)) ?? rows[0] ?? null;
  const label = inboxMailboxLabels[root.dataset.activeMailbox ?? "inbox"] ?? "Inbox";
  const listTitle = root.querySelector<HTMLElement>("[data-inbox-list-title]");
  const list = root.querySelector<HTMLElement>("[data-inbox-list]");
  const detail = root.querySelector<HTMLElement>("[data-inbox-detail]");
  const empty = root.querySelector<HTMLElement>("[data-inbox-empty]");
  const footer = root.querySelector<HTMLElement>(".sample-inbox-status");
  if (listTitle) listTitle.textContent = label;
  if (list) list.setAttribute("aria-label", `${label} messages`);
  if (empty) empty.hidden = rows.length > 0;

  const selectedIdValue = selected?.dataset.messageId ?? "";
  root.dataset.selectedMessage = selectedIdValue;
  root.querySelectorAll<HTMLElement>("[data-action='inbox-folder']").forEach((button) => {
    const count = inboxMessageRows(root).filter((row) => (row.dataset.mailboxes ?? "").split(",").includes(button.dataset.mailbox ?? "")).length;
    const countNode = button.closest(".sample-inbox-sidebar")
      ? button.querySelector<HTMLElement>("b")
      : button.querySelector<HTMLElement>("span");
    if (countNode && (button.dataset.mailbox === "inbox" || button.dataset.mailbox === "archive")) {
      countNode.textContent = String(count);
      countNode.hidden = count === 0;
    }
  });
  inboxMessageRows(root).forEach((row) => {
    const visible = rows.includes(row);
    const current = row === selected;
    row.hidden = !visible;
    row.classList.toggle("is-current", current);
    row.setAttribute("aria-selected", String(current));
    if (detail?.id) row.setAttribute("aria-controls", detail.id);
    row.tabIndex = current ? 0 : -1;
    if (current && options.markRead) row.dataset.unread = "false";
    const unread = row.dataset.unread === "true";
    const dot = row.querySelector<HTMLElement>(".sample-inbox-unread-dot");
    if (dot) dot.hidden = !unread;
    row.setAttribute("aria-label", `${row.dataset.sender ?? "Message"}, ${row.dataset.subject ?? ""}${unread ? ", unread" : ""}${current ? ", selected" : ""}`);
    if (!visible || options.animateList) row.classList.remove("is-entering");
    if (visible && options.animateList) row.style.setProperty("--inbox-enter-delay", `${Math.min(rows.indexOf(row), 5) * 18}ms`);
  });

  if (options.animateList && list) {
    void list.offsetWidth;
    rows.forEach((row) => {
      if (!row.hidden) row.classList.add("is-entering");
    });
  }

  root.querySelectorAll<HTMLButtonElement>("[data-action='inbox-folder']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mailbox === (root.dataset.activeMailbox ?? "inbox")));
  });
  if (!selected) {
    if (detail) detail.hidden = true;
    if (footer) footer.textContent = rows.length ? `No message selected · ${label}` : `No messages in ${label}`;
    announce(root.closest<HTMLElement>(".ui-sample") ?? root, rows.length ? "No message selected." : `No messages in ${label}.`);
    return;
  }

  if (detail) {
    detail.hidden = false;
    detail.setAttribute("aria-label", `Message from ${selected.dataset.sender}: ${selected.dataset.subject}`);
    detail.classList.remove("is-updating");
    if (options.markRead || options.animateDetail) {
      void detail.offsetWidth;
      detail.classList.add("is-updating");
    }
  }
  const setText = (selector: string, value: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };
  setText("[data-inbox-folder-label]", label.toLocaleUpperCase());
  setText("[data-inbox-sender]", selected.dataset.sender ?? "");
  setText("[data-inbox-subject]", selected.dataset.subject ?? "");
  setText("[data-inbox-preview]", selected.dataset.preview ?? "");
  setText("[data-inbox-time]", selected.dataset.time ?? "");
  setText("[data-inbox-sender-avatar]", (selected.dataset.sender ?? "").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toLocaleUpperCase());
  const body = root.querySelector<HTMLElement>("[data-inbox-body]");
  if (body) setInboxBody(body, selected.dataset.body ?? "");
  const star = root.querySelector<HTMLButtonElement>("[data-action='inbox-toggle-star']");
  const starred = selected.dataset.starred === "true";
  if (star) {
    star.setAttribute("aria-pressed", String(starred));
    star.setAttribute("aria-label", starred ? "Remove star from message" : "Star message");
    star.classList.toggle("is-starred", starred);
  }
  const archive = root.querySelector<HTMLButtonElement>("[data-action='inbox-archive-message']");
  const archived = selected.dataset.archived === "true";
  if (archive) {
    archive.disabled = archived;
    archive.setAttribute("aria-label", archived ? "Message already archived" : "Archive message");
  }
  const count = rows.length;
  if (footer) footer.textContent = `${count} ${count === 1 ? "message" : "messages"} in ${label} · ${selected.dataset.subject ?? "Selected"}`;
  announce(root.closest<HTMLElement>(".ui-sample") ?? root, `${count} ${count === 1 ? "message" : "messages"} in ${label}. Selected ${selected.dataset.subject}.`);
}

function initializeInboxSplitView(sample: HTMLElement) {
  const root = sample.querySelector<HTMLElement>(".sample-inbox");
  const workspace = root?.querySelector<HTMLElement>("[data-inbox-workspace]");
  if (!root || !workspace) return;
  const prefix = `sample-inbox-${sample.dataset.sampleInstance ?? "example"}`;
  const mailboxes = root.querySelector<HTMLElement>("[data-inbox-mailboxes]");
  const list = root.querySelector<HTMLElement>("[data-inbox-list]");
  const detail = root.querySelector<HTMLElement>("[data-inbox-detail]");
  if (mailboxes) mailboxes.id = `${prefix}-mailboxes`;
  if (list) list.id = `${prefix}-list`;
  if (detail) detail.id = `${prefix}-detail`;
  root.querySelector<HTMLButtonElement>(".sample-inbox-sidebar-toggle")?.setAttribute("aria-controls", `${prefix}-mailboxes`);
  const listTitle = root.querySelector<HTMLElement>("[data-inbox-list-title]");
  if (listTitle) listTitle.id = `${prefix}-list-title`;
  list?.setAttribute("aria-labelledby", `${prefix}-list-title`);
  const splitters = Array.from(root.querySelectorAll<HTMLElement>("[data-inbox-splitter]"));
  splitters.forEach((splitter) => {
    const pane = splitter.dataset.inboxSplitter;
    splitter.setAttribute("aria-controls", pane === "sidebar" ? `${prefix}-mailboxes ${prefix}-list` : `${prefix}-list ${prefix}-detail`);
    const min = Number(splitter.getAttribute("aria-valuemin") ?? 100);
    const initial = pane === "sidebar" ? 136 : 224;
    root.style.setProperty(pane === "sidebar" ? "--inbox-sidebar-width" : "--inbox-list-width", `${initial}px`);
    splitter.setAttribute("aria-valuenow", String(initial));
    splitter.setAttribute("aria-valuetext", `${initial} pixels`);

    let dragPointer: number | null = null;
    const update = (value: number) => {
      const currentPane = pane === "sidebar" ? "sidebar" : "list";
      const sideWidth = root.classList.contains("is-sidebar-collapsed")
        ? 0
        : Number.parseFloat(getComputedStyle(root).getPropertyValue("--inbox-sidebar-width")) || 136;
      const listWidth = Number.parseFloat(getComputedStyle(root).getPropertyValue("--inbox-list-width")) || 224;
      const separatorWidth = 7;
      const minimumDetailWidth = 180;
      const otherWidth = currentPane === "sidebar" ? listWidth : sideWidth;
      const maximum = Math.max(min, workspace.clientWidth - otherWidth - separatorWidth * 2 - minimumDetailWidth);
      const next = Math.round(Math.min(maximum, Math.max(min, value)));
      root.style.setProperty(currentPane === "sidebar" ? "--inbox-sidebar-width" : "--inbox-list-width", `${next}px`);
      splitter.setAttribute("aria-valuenow", String(next));
      splitter.setAttribute("aria-valuemax", String(maximum));
      splitter.setAttribute("aria-valuetext", `${next} pixels`);
    };
    const pointerValue = (clientX: number) => {
      const workspaceLeft = workspace.getBoundingClientRect().left;
      if (pane === "sidebar") return clientX - workspaceLeft;
      const sideWidth = root.classList.contains("is-sidebar-collapsed")
        ? 0
        : Number.parseFloat(getComputedStyle(root).getPropertyValue("--inbox-sidebar-width")) || 136;
      return clientX - workspaceLeft - sideWidth - 7;
    };
    splitter.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      dragPointer = event.pointerId;
      splitter.classList.add("is-dragging");
      splitter.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    splitter.addEventListener("pointermove", (event) => {
      if (dragPointer !== event.pointerId) return;
      update(pointerValue(event.clientX));
    });
    const finish = (event: PointerEvent) => {
      if (dragPointer !== event.pointerId) return;
      dragPointer = null;
      splitter.classList.remove("is-dragging");
      if (splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId);
    };
    splitter.addEventListener("pointerup", finish);
    splitter.addEventListener("pointercancel", finish);
    splitter.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const now = Number(splitter.getAttribute("aria-valuenow") ?? initial);
      const minValue = Number(splitter.getAttribute("aria-valuemin") ?? min);
      const maxValue = Number(splitter.getAttribute("aria-valuemax") ?? 320);
      const step = event.shiftKey ? 32 : 12;
      update(event.key === "Home" ? minValue : event.key === "End" ? maxValue : now + (event.key === "ArrowRight" ? step : -step));
      announce(sample, `${splitter.getAttribute("aria-label")}: ${splitter.getAttribute("aria-valuetext")}.`);
    });
  });

  root.dataset.activeMailbox = "inbox";
  root.dataset.selectedMessage = "roadmap";
  const sidebarToggle = root.querySelector<HTMLButtonElement>("[data-action='inbox-toggle-sidebar']");
  sidebarToggle?.setAttribute("aria-expanded", "true");
  renderInboxSplitView(root);
}

function initializeSearchField(sample: HTMLElement) {
  const suffix = sample.dataset.sampleInstance ?? "search";
  const input = sample.querySelector<HTMLInputElement>(".sample-search-input");
  const menu = sample.querySelector<HTMLElement>(".sample-search-recents");
  const trigger = sample.querySelector<HTMLButtonElement>(".sample-search-recent-trigger");
  const results = sample.querySelector<HTMLElement>(".sample-search-results");
  if (!input || !menu || !trigger || !results) return;

  input.id = `sample-search-input-${suffix}`;
  menu.id = `sample-search-menu-${suffix}`;
  results.id = `sample-search-results-${suffix}`;
  input.setAttribute("aria-controls", results.id);
  trigger.setAttribute("aria-controls", menu.id);
  trigger.setAttribute("aria-expanded", String(!menu.hidden));
  menu.querySelector<HTMLElement>(".sample-search-menu-heading")?.setAttribute("role", "presentation");
  menu.querySelector<HTMLElement>(".sample-search-menu-heading")?.setAttribute("aria-hidden", "true");
  menu.querySelector<HTMLElement>("[data-search-recent-list]")?.setAttribute("role", "group");
  menu.querySelector<HTMLElement>("[data-search-recent-list]")?.setAttribute("aria-label", "Recent queries");
  menu.querySelector<HTMLElement>("[data-search-recent-empty]")?.setAttribute("role", "presentation");
  refreshSearchRecents(sample);
  updateSearchField(sample, false);
}

const savePanelContents: Record<string, Array<{ name: string; icon: string }>> = {
  Desktop: [
    { name: "Client review.pdf", icon: "file-text" },
    { name: "Logo concepts.pages", icon: "file" },
    { name: "Project folder", icon: "folder" },
  ],
  Documents: [
    { name: "Brand guidelines.pages", icon: "file" },
    { name: "Invoice draft.pdf", icon: "file-text" },
    { name: "Meeting notes.md", icon: "file-text" },
  ],
  Downloads: [
    { name: "Export preview.png", icon: "file-image" },
    { name: "Prototype.zip", icon: "file-archive" },
  ],
};

const savePanelFormats: Record<string, { label: string; extension: string }> = {
  pdf: { label: "PDF Document (.pdf)", extension: ".pdf" },
  pages: { label: "Pages Document (.pages)", extension: ".pages" },
  png: { label: "PNG Image (.png)", extension: ".png" },
};

function initializeSavePanel(sample: HTMLElement) {
  const suffix = sample.dataset.sampleInstance ?? "save";
  const nameInput = sample.querySelector<HTMLInputElement>("[data-input-action='save-name']");
  const browser = sample.querySelector<HTMLElement>("[data-save-browser]");
  const locationMenu = sample.querySelector<HTMLElement>("[data-save-location-menu]");
  const formatMenu = sample.querySelector<HTMLElement>("[data-save-format-menu]");
  const disclosure = sample.querySelector<HTMLButtonElement>("[data-action='save-disclosure']");
  const locationTrigger = sample.querySelector<HTMLButtonElement>("[data-action='save-location-toggle']");
  const formatTrigger = sample.querySelector<HTMLButtonElement>("[data-action='save-format-toggle']");
  if (!nameInput || !browser || !locationMenu || !formatMenu || !disclosure || !locationTrigger || !formatTrigger) return;

  let reopen = sample.querySelector<HTMLButtonElement>("[data-action='save-reopen']");
  if (!reopen) {
    reopen = document.createElement("button");
    reopen.type = "button";
    reopen.className = "sample-save-reopen";
    reopen.dataset.action = "save-reopen";
    reopen.textContent = "Open Save Panel again";
    reopen.hidden = true;
    sample.append(reopen);
  }
  nameInput.id = `sample-save-name-${suffix}`;
  browser.id = `sample-save-browser-${suffix}`;
  locationMenu.id = `sample-save-location-menu-${suffix}`;
  formatMenu.id = `sample-save-format-menu-${suffix}`;
  const validity = sample.querySelector<HTMLElement>("[data-save-validity]");
  if (validity) {
    validity.id = `sample-save-validity-${suffix}`;
    nameInput.setAttribute("aria-describedby", validity.id);
  }
  disclosure.setAttribute("aria-controls", browser.id);
  locationTrigger.setAttribute("aria-controls", locationMenu.id);
  formatTrigger.setAttribute("aria-controls", formatMenu.id);
  sample.dataset.saveLocation = sample.dataset.saveLocation ?? "Documents";
  sample.dataset.saveFormat = sample.dataset.saveFormat ?? "pdf";
  updateSavePanel(sample);
}

function updateSavePanel(sample: HTMLElement, statusMessage?: string) {
  const currentLocation = sample.dataset.saveLocation ?? "Documents";
  const currentFormat = sample.dataset.saveFormat ?? "pdf";
  const locationLabel = sample.querySelector<HTMLElement>("[data-save-location-label]");
  const formatLabel = sample.querySelector<HTMLElement>("[data-save-format-label]");
  const currentPath = sample.querySelector<HTMLElement>("[data-save-current-path]");
  const nameInput = sample.querySelector<HTMLInputElement>("[data-input-action='save-name']");
  const saveButton = sample.querySelector<HTMLButtonElement>("[data-action='save-demo']");
  const validity = sample.querySelector<HTMLElement>("[data-save-validity]");
  const list = sample.querySelector<HTMLElement>("[data-save-file-list]");
  const format = savePanelFormats[currentFormat] ?? savePanelFormats.pdf;
  if (!format) return;

  if (locationLabel) locationLabel.textContent = currentLocation;
  if (formatLabel) formatLabel.textContent = format.label;
  if (currentPath) currentPath.textContent = currentLocation;
  if (saveButton) saveButton.disabled = !nameInput?.value.trim();
  if (validity) validity.hidden = Boolean(nameInput?.value.trim());
  sample.querySelectorAll<HTMLButtonElement>("[role='menuitemradio'][data-location]").forEach((option) => {
    option.setAttribute("aria-checked", String(option.dataset.location === currentLocation));
  });
  sample.querySelectorAll<HTMLButtonElement>("[role='menuitemradio'][data-format]").forEach((option) => {
    option.setAttribute("aria-checked", String(option.dataset.format === currentFormat));
  });
  sample.querySelectorAll<HTMLButtonElement>("[data-action='save-browser-location']").forEach((option) => {
    if (option.dataset.location === currentLocation) option.setAttribute("aria-current", "location");
    else option.removeAttribute("aria-current");
  });
  if (list) {
    list.replaceChildren();
    (savePanelContents[currentLocation] ?? []).forEach(({ name, icon }) => {
      const row = document.createElement("li");
      const glyph = document.createElement("i");
      glyph.className = "ui-icon";
      glyph.dataset.lucide = icon;
      glyph.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = name;
      row.append(glyph, label);
      list.append(row);
    });
    renderIcons(list);
  }
  if (statusMessage) announce(sample, statusMessage);
}

function closeSavePanelMenus(sample: HTMLElement) {
  const locationMenu = sample.querySelector<HTMLElement>("[data-save-location-menu]");
  const formatMenu = sample.querySelector<HTMLElement>("[data-save-format-menu]");
  const locationTrigger = sample.querySelector<HTMLButtonElement>("[data-action='save-location-toggle']");
  const formatTrigger = sample.querySelector<HTMLButtonElement>("[data-action='save-format-toggle']");
  if (locationMenu) locationMenu.hidden = true;
  if (formatMenu) formatMenu.hidden = true;
  locationTrigger?.setAttribute("aria-expanded", "false");
  formatTrigger?.setAttribute("aria-expanded", "false");
}

function setSearchRecentsOpen(sample: HTMLElement, open: boolean, focusFirst = false) {
  const menu = sample.querySelector<HTMLElement>(".sample-search-recents");
  const trigger = sample.querySelector<HTMLButtonElement>(".sample-search-recent-trigger");
  if (!menu || !trigger) return;
  menu.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
  if (open && focusFirst) {
    menu.querySelector<HTMLButtonElement>("[role='menuitem']:not([aria-disabled='true'])")?.focus({ preventScroll: true });
  }
}

function refreshSearchRecents(sample: HTMLElement) {
  const list = sample.querySelector<HTMLElement>("[data-search-recent-list]");
  const empty = sample.querySelector<HTMLElement>("[data-search-recent-empty]");
  const hasRecents = Boolean(list?.querySelector("[data-search-query]"));
  if (empty) empty.hidden = hasRecents;
}

const searchFieldAnimationTimers = new WeakMap<HTMLElement, number>();

function clearSearchFieldAnimation(element: HTMLElement) {
  const timer = searchFieldAnimationTimers.get(element);
  if (timer !== undefined) window.clearTimeout(timer);
  searchFieldAnimationTimers.delete(element);
  element.classList.remove("is-entering");
  element.style.removeProperty("--search-result-delay");
}

function animateSearchFieldElement(element: HTMLElement, delay = 0) {
  clearSearchFieldAnimation(element);
  element.style.setProperty("--search-result-delay", `${delay}ms`);
  element.classList.add("is-entering");
  searchFieldAnimationTimers.set(element, window.setTimeout(() => {
    clearSearchFieldAnimation(element);
  }, 220));
}

function updateSearchField(sample: HTMLElement, announceResult = true) {
  const input = sample.querySelector<HTMLInputElement>(".sample-search-input");
  if (!input) return;

  const query = input.value.trim().toLocaleLowerCase();
  const rows = Array.from(sample.querySelectorAll<HTMLElement>("[data-search-item]"));
  const clear = sample.querySelector<HTMLButtonElement>(".sample-search-clear");
  const count = sample.querySelector<HTMLElement>("[data-search-count]");
  const noResults = sample.querySelector<HTMLElement>("[data-search-no-results]");
  const status = sample.querySelector<HTMLElement>("[data-search-status]");
  const shouldAnimate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let matches = 0;

  rows.forEach((row) => {
    const searchable = `${row.textContent ?? ""} ${row.dataset.searchKeywords ?? ""}`.toLocaleLowerCase();
    const match = !query || searchable.includes(query);
    const wasHidden = row.hidden;
    row.hidden = !match;
    if (!match) {
      clearSearchFieldAnimation(row);
    } else {
      if (wasHidden && shouldAnimate) animateSearchFieldElement(row, Math.min(matches * 18, 36));
      matches += 1;
    }
  });

  if (clear) clear.hidden = input.value.length === 0;
  if (count) count.textContent = query
    ? `${matches} ${matches === 1 ? "match" : "matches"}`
    : `${matches} projects`;
  if (noResults) {
    const wasHidden = noResults.hidden;
    noResults.hidden = matches > 0;
    if (noResults.hidden) clearSearchFieldAnimation(noResults);
    else if (wasHidden && shouldAnimate) animateSearchFieldElement(noResults);
  }
  if (announceResult && status) {
    status.textContent = query
      ? matches
        ? `${matches} ${matches === 1 ? "project" : "projects"} found for ${input.value.trim()}.`
        : `No projects found for ${input.value.trim()}.`
      : `Showing all ${matches} projects.`;
  }
}

function addSearchRecent(sample: HTMLElement, query: string) {
  const list = sample.querySelector<HTMLElement>("[data-search-recent-list]");
  const normalized = query.trim();
  if (!list || !normalized) return;
  list.querySelectorAll<HTMLElement>("[data-search-query]").forEach((item) => {
    if (item.dataset.searchQuery?.toLocaleLowerCase() === normalized.toLocaleLowerCase()) item.remove();
  });
  const item = document.createElement("button");
  item.type = "button";
  item.setAttribute("role", "menuitem");
  item.dataset.action = "search-recent";
  item.dataset.searchQuery = normalized;
  item.textContent = normalized;
  list.prepend(item);
  Array.from(list.querySelectorAll<HTMLElement>("[data-search-query]")).slice(5).forEach((oldest) => oldest.remove());
  refreshSearchRecents(sample);
}

const desktopSidebarSources: Record<string, {
  group: string;
  description: string;
  items: Array<{ icon: string; name: string; detail: string }>;
}> = {
  projects: {
    group: "LIBRARY",
    description: "Active work and shared spaces.",
    items: [
      { icon: "folder", name: "Brand system", detail: "Updated today · 8 items" },
      { icon: "folder", name: "Website redesign", detail: "Updated yesterday · 12 items" },
      { icon: "folder", name: "Launch checklist", detail: "Updated Sep 24 · 5 items" },
    ],
  },
  recent: {
    group: "LIBRARY",
    description: "Files opened by your team this week.",
    items: [
      { icon: "file-text", name: "Brand guidelines", detail: "Opened 10 minutes ago" },
      { icon: "file-image", name: "Logo exports", detail: "Opened yesterday" },
      { icon: "file-text", name: "Icon library", detail: "Opened Sep 26" },
    ],
  },
  favorites: {
    group: "LIBRARY",
    description: "Pinned work stays close at hand.",
    items: [
      { icon: "star", name: "VINASIG Design System", detail: "Design library" },
      { icon: "folder", name: "Brand assets", detail: "8 items" },
      { icon: "file-text", name: "Color roles", detail: "Guidance document" },
    ],
  },
  documents: {
    group: "LOCATIONS",
    description: "Documents shared in this workspace.",
    items: [
      { icon: "file-text", name: "Q3 report", detail: "Updated today · 2.4 MB" },
      { icon: "file-text", name: "Meeting notes", detail: "Updated yesterday · 8 KB" },
      { icon: "file-image", name: "Reference board", detail: "Updated Sep 25 · 1.8 MB" },
    ],
  },
  downloads: {
    group: "LOCATIONS",
    description: "Exports saved from this workspace.",
    items: [
      { icon: "file-archive", name: "Logo exports.zip", detail: "Downloaded today · 12 MB" },
      { icon: "file-text", name: "Color tokens.csv", detail: "Downloaded yesterday · 18 KB" },
      { icon: "file-image", name: "Social preview.png", detail: "Downloaded Sep 25 · 640 KB" },
    ],
  },
};

function updateDesktopSidebarContent(sample: HTMLElement, key: string, animate = true) {
  const content = sample.querySelector<HTMLElement>(".sample-sidebar-content");
  const heading = content?.querySelector<HTMLElement>("[data-sidebar-heading]");
  const toolbarTitle = sample.querySelector<HTMLElement>("[data-sidebar-toolbar-title]");
  const eyebrow = content?.querySelector<HTMLElement>("[data-sidebar-eyebrow]");
  const description = content?.querySelector<HTMLElement>("[data-sidebar-description]");
  const count = content?.querySelector<HTMLElement>("[data-sidebar-count]");
  const list = content?.querySelector<HTMLUListElement>("[data-sidebar-items]");
  const source = desktopSidebarSources[key];
  const label = sample.querySelector<HTMLButtonElement>(`.sample-source-list [data-sidebar-key='${key}']`)?.getAttribute("aria-label");
  if (!content || !heading || !toolbarTitle || !eyebrow || !description || !count || !list || !source || !label) return;

  heading.textContent = label;
  toolbarTitle.textContent = label;
  eyebrow.textContent = source.group;
  description.textContent = source.description;
  count.textContent = `${source.items.length} ${key === "projects" ? "folders" : "items"}`;
  const rows = source.items.map((item) => {
    const row = document.createElement("li");
    const icon = document.createElement("i");
    icon.className = "ui-icon";
    icon.dataset.lucide = item.icon;
    icon.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "sample-sidebar-item-copy";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const detail = document.createElement("small");
    detail.textContent = item.detail;
    copy.append(name, detail);
    row.append(icon, copy);
    return row;
  });
  list.replaceChildren(...rows);
  renderIcons(list);
  if (animate) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animateIn = (element: HTMLElement | null, duration: number, delay: number, distance: number) => {
      if (!element || typeof element.animate !== "function") return;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [
          { opacity: 0.72, transform: `translateY(${distance}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    };
    animateIn(toolbarTitle, 180, 0, 2);
    animateIn(eyebrow, 170, 0, 2);
    animateIn(count, 170, 0, 2);
    animateIn(heading, 200, 12, 4);
    animateIn(description, 190, 24, 4);
    rows.forEach((row, index) => animateIn(row, 190, Math.min(index, 4) * 28, 4));
  }
}

function initializeDesktopSidebar(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-sidebar-demo");
  const nav = demo?.querySelector<HTMLElement>(".sample-source-list");
  const toggle = demo?.querySelector<HTMLButtonElement>("[data-action='source-sidebar-toggle']");
  if (!demo || !nav || !toggle) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  nav.id = `sample-source-navigation-${instance}`;
  toggle.setAttribute("aria-controls", nav.id);
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Hide sidebar");
  const items = Array.from(nav.querySelectorAll<HTMLButtonElement>("[data-sidebar-key]"));
  items.forEach((item) => {
    item.classList.toggle("is-current", item.getAttribute("aria-current") === "page");
  });
  const heading = demo.querySelector<HTMLElement>("[data-sidebar-heading]");
  if (heading) heading.id = `sample-source-heading-${instance}`;
  const content = demo.querySelector<HTMLElement>(".sample-sidebar-content");
  content?.setAttribute("aria-labelledby", heading?.id ?? `sample-source-heading-${instance}`);

  const initial = items.find((item) => item.getAttribute("aria-current") === "page") ?? items[0];
  if (initial?.dataset.sidebarKey) updateDesktopSidebarContent(sample, initial.dataset.sidebarKey, false);
}

const toolbarMenuCloseTimers = new WeakMap<HTMLElement, number>();
const toolbarMenuOpenFrames = new WeakMap<HTMLElement, number>();

function setToolbarOverflowOpen(sample: HTMLElement, open: boolean, moveFocus = false) {
  const trigger = sample.querySelector<HTMLButtonElement>(".sample-toolbar-overflow-trigger");
  const menu = sample.querySelector<HTMLElement>(".sample-toolbar-overflow-menu");
  if (!trigger || !menu) return;
  const closeTimer = toolbarMenuCloseTimers.get(menu);
  if (closeTimer !== undefined) {
    window.clearTimeout(closeTimer);
    toolbarMenuCloseTimers.delete(menu);
  }
  const openFrame = toolbarMenuOpenFrames.get(menu);
  if (openFrame !== undefined) {
    window.cancelAnimationFrame(openFrame);
    toolbarMenuOpenFrames.delete(menu);
  }

  trigger.setAttribute("aria-expanded", String(open));
  if (open) {
    const alreadyVisible = !menu.hidden;
    menu.hidden = false;
    menu.inert = false;
    menu.removeAttribute("aria-hidden");
    if (alreadyVisible) {
      menu.dataset.open = "true";
    } else {
      menu.dataset.open = "false";
      const frame = window.requestAnimationFrame(() => {
        toolbarMenuOpenFrames.delete(menu);
        if (trigger.getAttribute("aria-expanded") === "true" && !menu.hidden) menu.dataset.open = "true";
      });
      toolbarMenuOpenFrames.set(menu, frame);
    }
  } else {
    menu.dataset.open = "false";
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");
    if (!menu.hidden) {
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 170;
      if (duration === 0) {
        menu.hidden = true;
      } else {
        const timer = window.setTimeout(() => {
          toolbarMenuCloseTimers.delete(menu);
          if (trigger.getAttribute("aria-expanded") !== "true") menu.hidden = true;
        }, duration);
        toolbarMenuCloseTimers.set(menu, timer);
      }
    }
  }
  const items = Array.from(menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']"));
  items.forEach((item, index) => { item.tabIndex = open && index === 0 ? 0 : -1; });
  updateToolbarRovingFocus(sample, trigger);
  if (open && moveFocus) items[0]?.focus({ preventScroll: true });
  else if (!open && moveFocus) trigger.focus({ preventScroll: true });
}

function updateToolbarRovingFocus(sample: HTMLElement, focusTarget?: HTMLButtonElement) {
  const toolbar = sample.querySelector<HTMLElement>(".sample-toolbar[role='toolbar']");
  if (!toolbar) return;
  const items = Array.from(toolbar.querySelectorAll<HTMLButtonElement>("button:not([hidden]):not([aria-hidden='true'])"))
    .filter((item) => !item.disabled && !item.inert && getComputedStyle(item).display !== "none");
  if (!items.length) return;
  const active = focusTarget ?? (document.activeElement instanceof HTMLButtonElement ? document.activeElement : null);
  const activeIndex = active ? items.indexOf(active) : -1;
  const existingIndex = items.findIndex((item) => item.tabIndex === 0);
  const selectedIndex = activeIndex >= 0 ? activeIndex : existingIndex >= 0 ? existingIndex : 0;
  items.forEach((item, index) => { item.tabIndex = index === selectedIndex ? 0 : -1; });
}

function replayToolbarContentMotion(content: HTMLElement) {
  content.classList.remove("is-changing");
  void content.offsetWidth;
  content.classList.add("is-changing");
}

function setToolbarCompact(sample: HTMLElement, compact: boolean) {
  const window = sample.querySelector<HTMLElement>(".sample-toolbar-window");
  const toggle = sample.querySelector<HTMLButtonElement>("[data-action='toolbar-compact']");
  if (!window || !toggle) return;
  window.dataset.compact = String(compact);
  window.querySelectorAll<HTMLButtonElement>(".sample-toolbar-action[data-toolbar-optional='true']").forEach((item) => {
    item.inert = compact;
    item.setAttribute("aria-hidden", String(compact));
  });
  const overflow = sample.querySelector<HTMLButtonElement>(".sample-toolbar-overflow-trigger");
  if (overflow) overflow.hidden = !compact;
  toggle.setAttribute("aria-pressed", String(compact));
  toggle.textContent = compact ? "Restore full toolbar width" : "Constrain width to reveal overflow";
  if (!compact) setToolbarOverflowOpen(sample, false);
  updateToolbarRovingFocus(sample);
}

function initializeToolbarSample(sample: HTMLElement) {
  const instance = sample.dataset.sampleInstance ?? "example";
  const demo = sample.querySelector<HTMLElement>(".sample-toolbar-demo");
  const menu = sample.querySelector<HTMLElement>(".sample-toolbar-overflow-menu");
  const trigger = sample.querySelector<HTMLButtonElement>(".sample-toolbar-overflow-trigger");
  const separator = sample.querySelector<HTMLElement>(".sample-toolbar-separator");
  if (!demo || !menu || !trigger || !separator) return;

  menu.id = `sample-toolbar-overflow-${instance}`;
  trigger.setAttribute("aria-controls", menu.id);
  trigger.setAttribute("aria-expanded", "false");
  menu.hidden = true;
  menu.inert = true;
  menu.setAttribute("aria-hidden", "true");
  menu.dataset.open = "false";
  menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']").forEach((item) => { item.tabIndex = -1; });
  demo.dataset.labels = "true";
  const labelsToggle = sample.querySelector<HTMLButtonElement>("[data-action='toolbar-labels']");
  if (labelsToggle) {
    labelsToggle.setAttribute("aria-pressed", "true");
    labelsToggle.textContent = "Hide item labels";
  }
  separator.dataset.toolbarSeparator = "automatic";
  sample.querySelector<HTMLElement>(".sample-toolbar-content")?.classList.remove("is-changing");
  setToolbarCompact(sample, false);
  updateToolbarRovingFocus(sample);

  sample.addEventListener("keydown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    const menuItems = Array.from(menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']"));
    if (!menu.hidden && target.closest(".sample-toolbar-overflow-menu")) {
      const index = menuItems.indexOf(target.closest<HTMLButtonElement>("[role='menuitem']")!);
      if (event.key === "Escape") {
        event.preventDefault();
        setToolbarOverflowOpen(sample, false, true);
        return;
      }
      if (event.key === "Tab") {
        setToolbarOverflowOpen(sample, false);
        return;
      }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const nextIndex = event.key === "Home" ? 0
          : event.key === "End" ? menuItems.length - 1
            : event.key === "ArrowDown" ? (index + 1 + menuItems.length) % menuItems.length
              : (index - 1 + menuItems.length) % menuItems.length;
        menuItems[nextIndex]?.focus({ preventScroll: true });
        return;
      }
    }

    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      setToolbarOverflowOpen(sample, false, true);
      return;
    }
    const toolbar = target.closest<HTMLElement>(".sample-toolbar[role='toolbar']");
    const current = target.closest<HTMLButtonElement>(".sample-toolbar[role='toolbar'] button:not([hidden])");
    if (!toolbar || !current || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const items = Array.from(toolbar.querySelectorAll<HTMLButtonElement>("button:not([hidden])"))
      .filter((item) => !item.disabled && getComputedStyle(item).display !== "none");
    const index = items.indexOf(current);
    if (index < 0 || !items.length) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? items.length - 1
        : event.key === "ArrowRight" ? (index + 1) % items.length
          : (index - 1 + items.length) % items.length;
    items[nextIndex]?.focus({ preventScroll: true });
    updateToolbarRovingFocus(sample, items[nextIndex]);
  });
}

function setWindowActionsExpandIcon(button: HTMLButtonElement, expanded: boolean) {
  const currentIcon = button.querySelector<SVGElement>(".ui-icon");
  const iconName = expanded ? "minimize" : "maximize";
  if (currentIcon?.dataset.windowActionIcon === iconName) return;

  const svg = currentIcon?.namespaceURI === "http://www.w3.org/2000/svg"
    ? currentIcon.cloneNode(false) as SVGElement
    : document.createElementNS("http://www.w3.org/2000/svg", "svg");
  if (currentIcon && svg !== currentIcon) {
    Array.from(currentIcon.attributes)
      .filter(({ name }) => name.startsWith("data-astro-cid-"))
      .forEach(({ name, value }) => svg.setAttribute(name, value));
  }
  svg.setAttribute("class", "ui-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.removeAttribute("data-lucide");
  svg.dataset.windowActionIcon = iconName;

  const paths = expanded
    ? [
      "M8 3v3a2 2 0 0 1-2 2H3",
      "M21 8h-3a2 2 0 0 1-2-2V3",
      "M3 16h3a2 2 0 0 1 2 2v3",
      "M16 21v-3a2 2 0 0 1 2-2h3",
    ]
    : [
      "M8 3H5a2 2 0 0 0-2 2v3",
      "M21 8V5a2 2 0 0 0-2-2h-3",
      "M3 16v3a2 2 0 0 0 2 2h3",
      "M16 21h3a2 2 0 0 0 2-2v-3",
    ];
  paths.forEach((definition) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", definition);
    svg.append(path);
  });
  if (currentIcon) currentIcon.replaceWith(svg);
  else button.prepend(svg);
}

function setWindowActionsState(demo: HTMLElement, state: string, message?: string) {
  const body = demo.querySelector<HTMLElement>("[data-window-action-content]");
  const minimized = demo.querySelector<HTMLElement>("[data-window-minimized]");
  const closed = demo.querySelector<HTMLElement>("[data-window-closed]");
  const close = demo.querySelector<HTMLButtonElement>("[data-window-control='close']");
  const minimize = demo.querySelector<HTMLButtonElement>("[data-window-control='minimize']");
  const expand = demo.querySelector<HTMLButtonElement>("[data-window-control='expand']");
  const feedback = demo.querySelector<HTMLElement>(".sample-window-actions-feedback");
  const inactive = state === "closed" || state === "minimized";

  demo.dataset.windowState = state;
  if (body) {
    body.inert = inactive;
    body.setAttribute("aria-hidden", String(inactive));
  }
  if (minimized) minimized.hidden = state !== "minimized";
  if (closed) closed.hidden = state !== "closed";
  if (close) close.disabled = state === "closed";
  if (minimize) {
    minimize.disabled = state === "closed";
    minimize.setAttribute("aria-pressed", String(state === "minimized"));
    minimize.setAttribute("aria-label", state === "minimized" ? "Restore minimized preview" : "Minimize preview");
    const label = minimize.querySelector<HTMLElement>("span");
    if (label) label.textContent = state === "minimized" ? "Restore" : "Minimize";
  }
  if (expand) {
    expand.disabled = state === "closed" || state === "minimized";
    const expanded = state === "zoomed" || state === "fullscreen";
    expand.setAttribute("aria-pressed", String(expanded));
    expand.setAttribute("aria-label", expanded ? "Restore preview size" : "Expand preview");
    expand.title = expanded ? "Restore preview size" : "Option-click to zoom the preview";
    const label = expand.querySelector<HTMLElement>("span");
    if (label) label.textContent = expanded ? "Restore" : "Expand";
    setWindowActionsExpandIcon(expand, expanded);
  }
  if (feedback && message) {
    feedback.textContent = message;
    feedback.hidden = false;
  }
  if (feedback && !message) feedback.hidden = true;
}

function initializeWindowActionsDemo(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-window-actions-demo");
  if (!demo) return;
  setWindowActionsState(demo, "open");
}

function setVibrancyMaterial(demo: HTMLElement, material: string, announceChange = false) {
  const materialNames: Record<string, string> = {
    sidebar: "Sidebar material",
    popover: "Popover material",
    hud: "HUD material",
    solid: "Solid fallback",
  };
  const state = demo.querySelector<HTMLElement>("[data-vibrancy-state]");
  const status = demo.querySelector<HTMLElement>(".sample-vibrancy-status");
  const materialName = materialNames[material];
  if (!Object.hasOwn(materialNames, material) || !materialName) return;

  demo.dataset.material = material;
  demo.querySelectorAll<HTMLButtonElement>("[data-action='vibrancy-material']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.materialValue === material));
  });
  if (state) state.textContent = materialName;
  if (status && announceChange) {
    status.textContent = material === "solid"
      ? "Solid fallback selected. The wallpaper no longer shows through the panel."
      : `${materialName} selected. The panel uses a material tuned for that surface role.`;
    status.hidden = false;
  }
}

function setVibrancyForeground(demo: HTMLElement, enabled: boolean, announceChange = false) {
  const toggle = demo.querySelector<HTMLButtonElement>("[data-action='vibrancy-toggle']");
  const status = demo.querySelector<HTMLElement>(".sample-vibrancy-status");
  demo.dataset.vibrancy = enabled ? "on" : "off";
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.textContent = enabled ? "Vibrancy on" : "Vibrancy off";
  }
  if (status && announceChange) {
    status.textContent = enabled
      ? "Vibrant foreground enabled. The foreground control uses stronger separation from the material."
      : "Vibrant foreground disabled. The control returns to its standard appearance.";
    status.hidden = false;
  }
}

function initializeVibrancyDemo(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-vibrancy-demo");
  if (!demo) return;
  setVibrancyMaterial(demo, demo.dataset.material ?? "popover");
  setVibrancyForeground(demo, demo.dataset.vibrancy !== "off");
}

function initializeEmptyStateEntrance(section: HTMLElement) {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionPreference.matches) return;

  const playEntrance = () => {
    if (motionPreference.matches) return;
    section.classList.add("is-entering");
    const finalItem = section.querySelector<HTMLElement>(".sample-button");
    finalItem?.addEventListener("animationend", () => section.classList.remove("is-entering"), { once: true });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      playEntrance();
    }, { threshold: 0.25 });
    observer.observe(section);
  } else {
    playEntrance();
  }
}

function animateEmptyStateUpdate(...items: Array<HTMLElement | null>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  items.forEach((item, index) => {
    item?.animate(
      [
        { opacity: 0.55, transform: "translateY(3px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 190, delay: index * 24, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" },
    );
  });
}

function initializeEmptyStateSample(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const section = sample.querySelector<HTMLElement>(".sample-empty");
  const title = section?.querySelector<HTMLElement>(".sample-empty-title");
  const description = section?.querySelector<HTMLElement>(".sample-empty-description");
  if (!section || !title) return;

  title.id = `sample-empty-title-${instance}`;
  section.setAttribute("aria-labelledby", title.id);
  if (description) {
    description.id = `sample-empty-description-${instance}`;
    section.setAttribute("aria-describedby", description.id);
  }
  initializeEmptyStateEntrance(section);
}

function enhanceSample(sample: HTMLElement) {
  renderIcons(sample);
  const id = sample.dataset.specimenId;
  sample.dataset.sampleInstance = String(++sampleInstance);
  liveStatus(sample);

  switch (id) {
    case "skeleton-spinner":
      initializeLoadingMotion(sample);
      break;
    case "focus-ring-focus-visible":
      initializeWebFocusRing(sample);
      break;
    case "focus-ring-macos":
      initializeMacosFocusRing(sample);
      break;
    case "inspector":
      initializeInspector(sample);
      break;
    case "editor-colors-panel":
      initializeEditorColorsPanel(sample);
      break;
    case "progress-ring-spinner-bar":
      initializeProgressDemo(sample, { autoStartWhenVisible: true });
      break;
    case "data-table":
      initializeDataTable(sample);
      break;
    case "steps":
      initializeStepsSample(sample);
      break;
    case "avatar-group":
      initializeAvatarGroupSample(sample);
      break;
    case "scrollspy":
      initializeScrollspy(sample);
      break;
    case "scroll-view":
      initializeScrollView(sample);
      break;
    case "bottom-navigation": {
      initializeBottomNavigation(sample);
      break;
    }
    case "multi-select": {
      initializeMultiSelectIds(sample, String(++fieldInstance));
      const showcase = sample.querySelector<HTMLElement>(".sample-multi-select-showcase");
      if (showcase) refreshMultiSelectShowcase(showcase);
      break;
    }
    case "sign-in-form": {
      initializeLoginSample(sample);
      break;
    }
    case "pagination": {
      initializePagination(sample);
      break;
    }
    case "date-picker":
      enhanceCalendar(sample);
      break;
    case "carousel": {
      initializeCarousel(sample);
      break;
    }
    case "text-scramble":
      initializeTextScramble(sample);
      break;
    case "site-header-navigation-bar": {
      const nav = sample.querySelector<HTMLElement>(".sample-site-header nav");
      nav?.querySelectorAll<HTMLAnchorElement>("a").forEach((link, index) => {
        link.dataset.action = "site-nav";
        if (index === 0) {
          link.classList.add("is-current");
          link.setAttribute("aria-current", "page");
        }
      });
      if (nav) {
        const indicator = document.createElement("span");
        indicator.className = "sample-site-nav-indicator";
        indicator.setAttribute("aria-hidden", "true");
        nav.append(indicator);
        updateSiteNavIndicator(nav);
        if (typeof ResizeObserver !== "undefined") {
          const observer = new ResizeObserver(() => updateSiteNavIndicator(nav));
          observer.observe(nav);
          nav.querySelectorAll("a").forEach((link) => observer.observe(link));
        }
        void document.fonts?.ready.then(() => updateSiteNavIndicator(nav));
      }
      const cta = sample.querySelector<HTMLElement>(".sample-site-header .sample-button");
      if (cta) asButton(cta, "site-cta", "Start a project");
      break;
    }
    case "resize-handle-web": {
      const field = sample.querySelector<HTMLTextAreaElement>(".sample-resize-field");
      const hint = sample.querySelector<HTMLElement>("[data-resize-hint]");
      if (field && hint) {
        hint.id = `sample-resize-hint-${sample.dataset.sampleInstance ?? "example"}`;
        field.setAttribute("aria-describedby", hint.id);
      }
      break;
    }
    case "hamburger-menu-nav-drawer": {
      initializeNavigationDrawer(sample);
      break;
    }
    case "empty-trash-alert": {
      initializeEmptyTrashAlert(sample);
      break;
    }
    case "volume-slider": {
      initializeVolumeSlider(sample);
      break;
    }
    case "rating-capacity-level-indicator": {
      initializeLevelIndicator(sample);
      break;
    }
    case "column-view-browser": {
      initializeColumnBrowser(sample);
      break;
    }
    case "inbox-split-view": {
      initializeInboxSplitView(sample);
      break;
    }
    case "color-well": {
      sample.querySelectorAll<HTMLElement>(".sample-color-well").forEach((well, index) => {
        refreshColorWellIds(well, `${sample.dataset.sampleInstance}-${index + 1}`);
        setColorWellValue(well, well.dataset.color ?? "#0A6CFF", well.dataset.colorName ?? "Blue");
        well.querySelectorAll<HTMLElement>(".sample-color-grid [data-color]").forEach((option) => {
          setAction(option, "select-color");
          const swatch = option.querySelector<HTMLElement>("span");
          if (swatch) swatch.style.backgroundColor = option.dataset.color ?? "transparent";
        });
      });
      break;
    }
    case "form-field": {
      initializeFormFieldSample(sample);
      break;
    }
    case "drag-and-drop": {
      initializeDragDropSample(sample);
      break;
    }
    case "three-dots-overflow-menu": {
      initializeThreeDotsSample(sample);
      break;
    }
    case "toast-snackbar": {
      initializeToastSample(sample);
      break;
    }
    case "modal-dialog-drawer-sheet": {
      initializeSurfaceDemo(sample);
      break;
    }
    case "popover-dropdown-tooltip": {
      initializeOverlayTrio(sample);
      break;
    }
    case "scrim-backdrop-overlay": {
      initializeScrimDemo(sample);
      break;
    }
    case "popover-macos": {
      initializeMacPopoverDemo(sample);
      break;
    }
    case "combobox-autocomplete-typeahead": {
      initializeComboboxSample(sample);
      break;
    }
    case "command-palette": {
      initializeCommandPalette(sample);
      break;
    }
    case "accordion-disclosure": {
      initializeAccordionSample(sample);
      break;
    }
    case "tabs": {
      initializeTabsSample(sample);
      break;
    }
    case "empty-state": {
      initializeEmptyStateSample(sample, sample.dataset.sampleInstance);
      break;
    }
    case "hover-card":
      initializeHoverCard(sample);
      break;
    case "switch-checkbox-radio": {
      sample.querySelectorAll<HTMLInputElement>(".sample-choice-group input[type='radio']")
        .forEach((input) => { input.name = `choice-contact-${sample.dataset.sampleInstance}`; });
      break;
    }
    case "toggle-group-segmented-control": {
      initializeToggleGroup(sample);
      break;
    }
    case "segmented-control-macos": {
      initializeMacSegmentedControl(sample);
      break;
    }
    case "popup-pulldown-combo-box": {
      initializePopupPullDownCombo(sample);
      break;
    }
    case "menu-bar": {
      initializeMenuBar(sample);
      break;
    }
    case "menu-bar-extra": {
      initializeMenuBar(sample);
      break;
    }
    case "context-menu": {
      initializeContextMenu(sample);
      break;
    }
    case "search-field": {
      initializeSearchField(sample);
      break;
    }
    case "save-panel": {
      sample.classList.add("sample-save-demo");
      sample.append(visibleStatus("sample-save-feedback"));
      initializeSavePanel(sample);
      break;
    }
    case "token-field": {
      initializeTokenField(sample);
      break;
    }
    case "combo-button": {
      sample.classList.add("sample-combo-demo");
      const primary = sample.querySelector<HTMLElement>(".sample-combo-button > button[data-action='combo-primary']");
      const trigger = sample.querySelector<HTMLElement>(".sample-combo-button > button[aria-haspopup='menu']");
      const menu = sample.querySelector<HTMLElement>(".sample-combo-menu");
      menu?.querySelectorAll<HTMLElement>("[role='menuitem']").forEach((item) => { item.tabIndex = -1; });
      primary?.setAttribute("aria-label", "Save");
      trigger?.setAttribute("aria-expanded", "true");
      if (menu) {
        menu.dataset.open = "true";
        setComboMenuOpen(menu, true);
      }
      sample.append(visibleStatus("sample-combo-feedback"));
      break;
    }
    case "disclosure-triangle": {
      initializeDisclosureSample(sample);
      break;
    }
    case "delete-sheet": {
      initializeDeleteSheet(sample);
      break;
    }
    case "stepper": {
      initializeStepper(sample);
      break;
    }
    case "toolbar-unified-title-bar": {
      initializeToolbarSample(sample);
      break;
    }
    case "traffic-lights-window-controls": {
      initializeWindowActionsDemo(sample);
      break;
    }
    case "visual-effect-material-vibrancy": {
      initializeVibrancyDemo(sample);
      break;
    }
    case "mac-window": {
      const window = sample.querySelector<HTMLElement>(".sample-mac-window");
      const content = window?.querySelector<HTMLElement>("[data-window-content]");
      const tabs = window?.querySelector<HTMLElement>(".sample-window-tabs");
      if (content) {
        content.id = `sample-window-content-${sample.dataset.sampleInstance}`;
        const heading = content.querySelector<HTMLElement>("[data-document-heading]");
        if (heading) {
          heading.id = `sample-window-heading-${sample.dataset.sampleInstance}`;
        }
      }
      if (tabs && content) {
        tabs.querySelectorAll<HTMLButtonElement>("[role='tab']").forEach((tab, index) => {
          tab.id = `sample-window-tab-${sample.dataset.sampleInstance}-${index + 1}`;
          tab.setAttribute("aria-controls", content.id);
          tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
          tab.classList.toggle("is-current", tab.getAttribute("aria-selected") === "true");
        });
        const selectedTab = tabs.querySelector<HTMLButtonElement>("[role='tab'][aria-selected='true']");
        if (selectedTab) content.setAttribute("aria-labelledby", selectedTab.id);
      }
      window?.querySelectorAll<HTMLButtonElement>(".sample-window-controls > button[data-window-control]").forEach((control) => {
        if (control.dataset.windowControl === "minimize" || control.dataset.windowControl === "expand") {
          control.setAttribute("aria-pressed", "false");
        }
      });
      break;
    }
    case "desktop-sidebar-source-list": {
      initializeDesktopSidebar(sample);
      break;
    }
    default:
      break;
  }
}

function initializeBottomNavigation(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-bottom-nav-demo");
  const nav = demo?.querySelector<HTMLElement>(".sample-bottom-nav");
  if (!demo || !nav) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  const panels = Array.from(demo.querySelectorAll<HTMLElement>("[data-nav-panel]"));
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>(".sample-nav-item"));
  const currentKey = nav.dataset.activeDestination ?? "home";

  nav.setAttribute("aria-label", "Primary navigation");
  nav.removeAttribute("role");

  panels.forEach((panel) => {
    const key = panel.dataset.navPanel;
    if (!key) return;
    const heading = panel.querySelector<HTMLElement>("[data-nav-panel-title]");
    panel.id = `sample-bottom-panel-${instance}-${key}`;
    if (heading) {
      heading.id = `sample-bottom-heading-${instance}-${key}`;
      panel.setAttribute("aria-labelledby", heading.id);
    }
    panel.hidden = key !== currentKey;
  });

  links.forEach((link) => {
    const key = link.dataset.navDestination;
    const label = link.querySelector("small")?.textContent?.trim() ?? "Navigation item";
    const panel = panels.find((candidate) => candidate.dataset.navPanel === key);
    if (!key || !panel) return;
    link.href = `#${panel.id}`;
    link.setAttribute("aria-controls", panel.id);
    link.setAttribute("aria-label", key === "inbox" ? `${label}, 3 unread` : label);
    link.dataset.action = "select-nav";
    if (key === currentKey) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    link.classList.toggle("is-current", key === currentKey);
  });
}

function initializeNavigationDrawer(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-navigation-demo");
  const page = demo?.querySelector<HTMLElement>("[data-navigation-page]");
  const drawer = demo?.querySelector<HTMLElement>(".sample-navigation-panel");
  const scrim = demo?.querySelector<HTMLElement>(".sample-navigation-scrim");
  const trigger = demo?.querySelector<HTMLButtonElement>("[data-action='nav-drawer-toggle']");
  if (!demo || !page || !drawer || !scrim || !trigger) return;

  drawer.id = `sample-navigation-drawer-${sample.dataset.sampleInstance ?? "example"}`;
  trigger.setAttribute("aria-controls", drawer.id);
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Open main navigation");
  demo.dataset.drawerOpen = "false";
  demo.dataset.drawerState = "closed";
  page.inert = false;
  drawer.hidden = true;
  drawer.inert = true;
  drawer.setAttribute("aria-hidden", "true");
  scrim.hidden = true;
  scrim.setAttribute("aria-hidden", "true");

  drawer.addEventListener("transitionend", (event) => {
    if (event.target === drawer && event.propertyName === "transform" && demo.dataset.drawerState === "closing") {
      finishNavigationDrawerClose(demo);
    }
  });
}

function initializeThreeDotsSample(sample: HTMLElement) {
  const instance = (sample.dataset.sampleInstance ?? "example").replace(/[^A-Za-z0-9_-]/g, "-");
  sample.querySelectorAll<HTMLElement>(".sample-overflow-example").forEach((owner, index) => {
    const prefix = `sample-overflow-${instance}-${index + 1}`;
    const menuTrigger = owner.querySelector<HTMLButtonElement>("[data-action='toggle-menu']");
    const menu = owner.querySelector<HTMLElement>(".sample-overflow-menu");
    if (menuTrigger && menu) {
      menu.id = `${prefix}-menu`;
      menuTrigger.setAttribute("aria-haspopup", "menu");
      menuTrigger.setAttribute("aria-controls", menu.id);
      menuTrigger.setAttribute("aria-expanded", "false");
      menu.hidden = true;
      menu.querySelectorAll<HTMLButtonElement>("[data-action='menu-command']").forEach((item) => {
        item.type = "button";
        item.setAttribute("role", "menuitem");
      });
    }

    const note = owner.querySelector<HTMLElement>("[id^='overflow-note-']");
    if (note && menuTrigger) {
      note.id = `${prefix}-note`;
      menuTrigger.setAttribute("aria-describedby", note.id);
    }

    const navigation = owner.querySelector<HTMLElement>(".sample-overflow-navigation-panel");
    const navigationTrigger = owner.querySelector<HTMLButtonElement>("[data-action='overflow-nav-toggle']");
    if (navigation && navigationTrigger) {
      navigation.id = `${prefix}-navigation`;
      navigationTrigger.setAttribute("aria-controls", navigation.id);
      navigationTrigger.setAttribute("aria-expanded", "false");
      navigation.hidden = true;
    }

    const commandPanel = owner.querySelector<HTMLElement>(".sample-overflow-command-panel");
    const commandTrigger = owner.querySelector<HTMLButtonElement>("[data-action='overflow-command-toggle']");
    if (commandPanel && commandTrigger) {
      const title = commandPanel.querySelector<HTMLElement>("h4");
      const input = commandPanel.querySelector<HTMLInputElement>("[data-overflow-file]");
      const label = commandPanel.querySelector<HTMLLabelElement>("label");
      commandPanel.id = `${prefix}-command`;
      commandTrigger.setAttribute("aria-controls", commandPanel.id);
      commandTrigger.setAttribute("aria-expanded", "false");
      commandPanel.hidden = true;
      if (title) title.id = `${prefix}-command-title`;
      if (title) commandPanel.setAttribute("aria-labelledby", title.id);
      if (input) input.id = `${prefix}-file`;
      if (input && label) label.htmlFor = input.id;
    }
  });
}

function openNavigationDrawer(demo: HTMLElement) {
  const page = demo.querySelector<HTMLElement>("[data-navigation-page]");
  const drawer = demo.querySelector<HTMLElement>(".sample-navigation-panel");
  const scrim = demo.querySelector<HTMLElement>(".sample-navigation-scrim");
  const trigger = demo.querySelector<HTMLButtonElement>("[data-action='nav-drawer-toggle']");
  if (!page || !drawer || !scrim || !trigger) return;

  const timer = navigationDrawerTimers.get(demo);
  if (timer !== undefined) window.clearTimeout(timer);
  navigationDrawerTimers.delete(demo);
  demo.dataset.drawerOpen = "true";
  demo.dataset.restoreDrawerFocus = "false";
  demo.dataset.drawerState = "opening";
  page.inert = true;
  drawer.hidden = false;
  drawer.inert = false;
  drawer.setAttribute("aria-hidden", "false");
  scrim.hidden = false;
  scrim.setAttribute("aria-hidden", "false");
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-label", "Close main navigation");

  window.requestAnimationFrame(() => {
    if (demo.dataset.drawerOpen === "true") demo.dataset.drawerState = "open";
  });
  drawer.querySelector<HTMLButtonElement>(".sample-navigation-close")?.focus({ preventScroll: true });
}

function finishNavigationDrawerClose(demo: HTMLElement) {
  if (demo.dataset.drawerOpen === "true") return;
  const drawer = demo.querySelector<HTMLElement>(".sample-navigation-panel");
  const scrim = demo.querySelector<HTMLElement>(".sample-navigation-scrim");
  const page = demo.querySelector<HTMLElement>("[data-navigation-page]");
  const trigger = demo.querySelector<HTMLButtonElement>("[data-action='nav-drawer-toggle']");
  const timer = navigationDrawerTimers.get(demo);
  if (timer !== undefined) window.clearTimeout(timer);
  navigationDrawerTimers.delete(demo);

  if (drawer) drawer.hidden = true;
  if (scrim) scrim.hidden = true;
  if (page) page.inert = false;
  demo.dataset.drawerState = "closed";
  const restoreFocus = demo.dataset.restoreDrawerFocus === "true";
  demo.dataset.restoreDrawerFocus = "false";
  if (restoreFocus) trigger?.focus({ preventScroll: true });
}

function closeNavigationDrawer(demo: HTMLElement, restoreFocus = true) {
  if (demo.dataset.drawerOpen !== "true") return;
  const drawer = demo.querySelector<HTMLElement>(".sample-navigation-panel");
  const scrim = demo.querySelector<HTMLElement>(".sample-navigation-scrim");
  const trigger = demo.querySelector<HTMLButtonElement>("[data-action='nav-drawer-toggle']");
  if (!drawer || !scrim || !trigger) return;

  demo.dataset.drawerOpen = "false";
  demo.dataset.restoreDrawerFocus = String(restoreFocus);
  demo.dataset.drawerState = "closing";
  drawer.inert = true;
  drawer.setAttribute("aria-hidden", "true");
  scrim.setAttribute("aria-hidden", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Open main navigation");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishNavigationDrawerClose(demo);
    return;
  }
  const timer = window.setTimeout(() => finishNavigationDrawerClose(demo), 280);
  navigationDrawerTimers.set(demo, timer);
}

function initializeMenuBar(sample: HTMLElement) {
  const bar = sample.querySelector<HTMLElement>(".sample-menu-bar");
  const menu = bar?.querySelector<HTMLElement>(".sample-menu-bar-panel");
  if (!bar || !menu) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  menu.id = `sample-menu-bar-panel-${instance}`;
  menu.hidden = true;
  menu.inert = true;
  menu.setAttribute("aria-hidden", "true");
  menu.removeAttribute("data-open");
  menu.removeAttribute("data-motion");
  bar.querySelectorAll<HTMLButtonElement>("[data-action='toggle-menubar']").forEach((trigger) => {
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", menu.id);
  });
  menu.addEventListener("focusin", (event) => {
    const focusedItem = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[role='menuitem']") : null;
    if (!focusedItem) return;
    menu.querySelectorAll<HTMLElement>("[role='menuitem']").forEach((item) => item.classList.toggle("is-current", item === focusedItem));
  });
}

function showMenuExtraView(extra: HTMLElement, selectedView: string) {
  const views = Array.from(extra.querySelectorAll<HTMLElement>("[data-menu-extra-view]"));
  const incoming = views.find((view) => view.dataset.menuExtraView === selectedView);
  if (!incoming) return;

  const shouldAnimate = incoming.hidden;
  views.forEach((view) => {
    if (view === incoming) return;
    view.hidden = true;
    view.classList.remove("is-entering");
  });
  incoming.hidden = false;
  incoming.classList.remove("is-entering");
  if (shouldAnimate && !reducedMotionPreference.matches) {
    void incoming.offsetWidth;
    incoming.classList.add("is-entering");
    incoming.addEventListener("animationend", () => incoming.classList.remove("is-entering"), { once: true });
  }
}

function closeMenuBar(bar: HTMLElement, restoreFocus = false, immediate = false) {
  const menu = bar.querySelector<HTMLElement>(".sample-menu-bar-panel");
  const activeTrigger = bar.querySelector<HTMLElement>("[data-action='toggle-menubar'][aria-expanded='true']");
  if (menu) {
    const closeTimer = menuBarCloseTimers.get(menu);
    if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    menuBarCloseTimers.delete(menu);
    const animateClose = !immediate && !menu.hidden && !reducedMotionPreference.matches;
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");
    menu.removeAttribute("data-open");
    if (animateClose) {
      menu.dataset.motion = "closing";
      const timer = window.setTimeout(() => {
        if (menu.dataset.motion !== "closing") return;
        menu.hidden = true;
        menu.removeAttribute("data-motion");
        menuBarCloseTimers.delete(menu);
      }, 145);
      menuBarCloseTimers.set(menu, timer);
    } else {
      menu.hidden = true;
      menu.removeAttribute("data-motion");
    }
  }
  bar.querySelectorAll<HTMLElement>("[data-action='toggle-menubar']").forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove("is-current");
  });
  if (restoreFocus) activeTrigger?.focus({ preventScroll: true });
}

function initializeContextMenu(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-context-demo");
  const stage = demo?.querySelector<HTMLElement>(".sample-context-stage");
  const target = demo?.querySelector<HTMLButtonElement>(".sample-context-target");
  const menu = demo?.querySelector<HTMLElement>(".sample-context-menu");
  const submenuTrigger = menu?.querySelector<HTMLButtonElement>("[data-action='context-submenu-toggle']");
  const submenuPanel = menu?.querySelector<HTMLElement>(".sample-context-submenu-panel");
  if (!demo || !stage || !target || !menu) return;

  const instance = sample.dataset.sampleInstance ?? "example";
  menu.id = `sample-context-menu-${instance}`;
  menu.hidden = true;
  menu.removeAttribute("data-open");
  target.setAttribute("aria-controls", menu.id);
  target.setAttribute("aria-haspopup", "menu");
  target.setAttribute("aria-expanded", "false");
  target.setAttribute("aria-keyshortcuts", "Shift+F10 ContextMenu");
  menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']").forEach((item) => { item.tabIndex = -1; });

  if (submenuTrigger && submenuPanel) {
    submenuPanel.id = `sample-context-submenu-${instance}`;
    submenuPanel.hidden = true;
    submenuTrigger.setAttribute("aria-controls", submenuPanel.id);
    submenuTrigger.setAttribute("aria-expanded", "false");
    submenuTrigger.addEventListener("pointerenter", () => setContextSubmenuOpen(demo, submenuTrigger, true));
    submenuTrigger.closest<HTMLElement>(".sample-context-submenu")?.addEventListener("pointerleave", (event) => {
      if (event.relatedTarget instanceof Node && event.currentTarget instanceof HTMLElement && event.currentTarget.contains(event.relatedTarget)) return;
      setContextSubmenuOpen(demo, submenuTrigger, false);
    });
  }

  stage.addEventListener("contextmenu", (event) => {
    const contextTarget = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".sample-context-target") : null;
    if (!contextTarget) return;
    event.preventDefault();
    contextTarget.classList.add("is-selected");
    const bounds = stage.getBoundingClientRect();
    openContextMenu(demo, contextTarget, event.clientX - bounds.left, event.clientY - bounds.top);
  });

  menu.addEventListener("focusin", (event) => {
    const focusedItem = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[role='menuitem']") : null;
    if (!focusedItem) return;
    menu.querySelectorAll<HTMLElement>("[role='menuitem']").forEach((item) => item.classList.toggle("is-current", item === focusedItem));
  });
}

function openContextMenu(demo: HTMLElement, opener: HTMLElement, x?: number, y?: number) {
  const stage = demo.querySelector<HTMLElement>(".sample-context-stage");
  const menu = demo.querySelector<HTMLElement>(".sample-context-menu");
  const target = demo.querySelector<HTMLButtonElement>(".sample-context-target");
  if (!stage || !menu || !target) return;

  const submenuPanel = menu.querySelector<HTMLElement>(".sample-context-submenu-panel");
  const submenuTrigger = menu.querySelector<HTMLButtonElement>("[data-action='context-submenu-toggle']");
  if (submenuPanel) submenuPanel.hidden = true;
  submenuTrigger?.setAttribute("aria-expanded", "false");
  menu.querySelectorAll<HTMLElement>(".is-current").forEach((item) => item.classList.remove("is-current"));
  contextMenuOpeners.set(demo, opener);
  menu.hidden = false;
  menu.dataset.open = "true";
  target.classList.add("is-selected");
  target.setAttribute("aria-expanded", "true");

  const stageBounds = stage.getBoundingClientRect();
  const openerBounds = opener.getBoundingClientRect();
  const requestedX = x ?? openerBounds.right - stageBounds.left + 8;
  const requestedY = y ?? openerBounds.top - stageBounds.top + openerBounds.height / 2;
  const menuBounds = menu.getBoundingClientRect();
  const left = Math.max(8, Math.min(requestedX, stage.clientWidth - menuBounds.width - 8));
  const top = Math.max(8, Math.min(requestedY, stage.clientHeight - menuBounds.height - 8));
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.querySelector<HTMLElement>(":scope > [role='menuitem']")?.focus({ preventScroll: true });
}

function setContextSubmenuOpen(demo: HTMLElement, trigger: HTMLElement, open: boolean, moveFocus = false) {
  const submenu = trigger.closest<HTMLElement>(".sample-context-submenu");
  const panel = submenu?.querySelector<HTMLElement>(".sample-context-submenu-panel");
  const menu = trigger.closest<HTMLElement>(".sample-context-menu");
  const stage = demo.querySelector<HTMLElement>(".sample-context-stage");
  if (!panel || !menu || !stage) return;
  trigger.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
  if (!open) {
    if (moveFocus) trigger.focus({ preventScroll: true });
    return;
  }

  const stageBounds = stage.getBoundingClientRect();
  const menuBounds = menu.getBoundingClientRect();
  const panelWidth = panel.getBoundingClientRect().width;
  panel.dataset.align = menuBounds.right + panelWidth > stageBounds.right - 8 ? "left" : "right";
  if (moveFocus) panel.querySelector<HTMLElement>("[role='menuitem']")?.focus({ preventScroll: true });
}

function closeContextMenu(demo: HTMLElement, restoreFocus = false) {
  const menu = demo.querySelector<HTMLElement>(".sample-context-menu");
  const target = demo.querySelector<HTMLButtonElement>(".sample-context-target");
  const opener = contextMenuOpeners.get(demo);
  const submenuPanel = demo.querySelector<HTMLElement>(".sample-context-submenu-panel");
  const submenuTrigger = demo.querySelector<HTMLButtonElement>("[data-action='context-submenu-toggle']");
  if (menu) {
    menu.hidden = true;
    menu.removeAttribute("data-open");
    menu.querySelectorAll<HTMLElement>(".is-current").forEach((item) => item.classList.remove("is-current"));
  }
  if (submenuPanel) submenuPanel.hidden = true;
  submenuTrigger?.setAttribute("aria-expanded", "false");
  target?.setAttribute("aria-expanded", "false");
  target?.classList.remove("is-selected");
  contextMenuOpeners.delete(demo);
  if (restoreFocus) opener?.focus({ preventScroll: true });
}

function initializeLoadingMotion(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-loading-demo");
  const button = demo?.querySelector<HTMLButtonElement>("[data-action='loading-motion-toggle']");
  const completionButton = demo?.querySelector<HTMLButtonElement>("[data-action='loading-completion-toggle']");
  const status = demo?.querySelector<HTMLElement>("[data-loading-status]");
  if (!demo || !button || !completionButton || !status) return;

  const instance = sample.dataset.sampleInstance ?? String(++sampleInstance);
  const skeletonTitle = demo.querySelector<HTMLElement>("#sample-loading-skeleton-title");
  const spinnerTitle = demo.querySelector<HTMLElement>("#sample-loading-spinner-title");
  if (skeletonTitle) {
    skeletonTitle.id = `sample-loading-skeleton-title-${instance}`;
    skeletonTitle.closest("article")?.setAttribute("aria-labelledby", skeletonTitle.id);
  }
  if (spinnerTitle) {
    spinnerTitle.id = `sample-loading-spinner-title-${instance}`;
    spinnerTitle.closest("article")?.setAttribute("aria-labelledby", spinnerTitle.id);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  demo.dataset.motionPaused = String(reducedMotion);
  demo.dataset.motionOptIn = "false";
  button.setAttribute("aria-pressed", String(!reducedMotion));
  button.textContent = reducedMotion ? "Play animation" : "Pause animation";
  status.textContent = reducedMotion
    ? "Motion is paused to match your reduced-motion preference."
    : "The skeleton shimmer and spinner are moving. Pause motion to inspect them.";
  setLoadingDemoComplete(demo, false);
}

function setLoadingDemoComplete(demo: HTMLElement, complete: boolean) {
  demo.dataset.loadingComplete = String(complete);
  const badge = demo.querySelector<HTMLElement>("[data-loading-state]");
  const badgeLabel = badge?.querySelector<HTMLElement>("[data-loading-badge-label]");
  if (badge) badge.dataset.loadingState = complete ? "ready" : "loading";
  if (badgeLabel) badgeLabel.textContent = complete ? "Ready" : "Loading";

  demo.querySelectorAll<HTMLElement>(".sample-loading-option").forEach((option) => {
    option.setAttribute("aria-busy", String(!complete));
    const pending = option.querySelector<HTMLElement>("[data-loading-pending]");
    const result = option.querySelector<HTMLElement>("[data-loading-result]");
    if (pending) {
      pending.hidden = complete;
      pending.setAttribute("aria-hidden", String(complete));
    }
    if (result) result.hidden = !complete;
  });

  const motionButton = demo.querySelector<HTMLButtonElement>("[data-action='loading-motion-toggle']");
  const completionButton = demo.querySelector<HTMLButtonElement>("[data-action='loading-completion-toggle']");
  if (motionButton) motionButton.hidden = complete;
  if (completionButton) completionButton.textContent = complete ? "Replay loading" : "Show loaded state";
}

function initializeWebFocusRing(sample: HTMLElement) {
  const form = sample.querySelector<HTMLFormElement>(".sample-focus-demo");
  const input = form?.querySelector<HTMLInputElement>(".sample-focus-input");
  const status = form?.querySelector<HTMLOutputElement>(".sample-focus-status");
  if (!form || !input || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      input.focus({ preventScroll: true });
      return;
    }

    input.value = value;
    status.textContent = `Saved as "${value}". This preview did not send a request.`;
  });

  form.addEventListener("reset", () => {
    window.requestAnimationFrame(() => {
      status.textContent = `Reset to "${input.defaultValue}". This preview did not send a request.`;
    });
  });
}

function initializeMacosFocusRing(sample: HTMLElement) {
  const accessToggle = sample.querySelector<HTMLInputElement>("[data-focus-access]");
  const saveButton = sample.querySelector<HTMLButtonElement>("[data-action='focus-ring-save']");
  const status = sample.querySelector<HTMLElement>(".sample-focus-status");
  if (!accessToggle || !saveButton || !status) return;

  const updateKeyboardAccess = () => {
    saveButton.tabIndex = accessToggle.checked ? 0 : -1;
    status.textContent = accessToggle.checked
      ? "Full Keyboard Access is on. Tab can reach the text field, this checkbox, and Save."
      : "Full Keyboard Access is off. Tab skips Save; click it to activate it.";
  };

  accessToggle.addEventListener("change", updateKeyboardAccess);
  sample.addEventListener("focusin", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-focus-label]") : null;
    if (target) status.textContent = `First responder: ${target.dataset.focusLabel}.`;
  });
  sample.addEventListener("focusout", (event) => {
    if (event.relatedTarget instanceof Node && sample.contains(event.relatedTarget)) return;
    status.textContent = accessToggle.checked
      ? "Full Keyboard Access is on. Focus a control to see its ring."
      : "Full Keyboard Access is off. Tab skips Save; click it to activate it.";
  });
  updateKeyboardAccess();
}

function syncInspectorSelection(workspace: HTMLElement, selected: HTMLButtonElement, announceChange = true) {
  const panel = workspace.querySelector<HTMLElement>("[data-inspector-panel]");
  const name = selected.dataset.inspectorName ?? "Selected item";
  const type = selected.dataset.inspectorType ?? "Object";
  const inspectorName = panel?.querySelector<HTMLElement>("[data-inspector-name]");
  const inspectorType = panel?.querySelector<HTMLElement>("[data-inspector-type]");
  const width = panel?.querySelector<HTMLElement>("[data-inspector-width]");
  const selectionChanged = inspectorName?.textContent !== name;
  if (inspectorName) inspectorName.textContent = name;
  if (inspectorType) inspectorType.textContent = type;
  if (width) width.textContent = selected.dataset.inspectorWidth ?? "Auto";

  panel?.querySelectorAll<HTMLInputElement>("[data-inspector-control]").forEach((control) => {
    const property = control.dataset.inspectorControl;
    const value = property === "opacity"
      ? selected.dataset.inspectorOpacity ?? "100"
      : selected.dataset.inspectorRadius ?? "0";
    control.value = value;
    const output = panel.querySelector<HTMLOutputElement>(`[data-inspector-output='${property}']`);
    if (output) output.value = output.textContent = property === "opacity" ? `${value}%` : `${value} px`;
  });
  selected.style.opacity = String(Number(selected.dataset.inspectorOpacity ?? "100") / 100);
  selected.style.borderRadius = `${selected.dataset.inspectorRadius ?? "0"}px`;

  if (selectionChanged && announceChange && panel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const heading = panel.querySelector<HTMLElement>("header > div");
    heading?.getAnimations().forEach((animation) => animation.cancel());
    heading?.animate(
      [
        { opacity: 0.55, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 190, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }

  if (announceChange) {
    const status = workspace.querySelector<HTMLElement>(".sample-inspector-status");
    if (status) status.textContent = `${name} selected. Inspector shows ${type.toLocaleLowerCase()} properties.`;
  }
}

function setInspectorOpen(workspace: HTMLElement, open: boolean, opener?: HTMLElement) {
  const panel = workspace.querySelector<HTMLElement>("[data-inspector-panel]");
  const divider = workspace.querySelector<HTMLElement>("[data-inspector-divider]");
  if (!panel || !divider) return;
  workspace.dataset.inspectorOpen = String(open);
  panel.inert = !open;
  panel.setAttribute("aria-hidden", String(!open));
  divider.tabIndex = open ? 0 : -1;
  divider.setAttribute("aria-hidden", String(!open));
  workspace.querySelectorAll<HTMLButtonElement>("[data-action='inspector-toggle']").forEach((button) => {
    button.setAttribute("aria-expanded", String(open));
    const label = button.querySelector<HTMLElement>(":scope > span");
    if (label) label.textContent = open ? "Hide Inspector" : "Show Inspector";
    if (button.hasAttribute("aria-label")) button.setAttribute("aria-label", open ? "Close Inspector" : "Open Inspector");
  });
  if (!open && opener && panel.contains(opener)) {
    workspace.querySelector<HTMLButtonElement>(".sample-inspector-toolbar [data-action='inspector-toggle']")?.focus({ preventScroll: true });
  }
  const status = workspace.querySelector<HTMLElement>(".sample-inspector-status");
  if (status) status.textContent = open
    ? "Inspector opened. The project canvas stays visible."
    : "Inspector closed. The project canvas remains available.";
}

function updateEditorColorsPanelVisibility(demo: HTMLElement) {
  const panel = demo.querySelector<HTMLElement>("[data-editor-colors-panel]");
  const hideWhenInactive = demo.querySelector<HTMLInputElement>("[data-input-action='editor-hide-inactive']")?.checked ?? false;
  const open = demo.dataset.panelOpen === "true";
  const active = demo.dataset.editorActive !== "false";
  const visible = open && (active || !hideWhenInactive);
  demo.dataset.panelVisible = String(visible);
  if (!visible && demo.dataset.editorCustomPickerOpen === "true") setEditorCustomColorPickerOpen(demo, false);
  if (panel) {
    panel.inert = !visible;
    panel.setAttribute("aria-hidden", String(!visible));
  }
  const toggle = demo.querySelector<HTMLButtonElement>("[data-action='editor-panel-toggle']");
  toggle?.setAttribute("aria-expanded", String(open));
  const label = toggle?.querySelector<HTMLElement>("span");
  if (label) label.textContent = open ? "Hide Colors" : "Show Colors";
}

function setEditorColorsPanelOpen(demo: HTMLElement, open: boolean, restoreFocus = false) {
  demo.dataset.panelOpen = String(open);
  updateEditorColorsPanelVisibility(demo);
  const status = demo.querySelector<HTMLElement>(".sample-editor-colors-status");
  if (status) status.textContent = open
    ? "Colors panel opened above the editor. The document stays in context."
    : "Colors panel closed. Document color changes are kept in this preview.";
  if (!open && restoreFocus) demo.querySelector<HTMLButtonElement>("[data-action='editor-panel-toggle']")?.focus({ preventScroll: true });
}

function fitMacPopoverPreview(demo: HTMLElement) {
  const panel = demo.querySelector<HTMLElement>(".sample-popover-panel");
  const anchor = demo.querySelector<HTMLElement>(".sample-popover-anchor-area");
  const header = demo.querySelector<HTMLElement>(".sample-popover-window-header");
  if (!panel || !anchor || !header) return;
  const previewWindow = demo.querySelector<HTMLElement>(".sample-popover-window");
  if (previewWindow) demo.style.setProperty("--sample-popover-width", `${Math.max(0, previewWindow.clientWidth - 24)}px`);
  const previousSpace = Number.parseFloat(demo.style.getPropertyValue("--sample-popover-space")) || 0;
  const anchorTop = anchor.getBoundingClientRect().top - previousSpace;
  const requiredTop = header.getBoundingClientRect().bottom + panel.getBoundingClientRect().height + 16;
  const space = demo.dataset.popoverOpen === "true" ? Math.max(0, Math.ceil(requiredTop - anchorTop)) : 0;
  demo.style.setProperty("--sample-popover-space", `${space}px`);
}

function setMacPopoverOpen(demo: HTMLElement, open: boolean, restoreFocus = false) {
  const trigger = demo.querySelector<HTMLButtonElement>("[data-action='macos-popover-toggle']");
  const panel = demo.querySelector<HTMLElement>("[role='dialog']");
  if (!trigger || !panel) return;

  demo.dataset.popoverOpen = String(open);
  trigger.setAttribute("aria-expanded", String(open));
  panel.setAttribute("aria-hidden", String(!open));
  panel.inert = !open;

  if (open) {
    demo.dataset.popoverPlacement = "above";
    fitMacPopoverPreview(demo);
    announce(demo.closest<HTMLElement>(".ui-sample") ?? demo, "Now Playing popover opened. The playback controls are attached to the source button.");
  } else {
    fitMacPopoverPreview(demo);
    announce(demo.closest<HTMLElement>(".ui-sample") ?? demo, "Now Playing popover closed.");
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
}

function initializeMacPopoverDemo(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const demo = sample.matches(".sample-popover-macos") ? sample : sample.querySelector<HTMLElement>(".sample-popover-macos");
  const trigger = demo?.querySelector<HTMLButtonElement>("[data-action='macos-popover-toggle']");
  const panel = demo?.querySelector<HTMLElement>("[role='dialog']");
  const title = panel?.querySelector<HTMLElement>(".sample-popover-panel-header strong");
  if (!demo || !trigger || !panel) return;

  panel.id = `macos-popover-${instance}`;
  trigger.setAttribute("aria-controls", panel.id);
  if (title) {
    title.id = `macos-popover-title-${instance}`;
    panel.setAttribute("aria-labelledby", title.id);
    panel.removeAttribute("aria-label");
  }
  demo.querySelectorAll<HTMLInputElement>("[data-input-action='macos-popover-output']").forEach((input, index) => {
    input.name = `popover-output-${instance}`;
    input.id = `popover-output-${instance}-${index + 1}`;
  });
  const volume = demo.querySelector<HTMLInputElement>("[data-input-action='macos-popover-volume']");
  if (volume) volume.setAttribute("aria-valuetext", `${volume.value}%`);

  const initiallyOpen = demo.dataset.popoverOpen !== "false";
  demo.dataset.popoverPlacement = demo.dataset.popoverPlacement ?? "above";
  trigger.setAttribute("aria-expanded", String(initiallyOpen));
  panel.setAttribute("aria-hidden", String(!initiallyOpen));
  panel.inert = !initiallyOpen;
  const resizeObserver = new ResizeObserver(() => fitMacPopoverPreview(demo));
  resizeObserver.observe(panel);
  resizeObserver.observe(demo);
  fitMacPopoverPreview(demo);

  demo.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || demo.dataset.popoverOpen !== "true") return;
    event.preventDefault();
    setMacPopoverOpen(demo, false, true);
  });
}

function initializePopupPullDownCombo(sample: HTMLElement, instance = sample.dataset.sampleInstance ?? "example") {
  const demo = sample.querySelector<HTMLElement>(".sample-popup-comparison");
  if (!demo) return;

  const suffix = instance.replace(/[^A-Za-z0-9_-]/g, "-");
  const owners = Array.from(demo.querySelectorAll<HTMLElement>("[data-popup-owner]"));
  const input = demo.querySelector<HTMLInputElement>("[role='combobox']");
  const comboLabel = demo.querySelector<HTMLLabelElement>("[data-popup-combo-label]");
  const comboPanel = demo.querySelector<HTMLElement>("[data-popup-panel='combo']");
  const comboToggle = demo.querySelector<HTMLButtonElement>("[data-popup-trigger='combo']");
  const status = demo.querySelector<HTMLElement>("[data-popup-status]");
  const panelCloseTimers = new WeakMap<HTMLElement, number>();
  if (!input || !comboLabel || !comboPanel || !comboToggle) return;

  input.id = `sample-popup-font-input-${suffix}`;
  comboLabel.htmlFor = input.id;
  comboPanel.id = `sample-popup-font-options-${suffix}`;
  input.setAttribute("aria-controls", comboPanel.id);
  comboToggle.setAttribute("aria-controls", comboPanel.id);

  owners.forEach((owner) => {
    const key = owner.dataset.popupOwner;
    if (!key) return;
    const panel = demo.querySelector<HTMLElement>(`[data-popup-panel='${key}']`);
    const trigger = demo.querySelector<HTMLButtonElement>(`[data-popup-trigger='${key}']`);
    if (!panel || !trigger) return;
    panel.id = `sample-popup-${key}-${suffix}`;
    trigger.setAttribute("aria-controls", panel.id);
    panel.querySelectorAll<HTMLButtonElement>("[role='option'], [role='menuitem']").forEach((option, index) => {
      option.id = `sample-popup-${key}-${suffix}-option-${index + 1}`;
    });
    panel.hidden = true;
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
  });

  const visibleComboOptions = () => Array.from(comboPanel.querySelectorAll<HTMLButtonElement>("[role='option']:not([hidden])"));

  const finishPanelClose = (panel: HTMLElement) => {
    const timer = panelCloseTimers.get(panel);
    if (timer !== undefined) window.clearTimeout(timer);
    panelCloseTimers.delete(panel);
    panel.hidden = true;
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("opens-up", "is-opening", "is-closing");
  };

  const closeOwner = (owner: HTMLElement, restoreFocus = false) => {
    const key = owner.dataset.popupOwner;
    const panel = key ? demo.querySelector<HTMLElement>(`[data-popup-panel='${key}']`) : null;
    const trigger = key ? demo.querySelector<HTMLButtonElement>(`[data-popup-trigger='${key}']`) : null;
    if (!panel || !trigger) return;
    const wasVisible = !panel.hidden;
    delete owner.dataset.open;
    trigger.setAttribute("aria-expanded", "false");
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("is-opening");
    panel.classList.add("is-closing");
    if (wasVisible && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => {
        if (owner.dataset.open !== "true") finishPanelClose(panel);
      }, 120);
      panelCloseTimers.set(panel, timer);
    } else {
      finishPanelClose(panel);
    }
    if (key === "combo") {
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      comboPanel.querySelectorAll<HTMLElement>(".is-active").forEach((option) => option.classList.remove("is-active"));
      if (restoreFocus) input.focus({ preventScroll: true });
    } else if (restoreFocus) {
      trigger.focus({ preventScroll: true });
    }
  };

  const closeOtherOwners = (except?: HTMLElement) => {
    owners.forEach((owner) => {
      if (owner !== except && owner.dataset.open === "true") closeOwner(owner);
    });
  };

  const positionPanel = (owner: HTMLElement, panel: HTMLElement) => {
    panel.classList.remove("opens-up");
    const stage = sample.closest<HTMLElement>(".element-demo-stage, .element-preview");
    const stageBounds = stage?.getBoundingClientRect();
    const ownerBounds = owner.getBoundingClientRect();
    const panelHeight = panel.getBoundingClientRect().height;
    if (!stageBounds) return;
    const below = stageBounds.bottom - ownerBounds.bottom;
    const above = ownerBounds.top - stageBounds.top;
    panel.classList.toggle("opens-up", below < panelHeight + 8 && above > below);
  };

  const setOwnerOpen = (owner: HTMLElement, open: boolean, focus = true) => {
    const key = owner.dataset.popupOwner;
    const panel = key ? demo.querySelector<HTMLElement>(`[data-popup-panel='${key}']`) : null;
    const trigger = key ? demo.querySelector<HTMLButtonElement>(`[data-popup-trigger='${key}']`) : null;
    if (!key || !panel || !trigger) return;
    if (!open) {
      closeOwner(owner);
      return;
    }
    closeOtherOwners(owner);
    const closeTimer = panelCloseTimers.get(panel);
    if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    panelCloseTimers.delete(panel);
    panel.hidden = false;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    delete panel.dataset.opening;
    delete owner.dataset.open;
    trigger.setAttribute("aria-expanded", "true");
    if (key === "combo") input.setAttribute("aria-expanded", "true");
    owner.dataset.open = "true";
    positionPanel(owner, panel);
    panel.classList.remove("is-opening", "is-closing");
    void panel.offsetWidth;
    panel.classList.add("is-opening");
    if (key === "combo") {
      if (focus) input.focus({ preventScroll: true });
    } else if (focus) {
      const selected = panel.querySelector<HTMLElement>("[role='option'][aria-selected='true']");
      (selected ?? panel.querySelector<HTMLElement>("[role='menuitem']"))?.focus({ preventScroll: true });
    }
  };

  const setStatus = (message: string) => {
    if (status) status.textContent = message;
    announce(sample, message);
  };

  const updateComboOptions = (query = input.value.trim()) => {
    const normalized = query.toLocaleLowerCase();
    const options = Array.from(comboPanel.querySelectorAll<HTMLButtonElement>("[data-combo-value]"));
    let exactMatch = false;
    options.forEach((option) => {
      const value = option.dataset.comboValue ?? "";
      const matches = !normalized || value.toLocaleLowerCase().includes(normalized);
      option.hidden = !matches;
      option.setAttribute("aria-selected", String(value.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase()));
      if (value.toLocaleLowerCase() === normalized) exactMatch = true;
      option.classList.remove("is-active");
    });
    comboPanel.querySelector("[data-combo-freeform]")?.remove();
    input.removeAttribute("aria-activedescendant");

    if (normalized && !exactMatch) {
      const freeform = document.createElement("button");
      freeform.type = "button";
      freeform.id = `sample-popup-combo-${suffix}-custom`;
      freeform.setAttribute("role", "option");
      freeform.setAttribute("aria-selected", "false");
      freeform.dataset.comboFreeform = input.value.trim();
      freeform.className = "sample-popup-freeform-option";
      freeform.textContent = `Use “${input.value.trim()}”`;
      comboPanel.append(freeform);
    }
  };

  const setComboActive = (index: number) => {
    const options = visibleComboOptions();
    if (!options.length) return;
    const next = options[(index + options.length) % options.length];
    if (!next) return;
    comboPanel.querySelectorAll<HTMLElement>(".is-active").forEach((option) => option.classList.remove("is-active"));
    next.classList.add("is-active");
    input.setAttribute("aria-activedescendant", next.id);
  };

  const commitComboValue = (value: string, freeform = false) => {
    const normalized = value.trim();
    if (!normalized) return;
    input.value = normalized;
    updateComboOptions(normalized);
    const owner = demo.querySelector<HTMLElement>("[data-popup-owner='combo']");
    if (owner) closeOwner(owner);
    setStatus(freeform
      ? `Custom font “${normalized}” entered. Combo boxes can keep values outside the suggestion list.`
      : `${normalized} selected from the combo box suggestions.`);
    input.focus({ preventScroll: true });
  };

  demo.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const choice = target.closest<HTMLButtonElement>("[data-popup-choice]");
    if (choice) {
      const owner = choice.closest<HTMLElement>("[data-popup-owner='selection']");
      const trigger = owner?.querySelector<HTMLButtonElement>("[data-popup-trigger='selection']");
      const label = choice.dataset.popupChoice ?? "Medium";
      owner?.querySelectorAll<HTMLElement>("[data-popup-choice]").forEach((option) => {
        option.setAttribute("aria-selected", String(option === choice));
      });
      const value = trigger?.querySelector<HTMLElement>("[data-popup-trigger-value]");
      if (value) value.textContent = label;
      trigger?.setAttribute("aria-label", `Text scale, ${label}`);
      if (owner) closeOwner(owner, true);
      setStatus(`${label} is now the selected text scale. The pop-up button keeps this value visible.`);
      return;
    }

    const command = target.closest<HTMLButtonElement>("[data-popup-command]");
    if (command) {
      const owner = command.closest<HTMLElement>("[data-popup-owner='actions']");
      const action = command.dataset.popupCommand ?? "Action";
      if (owner) closeOwner(owner, true);
      setStatus(`${action} chosen from Add. The pull-down label stays fixed. No file was created.`);
      return;
    }

    const suggestion = target.closest<HTMLButtonElement>("[data-combo-value], [data-combo-freeform]");
    if (suggestion) {
      const value = suggestion.dataset.comboValue ?? suggestion.dataset.comboFreeform ?? "";
      commitComboValue(value, Boolean(suggestion.dataset.comboFreeform));
      return;
    }

    const trigger = target.closest<HTMLButtonElement>("[data-popup-trigger]");
    if (!trigger) return;
    const owner = trigger.closest<HTMLElement>("[data-popup-owner]");
    if (!owner) return;
    const open = owner.dataset.open !== "true";
    if (owner.dataset.popupOwner === "combo") {
      updateComboOptions();
      setOwnerOpen(owner, open);
    } else {
      setOwnerOpen(owner, open);
    }
  });

  input.addEventListener("input", () => {
    updateComboOptions();
    const owner = input.closest<HTMLElement>("[data-popup-owner='combo']");
    if (owner && owner.dataset.open !== "true") setOwnerOpen(owner, true, false);
  });

  demo.addEventListener("keydown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const owner = target?.closest<HTMLElement>("[data-popup-owner]");
    if (!target || !owner) return;
    const key = owner.dataset.popupOwner;
    const panel = key ? demo.querySelector<HTMLElement>(`[data-popup-panel='${key}']`) : null;

    if (target === input) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!panel || panel.hidden) {
          updateComboOptions();
          setOwnerOpen(owner, true, false);
          setComboActive(event.key === "ArrowDown" ? 0 : visibleComboOptions().length - 1);
          return;
        }
        const options = visibleComboOptions();
        const activeId = input.getAttribute("aria-activedescendant");
        const index = options.findIndex((option) => option.id === activeId);
        const next = event.key === "ArrowDown"
          ? (index + 1) % options.length
          : index <= 0 ? options.length - 1 : index - 1;
        setComboActive(next);
        return;
      }
      if (event.key === "Enter") {
        const active = visibleComboOptions().find((option) => option.id === input.getAttribute("aria-activedescendant"));
        if (active) {
          event.preventDefault();
          commitComboValue(active.dataset.comboValue ?? active.dataset.comboFreeform ?? "", Boolean(active.dataset.comboFreeform));
        } else if (input.value.trim()) {
          event.preventDefault();
          const exact = Array.from(comboPanel.querySelectorAll<HTMLButtonElement>("[data-combo-value]"))
            .some((option) => option.dataset.comboValue?.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase());
          commitComboValue(input.value, !exact);
        }
        return;
      }
      if (event.key === "Escape" && owner.dataset.open === "true") {
        event.preventDefault();
        closeOwner(owner, true);
        return;
      }
    }

    if (target.matches("[data-popup-trigger]") && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      if (owner.dataset.open !== "true") {
        if (key === "combo") updateComboOptions();
        setOwnerOpen(owner, true);
      } else if (key === "combo") {
        input.focus({ preventScroll: true });
        setComboActive(event.key === "ArrowDown" ? 0 : visibleComboOptions().length - 1);
      }
      return;
    }

    if (event.key === "Escape" && owner.dataset.open === "true") {
      event.preventDefault();
      closeOwner(owner, true);
      return;
    }

    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && target.matches("[role='option'], [role='menuitem']")) {
      const options = Array.from(panel?.querySelectorAll<HTMLElement>("[role='option']:not([hidden]), [role='menuitem']:not([hidden])") ?? []);
      const index = options.indexOf(target);
      const next = event.key === "ArrowDown" ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
      if (options.length) {
        event.preventDefault();
        options[next]?.focus({ preventScroll: true });
      }
      return;
    }

    if ((event.key === "Home" || event.key === "End") && target.matches("[role='option'], [role='menuitem']")) {
      const options = Array.from(panel?.querySelectorAll<HTMLElement>("[role='option']:not([hidden]), [role='menuitem']:not([hidden])") ?? []);
      if (options.length) {
        event.preventDefault();
        options[event.key === "Home" ? 0 : options.length - 1]?.focus({ preventScroll: true });
      }
      return;
    }

    if (event.key === "Tab" && owner.dataset.open === "true") closeOwner(owner);
  });

  demo.addEventListener("focusout", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const owner = target?.closest<HTMLElement>("[data-popup-owner]");
    if (!owner) return;
    window.requestAnimationFrame(() => {
      if (owner.dataset.open === "true" && !owner.contains(document.activeElement)) closeOwner(owner);
    });
  });

  updateComboOptions(input.value);
}

function getEditorColorInk(color: string) {
  const hex = color.replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(hex)) return "#FFFFFF";

  const luminance = (value: string) => {
    const channels = [0, 2, 4].map((offset) => {
      const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const [red = 0, green = 0, blue = 0] = channels;
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };

  const backgroundLuminance = luminance(hex);
  const whiteContrast = 1.05 / (backgroundLuminance + 0.05);
  return whiteContrast >= 3 ? "#FFFFFF" : "#172326";
}

function updateEditorDocumentColor(demo: HTMLElement, color: string, name: string, announceStatus = true) {
  const normalizedColor = color.toUpperCase();
  demo.style.setProperty("--editor-color", normalizedColor);
  demo.style.setProperty("--editor-color-ink", getEditorColorInk(normalizedColor));
  demo.style.setProperty("--editor-color-soft", `color-mix(in srgb, ${normalizedColor} 12%, white)`);
  const colorName = demo.querySelector<HTMLElement>("[data-editor-color-name]");
  const colorValue = demo.querySelector<HTMLElement>("[data-editor-color-value]");
  const status = demo.querySelector<HTMLElement>(".sample-editor-colors-status");
  const customColor = demo.querySelector<HTMLInputElement>("[data-input-action='editor-custom-hex']");
  const customSwatch = demo.querySelector<HTMLElement>("[data-editor-custom-swatch]");
  if (colorName) colorName.textContent = name;
  if (colorValue) colorValue.textContent = normalizedColor;
  if (customColor && customColor.value.toUpperCase() !== normalizedColor) customColor.value = normalizedColor;
  if (customSwatch) customSwatch.style.backgroundColor = normalizedColor;
  syncEditorCustomColorPicker(demo, normalizedColor);
  if (status && announceStatus) status.textContent = `${name} selected. The document preview updated; no file was changed.`;
}

function renderEditorCustomColorPicker(demo: HTMLElement, hue: number, saturation: number, brightness: number) {
  const normalizedHue = Math.min(360, Math.max(0, hue));
  const normalizedSaturation = Math.min(100, Math.max(0, saturation));
  const normalizedBrightness = Math.min(100, Math.max(0, brightness));
  const surface = demo.querySelector<HTMLElement>("[data-editor-color-surface]");
  const hueInput = demo.querySelector<HTMLInputElement>("[data-input-action='editor-color-hue']");
  const hueOutput = demo.querySelector<HTMLOutputElement>("[data-editor-color-hue-value]");
  const color = hsvToHex(normalizedHue, normalizedSaturation, normalizedBrightness);

  demo.dataset.editorPickerHue = String(normalizedHue);
  demo.dataset.editorPickerSaturation = String(normalizedSaturation);
  demo.dataset.editorPickerBrightness = String(normalizedBrightness);
  surface?.style.setProperty("--editor-picker-hue", `${normalizedHue}deg`);
  surface?.style.setProperty("--editor-picker-saturation", `${normalizedSaturation}%`);
  surface?.style.setProperty("--editor-picker-brightness", `${normalizedBrightness}%`);
  surface?.setAttribute("aria-valuenow", String(Math.round(normalizedSaturation)));
  surface?.setAttribute("aria-valuetext", `Saturation ${Math.round(normalizedSaturation)}%, brightness ${Math.round(normalizedBrightness)}%`);
  if (hueInput) {
    hueInput.value = String(Math.round(normalizedHue));
    hueInput.style.setProperty("--editor-picker-thumb-color", `hsl(${normalizedHue} 100% 43%)`);
  }
  if (hueOutput) hueOutput.value = `${Math.round(normalizedHue)}°`;
  const hexInput = demo.querySelector<HTMLInputElement>("[data-input-action='editor-custom-hex']");
  if (hexInput) {
    hexInput.value = color;
    hexInput.removeAttribute("aria-invalid");
  }
  const error = demo.querySelector<HTMLElement>("[data-editor-color-error]");
  if (error) error.hidden = true;
  return color;
}

function syncEditorCustomColorPicker(demo: HTMLElement, color: string) {
  if (!/^#[0-9A-F]{6}$/i.test(color)) return;
  const parsed = hexToHsv(color);
  const hue = parsed.saturation === 0 ? Number(demo.dataset.editorPickerHue ?? parsed.hue) : parsed.hue;
  renderEditorCustomColorPicker(demo, hue, parsed.saturation, parsed.brightness);
}

function setEditorCustomColorPickerOpen(demo: HTMLElement, open: boolean, restoreFocus = false) {
  const trigger = demo.querySelector<HTMLButtonElement>("[data-action='editor-custom-toggle']");
  const picker = demo.querySelector<HTMLElement>("[data-editor-custom-picker]");
  if (!trigger || !picker) return;
  picker.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
  demo.dataset.editorCustomPickerOpen = String(open);
  if (open) {
    const surface = picker.querySelector<HTMLElement>("[data-editor-color-surface]");
    surface?.focus({ preventScroll: true });
    const panel = demo.querySelector<HTMLElement>("[data-editor-colors-panel]");
    requestAnimationFrame(() => panel?.scrollTo({
      top: panel.scrollHeight,
      behavior: reducedMotionPreference.matches ? "auto" : "smooth",
    }));
  } else {
    const panel = demo.querySelector<HTMLElement>("[data-editor-colors-panel]");
    panel?.scrollTo({ top: 0, behavior: "auto" });
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
}

function updateEditorCustomColorFromPoint(surface: HTMLElement, clientX: number, clientY: number) {
  const demo = surface.closest<HTMLElement>(".sample-editor-colors-demo");
  if (!demo) return;
  const bounds = surface.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return;
  const saturation = ((clientX - bounds.left) / bounds.width) * 100;
  const brightness = (1 - (clientY - bounds.top) / bounds.height) * 100;
  const color = renderEditorCustomColorPicker(
    demo,
    Number(demo.dataset.editorPickerHue ?? 220),
    saturation,
    brightness,
  );
  demo.querySelectorAll<HTMLInputElement>("[data-input-action='editor-color']").forEach((input) => { input.checked = false; });
  updateEditorDocumentColor(demo, color, "Custom color", false);
}

function initializeEditorColorsPanel(sample: HTMLElement) {
  const demo = sample.querySelector<HTMLElement>(".sample-editor-colors-demo");
  const panel = demo?.querySelector<HTMLElement>("[data-editor-colors-panel]");
  if (!demo || !panel) return;
  const instance = sample.dataset.sampleInstance ?? String(++sampleInstance);
  panel.id = `editor-colors-panel-${instance}`;
  demo.querySelector<HTMLButtonElement>("[data-action='editor-panel-toggle']")?.setAttribute("aria-controls", panel.id);
  const customPicker = demo.querySelector<HTMLElement>("[data-editor-custom-picker]");
  const customPickerTrigger = demo.querySelector<HTMLButtonElement>("[data-action='editor-custom-toggle']");
  if (customPicker) customPicker.id = `editor-custom-picker-${instance}`;
  if (customPickerTrigger && customPicker) customPickerTrigger.setAttribute("aria-controls", customPicker.id);
  demo.querySelector<HTMLElement>("#editor-colors-title")?.setAttribute("id", `editor-colors-title-${instance}`);
  panel.setAttribute("aria-labelledby", `editor-colors-title-${instance}`);
  demo.querySelectorAll<HTMLInputElement>("[data-input-action='editor-color']").forEach((input, index) => {
    input.name = `editor-color-${instance}`;
    input.id = `editor-color-${instance}-${index + 1}`;
  });
  demo.querySelectorAll<HTMLButtonElement>("[data-action='editor-panel-style']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.panelStyle === (demo.dataset.panelStyle ?? "utility")));
  });
  const selectedColor = demo.querySelector<HTMLInputElement>("[data-input-action='editor-color']:checked");
  if (selectedColor) updateEditorDocumentColor(demo, selectedColor.value, selectedColor.dataset.colorName ?? "Selected color");
  setEditorCustomColorPickerOpen(demo, false);
  updateEditorColorsPanelVisibility(demo);
  demo.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (demo.dataset.editorCustomPickerOpen === "true") {
      event.preventDefault();
      setEditorCustomColorPickerOpen(demo, false, true);
      return;
    }
    if (demo.dataset.panelOpen !== "true") return;
    event.preventDefault();
    setEditorColorsPanelOpen(demo, false, true);
  });
}

function initializeInspector(sample: HTMLElement) {
  const workspace = sample.querySelector<HTMLElement>("[data-inspector-workspace]");
  const panel = workspace?.querySelector<HTMLElement>("[data-inspector-panel]");
  const divider = workspace?.querySelector<HTMLElement>("[data-inspector-divider]");
  const initialSelection = workspace?.querySelector<HTMLButtonElement>("[data-action='inspector-select'].is-selected")
    ?? workspace?.querySelector<HTMLButtonElement>("[data-action='inspector-select']");
  if (!workspace || !panel || !divider || !initialSelection) return;

  const instance = sample.dataset.sampleInstance ?? String(++sampleInstance);
  panel.id = `sample-inspector-panel-${instance}`;
  workspace.querySelectorAll<HTMLButtonElement>("[data-action='inspector-toggle']").forEach((button) => {
    button.setAttribute("aria-controls", panel.id);
  });
  workspace.querySelectorAll<HTMLButtonElement>("[data-action='inspector-section-toggle']").forEach((button, index) => {
    const content = button.closest<HTMLElement>(".sample-inspector-section")?.querySelector<HTMLElement>("[data-inspector-section]");
    if (!content) return;
    content.id = `sample-inspector-section-${instance}-${index + 1}`;
    button.setAttribute("aria-controls", content.id);
    const expanded = button.getAttribute("aria-expanded") === "true";
    content.classList.toggle("is-collapsed", !expanded);
    content.inert = !expanded;
    content.setAttribute("aria-hidden", String(!expanded));
  });
  setInspectorOpen(workspace, workspace.dataset.inspectorOpen !== "false");
  syncInspectorSelection(workspace, initialSelection);

  let inspectorWidth = 256;
  const updateInspectorWidth = (width: number) => {
    inspectorWidth = Math.max(192, Math.min(352, width));
    workspace.style.setProperty("--sample-inspector-width", `${inspectorWidth}px`);
    divider.setAttribute("aria-valuenow", String(inspectorWidth));
  };
  updateInspectorWidth(inspectorWidth);

  workspace.addEventListener("input", (event) => {
    const control = event.target instanceof HTMLInputElement
      ? event.target.closest<HTMLInputElement>("[data-inspector-control]")
      : null;
    if (!control) return;
    const selected = workspace.querySelector<HTMLButtonElement>("[data-action='inspector-select'].is-selected");
    const property = control.dataset.inspectorControl;
    const value = Number(control.value);
    if (!selected || !property || !Number.isFinite(value)) return;
    const output = panel.querySelector<HTMLOutputElement>(`[data-inspector-output='${property}']`);
    if (property === "opacity") {
      selected.dataset.inspectorOpacity = String(value);
      selected.style.opacity = String(value / 100);
      if (output) output.value = output.textContent = `${value}%`;
    } else if (property === "radius") {
      selected.dataset.inspectorRadius = String(value);
      selected.style.borderRadius = `${value}px`;
      if (output) output.value = output.textContent = `${value} px`;
    }
  });
  workspace.addEventListener("change", (event) => {
    const control = event.target instanceof HTMLInputElement
      ? event.target.closest<HTMLInputElement>("[data-inspector-control]")
      : null;
    if (!control) return;
    const name = panel.querySelector<HTMLElement>("[data-inspector-name]")?.textContent ?? "Selection";
    const output = panel.querySelector<HTMLOutputElement>(`[data-inspector-output='${control.dataset.inspectorControl}']`);
    const property = control.dataset.inspectorControl === "opacity" ? "Opacity" : "Corner radius";
    const status = workspace.querySelector<HTMLElement>(".sample-inspector-status");
    if (status && output) status.textContent = `${property} updated to ${output.value} for ${name}.`;
  });

  divider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || workspace.dataset.inspectorOpen !== "true") return;
    event.preventDefault();
    divider.setPointerCapture(event.pointerId);
    workspace.dataset.resizing = "true";
    divider.dataset.dragStartX = String(event.clientX);
    divider.dataset.dragStartWidth = String(inspectorWidth);
  });
  divider.addEventListener("pointermove", (event) => {
    if (!divider.hasPointerCapture(event.pointerId)) return;
    const startX = Number(divider.dataset.dragStartX ?? event.clientX);
    const startWidth = Number(divider.dataset.dragStartWidth ?? inspectorWidth);
    updateInspectorWidth(startWidth + startX - event.clientX);
  });
  const finishInspectorResize = (event: PointerEvent) => {
    if (!divider.hasPointerCapture(event.pointerId)) return;
    divider.releasePointerCapture(event.pointerId);
    delete divider.dataset.dragStartX;
    delete divider.dataset.dragStartWidth;
    delete workspace.dataset.resizing;
    const status = workspace.querySelector<HTMLElement>(".sample-inspector-status");
    if (status) status.textContent = `Inspector width ${inspectorWidth} pixels.`;
  };
  divider.addEventListener("pointerup", finishInspectorResize);
  divider.addEventListener("pointercancel", finishInspectorResize);
  divider.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 32 : 12;
    if (event.key === "ArrowLeft") updateInspectorWidth(inspectorWidth + step);
    else if (event.key === "ArrowRight") updateInspectorWidth(inspectorWidth - step);
    else return;
    event.preventDefault();
    const status = workspace.querySelector<HTMLElement>(".sample-inspector-status");
    if (status) status.textContent = `Inspector width ${inspectorWidth} pixels.`;
  });
}

function selectOutlineItem(treeItem: HTMLElement, moveFocus = false) {
  const tree = treeItem.closest<HTMLElement>(".sample-outline[role='tree']");
  if (!tree) return;
  tree.querySelectorAll<HTMLElement>("[role='treeitem']").forEach((item) => {
    const selected = item === treeItem;
    item.classList.toggle("is-current", selected);
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  if (moveFocus) treeItem.focus({ preventScroll: true });
}

function visibleOutlineItems(tree: HTMLElement) {
  return Array.from(tree.querySelectorAll<HTMLElement>("[role='treeitem']"))
    .filter((item) => !item.closest<HTMLElement>("[role='group'][hidden]"));
}

function toggleOutlineBranch(treeItem: HTMLElement) {
  const children = treeItem.querySelector<HTMLElement>(":scope > .sample-outline-children");
  if (!children || !treeItem.hasAttribute("aria-expanded")) return;
  const expanded = treeItem.getAttribute("aria-expanded") !== "true";
  treeItem.setAttribute("aria-expanded", String(expanded));
  children.hidden = !expanded;
  if (expanded && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    children.classList.remove("is-entering");
    void children.offsetWidth;
    children.classList.add("is-entering");
    children.addEventListener("animationend", () => children.classList.remove("is-entering"), { once: true });
  }

  if (!expanded) {
    const tree = treeItem.closest<HTMLElement>(".sample-outline[role='tree']");
    const selected = tree?.querySelector<HTMLElement>("[role='treeitem'][aria-selected='true']");
    if (selected && children.contains(selected)) selectOutlineItem(treeItem, true);
  }
}

function selectOne(container: ParentNode, selector: string, button: HTMLElement, className = "is-current") {
  container.querySelectorAll<HTMLElement>(selector).forEach((item) => {
    const selected = item === button;
    item.classList.toggle(className, selected);
    if (item.hasAttribute("aria-selected")) item.setAttribute("aria-selected", String(selected));
    if (item.hasAttribute("aria-pressed")) item.setAttribute("aria-pressed", String(selected));
    if (item.hasAttribute("aria-current")) {
      if (selected) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    }
    if (item.getAttribute("role") === "tab") item.tabIndex = selected ? 0 : -1;
  });
}

function updateSiteNavIndicator(nav: HTMLElement) {
  const indicator = nav.querySelector<HTMLElement>(".sample-site-nav-indicator");
  const currentLink = nav.querySelector<HTMLAnchorElement>("a[data-action='site-nav'].is-current");
  if (!indicator || !currentLink) return;

  const navBounds = nav.getBoundingClientRect();
  const linkBounds = currentLink.getBoundingClientRect();
  nav.style.setProperty("--site-nav-indicator-x", `${linkBounds.left - navBounds.left}px`);
  nav.style.setProperty("--site-nav-indicator-width", `${linkBounds.width}px`);
  nav.dataset.indicatorReady = "true";
}

function setCalendarOpen(picker: HTMLElement, open: boolean) {
  const calendar = picker.querySelector<HTMLElement>(".sample-calendar");
  const trigger = picker.querySelector<HTMLButtonElement>("[data-action='calendar-toggle']");
  if (!calendar || !trigger) return;

  const closeTimer = calendarCloseTimers.get(calendar);
  if (closeTimer !== undefined) window.clearTimeout(closeTimer);
  calendarCloseTimers.delete(calendar);
  picker.dataset.calendarOpen = String(open);
  trigger.setAttribute("aria-expanded", String(open));

  if (open) {
    calendar.hidden = false;
    calendar.inert = false;
    calendar.removeAttribute("aria-hidden");
    calendar.classList.remove("is-closing");
    calendar.dataset.calendarMotion = "open";
    return;
  }

  calendar.dataset.calendarMotion = "closing";
  calendar.inert = true;
  calendar.setAttribute("aria-hidden", "true");
  if (calendar.hidden) {
    calendar.dataset.calendarMotion = "closed";
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    calendar.hidden = true;
    calendar.inert = false;
    calendar.removeAttribute("aria-hidden");
    calendar.classList.remove("is-closing");
    calendar.dataset.calendarMotion = "closed";
    return;
  }

  calendar.classList.add("is-closing");
  calendarCloseTimers.set(calendar, window.setTimeout(() => {
    if (picker.dataset.calendarOpen === "true") return;
    calendar.hidden = true;
    calendar.inert = false;
    calendar.removeAttribute("aria-hidden");
    calendar.classList.remove("is-closing");
    calendar.dataset.calendarMotion = "closed";
    calendarCloseTimers.delete(calendar);
  }, 150));
}

function animateCalendarGrid(calendar: HTMLElement) {
  const grid = calendar.querySelector<HTMLElement>(".sample-calendar-grid");
  if (!grid || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  grid.classList.remove("is-changing");
  void grid.offsetWidth;
  grid.classList.add("is-changing");
}

function setCalendarMonth(calendar: HTMLElement, offset: number) {
  const date = fromCivilDate(`${calendar.dataset.calendarMonth ?? "2026-09"}-01`);
  if (!Number.isFinite(date.getTime())) return;
  date.setMonth(date.getMonth() + offset);
  calendar.dataset.calendarMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  renderCalendar(calendar);
  animateCalendarGrid(calendar);
}

function selectCalendarDay(sample: HTMLElement, calendar: HTMLElement, dateValue: string) {
  const picker = calendar.closest<HTMLElement>(".sample-date-picker");
  if (!picker) return;
  const start = calendar.dataset.rangeStart;
  const end = calendar.dataset.rangeEnd;
  let message: string;

  if (picker.dataset.calendarMode !== "range") {
    calendar.dataset.rangeStart = dateValue;
    delete calendar.dataset.rangeEnd;
    message = `${formatCalendarDate(dateValue, { dateStyle: "long" })} selected.`;
  } else if (!start || end) {
    calendar.dataset.rangeStart = dateValue;
    delete calendar.dataset.rangeEnd;
    message = `Start date ${formatCalendarDate(dateValue, { dateStyle: "long" })} selected. Choose an end date.`;
  } else if (dateValue < start) {
    calendar.dataset.rangeStart = dateValue;
    delete calendar.dataset.rangeEnd;
    message = `Start date changed to ${formatCalendarDate(dateValue, { dateStyle: "long" })}. Choose an end date.`;
  } else {
    calendar.dataset.rangeEnd = dateValue;
    message = `${formatCalendarDate(start, { dateStyle: "long" })} to ${formatCalendarDate(dateValue, { dateStyle: "long" })} selected.`;
  }

  calendar.dataset.calendarMonth = calendarMonthValue(fromCivilDate(dateValue));
  calendar.dataset.calendarFocusDate = dateValue;
  updateCalendarDisplay(picker);
  renderCalendar(calendar);
  animateCalendarGrid(calendar);
  calendar.querySelector<HTMLButtonElement>(`[data-date='${dateValue}']`)?.focus();
  announce(sample, message);
}

function refreshColorWellIds(well: HTMLElement, instance: string) {
  const palette = well.querySelector<HTMLElement>(".sample-color-popover");
  const colorPanel = well.querySelector<HTMLElement>(".sample-color-panel");
  const paletteTrigger = well.querySelector<HTMLElement>("[data-action='toggle-color-palette']");
  const panelTrigger = well.querySelector<HTMLElement>(".sample-color-panel-trigger");
  const input = well.querySelector<HTMLInputElement>(".sample-color-hex");
  const pickerTrigger = well.querySelector<HTMLElement>(".sample-color-picker-trigger");
  const picker = well.querySelector<HTMLElement>(".sample-color-picker");
  const pickerSurface = well.querySelector<HTMLElement>(".sample-color-picker-surface");
  const pickerHelp = well.querySelector<HTMLElement>(".sample-color-picker-help");
  const label = well.querySelector<HTMLLabelElement>(".sample-color-hex-label");
  const panelTitle = well.querySelector<HTMLElement>(".sample-color-panel-title");
  const help = well.querySelector<HTMLElement>(".sample-color-help");
  const prefix = `color-well-${instance}`;

  if (palette) palette.id = `${prefix}-palette`;
  if (colorPanel) colorPanel.id = `${prefix}-panel`;
  if (picker) picker.id = `${prefix}-picker`;
  if (pickerSurface) {
    pickerSurface.id = `${prefix}-picker-surface`;
    if (pickerHelp) {
      pickerHelp.id = `${prefix}-picker-help`;
      pickerSurface.setAttribute("aria-describedby", pickerHelp.id);
    }
  }
  if (panelTitle) {
    panelTitle.id = `${prefix}-panel-title`;
    colorPanel?.setAttribute("aria-labelledby", panelTitle.id);
  }
  if (paletteTrigger && palette) paletteTrigger.setAttribute("aria-controls", palette.id);
  if (panelTrigger && colorPanel) panelTrigger.setAttribute("aria-controls", colorPanel.id);
  if (pickerTrigger && picker) pickerTrigger.setAttribute("aria-controls", picker.id);
  if (input) {
    input.id = `${prefix}-hex`;
    if (help) {
      help.id = `${prefix}-help`;
      input.setAttribute("aria-describedby", help.id);
    }
    if (label) label.htmlFor = input.id;
  }
  const resizeObserver = new ResizeObserver(() => {
    const openPanel = well.querySelector<HTMLElement>(".sample-color-popover:not([hidden]), .sample-color-panel:not([hidden])");
    if (openPanel && panelTrigger) positionColorWellPanel(well, panelTrigger, openPanel);
    else well.style.removeProperty("--sample-color-panel-space");
  });
  if (palette) resizeObserver.observe(palette);
  if (colorPanel) resizeObserver.observe(colorPanel);
  resizeObserver.observe(well);
}

function closeColorWellPanels(well: HTMLElement) {
  well.style.removeProperty("--sample-color-panel-space");
  well.querySelectorAll<HTMLElement>(".sample-color-popover, .sample-color-panel").forEach((panel) => {
    panel.hidden = true;
    panel.classList.remove("opens-up");
  });
  well.querySelectorAll<HTMLElement>("[data-action='toggle-color-palette'], [data-action='toggle-color-panel']")
    .forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  const picker = well.querySelector<HTMLElement>(".sample-color-picker");
  const pickerTrigger = well.querySelector<HTMLElement>(".sample-color-picker-trigger");
  if (picker) picker.hidden = true;
  pickerTrigger?.setAttribute("aria-expanded", "false");
  const color = well.dataset.color ?? "#0A6CFF";
  const hex = well.querySelector<HTMLInputElement>(".sample-color-hex");
  const error = well.querySelector<HTMLElement>(".sample-color-error");
  if (hex) {
    hex.value = color;
    hex.removeAttribute("aria-invalid");
  }
  syncColorPicker(well, color);
  if (error) error.hidden = true;
}

function positionColorWellPanel(well: HTMLElement, trigger: HTMLElement, panel: HTMLElement) {
  // Specimens reserve space below their anchor so a panel cannot cover the next entry.
  if (well.closest(".element-preview, .element-demo-stage")) {
    panel.classList.remove("opens-up");
    panel.style.maxHeight = `${Math.min(560, window.innerHeight - 48)}px`;
    well.style.setProperty("--sample-color-panel-space", `${Math.ceil(panel.getBoundingClientRect().height) + 12}px`);
    return;
  }
  const triggerBounds = trigger.getBoundingClientRect();
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  const below = viewportHeight - triggerBounds.bottom - 12;
  const above = triggerBounds.top - 12;
  const desiredHeight = Math.min(panel.scrollHeight, 560);
  const opensUp = below < desiredHeight && above > below;
  const availableSpace = opensUp ? above : below;
  const maxHeight = Math.max(120, Math.min(560, availableSpace));
  panel.style.maxHeight = `${maxHeight}px`;
  panel.classList.toggle("opens-up", opensUp);
}

function middleTruncateText(element: HTMLElement, value: string) {
  const availableWidth = element.getBoundingClientRect().width;
  if (availableWidth <= 0) return value;

  const context = document.createElement("canvas").getContext("2d");
  if (!context) return value;
  const style = window.getComputedStyle(element);
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
  const measure = (text: string) => context.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
  if (measure(value) <= availableWidth) return value;

  const extension = value.match(/\.[^.]+$/)?.[0] ?? "";
  const name = extension ? value.slice(0, -extension.length) : value;
  const ellipsis = "…";
  let low = 0;
  let high = name.length;
  let result = `${ellipsis}${extension}`;

  while (low <= high) {
    const kept = Math.floor((low + high) / 2);
    const prefixLength = Math.ceil(kept / 2);
    const suffixLength = Math.floor(kept / 2);
    const prefix = name.slice(0, prefixLength);
    const suffix = suffixLength ? name.slice(-suffixLength) : "";
    const candidate = `${prefix}${ellipsis}${suffix}${extension}`;
    if (measure(candidate) <= availableWidth) {
      result = candidate;
      low = kept + 1;
    } else {
      high = kept - 1;
    }
  }

  return result;
}

function animateTruncationChange(root: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.remove("is-changing");
  void root.offsetWidth;
  root.classList.add("is-changing");
}

const truncationTextAnimations = new WeakMap<HTMLElement, Animation[]>();

function animateTruncationText(root: HTMLElement, expanded: boolean) {
  const paragraphs = Array.from(root.querySelectorAll<HTMLParagraphElement>(".sample-truncation-example p"));
  const startHeights = paragraphs.map((paragraph) => paragraph.getBoundingClientRect().height);
  truncationTextAnimations.get(root)?.forEach((animation) => animation.cancel());
  truncationTextAnimations.delete(root);

  paragraphs.forEach((paragraph, index) => {
    paragraph.style.height = `${startHeights[index]}px`;
    paragraph.style.overflow = "hidden";
  });

  root.dataset.expanded = String(expanded);
  refreshTruncationFilename(root);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || paragraphs.length === 0) {
    paragraphs.forEach((paragraph) => {
      paragraph.style.removeProperty("height");
      paragraph.style.removeProperty("overflow");
    });
    return;
  }

  const targetHeights = paragraphs.map((paragraph) => {
    paragraph.style.height = "auto";
    return paragraph.getBoundingClientRect().height;
  });
  paragraphs.forEach((paragraph, index) => {
    paragraph.style.height = `${startHeights[index]}px`;
  });
  void root.offsetHeight;

  const animations = paragraphs
    .map((paragraph, index) => {
      const startHeight = startHeights[index];
      const targetHeight = targetHeights[index];
      if (startHeight === undefined || targetHeight === undefined) return null;
      if (Math.abs(startHeight - targetHeight) < 0.5) return null;
      return paragraph.animate(
        [{ height: `${startHeight}px` }, { height: `${targetHeight}px` }],
        { duration: 240, delay: index * 18, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
      );
    })
    .filter((animation): animation is Animation => animation !== null);

  if (animations.length === 0) {
    paragraphs.forEach((paragraph) => {
      paragraph.style.removeProperty("height");
      paragraph.style.removeProperty("overflow");
    });
    return;
  }

  truncationTextAnimations.set(root, animations);
  void Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
    if (truncationTextAnimations.get(root) !== animations) return;
    animations.forEach((animation) => animation.cancel());
    paragraphs.forEach((paragraph) => {
      paragraph.style.removeProperty("height");
      paragraph.style.removeProperty("overflow");
    });
    truncationTextAnimations.delete(root);
  });
}

function refreshTruncationFilename(root: HTMLElement) {
  const filename = root.querySelector<HTMLElement>(".sample-truncation-filename");
  const fullText = filename?.dataset.fullText;
  if (!filename || !fullText) return;
  filename.textContent = root.dataset.expanded === "true" ? fullText : middleTruncateText(filename, fullText);
}

window.addEventListener("resize", () => {
  document.querySelectorAll<HTMLElement>(".sample-truncation").forEach(refreshTruncationFilename);
});

function setColorWellValue(well: HTMLElement, color: string, name: string) {
  const normalized = color.toUpperCase();
  const swatch = well.querySelector<HTMLElement>(".sample-color-swatch > span");
  const title = well.querySelector<HTMLElement>(".sample-color-value b");
  const hex = well.querySelector<HTMLElement>(".sample-color-value small");
  const trigger = well.querySelector<HTMLElement>("[data-action='toggle-color-palette']");
  const panelTrigger = well.querySelector<HTMLElement>("[data-action='toggle-color-panel']");
  const input = well.querySelector<HTMLInputElement>(".sample-color-hex");
  const panelName = well.querySelector<HTMLElement>(".sample-color-panel-current b");
  const panelHex = well.querySelector<HTMLElement>(".sample-color-panel-current small");

  well.dataset.color = normalized;
  well.dataset.colorName = name;
  if (swatch) swatch.style.backgroundColor = normalized;
  if (title) title.textContent = name;
  if (hex) hex.textContent = normalized;
  if (trigger) trigger.setAttribute("aria-label", `Open quick color palette. Current color: ${name}, ${normalized}`);
  if (panelTrigger) panelTrigger.setAttribute("aria-label", `Open full color panel. Current color: ${name}, ${normalized}`);
  if (input) {
    input.value = normalized;
    input.removeAttribute("aria-invalid");
  }
  syncColorPicker(well, normalized);
  if (panelName) panelName.textContent = name;
  if (panelHex) panelHex.textContent = normalized;
  well.querySelector<HTMLElement>(".sample-color-error")?.setAttribute("hidden", "");
  well.querySelectorAll<HTMLElement>(".sample-color-grid [role='option']").forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.color?.toUpperCase() === normalized));
  });
}

function hexToHsv(color: string) {
  const value = color.replace(/^#/, "");
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta > 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: (hue + 360) % 360,
    saturation: max === 0 ? 0 : (delta / max) * 100,
    brightness: max * 100,
  };
}

function hsvToHex(hue: number, saturation: number, brightness: number) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, saturation)) / 100;
  const value = Math.min(100, Math.max(0, brightness)) / 100;
  const chroma = value * sat;
  const section = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((section % 2) - 1));
  const [red, green, blue] = section < 1 ? [chroma, secondary, 0]
    : section < 2 ? [secondary, chroma, 0]
      : section < 3 ? [0, chroma, secondary]
        : section < 4 ? [0, secondary, chroma]
          : section < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
  const offset = value - chroma;
  return `#${[red, green, blue].map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function renderColorPickerState(well: HTMLElement, hue: number, saturation: number, brightness: number) {
  const normalizedHue = Math.min(360, Math.max(0, hue));
  const normalizedSaturation = Math.min(100, Math.max(0, saturation));
  const normalizedBrightness = Math.min(100, Math.max(0, brightness));
  const surface = well.querySelector<HTMLElement>(".sample-color-picker-surface");
  const hueInput = well.querySelector<HTMLInputElement>(".sample-color-hue");
  const hueOutput = well.querySelector<HTMLOutputElement>("[data-color-hue-value]");
  const hex = well.querySelector<HTMLInputElement>(".sample-color-hex");
  const pickerSwatch = well.querySelector<HTMLElement>(".sample-color-picker-trigger > span");
  const panelPreview = well.querySelector<HTMLElement>(".sample-color-panel-preview > span");
  const error = well.querySelector<HTMLElement>(".sample-color-error");
  const color = hsvToHex(normalizedHue, normalizedSaturation, normalizedBrightness);

  well.dataset.pickerHue = String(normalizedHue);
  well.dataset.pickerSaturation = String(normalizedSaturation);
  well.dataset.pickerBrightness = String(normalizedBrightness);
  surface?.style.setProperty("--picker-hue", `${normalizedHue}deg`);
  surface?.style.setProperty("--picker-saturation", `${normalizedSaturation}%`);
  surface?.style.setProperty("--picker-brightness", `${normalizedBrightness}%`);
  surface?.setAttribute("aria-valuenow", String(Math.round(normalizedSaturation)));
  surface?.setAttribute("aria-valuetext", `Saturation ${Math.round(normalizedSaturation)}%, brightness ${Math.round(normalizedBrightness)}%`);
  if (hueInput) hueInput.value = String(Math.round(normalizedHue));
  if (hueOutput) hueOutput.value = `${Math.round(normalizedHue)}°`;
  if (hex) {
    hex.value = color;
    hex.removeAttribute("aria-invalid");
  }
  if (pickerSwatch) pickerSwatch.style.backgroundColor = color;
  if (panelPreview) panelPreview.style.backgroundColor = color;
  if (error) error.hidden = true;
}

function syncColorPicker(well: HTMLElement, color: string) {
  if (!/^#[0-9A-F]{6}$/i.test(color)) return;
  const parsed = hexToHsv(color);
  // Keep the chosen hue while brightness or saturation is zero, since gray and black have no hue of their own.
  const hue = parsed.saturation === 0
    ? Number(well.dataset.pickerHue ?? parsed.hue)
    : parsed.hue;
  renderColorPickerState(well, hue, parsed.saturation, parsed.brightness);
}

function updateColorPickerFromPoint(surface: HTMLElement, clientX: number, clientY: number) {
  const well = surface.closest<HTMLElement>(".sample-color-well");
  const editorDemo = surface.closest<HTMLElement>(".sample-editor-colors-demo");
  if (!well && !editorDemo) return;
  const bounds = surface.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return;
  const saturation = ((clientX - bounds.left) / bounds.width) * 100;
  const brightness = (1 - (clientY - bounds.top) / bounds.height) * 100;
  if (editorDemo) {
    updateEditorCustomColorFromPoint(surface, clientX, clientY);
    return;
  }
  if (!well) return;
  renderColorPickerState(
    well,
    Number(well.dataset.pickerHue ?? 220),
    saturation,
    brightness,
  );
}

let activeColorPickerPointer: { surface: HTMLElement; pointerId: number } | null = null;

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const surface = target?.closest<HTMLElement>(".sample-color-picker-surface, .sample-editor-picker-surface");
  if (!surface || event.button !== 0) return;
  event.preventDefault();
  surface.focus({ preventScroll: true });
  activeColorPickerPointer = { surface, pointerId: event.pointerId };
  surface.setPointerCapture?.(event.pointerId);
  updateColorPickerFromPoint(surface, event.clientX, event.clientY);
});

document.addEventListener("pointermove", (event) => {
  if (!activeColorPickerPointer || activeColorPickerPointer.pointerId !== event.pointerId) return;
  updateColorPickerFromPoint(activeColorPickerPointer.surface, event.clientX, event.clientY);
});

for (const eventName of ["pointerup", "pointercancel"] as const) {
  document.addEventListener(eventName, (event) => {
    if (activeColorPickerPointer?.pointerId !== event.pointerId) return;
    const demo = activeColorPickerPointer.surface.closest<HTMLElement>(".sample-editor-colors-demo");
    const color = demo?.querySelector<HTMLElement>("[data-editor-color-value]")?.textContent;
    const status = demo?.querySelector<HTMLElement>(".sample-editor-colors-status");
    if (demo && color && status) status.textContent = `Custom color ${color} selected. The document preview updated; no file was changed.`;
    activeColorPickerPointer = null;
  });
}

const lightboxPhotos = [
  { name: "Dune light", location: "Erg Chebbi · Morocco", alt: "Sunset over golden dunes", scene: "dunes" },
  { name: "Coastal road", location: "Algarve · Portugal", alt: "A quiet road above the blue coast", scene: "coast" },
  { name: "Forest calm", location: "Dolomites · Italy", alt: "Misty pines in the morning", scene: "forest" },
] as const;

type HoverCardState = {
  openTimer?: number;
  closeTimer?: number;
  pointerInside: boolean;
  focusInside: boolean;
  pinned: boolean;
  suppressed: boolean;
  pointerType?: string;
};

const hoverCardStates = new WeakMap<HTMLElement, HoverCardState>();

function hoverCardState(owner: HTMLElement) {
  let state = hoverCardStates.get(owner);
  if (!state) {
    state = { pointerInside: false, focusInside: false, pinned: false, suppressed: false };
    hoverCardStates.set(owner, state);
  }
  return state;
}

function syncHoverCard(owner: HTMLElement, openDelay = 100) {
  const trigger = owner.querySelector<HTMLElement>(".sample-hover-trigger");
  const card = owner.querySelector<HTMLElement>(".sample-hover-card");
  if (!trigger || !card) return;

  const state = hoverCardState(owner);
  const shouldOpen = !state.suppressed && (state.pointerInside || state.focusInside || state.pinned);
  if (shouldOpen) {
    if (state.closeTimer !== undefined) window.clearTimeout(state.closeTimer);
    delete state.closeTimer;
    if (!card.hidden) {
      trigger.setAttribute("aria-expanded", "true");
      card.dataset.state = "open";
      return;
    }
    if (state.openTimer !== undefined) return;
    state.openTimer = window.setTimeout(() => {
      delete state.openTimer;
      if (card.isConnected && !state.suppressed && (state.pointerInside || state.focusInside || state.pinned)) {
        card.hidden = false;
        card.dataset.state = "closed";
        trigger.setAttribute("aria-expanded", "true");
        requestAnimationFrame(() => {
          if (!card.hidden) card.dataset.state = "open";
        });
      }
    }, openDelay);
    return;
  }

  if (state.openTimer !== undefined) window.clearTimeout(state.openTimer);
  delete state.openTimer;
  if (card.hidden || state.closeTimer !== undefined) return;

  trigger.setAttribute("aria-expanded", "false");
  card.dataset.state = "closing";
  state.closeTimer = window.setTimeout(() => {
    delete state.closeTimer;
    if (state.suppressed || (!state.pointerInside && !state.focusInside && !state.pinned)) {
      card.hidden = true;
      card.dataset.state = "closed";
    } else {
      syncHoverCard(owner);
    }
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 210);
}

function dismissHoverCard(owner: HTMLElement) {
  const state = hoverCardState(owner);
  state.suppressed = true;
  state.pinned = false;
  state.pointerInside = false;
  state.focusInside = false;
  syncHoverCard(owner, 0);
}

function initializeHoverCard(sample: HTMLElement) {
  const owner = sample.querySelector<HTMLElement>(".sample-hover");
  const trigger = owner?.querySelector<HTMLElement>(".sample-hover-trigger");
  const card = owner?.querySelector<HTMLElement>(".sample-hover-card");
  const title = owner?.querySelector<HTMLElement>("[data-hover-title]");
  const description = owner?.querySelector<HTMLElement>("[data-hover-description]");
  if (!owner || !trigger || !card) return;
  const id = `sample-hover-card-${sample.dataset.sampleInstance ?? "example"}`;
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  card.id = id;
  if (title) {
    title.id = titleId;
    card.setAttribute("aria-labelledby", titleId);
  }
  if (description) {
    description.id = descriptionId;
    trigger.setAttribute("aria-describedby", descriptionId);
  }
  trigger.setAttribute("aria-controls", id);
  trigger.setAttribute("aria-expanded", "false");
  card.hidden = true;
  card.dataset.state = "closed";
  hoverCardStates.set(owner, { pointerInside: false, focusInside: false, pinned: false, suppressed: false });
}

const lightboxDialogOwners = new WeakMap<HTMLDialogElement, HTMLElement>();
const lightboxDialogPlaceholders = new WeakMap<HTMLDialogElement, Comment>();
const lightboxImageTransitionTimers = new WeakMap<HTMLElement, number>();
const initializedLightboxDialogs = new WeakSet<HTMLDialogElement>();

function lightboxRootFor(element: Element) {
  const dialog = element.closest<HTMLDialogElement>(".sample-lightbox-dialog");
  return dialog
    ? lightboxDialogOwners.get(dialog) ?? dialog.closest<HTMLElement>(".sample-lightbox")
    : element.closest<HTMLElement>(".sample-lightbox");
}

function prepareLightboxSample(root: HTMLElement) {
  const viewer = root.querySelector<HTMLDialogElement>(".sample-lightbox-dialog");
  if (!viewer) return;
  lightboxDialogOwners.set(viewer, root);
  if (initializedLightboxDialogs.has(viewer)) return;
  initializedLightboxDialogs.add(viewer);
  viewer.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox(viewer);
  });
}

function portalLightboxDialog(root: HTMLElement, viewer: HTMLDialogElement) {
  lightboxDialogOwners.set(viewer, root);
  if (!root.closest(".element-demo-dialog[open]") || viewer.parentElement === document.body) return;
  const placeholder = document.createComment("Lightbox viewer position");
  viewer.before(placeholder);
  lightboxDialogPlaceholders.set(viewer, placeholder);
  document.body.append(viewer);
}

function restoreLightboxDialog(viewer: HTMLDialogElement) {
  const placeholder = lightboxDialogPlaceholders.get(viewer);
  if (placeholder?.parentNode) placeholder.replaceWith(viewer);
  lightboxDialogPlaceholders.delete(viewer);
}

function clearLightboxImageTransition(image: HTMLElement) {
  const timer = lightboxImageTransitionTimers.get(image);
  if (timer !== undefined) window.clearTimeout(timer);
  image.parentElement?.querySelectorAll<HTMLElement>(".sample-lightbox-image-outgoing").forEach((outgoing) => outgoing.remove());
  image.classList.remove("is-entering");
  lightboxImageTransitionTimers.delete(image);
}

function transitionLightboxImage(image: HTMLElement, nextClassName: string) {
  clearLightboxImageTransition(image);
  const outgoing = image.cloneNode(false) as HTMLElement;
  outgoing.removeAttribute("data-lightbox-art");
  outgoing.removeAttribute("aria-label");
  outgoing.removeAttribute("role");
  outgoing.setAttribute("aria-hidden", "true");
  outgoing.classList.add("sample-lightbox-image-outgoing");
  image.before(outgoing);

  image.className = nextClassName;
  void image.offsetWidth;
  image.classList.add("is-entering");

  const finish = () => {
    if (!outgoing.isConnected) return;
    const timer = lightboxImageTransitionTimers.get(image);
    if (timer !== undefined) window.clearTimeout(timer);
    outgoing.remove();
    image.classList.remove("is-entering");
    lightboxImageTransitionTimers.delete(image);
  };
  outgoing.addEventListener("animationend", finish, { once: true });
  outgoing.addEventListener("animationcancel", finish, { once: true });
  lightboxImageTransitionTimers.set(image, window.setTimeout(finish, 360));
}

function updateLightbox(root: HTMLElement, index: number, viewer = root.querySelector<HTMLDialogElement>(".sample-lightbox-dialog")) {
  const photoIndex = (index + lightboxPhotos.length) % lightboxPhotos.length;
  const photo = lightboxPhotos[photoIndex];
  if (!photo) return;

  const previousPhotoIndex = Number(root.dataset.lightboxIndex ?? photoIndex);
  const animateImage = Boolean(
    viewer?.open
    && previousPhotoIndex !== photoIndex
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  root.dataset.lightboxIndex = String(photoIndex);
  const image = viewer?.querySelector<HTMLElement>("[data-lightbox-art]");
  if (image) {
    const nextClassName = `sample-lightbox-art sample-lightbox-art--${photo.scene} sample-lightbox-hero`;
    if (animateImage) transitionLightboxImage(image, nextClassName);
    else {
      clearLightboxImageTransition(image);
      image.className = nextClassName;
    }
    image.setAttribute("aria-label", photo.alt);
  }
  const title = viewer?.querySelector<HTMLElement>("[data-lightbox-title]");
  const location = viewer?.querySelector<HTMLElement>("[data-lightbox-location]");
  const count = viewer?.querySelector<HTMLElement>("[data-lightbox-count]");
  if (title) title.textContent = photo.name;
  if (location) location.textContent = photo.location;
  if (count) count.textContent = `${String(photoIndex + 1).padStart(2, "0")} / ${String(lightboxPhotos.length).padStart(2, "0")}`;
  viewer?.querySelectorAll<HTMLButtonElement>("[data-action='lightbox-select']").forEach((thumbnail, thumbnailIndex) => {
    thumbnail.setAttribute("aria-pressed", String(thumbnailIndex === photoIndex));
  });
}

function closeLightbox(dialog: HTMLDialogElement) {
  const root = lightboxDialogOwners.get(dialog) ?? dialog.closest<HTMLElement>(".sample-lightbox");
  const index = root?.dataset.lightboxIndex ?? "0";
  if (dialog.open) dialog.close();
  restoreLightboxDialog(dialog);
  root?.querySelector<HTMLButtonElement>(`[data-action='toggle-lightbox'][data-lightbox-index='${index}']`)?.focus();
}

const springReferenceTravel = 128;

function updateSpringAnimationDurations(demo: HTMLElement) {
  const track = demo.querySelector<HTMLElement>(".sample-spring-motion-spring")?.closest<HTMLElement>(".sample-spring-track");
  if (!track) return;

  const travelDistance = track.getBoundingClientRect().width * 0.68;
  if (travelDistance <= 0) return;

  const scale = travelDistance / springReferenceTravel;
  demo.style.setProperty("--sample-spring-ease-duration", `${900 * scale}ms`);
  demo.style.setProperty("--sample-spring-duration", `${1300 * scale}ms`);
}

function initializeSpringMotion(demo: HTMLElement) {
  updateSpringAnimationDurations(demo);
  demo.classList.add("is-playing");

  const track = demo.querySelector<HTMLElement>(".sample-spring-track");
  if (!track || typeof ResizeObserver === "undefined") return;

  const observer = new ResizeObserver(() => {
    const isRunning = Array.from(demo.querySelectorAll<HTMLElement>(".sample-spring-motion"))
      .some((mover) => mover.getAnimations().some((animation) => animation.playState === "running"));
    if (!isRunning) updateSpringAnimationDurations(demo);
  });
  observer.observe(track);
}

function runAction(sample: HTMLElement, button: HTMLElement, event?: MouseEvent) {
  const action = button.dataset.action;
  const id = sample.dataset.specimenId;

  switch (action) {
    case "source-sidebar-toggle": {
      const demo = button.closest<HTMLElement>(".sample-sidebar-demo");
      if (!demo) break;
      const collapsed = demo.dataset.sidebarCollapsed !== "true";
      demo.dataset.sidebarCollapsed = String(collapsed);
      button.setAttribute("aria-expanded", String(!collapsed));
      button.setAttribute("aria-label", collapsed ? "Show sidebar" : "Hide sidebar");
      announce(sample, collapsed ? "Sidebar collapsed." : "Sidebar expanded.");
      break;
    }
    case "editor-panel-toggle": {
      const demo = button.closest<HTMLElement>(".sample-editor-colors-demo");
      if (demo) setEditorColorsPanelOpen(demo, demo.dataset.panelOpen !== "true");
      break;
    }
    case "editor-custom-toggle": {
      const demo = button.closest<HTMLElement>(".sample-editor-colors-demo");
      if (demo) setEditorCustomColorPickerOpen(demo, demo.dataset.editorCustomPickerOpen !== "true");
      break;
    }
    case "editor-custom-apply": {
      const demo = button.closest<HTMLElement>(".sample-editor-colors-demo");
      const input = demo?.querySelector<HTMLInputElement>("[data-input-action='editor-custom-hex']");
      const error = demo?.querySelector<HTMLElement>("[data-editor-color-error]");
      if (!demo || !input || !error) break;
      const rawValue = input.value.trim();
      const value = (rawValue.startsWith("#") ? rawValue : `#${rawValue}`).toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(value)) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = "Enter a valid six-digit HEX value, such as #295B9C.";
        error.hidden = false;
        input.focus();
        break;
      }
      demo.querySelectorAll<HTMLInputElement>("[data-input-action='editor-color']").forEach((option) => { option.checked = false; });
      updateEditorDocumentColor(demo, value, "Custom color");
      announce(sample, `Custom color ${value} applied to the document preview.`);
      break;
    }
    case "editor-panel-close": {
      const demo = button.closest<HTMLElement>(".sample-editor-colors-demo");
      if (demo) setEditorColorsPanelOpen(demo, false, true);
      break;
    }
    case "editor-panel-style": {
      const demo = button.closest<HTMLElement>(".sample-editor-colors-demo");
      const style = button.dataset.panelStyle;
      if (!demo || (style !== "utility" && style !== "hud")) break;
      demo.dataset.panelStyle = style;
      demo.querySelectorAll<HTMLButtonElement>("[data-action='editor-panel-style']").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      const status = demo.querySelector<HTMLElement>(".sample-editor-colors-status");
      if (status) status.textContent = style === "hud"
        ? "Light HUD glass appearance selected. The site preview remains in light mode."
        : "Utility panel appearance selected.";
      break;
    }
    case "editor-panel-activity": {
      const demo = button.closest<HTMLElement>(".sample-editor-colors-demo");
      if (!demo) break;
      const active = demo.dataset.editorActive !== "false";
      demo.dataset.editorActive = String(!active);
      button.textContent = active ? "Return to editor" : "Switch app";
      updateEditorColorsPanelVisibility(demo);
      const status = demo.querySelector<HTMLElement>(".sample-editor-colors-status");
      if (status) status.textContent = active
        ? (demo.querySelector<HTMLInputElement>("[data-input-action='editor-hide-inactive']")?.checked
          ? "Editor inactive. Hide-on-deactivate is on, so the panel is hidden until you return."
          : "Editor inactive. The panel remains above the document because hide-on-deactivate is off.")
        : "Editor active again. Its open Colors panel returned above the document.";
      break;
    }
    case "inspector-toggle": {
      const workspace = button.closest<HTMLElement>("[data-inspector-workspace]");
      if (workspace) setInspectorOpen(workspace, workspace.dataset.inspectorOpen !== "true", button);
      break;
    }
    case "inspector-section-toggle": {
      const section = button.closest<HTMLElement>(".sample-inspector-section");
      const content = section?.querySelector<HTMLElement>("[data-inspector-section]");
      if (!content) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      content.classList.toggle("is-collapsed", !expanded);
      content.inert = !expanded;
      content.setAttribute("aria-hidden", String(!expanded));
      break;
    }
    case "inspector-select": {
      const workspace = button.closest<HTMLElement>("[data-inspector-workspace]");
      if (!workspace || !(button instanceof HTMLButtonElement)) break;
      workspace.querySelectorAll<HTMLButtonElement>("[data-action='inspector-select']").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      syncInspectorSelection(workspace, button);
      break;
    }
    case "focus-ring-save": {
      const status = sample.querySelector<HTMLElement>(".sample-focus-status");
      if (status) status.textContent = "Saved in this preview. No workspace changes were made.";
      break;
    }
    case "context-menu-toggle": {
      const demo = button.closest<HTMLElement>(".sample-context-demo");
      const menu = demo?.querySelector<HTMLElement>(".sample-context-menu");
      if (!demo || !menu) break;
      if (!menu.hidden) closeContextMenu(demo);
      else openContextMenu(demo, button);
      break;
    }
    case "context-submenu-toggle": {
      const demo = button.closest<HTMLElement>(".sample-context-demo");
      if (!demo) break;
      setContextSubmenuOpen(demo, button, true, true);
      break;
    }
    case "context-command": {
      const demo = button.closest<HTMLElement>(".sample-context-demo");
      const command = button.dataset.menuCommand ?? button.textContent?.trim() ?? "Command";
      if (demo) closeContextMenu(demo, true);
      announce(sample, `${command} selected for Brand assets. This preview does not change files.`);
      break;
    }
    case "loading-motion-toggle": {
      const demo = button.closest<HTMLElement>(".sample-loading-demo");
      const status = demo?.querySelector<HTMLElement>("[data-loading-status]");
      if (!demo || !status) break;
      const shouldPlay = demo.dataset.motionPaused === "true";
      demo.dataset.motionPaused = String(!shouldPlay);
      if (shouldPlay) demo.dataset.motionOptIn = "true";
      button.setAttribute("aria-pressed", String(shouldPlay));
      button.textContent = shouldPlay ? "Pause animation" : "Play animation";
      status.textContent = shouldPlay
        ? "The skeleton shimmer and spinner are moving. Pause motion to inspect them."
        : "Animations are paused. Choose Play animation to resume.";
      break;
    }
    case "loading-completion-toggle": {
      const demo = button.closest<HTMLElement>(".sample-loading-demo");
      const status = demo?.querySelector<HTMLElement>("[data-loading-status]");
      if (!demo || !status) break;
      const complete = demo.dataset.loadingComplete !== "true";
      setLoadingDemoComplete(demo, complete);
      status.textContent = complete
        ? "Loading complete. The project preview and analytics are ready."
        : "Loading restarted. The project preview skeleton and analytics spinner are active.";
      break;
    }
    case "progress-toggle":
      progressDemoControllers.get(sample)?.toggle();
      break;
    case "progress-reset":
      progressDemoControllers.get(sample)?.reset();
      break;
    case "move-task": {
      const task = button.closest<HTMLElement>(".sample-task-card");
      const board = button.closest<HTMLElement>(".sample-kanban");
      const sourceColumn = task?.closest<HTMLElement>(".sample-kanban-column");
      const destination = board && sourceColumn
        ? Array.from(board.querySelectorAll<HTMLElement>(".sample-kanban-column"))
          .find((column) => column !== sourceColumn)?.querySelector<HTMLElement>(".sample-kanban-list")
        : null;
      if (task && destination) moveTask(task, destination, null, sample);
      break;
    }
    case "search-recent-toggle": {
      const menu = button.closest<HTMLElement>(".sample-search-demo")?.querySelector<HTMLElement>(".sample-search-recents");
      if (!menu) break;
      setSearchRecentsOpen(sample, Boolean(menu.hidden), event?.detail === 0);
      break;
    }
    case "search-recent": {
      const input = sample.querySelector<HTMLInputElement>(".sample-search-input");
      const query = button.dataset.searchQuery;
      if (!input || !query) break;
      input.value = query;
      updateSearchField(sample);
      setSearchRecentsOpen(sample, false);
      input.focus({ preventScroll: true });
      break;
    }
    case "search-clear": {
      const input = sample.querySelector<HTMLInputElement>(".sample-search-input");
      if (!input) break;
      input.value = "";
      updateSearchField(sample);
      input.focus({ preventScroll: true });
      break;
    }
    case "search-clear-recents": {
      const list = sample.querySelector<HTMLElement>("[data-search-recent-list]");
      if (!list) break;
      list.replaceChildren();
      refreshSearchRecents(sample);
      const status = sample.querySelector<HTMLElement>("[data-search-status]");
      if (status) status.textContent = "Recent searches cleared.";
      break;
    }
    case "save-disclosure": {
      const browser = sample.querySelector<HTMLElement>("[data-save-browser]");
      const disclosure = sample.querySelector<HTMLButtonElement>("[data-action='save-disclosure']");
      if (!browser || !disclosure) break;
      closeSavePanelMenus(sample);
      browser.hidden = !browser.hidden;
      const expanded = !browser.hidden;
      disclosure.setAttribute("aria-expanded", String(expanded));
      const label = disclosure.querySelector<HTMLElement>("[data-save-disclosure-label]");
      const icon = disclosure.querySelector<HTMLElement>(".ui-icon");
      if (label) label.textContent = expanded ? "Hide Browser" : "Show Browser";
      if (icon) {
        icon.dataset.lucide = expanded ? "chevron-up" : "chevron-down";
        renderIcons(disclosure);
      }
      announce(sample, expanded ? "Folder browser expanded." : "Folder browser collapsed.");
      if (expanded && event?.detail === 0) {
        sample.querySelector<HTMLButtonElement>("[data-action='save-browser-location'][aria-current]")?.focus({ preventScroll: true });
      }
      break;
    }
    case "save-location-toggle":
    case "save-format-toggle": {
      const isLocation = action === "save-location-toggle";
      const menu = sample.querySelector<HTMLElement>(isLocation ? "[data-save-location-menu]" : "[data-save-format-menu]");
      if (!menu) break;
      const shouldOpen = menu.hidden;
      closeSavePanelMenus(sample);
      menu.hidden = !shouldOpen;
      button.setAttribute("aria-expanded", String(shouldOpen));
      if (shouldOpen && event?.detail === 0) {
        menu.querySelector<HTMLButtonElement>("[role='menuitemradio']")?.focus({ preventScroll: true });
      }
      break;
    }
    case "save-location":
    case "save-browser-location": {
      const location = button.dataset.location;
      if (!location || !savePanelContents[location]) break;
      sample.dataset.saveLocation = location;
      if (action === "save-location") {
        closeSavePanelMenus(sample);
        sample.querySelector<HTMLButtonElement>("[data-action='save-location-toggle']")?.focus({ preventScroll: true });
      }
      updateSavePanel(sample, `${location} selected as the save location.`);
      break;
    }
    case "save-format": {
      const format = button.dataset.format;
      const formatDefinition = format ? savePanelFormats[format] : undefined;
      const nameInput = sample.querySelector<HTMLInputElement>("[data-input-action='save-name']");
      if (!format || !formatDefinition || !nameInput) break;
      sample.dataset.saveFormat = format;
      if (nameInput.value.trim()) {
        const baseName = nameInput.value.trim().replace(/\.[^./\\]+$/, "");
        nameInput.value = `${baseName || "Untitled"}${formatDefinition.extension}`;
      }
      closeSavePanelMenus(sample);
      updateSavePanel(sample, `${formatDefinition.label} selected.`);
      sample.querySelector<HTMLButtonElement>("[data-action='save-format-toggle']")?.focus({ preventScroll: true });
      break;
    }
    case "save-reopen": {
      const panel = sample.querySelector<HTMLElement>(".sample-save-panel");
      const feedback = sample.querySelector<HTMLElement>(".sample-save-feedback");
      const reopen = sample.querySelector<HTMLButtonElement>("[data-action='save-reopen']");
      if (panel) panel.hidden = false;
      if (feedback) feedback.hidden = true;
      if (reopen) reopen.hidden = true;
      sample.querySelector<HTMLInputElement>("[data-input-action='save-name']")?.focus({ preventScroll: true });
      break;
    }
    case "combo-primary": {
      const group = button.closest<HTMLElement>(".sample-combo-button");
      const menu = group?.querySelector<HTMLElement>(".sample-combo-menu");
      const trigger = group?.querySelector<HTMLElement>("[aria-haspopup='menu']");
      const feedback = sample.querySelector<HTMLElement>(".sample-combo-feedback");
      if (menu) {
        menu.dataset.open = "false";
        setComboMenuOpen(menu, false);
      }
      trigger?.setAttribute("aria-expanded", "false");
      if (feedback) {
        feedback.textContent = "Saved.";
        feedback.hidden = false;
        feedback.focus();
      }
      announce(sample, "Saved.");
      break;
    }
    case "level-rating": {
      selectLevelRating(button);
      const group = button.closest<HTMLElement>(".sample-level-rating-group");
      const value = button.dataset.value ?? "0";
      const count = group?.querySelectorAll("[role='radio']").length ?? 0;
      announce(sample, `Rating set to ${value} of ${count} stars.`);
      break;
    }
    case "column-select": {
      selectColumnBrowserItem(button);
      break;
    }
    case "toggle-marquee": {
      const marquee = button.closest<HTMLElement>(".sample-marquee");
      if (!marquee) break;
      const paused = marquee.classList.toggle("is-paused");
      button.setAttribute("aria-pressed", String(paused));
      button.setAttribute("aria-label", paused ? "Resume marquee motion" : "Pause marquee motion");
      button.textContent = paused ? "Resume motion" : "Pause motion";
      break;
    }
    case "cursor-category": {
      const demo = button.closest<HTMLElement>(".sample-cursor");
      const category = button.dataset.cursorCategory;
      if (!demo || !category) break;
      demo.dataset.cursorCategory = category;
      demo.querySelectorAll<HTMLButtonElement>("[data-action='cursor-category']").forEach((tab) => {
        tab.setAttribute("aria-pressed", String(tab === button));
      });
      demo.querySelectorAll<HTMLElement>("[data-cursor-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.cursorPanel !== category;
      });
      break;
    }
    case "cursor-activate": {
      const selected = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(selected));
      break;
    }
    case "cursor-select-target": {
      const selected = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(selected));
      break;
    }
    case "cursor-zoom": {
      const tile = button.closest<HTMLElement>(".sample-cursor-zoom-tile");
      const target = tile?.querySelector<HTMLElement>("[data-cursor-zoom-target]");
      const output = tile?.querySelector<HTMLOutputElement>("[data-cursor-zoom-output]");
      if (!tile || !target) break;
      const currentScale = Number(tile.dataset.zoomScale ?? 1);
      const delta = Number(button.dataset.zoomDelta ?? 0);
      const nextScale = Math.min(1.45, Math.max(0.7, currentScale + delta));
      tile.dataset.zoomScale = String(nextScale);
      target.style.transform = `scale(${nextScale})`;
      if (output) output.value = `${Math.round(nextScale * 100)}%`;
      break;
    }
    case "select-nav":
      {
        const nav = button.closest<HTMLElement>(".sample-bottom-nav");
        const demo = nav?.closest<HTMLElement>(".sample-bottom-nav-demo");
        const destination = button.dataset.navDestination;
        const panel = destination
          ? demo?.querySelector<HTMLElement>(`[data-nav-panel="${destination}"]`)
          : null;
        if (!nav || !demo || !destination || !panel) break;
        event?.preventDefault();
        if (nav.dataset.activeDestination === destination) break;
        nav.querySelectorAll<HTMLAnchorElement>(".sample-nav-item").forEach((link) => {
          const selected = link === button;
          link.classList.toggle("is-current", selected);
          if (selected) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
        panel.hidden = false;
        panel.classList.remove("is-entering");
        void panel.offsetWidth;
        panel.classList.add("is-entering");
        demo.querySelectorAll<HTMLElement>("[data-nav-panel]").forEach((item) => {
          item.hidden = item !== panel;
        });
        nav.dataset.activeDestination = destination;
        announce(sample, `${panel.querySelector("[data-nav-panel-title]")?.textContent?.trim()} section.`);
      }
      break;
    case "nav-drawer-toggle": {
      const demo = button.closest<HTMLElement>(".sample-navigation-demo");
      if (!demo) break;
      if (demo.dataset.drawerOpen === "true") closeNavigationDrawer(demo);
      else openNavigationDrawer(demo);
      break;
    }
    case "nav-drawer-dismiss": {
      const demo = button.closest<HTMLElement>(".sample-navigation-demo");
      if (demo) closeNavigationDrawer(demo);
      break;
    }
    case "nav-drawer-destination": {
      const demo = button.closest<HTMLElement>(".sample-navigation-demo");
      const destination = button.dataset.destination;
      const label = button.querySelector("span")?.textContent?.trim();
      const title = demo?.querySelector<HTMLElement>("[data-navigation-title]");
      const summary = demo?.querySelector<HTMLElement>("[data-navigation-summary]");
      if (!demo || !destination || !label || !title || !summary) break;
      event?.preventDefault();
      const summaries: Record<string, string> = {
        overview: "Keep the work moving with a clear view of your projects and updates.",
        projects: "Review the projects your team is moving forward this week.",
        resources: "Find shared files, references, and useful team material.",
        settings: "Adjust the preferences for your workspace and team.",
      };
      demo.querySelectorAll<HTMLAnchorElement>(".sample-navigation-link").forEach((link) => {
        const selected = link === button;
        link.classList.toggle("is-current", selected);
        if (selected) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      title.textContent = label;
      summary.textContent = summaries[destination] ?? `Open the ${label.toLocaleLowerCase()} workspace section.`;
      announce(sample, `${label} opened.`);
      closeNavigationDrawer(demo);
      break;
    }
    case "table-sort": {
      const table = button.closest<HTMLElement>(".sample-data-table");
      const key = button.dataset.sortKey;
      if (!table || !key) break;
      const direction = table.dataset.sortKey === key && table.dataset.sortDirection === "ascending"
        ? "descending"
        : "ascending";
      table.dataset.sortKey = key;
      table.dataset.sortDirection = direction;
      renderDataTable(table, true);
      announce(sample, `Sorted by ${button.textContent?.trim() ?? key}, ${direction}.`);
      break;
    }
    case "presence-set": {
      const presence = button.closest<HTMLElement>(".sample-status");
      const statusCopy = {
        available: { live: "Live now", label: "Available", meta: "Last active now", feedback: "Ava Reyes is available." },
        away: { live: "Away", label: "Away", meta: "Last active 12 minutes ago", feedback: "Ava Reyes is away." },
        busy: { live: "In a call", label: "Busy", meta: "Available for messages", feedback: "Ava Reyes is busy and available for messages." },
        offline: { live: "Offline", label: "Offline", meta: "Last active 2 hours ago", feedback: "Ava Reyes is offline." },
      } as const;
      const status = button.dataset.status as keyof typeof statusCopy | undefined;
      const copy = status ? statusCopy[status] : undefined;
      if (!presence || !status || !copy) break;
      const changed = presence.dataset.presenceState !== status;
      if (changed) {
        presence.classList.remove("is-changing");
        void presence.offsetWidth;
      }
      presence.dataset.presenceState = status;
      if (changed) presence.classList.add("is-changing");
      presence.querySelectorAll<HTMLButtonElement>("button[data-action='presence-set']").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      const live = presence.querySelector<HTMLElement>("[data-presence-live]");
      const label = presence.querySelector<HTMLElement>("[data-presence-label]");
      const meta = presence.querySelector<HTMLElement>("[data-presence-meta]");
      const feedback = presence.querySelector<HTMLElement>("[data-presence-feedback]");
      if (live) live.textContent = copy.live;
      if (label) label.textContent = copy.label;
      if (meta) meta.textContent = copy.meta;
      if (feedback) feedback.textContent = copy.feedback;
      break;
    }
    case "chat-mark-read": {
      const status = button.closest<HTMLElement>(".sample-chat")?.querySelector<HTMLElement>("[data-chat-status]");
      if (!status || button.getAttribute("aria-pressed") === "true") break;
      status.textContent = "Read";
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Read by Sam Kim: Yes! Booking the room now.");
      break;
    }
    case "avatar-group-toggle":
      updateAvatarGroupSample(sample);
      break;
    case "truncation-width": {
      const truncation = button.closest<HTMLElement>(".sample-truncation");
      const width = button.dataset.width;
      if (!truncation || (width !== "narrow" && width !== "wide")) break;
      if (truncation.dataset.width !== width) animateTruncationChange(truncation);
      truncation.dataset.width = width;
      truncation.querySelectorAll<HTMLButtonElement>("[data-action='truncation-width']").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      refreshTruncationFilename(truncation);
      const status = truncation.querySelector<HTMLElement>(".sample-truncation-status");
      if (status) status.textContent = `${width === "narrow" ? "Narrow" : "Wide"} container. Full text stays available to assistive technology.`;
      break;
    }
    case "truncation-expand": {
      const truncation = button.closest<HTMLElement>(".sample-truncation");
      if (!truncation) break;
      const expanded = truncation.dataset.expanded !== "true";
      animateTruncationChange(truncation);
      animateTruncationText(truncation, expanded);
      button.setAttribute("aria-pressed", String(expanded));
      button.textContent = expanded ? "Show truncation" : "Show full text";
      const status = truncation.querySelector<HTMLElement>(".sample-truncation-status");
      if (status) status.textContent = expanded
        ? "Full text shown for every example."
        : `${truncation.dataset.width === "wide" ? "Wide" : "Narrow"} container. Full text stays available to assistive technology.`;
      break;
    }
    case "timeline-complete": {
      const item = button.closest<HTMLElement>(".sample-timeline-item");
      if (!item) break;
      const delivered = button.getAttribute("aria-pressed") !== "true";
      item.classList.toggle("is-current", !delivered);
      item.classList.toggle("is-complete", delivered);
      button.setAttribute("aria-pressed", String(delivered));
      button.setAttribute("aria-label", delivered ? "Restore order #4821 to in transit" : "Mark order #4821 as delivered");
      const title = item.querySelector<HTMLElement>("[data-timeline-title]");
      const detail = item.querySelector<HTMLElement>("[data-timeline-detail]");
      const status = sample.querySelector<HTMLElement>("[data-timeline-status]");
      const hint = sample.querySelector<HTMLElement>(".sample-timeline-hint");
      if (title) title.textContent = delivered ? "Delivered" : "Out for delivery";
      if (detail) detail.textContent = delivered ? "The package arrived at your address." : "Arriving by 6 pm";
      if (status) status.textContent = delivered ? "Delivered" : "Out for delivery";
      if (hint) hint.textContent = delivered
        ? "Order delivered. Select the marker to restore the previous status."
        : "Select the open marker to finish delivery.";
      announce(sample, delivered ? "Order #4821 marked as delivered." : "Order #4821 restored to out for delivery.");
      break;
    }
    case "steps-select": {
      const demo = button.closest<HTMLElement>(".sample-steps-demo");
      const targetIndex = Number(button.dataset.stepIndex);
      const currentIndex = Number(demo?.dataset.currentStep ?? "0");
      const stepCount = demo?.querySelectorAll(".sample-steps > li").length ?? 0;
      if (!demo || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= stepCount || targetIndex > currentIndex + 1) break;
      if (targetIndex === currentIndex) break;
      updateStepsSample(sample, targetIndex);
      const status = demo.querySelector<HTMLElement>(".sample-steps-status");
      status?.classList.remove("is-changing");
      if (status) {
        void status.offsetWidth;
        status.classList.add("is-changing");
      }
      break;
    }
    case "table-page-prev":
    case "table-page-next": {
      const table = button.closest<HTMLElement>(".sample-data-table");
      if (!table) break;
      const pageCount = Math.max(1, Math.ceil(table.querySelectorAll("tbody tr[data-row-id]").length / Number(table.dataset.pageSize ?? "5")));
      const offset = action === "table-page-prev" ? -1 : 1;
      table.dataset.page = String(Math.max(1, Math.min(pageCount, Number(table.dataset.page ?? "1") + offset)));
      renderDataTable(table, true);
      announce(sample, table.querySelector<HTMLElement>("[data-table-page]")?.textContent ?? "Page updated.");
      break;
    }
    case "site-nav": {
      event?.preventDefault();
      const nav = button.closest<HTMLElement>(".sample-site-header")?.querySelector<HTMLElement>("nav");
      if (nav) {
        const links = nav.querySelectorAll<HTMLAnchorElement>("a[data-action='site-nav']");
        selectOne(nav, "a[data-action='site-nav']", button);
        links.forEach((link) => {
          if (link === button) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
        updateSiteNavIndicator(nav);
      }
      break;
    }
    case "site-cta": {
      let feedback = sample.querySelector<HTMLElement>(".sample-site-feedback");
      if (!feedback) {
        feedback = document.createElement("span");
        feedback.className = "sample-site-feedback";
        feedback.setAttribute("role", "status");
        sample.append(feedback);
      }
      feedback.textContent = "Project inquiry selected.";
      feedback.classList.remove("is-arriving");
      void feedback.offsetWidth;
      feedback.classList.add("is-arriving");
      break;
    }
    case "share-card-read": {
      const status = sample.querySelector<HTMLElement>(".sample-share-status");
      if (status) status.textContent = "Story preview selected.";
      break;
    }
    case "share-card-share": {
      const status = sample.querySelector<HTMLElement>(".sample-share-status");
      if (status) status.textContent = "Share action selected.";
      break;
    }
    case "pagination-page-select": {
      const owner = button.closest<HTMLElement>(".sample-pagination-demo");
      if (owner) changePaginationPage(owner, Number(button.dataset.page));
      break;
    }
    case "pagination-previous":
    case "pagination-next": {
      const owner = button.closest<HTMLElement>(".sample-pagination-demo");
      if (!owner) break;
      const current = Number(owner.dataset.currentPage) || 1;
      changePaginationPage(owner, current + (action === "pagination-previous" ? -1 : 1));
      break;
    }
    case "pagination-slide": {
      const owner = button.closest<HTMLElement>(".sample-pagination-demo");
      if (owner) setPaginationSlide(owner, Number(button.dataset.slide), true);
      break;
    }
    case "calendar-toggle": {
      const picker = button.closest<HTMLElement>(".sample-date-picker");
      const calendar = picker?.querySelector<HTMLElement>(".sample-calendar");
      if (!picker || !calendar) break;
      const open = picker.dataset.calendarOpen !== "true";
      setCalendarOpen(picker, open);
      if (open) calendar.querySelector<HTMLButtonElement>(".sample-calendar-grid [tabindex='0']")?.focus();
      announce(sample, open ? "Calendar opened." : "Calendar closed.");
      break;
    }
    case "calendar-prev":
      if (button.closest(".sample-calendar")) setCalendarMonth(button.closest<HTMLElement>(".sample-calendar")!, -1);
      break;
    case "calendar-next":
      if (button.closest(".sample-calendar")) setCalendarMonth(button.closest<HTMLElement>(".sample-calendar")!, 1);
      break;
    case "calendar-day": {
      const calendar = button.closest<HTMLElement>(".sample-calendar");
      if (!calendar || !button.dataset.date) break;
      selectCalendarDay(sample, calendar, button.dataset.date);
      break;
    }
    case "carousel-slide": {
      const demo = button.closest<HTMLElement>(".sample-carousel-demo");
      if (!demo) break;
      setCarouselSlide(sample, demo, Number(button.dataset.index));
      break;
    }
    case "carousel-prev":
    case "carousel-next": {
      const demo = button.closest<HTMLElement>(".sample-carousel-demo");
      if (!demo) break;
      const active = Number(demo.dataset.currentSlide ?? "0");
      setCarouselSlide(sample, demo, active + (action === "carousel-next" ? 1 : -1));
      break;
    }
    case "replay-spring": {
      const demo = button.closest<HTMLElement>(".sample-spring");
      if (!demo) break;
      const movers = demo.querySelectorAll<HTMLElement>(".sample-spring-motion");
      demo.classList.remove("is-playing");
      movers.forEach((mover) => { mover.style.removeProperty("transform"); });
      updateSpringAnimationDurations(demo);
      if (reducedMotionPreference.matches) {
        movers.forEach((mover) => { mover.style.transform = "translateX(100%)"; });
        break;
      }
      void demo.offsetWidth;
      demo.classList.add("is-playing");
      break;
    }
    case "replay-easing": {
      const demo = button.closest<HTMLElement>(".sample-easing");
      if (!demo) break;
      const movers = demo.querySelectorAll<HTMLElement>(".sample-easing-motion");
      demo.classList.remove("is-playing");
      movers.forEach((mover) => { mover.style.transform = reducedMotionPreference.matches ? "translateX(100%)" : "translateX(0)"; });
      if (reducedMotionPreference.matches) break;
      void demo.offsetWidth;
      movers.forEach((mover) => { mover.style.removeProperty("transform"); });
      demo.classList.add("is-playing");
      break;
    }
    case "replay-scramble":
      textScrambleControllers.get(sample)?.replay();
      break;
    case "resize-send": {
      const status = sample.querySelector<HTMLElement>("[data-resize-status]");
      if (status) {
        status.hidden = false;
        status.textContent = "Demo message submitted.";
      }
      if (button instanceof HTMLButtonElement) button.disabled = true;
      announce(sample, "Demo message submitted.");
      break;
    }
    case "delete-sheet-open":
      setDeleteSheetOpen(sample, true);
      break;
    case "delete-sheet-close":
    case "delete-sheet-cancel": {
      const status = sample.querySelector<HTMLElement>("[data-delete-parent-status]");
      if (status) status.textContent = "Removal canceled. Q3 Report.pdf is unchanged.";
      setDeleteSheetOpen(sample, false);
      break;
    }
    case "delete-sheet-confirm":
      confirmDeleteSheet(sample);
      break;
    case "delete-sheet-reset":
      resetDeleteSheet(sample);
      break;
    case "delete-sheet-other": {
      const status = sample.querySelector<HTMLElement>("[data-delete-other-status]");
      if (status) status.textContent = "Activity refreshed just now. The Documents sheet is still open.";
      break;
    }
    case "stepper-dec":
    case "stepper-inc": {
      changeStepperValue(sample, action);
      break;
    }
    case "toggle-switch": {
      const next = button.getAttribute("aria-checked") !== "true";
      button.setAttribute("aria-checked", String(next));
      button.classList.toggle("is-on", next);
      announce(sample, `${button.getAttribute("aria-label")} ${next ? "enabled" : "disabled"}.`);
      break;
    }
    case "select-mac-segment":
      if (button instanceof HTMLButtonElement) selectMacSegment(button);
      break;
    case "select-segment":
      selectOne(button.parentElement ?? sample, "button[data-action='select-segment']", button);
      announce(sample, `${button.textContent?.trim()} selected.`);
      break;
    case "select-toggle-radio":
      selectToggleRadio(button);
      break;
    case "select-tab": {
      const tablist = button.closest<HTMLElement>(".sample-tabs-list[role='tablist']");
      const selectedPanelId = button.getAttribute("aria-controls");
      const selectedPanel = selectedPanelId
        ? sample.querySelector<HTMLElement>(`.sample-tabs-panel[id='${selectedPanelId}']`)
        : null;
      if (!tablist || !selectedPanel) break;

      const alreadySelected = button.getAttribute("aria-selected") === "true";
      selectOne(tablist, "[role='tab']", button);
      sample.querySelectorAll<HTMLElement>(".sample-tabs-panel[role='tabpanel']").forEach((panel) => {
        panel.hidden = panel !== selectedPanel;
        panel.classList.remove("is-entering");
      });
      if (!alreadySelected && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        void selectedPanel.offsetWidth;
        selectedPanel.classList.add("is-entering");
        selectedPanel.addEventListener("animationend", () => selectedPanel.classList.remove("is-entering"), { once: true });
      }
      updateTabsIndicator(tablist);
      button.scrollIntoView({ block: "nearest", inline: "nearest" });
      break;
    }
    case "toggle-menu": {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      const owner = button.closest<HTMLElement>(".sample-overflow, .sample-combo-button");
      const menu = owner?.querySelector<HTMLElement>(".sample-menu");
      if (menu) {
        menu.dataset.open = String(expanded);
        if (owner?.matches(".sample-combo-button")) setComboMenuOpen(menu, expanded);
        else menu.hidden = !expanded;
      }
      if (expanded) {
        if (owner?.matches(".sample-combo-button")) {
          const feedback = owner.parentElement?.querySelector<HTMLElement>(".sample-combo-feedback");
          if (feedback) feedback.hidden = true;
        }
        owner?.querySelector<HTMLElement>(".sample-menu button")?.focus();
      }
      break;
    }
    case "overflow-nav-toggle": {
      const owner = button.closest<HTMLElement>(".sample-overflow-navigation");
      const panel = owner?.querySelector<HTMLElement>(".sample-overflow-navigation-panel");
      if (!owner || !panel) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      panel.hidden = !expanded;
      panel.dataset.open = String(expanded);
      break;
    }
    case "overflow-nav-select": {
      const owner = button.closest<HTMLElement>(".sample-overflow-navigation");
      const trigger = owner?.querySelector<HTMLButtonElement>("[data-action='overflow-nav-toggle']");
      const panel = owner?.querySelector<HTMLElement>(".sample-overflow-navigation-panel");
      const destination = button.textContent?.trim() ?? "Section";
      if (panel) panel.hidden = true;
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
      const feedback = sample.querySelector<HTMLElement>("[data-overflow-feedback]");
      if (feedback) feedback.textContent = `${destination} selected from the main navigation.`;
      break;
    }
    case "overflow-command-toggle": {
      const owner = button.closest<HTMLElement>(".sample-overflow-command");
      const panel = owner?.querySelector<HTMLElement>(".sample-overflow-command-panel");
      if (!owner || !panel) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      panel.hidden = !expanded;
      panel.dataset.open = String(expanded);
      if (expanded) panel.querySelector<HTMLInputElement>("[data-overflow-file]")?.focus();
      break;
    }
    case "overflow-command-close": {
      const owner = button.closest<HTMLElement>(".sample-overflow-command");
      const trigger = owner?.querySelector<HTMLButtonElement>("[data-action='overflow-command-toggle']");
      const panel = owner?.querySelector<HTMLElement>(".sample-overflow-command-panel");
      if (panel) panel.hidden = true;
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
      break;
    }
    case "overflow-command-open": {
      const owner = button.closest<HTMLElement>(".sample-overflow-command");
      const trigger = owner?.querySelector<HTMLButtonElement>("[data-action='overflow-command-toggle']");
      const panel = owner?.querySelector<HTMLElement>(".sample-overflow-command-panel");
      const filename = owner?.querySelector<HTMLInputElement>("[data-overflow-file]")?.value.trim() ?? "";
      if (!filename) {
        owner?.querySelector<HTMLInputElement>("[data-overflow-file]")?.focus();
        break;
      }
      if (panel) panel.hidden = true;
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
      const feedback = sample.querySelector<HTMLElement>("[data-overflow-feedback]");
      if (feedback) feedback.textContent = `Ready to open ${filename}. This preview does not access files.`;
      break;
    }
    case "toggle-menubar": {
      const bar = button.closest<HTMLElement>(".sample-menu-bar");
      const menu = bar?.querySelector<HTMLElement>(".sample-menu-bar-panel");
      if (!bar || !menu) break;
      const opening = button.getAttribute("aria-expanded") !== "true";
      if (!opening) {
        closeMenuBar(bar);
        break;
      }
      closeMenuBar(bar, false, true);
      button.setAttribute("aria-expanded", "true");
      button.classList.add("is-current");
      menu.replaceChildren();
      const label = button.dataset.menuLabel ?? "Menu";
      menu.setAttribute("aria-label", `${label} menu`);
      const feedback = bar.parentElement?.querySelector<HTMLElement>("[data-menu-feedback]");
      if (feedback) feedback.textContent = `${label} menu opened. Choose an item to see the sample feedback; no system commands are run.`;
      type MenuBarCommand = { label: string; shortcut?: string; detail?: string } | { separator: true };
      const commands: Record<string, MenuBarCommand[]> = {
        Apple: [
          { label: "About VINASIG" }, { separator: true },
          { label: "System Settings…" }, { label: "Recent Items" }, { separator: true },
          { label: "Sleep" }, { label: "Restart…" }, { label: "Shut Down…" },
        ],
        File: [
          { label: "New project", shortcut: "⌘N" }, { label: "Open project…", shortcut: "⌘O" },
          { separator: true }, { label: "Save", shortcut: "⌘S" }, { label: "Rename project…" },
          { separator: true }, { label: "Close window", shortcut: "⌘W" },
        ],
        Edit: [
          { label: "Undo", shortcut: "⌘Z" }, { label: "Redo", shortcut: "⇧⌘Z" },
          { separator: true }, { label: "Cut", shortcut: "⌘X" }, { label: "Copy", shortcut: "⌘C" }, { label: "Paste", shortcut: "⌘V" },
        ],
        View: [
          { label: "Zoom in", shortcut: "⌘+" }, { label: "Zoom out", shortcut: "⌘−" },
          { separator: true }, { label: "Show toolbar" }, { label: "Enter full screen", shortcut: "⌃⌘F" },
        ],
        Window: [
          { label: "Minimize", shortcut: "⌘M" }, { label: "Zoom" },
          { separator: true }, { label: "Bring all to front" },
        ],
        Help: [
          { label: "Search help", shortcut: "⌘?" }, { label: "Keyboard shortcuts" },
          { separator: true }, { label: "About this design system" },
        ],
        "Wi-Fi": [
          { label: "VINASIG Studio", detail: "Connected" }, { label: "Guest network" },
          { separator: true }, { label: "Turn Wi-Fi Off" }, { label: "Network Settings…" },
        ],
        Battery: [
          { label: "Battery", detail: "88%" }, { label: "Power source", detail: "Battery" },
          { separator: true }, { label: "Low Power Mode" }, { label: "Battery Settings…" },
        ],
        "Control Center": [
          { label: "Display" }, { label: "Sound" }, { label: "Focus" },
          { separator: true }, { label: "Control Center Settings…" },
        ],
        "Sync status": [
          { label: "Open activity" }, { label: "Check for updates…" }, { label: "Sync settings…" },
          { separator: true }, { label: bar.closest<HTMLElement>(".sample-menu-extra-demo")?.dataset.syncPaused === "true" ? "Resume syncing" : "Pause syncing" },
        ],
      };
      let menuItemIndex = 0;
      for (const command of commands[label] ?? [{ label: "Open settings" }]) {
        if ("separator" in command) {
          const separator = document.createElement("div");
          separator.className = "sample-menu-bar-separator";
          separator.setAttribute("role", "separator");
          menu.append(separator);
          continue;
        }
        const item = document.createElement("button");
        item.type = "button";
        item.setAttribute("role", "menuitem");
        item.tabIndex = -1;
        item.dataset.action = "menubar-command";
        item.dataset.menuCommand = command.label;
        item.style.setProperty("--menu-item-index", String(menuItemIndex++));
        const title = document.createElement("span");
        title.textContent = command.label;
        item.append(title);
        const meta = command.shortcut ?? command.detail;
        if (meta) {
          const hint = document.createElement(command.shortcut ? "kbd" : "small");
          hint.textContent = meta;
          item.append(hint);
        }
        menu.append(item);
      }
      menu.hidden = false;
      menu.inert = false;
      menu.removeAttribute("aria-hidden");
      menu.removeAttribute("data-motion");
      menu.dataset.open = "true";
      if (!reducedMotionPreference.matches) {
        void menu.offsetWidth;
        menu.dataset.motion = "opening";
      }
      const barRect = bar.getBoundingClientRect();
      const triggerRect = button.getBoundingClientRect();
      const contentLeft = barRect.left + bar.clientLeft;
      const triggerLeft = triggerRect.left - contentLeft;
      const triggerRight = triggerRect.right - contentLeft;
      const preferredLeft = triggerLeft + menu.offsetWidth <= bar.clientWidth
        ? triggerLeft
        : triggerRight - menu.offsetWidth;
      const isStatusItem = bar.closest(".sample-menu-extra-demo") !== null;
      const panelExceedsBar = menu.offsetWidth > bar.clientWidth;
      const viewportMinLeft = 16 - contentLeft;
      const viewportMaxLeft = window.innerWidth - 16 - menu.offsetWidth - contentLeft;
      const minLeft = isStatusItem && panelExceedsBar ? viewportMinLeft : 0;
      const maxLeft = isStatusItem
        ? Math.max(minLeft, Math.min(panelExceedsBar ? viewportMaxLeft : bar.clientWidth - menu.offsetWidth, viewportMaxLeft))
        : Math.max(0, bar.clientWidth - menu.offsetWidth);
      menu.style.setProperty("--sample-menu-bar-left", `${Math.min(Math.max(preferredLeft, minLeft), maxLeft)}px`);
      menu.querySelector<HTMLElement>("[role='menuitem']")?.focus({ preventScroll: true });
      break;
    }
    case "menubar-command": {
      const bar = button.closest<HTMLElement>(".sample-menu-bar");
      const command = button.dataset.menuCommand ?? button.textContent?.trim() ?? "Command";
      const menuLabel = bar?.querySelector<HTMLElement>("[data-action='toggle-menubar'][aria-expanded='true']")?.dataset.menuLabel ?? "Menu";
      const feedback = bar?.parentElement?.querySelector<HTMLElement>("[data-menu-feedback]");
      const extra = bar?.closest<HTMLElement>(".sample-menu-extra-demo");
      let feedbackText = `${command} selected from the ${menuLabel} menu. This preview does not run system commands.`;
      if (extra) {
        if (command === "Open activity" || command === "Sync settings…") {
          const selectedView = command === "Open activity" ? "activity" : "settings";
          showMenuExtraView(extra, selectedView);
          feedbackText = command === "Open activity"
            ? "Recent sync activity is open in this preview."
            : "Sync settings are open in this preview.";
        } else if (command === "Pause syncing" || command === "Resume syncing") {
          const paused = command === "Pause syncing";
          extra.dataset.syncPaused = String(paused);
          const syncState = extra.querySelector<HTMLElement>("[data-sync-state]");
          const triggerLabel = extra.querySelector<HTMLElement>(".sample-menu-extra-trigger span");
          const icon = extra.querySelector<HTMLElement>(".sample-menu-extra-trigger [data-lucide]");
          if (syncState) syncState.textContent = paused ? "Syncing is paused" : "All files are current";
          if (triggerLabel) triggerLabel.textContent = paused ? "Sync paused" : "Up to date";
          if (icon) {
            icon.dataset.lucide = paused ? "cloud-off" : "cloud-check";
            renderIcons(extra);
            const updatedIcon = extra.querySelector<HTMLElement>(".sample-menu-extra-trigger .ui-icon");
            if (updatedIcon && !reducedMotionPreference.matches) {
              updatedIcon.classList.remove("is-updating");
              void updatedIcon.offsetWidth;
              updatedIcon.classList.add("is-updating");
              updatedIcon.addEventListener("animationend", () => updatedIcon.classList.remove("is-updating"), { once: true });
            }
          }
          feedbackText = paused ? "Sync paused in this preview." : "Sync resumed in this preview.";
        } else if (command === "Check for updates…") {
          feedbackText = "Everything is up to date. No new updates are available.";
        }
      }
      if (bar) closeMenuBar(bar, true);
      if (feedback) feedback.textContent = feedbackText;
      break;
    }
    case "menu-extra-home": {
      const extra = button.closest<HTMLElement>(".sample-menu-extra-demo");
      if (!extra) break;
      showMenuExtraView(extra, "workspace");
      const feedback = extra.querySelector<HTMLElement>("[data-menu-feedback]");
      if (feedback) feedback.textContent = "Workspace sync status is open.";
      break;
    }
    case "toggle-hover-card": {
      const owner = button.closest<HTMLElement>(".sample-hover");
      if (!owner) break;
      const state = hoverCardState(owner);
      if (state.pointerType === "touch" || event?.detail === 0) {
        state.suppressed = false;
        state.pinned = !state.pinned;
        if (!state.pinned && (state.pointerInside || state.focusInside)) state.suppressed = true;
        syncHoverCard(owner, 0);
      }
      break;
    }
    case "toggle-lightbox": {
      const root = button.closest<HTMLElement>(".sample-lightbox");
      const viewer = root?.querySelector<HTMLDialogElement>(".sample-lightbox-dialog");
      if (!root || !viewer) break;
      prepareLightboxSample(root);
      updateLightbox(root, Number(button.dataset.lightboxIndex ?? 0), viewer);
      portalLightboxDialog(root, viewer);
      if (!viewer.open) viewer.showModal();
      viewer.querySelector<HTMLElement>("[data-action='close-lightbox']")?.focus();
      break;
    }
    case "close-lightbox": {
      const root = lightboxRootFor(button);
      const viewer = button.closest<HTMLDialogElement>(".sample-lightbox-dialog")
        ?? root?.querySelector<HTMLDialogElement>(".sample-lightbox-dialog");
      if (viewer) closeLightbox(viewer);
      break;
    }
    case "lightbox-previous":
    case "lightbox-next":
    case "lightbox-select": {
      const root = lightboxRootFor(button);
      if (!root) break;
      const viewer = button.closest<HTMLDialogElement>(".sample-lightbox-dialog");
      const current = Number(root.dataset.lightboxIndex ?? 0);
      const next = action === "lightbox-select"
        ? Number(button.dataset.lightboxIndex ?? 0)
        : current + (action === "lightbox-next" ? 1 : -1);
      updateLightbox(root, next, viewer);
      break;
    }
    case "outline-item": {
      const treeItem = button.closest<HTMLElement>(".sample-outline-node[role='treeitem']");
      if (!treeItem) break;
      const disclosure = event?.target instanceof Element
        ? event.target.closest<HTMLElement>(".sample-outline-disclosure:not(.is-leaf)")
        : null;
      if (disclosure) toggleOutlineBranch(treeItem);
      else selectOutlineItem(treeItem, true);
      break;
    }
    case "toggle-color-palette": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const panel = well?.querySelector<HTMLElement>(".sample-color-popover");
      if (!well || !panel) break;
      const shouldOpen = button.getAttribute("aria-expanded") !== "true";
      closeColorWellPanels(well);
      if (!shouldOpen) break;
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      positionColorWellPanel(well, button, panel);
      (panel.querySelector<HTMLElement>("[role='option'][aria-selected='true']")
        ?? panel.querySelector<HTMLElement>("[role='option']"))?.focus();
      break;
    }
    case "toggle-color-panel": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const panel = well?.querySelector<HTMLElement>(".sample-color-panel");
      const trigger = well?.querySelector<HTMLElement>(".sample-color-panel-trigger");
      if (!well || !panel) break;
      const shouldOpen = trigger?.getAttribute("aria-expanded") !== "true";
      closeColorWellPanels(well);
      if (!shouldOpen) break;
      panel.hidden = false;
      trigger?.setAttribute("aria-expanded", "true");
      positionColorWellPanel(well, trigger ?? button, panel);
      panel.querySelector<HTMLInputElement>(".sample-color-hex")?.focus();
      break;
    }
    case "toggle-color-picker": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const picker = well?.querySelector<HTMLElement>(".sample-color-picker");
      const trigger = well?.querySelector<HTMLElement>(".sample-color-picker-trigger");
      const panel = well?.querySelector<HTMLElement>(".sample-color-panel");
      if (!well || !picker || !trigger || !panel) break;
      const shouldOpen = trigger.getAttribute("aria-expanded") !== "true";
      picker.hidden = !shouldOpen;
      trigger.setAttribute("aria-expanded", String(shouldOpen));
      if (shouldOpen) {
        const hex = well.querySelector<HTMLInputElement>(".sample-color-hex");
        const draft = hex?.value.trim() ?? "";
        syncColorPicker(well, /^#?[0-9A-F]{6}$/i.test(draft)
          ? (draft.startsWith("#") ? draft : `#${draft}`)
          : (well.dataset.color ?? "#0A6CFF"));
        requestAnimationFrame(() => {
          positionColorWellPanel(well, well.querySelector<HTMLElement>(".sample-color-panel-trigger") ?? button, panel);
          well.querySelector<HTMLElement>(".sample-color-picker-surface")?.focus({ preventScroll: true });
        });
      }
      break;
    }
    case "close-color-panel": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const trigger = well?.querySelector<HTMLElement>("[data-action='toggle-color-panel']");
      if (!well || !trigger) break;
      closeColorWellPanels(well);
      trigger.focus();
      break;
    }
    case "sample-screen-color": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      if (!well) break;
      const EyeDropperConstructor = (window as Window & {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper;
      if (!EyeDropperConstructor) {
        announce(sample, "Screen color sampling is not available in this browser. Use the full color panel instead.");
        break;
      }
      new EyeDropperConstructor().open().then(({ sRGBHex }) => {
        setColorWellValue(well, sRGBHex, "Sampled color");
        closeColorWellPanels(well);
        well.querySelector<HTMLElement>("[data-action='toggle-color-palette']")?.focus();
        announce(sample, `Sampled color ${sRGBHex.toUpperCase()} selected.`);
      }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        announce(sample, "The screen color could not be sampled. Choose a color from the palette.");
      });
      break;
    }
    case "select-color": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const color = button.dataset.color;
      const name = button.dataset.colorName;
      if (!well || !color || !name) break;
      setColorWellValue(well, color, name);
      closeColorWellPanels(well);
      well.querySelector<HTMLElement>("[data-action='toggle-color-palette']")?.focus();
      announce(sample, `${name}, ${color.toUpperCase()} selected.`);
      break;
    }
    case "apply-color": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const input = well?.querySelector<HTMLInputElement>(".sample-color-hex");
      const error = well?.querySelector<HTMLElement>(".sample-color-error");
      if (!well || !input || !error) break;
      const rawValue = input.value.trim();
      const value = (rawValue.startsWith("#") ? rawValue : `#${rawValue}`).toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(value)) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = "Enter a valid six-digit HEX value, such as #21497B.";
        error.hidden = false;
        const panel = well.querySelector<HTMLElement>(".sample-color-panel");
        if (panel) panel.scrollTop = panel.scrollHeight;
        input.focus();
        break;
      }
      setColorWellValue(well, value, "Custom color");
      closeColorWellPanels(well);
      well.querySelector<HTMLElement>("[data-action='toggle-color-panel']")?.focus();
      announce(sample, `Custom color ${value} applied.`);
      break;
    }
    case "toggle-popover": {
      const group = button.parentElement;
      const panel = group?.querySelector<HTMLElement>(".sample-control-options")
        ?? group?.querySelector<HTMLElement>(".sample-overlay-popover")
        ?? group?.querySelector<HTMLElement>(":scope > b, :scope > small, :scope > div:not(button)");
      if (!panel) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      panel.hidden = !expanded;
      if (expanded) {
        const stage = button.closest<HTMLElement>(".element-demo-stage");
        const triggerBounds = button.getBoundingClientRect();
        const stageBounds = stage?.getBoundingClientRect();
        const panelHeight = panel.getBoundingClientRect().height;
        const below = stageBounds ? stageBounds.bottom - triggerBounds.bottom : window.innerHeight - triggerBounds.bottom;
        const above = stageBounds ? triggerBounds.top - stageBounds.top : triggerBounds.top;
        panel.classList.toggle("opens-up", below < panelHeight + 8 && above > below);
        panel.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled]), [role='option'], [role='menuitem']")?.focus();
      } else {
        panel.classList.remove("opens-up");
      }
      break;
    }
    case "macos-popover-toggle": {
      const demo = button.closest<HTMLElement>(".sample-popover-macos");
      if (demo) setMacPopoverOpen(demo, demo.dataset.popoverOpen !== "true");
      break;
    }
    case "macos-popover-close": {
      const demo = button.closest<HTMLElement>(".sample-popover-macos");
      if (demo) setMacPopoverOpen(demo, false, true);
      break;
    }
    case "toggle-tooltip": {
      const tooltip = button.parentElement?.querySelector<HTMLElement>("[role='tooltip']");
      if (!tooltip) break;
      button.setAttribute("aria-expanded", "true");
      tooltip.hidden = false;
      break;
    }
    case "overlay-close": {
      const owner = button.closest<HTMLElement>(".sample-overlay-popover-example");
      const popover = owner?.querySelector<HTMLElement>(".sample-overlay-popover");
      const trigger = owner?.querySelector<HTMLButtonElement>(".sample-anchor[popovertarget]");
      if (popover?.matches(":popover-open")) popover.hidePopover();
      trigger?.focus({ preventScroll: true });
      break;
    }
    case "control-option": {
      const control = button.closest<HTMLElement>(".sample-control-trio > div");
      const trigger = control?.querySelector<HTMLElement>("[data-action='toggle-popover']");
      const panel = control?.querySelector<HTMLElement>(".sample-control-options");
      if (button.getAttribute("role") === "option") {
        panel?.querySelectorAll<HTMLElement>("[role='option']").forEach((option) => {
          option.setAttribute("aria-selected", String(option === button));
        });
      }
      if (trigger) {
        const icon = trigger.querySelector("i");
        trigger.textContent = button.textContent?.trim() ?? "Selected";
        trigger.removeAttribute("aria-label");
        if (icon) trigger.append(icon);
        trigger.setAttribute("aria-expanded", "false");
      }
      if (panel) panel.hidden = true;
      trigger?.focus();
      announce(sample, `${button.textContent?.trim()} selected.`);
      break;
    }
    case "menu-command": {
      if (id === "three-dots-overflow-menu") {
        const command = button.textContent?.trim() ?? "Action";
        const owner = button.closest<HTMLElement>(".sample-overflow");
        const menu = button.closest<HTMLElement>(".sample-overflow-menu");
        const trigger = owner?.querySelector<HTMLButtonElement>("[aria-haspopup='menu']");
        if (menu) menu.hidden = true;
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
          trigger.focus();
        }
        const feedback = sample.querySelector<HTMLElement>("[data-overflow-feedback]");
        if (feedback) feedback.textContent = `${command} selected. The menu closed.`;
        break;
      }
      if (id === "popover-dropdown-tooltip") {
        const feedback = sample.querySelector<HTMLElement>("[data-overlay-feedback]");
        const command = button.textContent?.trim() ?? "Action";
        const owner = button.closest<HTMLElement>(".sample-overlay-menu-example");
        const menu = owner?.querySelector<HTMLElement>("[role='menu']");
        const trigger = owner?.querySelector<HTMLButtonElement>("[aria-haspopup='menu']");
        if (menu) menu.hidden = true;
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
          trigger.focus();
        }
        if (feedback) {
          feedback.textContent = `${command} selected in the demo. The menu closed.`;
          feedback.hidden = false;
        }
        announce(sample, `${command} selected in the demo. The menu closed.`);
        break;
      }
      if (id === "desktop-sidebar-source-list") {
        const key = button.dataset.sidebarKey;
        selectOne(sample, ".sample-source-list button[data-sidebar-key]", button, "is-current");
        button.setAttribute("aria-current", "page");
        if (key) updateDesktopSidebarContent(sample, key);
        announce(sample, `${button.getAttribute("aria-label") ?? button.textContent?.trim()} selected. The content pane updated.`);
        break;
      }
      if (id === "context-menu") {
        const demo = button.closest<HTMLElement>(".sample-context-demo");
        const command = button.dataset.menuCommand ?? button.textContent?.trim() ?? "Command";
        if (demo) closeContextMenu(demo, true);
        announce(sample, `${command} selected for Brand assets. This preview does not change files.`);
        break;
      }
      if (id === "combo-button") {
        const command = button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "Command";
        const feedback = sample.querySelector<HTMLElement>(".sample-combo-feedback");
        const menu = button.closest<HTMLElement>(".sample-menu");
        if (menu) {
          menu.dataset.open = "false";
          setComboMenuOpen(menu, false);
        }
        const trigger = sample.querySelector<HTMLElement>(".sample-combo-button [aria-haspopup='menu']");
        trigger?.setAttribute("aria-expanded", "false");
        if (feedback) {
          feedback.textContent = `${command} selected.`;
          feedback.hidden = false;
          feedback.focus();
        }
        announce(sample, `${command} selected.`);
        break;
      }
      announce(sample, `${button.getAttribute("aria-label") ?? button.textContent?.trim()} selected.`);
      button.closest<HTMLElement>(".sample-menu")?.setAttribute("hidden", "");
      const trigger = button.closest<HTMLElement>(".sample-overflow, .sample-combo-button, .sample-overlay-trio > div")?.querySelector<HTMLElement>("[aria-haspopup='menu']");
      trigger?.setAttribute("aria-expanded", "false");
      trigger?.focus();
      break;
    }
    case "command-select":
      if (id === "command-palette") selectCommandPaletteOption(button);
      else announce(sample, `${button.textContent?.trim()} command selected.`);
      break;
    case "command-palette-open": {
      const root = button.closest<HTMLElement>(".sample-command-demo");
      if (root) openCommandPalette(root, button);
      break;
    }
    case "command-palette-close": {
      const root = button.closest<HTMLElement>(".sample-command-demo");
      if (root) closeCommandPalette(root);
      break;
    }
    case "token-select": {
      const field = button.closest<HTMLElement>(".sample-token-field");
      if (!field || !(button instanceof HTMLButtonElement)) break;
      const wasSelected = button.getAttribute("aria-pressed") === "true";
      clearRecipientSelection(field);
      button.setAttribute("aria-pressed", String(!wasSelected));
      setRecipientMessage(field, wasSelected
        ? `${button.dataset.tokenLabel ?? "Recipient"} token deselected.`
        : `${button.dataset.tokenLabel ?? "Recipient"} token selected. Press Return to edit or Backspace to remove.`);
      break;
    }
    case "token-remove": {
      const field = button.closest<HTMLElement>(".sample-token-field");
      const select = button.closest<HTMLElement>(".sample-token-pill")?.querySelector<HTMLButtonElement>(".sample-token-select");
      if (field && select) removeRecipientToken(field, select);
      break;
    }
    case "token-suggestion": {
      const field = button.closest<HTMLElement>(".sample-token-field");
      if (field && button.dataset.tokenValue) commitRecipient(field, button.dataset.tokenValue);
      break;
    }
    case "toggle-label-chip": {
      const isSelected = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!isSelected));
      announce(sample, `Design filter ${isSelected ? "cleared" : "selected"}.`);
      break;
    }
    case "toggle-breadcrumbs": {
      const demo = button.closest<HTMLElement>(".sample-breadcrumb-demo");
      if (!demo) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      const hiddenAncestors = Array.from(demo.querySelectorAll<HTMLElement>(".sample-breadcrumb-hidden"));
      const breadcrumbList = demo.querySelector<HTMLOListElement>(".sample-breadcrumbs ol");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const previousPositions = new Map<HTMLElement, { left: number; top: number }>();
      if (expanded && breadcrumbList && !reduceMotion) {
        Array.from(breadcrumbList.children).forEach((item) => {
          const breadcrumb = item as HTMLElement;
          if (!breadcrumb.hidden) {
            const { left, top } = breadcrumb.getBoundingClientRect();
            previousPositions.set(breadcrumb, { left, top });
          }
        });
      }
      hiddenAncestors.forEach((ancestor) => {
        ancestor.classList.remove("is-entering");
        ancestor.hidden = !expanded;
      });
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute("aria-label", expanded ? "Collapse hidden breadcrumb levels" : "Show 2 hidden breadcrumb levels");
      const moreIcon = button.querySelector<HTMLElement>(".sample-breadcrumb-more-icon");
      const collapseIcon = button.querySelector<HTMLElement>(".sample-breadcrumb-collapse-icon");
      moreIcon?.toggleAttribute("hidden", expanded);
      collapseIcon?.toggleAttribute("hidden", !expanded);
      if (expanded && breadcrumbList && !reduceMotion) {
        requestAnimationFrame(() => {
          hiddenAncestors.forEach((ancestor, index) => {
            ancestor.style.setProperty("--breadcrumb-enter-delay", `${index * 35}ms`);
            ancestor.classList.add("is-entering");
            ancestor.addEventListener("animationend", () => {
              ancestor.classList.remove("is-entering");
              ancestor.style.removeProperty("--breadcrumb-enter-delay");
            }, { once: true });
          });
          Array.from(breadcrumbList.children).forEach((item) => {
            const breadcrumb = item as HTMLElement;
            const previousPosition = previousPositions.get(breadcrumb);
            if (!previousPosition || hiddenAncestors.includes(breadcrumb)) return;
            const position = breadcrumb.getBoundingClientRect();
            const listBounds = breadcrumbList.getBoundingClientRect();
            if (Math.abs(previousPosition.top - position.top) > 1
              || previousPosition.left < listBounds.left
              || previousPosition.left + position.width > listBounds.right) return;
            const offset = previousPosition.left - position.left;
            if (Math.abs(offset) < 1) return;
            breadcrumb.animate(
              [{ transform: `translateX(${offset}px)` }, { transform: "translateX(0)" }],
              { duration: 240, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" },
            );
          });
        });
      }
      const note = demo.querySelector<HTMLElement>(".sample-breadcrumb-note");
      if (note) note.textContent = expanded ? "All five breadcrumb levels are visible." : "Two middle levels are collapsed to keep this path readable.";
      announce(sample, expanded ? "Breadcrumbs expanded. All five levels are visible." : "Breadcrumbs collapsed. Two middle levels are hidden.");
      break;
    }
    case "remove-label-chip": {
      const row = button.closest<HTMLElement>(".sample-chip-row");
      const card = button.closest<HTMLElement>(".sample-chip-card");
      const restore = card?.querySelector<HTMLButtonElement>("[data-action='restore-label-chip']");
      if (!row || !restore || row.classList.contains("is-removing")) break;

      const finishRemoval = () => {
        if (!row.isConnected || row.hidden) return;
        row.hidden = true;
        row.classList.remove("is-removing");
        restore.hidden = false;
        restore.focus();
        announce(sample, "Design filter removed.");
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishRemoval();
      } else {
        row.classList.add("is-removing");
        row.addEventListener("animationend", finishRemoval, { once: true });
        window.setTimeout(finishRemoval, 220);
      }
      break;
    }
    case "restore-label-chip": {
      const card = button.closest<HTMLElement>(".sample-chip-card");
      const row = card?.querySelector<HTMLElement>(".sample-chip-row");
      const chip = row?.querySelector<HTMLButtonElement>("[data-action='toggle-label-chip']");
      if (!row || !chip) break;
      row.hidden = false;
      row.classList.remove("is-removing");
      chip.setAttribute("aria-pressed", "true");
      button.hidden = true;
      chip.focus();
      announce(sample, "Design filter restored and selected.");
      break;
    }
    case "remove-chip":
      button.closest(".sample-selected, .sample-token-field > div > b")?.remove();
      announce(sample, `${button.getAttribute("aria-label")?.replace("Remove ", "") ?? "Item"} removed.`);
      break;
    case "multi-dropdown-toggle": {
      const owner = button.closest<HTMLElement>(".sample-multi-checkbox");
      const panel = owner?.querySelector<HTMLElement>(".sample-multi-checkbox-options");
      if (!owner || !panel) break;
      const open = Boolean(panel.hidden) || panel.dataset.multiSelectMotion === "closing";
      setMultiSelectPanelOpen(panel, open, button);
      if (open) panel.querySelector<HTMLInputElement>("input")?.focus();
      break;
    }
    case "multi-token-option": {
      const field = button.closest<HTMLElement>(".sample-multi-token-field");
      const value = button.dataset.value;
      if (!field || !value || !addMultiSelectToken(field, value)) break;
      const input = field.querySelector<HTMLInputElement>(".sample-multi-token-input");
      if (input) {
        input.value = "";
        delete input.dataset.tokenDismissed;
        delete input.dataset.tokenExplicitOpen;
      }
      const showcase = field.closest<HTMLElement>(".sample-multi-select-showcase");
      if (showcase) refreshMultiSelectShowcase(showcase);
      announce(sample, value + " added to selected teams.");
      input?.focus();
      break;
    }
    case "multi-token-remove": {
      const field = button.closest<HTMLElement>(".sample-multi-token-field");
      const value = button.dataset.value ?? "Team";
      const chip = button.closest<HTMLElement>("[data-multi-token]");
      if (!field || !chip) break;
      const input = field.querySelector<HTMLInputElement>(".sample-multi-token-input");
      const removeChip = () => {
        if (!chip.isConnected) return;
        chip.remove();
        const showcase = field.closest<HTMLElement>(".sample-multi-select-showcase");
        if (showcase) refreshMultiSelectShowcase(showcase);
        announce(sample, value + " removed from selected teams.");
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        removeChip();
      } else {
        if (button instanceof HTMLButtonElement) button.disabled = true;
        chip.classList.add("is-removing");
        window.setTimeout(removeChip, 150);
      }
      input?.focus({ preventScroll: true });
      break;
    }
    case "multi-transfer-option": {
      button.setAttribute("aria-selected", String(button.getAttribute("aria-selected") !== "true"));
      const showcase = button.closest<HTMLElement>(".sample-multi-select-showcase");
      if (showcase) refreshMultiSelectShowcase(showcase);
      break;
    }
    case "multi-transfer": {
      const showcase = button.closest<HTMLElement>(".sample-multi-select-showcase");
      const direction = button.dataset.direction;
      const sourceSide = direction === "to-selected" ? "available" : "selected";
      const targetSide = direction === "to-selected" ? "selected" : "available";
      const source = showcase?.querySelector<HTMLElement>("[data-transfer-side='" + sourceSide + "']");
      const destination = showcase?.querySelector<HTMLElement>("[data-transfer-side='" + targetSide + "']");
      if (!showcase || !source || !destination) break;
      const moved = Array.from(source.querySelectorAll<HTMLElement>("[role='option'][aria-selected='true']"));
      const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      moved.forEach((option) => {
        option.setAttribute("aria-selected", "false");
        if (animate) option.classList.add("is-entering");
        destination.append(option);
        if (animate) requestAnimationFrame(() => option.classList.remove("is-entering"));
      });
      refreshMultiSelectShowcase(showcase);
      moved[0]?.focus();
      if (moved.length) synchronizeMultiSelectOptionTabStops(destination);
      const names = moved.map((option) => option.dataset.value ?? option.textContent?.trim() ?? "Team");
      announce(sample, moved.length ? names.join(", ") + " moved." : "Select one or more teams first.");
      break;
    }
    case "create-project": {
      const title = sample.querySelector<HTMLElement>(".sample-empty-title");
      const message = sample.querySelector<HTMLElement>(".sample-empty-description");
      if (title) title.textContent = "Project created";
      if (message) message.textContent = "Your new project is ready to configure.";
      button.textContent = "Open project";
      button.dataset.action = "open-created-project";
      animateEmptyStateUpdate(title, message, button);
      announce(sample, "Project created. Open project is ready.");
      break;
    }
    case "open-created-project": {
      announce(sample, "Brand refresh opened in this preview.");
      break;
    }
    case "save-choice-preferences": {
      const notifications = sample.querySelector<HTMLInputElement>("[data-input-action='immediate-notification-switch']");
      const topics = Array.from(sample.querySelectorAll<HTMLInputElement>(".sample-choice-group input[type='checkbox']:checked"))
        .map((input) => input.value);
      const contact = sample.querySelector<HTMLInputElement>(".sample-choice-group input[type='radio']:checked")?.value;
      const selectedTopics = topics.length ? topics.join(" and ") : "no summary topics";
      announce(sample, `Preview only. Preferences saved: alerts ${notifications?.checked ? "on" : "off"}; ${selectedTopics}; contact by ${contact ?? "no selected method"}.`);
      break;
    }
    case "toast-save": {
      const toast = sample.querySelector<HTMLElement>(".sample-toast");
      const toastCopy = sample.querySelector<HTMLElement>(".sample-toast-copy");
      const saveState = sample.querySelector<HTMLElement>("[data-toast-save-state]");
      if (!toast) break;
      if (saveState) saveState.textContent = "Saved just now";
      if (toastCopy) toastCopy.textContent = "Changes saved just now";
      startToastDismissal(toast);
      break;
    }
    case "toast-undo": {
      const toast = sample.querySelector<HTMLElement>(".sample-toast");
      const saveState = sample.querySelector<HTMLElement>("[data-toast-save-state]");
      if (toast) {
        pauseToastDismissal(toast);
        dismissToastWithExit(toast);
      }
      if (saveState) saveState.textContent = "Unsaved changes";
      announce(sample, "Save undone. Your changes are back in the draft.");
      sample.querySelector<HTMLButtonElement>("[data-action='toast-save']")?.focus({ preventScroll: true });
      break;
    }
    case "dismiss-toast": {
      const toast = sample.querySelector<HTMLElement>(".sample-toast");
      if (toast) {
        pauseToastDismissal(toast);
        dismissToastWithExit(toast);
      }
      announce(sample, "Changes saved notification dismissed.");
      sample.querySelector<HTMLButtonElement>("[data-action='toast-save']")?.focus({ preventScroll: true });
      break;
    }
    case "notice-dismiss": {
      const notice = button.closest<HTMLElement>("[data-notice]");
      if (!notice) break;
      const isBanner = notice.dataset.notice === "banner";
      const focusFallback = isBanner
        ? sample.querySelector<HTMLElement>("[data-notice-focus-fallback]")
        : notice.closest<HTMLElement>(".sample-notice-inline")?.querySelector<HTMLElement>("[data-notice-alert-focus-fallback]");
      const message = isBanner
        ? "Maintenance announcement dismissed."
        : "Card expiration notice dismissed.";
      notice.remove();
      const feedback = sample.querySelector<HTMLElement>(".sample-notice-feedback");
      if (feedback) feedback.textContent = message;
      focusFallback?.focus({ preventScroll: true });
      break;
    }
    case "notice-review": {
      const feedback = sample.querySelector<HTMLElement>(".sample-notice-feedback");
      if (feedback) feedback.textContent = "Payment settings are ready to review.";
      button.focus({ preventScroll: true });
      break;
    }
    case "surface-select": {
      const demo = button.closest<HTMLElement>(".sample-surface-demo");
      const surface = button.dataset.surface;
      if (!demo || !surface) break;

      demo.dataset.surface = surface;
      const feedback = demo.querySelector<HTMLElement>("[data-surface-feedback]");
      if (feedback) hideSurfaceFeedback(feedback);
      const panel = demo.querySelector<HTMLDialogElement>(`dialog[data-surface-panel='${surface}']`);
      if (!panel || panel.open) break;
      panel.showModal();
      demo.dataset.surfaceOpen = "true";
      demo.querySelectorAll<HTMLButtonElement>(".sample-surface-options [data-action='surface-select']").forEach((control) => {
        control.setAttribute("aria-expanded", String(control === button));
      });
      initializeSurfaceDemo(sample);
      announce(sample, `${surface.charAt(0).toUpperCase()}${surface.slice(1)} example opened.`);
      break;
    }
    case "surface-dismiss": {
      const surface = button.closest<HTMLElement>("[data-surface-panel]")?.dataset.surfacePanel ?? "dialog";
      closeSurfaceDemo(sample, `${surface.charAt(0).toUpperCase()}${surface.slice(1)} example closed.`);
      break;
    }
    case "surface-primary": {
      const surface = button.closest<HTMLElement>("[data-surface-panel]")?.dataset.surfacePanel ?? "dialog";
      const message = surface === "dialog"
        ? "Delete action previewed. No file was removed."
        : surface === "drawer"
          ? "Save action previewed. No changes were stored."
          : "Share action previewed. Nothing was sent.";
      closeSurfaceDemo(sample, message);
      break;
    }
    case "scrim-open":
      setScrimDemoOpen(sample, true, true);
      break;
    case "scrim-close":
      setScrimDemoOpen(sample, false, true);
      break;
    case "trash-open":
      openEmptyTrashAlert(sample);
      break;
    case "trash-cancel":
      closeEmptyTrashAlert(sample, "Empty Trash canceled. All 8 example items remain.");
      break;
    case "trash-confirm":
      completeEmptyTrash(sample);
      break;
    case "trash-restore":
      restoreEmptyTrashSample(sample);
      break;
    case "trash-reset-preference": {
      setEmptyTrashPreference(false);
      const checkbox = sample.querySelector<HTMLInputElement>("[data-trash-suppression]");
      const button = sample.querySelector<HTMLButtonElement>("[data-action='trash-reset-preference']");
      const feedback = sample.querySelector<HTMLElement>("[data-trash-feedback]");
      if (checkbox) checkbox.checked = false;
      if (button) button.hidden = true;
      if (feedback) {
        feedback.textContent = "The saved alert preference was cleared.";
        feedback.hidden = false;
      }
      sample.querySelector<HTMLButtonElement>("[data-action='trash-restore']")?.focus({ preventScroll: true });
      break;
    }
    case "volume-mute": {
      const slider = sample.querySelector<HTMLInputElement>("[data-volume-control]");
      if (!slider) break;
      if (Number(slider.value) > 0) {
        slider.dataset.previousVolume = slider.value;
        slider.value = "0";
      } else {
        slider.value = slider.dataset.previousVolume && slider.dataset.previousVolume !== "0"
          ? slider.dataset.previousVolume
          : "65";
      }
      updateVolumeSlider(sample);
      break;
    }
    case "save-demo":
    case "cancel-save": {
      const panel = sample.querySelector<HTMLElement>(".sample-save-panel");
      const feedback = sample.querySelector<HTMLElement>(".sample-save-feedback");
      const reopen = sample.querySelector<HTMLButtonElement>("[data-action='save-reopen']");
      const filename = sample.querySelector<HTMLInputElement>("[data-input-action='save-name']")?.value.trim() ?? "your file";
      const message = action === "save-demo"
        ? `Save preview for ${filename}. No file was created.`
        : "Save canceled. No file was created.";
      if (panel) panel.hidden = true;
      if (feedback) {
        feedback.textContent = message;
        feedback.hidden = false;
        feedback.focus();
      }
      if (reopen) reopen.hidden = false;
      announce(sample, message);
      break;
    }
    case "submit-demo": {
      const form = button.closest<HTMLFormElement>("[data-login-form]");
      if (form) form.dataset.validationAttempted = "true";
      const validation = validateLoginForm(sample);
      if (!validation.valid) {
        (validation.email?.validity.valid ? validation.password : validation.email)?.focus();
        break;
      }
      announce(sample, "Sign-in details look valid. This preview did not send a request.");
      break;
    }
    case "login-provider": {
      const provider = button.dataset.provider ?? "Alternate";
      announce(sample, `${provider} sign-in selected. This preview does not connect to a service.`);
      break;
    }
    case "login-forgot":
      announce(sample, "Password recovery selected. This preview did not send a request.");
      break;
    case "toggle-login-password": {
      const form = button.closest<HTMLFormElement>("[data-login-form]");
      const password = form?.querySelector<HTMLInputElement>("[data-login-field='password']");
      const icon = button.querySelector<SVGElement>(".ui-icon");
      if (!password) break;
      const reveal = password.type === "password";
      password.type = reveal ? "text" : "password";
      button.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
      if (icon) {
        icon.dataset.lucide = reveal ? "eye-off" : "eye";
        renderIcons(button);
      }
      break;
    }
    case "toolbar-compact": {
      const window = sample.querySelector<HTMLElement>(".sample-toolbar-window");
      const compact = window?.dataset.compact !== "true";
      setToolbarCompact(sample, compact);
      announce(sample, compact
        ? "The toolbar is constrained. Search and Share moved into More toolbar items."
        : "The toolbar has room for its visible Search and Share items again.");
      break;
    }
    case "toolbar-labels": {
      const demo = sample.querySelector<HTMLElement>(".sample-toolbar-demo");
      if (!demo) break;
      const visible = demo.dataset.labels !== "false";
      demo.dataset.labels = String(!visible);
      button.setAttribute("aria-pressed", String(!visible));
      button.textContent = visible ? "Show item labels" : "Hide item labels";
      announce(sample, visible ? "Toolbar item labels are hidden." : "Toolbar item labels are shown beneath their icons.");
      break;
    }
    case "toolbar-separator-style": {
      const separator = sample.querySelector<HTMLElement>(".sample-toolbar-separator");
      const style = button.dataset.style;
      if (!separator || !style) break;
      separator.dataset.toolbarSeparator = style;
      separator.setAttribute("role", style === "none" ? "presentation" : "separator");
      sample.querySelectorAll<HTMLButtonElement>("[data-action='toolbar-separator-style']").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      announce(sample, `Title-bar separator style: ${style}.`);
      break;
    }
    case "toolbar-overflow": {
      const trigger = sample.querySelector<HTMLButtonElement>(".sample-toolbar-overflow-trigger");
      const open = trigger?.getAttribute("aria-expanded") !== "true";
      setToolbarOverflowOpen(sample, open, open);
      break;
    }
    case "toolbar-action": {
      const command = button.dataset.toolbarCommand ?? "action";
      const fromMenu = Boolean(button.closest(".sample-toolbar-overflow-menu"));
      const messages: Record<string, string> = {
        "new-note": "New note selected. This preview does not create a document.",
        search: "Search notes selected from the toolbar.",
        share: "Share note selected. The native share panel is represented by this preview.",
        print: "Print selected from the overflow menu. This preview does not print a document.",
      };
      const message = messages[command] ?? `${button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "Toolbar action"} selected.`;
      if (command === "new-note") {
        const title = sample.querySelector<HTMLElement>(".sample-toolbar-content > h3");
        const summary = sample.querySelector<HTMLElement>(".sample-toolbar-content > p");
        const toolbarTitle = sample.querySelector<HTMLElement>("[data-toolbar-title]");
        const content = sample.querySelector<HTMLElement>(".sample-toolbar-content");
        if (title) title.textContent = "New note";
        if (summary) summary.textContent = "Start writing a note in this interactive preview.";
        if (toolbarTitle) toolbarTitle.textContent = "Untitled note";
        if (content) replayToolbarContentMotion(content);
      }
      if (fromMenu) setToolbarOverflowOpen(sample, false, true);
      const feedback = sample.querySelector<HTMLElement>(".sample-toolbar-feedback");
      if (feedback) showToolbarFeedback(feedback, message);
      break;
    }
    case "inbox-toggle-sidebar": {
      const root = button.closest<HTMLElement>(".sample-inbox");
      const sidebar = root?.querySelector<HTMLElement>(".sample-inbox-sidebar");
      const splitter = root?.querySelector<HTMLElement>(".sample-inbox-sidebar-splitter");
      if (!root || !sidebar || !splitter) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      root.classList.toggle("is-sidebar-collapsed", !expanded);
      button.setAttribute("aria-expanded", String(expanded));
      sidebar.inert = !expanded;
      sidebar.setAttribute("aria-hidden", String(!expanded));
      splitter.tabIndex = expanded ? 0 : -1;
      splitter.setAttribute("aria-hidden", String(!expanded));
      announce(sample, expanded ? "Mailbox pane expanded." : "Mailbox pane collapsed. Message list and reading pane remain open.");
      break;
    }
    case "inbox-folder": {
      const root = button.closest<HTMLElement>(".sample-inbox");
      const mailbox = button.dataset.mailbox;
      if (!root || !mailbox || !inboxMailboxLabels[mailbox]) break;
      root.dataset.activeMailbox = mailbox;
      root.classList.remove("is-detail-open");
      renderInboxSplitView(root, { animateList: true, animateDetail: true });
      break;
    }
    case "inbox-select-message": {
      const root = button.closest<HTMLElement>(".sample-inbox");
      if (!root || button.hidden || !button.dataset.messageId) break;
      root.dataset.selectedMessage = button.dataset.messageId;
      if (root.clientWidth <= 368) root.classList.add("is-detail-open");
      renderInboxSplitView(root, { markRead: true });
      if (root.classList.contains("is-detail-open")) {
        root.querySelector<HTMLButtonElement>(".sample-inbox-back")?.focus({ preventScroll: true });
      }
      break;
    }
    case "inbox-toggle-star": {
      const root = button.closest<HTMLElement>(".sample-inbox");
      const selected = root && inboxMessageRows(root).find((row) => row.dataset.messageId === root.dataset.selectedMessage);
      if (!root || !selected) break;
      selected.dataset.starred = String(selected.dataset.starred !== "true");
      renderInboxSplitView(root);
      announce(sample, selected.dataset.starred === "true" ? "Message starred." : "Star removed from message.");
      break;
    }
    case "inbox-archive-message": {
      const root = button.closest<HTMLElement>(".sample-inbox");
      const selected = root && inboxMessageRows(root).find((row) => row.dataset.messageId === root.dataset.selectedMessage);
      if (!root || !selected || selected.dataset.archived === "true") break;
      selected.dataset.archived = "true";
      const activeMailbox = root.dataset.activeMailbox ?? "inbox";
      selected.dataset.mailboxes = Array.from(new Set([...(selected.dataset.mailboxes ?? "").split(",").filter((mailbox) => mailbox !== activeMailbox), "archive"])).filter(Boolean).join(",");
      const subject = selected.dataset.subject ?? "Message";
      renderInboxSplitView(root, { animateList: true, animateDetail: true });
      announce(sample, `${subject} archived. The next available message is selected.`);
      break;
    }
    case "inbox-back-to-list": {
      const root = button.closest<HTMLElement>(".sample-inbox");
      if (!root) break;
      root.classList.remove("is-detail-open");
      root.classList.remove("is-returning-to-list");
      void root.offsetWidth;
      root.classList.add("is-returning-to-list");
      root.querySelector<HTMLButtonElement>(`.sample-inbox-message[data-message-id='${CSS.escape(root.dataset.selectedMessage ?? "")}']`)?.focus({ preventScroll: true });
      break;
    }
    case "inbox-focus-search":
      button.closest<HTMLElement>(".sample-inbox")?.querySelector<HTMLInputElement>("[data-input-action='inbox-search']")?.focus();
      break;
    case "inbox-reply":
      announce(sample, "Reply preview selected. Nothing was sent.");
      break;
    case "window-control": {
      const window = button.closest<HTMLElement>(".sample-mac-window, .sample-window-actions-demo");
      const label = button.getAttribute("aria-label");
      if (!window) break;
      if (window.matches(".sample-mac-window")) {
        if (label === "Close window") {
          const closed = !window.classList.contains("is-closed");
          const closedState = window.querySelector<HTMLElement>(".sample-window-closed");
          const minimizedState = window.querySelector<HTMLElement>(".sample-window-minimized");
          updateMacWindowFrame(window, () => {
            window.classList.toggle("is-closed", closed);
            window.classList.remove("is-minimized", "is-expanded");
            if (closedState) closedState.hidden = !closed;
            if (minimizedState) minimizedState.hidden = true;
          });
          window.querySelectorAll<HTMLButtonElement>("[data-window-control='minimize'], [data-window-control='expand']")
            .forEach((control) => control.setAttribute("aria-pressed", "false"));
          animateMacWindowEntry(closed
            ? closedState
            : window.querySelector<HTMLElement>("[data-window-content]"));
          announce(sample, closed ? "Window closed. Restore window is available." : "Window reopened.");
        } else if (label === "Minimize window") {
          if (window.classList.contains("is-closed")) break;
          const minimized = !window.classList.contains("is-minimized");
          const minimizedState = window.querySelector<HTMLElement>(".sample-window-minimized");
          updateMacWindowFrame(window, () => {
            window.classList.toggle("is-minimized", minimized);
            if (minimizedState) minimizedState.hidden = !minimized;
          });
          button.setAttribute("aria-pressed", String(minimized));
          animateMacWindowEntry(minimized
            ? minimizedState
            : window.querySelector<HTMLElement>("[data-window-content]"));
          announce(sample, minimized ? "Window minimized to Dock." : "Window restored from Dock.");
        } else if (label === "Expand window") {
          if (window.classList.contains("is-closed")) break;
          const expanded = !window.classList.contains("is-expanded");
          window.classList.toggle("is-expanded", expanded);
          button.setAttribute("aria-pressed", String(expanded));
          announce(sample, expanded ? "Window expanded." : "Window returned to its original size.");
        }
      } else {
        const state = window.dataset.windowState ?? "open";
        const control = button.dataset.windowControl;
        if (control === "close") {
          setWindowActionsState(window, "closed", "Preview closed in this page. Reopen it to continue.");
          window.querySelector<HTMLButtonElement>("[data-window-closed] button")?.focus({ preventScroll: true });
        } else if (control === "minimize") {
          const minimized = state !== "minimized";
          setWindowActionsState(window, minimized ? "minimized" : "open", minimized
            ? "Preview minimized within the page."
            : "Preview restored.");
        } else if (control === "expand") {
          const zoomed = state === "zoomed";
          const nextState = event?.altKey
            ? (zoomed ? "open" : "zoomed")
            : (state === "fullscreen" || zoomed ? "open" : "fullscreen");
          setWindowActionsState(window, nextState, nextState === "zoomed"
            ? "Option-click zoomed the preview within its page."
            : nextState === "fullscreen"
              ? "Preview expanded to fill its available page area."
              : "Preview returned to its page layout.");
        }
      }
      break;
    }
    case "vibrancy-material": {
      const demo = button.closest<HTMLElement>(".sample-vibrancy-demo");
      const material = button.dataset.materialValue;
      if (demo && material) setVibrancyMaterial(demo, material, true);
      break;
    }
    case "vibrancy-toggle": {
      const demo = button.closest<HTMLElement>(".sample-vibrancy-demo");
      if (demo) setVibrancyForeground(demo, demo.dataset.vibrancy !== "on", true);
      break;
    }
    case "restore-window": {
      const window = button.closest<HTMLElement>(".sample-mac-window, .sample-window-actions-demo");
      if (!window) break;
      if (window.matches(".sample-window-actions-demo")) {
        setWindowActionsState(window, "open", "Preview reopened.");
        window.querySelector<HTMLButtonElement>("[data-window-control='close']")?.focus({ preventScroll: true });
        break;
      }
      updateMacWindowFrame(window, () => {
        window.classList.remove("is-closed", "is-minimized", "is-expanded");
        window.querySelectorAll<HTMLElement>(".sample-window-closed, .sample-window-minimized").forEach((state) => {
          state.hidden = true;
        });
      });
      window.querySelectorAll<HTMLButtonElement>("[data-window-control='minimize'], [data-window-control='expand']")
        .forEach((control) => control.setAttribute("aria-pressed", "false"));
      animateMacWindowEntry(window.querySelector<HTMLElement>("[data-window-content]"));
      announce(sample, "Window restored.");
      break;
    }
    case "window-document-edit": {
      const demo = button.closest<HTMLElement>(".sample-window-actions-demo");
      const status = demo?.querySelector<HTMLElement>("[data-window-document-status]");
      const save = demo?.querySelector<HTMLButtonElement>("[data-action='window-document-save']");
      if (!demo || !status || !save) break;
      demo.dataset.unsaved = "true";
      status.dataset.unsaved = "true";
      status.textContent = "Unsaved changes";
      button.setAttribute("aria-pressed", "true");
      save.disabled = false;
      const feedback = demo.querySelector<HTMLElement>(".sample-window-actions-feedback");
      if (feedback) {
        feedback.textContent = "Document changed. Its unsaved state is shown as text in this web adaptation.";
        feedback.hidden = false;
      }
      break;
    }
    case "window-document-save": {
      const demo = button.closest<HTMLElement>(".sample-window-actions-demo");
      const status = demo?.querySelector<HTMLElement>("[data-window-document-status]");
      const edit = demo?.querySelector<HTMLButtonElement>("[data-action='window-document-edit']");
      if (!demo || !status || !edit) break;
      demo.dataset.unsaved = "false";
      status.dataset.unsaved = "false";
      status.textContent = "Saved";
      edit.setAttribute("aria-pressed", "false");
      button.setAttribute("disabled", "");
      const feedback = demo.querySelector<HTMLElement>(".sample-window-actions-feedback");
      if (feedback) {
        feedback.textContent = "Changes saved in this example.";
        feedback.hidden = false;
      }
      break;
    }
    case "mac-window-tab": {
      const window = button.closest<HTMLElement>(".sample-mac-window");
      if (!window) break;
      const tabs = Array.from(window.querySelectorAll<HTMLButtonElement>(".sample-window-tabs [role='tab']"));
      tabs.forEach((tab) => {
        const selected = tab === button;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        tab.classList.toggle("is-current", selected);
      });
      window.querySelector<HTMLElement>("[data-window-content]")?.setAttribute("aria-labelledby", button.id);
      const content = window.querySelector<HTMLElement>("[data-window-content]");
      const title = window.querySelector<HTMLElement>(".sample-window-title");
      const heading = content?.querySelector<HTMLElement>("[data-document-heading]");
      const summary = content?.querySelector<HTMLElement>("[data-document-summary]");
      if (title) title.textContent = button.dataset.windowTitle ?? button.textContent?.trim() ?? "Window";
      if (heading) heading.textContent = button.dataset.documentHeading ?? button.textContent?.trim() ?? "";
      if (summary) summary.textContent = button.dataset.documentSummary ?? "";
      animateMacWindowEntry(content);
      animateMacWindowEntry(title);
      announce(sample, `${button.textContent?.trim() ?? "Window"} tab selected.`);
      break;
    }
    case "toggle-disclosure": {
      const branch = button.closest<HTMLElement>(".sample-disclosure-branch");
      const children = branch?.querySelector<HTMLElement>(":scope > .sample-disclosure-children");
      if (!children || !(button instanceof HTMLButtonElement)) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      transitionDisclosurePanel(button, children, expanded);
      break;
    }
    case "dock-add-unread": {
      const dock = button.closest<HTMLElement>(".sample-dock");
      if (!dock) break;
      const count = updateDockBadge(sample, Number(dock.dataset.badgeCount ?? "0") + 1);
      announce(sample, `Unread badge updated to ${count}. This preview does not update the system Dock.`);
      break;
    }
    case "dock-clear-badge": {
      updateDockBadge(sample, 0);
      announce(sample, "Badge cleared; the zero label is hidden. This preview does not update the system Dock.");
      break;
    }
    case "dock-request-attention": {
      const dock = button.closest<HTMLElement>(".sample-dock");
      const app = dock?.querySelector<HTMLElement>("[data-dock-app]");
      if (!dock || !app) break;
      const count = Number(dock.dataset.badgeCount ?? "0");
      app.classList.remove("is-bouncing");
      void app.offsetWidth;
      app.classList.add("is-bouncing");
      app.addEventListener("animationend", () => app.classList.remove("is-bouncing"), { once: true });
      announce(sample, `Attention bounce requested separately from the badge. The badge count remains ${count}. No system notification was sent.`);
      break;
    }
    default:
      if (id === "context-menu" || id === "menu-bar" || id === "desktop-sidebar-source-list" || id === "outline-view") {
        button.classList.toggle("is-current");
        announce(sample, `${button.getAttribute("aria-label") ?? button.textContent?.trim()} selected.`);
      }
      break;
  }
}

document.querySelectorAll<HTMLElement>(".ui-sample").forEach(enhanceSample);

document.addEventListener("submit", (event) => {
  const form = event.target instanceof HTMLFormElement && event.target.matches("[data-login-form]")
    ? event.target
    : null;
  if (!form) return;
  event.preventDefault();
  const sample = form.closest<HTMLElement>(".ui-sample");
  const submit = form.querySelector<HTMLElement>("[data-action='submit-demo']");
  if (sample && submit) runAction(sample, submit);
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const hoverTrigger = target?.closest<HTMLElement>(".sample-hover-trigger");
  if (hoverTrigger) {
    const owner = hoverTrigger.closest<HTMLElement>(".sample-hover");
    if (owner) hoverCardState(owner).pointerType = event.pointerType;
  }
  const option = target?.closest<HTMLElement>(".sample-combobox-popup [role='option']");
  if (option && event.button === 0) {
    const input = option.closest<HTMLElement>(".sample-combobox")?.querySelector<HTMLInputElement>(".sample-combo-input");
    if (!input) return;
    event.preventDefault();
    selectComboboxOption(input, option);
    return;
  }

  const control = target?.closest<HTMLElement>(".sample-combobox-control");
  const input = control?.querySelector<HTMLInputElement>(".sample-combo-input");
  if (input && input.getAttribute("aria-expanded") !== "true") {
    input.focus({ preventScroll: true });
    openCombobox(input);
  }
});

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  document.querySelectorAll<HTMLElement>(".sample-editor-colors-demo[data-editor-custom-picker-open='true']").forEach((demo) => {
    const picker = demo.querySelector<HTMLElement>("[data-editor-custom-picker]");
    const trigger = demo.querySelector<HTMLButtonElement>("[data-action='editor-custom-toggle']");
    if (picker?.contains(target) || trigger?.contains(target)) return;
    setEditorCustomColorPickerOpen(demo, false);
  });

  document.querySelectorAll<HTMLElement>(".sample-command-demo[data-command-open='true']").forEach((root) => {
    const panel = root.querySelector<HTMLElement>(".sample-command-dialog");
    if (!panel || !root.contains(target)) {
      closeCommandPalette(root, false);
      return;
    }
    if (target === panel) closeCommandPalette(root);
  });

  document.querySelectorAll<HTMLElement>(".sample-popup-comparison [data-popup-owner][data-open='true']").forEach((owner) => {
    const demo = owner.closest<HTMLElement>(".sample-popup-comparison");
    if (!demo || owner.contains(target)) return;
    const key = owner.dataset.popupOwner;
    const panel = key ? demo.querySelector<HTMLElement>(`[data-popup-panel='${key}']`) : null;
    const trigger = key ? demo.querySelector<HTMLButtonElement>(`[data-popup-trigger='${key}']`) : null;
    if (!panel || !trigger) return;
    panel.hidden = true;
    panel.classList.remove("opens-up", "is-opening");
    delete owner.dataset.open;
    trigger.setAttribute("aria-expanded", "false");
    if (key === "combo") {
      const input = demo.querySelector<HTMLInputElement>("[role='combobox']");
      input?.setAttribute("aria-expanded", "false");
      input?.removeAttribute("aria-activedescendant");
    }
  });

  document.querySelectorAll<HTMLElement>(".sample-popover-macos[data-popover-open='true']").forEach((demo) => {
    if (!demo.contains(target)) setMacPopoverOpen(demo, false);
  });

  document.querySelectorAll<HTMLElement>(".sample-context-demo").forEach((demo) => {
    const menu = demo.querySelector<HTMLElement>(".sample-context-menu");
    const contextTarget = demo.querySelector<HTMLElement>(".sample-context-target");
    if (!menu || menu.hidden || menu.contains(target) || contextTarget?.contains(target)) return;
    closeContextMenu(demo);
  });

  document.querySelectorAll<HTMLElement>(".sample-search-demo").forEach((owner) => {
    if (owner.contains(target)) return;
    const menu = owner.querySelector<HTMLElement>(".sample-search-recents");
    if (menu && !menu.hidden) setSearchRecentsOpen(owner, false);
  });

  document.querySelectorAll<HTMLElement>(".sample-save-panel").forEach((owner) => {
    if (!owner.contains(target)) closeSavePanelMenus(owner.closest<HTMLElement>(".ui-sample") ?? owner);
  });

  document.querySelectorAll<HTMLElement>(".sample-token-field").forEach((field) => {
    if (field.contains(target)) return;
    closeRecipientSuggestions(field);
    clearRecipientSelection(field);
  });

  const multiTokenInput = target.closest<HTMLInputElement>(".sample-multi-token-input");
  if (multiTokenInput) {
    delete multiTokenInput.dataset.tokenDismissed;
    multiTokenInput.dataset.tokenExplicitOpen = "true";
    const field = multiTokenInput.closest<HTMLElement>(".sample-multi-token-field");
    const panel = field?.querySelector<HTMLElement>(".sample-multi-token-options");
    const showcase = field?.closest<HTMLElement>(".sample-multi-select-showcase");
    if (panel) setMultiSelectPanelOpen(panel, true, multiTokenInput);
    if (showcase) refreshMultiSelectShowcase(showcase);
  }

  const lightboxDialog = target.closest<HTMLDialogElement>(".sample-lightbox-dialog[open]");
  if (lightboxDialog && target === lightboxDialog) {
    const bounds = lightboxDialog.getBoundingClientRect();
    const outsideDialog = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outsideDialog) {
      closeLightbox(lightboxDialog);
      return;
    }
  }

  const scrimBackdrop = target.closest<HTMLElement>(".sample-scrim-backdrop");
  if (scrimBackdrop) {
    const sample = scrimBackdrop.closest<HTMLElement>(".ui-sample");
    if (sample) setScrimDemoOpen(sample, false, true);
    return;
  }

  const comboOption = target.closest<HTMLElement>(".sample-combobox-popup [role='option']");
  if (comboOption && event.detail === 0) {
    const input = comboOption.closest<HTMLElement>(".sample-combobox")?.querySelector<HTMLInputElement>(".sample-combo-input");
    if (input) selectComboboxOption(input, comboOption);
    return;
  }

  document.querySelectorAll<HTMLElement>(".sample-combobox").forEach((owner) => {
    if (owner.contains(target)) return;
    const input = owner.querySelector<HTMLInputElement>(".sample-combo-input");
    if (input?.getAttribute("aria-expanded") === "true") closeCombobox(input);
  });

  document.querySelectorAll<HTMLElement>(".sample-date-picker[data-calendar-open='true']").forEach((picker) => {
    if (!picker.contains(target)) setCalendarOpen(picker, false);
  });

  if (!target.closest("[data-open-demo]")) {
    document.querySelectorAll<HTMLElement>(".sample-multi-checkbox").forEach((owner) => {
      if (owner.contains(target)) return;
      const trigger = owner.querySelector<HTMLButtonElement>("[data-action='multi-dropdown-toggle']");
      const panel = owner.querySelector<HTMLElement>(".sample-multi-checkbox-options");
      if (trigger && panel && !panel.hidden) {
        setMultiSelectPanelOpen(panel, false, trigger);
      }
    });
    document.querySelectorAll<HTMLElement>(".sample-multi-token-field").forEach((owner) => {
      if (owner.contains(target)) return;
      const input = owner.querySelector<HTMLInputElement>(".sample-multi-token-input");
      const panel = owner.querySelector<HTMLElement>(".sample-multi-token-options");
      if (input && panel && !panel.hidden) {
        setMultiSelectPanelOpen(panel, false, input);
      }
    });
  }

  document.querySelectorAll<HTMLElement>(".sample-color-well").forEach((well) => {
    if (!well.contains(target)) closeColorWellPanels(well);
  });

  document.querySelectorAll<HTMLElement>(".sample-overlay-trio > div").forEach((owner) => {
    if (owner.contains(target)) return;
    const trigger = owner.querySelector<HTMLButtonElement>("[aria-haspopup='dialog'], [aria-haspopup='menu']");
    const panel = owner.querySelector<HTMLElement>(".sample-overlay-popover, [role='menu']");
    if (trigger && panel && !panel.hidden && !panel.classList.contains("sample-overlay-popover")) {
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll<HTMLElement>(".sample-overflow").forEach((owner) => {
    const trigger = owner.querySelector<HTMLButtonElement>("[aria-expanded='true']");
    const panel = owner.querySelector<HTMLElement>(".sample-menu:not([hidden]), .sample-overflow-navigation-panel:not([hidden]), .sample-overflow-command-panel:not([hidden])");
    if (!trigger || !panel || trigger.contains(target) || panel.contains(target)) return;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  });

  document.querySelectorAll<HTMLElement>(".sample-toolbar-demo").forEach((sample) => {
    const menu = sample.querySelector<HTMLElement>(".sample-toolbar-overflow-menu");
    if (!menu || menu.hidden || sample.contains(target)) return;
    setToolbarOverflowOpen(sample, false);
  });

  document.querySelectorAll<HTMLElement>(".sample-menu-bar").forEach((bar) => {
    if (bar.contains(target)) return;
    if (bar.querySelector(".sample-menu-bar-panel:not([hidden])")) closeMenuBar(bar);
  });

  const opener = target.closest<HTMLElement>("[data-open-demo]");
  if (opener && dialog && dialogTitle && dialogDescription && dialogStage) {
    const entry = opener.closest<HTMLElement>(".element-entry");
    const sample = entry?.querySelector<HTMLElement>(".element-preview .ui-sample");
    const title = entry?.querySelector(".element-name strong")?.textContent?.trim() ?? "Interface example";
    const description = entry?.querySelector(".element-content > p")?.textContent?.trim() ?? "Explore the visual example and its available controls.";
    if (sample) {
      dialogTitle.textContent = title;
      dialogDescription.textContent = description;
      const clone = sample.cloneNode(true);
      if (clone instanceof HTMLElement) {
        clone.dataset.sampleInstance = `dialog-${++sampleInstance}`;
        clone.querySelectorAll<HTMLElement>(".sample-color-well").forEach((well, index) => {
          refreshColorWellIds(well, `${clone.dataset.sampleInstance}-${index + 1}`);
        });
        if (clone.dataset.specimenId === "disclosure-triangle") initializeDisclosureSample(clone);
        if (clone.dataset.specimenId === "hover-card") initializeHoverCard(clone);
        if (clone.dataset.specimenId === "date-picker") enhanceCalendar(clone);
        if (clone.dataset.specimenId === "inbox-split-view") initializeInboxSplitView(clone);
        if (clone.dataset.specimenId === "scroll-view") initializeScrollView(clone);
        if (clone.dataset.specimenId === "search-field") initializeSearchField(clone);
        if (clone.dataset.specimenId === "save-panel") initializeSavePanel(clone);
        if (clone.dataset.specimenId === "token-field") initializeTokenField(clone);
        if (clone.dataset.specimenId === "sign-in-form") initializeLoginSample(clone);
        if (clone.dataset.specimenId === "multi-select") initializeMultiSelectIds(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "combobox-autocomplete-typeahead") initializeComboboxSample(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "command-palette") initializeCommandPalette(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "accordion-disclosure") initializeAccordionSample(clone);
        if (clone.dataset.specimenId === "tabs") initializeTabsSample(clone);
        if (clone.dataset.specimenId === "empty-state") initializeEmptyStateSample(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "toggle-group-segmented-control") initializeToggleGroup(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "segmented-control-macos") initializeMacSegmentedControl(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "rating-capacity-level-indicator") initializeLevelIndicator(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "column-view-browser") initializeColumnBrowser(clone);
        if (clone.dataset.specimenId === "form-field") initializeFormFieldSample(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "drag-and-drop") initializeDragDropSample(clone);
        if (clone.dataset.specimenId === "toast-snackbar") initializeToastSample(clone);
        if (clone.dataset.specimenId === "modal-dialog-drawer-sheet") initializeSurfaceDemo(clone);
        if (clone.dataset.specimenId === "popover-dropdown-tooltip") initializeOverlayTrio(clone);
        if (clone.dataset.specimenId === "scrim-backdrop-overlay") initializeScrimDemo(clone);
        if (clone.dataset.specimenId === "empty-trash-alert") initializeEmptyTrashAlert(clone);
        if (clone.dataset.specimenId === "volume-slider") initializeVolumeSlider(clone);
        if (clone.dataset.specimenId === "hamburger-menu-nav-drawer") initializeNavigationDrawer(clone);
        if (clone.dataset.specimenId === "three-dots-overflow-menu") initializeThreeDotsSample(clone);
        if (clone.dataset.specimenId === "menu-bar") initializeMenuBar(clone);
        if (clone.dataset.specimenId === "menu-bar-extra") initializeMenuBar(clone);
        if (clone.dataset.specimenId === "context-menu") initializeContextMenu(clone);
        if (clone.dataset.specimenId === "skeleton-spinner") initializeLoadingMotion(clone);
        if (clone.dataset.specimenId === "focus-ring-focus-visible") initializeWebFocusRing(clone);
        if (clone.dataset.specimenId === "focus-ring-macos") initializeMacosFocusRing(clone);
        if (clone.dataset.specimenId === "inspector") initializeInspector(clone);
        if (clone.dataset.specimenId === "editor-colors-panel") initializeEditorColorsPanel(clone);
        if (clone.dataset.specimenId === "delete-sheet") initializeDeleteSheet(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "toolbar-unified-title-bar") initializeToolbarSample(clone);
        if (clone.dataset.specimenId === "visual-effect-material-vibrancy") initializeVibrancyDemo(clone);
        if (clone.dataset.specimenId === "popover-macos") {
          const popoverDemo = clone.querySelector<HTMLElement>(".sample-popover-macos");
          if (popoverDemo) popoverDemo.dataset.popoverOpen = "true";
          initializeMacPopoverDemo(clone, clone.dataset.sampleInstance);
        }
        if (clone.dataset.specimenId === "popup-pulldown-combo-box") initializePopupPullDownCombo(clone, clone.dataset.sampleInstance);
        if (clone.dataset.specimenId === "steps") initializeStepsSample(clone);
        if (clone.dataset.specimenId === "carousel") initializeCarousel(clone);
        if (clone.dataset.specimenId === "avatar-group") initializeAvatarGroupSample(clone);
        if (clone.dataset.specimenId === "progress-ring-spinner-bar") {
          initializeProgressDemo(clone, { autoStart: true, reset: true });
        }
        clone.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((input) => {
          input.name = `${input.name}-${sampleInstance}`;
        });
      }
      dialogStage.replaceChildren(clone);
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "scrim-backdrop-overlay") initializeScrimDemo(clone);
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "scrollspy") initializeScrollspy(clone);
      dialog.removeAttribute("data-anchor-top");
      dialog.style.removeProperty("--demo-dialog-anchor-top");
      dialog.showModal();
      if (clone instanceof HTMLElement && clone.querySelector(".sample-bottom-nav-demo")) {
        dialog.style.setProperty("--demo-dialog-anchor-top", `${dialog.getBoundingClientRect().top}px`);
        dialog.dataset.anchorTop = "true";
      }
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "scrim-backdrop-overlay") {
        clone.querySelector<HTMLButtonElement>(".sample-scrim-dialog:not([hidden]) .sample-scrim-close")?.focus({ preventScroll: true });
      }
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "focus-ring-macos") {
        clone.querySelector<HTMLInputElement>(".sample-focus-input")?.focus({ preventScroll: true });
      }
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "combobox-autocomplete-typeahead") {
        const input = clone.querySelector<HTMLInputElement>(".sample-combo-input");
        if (input) openCombobox(input);
      }
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "command-palette") {
        const commandRoot = clone.querySelector<HTMLElement>(".sample-command-demo");
        const trigger = commandRoot?.querySelector<HTMLElement>(".sample-command-trigger");
        if (commandRoot && trigger) openCommandPalette(commandRoot, trigger);
      }
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "text-scramble") initializeTextScramble(clone);
    }
    return;
  }

  const scrollspyLink = target.closest<HTMLAnchorElement>(".sample-scrollspy nav a[data-scrollspy-key]");
  if (scrollspyLink) {
    const sample = scrollspyLink.closest<HTMLElement>(".ui-sample");
    const content = sample?.querySelector<HTMLElement>(".sample-scrollspy-content");
    const key = scrollspyLink.dataset.scrollspyKey;
    const section = key
      ? Array.from(content?.querySelectorAll<HTMLElement>("section[data-scrollspy-key]") ?? [])
        .find((item) => item.dataset.scrollspyKey === key)
      : null;
    const heading = section?.querySelector<HTMLElement>(":scope > h4");
    if (sample && content && heading && key) {
      event.preventDefault();
      scrollspyNavigationHandlers.get(sample)?.(key);
      const top = heading.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
      content.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
      heading.focus({ preventScroll: true });
    }
    return;
  }

  if (target.closest("[data-close-demo]") && dialog?.open) {
    dialog.close();
    return;
  }

  const actionButton = target.closest<HTMLElement>("[data-action]");
  const actionLightboxDialog = actionButton?.closest<HTMLDialogElement>(".sample-lightbox-dialog");
  const sample = actionButton?.closest<HTMLElement>(".ui-sample")
    ?? (actionLightboxDialog ? lightboxDialogOwners.get(actionLightboxDialog)?.closest<HTMLElement>(".ui-sample") : null);
  if (actionButton && sample) {
    if (actionButton.dataset.action === "submit-demo" && actionButton instanceof HTMLButtonElement && actionButton.type === "submit") return;
    runAction(sample, actionButton, event);
  }
});

document.addEventListener("input", (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const sample = input?.closest<HTMLElement>(".ui-sample");
  if (!input || !sample) return;

  if (input.hasAttribute("data-login-field")) {
    const form = input.closest<HTMLFormElement>("[data-login-form]");
    if (form?.dataset.validationAttempted === "true") validateLoginForm(sample);
    return;
  }

  if (input.hasAttribute("data-form-field")) {
    updateFormFieldState(input, true);
    return;
  }

  switch (input.dataset.inputAction) {
    case "add-recipient": {
      const field = input.closest<HTMLElement>(".sample-token-field");
      if (!field) break;
      clearRecipientSelection(field);
      if (/[,;]/.test(input.value)) {
        const parts = input.value.split(/[,;]/);
        const remainder = parts.pop() ?? "";
        input.value = "";
        const pending: string[] = [];
        parts.forEach((part) => {
          if (part.trim() && !commitRecipient(field, part)) pending.push(part.trim());
        });
        input.value = [...pending, remainder].filter(Boolean).join(", ");
      }
      updateRecipientSuggestions(field);
      break;
    }
    case "multi-select-filter": {
      const field = input.closest<HTMLElement>(".sample-multi-token-field");
      const panel = field?.querySelector<HTMLElement>(".sample-multi-token-options");
      const showcase = field?.closest<HTMLElement>(".sample-multi-select-showcase");
      delete input.dataset.tokenDismissed;
      input.dataset.tokenExplicitOpen = "true";
      if (panel) setMultiSelectPanelOpen(panel, true, input);
      if (showcase) refreshMultiSelectShowcase(showcase);
      break;
    }
    case "combobox-filter": {
      input.dataset.selectionCommitted = "false";
      filterCombobox(input, true);
      break;
    }
    case "command-filter": {
      if (event instanceof InputEvent && event.isComposing) break;
      filterCommandPalette(input, true);
      break;
    }
    case "search":
      updateSearchField(sample);
      break;
    case "save-name":
      updateSavePanel(sample);
      break;
    case "inbox-search": {
      const root = input.closest<HTMLElement>(".sample-inbox");
      if (!root) break;
      renderInboxSplitView(root);
      if (root.dataset.selectedMessage === "") root.classList.remove("is-detail-open");
      break;
    }
    case "volume": {
      updateVolumeSlider(sample);
      break;
    }
    case "cursor-adjust": {
      const tile = input.closest<HTMLElement>(".sample-cursor-resize-tile");
      const surface = tile?.querySelector<HTMLElement>(".sample-cursor-adjust-surface");
      const output = tile?.querySelector<HTMLOutputElement>(".sample-cursor-adjust-control output");
      if (!tile || !surface) break;
      const value = Number(input.value);
      const axis = tile.dataset.cursorAdjustAxis;
      if (axis === "x" || axis === "both") surface.style.setProperty("--cursor-adjust-width", `${value}%`);
      if (axis === "y") surface.style.setProperty("--cursor-adjust-height", `${value}px`);
      if (axis === "both") surface.style.setProperty("--cursor-adjust-height", `${Math.round(value * 0.46)}px`);
      if (output) output.value = axis === "y" ? `${value} px` : `${value}%`;
      break;
    }
    case "macos-popover-volume": {
      const demo = input.closest<HTMLElement>(".sample-popover-macos");
      const output = demo?.querySelector<HTMLOutputElement>("[data-popover-volume-output]");
      if (output) output.value = `${input.value}%`;
      input.setAttribute("aria-valuetext", `${input.value}%`);
      break;
    }
    case "volume-ticks": {
      updateKeyRepeatSlider(sample);
      break;
    }
    case "level-value": {
      const meter = input.closest<HTMLElement>(".sample-level-card")?.querySelector<HTMLElement>("[role='meter']");
      if (meter) updateLevelMeter(meter, Number(input.value));
      break;
    }
    case "color-hex": {
      input.removeAttribute("aria-invalid");
      const error = sample.querySelector<HTMLElement>(".sample-color-error");
      if (error) error.hidden = true;
      break;
    }
    case "color-hue": {
      const well = input.closest<HTMLElement>(".sample-color-well");
      if (!well) break;
      renderColorPickerState(
        well,
        Number(input.value),
        Number(well.dataset.pickerSaturation ?? 100),
        Number(well.dataset.pickerBrightness ?? 100),
      );
      break;
    }
    case "editor-color-hue": {
      const demo = input.closest<HTMLElement>(".sample-editor-colors-demo");
      if (!demo) break;
      const color = renderEditorCustomColorPicker(
        demo,
        Number(input.value),
        Number(demo.dataset.editorPickerSaturation ?? 100),
        Number(demo.dataset.editorPickerBrightness ?? 100),
      );
      demo.querySelectorAll<HTMLInputElement>("[data-input-action='editor-color']").forEach((option) => { option.checked = false; });
      updateEditorDocumentColor(demo, color, "Custom color", false);
      break;
    }
    case "editor-custom-hex": {
      input.removeAttribute("aria-invalid");
      const error = sample.querySelector<HTMLElement>("[data-editor-color-error]");
      if (error) error.hidden = true;
      break;
    }
    default:
      break;
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;

  if (target.matches(".sample-mac-segmented-columns") && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const step = target.firstElementChild?.getBoundingClientRect().width ?? target.clientWidth;
    const left = event.key === "Home" ? 0 : event.key === "End" ? target.scrollWidth
      : target.scrollLeft + (event.key === "ArrowRight" ? step : -step);
    target.scrollTo({ left, behavior: "instant" });
    return;
  }

  const commandRoot = target.closest<HTMLElement>(".sample-command-demo");
  if (commandRoot && !event.isComposing && !event.altKey
    && (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "k") {
    event.preventDefault();
    event.stopImmediatePropagation();
    const trigger = commandRoot.querySelector<HTMLElement>(".sample-command-trigger");
    if (trigger) openCommandPalette(commandRoot, trigger);
    return;
  }

  if (commandRoot?.dataset.commandOpen === "true") {
    const panel = target.closest<HTMLElement>(".sample-command-dialog");
    const input = commandRoot.querySelector<HTMLInputElement>(".sample-command-input");
    const close = commandRoot.querySelector<HTMLButtonElement>(".sample-command-close");
    if (panel && event.key === "Escape" && !event.isComposing) {
      event.preventDefault();
      closeCommandPalette(commandRoot);
      return;
    }
    if (panel && event.key === "Tab") {
      if (event.shiftKey && target === close) {
        event.preventDefault();
        input?.focus({ preventScroll: true });
        return;
      }
      if (!event.shiftKey && target === input) {
        event.preventDefault();
        close?.focus({ preventScroll: true });
        return;
      }
    }
    if (input && target === input && !event.isComposing) {
      const visible = commandPaletteOptions(commandRoot).filter((option) => !option.hidden);
      const active = visible.find((option) => option.id === input.getAttribute("aria-activedescendant")) ?? null;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (visible.length) {
          const currentIndex = active ? visible.indexOf(active) : -1;
          const step = event.key === "ArrowDown" ? 1 : -1;
          const nextIndex = (currentIndex + step + visible.length) % visible.length;
          setCommandPaletteActive(commandRoot, visible[nextIndex] ?? null);
          event.preventDefault();
        }
        return;
      }
      if (event.key === "Enter" && active) {
        event.preventDefault();
        selectCommandPaletteOption(active);
        return;
      }
    }
  }

  const sourceListItem = target.closest<HTMLButtonElement>(".sample-sidebar-demo .sample-source-list button[data-sidebar-key]");
  if (sourceListItem && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    const nav = sourceListItem.closest<HTMLElement>(".sample-source-list");
    const items = Array.from(nav?.querySelectorAll<HTMLButtonElement>("button[data-sidebar-key]") ?? []);
    const currentIndex = items.indexOf(sourceListItem);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : Math.max(0, Math.min(items.length - 1, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
    const next = items[nextIndex];
    if (next && next !== sourceListItem) {
      event.preventDefault();
      next.focus({ preventScroll: true });
      next.click();
    }
    return;
  }

  const contextTarget = target.closest<HTMLButtonElement>(".sample-context-target");
  if (contextTarget && (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
    const demo = contextTarget.closest<HTMLElement>(".sample-context-demo");
    if (demo) {
      event.preventDefault();
      contextTarget.classList.add("is-selected");
      openContextMenu(demo, contextTarget);
      return;
    }
  }

  const contextMenuItem = target.closest<HTMLElement>(".sample-context-menu [role='menuitem']");
  if (contextMenuItem && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    const menu = contextMenuItem.closest<HTMLElement>("[role='menu']");
    const items = Array.from(menu?.querySelectorAll<HTMLElement>(":scope > [role='menuitem'], :scope > .sample-context-submenu > [role='menuitem']") ?? [])
      .filter((item) => !item.closest("[hidden]") && !item.hasAttribute("disabled"));
    const index = items.indexOf(contextMenuItem);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    if (items[nextIndex]) {
      event.preventDefault();
      items[nextIndex].focus({ preventScroll: true });
    }
    return;
  }
  if (contextMenuItem && event.key === "ArrowRight" && contextMenuItem.matches("[data-action='context-submenu-toggle']")) {
    const demo = contextMenuItem.closest<HTMLElement>(".sample-context-demo");
    if (!demo) return;
    event.preventDefault();
    setContextSubmenuOpen(demo, contextMenuItem, true, true);
    return;
  }
  if (contextMenuItem && event.key === "ArrowLeft" && contextMenuItem.closest(".sample-context-submenu-panel")) {
    const submenu = contextMenuItem.closest<HTMLElement>(".sample-context-submenu");
    const trigger = submenu?.querySelector<HTMLButtonElement>("[data-action='context-submenu-toggle']");
    const panel = submenu?.querySelector<HTMLElement>(".sample-context-submenu-panel");
    if (panel && trigger) {
      event.preventDefault();
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus({ preventScroll: true });
      return;
    }
  }

  const outlineItem = target.closest<HTMLElement>(".sample-outline [role='treeitem']");
  if (outlineItem) {
    const tree = outlineItem.closest<HTMLElement>(".sample-outline[role='tree']");
    if (!tree) return;
    const visibleItems = visibleOutlineItems(tree);
    const currentIndex = visibleItems.indexOf(outlineItem);
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? visibleItems.length - 1
        : Math.min(visibleItems.length - 1, Math.max(0, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
      const next = visibleItems[nextIndex];
      if (next) {
        event.preventDefault();
        selectOutlineItem(next, true);
      }
      return;
    }

    if (event.key === "ArrowRight") {
      if (outlineItem.hasAttribute("aria-expanded")) {
        event.preventDefault();
        if (outlineItem.getAttribute("aria-expanded") !== "true") toggleOutlineBranch(outlineItem);
        else {
          const firstChild = outlineItem.querySelector<HTMLElement>(":scope > [role='group'] > [role='treeitem']");
          if (firstChild) selectOutlineItem(firstChild, true);
        }
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      if (outlineItem.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        toggleOutlineBranch(outlineItem);
      } else {
        const parentGroup = outlineItem.parentElement?.getAttribute("role") === "group" ? outlineItem.parentElement : null;
        const parentItem = parentGroup?.parentElement?.closest<HTMLElement>("[role='treeitem']");
        if (parentItem) {
          event.preventDefault();
          selectOutlineItem(parentItem, true);
        }
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (event.key === "Enter" && outlineItem.hasAttribute("aria-expanded")) toggleOutlineBranch(outlineItem);
      else selectOutlineItem(outlineItem, true);
      return;
    }
  }

  const columnOption = target.closest<HTMLButtonElement>(".sample-column-pane [role='option'][data-column-id]");
  if (columnOption) {
    const browser = columnOption.closest<HTMLElement>("[data-column-browser]");
    const viewport = browser?.querySelector<HTMLElement>("[data-column-view]");
    const columnIndex = Number(columnOption.dataset.columnIndex);
    if (browser && viewport && Number.isInteger(columnIndex)) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        const list = columnOption.closest<HTMLElement>("[role='listbox']");
        const options = Array.from(list?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []);
        const index = options.indexOf(columnOption);
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
          : Math.min(options.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)));
        const next = options[nextIndex];
        if (next) {
          event.preventDefault();
          selectColumnBrowserItem(next);
        }
        return;
      }

      if (event.key === "ArrowLeft" && columnIndex > 0) {
        const previousPane = viewport.querySelector<HTMLElement>(`.sample-column-pane[data-column-index='${columnIndex - 1}']`);
        const previousSelection = previousPane?.querySelector<HTMLButtonElement>("[role='option'][aria-selected='true']")
          ?? previousPane?.querySelector<HTMLButtonElement>("[role='option']");
        if (previousSelection) {
          event.preventDefault();
          previousSelection.focus({ preventScroll: true });
        }
        return;
      }

      if (event.key === "ArrowRight" && columnOption.dataset.hasChildren === "true") {
        event.preventDefault();
        if (columnOption.getAttribute("aria-selected") !== "true") {
          selectColumnBrowserItem(columnOption, true);
        } else {
          const nextPane = viewport.querySelector<HTMLElement>(`.sample-column-pane[data-column-index='${columnIndex + 1}']`);
          const nextSelection = nextPane?.querySelector<HTMLButtonElement>("[role='option'][aria-selected='true']")
            ?? nextPane?.querySelector<HTMLButtonElement>("[role='option']");
          nextSelection?.focus({ preventScroll: true });
        }
        return;
      }
    }
  }

  const focusedSavePanel = target.closest<HTMLElement>(".sample-save-panel");
  if (focusedSavePanel) {
    const sample = focusedSavePanel.closest<HTMLElement>(".ui-sample") ?? focusedSavePanel;
    const locationMenu = sample.querySelector<HTMLElement>("[data-save-location-menu]");
    const formatMenu = sample.querySelector<HTMLElement>("[data-save-format-menu]");
    const openMenu = locationMenu && !locationMenu.hidden ? locationMenu : formatMenu && !formatMenu.hidden ? formatMenu : null;
    const menuItem = target.closest<HTMLButtonElement>("[role='menuitemradio']");
    if (event.key === "Escape") {
      if (openMenu) {
        event.preventDefault();
        closeSavePanelMenus(sample);
        const trigger = openMenu === locationMenu
          ? sample.querySelector<HTMLButtonElement>("[data-action='save-location-toggle']")
          : sample.querySelector<HTMLButtonElement>("[data-action='save-format-toggle']");
        trigger?.focus({ preventScroll: true });
        return;
      }
      const browser = sample.querySelector<HTMLElement>("[data-save-browser]");
      if (browser && !browser.hidden) {
        event.preventDefault();
        sample.querySelector<HTMLButtonElement>("[data-action='save-disclosure']")?.click();
        return;
      }
    }
    if (event.key === "Enter" && target.matches("[data-input-action='save-name']")) {
      const save = sample.querySelector<HTMLButtonElement>("[data-action='save-demo']:not(:disabled)");
      if (save) {
        event.preventDefault();
        save.click();
        return;
      }
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp")
      && target.matches("[data-action='save-location-toggle'], [data-action='save-format-toggle']")) {
      event.preventDefault();
      const menu = target.matches("[data-action='save-location-toggle']") ? locationMenu : formatMenu;
      if (menu && !menu.hidden) {
        (menu.querySelector<HTMLButtonElement>("[aria-checked='true']")
          ?? menu.querySelector<HTMLButtonElement>("[role='menuitemradio']"))?.focus({ preventScroll: true });
      } else {
        (target as HTMLButtonElement).click();
      }
      return;
    }
    if (menuItem && openMenu && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = Array.from(openMenu.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']"));
      const currentIndex = items.indexOf(menuItem);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      event.preventDefault();
      items[nextIndex]?.focus({ preventScroll: true });
      return;
    }
  }

  const tokenField = target.closest<HTMLElement>(".sample-token-field");
  if (tokenField && target.matches(".sample-token-input")) {
    const input = target as HTMLInputElement;
    const list = tokenField.querySelector<HTMLElement>("[data-token-options]");
    const options = Array.from(list?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []);
    const activeIndex = Number(tokenField.dataset.tokenActiveIndex ?? -1);

    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
      event.preventDefault();
      const nextIndex = activeIndex < 0
        ? (event.key === "ArrowDown" ? 0 : options.length - 1)
        : (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      options.forEach((option, index) => option.setAttribute("aria-selected", String(index === nextIndex)));
      tokenField.dataset.tokenActiveIndex = String(nextIndex);
      input.setAttribute("aria-activedescendant", options[nextIndex]?.id ?? "");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const active = options.find((option) => option.getAttribute("aria-selected") === "true");
      commitRecipient(tokenField, active?.dataset.tokenValue ?? input.value);
      return;
    }

    if (event.key === "Escape" && list && !list.hidden) {
      event.preventDefault();
      closeRecipientSuggestions(tokenField);
      setRecipientMessage(tokenField, "Recipient suggestions closed.");
      return;
    }

    if (event.key === "Backspace" && !input.value) {
      const selected = tokenField.querySelector<HTMLButtonElement>(".sample-token-select[aria-pressed='true']");
      if (selected) {
        event.preventDefault();
        removeRecipientToken(tokenField, selected);
        return;
      }
      const tokens = Array.from(tokenField.querySelectorAll<HTMLButtonElement>(".sample-token-select"));
      const last = tokens.at(-1);
      if (last) {
        event.preventDefault();
        closeRecipientSuggestions(tokenField);
        last.setAttribute("aria-pressed", "true");
        setRecipientMessage(tokenField, `${last.dataset.tokenLabel ?? "Recipient"} selected. Press Backspace to remove or Return to edit.`);
        const sample = tokenField.closest<HTMLElement>(".ui-sample");
        if (sample) announce(sample, `${last.dataset.tokenLabel ?? "Recipient"} selected.`);
        return;
      }
    }

    if (event.key === "ArrowLeft" && input.selectionStart === 0 && input.selectionEnd === 0) {
      const last = Array.from(tokenField.querySelectorAll<HTMLButtonElement>(".sample-token-select")).at(-1);
      if (last) {
        event.preventDefault();
        closeRecipientSuggestions(tokenField);
        last.focus({ preventScroll: true });
      }
    }
  }

  const tokenSelect = target.closest<HTMLButtonElement>(".sample-token-select");
  if (tokenField && tokenSelect) {
    const tokens = Array.from(tokenField.querySelectorAll<HTMLButtonElement>(".sample-token-select, .sample-token-input"));
    const currentIndex = tokens.indexOf(tokenSelect);
    if (event.key === "Enter") {
      event.preventDefault();
      if (tokenSelect.getAttribute("aria-pressed") === "true") editRecipientToken(tokenField, tokenSelect);
      else {
        clearRecipientSelection(tokenField);
        tokenSelect.setAttribute("aria-pressed", "true");
        setRecipientMessage(tokenField, `${tokenSelect.dataset.tokenLabel ?? "Recipient"} selected. Press Return again to edit or Backspace to remove.`);
      }
      return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      removeRecipientToken(tokenField, tokenSelect);
      return;
    }
    if (event.key === "Escape" && tokenSelect.getAttribute("aria-pressed") === "true") {
      event.preventDefault();
      clearRecipientSelection(tokenField);
      setRecipientMessage(tokenField, `${tokenSelect.dataset.tokenLabel ?? "Recipient"} token deselected.`);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const next = tokens[currentIndex + (event.key === "ArrowRight" ? 1 : -1)];
      if (next) {
        event.preventDefault();
        next.focus({ preventScroll: true });
      }
    }
  }

  const focusedSearchDemo = target.closest<HTMLElement>(".sample-search-demo");
  const modalSearchDemo = document.querySelector<HTMLElement>("dialog[open] .sample-search-demo");
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "f") {
    const shortcutDemo = focusedSearchDemo ?? modalSearchDemo;
    const searchInput = shortcutDemo?.querySelector<HTMLInputElement>(".sample-search-input");
    if (searchInput) {
      event.preventDefault();
      searchInput.focus({ preventScroll: true });
      return;
    }
  }

  if (focusedSearchDemo) {
    const searchInput = focusedSearchDemo.querySelector<HTMLInputElement>(".sample-search-input");
    const searchMenu = focusedSearchDemo.querySelector<HTMLElement>(".sample-search-recents");
    const searchTrigger = focusedSearchDemo.querySelector<HTMLButtonElement>(".sample-search-recent-trigger");
    const menuItem = target.closest<HTMLButtonElement>(".sample-search-recents [role='menuitem']");
    if (event.key === "Escape" && searchMenu && !searchMenu.hidden) {
      event.preventDefault();
      setSearchRecentsOpen(focusedSearchDemo, false);
      searchTrigger?.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Escape" && target === searchInput && searchInput.value) {
      event.preventDefault();
      searchInput.value = "";
      updateSearchField(focusedSearchDemo);
      return;
    }
    if (event.key === "Enter" && target === searchInput && searchInput.value.trim()) {
      const query = searchInput.value.trim();
      addSearchRecent(focusedSearchDemo, query);
      const status = focusedSearchDemo.querySelector<HTMLElement>("[data-search-status]");
      if (status) status.textContent = `Saved ${query} to recent searches.`;
      return;
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && searchMenu?.hidden
      && (target === searchInput || target === searchTrigger)) {
      event.preventDefault();
      setSearchRecentsOpen(focusedSearchDemo, true, true);
      return;
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && searchMenu && !searchMenu.hidden
      && (target === searchInput || target === searchTrigger)) {
      event.preventDefault();
      const items = Array.from(searchMenu.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not([aria-disabled='true'])"));
      (event.key === "ArrowDown" ? items[0] : items.at(-1))?.focus({ preventScroll: true });
      return;
    }
    if (menuItem && searchMenu && !searchMenu.hidden
      && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = Array.from(searchMenu.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not([aria-disabled='true'])"));
      const currentIndex = items.indexOf(menuItem);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      event.preventDefault();
      items[nextIndex]?.focus({ preventScroll: true });
      return;
    }
  }

  const sample = target.closest<HTMLElement>(".ui-sample");

  if (sample?.dataset.specimenId === "hamburger-menu-nav-drawer") {
    const demo = sample.querySelector<HTMLElement>(".sample-navigation-demo");
    const drawer = demo?.querySelector<HTMLElement>(".sample-navigation-panel");
    if (demo?.dataset.drawerOpen === "true" && event.key === "Escape") {
      event.preventDefault();
      closeNavigationDrawer(demo);
      return;
    }
    if (demo?.dataset.drawerOpen === "true" && drawer && event.key === "Tab") {
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first && last && (!drawer.contains(target) || (event.shiftKey ? target === first : target === last))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }
    }
  }

  if (sample?.dataset.specimenId === "scrim-backdrop-overlay") {
    const demo = sample.querySelector<HTMLElement>(".sample-scrim-demo");
    const isOpen = demo?.dataset.scrimOpen === "true";
    const isClosing = demo?.dataset.scrimClosing === "true";
    if (isOpen && event.key === "Escape") {
      event.preventDefault();
      setScrimDemoOpen(sample, false, true);
      return;
    }
    const panel = demo?.querySelector<HTMLElement>(".sample-scrim-dialog");
    if ((isOpen || isClosing) && panel && sample.closest(".element-demo-dialog") && event.key === "Tab") {
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex='-1'])",
      )).filter((element) => !element.closest("[hidden], [inert]") && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first && last && (!panel.contains(target) || (event.shiftKey ? target === first : target === last))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }
    }
  }

  const lightboxDialog = target.closest<HTMLDialogElement>(".sample-lightbox-dialog[open]");
  if (lightboxDialog && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
    const root = lightboxDialogOwners.get(lightboxDialog) ?? lightboxDialog.closest<HTMLElement>(".sample-lightbox");
    if (root) {
      event.preventDefault();
      const current = Number(root.dataset.lightboxIndex ?? 0);
      updateLightbox(root, current + (event.key === "ArrowRight" ? 1 : -1), lightboxDialog);
    }
    return;
  }

  const carouselTab = target.closest<HTMLButtonElement>(".sample-carousel-picker [role='tab']");
  if (carouselTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const tabs = Array.from(carouselTab.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? []);
    const currentIndex = tabs.indexOf(carouselTab);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
    return;
  }

  const windowTab = target.closest<HTMLButtonElement>(".sample-window-tabs [role='tab']");
  if (windowTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const tabs = Array.from(windowTab.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? []);
    const currentIndex = tabs.indexOf(windowTab);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
    return;
  }

  const inboxOption = target.closest<HTMLButtonElement>(".sample-inbox-message[role='option']");
  if (inboxOption && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    const root = inboxOption.closest<HTMLElement>(".sample-inbox");
    const visibleRows = root ? inboxVisibleRows(root) : [];
    const currentIndex = visibleRows.indexOf(inboxOption);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? visibleRows.length - 1
      : Math.min(visibleRows.length - 1, Math.max(0, currentIndex + (event.key === "ArrowDown" ? 1 : -1)));
    if (visibleRows[nextIndex]) {
      event.preventDefault();
      visibleRows[nextIndex]?.focus();
      visibleRows[nextIndex]?.click();
      return;
    }
  }

  const menuBar = target.closest<HTMLElement>(".sample-menu-bar");
  const menuBarItem = target.closest<HTMLElement>(".sample-menu-bar-panel [role='menuitem']");
  const appMenuTrigger = target.closest<HTMLElement>(".sample-menu-bar-app-menus [role='menuitem']");
  if ((menuBarItem || appMenuTrigger) && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    const openTrigger = menuBar?.querySelector<HTMLElement>("[data-action='toggle-menubar'][aria-expanded='true']");
    const isAppMenu = Boolean(openTrigger?.closest(".sample-menu-bar-app-menus") || appMenuTrigger);
    const siblings = isAppMenu
      ? Array.from(menuBar?.querySelectorAll<HTMLElement>(".sample-menu-bar-app-menus [role='menuitem']") ?? [])
      : [];
    const current = openTrigger && siblings.includes(openTrigger) ? openTrigger : appMenuTrigger;
    const currentIndex = current ? siblings.indexOf(current) : -1;
    const nextIndex = currentIndex < 0 ? -1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + siblings.length) % siblings.length;
    if (menuBar && siblings[nextIndex]) {
      event.preventDefault();
      const next = siblings[nextIndex];
      next.focus({ preventScroll: true });
      if (menuBarItem || openTrigger) next.click();
      return;
    }
  }

  if (menuBar && target.matches("[data-action='toggle-menubar']") && ["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    target.click();
    return;
  }

  if (target.matches(".sample-combo-input")) {
    const input = target as HTMLInputElement;
    const expanded = input.getAttribute("aria-expanded") === "true";
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!expanded) {
        openCombobox(input);
        if (event.key === "ArrowUp") {
          const options = comboboxOptions(input).filter((option) => !option.hidden);
          setComboboxActive(input, options.at(-1) ?? null);
        }
        return;
      }

      const options = comboboxOptions(input).filter((option) => !option.hidden);
      if (options.length === 0) return;
      const activeIndex = options.findIndex((option) => option.id === input.getAttribute("aria-activedescendant"));
      const nextIndex = (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      setComboboxActive(input, options[nextIndex] ?? null);
      return;
    }

    if (event.key === "Enter" && expanded) {
      const activeId = input.getAttribute("aria-activedescendant");
      const activeOption = comboboxOptions(input).find((option) => option.id === activeId && !option.hidden);
      if (activeOption) {
        event.preventDefault();
        selectComboboxOption(input, activeOption);
      }
      return;
    }

    if (event.key === "Escape" && expanded) {
      event.preventDefault();
      closeCombobox(input);
      return;
    }

    return;
  }

  if (target.matches(".sample-toggle-group[role='radiogroup'] [role='radio']")) {
    const group = target.closest<HTMLElement>(".sample-toggle-group[role='radiogroup']");
    const radios = Array.from(group?.querySelectorAll<HTMLElement>("[role='radio']") ?? []);
    const index = radios.indexOf(target);
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % radios.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + radios.length) % radios.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = radios.length - 1;
    else return;

    event.preventDefault();
    const nextRadio = radios[nextIndex];
    if (nextRadio) selectToggleRadio(nextRadio, true);
    return;
  }

  if (target.matches(".sample-mac-segmented-control[role='radiogroup'] [role='radio']")) {
    const group = target.closest<HTMLElement>(".sample-mac-segmented-control");
    const radios = Array.from(group?.querySelectorAll<HTMLButtonElement>("[role='radio']") ?? []);
    const index = radios.indexOf(target as HTMLButtonElement);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? radios.length - 1
      : event.key === "ArrowRight" ? (index + 1) % radios.length
      : event.key === "ArrowLeft" ? (index - 1 + radios.length) % radios.length : -1;
    if (nextIndex < 0 || radios.length === 0) return;
    event.preventDefault();
    const next = radios[nextIndex];
    if (next) selectMacSegment(next, true);
    return;
  }

  if (target.matches(".sample-level-rating-group[role='radiogroup'] [role='radio']")
    && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const group = target.closest<HTMLElement>(".sample-level-rating-group");
    const sample = target.closest<HTMLElement>(".ui-sample");
    const radios = Array.from(group?.querySelectorAll<HTMLElement>("[role='radio']") ?? []);
    const index = radios.indexOf(target);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? radios.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + radios.length) % radios.length;
    const next = radios[nextIndex];
    if (sample && next) {
      event.preventDefault();
      selectLevelRating(next, true);
      announce(sample, `Rating set to ${next.dataset.value} of ${radios.length} stars.`);
    }
    return;
  }

  const calendarDay = target.closest<HTMLButtonElement>(".sample-calendar-grid [data-date]");
  const calendar = calendarDay?.closest<HTMLElement>(".sample-calendar");
  if (calendarDay?.dataset.date && calendar && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
    const nextDate = fromCivilDate(calendarDay.dataset.date);
    if (event.key === "ArrowLeft") nextDate.setDate(nextDate.getDate() - 1);
    else if (event.key === "ArrowRight") nextDate.setDate(nextDate.getDate() + 1);
    else if (event.key === "ArrowUp") nextDate.setDate(nextDate.getDate() - 7);
    else if (event.key === "ArrowDown") nextDate.setDate(nextDate.getDate() + 7);
    else if (event.key === "Home") nextDate.setDate(nextDate.getDate() - nextDate.getDay());
    else if (event.key === "End") nextDate.setDate(nextDate.getDate() + (6 - nextDate.getDay()));
    else {
      const day = nextDate.getDate();
      const monthOffset = (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1);
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + monthOffset);
      nextDate.setDate(Math.min(day, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
    }

    event.preventDefault();
    const nextValue = toCivilDate(nextDate);
    calendar.dataset.calendarMonth = calendarMonthValue(nextDate);
    calendar.dataset.calendarFocusDate = nextValue;
    renderCalendar(calendar);
    calendar.querySelector<HTMLButtonElement>(`[data-date='${nextValue}']`)?.focus();
    return;
  }

  if (target.matches(".sample-multi-token-input") && sample) {
    const field = target.closest<HTMLElement>(".sample-multi-token-field");
    const panel = field?.querySelector<HTMLElement>(".sample-multi-token-options");
    if (event.key === "ArrowDown" && panel) {
      const firstOption = panel.querySelector<HTMLElement>("[role='option']:not([hidden])");
      if (firstOption) {
        event.preventDefault();
        delete target.dataset.tokenDismissed;
        setMultiSelectPanelOpen(panel, true, target);
        firstOption.focus();
      }
    } else if (event.key === "Enter" && panel) {
      const firstOption = panel.querySelector<HTMLButtonElement>("[data-action='multi-token-option']:not([hidden])");
      if (firstOption) {
        event.preventDefault();
        firstOption.click();
      }
    }
  }

  if (target.matches("[data-action='multi-dropdown-toggle']") && event.key === "ArrowDown") {
    const owner = target.closest<HTMLElement>(".sample-multi-checkbox");
    const panel = owner?.querySelector<HTMLElement>(".sample-multi-checkbox-options");
    const firstOption = panel?.querySelector<HTMLInputElement>("input");
    if (panel && firstOption) {
      event.preventDefault();
      setMultiSelectPanelOpen(panel, true, target);
      firstOption.focus();
    }
  }

  if (target instanceof HTMLInputElement && target.dataset.inputAction === "add-team") {
    if (event.key === "Enter" && target.value.trim() && sample) {
      event.preventDefault();
      const holder = sample.querySelector<HTMLElement>(".sample-multiselect");
      if (holder) addChip(holder, target.value.trim(), "sample-selected");
      target.value = "";
      announce(sample, "Team added.");
    }
  }

  if (target.matches(".sample-color-hex") && event.key === "Enter") {
    event.preventDefault();
    target.closest<HTMLElement>(".sample-color-well")?.querySelector<HTMLElement>("[data-action='apply-color']")?.click();
  }
  if (target.matches("[data-input-action='editor-custom-hex']") && event.key === "Enter") {
    event.preventDefault();
    target.closest<HTMLElement>(".sample-editor-colors-demo")?.querySelector<HTMLElement>("[data-action='editor-custom-apply']")?.click();
  }

  if (target.matches(".sample-color-picker-surface, .sample-editor-picker-surface")
    && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
    const well = target.closest<HTMLElement>(".sample-color-well");
    const editorDemo = target.closest<HTMLElement>(".sample-editor-colors-demo");
    if (well) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      let saturation = Number(well.dataset.pickerSaturation ?? 100);
      let brightness = Number(well.dataset.pickerBrightness ?? 100);
      if (event.key === "ArrowLeft") saturation -= step;
      else if (event.key === "ArrowRight") saturation += step;
      else if (event.key === "ArrowUp") brightness += step;
      else if (event.key === "ArrowDown") brightness -= step;
      else if (event.key === "Home") saturation = 0;
      else if (event.key === "End") saturation = 100;
      else if (event.key === "PageUp") brightness = Math.min(100, brightness + 10);
      else if (event.key === "PageDown") brightness = Math.max(0, brightness - 10);
      renderColorPickerState(well, Number(well.dataset.pickerHue ?? 220), saturation, brightness);
    } else if (editorDemo) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      let saturation = Number(editorDemo.dataset.editorPickerSaturation ?? 100);
      let brightness = Number(editorDemo.dataset.editorPickerBrightness ?? 100);
      if (event.key === "ArrowLeft") saturation -= step;
      else if (event.key === "ArrowRight") saturation += step;
      else if (event.key === "ArrowUp") brightness += step;
      else if (event.key === "ArrowDown") brightness -= step;
      else if (event.key === "Home") saturation = 0;
      else if (event.key === "End") saturation = 100;
      else if (event.key === "PageUp") brightness = Math.min(100, brightness + 10);
      else if (event.key === "PageDown") brightness = Math.max(0, brightness - 10);
      const color = renderEditorCustomColorPicker(
        editorDemo,
        Number(editorDemo.dataset.editorPickerHue ?? 220),
        saturation,
        brightness,
      );
      editorDemo.querySelectorAll<HTMLInputElement>("[data-input-action='editor-color']").forEach((option) => { option.checked = false; });
      updateEditorDocumentColor(editorDemo, color, "Custom color");
    }
  }

  if (target.matches(".sample-tabs-list [role='tab']") && ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
    const tabs = Array.from(target.parentElement?.querySelectorAll<HTMLElement>("[role='tab']") ?? []);
    const index = tabs.indexOf(target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  if (target.matches(".sample-color-grid [role='option']")
    && ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const grid = target.closest<HTMLElement>(".sample-color-grid");
    const options = Array.from(grid?.querySelectorAll<HTMLElement>("[role='option']") ?? [])
      .filter((option) => !option.hidden && !option.hasAttribute("disabled"));
    const index = options.indexOf(target);
    const columns = 6;
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : event.key === "ArrowLeft" ? Math.max(0, index - 1)
        : event.key === "ArrowRight" ? Math.min(options.length - 1, index + 1)
          : event.key === "ArrowUp" ? Math.max(0, index - columns)
            : Math.min(options.length - 1, index + columns);
    event.preventDefault();
    options[next]?.focus();
    return;
  }

  if (target.matches("[role='option'], [role='menuitem']") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    const group = target.closest<HTMLElement>("[role='listbox'], [role='menu']");
    const options = Array.from(group?.querySelectorAll<HTMLElement>("[role='option'], [role='menuitem']") ?? [])
      .filter((option) => !option.hidden && !option.closest("[hidden]") && !option.hasAttribute("disabled") && option.getAttribute("aria-disabled") !== "true");
    const index = options.indexOf(target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    event.preventDefault();
    options[next]?.focus();
  }

  if (target.matches("[data-action='toggle-color-palette'][aria-haspopup='dialog']") && event.key === "ArrowDown") {
    event.preventDefault();
    target.click();
    return;
  }

  if (target.matches("[aria-haspopup='listbox'], [aria-haspopup='menu']") && ["ArrowDown", "ArrowUp"].includes(event.key)) {
    const owner = target.closest<HTMLElement>(".sample-control-trio > div, .sample-overflow, .sample-combo-button, .sample-overlay-trio > div, .sample-menu-bar, .sample-color-well");
    const panel = owner?.querySelector<HTMLElement>("[role='listbox'], [role='menu']");
    const firstOption = panel?.querySelector<HTMLElement>("[role='option'][aria-selected='true']")
      ?? panel?.querySelector<HTMLElement>("[role='option'], [role='menuitem']");
    if (panel && firstOption) {
      event.preventDefault();
      if (owner?.matches(".sample-color-well")) {
        target.click();
        return;
      }
      if (owner?.matches(".sample-combo-button")) {
        panel.dataset.open = "true";
        setComboMenuOpen(panel, true);
      } else panel.hidden = false;
      target.setAttribute("aria-expanded", "true");
      firstOption.focus();
    }
  }

  if (target.getAttribute("role") === "separator" && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    target.dataset.delta = event.key === "ArrowRight" ? "" : "-";
    target.click();
    delete target.dataset.delta;
  }

  if (event.key === "Escape" && target.closest(".ui-sample")) {
    const contextDemo = target.closest<HTMLElement>(".sample-context-demo");
    const contextMenu = contextDemo?.querySelector<HTMLElement>(".sample-context-menu:not([hidden])");
    if (contextDemo && contextMenu) {
      const openSubmenu = contextMenu.querySelector<HTMLElement>(".sample-context-submenu-panel:not([hidden])");
      const submenuTrigger = contextMenu.querySelector<HTMLButtonElement>("[data-action='context-submenu-toggle']");
      if (openSubmenu && submenuTrigger) {
        setContextSubmenuOpen(contextDemo, submenuTrigger, false, true);
      } else {
        closeContextMenu(contextDemo, true);
      }
      event.preventDefault();
      return;
    }
    const menuBar = target.closest<HTMLElement>(".sample-menu-bar");
    if (menuBar?.querySelector(".sample-menu-bar-panel:not([hidden])")) {
      closeMenuBar(menuBar, true);
      event.preventDefault();
      return;
    }
    const tooltipExample = sample?.querySelector<HTMLElement>(".sample-overlay-tooltip-example");
    const tooltipTrigger = tooltipExample?.querySelector<HTMLButtonElement>("[data-tooltip-trigger]");
    const tooltip = tooltipExample?.querySelector<HTMLElement>("[role='tooltip']");
    if (tooltipTrigger && tooltip && !tooltip.hidden) {
      tooltipTrigger.dataset.tooltipDismissed = "true";
      tooltip.hidden = true;
      event.preventDefault();
      return;
    }
    const datePicker = target.closest<HTMLElement>(".sample-date-picker[data-calendar-open='true']");
    if (datePicker) {
      setCalendarOpen(datePicker, false);
      datePicker.querySelector<HTMLButtonElement>("[data-action='calendar-toggle']")?.focus();
      event.preventDefault();
      return;
    }
    const multiCheckbox = target.closest<HTMLElement>(".sample-multi-checkbox");
    const multiCheckboxTrigger = multiCheckbox?.querySelector<HTMLButtonElement>("[data-action='multi-dropdown-toggle']");
    const multiCheckboxPanel = multiCheckbox?.querySelector<HTMLElement>(".sample-multi-checkbox-options");
    if (multiCheckboxTrigger?.getAttribute("aria-expanded") === "true" && multiCheckboxPanel) {
      setMultiSelectPanelOpen(multiCheckboxPanel, false, multiCheckboxTrigger);
      multiCheckboxTrigger.focus();
      event.preventDefault();
      return;
    }
    const multiTokenField = target.closest<HTMLElement>(".sample-multi-token-field");
    const multiTokenInput = multiTokenField?.querySelector<HTMLInputElement>(".sample-multi-token-input");
    const multiTokenPanel = multiTokenField?.querySelector<HTMLElement>(".sample-multi-token-options");
    if (multiTokenInput?.getAttribute("aria-expanded") === "true" && multiTokenPanel) {
      multiTokenInput.dataset.tokenDismissed = "true";
      setMultiSelectPanelOpen(multiTokenPanel, false, multiTokenInput);
      multiTokenInput.focus();
      event.preventDefault();
      return;
    }
    const hover = target.closest<HTMLElement>(".sample-hover");
    const hoverTrigger = hover?.querySelector<HTMLElement>(".sample-hover-trigger");
    const hoverCard = hover?.querySelector<HTMLElement>(".sample-hover-card");
    if (hoverTrigger?.getAttribute("aria-expanded") === "true" && hoverCard) {
      if (hover) dismissHoverCard(hover);
      hoverTrigger.focus();
      event.preventDefault();
      return;
    }
    const colorWell = target.closest<HTMLElement>(".sample-color-well");
    const colorPicker = colorWell?.querySelector<HTMLElement>(".sample-color-picker:not([hidden])");
    const colorPickerTrigger = colorWell?.querySelector<HTMLElement>(".sample-color-picker-trigger[aria-expanded='true']");
    if (colorPicker && colorPickerTrigger) {
      colorPicker.hidden = true;
      colorPickerTrigger.setAttribute("aria-expanded", "false");
      colorPickerTrigger.focus();
      event.preventDefault();
      return;
    }
    const colorTrigger = colorWell?.querySelector<HTMLElement>(".sample-color-trigger[aria-expanded='true'], .sample-color-panel-trigger[aria-expanded='true']");
    const colorPanel = colorWell?.querySelector<HTMLElement>(".sample-color-popover:not([hidden]), .sample-color-panel:not([hidden])");
    if (colorWell && colorTrigger && colorPanel) {
      closeColorWellPanels(colorWell);
      colorTrigger.focus();
      event.preventDefault();
      return;
    }
    const expanded = target.closest<HTMLElement>(".sample-overflow, .sample-combo-button, .sample-overlay-trio > div, .sample-popover-macos, .sample-control-trio > div, .sample-menu-bar");
    const trigger = expanded?.querySelector<HTMLElement>("[aria-expanded='true']");
    const panel = expanded?.querySelector<HTMLElement>(".sample-menu, .sample-control-options, .sample-overlay-popover, .sample-overflow-navigation-panel, .sample-overflow-command-panel, [role='tooltip']");
    if (trigger && panel) {
      if (panel.matches(":popover-open")) return;
      event.preventDefault();
      trigger.setAttribute("aria-expanded", "false");
      if (expanded?.matches(".sample-combo-button")) {
        panel.dataset.open = "false";
        setComboMenuOpen(panel, false);
      } else panel.hidden = true;
      trigger.focus();
    }
  }

  if (target.matches("[role='combobox']") && ["ArrowDown", "ArrowUp"].includes(event.key) && sample) {
    const options = Array.from(sample.querySelectorAll<HTMLElement>(".sample-option:not([hidden])"));
    if (options.length === 0) return;
    event.preventDefault();
    const active = options.indexOf(document.activeElement as HTMLElement);
    const next = (active + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  }
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  document.querySelectorAll<HTMLElement>(".sample-context-demo").forEach((demo) => {
    const menu = demo.querySelector<HTMLElement>(".sample-context-menu");
    const contextTarget = demo.querySelector<HTMLElement>(".sample-context-target");
    if (menu && !menu.hidden && !menu.contains(target) && !contextTarget?.contains(target)) closeContextMenu(demo);
  });
  document.querySelectorAll<HTMLElement>(".sample-menu-bar").forEach((bar) => {
    if (!bar.contains(target) && bar.querySelector(".sample-menu-bar-panel:not([hidden])")) closeMenuBar(bar);
  });
  const recipientInput = target.closest<HTMLInputElement>(".sample-token-input");
  if (recipientInput) {
    const field = recipientInput.closest<HTMLElement>(".sample-token-field");
    if (field) updateRecipientSuggestions(field);
  }
  document.querySelectorAll<HTMLElement>(".sample-token-field").forEach((field) => {
    if (field.contains(target)) return;
    closeRecipientSuggestions(field);
    clearRecipientSelection(field);
  });
  document.querySelectorAll<HTMLElement>(".sample-save-panel").forEach((panel) => {
    const sample = panel.closest<HTMLElement>(".ui-sample") ?? panel;
    const locationMenu = panel.querySelector<HTMLElement>("[data-save-location-menu]");
    const formatMenu = panel.querySelector<HTMLElement>("[data-save-format-menu]");
    const openMenu = locationMenu && !locationMenu.hidden ? locationMenu : formatMenu && !formatMenu.hidden ? formatMenu : null;
    if (!openMenu || openMenu.contains(target)) return;
    const trigger = openMenu === locationMenu
      ? panel.querySelector<HTMLButtonElement>("[data-action='save-location-toggle']")
      : panel.querySelector<HTMLButtonElement>("[data-action='save-format-toggle']");
    if (target === trigger) return;
    closeSavePanelMenus(sample);
  });
});

document.addEventListener("pointerover", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const owner = target?.closest<HTMLElement>(".sample-hover");
  if (!owner || event.pointerType === "touch") return;
  if (event.relatedTarget instanceof Node && owner.contains(event.relatedTarget)) return;
  const state = hoverCardState(owner);
  state.pointerType = event.pointerType;
  state.pointerInside = true;
  state.suppressed = false;
  syncHoverCard(owner);
});

document.addEventListener("pointerout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const owner = target?.closest<HTMLElement>(".sample-hover");
  if (!owner || event.pointerType === "touch") return;
  if (event.relatedTarget instanceof Node && owner.contains(event.relatedTarget)) return;
  const state = hoverCardState(owner);
  state.pointerInside = false;
  syncHoverCard(owner);
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const comboInput = target?.closest<HTMLInputElement>(".sample-combo-input");
  if (comboInput) openCombobox(comboInput);
  const tokenInput = target?.closest<HTMLInputElement>(".sample-multi-token-input");
  const tokenField = tokenInput?.closest<HTMLElement>(".sample-multi-token-field");
  const tokenPanel = tokenField?.querySelector<HTMLElement>(".sample-multi-token-options");
  const tokenShowcase = tokenField?.closest<HTMLElement>(".sample-multi-select-showcase");
  if (tokenInput && tokenPanel && tokenShowcase && tokenInput.dataset.tokenDismissed !== "true") {
    tokenInput.dataset.tokenExplicitOpen = "true";
    setMultiSelectPanelOpen(tokenPanel, true, tokenInput);
    refreshMultiSelectShowcase(tokenShowcase);
  }
  const owner = target?.closest<HTMLElement>(".sample-hover");
  if (!owner) return;
  const state = hoverCardState(owner);
  state.focusInside = target?.matches(":focus-visible") ?? false;
  state.suppressed = false;
  syncHoverCard(owner, 70);
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  multiCheckboxPointerOwner = target?.closest<HTMLElement>(".sample-multi-checkbox") ?? null;
}, true);

document.addEventListener("pointerup", () => {
  multiCheckboxPointerOwner = null;
}, true);

document.addEventListener("pointercancel", () => {
  multiCheckboxPointerOwner = null;
}, true);

window.addEventListener("blur", () => {
  multiCheckboxPointerOwner = null;
});

document.addEventListener("focusout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target instanceof HTMLInputElement && target.hasAttribute("data-form-field")) updateFormFieldState(target, true);
  if (target instanceof HTMLInputElement && target.matches(".sample-combo-input")) closeCombobox(target);
  const multiCheckbox = target?.closest<HTMLElement>(".sample-multi-checkbox");
  if (multiCheckbox && multiCheckboxPointerOwner !== multiCheckbox
    && !(event.relatedTarget instanceof Node && multiCheckbox.contains(event.relatedTarget))) {
    const trigger = multiCheckbox.querySelector<HTMLButtonElement>("[data-action='multi-dropdown-toggle']");
    const panel = multiCheckbox.querySelector<HTMLElement>(".sample-multi-checkbox-options");
    if (trigger && panel && !panel.hidden) {
      setMultiSelectPanelOpen(panel, false, trigger);
    }
  }
  const multiTokenField = target?.closest<HTMLElement>(".sample-multi-token-field");
  if (multiTokenField && !(event.relatedTarget instanceof Node && multiTokenField.contains(event.relatedTarget))) {
    const input = multiTokenField.querySelector<HTMLInputElement>(".sample-multi-token-input");
    const panel = multiTokenField.querySelector<HTMLElement>(".sample-multi-token-options");
    if (input && panel && !panel.hidden) {
      setMultiSelectPanelOpen(panel, false, input);
    }
    if (input) delete input.dataset.tokenDismissed;
  }
  const owner = target?.closest<HTMLElement>(".sample-hover");
  if (!owner || (event.relatedTarget instanceof Node && owner.contains(event.relatedTarget))) return;
  const state = hoverCardState(owner);
  state.focusInside = false;
  syncHoverCard(owner);
});

document.addEventListener("dragstart", (event) => {
  const cursorDragTarget = event.target instanceof Element ? event.target : null;
  const cursorItem = cursorDragTarget?.closest<HTMLElement>("[data-cursor-drag]");
  if (cursorItem && event.dataTransfer) {
    event.dataTransfer.effectAllowed = (cursorItem.dataset.cursorDrag ?? "move") as DataTransfer["effectAllowed"];
    event.dataTransfer.setData("text/plain", cursorItem.textContent?.trim() ?? "Pointer example");
    cursorItem.dataset.dragging = "true";
  }
  const target = event.target instanceof Element ? event.target : null;
  const grip = target?.closest<HTMLButtonElement>(".sample-task-grip[draggable='true']");
  const task = grip?.closest<HTMLElement>(".sample-task-card");
  const board = grip?.closest<HTMLElement>(".sample-kanban");
  const sample = grip?.closest<HTMLElement>(".ui-sample");
  if (!grip || !task || !board || !sample || !event.dataTransfer) return;
  activeDragCompleted = false;
  activeDraggedTask = task;
  activeDragBoard = board;
  task.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", task.dataset.taskId ?? task.dataset.taskTitle ?? "task");
  activeDragPreview?.remove();
  activeDragPreview = task.cloneNode(true) as HTMLElement;
  activeDragPreview.classList.remove("is-dragging");
  activeDragPreview.classList.add("sample-task-drag-preview");
  activeDragPreview.setAttribute("aria-hidden", "true");
  activeDragPreview.inert = true;
  document.body.append(activeDragPreview);
  event.dataTransfer.setDragImage(activeDragPreview, 22, 20);
  announce(sample, `Picked up ${task.dataset.taskTitle ?? "task"}. Move to To do or In review, then release.`);
});

document.addEventListener("dragover", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const board = target?.closest<HTMLElement>(".sample-kanban");
  if (!board || board !== activeDragBoard || !activeDraggedTask) return;
  const list = target?.closest<HTMLElement>(".sample-kanban-list");
  if (!list) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  clearDragIndicators(board);
  const column = list.closest<HTMLElement>(".sample-kanban-column");
  column?.classList.add("is-drop-target");
  const targetTask = target?.closest<HTMLElement>(".sample-task-card");
  if (!targetTask || targetTask === activeDraggedTask || targetTask.parentElement !== list) return;
  const bounds = targetTask.getBoundingClientRect();
  targetTask.classList.add(event.clientY < bounds.top + bounds.height / 2 ? "is-drop-before" : "is-drop-after");
});

document.addEventListener("dragleave", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const board = target?.closest<HTMLElement>(".sample-kanban");
  if (!board || board !== activeDragBoard || event.relatedTarget instanceof Node && board.contains(event.relatedTarget)) return;
  clearDragIndicators(board);
});

document.addEventListener("drop", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const board = target?.closest<HTMLElement>(".sample-kanban");
  if (!board || board !== activeDragBoard || !activeDraggedTask) return;
  const list = target?.closest<HTMLElement>(".sample-kanban-list");
  if (!list) return;
  event.preventDefault();
  const task = activeDraggedTask;
  const sample = board.closest<HTMLElement>(".ui-sample");
  const targetTask = target?.closest<HTMLElement>(".sample-task-card");
  if (targetTask === task) {
    clearDragIndicators(board);
    return;
  }
  let before: HTMLElement | null = null;
  if (targetTask && targetTask.parentElement === list) {
    const bounds = targetTask.getBoundingClientRect();
    before = event.clientY < bounds.top + bounds.height / 2
      ? targetTask
      : targetTask.nextElementSibling instanceof HTMLElement ? targetTask.nextElementSibling : null;
  }
  activeDragCompleted = sample ? moveTask(task, list, before, sample) : false;
  clearDragIndicators(board);
});

document.addEventListener("dragend", (event) => {
  const cursorDragTarget = event.target instanceof Element ? event.target : null;
  const cursorItem = cursorDragTarget?.closest<HTMLElement>("[data-cursor-drag]");
  if (cursorItem) delete cursorItem.dataset.dragging;
  if (activeDraggedTask && !activeDragCompleted) {
    const sample = activeDragBoard?.closest<HTMLElement>(".ui-sample");
    if (sample) announce(sample, `Move cancelled. ${activeDraggedTask.dataset.taskTitle ?? "Task"} stayed in its original position.`);
  }
  activeDraggedTask?.classList.remove("is-dragging");
  if (activeDragBoard) clearDragIndicators(activeDragBoard);
  activeDragPreview?.remove();
  activeDragPreview = null;
  activeDraggedTask = null;
  activeDragBoard = null;
  activeDragCompleted = false;
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const handle = target?.closest<HTMLButtonElement>(".sample-selection-handle");
  const selection = handle?.closest<HTMLElement>(".sample-selection-object");
  const workspace = handle?.closest<HTMLElement>(".sample-selection-workspace");
  const sample = handle?.closest<HTMLElement>(".ui-sample");
  if (!handle || !selection || !workspace || !sample || event.button !== 0) return;
  event.preventDefault();
  handle.focus({ preventScroll: true });
  const selectionStyle = getComputedStyle(selection);
  activeSelectionResize = {
    handle,
    sample,
    selection,
    workspace,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    left: Number.parseFloat(selectionStyle.left) || 0,
    top: Number.parseFloat(selectionStyle.top) || 0,
    width: Number.parseFloat(selectionStyle.width) || selection.offsetWidth,
    height: Number.parseFloat(selectionStyle.height) || selection.offsetHeight,
  };
  selection.dataset.resizing = "true";
  handle.setPointerCapture(event.pointerId);
});

document.addEventListener("pointermove", (event) => {
  const resize = activeSelectionResize;
  if (!resize || resize.pointerId !== event.pointerId) return;
  resizeCanvasSelection(
    resize.selection,
    resize.workspace,
    resize.handle,
    event.clientX - resize.startX,
    event.clientY - resize.startY,
  );
});

function finishCanvasResize(pointerId?: number) {
  const resize = activeSelectionResize;
  if (!resize || pointerId !== undefined && resize.pointerId !== pointerId) return;
  delete resize.selection.dataset.resizing;
  const status = resize.sample.querySelector<HTMLElement>("[data-selection-status]");
  if (status) announce(resize.sample, status.textContent ?? "Selection resized.");
  activeSelectionResize = null;
}

document.addEventListener("pointerup", (event) => finishCanvasResize(event.pointerId));
document.addEventListener("pointercancel", (event) => finishCanvasResize(event.pointerId));

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const handle = target?.closest<HTMLButtonElement>(".sample-selection-handle");
  const selection = handle?.closest<HTMLElement>(".sample-selection-object");
  const workspace = handle?.closest<HTMLElement>(".sample-selection-workspace");
  const sample = handle?.closest<HTMLElement>(".ui-sample");
  if (!handle || !selection || !workspace || !sample) return;
  const deltas: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    ArrowRight: [1, 0],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
  };
  const delta = deltas[event.key];
  if (!delta) return;
  event.preventDefault();
  const direction = handle.dataset.selectionHandle ?? "se";
  const canResizeHorizontally = direction.includes("w") || direction.includes("e");
  const canResizeVertically = direction.includes("n") || direction.includes("s");
  if ((!canResizeHorizontally && delta[0] !== 0) || (!canResizeVertically && delta[1] !== 0)) return;
  const step = event.shiftKey ? 20 : 3;
  resizeCanvasSelection(selection, workspace, handle, delta[0] * step, delta[1] * step);
  const status = sample.querySelector<HTMLElement>("[data-selection-status]");
  if (status) announce(sample, status.textContent ?? "Selection resized.");
});

document.addEventListener("change", (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const sample = input?.closest<HTMLElement>(".ui-sample");
  if (!input || !sample) return;
  if (input.dataset.inputAction === "immediate-notification-switch") {
    announce(sample, `Alerts ${input.checked ? "enabled" : "disabled"}. This switch applies immediately.`);
    return;
  }
  if (input.dataset.inputAction === "macos-popover-output") {
    const demo = input.closest<HTMLElement>(".sample-popover-macos");
    if (!demo) return;
    const status = demo.querySelector<HTMLElement>(".sample-popover-status");
    const message = `Playing through ${input.value}.`;
    if (status) status.textContent = message;
    announce(sample, `${input.value} selected as the output device. The popover stays open.`);
    return;
  }
  if (input.dataset.inputAction === "editor-color" || input.dataset.inputAction === "editor-custom-color") {
    const demo = input.closest<HTMLElement>(".sample-editor-colors-demo");
    if (!demo) return;
    const selected = input.dataset.inputAction === "editor-color" ? input : null;
    const name = selected?.dataset.colorName ?? "Custom color";
    updateEditorDocumentColor(demo, input.value, name);
    return;
  }
  if (input.dataset.inputAction === "editor-color-hue") {
    const demo = input.closest<HTMLElement>(".sample-editor-colors-demo");
    const status = demo?.querySelector<HTMLElement>(".sample-editor-colors-status");
    const color = demo?.querySelector<HTMLElement>("[data-editor-color-value]")?.textContent;
    if (status && color) status.textContent = `Custom color ${color} selected. The document preview updated; no file was changed.`;
    return;
  }
  if (input.dataset.inputAction === "editor-hide-inactive") {
    const demo = input.closest<HTMLElement>(".sample-editor-colors-demo");
    if (!demo) return;
    updateEditorColorsPanelVisibility(demo);
    const status = demo.querySelector<HTMLElement>(".sample-editor-colors-status");
    if (status) status.textContent = input.checked
      ? "The floating panel will hide while this editor is inactive."
      : "The floating panel will remain above the editor while it is inactive.";
    return;
  }
  if (input.dataset.inputAction === "overlay-filter") {
    const selected = Array.from(sample.querySelectorAll<HTMLInputElement>(".sample-overlay-popover input[data-input-action='overlay-filter']:checked"))
      .map((option) => option.value);
    const message = selected.length ? `${selected.join(" and ")} filters are active.` : "No project filters are active.";
    const feedback = sample.querySelector<HTMLElement>("[data-overlay-feedback]");
    if (feedback) {
      feedback.textContent = message;
      feedback.hidden = false;
    }
    announce(sample, message);
    return;
  }
  if (input.dataset.inputAction === "multi-checkbox-option") {
    const showcase = input.closest<HTMLElement>(".sample-multi-select-showcase");
    if (!showcase) return;
    refreshMultiSelectShowcase(showcase);
    const selected = Array.from(showcase.querySelectorAll<HTMLInputElement>("input[data-input-action='multi-checkbox-option']:checked"))
      .map((option) => option.value);
    announce(sample, selected.length ? "Selected teams: " + selected.join(", ") + "." : "No teams selected.");
    return;
  }
  if (input.dataset.inputAction === "table-select-all" || input.dataset.inputAction === "table-row-select") {
    const table = input.closest<HTMLElement>(".sample-data-table");
    if (!table) return;
    if (input.dataset.inputAction === "table-select-all") {
      table.querySelectorAll<HTMLInputElement>("tbody tr:not([hidden]) input[data-input-action='table-row-select']")
        .forEach((checkbox) => { checkbox.checked = input.checked; });
    }
    renderDataTable(table);
    const selectedCount = table.querySelectorAll("tbody input[data-input-action='table-row-select']:checked").length;
    announce(sample, `${selectedCount} customer${selectedCount === 1 ? "" : "s"} selected.`);
    return;
  }
  if (input.dataset.inputAction === "volume") {
    updateVolumeSlider(sample);
    return;
  }
  if (input.dataset.inputAction === "volume-ticks") {
    updateKeyRepeatSlider(sample);
  }
});

const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
document.querySelectorAll<HTMLElement>(".sample-spring").forEach(initializeSpringMotion);
const pendingPositioningUpdates = new WeakSet<HTMLElement>();
const positioningScrollTimers = new WeakMap<HTMLElement, number>();

function updatePositioningState(pane: HTMLElement) {
  if (pendingPositioningUpdates.has(pane)) return;
  pendingPositioningUpdates.add(pane);
  requestAnimationFrame(() => {
    pendingPositioningUpdates.delete(pane);
    if (!pane.isConnected) return;
    const sticky = pane.querySelector<HTMLElement>(".sample-positioning-sticky");
    const state = sticky?.querySelector<HTMLElement>("[data-positioning-sticky-state]");
    if (!sticky || !state) return;
    const isPinned = pane.scrollTop > 0 && sticky.getBoundingClientRect().top <= pane.getBoundingClientRect().top + 1;
    if (sticky.classList.contains("is-pinned") === isPinned) return;
    sticky.classList.toggle("is-pinned", isPinned);
    state.textContent = isPinned ? "PINNED · top: 0" : "IN FLOW";
  });
}

document.querySelectorAll<HTMLElement>(".sample-positioning-pane").forEach(updatePositioningState);
document.addEventListener("scroll", (event) => {
  const pane = event.target instanceof HTMLElement ? event.target : null;
  if (!pane?.matches(".sample-positioning-pane")) return;
  const frame = pane.closest<HTMLElement>(".sample-positioning-frame");
  if (frame) {
    frame.classList.add("is-scrolling");
    const previousTimer = positioningScrollTimers.get(frame);
    if (previousTimer !== undefined) window.clearTimeout(previousTimer);
    positioningScrollTimers.set(frame, window.setTimeout(() => {
      frame.classList.remove("is-scrolling");
      positioningScrollTimers.delete(frame);
    }, 240));
  }
  updatePositioningState(pane);
}, true);

const supportsScrollDrivenParallax = CSS.supports("animation-timeline", "scroll(nearest block)");
const pendingParallaxUpdates = new WeakSet<HTMLElement>();

function updateParallaxLayers(viewport: HTMLElement) {
  if (supportsScrollDrivenParallax || pendingParallaxUpdates.has(viewport)) return;
  pendingParallaxUpdates.add(viewport);
  requestAnimationFrame(() => {
    pendingParallaxUpdates.delete(viewport);
    if (!viewport.isConnected) return;
    const scrollPosition = reducedMotionPreference.matches ? 0 : viewport.scrollTop;
    viewport.querySelectorAll<HTMLElement>("[data-parallax-speed]").forEach((layer) => {
      const speed = Number(layer.dataset.parallaxSpeed ?? "1");
      layer.style.setProperty("--parallax-offset-y", `${scrollPosition * (1 - speed)}px`);
    });
  });
}

if (!supportsScrollDrivenParallax) {
  document.addEventListener("scroll", (event) => {
    const viewport = event.target instanceof HTMLElement ? event.target : null;
    if (viewport?.matches(".sample-parallax-viewport")) updateParallaxLayers(viewport);
  }, true);

  reducedMotionPreference.addEventListener("change", () => {
    document.querySelectorAll<HTMLElement>(".sample-parallax-viewport").forEach(updateParallaxLayers);
  });
}

function syncOverlayTooltip(example: HTMLElement) {
  const trigger = example.querySelector<HTMLButtonElement>("[data-tooltip-trigger]");
  const tooltip = example.querySelector<HTMLElement>("[role='tooltip']");
  if (!trigger || !tooltip) return;
  const dismissed = trigger.dataset.tooltipDismissed === "true";
  tooltip.hidden = dismissed || !(trigger.matches(":hover") || document.activeElement === trigger);
}

document.addEventListener("pointerover", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const trigger = target?.closest<HTMLElement>("[data-tooltip-trigger]");
  const example = trigger?.closest<HTMLElement>(".sample-overlay-tooltip-example");
  if (trigger && example) {
    delete trigger.dataset.tooltipDismissed;
    syncOverlayTooltip(example);
  }
});

document.addEventListener("pointerout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const example = target?.closest<HTMLElement>(".sample-overlay-tooltip-example");
  if (example && !example.contains(event.relatedTarget as Node | null)) syncOverlayTooltip(example);
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const trigger = target?.closest<HTMLElement>("[data-tooltip-trigger]");
  const example = trigger?.closest<HTMLElement>(".sample-overlay-tooltip-example");
  if (trigger && example) {
    delete trigger.dataset.tooltipDismissed;
    syncOverlayTooltip(example);
  }
});

document.addEventListener("focusout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const example = target?.closest<HTMLElement>(".sample-overlay-tooltip-example");
  if (example && !example.contains(event.relatedTarget as Node | null)) syncOverlayTooltip(example);
});

document.querySelectorAll<HTMLDialogElement>(".element-demo-dialog").forEach((elementDialog) => {
  elementDialog.addEventListener("click", (event) => {
    if (event.target === elementDialog) elementDialog.close();
  });
  elementDialog.addEventListener("cancel", (event) => {
    const sample = dialogStage?.querySelector<HTMLElement>(".ui-sample[data-specimen-id='delete-sheet']");
    if (sample?.dataset.deleteSheetOpen === "true") {
      event.preventDefault();
      setDeleteSheetOpen(sample, false);
    }
  });
  elementDialog.addEventListener("close", () => {
    elementDialog.removeAttribute("data-anchor-top");
    elementDialog.style.removeProperty("--demo-dialog-anchor-top");
    const sample = dialogStage?.querySelector<HTMLElement>(".ui-sample[data-specimen-id='scrollspy']");
    if (sample) destroyScrollspy(sample);
    const progressSample = dialogStage?.querySelector<HTMLElement>(".ui-sample[data-specimen-id='progress-ring-spinner-bar']");
    if (progressSample) {
      progressDemoCleanups.get(progressSample)?.();
      progressDemoCleanups.delete(progressSample);
      progressDemoControllers.delete(progressSample);
    }
    const toastSample = dialogStage?.querySelector<HTMLElement>(".ui-sample[data-specimen-id='toast-snackbar']");
    if (toastSample) cleanupToastSample(toastSample);
    const scrambleSample = dialogStage?.querySelector<HTMLElement>(".ui-sample[data-specimen-id='text-scramble']");
    if (scrambleSample) {
      textScrambleControllers.get(scrambleSample)?.cleanup();
      textScrambleControllers.delete(scrambleSample);
    }
  });
});
