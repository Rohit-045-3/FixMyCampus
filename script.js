const DEPARTMENTS = {
  "CSE": { icon: "💻", name: "Computer Science & Engineering", issues: ["Computer not working", "Slow internet / Wi-Fi", "Software installation issue", "Keyboard / mouse damage", "Projector or smart board issue", "Lab equipment shortage", "Power backup issue", "Classroom furniture damage"] },
  "EEE": { icon: "⚡", name: "Electrical & Electronics Engineering", issues: ["Electrical lab equipment fault", "Power supply problem", "Training board damage", "Electrical instrument shortage", "Lab lighting issue", "Safety equipment issue", "Projector / computer issue"] },
  "ECE": { icon: "🔌", name: "Electronics & Communication Engineering", issues: ["Circuit board not working", "Oscilloscope / instrument fault", "Electronic components shortage", "Communication lab equipment fault", "Soldering station issue", "Lab computer issue", "Projector issue"] },
  "Civil": { icon: "🏗️", name: "Civil Engineering", issues: ["Surveying instrument fault", "Concrete testing equipment issue", "Construction material shortage", "Drawing room facility issue", "Lab furniture damage", "Building maintenance issue", "Water leakage"] },
  "Mechanical": { icon: "⚙️", name: "Mechanical Engineering", issues: ["Workshop machine not working", "Tools shortage", "Lathe machine maintenance", "Mechanical lab equipment fault", "Workshop ventilation issue", "Machine safety guard issue", "Workshop lighting issue"] },
  "Other department": { icon: "📚", name: "Other department", issues: ["Classroom facility issue", "Equipment not working", "Furniture damage", "Internet issue", "Maintenance request", "Other department issue"] },
  "Common campus": { icon: "🏫", name: "Common campus", issues: ["Drinking water problem", "Washroom cleanliness", "Garbage / sanitation", "Classroom fan or light", "Damaged bench", "Hostel maintenance", "Campus road damage", "Library facility", "Canteen hygiene", "Parking problem", "Campus Wi-Fi", "Safety / security concern", "Accessibility issue", "Sports facility issue", "Transport issue"] }
};

