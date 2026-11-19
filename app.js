// ==========================================
// DIGITAL ATTENDANCE SYSTEM - APP LOGIC
// ==========================================

const AUTH_KEYS = ["das_admin_logged_in", "das_logged_in", "isLoggedIn"];
const ADMIN_PASSWORD_KEY = "das_admin_password";
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "admin123";
const EDIT_INDEX_KEY = "das_editing_employee_index";

function cleanText(val) {
    return String(val ?? "").trim();
}

function escapeStr(val) {
    return cleanText(val).replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));
}

function getTodayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentMonthISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentTimeAMPM() {
    return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function getCurrentPeriodAMPM() {
    return new Date().getHours() < 12 ? "AM" : "PM";
}

function computeStatusForPeriod(period) {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (period === "AM") {
        return mins > 8 * 60 ? "Late" : "Present";
    }
    return mins > 13 * 60 ? "Late" : "Present";
}

function getAdminPassword() {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASS;
}

// ==========================================
// AUTHENTICATION
// ==========================================

function setAuthSession(active) {
    AUTH_KEYS.forEach(key => {
        if (active) {
            sessionStorage.setItem(key, "true");
        } else {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        }
    });
}

function isLoggedIn() {
    return AUTH_KEYS.some(
        key => sessionStorage.getItem(key) === "true" || localStorage.getItem(key) === "true"
    );
}

function checkAuth() {
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.includes("index.html") || path.includes("login.html");

    if (!isLoggedIn() && !isAuthPage) {
        window.location.href = "./login.html";
    }
}

function loginAdmin(username, password) {
    if (cleanText(username) === DEFAULT_ADMIN_USER && String(password ?? "") === getAdminPassword()) {
        setAuthSession(true);
        return true;
    }
    return false;
}

function logout() {
    setAuthSession(false);
    const loginPage = document.getElementById("loginPage");
    const dashboard = document.getElementById("dashboard");

    if (loginPage && dashboard) {
        dashboard.classList.add("hidden");
        loginPage.classList.remove("hidden");
    } else {
        window.location.href = "./login.html";
    }
}

// ==========================================
// EMPLOYEE REGISTRATION & MANAGEMENT (DESC)
// ==========================================

function renderEmployeeTable() {
    const cards = document.querySelectorAll(".card");
    const container = cards.length > 0 ? cards[cards.length - 1] : null;
    if (!container || !window.DB || typeof DB.getEmployees !== "function") return;

    let tableBody = document.getElementById("employeeTableBody");

    if (!tableBody) {
        const wrapper = document.createElement("div");
        wrapper.style.overflowX = "auto";
        wrapper.innerHTML = `
            <table class="employee-table">
                <thead>
                    <tr>
                        <th>Employee ID (PK)</th>
                        <th>Full Name</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="employeeTableBody"></tbody>
            </table>
        `;
        container.appendChild(wrapper);
        tableBody = document.getElementById("employeeTableBody");
    }

    const employees = (DB.getEmployees() || [])
        .map((emp, originalIndex) => ({ ...emp, _idx: originalIndex }))
        .sort((a, b) => b._idx - a._idx);

    if (!employees.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#6c757d;padding:20px;">
                    No registered employees found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = employees.map(emp => `
        <tr>
            <td>${escapeStr(emp.id)}</td>
            <td><strong>${escapeStr(emp.name)}</strong></td>
            <td>${escapeStr(emp.department)}</td>
            <td>${escapeStr(emp.position)}</td>
            <td style="display:flex;gap:8px;">
                <button type="button" class="btn btn-outline" style="padding:5px 10px;" onclick="editEmployee(${emp._idx})">
                    Edit
                </button>
                <button type="button" class="delete-attendance-btn" onclick="deleteEmployee(${emp._idx})">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function editEmployee(index) {
    if (!window.DB) return;
    const employees = DB.getEmployees() || [];
    const emp = employees[index];
    if (!emp) return;

    const idInput = document.getElementById("empId");
    const nameInput = document.getElementById("empName");
    const passInput = document.getElementById("empPass");
    const posInput = document.getElementById("empPos");
    const deptInput = document.getElementById("empDept");
    const formTitle = document.getElementById("formTitle");
    const saveBtn = document.getElementById("saveBtn");

    if (idInput) idInput.value = emp.id || "";
    if (nameInput) nameInput.value = emp.name || "";
    if (passInput) passInput.value = emp.password || "";
    if (posInput) posInput.value = emp.position || "";
    if (deptInput) deptInput.value = emp.department || "";

    sessionStorage.setItem(EDIT_INDEX_KEY, String(index));

    if (formTitle) formTitle.textContent = "Update Employee";
    if (saveBtn) saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update Employee`;
}

function deleteEmployee(index) {
    if (!window.DB) return;
    const employees = DB.getEmployees() || [];
    if (index < 0 || index >= employees.length) return;

    const removed = employees[index];
    employees.splice(index, 1);
    DB.saveEmployees(employees);

    if (removed && typeof DB.getAttendance === "function" && typeof DB.saveAttendance === "function") {
        const attendance = DB.getAttendance() || [];
        const updated = attendance.filter(r => cleanText(r.id || r.employeeId) !== cleanText(removed.id));
        DB.saveAttendance(updated);
    }

    renderEmployeeTable();
}

function resetForm() {
    const form = document.getElementById("regForm");
    const formTitle = document.getElementById("formTitle");
    const saveBtn = document.getElementById("saveBtn");

    if (form) form.reset();
    sessionStorage.removeItem(EDIT_INDEX_KEY);

    if (formTitle) formTitle.textContent = "Register New Employee";
    if (saveBtn) saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Employee`;
}

function handleEmployeeFormSubmit(event) {
    event.preventDefault();
    if (!window.DB) return;

    const id = cleanText(document.getElementById("empId")?.value);
    const name = cleanText(document.getElementById("empName")?.value);
    const password = cleanText(document.getElementById("empPass")?.value);
    const position = cleanText(document.getElementById("empPos")?.value);
    const department = cleanText(document.getElementById("empDept")?.value);

    if (!id || !name || !password || !position || !department) return;

    const employees = DB.getEmployees() || [];
    const editIndexRaw = sessionStorage.getItem(EDIT_INDEX_KEY);
    const editIndex = editIndexRaw !== null ? Number(editIndexRaw) : -1;
    const data = { id, name, password, position, department };

    if (editIndex >= 0 && editIndex < employees.length) {
        employees[editIndex] = data;
        sessionStorage.removeItem(EDIT_INDEX_KEY);
    } else {
        const dupIdx = employees.findIndex(e => cleanText(e.id).toLowerCase() === id.toLowerCase());
        if (dupIdx >= 0) {
            employees[dupIdx] = data;
        } else {
            employees.push(data);
        }
    }

    DB.saveEmployees(employees);
    resetForm();
    renderEmployeeTable();
}

function setupPasswordToggle() {
    const toggleBtn = document.getElementById("toggleRegPass");
    const passInput = document.getElementById("empPass");
    if (!toggleBtn || !passInput) return;

    toggleBtn.addEventListener("click", () => {
        const isHidden = passInput.type === "password";
        passInput.type = isHidden ? "text" : "password";
        toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
        toggleBtn.setAttribute("title", isHidden ? "Hide Password" : "Show Password");
    });
}

// ==========================================
// AM / PM TIME IN & TIME OUT ENGINE
// ==========================================

function logAttendancePeriod(employeeId, actionType, explicitPeriod) {
    if (!window.DB) return { ok: false, message: "Database not loaded." };

    const cleanId = cleanText(employeeId);
    const employees = DB.getEmployees() || [];
    const records = DB.getAttendance() || [];
    const today = getTodayISO();
    const nowTime = getCurrentTimeAMPM();
    const period = (explicitPeriod || getCurrentPeriodAMPM()).toUpperCase();

    const emp = employees.find(e => cleanText(e.id).toLowerCase() === cleanId.toLowerCase());
    if (!emp) {
        return { ok: false, message: "Employee not found." };
    }

    let recIdx = records.findIndex(
        r => cleanText(r.id || r.employeeId).toLowerCase() === cleanId.toLowerCase() &&
             cleanText(r.date) === today
    );

    if (recIdx === -
