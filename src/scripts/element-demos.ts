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

function makeInput(placeholder: string, label: string, className = "sample-input-line") {
  const input = document.createElement("input");
  input.type = "text";
  input.className = className;
  input.placeholder = placeholder;
  input.setAttribute("aria-label", label);
  return input;
}

function enhanceCalendar(sample: HTMLElement) {
  const calendar = sample.querySelector<HTMLElement>(".sample-calendar");
  const title = calendar?.querySelector<HTMLElement>("header b");
  const grid = calendar?.querySelector<HTMLElement>(".sample-calendar-grid");
  if (!calendar || !title || !grid) return;

  const controls = calendar.querySelectorAll<HTMLElement>("header span");
  if (controls[0]) asButton(controls[0], "calendar-prev", "Previous month");
  if (controls[1]) asButton(controls[1], "calendar-next", "Next month");
  calendar.dataset.calendarMonth = "2026-09";
  calendar.dataset.selectedDate = "2026-09-25";
  renderCalendar(calendar);
}

function renderCalendar(calendar: HTMLElement) {
  const title = calendar.querySelector<HTMLElement>("header b");
  const grid = calendar.querySelector<HTMLElement>(".sample-calendar-grid");
  if (!title || !grid) return;

  const monthValue = calendar.dataset.calendarMonth ?? "2026-09";
  const [year, month] = monthValue.split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(firstDate);
  title.textContent = monthName;
  title.setAttribute("aria-live", "polite");
  grid.replaceChildren();

  for (const weekday of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
    const label = document.createElement("small");
    label.textContent = weekday;
    grid.append(label);
  }

  const offset = (firstDate.getDay() + 6) % 7;
  for (let blank = 0; blank < offset; blank += 1) {
    const spacer = document.createElement("span");
    spacer.setAttribute("aria-hidden", "true");
    grid.append(spacer);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-calendar-day";
    button.textContent = String(day);
    button.dataset.date = dateValue;
    button.setAttribute("aria-label", new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(year, month - 1, day)));
    button.setAttribute("aria-pressed", String(calendar.dataset.selectedDate === dateValue));
    if (calendar.dataset.selectedDate === dateValue) button.classList.add("is-selected");
    setAction(button, "calendar-day");
    grid.append(button);
  }
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
      const inputLine = sample.querySelector<HTMLElement>(".sample-multiselect > .sample-input-line");
      const container = sample.querySelector<HTMLElement>(".sample-multiselect");
      if (!container) break;
      sample.querySelectorAll<HTMLElement>(".sample-selected").forEach((chip) => {
        const label = chip.childNodes[0]?.textContent?.trim() ?? "Selected item";
        const oldRemove = chip.querySelector<HTMLElement>("b");
        if (oldRemove) asButton(oldRemove, "remove-chip", `Remove ${label}`);
      });
      if (inputLine) {
        const input = makeInput("Add a team", "Add a team");
        input.dataset.inputAction = "add-team";
        inputLine.replaceWith(input);
      }
      break;
    }
    case "sign-in-form": {
      const fields = sample.querySelectorAll<HTMLElement>(".sample-login > span");
      const lines = sample.querySelectorAll<HTMLElement>(".sample-login > .sample-input-line");
      const definitions = [
        { label: "Email address", type: "email", placeholder: "name@company.com" },
        { label: "Password", type: "password", placeholder: "Enter your password" },
      ];
      definitions.forEach((definition, index) => {
        const oldLabel = fields[index];
        const oldInput = lines[index];
        if (!oldLabel || !oldInput) return;
        const input = document.createElement("input");
        input.type = definition.type;
        input.className = "sample-input-line sample-editable-input";
        input.placeholder = definition.placeholder;
        input.id = "sample-login-field-" + ++fieldInstance;
        input.setAttribute("aria-label", definition.label);
        input.setAttribute("aria-invalid", "false");
        if (definition.type === "email") input.autocomplete = "email";
        if (definition.type === "password") input.autocomplete = "current-password";
        const label = document.createElement("label");
        label.textContent = definition.label;
        label.htmlFor = input.id;
        oldLabel.replaceWith(label);
        oldInput.replaceWith(input);
      });
      const submit = sample.querySelector<HTMLElement>(".sample-login > .sample-button");
      if (submit) asButton(submit, "submit-demo", "Sign in");
      const error = document.createElement("p");
      error.id = "sample-login-error-" + ++fieldInstance;
      error.className = "sample-form-error";
      error.setAttribute("role", "alert");
      error.hidden = true;
      error.textContent = "Enter a valid email address and password.";
      sample.querySelector(".sample-login > button")?.after(error);
      sample.querySelectorAll<HTMLInputElement>(".sample-login input").forEach((input) => input.setAttribute("aria-describedby", error.id));
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
      const grip = sample.querySelector<HTMLElement>(".sample-resize-grip");
      if (!grip) break;
      const handle = asButton(grip, "resize-panel", "Resize panel");
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-orientation", "vertical");
      handle.tabIndex = 0;
      handle.setAttribute("aria-valuemin", "25");
      handle.setAttribute("aria-valuemax", "75");
      handle.setAttribute("aria-valuenow", "55");
      const panel = sample.querySelector<HTMLElement>(".sample-resize");
      if (panel) panel.dataset.split = "55";
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

function setCalendarMonth(calendar: HTMLElement, offset: number) {
  const [year, month] = (calendar.dataset.calendarMonth ?? "2026-09").split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  calendar.dataset.calendarMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  renderCalendar(calendar);
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
    case "calendar-prev":
      if (button.closest(".sample-calendar")) setCalendarMonth(button.closest<HTMLElement>(".sample-calendar")!, -1);
      break;
    case "calendar-next":
      if (button.closest(".sample-calendar")) setCalendarMonth(button.closest<HTMLElement>(".sample-calendar")!, 1);
      break;
    case "calendar-day": {
      const calendar = button.closest<HTMLElement>(".sample-calendar");
      if (!calendar || !button.dataset.date) break;
      calendar.dataset.selectedDate = button.dataset.date;
      renderCalendar(calendar);
      const selected = calendar.querySelector<HTMLElement>(`[data-date="${button.dataset.date}"]`);
      selected?.focus();
      announce(sample, `${selected?.getAttribute("aria-label")} selected.`);
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
    case "resize-panel": {
      const panel = sample.querySelector<HTMLElement>(".sample-resize");
      if (!panel) break;
      const current = Number(panel.dataset.split ?? "55");
      const next = Math.max(25, Math.min(75, current + (button.dataset.delta === "-" ? -5 : 5)));
      panel.dataset.split = String(next);
      button.setAttribute("aria-valuenow", String(next));
      panel.style.setProperty("--sample-split", `${next}%`);
      announce(sample, `Panel width ${next} percent.`);
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
      const email = sample.querySelector<HTMLInputElement>("input[type='email']");
      const password = sample.querySelector<HTMLInputElement>("input[type='password']");
      const valid = Boolean(email?.value.includes("@") && password?.value.length);
      announce(sample, valid ? "Example sign-in accepted." : "Enter a valid email address and password.");
      if (email) email.setAttribute("aria-invalid", String(!email.value.includes("@")));
      if (password) password.setAttribute("aria-invalid", String(!password.value.length));
      const error = sample.querySelector<HTMLElement>(".sample-form-error");
      if (error) error.hidden = valid;
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

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

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

  switch (input.dataset.inputAction) {
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

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target?.matches("[data-action='resize-panel']")) return;
  target.dataset.pointerStart = String(event.clientX);
  target.setPointerCapture?.(event.pointerId);
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

document.addEventListener("pointerup", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target?.matches("[data-action='resize-panel']")) return;
  delete target.dataset.pointerStart;
});

document.addEventListener("pointermove", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target?.matches("[data-action='resize-panel']") || target.dataset.pointerStart === undefined) return;
  const panel = target.closest<HTMLElement>(".sample-resize");
  if (!panel) return;
  const bounds = panel.getBoundingClientRect();
  const percentage = Math.max(25, Math.min(75, Math.round(((event.clientX - bounds.left) / bounds.width) * 100)));
  panel.dataset.split = String(percentage);
  panel.style.setProperty("--sample-split", `${percentage}%`);
  target.setAttribute("aria-valuenow", String(percentage));
});

document.addEventListener("change", (event) => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const sample = input?.closest<HTMLElement>(".ui-sample");
  if (!input || !sample) return;
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