const FACILITIES = [
  { name: "Classrooms", icon: "🏫", desc: "Learning spaces, furniture, lighting and ventilation.", issues: ["Broken benches", "Fans and lights", "Projector", "Door / window", "Cleanliness"] },
  { name: "Laboratories", icon: "🧪", desc: "Practical lab equipment, safety and maintenance.", issues: ["Equipment fault", "Tools shortage", "Power supply", "Safety gear", "Lab cleanliness"] },
  { name: "Library", icon: "📚", desc: "Reading spaces, books, computers and study access.", issues: ["Book availability", "Library computer", "Wi-Fi", "Seating", "Opening hours concern"] },
  { name: "Drinking water", icon: "🚰", desc: "Water coolers, taps, filters and water availability.", issues: ["No water", "Leakage", "Filter issue", "Cooler not working", "Cleanliness"] },
  { name: "Washrooms", icon: "🚻", desc: "Cleanliness, water supply and plumbing maintenance.", issues: ["Cleaning required", "Water supply", "Tap / flush", "Door lock", "Lighting"] },
  { name: "Hostel", icon: "🛏️", desc: "Hostel rooms, common areas and essential services.", issues: ["Room maintenance", "Water supply", "Electrical issue", "Wi-Fi", "Cleanliness"] },
  { name: "Canteen", icon: "🍽️", desc: "Dining space, cleanliness, seating and facilities.", issues: ["Cleanliness", "Drinking water", "Seating", "Waste bins", "Facility maintenance"] },
  { name: "Campus Wi-Fi", icon: "📶", desc: "Network coverage and connectivity in campus areas.", issues: ["No connection", "Weak signal", "Login issue", "Lab network", "Access point fault"] },
  { name: "Electricity", icon: "💡", desc: "Lights, fans, power outlets and electrical maintenance.", issues: ["Power outage", "Fan not working", "Light not working", "Socket damage", "Electrical safety"] },
  { name: "Transport", icon: "🚌", desc: "College buses, route information and transport facilities.", issues: ["Bus delay concern", "Route information", "Bus cleanliness", "Parking", "Shelter issue"] },
  { name: "Sports & grounds", icon: "🏀", desc: "Playgrounds, sports equipment and activity spaces.", issues: ["Equipment damage", "Ground maintenance", "Lighting", "Court issue", "Water facility"] },
  { name: "Campus safety", icon: "🛡️", desc: "Lighting, access, signage and non-emergency safety issues.", issues: ["Broken pathway light", "Damaged railing", "Signage", "Access barrier", "Trip hazard"] },
  { name: "Roads & parking", icon: "🅿️", desc: "Campus roads, pathways, parking and drainage.", issues: ["Pothole", "Drainage", "Parking marking", "Broken pathway", "Traffic sign"] },
  { name: "Auditorium", icon: "🎤", desc: "Event space, sound system, seating and presentation gear.", issues: ["Sound system", "Projector", "Seating", "Lighting", "Air conditioning"] },
  { name: "Cleaning & waste", icon: "♻️", desc: "Waste bins, campus cleaning and disposal requests.", issues: ["Overflowing bin", "Litter", "Cleaning request", "Waste collection", "Drain blockage"] },
  { name: "Accessibility", icon: "♿", desc: "Accessible routes, ramps, signage and entry points.", issues: ["Ramp access", "Lift issue", "Accessible washroom", "Pathway obstruction", "Signage"] }
];

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
const STORAGE_KEY = "fixMyCampusAdvancedComplaints";
let chartInstance = null;
let toastTimer = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function safeRead() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function safeWrite(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function escapeText(value) {
  return String(value ?? "");
}
function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function showToast(text) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
function statusClass(status) {
  return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}
function priorityClass(priority) {
  return "priority-" + priority.toLowerCase();
}
function createStatusPill(status) {
  return makeElement("span", "status-pill " + statusClass(status), status);
}
function navigate(page) {
  const valid = ["dashboard", "report", "complaints", "facilities", "departments", "people"];
  if (!valid.includes(page)) page = "dashboard";
  $$(".page").forEach(el => el.classList.toggle("active", el.id === "page-" + page));
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  const label = ({dashboard:"Overview", report:"Report an issue", complaints:"Complaints", facilities:"Facilities", departments:"Departments", people:"Student & teacher support"})[page];
  $("#pageCrumb").textContent = label;
  $("#sidebar").classList.remove("open");
  window.scrollTo({top: 0, behavior: "smooth"});
  if (page === "dashboard") renderDashboard();
  if (page === "complaints") renderAllComplaints();
}
document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    navigate(pageButton.dataset.page);
  }
});

function populateIssueTypes(selected = "") {
  const department = $("#departmentInput").value;
  const select = $("#issueType");
  select.replaceChildren();
  select.appendChild(new Option("Choose category", ""));
  const list = DEPARTMENTS[department]?.issues || [];
  list.forEach(issue => select.appendChild(new Option(issue, issue)));
  // General facility categories remain available regardless of department.
  ["Plumbing / water", "Electrical", "Cleanliness", "Furniture", "Building maintenance", "Internet / IT", "Safety / accessibility", "Other"].forEach(issue => {
    if (![...select.options].some(option => option.value === issue)) select.appendChild(new Option(issue, issue));
  });
  if (selected && [...select.options].some(option => option.value === selected)) select.value = selected;
}
function populateFacilities() {
  const select = $("#facility");
  FACILITIES.forEach(item => select.appendChild(new Option(item.name, item.name)));
}
function setReportDefaults({department = "", category = "", facility = "", role = ""} = {}) {
  navigate("report");
  if (department) $("#departmentInput").value = department;
  if (role) $("#reporterType").value = role;
  populateIssueTypes(category);
  if (facility) $("#facility").value = facility;
  if (category && ![...$("#issueType").options].some(o => o.value === category)) {
    $("#issueType").appendChild(new Option(category, category, true, true));
  }
  $("#title").focus({preventScroll:true});
}

