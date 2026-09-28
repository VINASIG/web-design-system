const dialog = document.querySelector<HTMLDialogElement>(".element-demo-dialog");
const dialogTitle = dialog?.querySelector<HTMLElement>("#element-demo-title");
const dialogDescription = dialog?.querySelector<HTMLElement>(".element-demo-description");
const dialogStage = dialog?.querySelector<HTMLElement>(".element-demo-stage");
let sampleInstance = 0;
let fieldInstance = 0;
const scrollspyCleanups = new WeakMap<HTMLElement, () => void>();

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
    children.id = contentId;
    button.setAttribute("aria-controls", contentId);
    children.hidden = button.getAttribute("aria-expanded") !== "true";
  });
}

function renderDataTable(table: HTMLElement) {
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
  });

  const pageSize = Math.max(1, Number(table.dataset.pageSize ?? "5"));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(table.dataset.page ?? "1")));
  table.dataset.page = String(page);
  const firstIndex = (page - 1) * pageSize;
  const lastIndex = Math.min(firstIndex + pageSize, rows.length);
  const visibleRows = rows.slice(firstIndex, lastIndex);

  rows.forEach((row, index) => {
    row.hidden = index < firstIndex || index >= lastIndex;
    row.classList.toggle("is-selected", Boolean(row.querySelector<HTMLInputElement>("input[data-input-action='table-row-select']")?.checked));
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
  if (table) renderDataTable(table);
}

function setCurrentScrollspyLink(sample: HTMLElement, key: string) {
  sample.querySelectorAll<HTMLAnchorElement>(".sample-scrollspy nav a[data-scrollspy-key]").forEach((link) => {
    const current = link.dataset.scrollspyKey === key;
    link.classList.toggle("is-current", current);
    if (current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function initializeScrollspy(sample: HTMLElement) {
  const nav = sample.querySelector<HTMLElement>(".sample-scrollspy nav");
  const content = sample.querySelector<HTMLElement>(".sample-scrollspy-content");
  if (!nav || !content) return;

  scrollspyCleanups.get(sample)?.();
  const prefix = `sample-scrollspy-${sample.dataset.sampleInstance ?? "example"}`;
  const sections = Array.from(content.querySelectorAll<HTMLElement>("section[data-scrollspy-key]"));
  const headings: HTMLElement[] = [];
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
    if (headings.length === 0) return;
    const bounds = content.getBoundingClientRect();
    const activationLine = bounds.top + content.clientHeight * 0.24;
    const passed = headings.filter((heading) => heading.getBoundingClientRect().top <= activationLine);
    const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;
    const current = atBottom ? headings[headings.length - 1] : passed[passed.length - 1] ?? headings[0];
    if (current?.dataset.scrollspyKey) setCurrentScrollspyLink(sample, current.dataset.scrollspyKey);
  };

  content.addEventListener("scroll", updateCurrentSection, { passive: true });
  let observer: IntersectionObserver | undefined;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(updateCurrentSection, {
      root: content,
      rootMargin: "-24% 0px -74% 0px",
      threshold: 0,
    });
    headings.forEach((heading) => observer?.observe(heading));
  }
  scrollspyCleanups.set(sample, () => {
    observer?.disconnect();
    content.removeEventListener("scroll", updateCurrentSection);
  });
  updateCurrentSection();
}

function destroyScrollspy(sample: HTMLElement) {
  scrollspyCleanups.get(sample)?.();
  scrollspyCleanups.delete(sample);
}

function showDropResult(zone: HTMLElement, files: FileList | File[]) {
  let result = zone.querySelector<HTMLElement>(".sample-drop-feedback");
  if (!result) {
    result = document.createElement("p");
    result.className = "sample-drop-feedback";
    result.setAttribute("role", "status");
    zone.append(result);
  }
  const selected = Array.from(files);
  result.textContent = selected.length
    ? selected.map((file) => file.name).join(", ") + (selected.length === 1 ? " uploaded." : " selected.")
    : "No files selected.";
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
  removeIcon.className = "fi-br-cross-small";
  removeIcon.setAttribute("aria-hidden", "true");
  remove.append(removeIcon);
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

const multiSelectTeams = ["Design", "Research", "Ops", "Sales", "Support"];

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
    tokenField.querySelectorAll<HTMLButtonElement>(".sample-multi-token-options [data-action='multi-token-option']").forEach((option) => {
      const value = option.dataset.value ?? "";
      option.hidden = selected.has(value) || !value.toLocaleLowerCase().includes(query);
      if (!option.hidden) visibleCount += 1;
    });
    const empty = tokenField.querySelector<HTMLElement>("[data-token-empty]");
    if (empty) empty.hidden = visibleCount > 0;
    const panel = tokenField.querySelector<HTMLElement>(".sample-multi-token-options");
    if (input && panel) input.setAttribute("aria-expanded", String(!panel.hidden));
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
}

function addMultiSelectToken(field: HTMLElement, value: string) {
  if (!multiSelectTeams.includes(value)) return false;
  const input = field.querySelector<HTMLInputElement>(".sample-multi-token-input");
  const alreadySelected = Array.from(field.querySelectorAll<HTMLElement>("[data-multi-token]"))
    .some((chip) => chip.dataset.multiToken === value);
  if (!input || alreadySelected) return false;

  const chip = document.createElement("span");
  chip.className = "sample-multi-token-chip";
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
  icon.className = "fi-br-cross-small";
  icon.setAttribute("aria-hidden", "true");
  remove.append(icon);
  chip.append(label, remove);
  field.insertBefore(chip, input);
  return true;
}

function makeInput(placeholder: string, label: string, className = "sample-input-line") {
  const input = document.createElement("input");
  input.type = "text";
  input.className = className;
  input.placeholder = placeholder;
  input.setAttribute("aria-label", label);
  return input;
}

function toCivilDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromCivilDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
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
  const [year, month] = monthValue.split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1);
  title.textContent = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(firstDate);
  grid.setAttribute("aria-label", `Dates in ${title.textContent}`);
  grid.replaceChildren();

  const headingRow = document.createElement("div");
  headingRow.setAttribute("role", "row");
  headingRow.className = "sample-calendar-weekdays";
  for (const [short, long] of [["Su", "Sunday"], ["Mo", "Monday"], ["Tu", "Tuesday"], ["We", "Wednesday"], ["Th", "Thursday"], ["Fr", "Friday"], ["Sa", "Saturday"]]) {
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

function enhanceSample(sample: HTMLElement) {
  const id = sample.dataset.specimenId;
  sample.dataset.sampleInstance = String(++sampleInstance);
  liveStatus(sample);

  switch (id) {
    case "data-table":
      initializeDataTable(sample);
      break;
    case "scrollspy":
      initializeScrollspy(sample);
      break;
    case "bottom-navigation": {
      const nav = sample.querySelector<HTMLElement>(".sample-bottom-nav");
      if (!nav) break;
      nav.setAttribute("role", "tablist");
      nav.setAttribute("aria-label", "Example navigation");
      nav.querySelectorAll<HTMLElement>(".sample-nav-item").forEach((item) => {
        const label = item.querySelector("small")?.textContent?.trim() ?? "Navigation item";
        const button = asButton(item, "select-nav", label);
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(button.classList.contains("is-current")));
      });
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
      sample.querySelectorAll<HTMLElement>(".sample-pagination > span, .sample-pagination > b").forEach((item) => {
        const text = item.textContent?.trim() ?? "";
        const action = text === "Previous" ? "page-prev" : text === "Next" ? "page-next" : "page-select";
        const button = asButton(item, action, text === "Previous" || text === "Next" ? text : `Page ${text}`);
        if (action === "page-select") button.dataset.page = text;
        if (text === "1") button.setAttribute("aria-current", "page");
      });
      break;
    }
    case "date-picker":
      enhanceCalendar(sample);
      break;
    case "carousel": {
      const carousel = sample.querySelector<HTMLElement>(".sample-carousel");
      if (!carousel) break;
      const controls = document.createElement("div");
      controls.className = "sample-carousel-controls";
      for (const [label, action] of [["Previous", "carousel-prev"], ["Next", "carousel-next"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sample-carousel-button";
        button.textContent = label;
        setAction(button, action, `${label} carousel card`);
        controls.append(button);
      }
      sample.insertBefore(controls, carousel);
      carousel.setAttribute("aria-label", "Project stages");
      carousel.querySelectorAll<HTMLElement>(".sample-carousel-card").forEach((card, index) => {
        const label = card.querySelector("b")?.textContent?.trim() ?? `Card ${index + 1}`;
        const button = asButton(card, "carousel-select", label);
        button.dataset.index = String(index);
        button.setAttribute("aria-pressed", String(index === 0));
        if (index === 0) button.classList.add("is-current");
      });
      break;
    }
    case "site-header-navigation-bar": {
      sample.querySelectorAll<HTMLElement>(".sample-site-header nav span").forEach((item, index) => {
        const button = asButton(item, "site-nav");
        if (index === 0) {
          button.classList.add("is-current");
          button.setAttribute("aria-current", "page");
        }
      });
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
      sample.querySelectorAll<HTMLElement>(".sample-drawer > span").forEach((item) => {
        const label = item.textContent?.trim() ?? "Navigation item";
        const button = asButton(item, "drawer-nav", label);
        button.setAttribute("aria-current", button.classList.contains("is-current") ? "page" : "false");
      });
      break;
    }
    case "empty-trash-alert":
      sample.querySelectorAll<HTMLElement>(".sample-confirm > div span, .sample-confirm > div b").forEach((item) => {
        asButton(item, item.textContent?.includes("Remove") ? "confirm-delete" : "cancel-delete");
      });
      break;
    case "volume-slider": {
      const track = sample.querySelector<HTMLElement>(".sample-volume > span");
      if (!track) break;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.className = "sample-range";
      slider.min = "0";
      slider.max = "100";
      slider.value = "65";
      slider.setAttribute("aria-label", "Volume");
      slider.dataset.inputAction = "volume";
      track.replaceWith(slider);
      break;
    }
    case "color-well": {
      sample.querySelectorAll<HTMLElement>(".sample-color-well").forEach((well, index) => {
        refreshColorWellIds(well, `${sample.dataset.sampleInstance}-${index + 1}`);
        setColorWellValue(well, well.dataset.color ?? "#21497B", well.dataset.colorName ?? "Scout Blue");
        well.querySelectorAll<HTMLElement>(".sample-color-grid [data-color]").forEach((option) => {
          setAction(option, "select-color");
          const swatch = option.querySelector<HTMLElement>("span");
          if (swatch) swatch.style.backgroundColor = option.dataset.color ?? "transparent";
        });
      });
      break;
    }
    case "form-field": {
      const oldLabel = sample.querySelector<HTMLElement>(".sample-form-field label");
      const oldInput = sample.querySelector<HTMLElement>(".sample-form-field > div");
      if (!oldLabel || !oldInput) break;
      const labelText = oldLabel.textContent?.trim() ?? "Project name";
      const input = makeInput("VINASIG website", labelText, "sample-input-line sample-editable-input");
      input.value = "VINASIG website";
      oldInput.replaceWith(input);
      break;
    }
    case "drag-and-drop": {
      const zone = sample.querySelector<HTMLElement>(".sample-dropzone");
      if (!zone) break;
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.className = "sample-file-input";
      fileInput.setAttribute("aria-label", "Choose files to upload");
      fileInput.dataset.inputAction = "files";
      const prompt = zone.querySelector<HTMLElement>("small");
      const choose = document.createElement("button");
      choose.type = "button";
      choose.className = "sample-file-button";
      choose.textContent = "Choose files";
      setAction(choose, "choose-files");
      prompt?.replaceWith(choose);
      zone.append(fileInput);
      break;
    }
    case "three-dots-overflow-menu": {
      const trigger = sample.querySelector<HTMLElement>(".sample-overflow > div:first-child span");
      const menu = sample.querySelector<HTMLElement>(".sample-menu");
      if (trigger && menu) {
        const button = asButton(trigger, "toggle-menu", "Project actions");
        button.setAttribute("aria-haspopup", "menu");
        button.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        menu.setAttribute("role", "menu");
        menu.querySelectorAll<HTMLElement>("span").forEach((item) => {
          const label = item.textContent?.trim() ?? "Menu action";
          const menuItem = asButton(item, "menu-command", label);
          menuItem.setAttribute("role", "menuitem");
        });
      }
      break;
    }
    case "toast-snackbar": {
      const dismiss = sample.querySelector<HTMLElement>(".sample-toast > small:last-child");
      if (dismiss) asButton(dismiss, "dismiss-toast", "Dismiss message");
      break;
    }
    case "modal-dialog-drawer-sheet": {
      const options = sample.querySelector<HTMLElement>(".sample-surface-options");
      if (!options) break;
      sample.classList.add("sample-surface-demo");
      options.querySelectorAll<HTMLElement>(":scope > div").forEach((tile) => {
        const label = tile.querySelector("b")?.textContent?.trim() ?? "Surface";
        const button = asButton(tile, "surface-select", `Show ${label.toLowerCase()} example`);
        button.setAttribute("aria-pressed", "false");
      });
      const feedback = document.createElement("p");
      feedback.className = "sample-surface-feedback";
      feedback.dataset.surfaceFeedback = "true";
      feedback.textContent = "Choose a presentation to see when it fits.";
      options.after(feedback);
      break;
    }
    case "popover-dropdown-tooltip": {
      const examples = sample.querySelectorAll<HTMLElement>(".sample-overlay-trio > div");
      examples.forEach((example, index) => {
        const anchor = example.querySelector<HTMLElement>(".sample-anchor");
        if (!anchor) return;
        const button = asButton(anchor, index === 2 ? "toggle-tooltip" : "toggle-popover");
        button.setAttribute("aria-expanded", "false");
        if (index === 0) {
          button.setAttribute("aria-haspopup", "dialog");
          const panel = example.querySelector<HTMLElement>("b");
          if (panel) panel.hidden = true;
        } else if (index === 1) {
          button.setAttribute("aria-haspopup", "menu");
          const oldPanel = example.querySelector<HTMLElement>("small");
          if (oldPanel) {
            const menu = document.createElement("div");
            menu.className = "sample-menu";
            menu.setAttribute("role", "menu");
            menu.hidden = true;
            for (const label of ["Edit", "Move", "Archive"]) {
              const item = document.createElement("button");
              item.type = "button";
              item.textContent = label;
              item.setAttribute("role", "menuitem");
              setAction(item, "menu-command", label);
              menu.append(item);
            }
            oldPanel.replaceWith(menu);
          }
        } else {
          const tooltip = example.querySelector<HTMLElement>("small");
          if (tooltip) {
            tooltip.className = "sample-tooltip";
            tooltip.id = `sample-tooltip-${sample.dataset.sampleInstance}`;
            tooltip.setAttribute("role", "tooltip");
            tooltip.hidden = true;
            button.setAttribute("aria-describedby", tooltip.id);
          }
        }
      });
      break;
    }
    case "popover-macos": {
      const anchor = sample.querySelector<HTMLElement>(".sample-anchor");
      if (anchor) {
        const button = asButton(anchor, "toggle-popover");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-haspopup", "dialog");
      }
      sample.querySelector<HTMLElement>(".sample-popover-macos > div")?.setAttribute("hidden", "");
      break;
    }
    case "combobox-autocomplete-typeahead": {
      const combobox = sample.querySelector<HTMLElement>(".sample-combobox");
      const oldInput = combobox?.querySelector<HTMLElement>(".sample-input-line");
      if (!combobox || !oldInput) break;
      const input = makeInput("Search people", "Search people", "sample-input-line sample-editable-input");
      input.value = "Lan";
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-expanded", "true");
      input.dataset.inputAction = "combobox-filter";
      oldInput.replaceWith(input);
      const options = Array.from(combobox.children).filter((child) => child !== input) as HTMLElement[];
      options.forEach((option) => {
        const label = option.querySelector("b")?.textContent?.trim() ?? option.textContent?.trim() ?? "Suggestion";
        const button = asButton(option, "combobox-option", label);
        button.classList.add("sample-option");
        button.setAttribute("role", "option");
      });
      const emptyState = document.createElement("div");
      emptyState.className = "sample-combobox-empty";
      emptyState.setAttribute("role", "status");
      emptyState.textContent = "No matching people";
      emptyState.hidden = true;
      combobox.append(emptyState);
      break;
    }
    case "command-palette": {
      const command = sample.querySelector<HTMLElement>(".sample-command");
      const searchRow = command?.querySelector<HTMLElement>(":scope > div");
      const placeholder = searchRow?.querySelector<HTMLElement>("span");
      if (placeholder && searchRow) {
        const input = makeInput("Search commands", "Search commands", "sample-command-input");
        input.dataset.inputAction = "command-filter";
        placeholder.replaceWith(input);
      }
      command?.querySelectorAll<HTMLElement>(":scope > span").forEach((option) => {
        const label = option.textContent?.trim() ?? "Command";
        asButton(option, "command-select", label);
      });
      break;
    }
    case "accordion-disclosure": {
      const accordion = sample.querySelector<HTMLElement>(".sample-accordion");
      if (!accordion) break;
      accordion.querySelectorAll<HTMLElement>(":scope > div").forEach((heading, index) => {
        const label = heading.querySelector("b")?.textContent?.trim() ?? "Disclosure";
        const button = asButton(heading, "accordion-toggle", label);
        button.setAttribute("aria-expanded", String(index === 0));
        const answer = button.nextElementSibling;
        if (answer instanceof HTMLElement && answer.tagName === "P") answer.hidden = index !== 0;
        else if (index === 1) {
          const paragraph = document.createElement("p");
          paragraph.textContent = "Add a supporting color only when it has a clear interface role and passes contrast checks.";
          paragraph.hidden = true;
          button.after(paragraph);
        }
      });
      break;
    }
    case "tabs": {
      const tabs = sample.querySelector<HTMLElement>(".sample-tabs");
      const nav = tabs?.querySelector<HTMLElement>("nav");
      if (!nav) break;
      nav.setAttribute("role", "tablist");
      nav.setAttribute("aria-label", "Project details");
      nav.querySelectorAll<HTMLElement>("b, span").forEach((tab, index) => {
        const button = asButton(tab, "select-tab");
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(index === 0));
        button.tabIndex = index === 0 ? 0 : -1;
        button.dataset.tab = button.textContent?.trim() ?? "Overview";
      });
      break;
    }
    case "empty-state": {
      const create = sample.querySelector<HTMLElement>(".sample-empty .sample-button");
      if (create) asButton(create, "create-project", "Create project");
      break;
    }
    case "switch-checkbox-radio": {
      const rows = sample.querySelectorAll<HTMLElement>(".sample-choice-set > div");
      rows.forEach((row, index) => {
        const control = row.querySelector<HTMLElement>(".sample-switch, .sample-checkbox, .sample-radio");
        const label = row.querySelector<HTMLElement>("span:last-child")?.textContent?.trim() ?? "Preference";
        if (!control) return;
        if (control.classList.contains("sample-switch")) {
          const button = asButton(control, "toggle-switch", label);
          button.setAttribute("role", "switch");
          button.setAttribute("aria-checked", String(button.classList.contains("is-on")));
        } else {
          const input = document.createElement("input");
          input.type = control.classList.contains("sample-checkbox") ? "checkbox" : "radio";
          input.name = input.type === "radio" ? `summary-${sample.dataset.sampleInstance}` : `drafts-${sample.dataset.sampleInstance}`;
          input.checked = control.classList.contains("is-on");
          input.className = `sample-native-${input.type}`;
          input.setAttribute("aria-label", label);
          input.dataset.controlLabel = label;
          control.replaceWith(input);
          if (input.type === "radio" && index === 2) input.checked = true;
        }
      });
      break;
    }
    case "toggle-group-segmented-control":
    case "segmented-control-macos": {
      const group = sample.querySelector<HTMLElement>(".sample-toggle-group, .sample-segmented");
      if (!group) break;
      group.setAttribute("role", "group");
      group.querySelectorAll<HTMLElement>("span, b").forEach((item) => {
        const button = asButton(item, "select-segment");
        const selected = button.tagName === "BUTTON" && (item.tagName === "B" || button.classList.contains("is-current"));
        button.setAttribute("aria-pressed", String(selected));
        if (selected) button.classList.add("is-current");
      });
      break;
    }
    case "popup-pulldown-combo-box": {
      sample.querySelectorAll<HTMLElement>(".sample-control-trio > div").forEach((control, index) => {
        const trigger = control.querySelector<HTMLElement>("b");
        if (!trigger) return;
        const label = ["Choose a color", "Open actions", "Choose or type a value"][index];
        const button = asButton(trigger, "toggle-popover", label);
        button.setAttribute("aria-haspopup", index === 1 ? "menu" : "listbox");
        button.setAttribute("aria-expanded", "false");
        const options = document.createElement("div");
        options.className = "sample-control-options";
        options.hidden = true;
        const values = index === 0 ? ["Blue", "Orange", "Green"] : index === 1 ? ["Edit", "Duplicate", "Delete"] : ["Choose or type", "Brand", "Documentation"];
        options.setAttribute("role", index === 1 ? "menu" : "listbox");
        values.forEach((value) => {
          const option = document.createElement("button");
          option.type = "button";
          option.textContent = value;
          if (index === 1) option.setAttribute("role", "menuitem");
          else {
            option.setAttribute("role", "option");
            option.setAttribute("aria-selected", "false");
          }
          setAction(option, "control-option", value);
          options.append(option);
        });
        control.append(options);
      });
      break;
    }
    case "menu-bar": {
      const bar = sample.querySelector<HTMLElement>(".sample-menu-bar");
      if (!bar) break;
      bar.querySelectorAll<HTMLElement>(":scope > span").forEach((item) => {
        const label = item.textContent?.trim() ?? "Menu";
        const button = asButton(item, "toggle-menubar", label + " menu");
        button.dataset.menuLabel = label;
        button.setAttribute("aria-haspopup", "menu");
        button.setAttribute("aria-expanded", "false");
      });
      const menu = document.createElement("div");
      menu.className = "sample-menu sample-menu-bar-panel";
      menu.setAttribute("role", "menu");
      menu.hidden = true;
      bar.append(menu);
      break;
    }
    case "search-field": {
      const field = sample.querySelector<HTMLElement>(".sample-search > span");
      if (field) {
        const input = makeInput("Search projects", "Search projects", "sample-search-input");
        input.dataset.inputAction = "search";
        field.replaceWith(input);
      }
      break;
    }
    case "save-panel": {
      sample.classList.add("sample-save-demo");
      const fields = sample.querySelectorAll<HTMLElement>(".sample-save-panel > div");
      fields.forEach((field) => {
        const label = field.querySelector("span")?.textContent?.trim() ?? "Field";
        const value = field.querySelector<HTMLElement>("strong");
        if (!value) return;
        const input = makeInput(value.textContent?.trim() ?? "", label, "sample-input-line sample-editable-input");
        input.value = value.textContent?.trim() ?? "";
        value.replaceWith(input);
      });
      sample.querySelectorAll<HTMLElement>(".sample-save-panel footer > small, .sample-save-panel footer > b").forEach((item) => {
        asButton(item, item.textContent?.trim() === "Save" ? "save-demo" : "cancel-save");
      });
      sample.append(visibleStatus("sample-save-feedback"));
      break;
    }
    case "token-field": {
      const tokens = sample.querySelector<HTMLElement>(".sample-token-field > div");
      if (!tokens) break;
      tokens.querySelectorAll<HTMLElement>(":scope > b").forEach((token) => {
        const label = token.childNodes[0]?.textContent?.trim() ?? "Recipient";
        const remove = token.querySelector<HTMLElement>("i");
        if (remove) asButton(remove, "remove-chip", `Remove ${label}`);
      });
      const add = tokens.querySelector<HTMLElement>("small");
      if (add) {
        const input = makeInput("Add a person", "Add a recipient", "sample-token-input");
        input.dataset.inputAction = "add-recipient";
        add.replaceWith(input);
      }
      break;
    }
    case "combo-button": {
      sample.classList.add("sample-combo-demo");
      const primary = sample.querySelector<HTMLElement>(".sample-combo-button > button[data-action='combo-primary']");
      const trigger = sample.querySelector<HTMLElement>(".sample-combo-button > button[aria-haspopup='menu']");
      const menu = sample.querySelector<HTMLElement>(".sample-combo-menu");
      menu?.querySelectorAll<HTMLElement>("[role='menuitem']").forEach((item) => { item.tabIndex = -1; });
      primary?.setAttribute("aria-label", "Save");
      trigger?.setAttribute("aria-expanded", "false");
      sample.append(visibleStatus("sample-combo-feedback"));
      break;
    }
    case "disclosure-triangle": {
      initializeDisclosureSample(sample);
      break;
    }
    case "delete-sheet": {
      sample.querySelectorAll<HTMLElement>(".sample-delete-sheet footer > span, .sample-delete-sheet footer > b").forEach((item) => {
        asButton(item, item.textContent?.trim() === "Delete" ? "confirm-delete" : "cancel-delete");
      });
      break;
    }
    case "stepper": {
      const controls = sample.querySelectorAll<HTMLElement>(".sample-stepper > span");
      if (controls[0]) asButton(controls[0], "stepper-dec", "Decrease quantity");
      if (controls[1]) asButton(controls[1], "stepper-inc", "Increase quantity");
      break;
    }
    case "toolbar-unified-title-bar": {
      const toolbar = sample.querySelector<HTMLElement>(".sample-toolbar");
      if (toolbar) {
        const demo = document.createElement("div");
        demo.className = "sample-toolbar-demo";
        toolbar.replaceWith(demo);
        demo.append(toolbar, visibleStatus("sample-toolbar-feedback"));
      }
      sample.querySelectorAll<HTMLElement>(".sample-toolbar > div i").forEach((icon, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sample-toolbar-action";
        setAction(button, "toolbar-action", index === 0 ? "Back" : index === 1 ? "Forward" : index === 2 ? "Search" : "Share");
        icon.setAttribute("aria-hidden", "true");
        icon.replaceWith(button);
        button.append(icon);
      });
      break;
    }
    case "traffic-lights-window-controls": {
      sample.querySelectorAll<HTMLElement>(".sample-traffic-lights > i").forEach((light, index) => {
        asButton(light, "window-control", ["Close window", "Minimize window", "Expand window"][index]);
      });
      break;
    }
    case "mac-window": {
      sample.querySelectorAll<HTMLElement>(".sample-mac-window > header > i").forEach((light, index) => {
        asButton(light, "window-control", ["Close window", "Minimize window", "Expand window"][index]);
      });
      break;
    }
    case "context-menu":
    case "desktop-sidebar-source-list":
    case "hamburger-menu-nav-drawer": {
      const candidates = sample.querySelectorAll<HTMLElement>(".sample-context-menu > span, .sample-source-list > b, .sample-source-list > span");
      candidates.forEach((item) => {
        const button = asButton(item, "menu-command");
        if (id === "context-menu") button.setAttribute("role", "menuitem");
      });
      if (id === "context-menu") {
        const menu = sample.querySelector<HTMLElement>(".sample-context-menu");
        if (menu) {
          menu.setAttribute("role", "menu");
          const example = document.createElement("div");
          example.className = "sample-context-example";
          menu.replaceWith(example);
          example.append(menu);

          const feedback = visibleStatus("sample-context-feedback");
          example.append(feedback);
        }
      }
      if (id === "desktop-sidebar-source-list") {
        const current = sample.querySelector<HTMLButtonElement>(".sample-source-list > button[data-action='menu-command']");
        current?.classList.add("is-current");
        current?.setAttribute("aria-current", "page");
      }
      break;
    }
    default:
      break;
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

function setCalendarOpen(picker: HTMLElement, open: boolean) {
  const calendar = picker.querySelector<HTMLElement>(".sample-calendar");
  const trigger = picker.querySelector<HTMLButtonElement>("[data-action='calendar-toggle']");
  if (!calendar || !trigger) return;
  picker.dataset.calendarOpen = String(open);
  calendar.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
}

function setCalendarMonth(calendar: HTMLElement, offset: number) {
  const [year, month] = (calendar.dataset.calendarMonth ?? "2026-09").split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  calendar.dataset.calendarMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  renderCalendar(calendar);
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
  calendar.querySelector<HTMLButtonElement>(`[data-date='${dateValue}']`)?.focus();
  announce(sample, message);
}

function refreshColorWellIds(well: HTMLElement, instance: string) {
  const palette = well.querySelector<HTMLElement>(".sample-color-popover");
  const customPanel = well.querySelector<HTMLElement>(".sample-color-custom");
  const paletteTrigger = well.querySelector<HTMLElement>("[data-action='toggle-color-palette']");
  const customTrigger = well.querySelector<HTMLElement>(".sample-color-more");
  const customLink = well.querySelector<HTMLElement>(".sample-color-custom-link");
  const input = well.querySelector<HTMLInputElement>(".sample-color-hex");
  const label = well.querySelector<HTMLLabelElement>(".sample-color-custom label");
  const help = well.querySelector<HTMLElement>(".sample-color-help");
  const prefix = `color-well-${instance}`;

  if (palette) palette.id = `${prefix}-palette`;
  if (customPanel) customPanel.id = `${prefix}-custom`;
  if (paletteTrigger && palette) paletteTrigger.setAttribute("aria-controls", palette.id);
  if (customTrigger && customPanel) customTrigger.setAttribute("aria-controls", customPanel.id);
  if (customLink && customPanel) customLink.setAttribute("aria-controls", customPanel.id);
  if (input) {
    input.id = `${prefix}-hex`;
    if (help) {
      help.id = `${prefix}-help`;
      input.setAttribute("aria-describedby", help.id);
    }
    if (label) label.htmlFor = input.id;
  }
}

function closeColorWellPanels(well: HTMLElement) {
  well.querySelectorAll<HTMLElement>(".sample-color-popover, .sample-color-custom").forEach((panel) => {
    panel.hidden = true;
    panel.classList.remove("opens-up");
  });
  well.querySelectorAll<HTMLElement>("[data-action='toggle-color-palette'], [data-action='toggle-color-custom']")
    .forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
}

function positionColorWellPanel(well: HTMLElement, trigger: HTMLElement, panel: HTMLElement) {
  const bounds = well.closest<HTMLElement>(".element-demo-stage, .element-preview")?.getBoundingClientRect();
  const triggerBounds = trigger.getBoundingClientRect();
  const panelHeight = panel.getBoundingClientRect().height;
  const below = bounds ? bounds.bottom - triggerBounds.bottom : window.innerHeight - triggerBounds.bottom;
  const above = bounds ? triggerBounds.top - bounds.top : triggerBounds.top;
  panel.classList.toggle("opens-up", below < panelHeight + 8 && above > below);
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
  const input = well.querySelector<HTMLInputElement>(".sample-color-hex");

  well.dataset.color = normalized;
  well.dataset.colorName = name;
  if (swatch) swatch.style.backgroundColor = normalized;
  if (title) title.textContent = name;
  if (hex) hex.textContent = normalized;
  if (trigger) trigger.setAttribute("aria-label", `Choose fill color. Current color: ${name}, ${normalized}`);
  if (input) {
    input.value = normalized;
    input.removeAttribute("aria-invalid");
  }
  well.querySelector<HTMLElement>(".sample-color-error")?.setAttribute("hidden", "");
  well.querySelectorAll<HTMLElement>(".sample-color-grid [role='option']").forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.color?.toUpperCase() === normalized));
  });
}

function runAction(sample: HTMLElement, button: HTMLElement) {
  const action = button.dataset.action;
  const id = sample.dataset.specimenId;

  switch (action) {
    case "combo-primary": {
      const group = button.closest<HTMLElement>(".sample-combo-button");
      const menu = group?.querySelector<HTMLElement>(".sample-combo-menu");
      const trigger = group?.querySelector<HTMLElement>("[aria-haspopup='menu']");
      const feedback = sample.querySelector<HTMLElement>(".sample-combo-feedback");
      if (menu) menu.hidden = true;
      trigger?.setAttribute("aria-expanded", "false");
      if (feedback) {
        feedback.textContent = "Saved.";
        feedback.hidden = false;
        feedback.focus();
      }
      announce(sample, "Saved.");
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
    case "select-nav":
      selectOne(button.parentElement ?? sample, ".sample-nav-item", button);
      announce(sample, `${button.getAttribute("aria-label")} selected.`);
      break;
    case "drawer-nav":
      selectOne(button.parentElement ?? sample, "button[data-action='drawer-nav']", button);
      announce(sample, `${button.getAttribute("aria-label")} selected.`);
      break;
    case "table-sort": {
      const table = button.closest<HTMLElement>(".sample-data-table");
      const key = button.dataset.sortKey;
      if (!table || !key) break;
      const direction = table.dataset.sortKey === key && table.dataset.sortDirection === "ascending"
        ? "descending"
        : "ascending";
      table.dataset.sortKey = key;
      table.dataset.sortDirection = direction;
      renderDataTable(table);
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
      presence.dataset.presenceState = status;
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
    case "truncation-width": {
      const truncation = button.closest<HTMLElement>(".sample-truncation");
      const width = button.dataset.width;
      if (!truncation || (width !== "narrow" && width !== "wide")) break;
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
      truncation.dataset.expanded = String(expanded);
      button.setAttribute("aria-pressed", String(expanded));
      button.textContent = expanded ? "Show truncation" : "Show full text";
      refreshTruncationFilename(truncation);
      const status = truncation.querySelector<HTMLElement>(".sample-truncation-status");
      if (status) status.textContent = expanded
        ? "Full text shown for every example."
        : `${truncation.dataset.width === "wide" ? "Wide" : "Narrow"} container. Full text stays available to assistive technology.`;
      break;
    }
    case "timeline-complete": {
      const item = button.closest<HTMLElement>(".sample-timeline-item.is-current");
      if (!item || button.getAttribute("aria-disabled") === "true") break;
      item.classList.remove("is-current");
      item.classList.add("is-complete");
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-label", "Order #4821 delivered");
      const title = item.querySelector<HTMLElement>("[data-timeline-title]");
      const detail = item.querySelector<HTMLElement>("[data-timeline-detail]");
      const status = sample.querySelector<HTMLElement>("[data-timeline-status]");
      const hint = sample.querySelector<HTMLElement>(".sample-timeline-hint");
      if (title) title.textContent = "Delivered";
      if (detail) detail.textContent = "The package arrived at your address.";
      if (status) status.textContent = "Delivered";
      if (hint) hint.textContent = "Order delivered.";
      announce(sample, "Order #4821 marked as delivered.");
      break;
    }
    case "table-page-prev":
    case "table-page-next": {
      const table = button.closest<HTMLElement>(".sample-data-table");
      if (!table) break;
      const pageCount = Math.max(1, Math.ceil(table.querySelectorAll("tbody tr[data-row-id]").length / Number(table.dataset.pageSize ?? "5")));
      const offset = action === "table-page-prev" ? -1 : 1;
      table.dataset.page = String(Math.max(1, Math.min(pageCount, Number(table.dataset.page ?? "1") + offset)));
      renderDataTable(table);
      announce(sample, table.querySelector<HTMLElement>("[data-table-page]")?.textContent ?? "Page updated.");
      break;
    }
    case "site-nav":
      {
        const nav = button.closest<HTMLElement>(".sample-site-header")?.querySelector<HTMLElement>("nav");
        if (nav) {
          selectOne(nav, "button[data-action='site-nav']", button);
          button.setAttribute("aria-current", "page");
        }
      }
      break;
    case "site-cta": {
      let feedback = sample.querySelector<HTMLElement>(".sample-site-feedback");
      if (!feedback) {
        feedback = document.createElement("span");
        feedback.className = "sample-site-feedback";
        feedback.setAttribute("role", "status");
        sample.append(feedback);
      }
      feedback.textContent = "Project inquiry selected.";
      break;
    }
    case "page-select": {
      const page = Number(button.dataset.page);
      sample.querySelectorAll<HTMLElement>(".sample-pagination button[data-action='page-select']").forEach((item) => {
        const active = Number(item.dataset.page) === page;
        item.classList.toggle("is-current", active);
        if (active) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
      announce(sample, `Page ${page} of 4 selected.`);
      break;
    }
    case "page-prev":
    case "page-next": {
      const pages = Array.from(sample.querySelectorAll<HTMLElement>(".sample-pagination button[data-action='page-select']"));
      const selected = pages.findIndex((item) => item.getAttribute("aria-current") === "page");
      const next = Math.max(0, Math.min(pages.length - 1, selected + (action === "page-prev" ? -1 : 1)));
      pages[next]?.click();
      break;
    }
    case "calendar-toggle": {
      const picker = button.closest<HTMLElement>(".sample-date-picker");
      const calendar = picker?.querySelector<HTMLElement>(".sample-calendar");
      if (!picker || !calendar) break;
      const open = calendar.hidden;
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
    case "carousel-select":
      selectOne(button.parentElement ?? sample, ".sample-carousel-card", button);
      announce(sample, `${button.getAttribute("aria-label")} selected.`);
      break;
    case "carousel-prev":
    case "carousel-next": {
      const cards = Array.from(sample.querySelectorAll<HTMLElement>(".sample-carousel-card"));
      const active = Math.max(0, cards.findIndex((card) => card.getAttribute("aria-pressed") === "true"));
      const next = (active + (action === "carousel-next" ? 1 : -1) + cards.length) % cards.length;
      cards[next]?.click();
      cards[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
      break;
    }
    case "replay-spring": {
      const demo = button.closest<HTMLElement>(".sample-spring");
      if (!demo) break;
      demo.classList.remove("is-playing");
      if (reducedMotionPreference.matches) {
        demo.querySelectorAll<HTMLElement>(".sample-spring-dot").forEach((dot) => { dot.style.left = "78%"; });
        break;
      }
      void demo.offsetWidth;
      demo.querySelectorAll<HTMLElement>(".sample-spring-dot").forEach((dot) => { dot.style.removeProperty("left"); });
      demo.classList.add("is-playing");
      break;
    }
    case "resize-send": {
      const status = sample.querySelector<HTMLElement>("[data-resize-status]");
      if (status) {
        status.hidden = false;
        status.textContent = "Demo message submitted.";
      }
      button.disabled = true;
      announce(sample, "Demo message submitted.");
      break;
    }
    case "confirm-delete":
      announce(sample, "The example item was removed.");
      button.disabled = true;
      break;
    case "cancel-delete": {
      const result = document.createElement("p");
      result.className = "sample-confirm-result";
      result.setAttribute("role", "status");
      result.textContent = "Removal canceled. No items were changed.";
      sample.replaceChildren(result);
      break;
    }
    case "stepper-dec":
    case "stepper-inc": {
      const value = sample.querySelector<HTMLElement>(".sample-stepper > b");
      if (!value) break;
      const next = Math.max(1, Number(value.textContent ?? "1") + (action === "stepper-inc" ? 1 : -1));
      value.textContent = String(next);
      announce(sample, `Quantity ${next}.`);
      break;
    }
    case "toggle-switch": {
      const next = button.getAttribute("aria-checked") !== "true";
      button.setAttribute("aria-checked", String(next));
      button.classList.toggle("is-on", next);
      announce(sample, `${button.getAttribute("aria-label")} ${next ? "enabled" : "disabled"}.`);
      break;
    }
    case "select-segment":
      selectOne(button.parentElement ?? sample, "button[data-action='select-segment']", button);
      announce(sample, `${button.textContent?.trim()} selected.`);
      break;
    case "select-tab": {
      const nav = button.parentElement;
      if (nav) selectOne(nav, "[role='tab']", button);
      const panel = sample.querySelector<HTMLElement>(".sample-tabs > div:last-child");
      const label = button.dataset.tab ?? button.textContent?.trim() ?? "Overview";
      const content: Record<string, string> = {
        Overview: "Key details for this workspace.",
        Activity: "Recent edits and review decisions appear here.",
        Files: "Brand guide, logo exports, and source files appear here.",
      };
      if (panel) {
        const heading = panel.querySelector("strong");
        const detail = panel.querySelector("small");
        if (heading) heading.textContent = `${label} details`;
        if (detail) detail.textContent = content[label] ?? "Example content for this tab.";
      }
      break;
    }
    case "accordion-toggle": {
      const answer = button.nextElementSibling;
      if (!(answer instanceof HTMLElement)) break;
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      answer.hidden = !open;
      break;
    }
    case "toggle-menu": {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      const menu = button.closest(".sample-overflow, .sample-combo-button")?.querySelector<HTMLElement>(".sample-menu");
      if (menu) menu.hidden = !expanded;
      if (expanded) {
        const owner = button.closest<HTMLElement>(".sample-overflow, .sample-combo-button");
        if (owner?.matches(".sample-combo-button")) {
          const feedback = owner.parentElement?.querySelector<HTMLElement>(".sample-combo-feedback");
          if (feedback) feedback.hidden = true;
        }
        owner?.querySelector<HTMLElement>(".sample-menu button")?.focus();
      }
      break;
    }
    case "toggle-menubar": {
      const bar = button.closest<HTMLElement>(".sample-menu-bar");
      const menu = bar?.querySelector<HTMLElement>(".sample-menu-bar-panel");
      if (!bar || !menu) break;
      const opening = button.getAttribute("aria-expanded") !== "true";
      bar.querySelectorAll<HTMLElement>("[data-action='toggle-menubar']").forEach((trigger) => {
        trigger.setAttribute("aria-expanded", String(trigger === button && opening));
        trigger.classList.toggle("is-current", trigger === button && opening);
      });
      menu.replaceChildren();
      if (opening) {
        const commands: Record<string, string[]> = {
          File: ["New document", "Open", "Save"],
          Edit: ["Undo", "Redo", "Select all"],
          View: ["Zoom in", "Zoom out", "Show toolbar"],
          Window: ["Minimize", "Restore", "Bring all to front"],
          Help: ["Keyboard shortcuts", "About this design system"],
        };
        for (const label of commands[button.dataset.menuLabel ?? ""] ?? ["Open", "Settings"]) {
          const item = document.createElement("button");
          item.type = "button";
          item.textContent = label;
          setAction(item, "menubar-command", label);
          menu.append(item);
        }
        menu.hidden = false;
        const barRect = bar.getBoundingClientRect();
        const triggerRect = button.getBoundingClientRect();
        const contentLeft = barRect.left + bar.clientLeft;
        const triggerLeft = triggerRect.left - contentLeft;
        const triggerRight = triggerRect.right - contentLeft;
        const preferredLeft = triggerLeft + menu.offsetWidth <= bar.clientWidth
          ? triggerLeft
          : triggerRight - menu.offsetWidth;
        const maxLeft = Math.max(0, bar.clientWidth - menu.offsetWidth);
        menu.style.setProperty("--sample-menu-bar-left", `${Math.min(Math.max(preferredLeft, 0), maxLeft)}px`);
        menu.querySelector<HTMLElement>("button")?.focus();
      } else {
        menu.hidden = true;
      }
      break;
    }
    case "menubar-command": {
      const bar = button.closest<HTMLElement>(".sample-menu-bar");
      const menu = button.closest<HTMLElement>(".sample-menu-bar-panel");
      const trigger = bar?.querySelector<HTMLElement>("[data-action='toggle-menubar'][aria-expanded='true']");
      const status = bar?.querySelector<HTMLElement>("[data-menu-status]");
      if (status) status.textContent = button.textContent?.trim() + " selected";
      if (menu) menu.hidden = true;
      trigger?.setAttribute("aria-expanded", "false");
      trigger?.classList.remove("is-current");
      trigger?.focus();
      break;
    }
    case "toggle-hover-card": {
      const trigger = button;
      const card = trigger.parentElement?.querySelector<HTMLElement>(".sample-hover-card");
      if (!card) break;
      const open = trigger.getAttribute("aria-expanded") !== "true";
      trigger.setAttribute("aria-expanded", String(open));
      card.hidden = !open;
      break;
    }
    case "toggle-lightbox": {
      const root = button.closest<HTMLElement>(".sample-lightbox");
      const viewer = root?.querySelector<HTMLElement>(".sample-lightbox-viewer");
      if (viewer) {
        viewer.hidden = false;
        viewer.querySelector<HTMLElement>("[data-action='close-lightbox']")?.focus();
      }
      break;
    }
    case "close-lightbox": {
      const root = button.closest<HTMLElement>(".sample-lightbox");
      const viewer = root?.querySelector<HTMLElement>(".sample-lightbox-viewer");
      const thumbnail = root?.querySelector<HTMLElement>(".sample-lightbox-thumbnail");
      if (viewer) viewer.hidden = true;
      thumbnail?.focus();
      break;
    }
    case "toggle-outline": {
      const branch = button.closest<HTMLElement>(".sample-outline-branch");
      const children = branch?.querySelector<HTMLElement>(":scope > .sample-outline-children");
      if (!children) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      const label = button.getAttribute("aria-label")?.replace(/^(Expand|Collapse) /, "") ?? "section";
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute("aria-label", (expanded ? "Collapse " : "Expand ") + label);
      children.hidden = !expanded;
      break;
    }
    case "select-outline":
      selectOne(sample, ".sample-outline-item", button, "is-current");
      break;
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
    case "toggle-color-custom":
    case "open-color-custom": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const panel = well?.querySelector<HTMLElement>(".sample-color-custom");
      const trigger = well?.querySelector<HTMLElement>(".sample-color-more");
      if (!well || !panel) break;
      const shouldOpen = action === "open-color-custom" || trigger?.getAttribute("aria-expanded") !== "true";
      closeColorWellPanels(well);
      if (!shouldOpen) break;
      panel.hidden = false;
      trigger?.setAttribute("aria-expanded", "true");
      positionColorWellPanel(well, trigger ?? button, panel);
      panel.querySelector<HTMLInputElement>(".sample-color-hex")?.focus();
      break;
    }
    case "return-color-palette": {
      const well = button.closest<HTMLElement>(".sample-color-well");
      const trigger = well?.querySelector<HTMLElement>("[data-action='toggle-color-palette']");
      const panel = well?.querySelector<HTMLElement>(".sample-color-popover");
      if (!well || !trigger || !panel) break;
      closeColorWellPanels(well);
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      positionColorWellPanel(well, trigger, panel);
      (panel.querySelector<HTMLElement>("[role='option'][aria-selected='true']")
        ?? panel.querySelector<HTMLElement>("[role='option']"))?.focus();
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
        input.focus();
        break;
      }
      setColorWellValue(well, value, "Custom color");
      closeColorWellPanels(well);
      well.querySelector<HTMLElement>("[data-action='toggle-color-custom']")?.focus();
      announce(sample, `Custom color ${value} applied.`);
      break;
    }
    case "toggle-popover": {
      const group = button.parentElement;
      const panel = group?.querySelector<HTMLElement>(".sample-control-options")
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
        panel.querySelector<HTMLElement>("[role='option'], [role='menuitem']")?.focus();
      } else {
        panel.classList.remove("opens-up");
      }
      break;
    }
    case "toggle-tooltip": {
      const tooltip = button.parentElement?.querySelector<HTMLElement>("[role='tooltip']");
      if (!tooltip) break;
      button.setAttribute("aria-expanded", "true");
      tooltip.hidden = false;
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
      if (id === "desktop-sidebar-source-list") {
        selectOne(sample, ".sample-source-list > button[data-action='menu-command']", button, "is-current");
        button.setAttribute("aria-current", "page");
        announce(sample, `${button.getAttribute("aria-label") ?? button.textContent?.trim()} selected.`);
        break;
      }
      if (id === "context-menu") {
        const menu = sample.querySelector<HTMLElement>(".sample-context-menu");
        const feedback = sample.querySelector<HTMLElement>(".sample-context-feedback");
        const command = button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "Command";
        if (menu) menu.hidden = true;
        if (feedback) {
          feedback.textContent = `${command} selected.`;
          feedback.hidden = false;
          feedback.focus();
        }
        announce(sample, `${command} selected.`);
        break;
      }
      if (id === "combo-button") {
        const command = button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "Command";
        const feedback = sample.querySelector<HTMLElement>(".sample-combo-feedback");
        button.closest<HTMLElement>(".sample-menu")?.setAttribute("hidden", "");
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
    case "combobox-option": {
      const input = sample.querySelector<HTMLInputElement>(".sample-combobox [role='combobox']");
      if (input) {
        input.value = button.querySelector("b")?.textContent?.trim() ?? button.textContent?.trim() ?? "";
        input.setAttribute("aria-expanded", "false");
      }
      sample.querySelectorAll<HTMLElement>(".sample-option").forEach((option) => { option.hidden = true; });
      announce(sample, `${input?.value} selected.`);
      input?.focus();
      break;
    }
    case "command-select":
      announce(sample, `${button.textContent?.trim()} command selected.`);
      break;
    case "remove-chip":
      button.closest(".sample-selected, .sample-token-field > div > b")?.remove();
      announce(sample, `${button.getAttribute("aria-label")?.replace("Remove ", "") ?? "Item"} removed.`);
      break;
    case "multi-dropdown-toggle": {
      const owner = button.closest<HTMLElement>(".sample-multi-checkbox");
      const panel = owner?.querySelector<HTMLElement>(".sample-multi-checkbox-options");
      if (!owner || !panel) break;
      panel.hidden = !panel.hidden;
      button.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) panel.querySelector<HTMLInputElement>("input")?.focus();
      break;
    }
    case "multi-token-option": {
      const field = button.closest<HTMLElement>(".sample-multi-token-field");
      const value = button.dataset.value;
      if (!field || !value || !addMultiSelectToken(field, value)) break;
      const input = field.querySelector<HTMLInputElement>(".sample-multi-token-input");
      if (input) input.value = "";
      const showcase = field.closest<HTMLElement>(".sample-multi-select-showcase");
      if (showcase) refreshMultiSelectShowcase(showcase);
      announce(sample, value + " added to selected teams.");
      input?.focus();
      break;
    }
    case "multi-token-remove": {
      const field = button.closest<HTMLElement>(".sample-multi-token-field");
      const value = button.dataset.value ?? "Team";
      button.closest<HTMLElement>("[data-multi-token]")?.remove();
      const showcase = field?.closest<HTMLElement>(".sample-multi-select-showcase");
      if (showcase) refreshMultiSelectShowcase(showcase);
      announce(sample, value + " removed from selected teams.");
      field?.querySelector<HTMLInputElement>(".sample-multi-token-input")?.focus();
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
      moved.forEach((option) => {
        option.setAttribute("aria-selected", "false");
        destination.append(option);
      });
      refreshMultiSelectShowcase(showcase);
      const names = moved.map((option) => option.dataset.value ?? option.textContent?.trim() ?? "Team");
      announce(sample, moved.length ? names.join(", ") + " moved." : "Select one or more teams first.");
      break;
    }
    case "create-project": {
      const title = sample.querySelector<HTMLElement>(".sample-empty > b");
      const message = sample.querySelector<HTMLElement>(".sample-empty > small");
      if (title) title.textContent = "Project created";
      if (message) message.textContent = "The new project is ready to configure.";
      button.disabled = true;
      announce(sample, "Project created.");
      break;
    }
    case "dismiss-toast":
      sample.querySelector(".sample-toast")?.remove();
      announce(sample, "Message dismissed.");
      break;
    case "surface-select": {
      selectOne(button.parentElement ?? sample, ".sample-surface-options button", button);
      const label = button.querySelector("b")?.textContent?.trim() ?? "Surface";
      const feedback = sample.querySelector<HTMLElement>("[data-surface-feedback]");
      if (feedback) feedback.textContent = `${label} selected. Use it when the task needs this level of focus and context.`;
      break;
    }
    case "save-demo":
    case "cancel-save": {
      const panel = sample.querySelector<HTMLElement>(".sample-save-panel");
      const feedback = sample.querySelector<HTMLElement>(".sample-save-feedback");
      const message = action === "save-demo" ? "Example saved locally. No file was created." : "Save canceled.";
      if (panel) panel.hidden = true;
      if (feedback) {
        feedback.textContent = message;
        feedback.hidden = false;
        feedback.focus();
      }
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
      const icon = button.querySelector<HTMLElement>("i");
      if (!password) break;
      const reveal = password.type === "password";
      password.type = reveal ? "text" : "password";
      button.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
      button.setAttribute("aria-pressed", String(reveal));
      if (icon) icon.className = reveal ? "fi-br-eye-crossed" : "fi-br-eye";
      break;
    }
    case "toolbar-action": {
      const action = button.getAttribute("aria-label") ?? "Toolbar";
      const feedback = sample.querySelector<HTMLElement>(".sample-toolbar-feedback");
      if (feedback) {
        feedback.textContent = `${action} action selected.`;
        feedback.hidden = false;
        feedback.focus();
      }
      announce(sample, `${action} action selected.`);
      break;
    }
    case "window-control": {
      const window = button.closest<HTMLElement>(".sample-mac-window, .sample-traffic-window");
      const label = button.getAttribute("aria-label");
      if (label === "Close window" && window) window.classList.toggle("is-closed");
      else if (label === "Minimize window" && window) window.classList.toggle("is-minimized");
      else if (label === "Expand window" && window) window.classList.toggle("is-expanded");
      announce(sample, `${button.getAttribute("aria-label")} activated.`);
      break;
    }
    case "toggle-disclosure": {
      const branch = button.closest<HTMLElement>(".sample-disclosure-branch");
      const children = branch?.querySelector<HTMLElement>(":scope > .sample-disclosure-children");
      if (!children) break;
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      children.hidden = !expanded;
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

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  document.querySelectorAll<HTMLElement>(".sample-date-picker[data-calendar-open='true']").forEach((picker) => {
    if (!picker.contains(target)) setCalendarOpen(picker, false);
  });

  if (!target.closest("[data-open-demo]")) {
    document.querySelectorAll<HTMLElement>(".sample-multi-checkbox").forEach((owner) => {
      if (owner.contains(target)) return;
      const trigger = owner.querySelector<HTMLButtonElement>("[data-action='multi-dropdown-toggle']");
      const panel = owner.querySelector<HTMLElement>(".sample-multi-checkbox-options");
      if (trigger && panel && !panel.hidden) {
        panel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    document.querySelectorAll<HTMLElement>(".sample-multi-token-field").forEach((owner) => {
      if (owner.contains(target)) return;
      const input = owner.querySelector<HTMLInputElement>(".sample-multi-token-input");
      const panel = owner.querySelector<HTMLElement>(".sample-multi-token-options");
      if (input && panel && !panel.hidden) {
        panel.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll<HTMLElement>(".sample-color-well").forEach((well) => {
    if (!well.contains(target)) closeColorWellPanels(well);
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
        if (clone.dataset.specimenId === "date-picker") enhanceCalendar(clone);
        if (clone.dataset.specimenId === "sign-in-form") initializeLoginSample(clone);
        if (clone.dataset.specimenId === "multi-select") initializeMultiSelectIds(clone, clone.dataset.sampleInstance);
        clone.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((input) => {
          input.name = `${input.name}-${sampleInstance}`;
        });
      }
      dialogStage.replaceChildren(clone);
      if (clone instanceof HTMLElement && clone.dataset.specimenId === "scrollspy") initializeScrollspy(clone);
      dialog.showModal();
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
      const top = heading.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
      content.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
      heading.focus({ preventScroll: true });
      setCurrentScrollspyLink(sample, key);
    }
    return;
  }

  if (target.closest("[data-close-demo]") && dialog?.open) {
    dialog.close();
    return;
  }

  const actionButton = target.closest<HTMLElement>("[data-action]");
  const sample = actionButton?.closest<HTMLElement>(".ui-sample");
  if (actionButton && sample) {
    if (actionButton.dataset.action === "submit-demo" && actionButton instanceof HTMLButtonElement && actionButton.type === "submit") return;
    if (actionButton.dataset.action === "choose-files") {
      sample.querySelector<HTMLInputElement>("input[type='file']")?.click();
      return;
    }
    runAction(sample, actionButton);
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

  switch (input.dataset.inputAction) {
    case "multi-select-filter": {
      const field = input.closest<HTMLElement>(".sample-multi-token-field");
      const panel = field?.querySelector<HTMLElement>(".sample-multi-token-options");
      const showcase = field?.closest<HTMLElement>(".sample-multi-select-showcase");
      if (panel) panel.hidden = false;
      if (showcase) refreshMultiSelectShowcase(showcase);
      break;
    }
    case "combobox-filter": {
      const value = input.value.toLocaleLowerCase();
      const options = Array.from(sample.querySelectorAll<HTMLElement>(".sample-option"));
      options.forEach((option) => { option.hidden = !option.textContent?.toLocaleLowerCase().includes(value); });
      const hasMatches = options.some((option) => !option.hidden);
      const emptyState = sample.querySelector<HTMLElement>(".sample-combobox-empty");
      if (emptyState) emptyState.hidden = hasMatches;
      input.setAttribute("aria-expanded", "true");
      break;
    }
    case "command-filter": {
      const value = input.value.toLocaleLowerCase();
      sample.querySelectorAll<HTMLElement>(".sample-command > button").forEach((option) => {
        option.hidden = !option.textContent?.toLocaleLowerCase().includes(value);
      });
      break;
    }
    case "search":
      announce(sample, input.value ? `Search query: ${input.value}` : "Enter a project name to search.");
      break;
    case "volume": {
      const value = sample.querySelector<HTMLElement>(".sample-volume > b");
      if (value) value.textContent = `${input.value}%`;
      break;
    }
    case "color-hex": {
      input.removeAttribute("aria-invalid");
      const error = sample.querySelector<HTMLElement>(".sample-color-error");
      if (error) error.hidden = true;
      break;
    }
    case "files": {
      const zone = sample.querySelector<HTMLElement>(".sample-dropzone");
      if (zone && input.files?.length) showDropResult(zone, input.files);
      announce(sample, input.files?.length ? `${input.files.length} file${input.files.length === 1 ? "" : "s"} selected.` : "No files selected.");
      break;
    }
    default:
      break;
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const sample = target.closest<HTMLElement>(".ui-sample");

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
        panel.hidden = false;
        target.setAttribute("aria-expanded", "true");
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
      panel.hidden = false;
      target.setAttribute("aria-expanded", "true");
      firstOption.focus();
    }
  }

  if (target.dataset.inputAction === "add-team" || target.dataset.inputAction === "add-recipient") {
    if (event.key === "Enter" && target.value.trim() && sample) {
      event.preventDefault();
      const holder = sample.querySelector<HTMLElement>(target.dataset.inputAction === "add-team" ? ".sample-multiselect" : ".sample-token-field > div");
      if (holder) addChip(holder, target.value.trim(), target.dataset.inputAction === "add-team" ? "sample-selected" : "sample-token-chip");
      target.value = "";
      announce(sample, "Recipient added.");
    }
  }

  if (target.matches(".sample-color-hex") && event.key === "Enter") {
    event.preventDefault();
    target.closest<HTMLElement>(".sample-color-well")?.querySelector<HTMLElement>("[data-action='apply-color']")?.click();
  }

  if (target.matches("[role='tab']") && ["ArrowRight", "ArrowLeft"].includes(event.key)) {
    const tabs = Array.from(target.parentElement?.querySelectorAll<HTMLElement>("[role='tab']") ?? []);
    const index = tabs.indexOf(target);
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  if (target.matches("[role='option'], [role='menuitem']") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    const group = target.closest<HTMLElement>("[role='listbox'], [role='menu']");
    const options = Array.from(group?.querySelectorAll<HTMLElement>("[role='option'], [role='menuitem']") ?? []);
    const index = options.indexOf(target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    event.preventDefault();
    options[next]?.focus();
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
      panel.hidden = false;
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
      multiCheckboxPanel.hidden = true;
      multiCheckboxTrigger.setAttribute("aria-expanded", "false");
      multiCheckboxTrigger.focus();
      event.preventDefault();
      return;
    }
    const multiTokenField = target.closest<HTMLElement>(".sample-multi-token-field");
    const multiTokenInput = multiTokenField?.querySelector<HTMLInputElement>(".sample-multi-token-input");
    const multiTokenPanel = multiTokenField?.querySelector<HTMLElement>(".sample-multi-token-options");
    if (multiTokenInput?.getAttribute("aria-expanded") === "true" && multiTokenPanel) {
      multiTokenPanel.hidden = true;
      multiTokenInput.setAttribute("aria-expanded", "false");
      multiTokenInput.focus();
      event.preventDefault();
      return;
    }
    const viewer = target.closest<HTMLElement>(".sample-lightbox-viewer");
    if (viewer) {
      viewer.querySelector<HTMLElement>("[data-action='close-lightbox']")?.click();
      event.preventDefault();
      return;
    }
    const hover = target.closest<HTMLElement>(".sample-hover");
    const hoverTrigger = hover?.querySelector<HTMLElement>(".sample-hover-trigger");
    const hoverCard = hover?.querySelector<HTMLElement>(".sample-hover-card");
    if (hoverTrigger?.getAttribute("aria-expanded") === "true" && hoverCard) {
      hoverTrigger.setAttribute("aria-expanded", "false");
      hoverCard.hidden = true;
      hoverTrigger.focus();
      event.preventDefault();
      return;
    }
    const colorWell = target.closest<HTMLElement>(".sample-color-well");
    const colorTrigger = colorWell?.querySelector<HTMLElement>(".sample-color-trigger[aria-expanded='true'], .sample-color-more[aria-expanded='true']");
    const colorPanel = colorWell?.querySelector<HTMLElement>(".sample-color-popover:not([hidden]), .sample-color-custom:not([hidden])");
    if (colorWell && colorTrigger && colorPanel) {
      closeColorWellPanels(colorWell);
      colorTrigger.focus();
      event.preventDefault();
      return;
    }
    const expanded = target.closest<HTMLElement>(".sample-overflow, .sample-combo-button, .sample-overlay-trio > div, .sample-popover-macos, .sample-control-trio > div, .sample-menu-bar");
    const trigger = expanded?.querySelector<HTMLElement>("[aria-expanded='true']");
    const panel = expanded?.querySelector<HTMLElement>(".sample-menu, .sample-control-options, [role='tooltip']");
    if (trigger && panel) {
      event.preventDefault();
      trigger.setAttribute("aria-expanded", "false");
      panel.hidden = true;
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

document.addEventListener("pointerover", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const trigger = target?.closest<HTMLElement>(".sample-hover-trigger");
  const card = trigger?.parentElement?.querySelector<HTMLElement>(".sample-hover-card");
  if (!trigger || !card) return;
  trigger.setAttribute("aria-expanded", "true");
  card.hidden = false;
});

document.addEventListener("pointerout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const owner = target?.closest<HTMLElement>(".sample-hover");
  if (!owner || (event.relatedTarget instanceof Node && owner.contains(event.relatedTarget))) return;
  owner.querySelector<HTMLElement>(".sample-hover-trigger")?.setAttribute("aria-expanded", "false");
  const card = owner.querySelector<HTMLElement>(".sample-hover-card");
  if (card) card.hidden = true;
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const tokenInput = target?.closest<HTMLInputElement>(".sample-multi-token-input");
  const tokenField = tokenInput?.closest<HTMLElement>(".sample-multi-token-field");
  const tokenPanel = tokenField?.querySelector<HTMLElement>(".sample-multi-token-options");
  const tokenShowcase = tokenField?.closest<HTMLElement>(".sample-multi-select-showcase");
  if (tokenInput && tokenPanel && tokenShowcase) {
    tokenPanel.hidden = false;
    refreshMultiSelectShowcase(tokenShowcase);
  }
  const trigger = target?.closest<HTMLElement>(".sample-hover-trigger");
  const card = trigger?.parentElement?.querySelector<HTMLElement>(".sample-hover-card");
  if (!trigger || !card) return;
  trigger.setAttribute("aria-expanded", "true");
  card.hidden = false;
});

document.addEventListener("focusout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const owner = target?.closest<HTMLElement>(".sample-hover");
  if (!owner || (event.relatedTarget instanceof Node && owner.contains(event.relatedTarget))) return;
  owner.querySelector<HTMLElement>(".sample-hover-trigger")?.setAttribute("aria-expanded", "false");
  const card = owner.querySelector<HTMLElement>(".sample-hover-card");
  if (card) card.hidden = true;
});

document.addEventListener("dragover", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const zone = target?.closest<HTMLElement>(".sample-dropzone");
  if (!zone) return;
  event.preventDefault();
  zone.classList.add("is-dragging");
});

document.addEventListener("dragleave", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  target?.closest<HTMLElement>(".sample-dropzone")?.classList.remove("is-dragging");
});

document.addEventListener("drop", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const zone = target?.closest<HTMLElement>(".sample-dropzone");
  if (!zone || !event.dataTransfer) return;
  event.preventDefault();
  zone.classList.remove("is-dragging");
  const sample = zone.closest<HTMLElement>(".ui-sample");
  const count = event.dataTransfer.files.length;
  if (count) showDropResult(zone, event.dataTransfer.files);
  if (sample) announce(sample, count ? `${count} file${count === 1 ? "" : "s"} dropped.` : "No files dropped.");
});

document.addEventListener("change", (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const sample = input?.closest<HTMLElement>(".ui-sample");
  if (!input || !sample) return;
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
    const value = sample.querySelector<HTMLElement>(".sample-volume > b");
    if (value) value.textContent = `${input.value}%`;
  }
});

const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateParallaxLayers(viewport: HTMLElement) {
  const scrollPosition = reducedMotionPreference.matches ? 0 : viewport.scrollTop;
  viewport.querySelectorAll<HTMLElement>("[data-parallax-speed]").forEach((layer) => {
    const speed = Number(layer.dataset.parallaxSpeed ?? "1");
    layer.style.setProperty("--parallax-offset-y", `${scrollPosition * (1 - speed)}px`);
  });
}

document.addEventListener("scroll", (event) => {
  const viewport = event.target instanceof HTMLElement ? event.target : null;
  if (viewport?.matches(".sample-parallax-viewport")) updateParallaxLayers(viewport);
}, true);

reducedMotionPreference.addEventListener("change", () => {
  document.querySelectorAll<HTMLElement>(".sample-parallax-viewport").forEach(updateParallaxLayers);
});

document.addEventListener("pointerover", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const trigger = target?.closest<HTMLElement>("[data-action='toggle-tooltip']");
  const tooltip = trigger?.parentElement?.querySelector<HTMLElement>("[role='tooltip']");
  if (trigger && tooltip) {
    tooltip.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }
});

document.addEventListener("pointerout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const example = target?.closest<HTMLElement>(".sample-overlay-trio > div");
  const trigger = example?.querySelector<HTMLElement>("[data-action='toggle-tooltip']");
  const tooltip = example?.querySelector<HTMLElement>("[role='tooltip']");
  if (trigger && tooltip && !example?.contains(event.relatedTarget as Node | null)) {
    tooltip.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const trigger = target?.closest<HTMLElement>("[data-action='toggle-tooltip']");
  const tooltip = trigger?.parentElement?.querySelector<HTMLElement>("[role='tooltip']");
  if (trigger && tooltip) {
    tooltip.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }
});

document.addEventListener("focusout", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const example = target?.closest<HTMLElement>(".sample-overlay-trio > div");
  const trigger = example?.querySelector<HTMLElement>("[data-action='toggle-tooltip']");
  const tooltip = example?.querySelector<HTMLElement>("[role='tooltip']");
  if (trigger && tooltip && !example?.contains(event.relatedTarget as Node | null)) {
    tooltip.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll<HTMLDialogElement>(".element-demo-dialog").forEach((elementDialog) => {
  elementDialog.addEventListener("click", (event) => {
    if (event.target === elementDialog) elementDialog.close();
  });
  elementDialog.addEventListener("close", () => {
    const sample = dialogStage?.querySelector<HTMLElement>(".ui-sample[data-specimen-id='scrollspy']");
    if (sample) destroyScrollspy(sample);
  });
});
