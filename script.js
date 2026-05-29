const donenessProfiles = {
  rare: { label: "Rare", cookMinutes: 6 },
  "medium-rare": { label: "Medium rare", cookMinutes: 8 },
  medium: { label: "Medium", cookMinutes: 10 },
  "medium-well": { label: "Medium well", cookMinutes: 12 },
  "well-done": { label: "Well done", cookMinutes: 14 },
};

const guestForm = document.querySelector("#guest-form");
const guestNameInput = document.querySelector("#guest-name");
const donenessSelect = document.querySelector("#doneness");
const serveTimeInput = document.querySelector("#serve-time");
const restMinutesInput = document.querySelector("#rest-minutes");
const guestList = document.querySelector("#guest-list");
const emptyState = document.querySelector("#empty-state");
const results = document.querySelector("#results");
const scheduleBody = document.querySelector("#schedule-body");
const timeline = document.querySelector("#timeline");

let guestId = 0;

function nextGuestId() {
  guestId += 1;
  return `guest-${guestId}`;
}

let guests = [
  { id: nextGuestId(), name: "Alex", doneness: "rare" },
  { id: nextGuestId(), name: "Jordan", doneness: "medium-rare" },
  { id: nextGuestId(), name: "Taylor", doneness: "well-done" },
];

function formatMinutes(totalMinutes) {
  const minutesInDay = 24 * 60;
  const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function buildSchedule() {
  const serveMinutes = parseTime(serveTimeInput.value);
  const restMinutes = Number(restMinutesInput.value);

  if (serveMinutes === null || Number.isNaN(restMinutes)) {
    return [];
  }

  return guests
    .map((guest) => {
      const profile = donenessProfiles[guest.doneness];
      const offTime = serveMinutes - restMinutes;
      const onTime = offTime - profile.cookMinutes;
      const flipTime = onTime + Math.ceil(profile.cookMinutes / 2);

      return {
        ...guest,
        preference: profile.label,
        onTime,
        flipTime,
        offTime,
        serveTime: serveMinutes,
      };
    })
    .sort((left, right) => left.onTime - right.onTime || left.name.localeCompare(right.name));
}

function renderGuests() {
  guestList.innerHTML = "";

  guests.forEach((guest) => {
    const item = document.createElement("li");
    item.className = "guest-card";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    const preference = document.createElement("span");
    const removeButton = document.createElement("button");

    title.textContent = guest.name;
    preference.textContent = donenessProfiles[guest.doneness].label;
    removeButton.type = "button";
    removeButton.dataset.removeId = guest.id;
    removeButton.textContent = "Remove";

    details.append(title, preference);
    item.append(details, removeButton);
    guestList.appendChild(item);
  });
}

function renderSchedule() {
  const schedule = buildSchedule();

  if (!schedule.length) {
    emptyState.classList.remove("hidden");
    results.classList.add("hidden");
    scheduleBody.innerHTML = "";
    timeline.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  results.classList.remove("hidden");

  scheduleBody.innerHTML = "";
  schedule.forEach((entry) => {
    const row = document.createElement("tr");

    [
      entry.name,
      entry.preference,
      formatMinutes(entry.onTime),
      formatMinutes(entry.flipTime),
      formatMinutes(entry.offTime),
      formatMinutes(entry.serveTime),
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    scheduleBody.appendChild(row);
  });

  const actions = schedule
    .flatMap((entry) => [
      { time: entry.onTime, label: `Put ${entry.name}'s ${entry.preference.toLowerCase()} steak on.` },
      { time: entry.flipTime, label: `Flip ${entry.name}'s steak.` },
      { time: entry.offTime, label: `Take ${entry.name}'s steak off to rest.` },
      { time: entry.serveTime, label: `Serve ${entry.name}'s steak.` },
    ])
    .sort((left, right) => left.time - right.time || left.label.localeCompare(right.label));

  timeline.innerHTML = "";
  actions.forEach((action) => {
    const item = document.createElement("li");
    const time = document.createElement("strong");

    time.textContent = formatMinutes(action.time);
    item.append(time, ` — ${action.label}`);
    timeline.appendChild(item);
  });
}

guestForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = guestNameInput.value.trim();
  if (!name) {
    return;
  }

  guests = [
    ...guests,
    {
      id: nextGuestId(),
      name,
      doneness: donenessSelect.value,
    },
  ];

  guestForm.reset();
  donenessSelect.value = "medium-rare";
  renderGuests();
  renderSchedule();
  guestNameInput.focus();
});

guestList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const { removeId } = target.dataset;
  if (!removeId) {
    return;
  }

  guests = guests.filter((guest) => guest.id !== removeId);
  renderGuests();
  renderSchedule();
});

serveTimeInput.addEventListener("input", renderSchedule);
restMinutesInput.addEventListener("input", renderSchedule);

renderGuests();
renderSchedule();