function createComplaintFromForm(event) {
  event.preventDefault();
  const data = {
    id: "FMC-" + Date.now().toString(36).toUpperCase(),
    title: $("#title").value.trim(),
    reporterType: $("#reporterType").value,
    reporterName: $("#reporterName").value.trim(),
    department: $("#departmentInput").value,
    category: $("#issueType").value,
    facility: $("#facility").value,
    priority: $("#priority").value,
    location: $("#location").value.trim(),
    description: $("#description").value.trim(),
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  if (!data.title || !data.reporterType || !data.reporterName || !data.department || !data.category || !data.location || !data.description) {
    $("#formMessage").textContent = "Please complete all required fields.";
    return;
  }
  try {
    const items = safeRead();
    items.push(data);
    safeWrite(items);
    $("#reportForm").reset();
    populateIssueTypes();
    $("#formMessage").textContent = "Report saved in this browser. Reference ID: " + data.id;
    showToast("Report created: " + data.id);
    renderDashboard();
    renderAllComplaints();
  } catch {
    $("#formMessage").textContent = "Could not save. Browser storage may be unavailable or full.";
  }
}

function renderDashboard() {
  const items = safeRead();
  $("#totalStat").textContent = items.length;
  $("#pendingStat").textContent = items.filter(x => x.status === "Pending").length;
  $("#progressStat").textContent = items.filter(x => x.status === "In Progress").length;
  $("#resolvedStat").textContent = items.filter(x => x.status === "Resolved").length;
  renderStatusChart(items);
  renderCategoryBreakdown(items);
  renderRecentTable(items);
}
function renderStatusChart(items) {
  const counts = STATUS_OPTIONS.map(status => items.filter(x => x.status === status).length);
  $("#chartEmpty").classList.toggle("hidden", items.length > 0);
  if (!window.Chart) return;
  const canvas = $("#statusChart");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: STATUS_OPTIONS,
      datasets: [{data: counts, backgroundColor: ["#f2ae4b", "#5592f0", "#36bc8b"], borderWidth: 0, hoverOffset: 5}]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "72%",
      plugins: {legend: {display: false}, tooltip: {enabled: true}},
    }
  });
}
function renderCategoryBreakdown(items) {
  const root = $("#categoryBreakdown");
  root.replaceChildren();
  if (!items.length) {
    root.appendChild(makeElement("p", "small", "Category insights appear after the first report."));
    return;
  }
  const counts = {};
  items.forEach(x => counts[x.category] = (counts[x.category] || 0) + 1);
  Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5).forEach(([name,count]) => {
    const row = makeElement("div", "category-row");
    row.append(makeElement("strong", "", name), makeElement("span", "", count + (count === 1 ? " report" : " reports")));
    const track = makeElement("div", "progress-track");
    const fill = makeElement("div", "progress-fill");
    fill.style.width = Math.max(8, count / items.length * 100) + "%";
    track.appendChild(fill);
    row.appendChild(track);
    root.appendChild(row);
  });
}
function renderRecentTable(items) {
  const tbody = $("#recentTable");
  tbody.replaceChildren();
  const recent = items.slice().reverse().slice(0,5);
  $("#recentEmpty").classList.toggle("hidden", recent.length > 0);
  $(".table-scroll").classList.toggle("hidden", recent.length === 0);
  recent.forEach(item => {
    const tr = document.createElement("tr");
    const titleCell = document.createElement("td");
    titleCell.append(makeElement("strong", "", item.title), makeElement("span", "subtext", item.id));
    const dept = makeElement("td", "", item.department);
    const reporter = document.createElement("td");
    reporter.append(makeElement("strong", "", item.reporterName), makeElement("span", "subtext", item.reporterType));
    const priority = document.createElement("td");
    priority.appendChild(makeElement("span", "priority " + priorityClass(item.priority), item.priority));
    const status = document.createElement("td");
    status.appendChild(createStatusPill(item.status));
    tr.append(titleCell, dept, reporter, priority, status);
    tbody.appendChild(tr);
  });
}

function complaintCard(item) {
  const card = makeElement("article", "complaint-card");
  const top = makeElement("div", "complaint-card-top");
  const titleWrap = document.createElement("div");
  titleWrap.append(makeElement("h3", "", item.title), makeElement("div", "complaint-id", item.id));
  top.append(titleWrap, createStatusPill(item.status));
  card.appendChild(top);
  card.appendChild(makeElement("p", "", item.description));
  const meta = makeElement("div", "complaint-meta");
  meta.append(
    makeElement("span", "", "▤ " + item.department),
    makeElement("span", "", "⌂ " + (item.facility || item.location)),
    makeElement("span", "", "♙ " + item.reporterType),
    makeElement("span", "priority " + priorityClass(item.priority), item.priority)
  );
  card.appendChild(meta);
  card.appendChild(makeElement("p", "small", "Location: " + item.location + " · " + new Date(item.createdAt).toLocaleDateString()));
  const actions = makeElement("div", "complaint-card-actions");
  actions.appendChild(makeElement("label", "", "Update status"));
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Update status for " + item.id);
  STATUS_OPTIONS.forEach(status => select.appendChild(new Option(status, status, false, status === item.status)));
  select.addEventListener("change", () => updateComplaintStatus(item.id, select.value));
  actions.appendChild(select);
  card.appendChild(actions);
  return card;
}
function renderAllComplaints() {
  const root = $("#allComplaints");
  root.replaceChildren();
  const query = ($("#complaintSearch").value || $("#globalSearch").value).trim().toLowerCase();
  const department = $("#filterDepartment").value;
  const status = $("#filterStatus").value;
  const priority = $("#filterPriority").value;
  const filtered = safeRead().slice().reverse().filter(item => {
    const searchable = [item.id,item.title,item.description,item.location,item.department,item.category,item.reporterName,item.facility].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!department || item.department === department) &&
      (!status || item.status === status) &&
      (!priority || item.priority === priority);
  });
  $("#resultsCount").textContent = filtered.length + (filtered.length === 1 ? " complaint" : " complaints");
  $("#complaintsEmpty").classList.toggle("hidden", filtered.length > 0);
  filtered.forEach(item => root.appendChild(complaintCard(item)));
}
function updateComplaintStatus(id, status) {
  try {
    const items = safeRead();
    const item = items.find(x => x.id === id);
    if (!item) return;
    item.status = status;
    safeWrite(items);
    renderDashboard();
    renderAllComplaints();
    showToast("Status updated to " + status);
  } catch {
    showToast("Could not update status.");
  }
}

function renderFacilities() {
  const root = $("#facilityGrid");
  root.replaceChildren();
  FACILITIES.forEach(facility => {
    const card = makeElement("article", "facility-card");
    card.appendChild(makeElement("div", "facility-icon", facility.icon));
    card.appendChild(makeElement("h3", "", facility.name));
    card.appendChild(makeElement("p", "", facility.desc));
    const chips = makeElement("div", "issue-chips");
    facility.issues.slice(0,4).forEach(issue => chips.appendChild(makeElement("span", "issue-chip", issue)));
    card.appendChild(chips);
    const button = makeElement("button", "", "Report facility issue →");
    button.addEventListener("click", () => setReportDefaults({department:"Common campus", facility:facility.name, category:facility.issues[0]}));
    card.appendChild(button);
    root.appendChild(card);
  });
}
function renderDepartments() {
  const root = $("#departmentGrid");
  root.replaceChildren();
  Object.entries(DEPARTMENTS).forEach(([code, dept]) => {
    const card = makeElement("article", "department-card");
    card.appendChild(makeElement("div", "department-code", code === "Other department" ? "OTHER" : code === "Common campus" ? "CAMPUS" : code));
    card.appendChild(makeElement("div", "department-icon", dept.icon));
    card.appendChild(makeElement("h3", "", dept.name));
    card.appendChild(makeElement("p", "", dept.issues.slice(0,4).join(" · ") + "."));
    const button = makeElement("button", "", "Report department issue →");
    button.addEventListener("click", () => setReportDefaults({department:code, category:dept.issues[0]}));
    card.appendChild(button);
    root.appendChild(card);
  });
}

$("#reportForm").addEventListener("submit", createComplaintFromForm);
$("#reportForm").addEventListener("input", () => {
  $("#formMessage").textContent = "";
});
$("#reportForm").addEventListener("reset", () => {
  $("#formMessage").textContent = "";
});
$("#departmentInput").addEventListener("change", () => populateIssueTypes());
$("#complaintSearch").addEventListener("input", renderAllComplaints);
["filterDepartment","filterStatus","filterPriority"].forEach(id => $("#" + id).addEventListener("change", renderAllComplaints));
$("#clearFilters").addEventListener("click", () => {
  $("#complaintSearch").value = "";
  $("#globalSearch").value = "";
  $("#filterDepartment").value = "";
  $("#filterStatus").value = "";
  $("#filterPriority").value = "";
  renderAllComplaints();
});
const globalSearchBox = $(".search-box");
globalSearchBox.addEventListener("click", event => {
  if (window.matchMedia("(max-width: 620px)").matches && !globalSearchBox.classList.contains("search-open")) {
    event.preventDefault();
    globalSearchBox.classList.add("search-open");
    $("#globalSearch").focus();
  }
});
$("#globalSearch").addEventListener("blur", () => {
  if (window.matchMedia("(max-width: 620px)").matches && !$("#globalSearch").value.trim()) {
    globalSearchBox.classList.remove("search-open");
  }
});
$("#globalSearch").addEventListener("input", () => {
  navigate("complaints");
  $("#complaintSearch").value = $("#globalSearch").value;
  renderAllComplaints();
});
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
// Restore the user's theme choice when the page is reopened.
try {
  if (localStorage.getItem("fixMyCampusTheme") === "dark") {
    document.body.classList.add("dark");
  }
} catch {
  // The app still works when browser storage is unavailable.
}

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  try {
    localStorage.setItem("fixMyCampusTheme", theme);
  } catch {
    // Theme remains active for this page view even if it cannot be saved.
  }
  showToast(theme === "dark" ? "Dark theme enabled" : "Light theme enabled");
});
$$("[data-role]").forEach(button => button.addEventListener("click", () => setReportDefaults({role:button.dataset.role})));

$("#todayDate").textContent = new Date().toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric", year:"numeric"});
populateFacilities();
populateIssueTypes();
renderFacilities();
renderDepartments();
renderDashboard();

// Demo-only seed data is intentionally not added automatically. Start with a clean complaint list.


// FIX MY CAMPUS — demo login (client-side only; not secure account authentication)
const campusLoginForm = document.getElementById("campusLoginForm");
const campusLoginScreen = document.getElementById("loginScreen");
const campusAppShell = document.querySelector(".app-shell");
const campusEmail = document.getElementById("campusEmail");
const campusPassword = document.getElementById("campusPassword");
const campusLoginMessage = document.getElementById("campusLoginMessage");
const campusTogglePassword = document.getElementById("campusTogglePassword");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileAvatar = document.getElementById("profileAvatar");

// Turn an email address such as rohit.satya@example.com into "Rohit Satya".
function getDisplayNameFromEmail(email) {
  const localPart = email.trim().split("@")[0] || "Campus User";
  const words = localPart
    .replace(/[._-]+/g, " ")
    .replace(/[0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "Campus User";
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

function updateLoggedInProfile(email) {
  const displayName = getDisplayNameFromEmail(email);
  profileName.textContent = displayName;
  profileEmail.textContent = email.trim();
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  profileAvatar.textContent = initials || "CU";
}

campusTogglePassword.addEventListener("click", function () {
  const showPassword = campusPassword.type === "password";
  campusPassword.type = showPassword ? "text" : "password";
  campusTogglePassword.textContent = showPassword ? "Hide" : "Show";
  campusTogglePassword.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
});

campusLoginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  campusLoginMessage.textContent = "";
  if (!campusEmail.validity.valid || !campusEmail.value.trim()) {
    campusLoginMessage.textContent = "Please enter a valid email address.";
    campusEmail.focus();
    return;
  }
  if (campusPassword.value.length < 6) {
    campusLoginMessage.textContent = "Password must be at least 6 characters.";
    campusPassword.focus();
    return;
  }
  updateLoggedInProfile(campusEmail.value);
  campusLoginScreen.style.display = "none";
  campusAppShell.classList.add("logged-in");
  navigate("dashboard");
  window.scrollTo({ top: 0, behavior: "smooth" });
});
