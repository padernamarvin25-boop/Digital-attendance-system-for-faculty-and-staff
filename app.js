// ==========================================
// DIGITAL ATTENDANCE SYSTEM - APP LOGIC
// ==========================================

const AUTH_KEYS = ["das_admin_logged_in", "das_logged_in", "isLoggedIn"];
const ADMIN_PASSWORD_KEY = "das_admin_password";
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "admin123";
const EDIT_INDEX_KEY = "das_editing_employee_index";

const SVG_EYE_OPEN = `
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;display:block;">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
`;

const SVG_EYE_CLOSED = `
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;display:block;">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-5.94"></path>
    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.62"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
`;

function cleanText(val) {
    return String(val ?? "").trim();
}

function normalizeId(val) {
    return cleanText(val).toUpperCase();
}

function normalizeName(val) {
    return cleanText(val).replace(/\s+/g, " ").toUpperCase();
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

function getAdminPassword() {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASS;
}

function showInlineNotice(elementId, text, isSuccess = true) {
    const box = document.getElementById(elementId);
    if (!box) return;
    box.textContent = text;
    box.style.display = "block";
    box.style.color = isSuccess ? "#0f5132" : "#842029";
    box.style.background = isSuccess ? "#d1e7dd" : "#f8d7da";
    box.style.border = `1px solid ${isSuccess ? "#badbcc" : "#f5c2c7"}`;
    box.style.padding = "10px 12px";
    box.style.borderRadius = "6px";
    box.style.marginTop = "12px";
    box.style.fontWeight = "600";
    box.style.fontSize = "0.9rem";
}

function setPasswordEyeState(inputEl, btnEl, showPlainText) {
    if (!inputEl || !btnEl) return;
    inputEl.type = showPlainText ? "text" : "password";
    btnEl.innerHTML = showPlainText ? SVG_EYE_CLOSED : SVG_EYE_OPEN;
    btnEl.setAttribute("aria-label", showPlainText ? "Hide password" : "Show password");
    btnEl.setAttribute("title", showPlainText ? "Hide Password" : "Show Password");
}

function bindPasswordEye(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.removeAttribute("onclick");
    setPasswordEyeState(input, btn, false);

    btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const isCurrentlyHidden = input.type === "password";
        setPasswordEyeState(input, btn, isCurrentlyHidden);
    };
}

// ==========================================
// AUTHENTICATION & LOG OUT
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
    const isPublicPage = path.endsWith("/") || path.includes("index.html") || path.includes("login.html");

    if (!isLoggedIn() && !isPublicPage) {
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
    window.location.href = "./index.html";
}

// ==========================================
// EMPLOYEE REGISTRATION & RECORD (DESC, UNIQUE PK & NAME)
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

    // Descending order (pinakabagong entry nasa pinakataas)
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
        const updated = attendance.filter(r => normalizeId(r.id || r.employeeId) !== normalizeId(removed.id));
        DB.saveAttendance(updated);
    }

    renderEmployeeTable();
    showInlineNotice("regStatusMsg", "Employee deleted successfully.", true);
}

function resetForm() {
    const form = document.getElementById("regForm");
    const formTitle = document.getElementById("formTitle");
    const saveBtn = document.getElementById("saveBtn");
    const passInput = document.getElementById("empPass");
    const toggleBtn = document.getElementById("toggleRegPass");

    if (form) form.reset();
    sessionStorage.removeItem(EDIT_INDEX_KEY);

    setPasswordEyeState(passInput, toggleBtn, false);

    if (formTitle) formTitle.textContent = "Register New Employee";
    if (saveBtn) saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Employee`;
}

function handleEmployeeFormSubmit(event) {
    event.preventDefault();
    if (!window.DB) return;

    const id = cleanText(document.getElementById("empId")?.value);
    const name = cleanText(document.getElementById("empName")?.value).replace(/\s+/g, " ");
    const password = cleanText(document.getElementById("empPass")?.value);
    const position = cleanText(document.getElementById("empPos")?.value);
    const department = cleanText(document.getElementById("empDept")?.value);

    if (!id || !name || !password || !position || !department) {
        showInlineNotice("regStatusMsg", "Please complete all fields.", false);
        return;
    }

    const employees = DB.getEmployees() || [];
    const editIndexRaw = sessionStorage.getItem(EDIT_INDEX_KEY);
    const isEditing = editIndexRaw !== null && editIndexRaw !== "";
    const editIndex = isEditing ? Number(editIndexRaw) : -1;

    const normalizedNewId = normalizeId(id);
    const normalizedNewName = normalizeName(name);

    // 1. Check duplicate Employee ID (Primary Key)
    const duplicateIdIndex = employees.findIndex(
        (e, idx) => normalizeId(e.id) === normalizedNewId && idx !== editIndex
    );

    if (duplicateIdIndex !== -1) {
        showInlineNotice(
            "regStatusMsg",
            `Employee ID "${id}" already exists! Primary Key must be unique.`,
            false
        );
        return;
    }

    // 2. Check duplicate Full Name (hindi puwede ang parehong pangalan kahit ibang ID)
    const duplicateNameIndex = employees.findIndex(
        (e, idx) => normalizeName(e.name) === normalizedNewName && idx !== editIndex
    );

    if (duplicateNameIndex !== -1) {
        const existingEmp = employees[duplicateNameIndex];
        showInlineNotice(
            "regStatusMsg",
            `Employee "${name}" is already registered under ID "${existingEmp.id}"! Duplicate names are not allowed.`,
            false
        );
        return;
    }

    const data = { id, name, password, position, department };

    if (isEditing && editIndex >= 0 && editIndex < employees.length) {
        const oldId = employees[editIndex]?.id;
        employees[editIndex] = data;
        sessionStorage.removeItem(EDIT_INDEX_KEY);

        if (typeof DB.getAttendance === "function" && typeof DB.saveAttendance === "function") {
            const attendance = DB.getAttendance() || [];
            const updatedAttendance = attendance.map(rec => {
                if (normalizeId(rec.id || rec.employeeId) === normalizeId(oldId)) {
                    return {
                        ...rec,
                        id: data.id,
                        employeeId: data.id,
                        name: data.name,
                        employeeName: data.name,
                        department: data.department,
                        position: data.position
                    };
                }
                return rec;
            });
            DB.saveAttendance(updatedAttendance);
        }

        DB.saveEmployees(employees);
        resetForm();
        renderEmployeeTable();
        showInlineNotice("regStatusMsg", "Successful update! Employee record updated.", true);
        return;
    }

    // Bagong employee: ilagay sa dulo para lumabas sa pinakataas (Descending)
    employees.push(data);
    DB.saveEmployees(employees);
    resetForm();
    renderEmployeeTable();
    showInlineNotice("regStatusMsg", "Successful registration! New employee saved.", true);
}

// ==========================================
// MORNING (AM/PM) & AFTERNOON (AM/PM) ENGINE
// ==========================================

function recordMorningAfternoonAttendance(employeeId, actionType, slotKey) {
    if (!window.DB) {
        return { ok: false, message: "Database not loaded." };
    }

    const cleanId = cleanText(employeeId);
    const employees = DB.getEmployees() || [];
    const records = DB.getAttendance() || [];
    const today = getTodayISO();
    const nowTime = getCurrentTimeAMPM();

    const slot = cleanText(slotKey).toUpperCase() || "MORNING_AM";

    const emp = employees.find(e => normalizeId(e.id) === normalizeId(cleanId));
    if (!emp) {
        return { ok: false, message: "Invalid Employee ID or Password." };
    }

    let recIdx = records.findIndex(
        r => normalizeId(r.id || r.employeeId) === normalizeId(cleanId) &&
             cleanText(r.date) === today
    );

    if (recIdx === -1) {
        records.push({
            recordId: "ATT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            id: emp.id,
            employeeId: emp.id,
            name: emp.name,
            employeeName: emp.name,
            department: emp.department || "General",
            position: emp.position || "Staff",
            date: today,
            morningAmIn: "--",
            morningAmOut: "--",
            morningPmIn: "--",
            morningPmOut: "--",
            afternoonAmIn: "--",
            afternoonAmOut: "--",
            afternoonPmIn: "--",
            afternoonPmOut: "--",
            amTimeIn: "--",
            amTimeOut: "--",
            pmTimeIn: "--",
            pmTimeOut: "--",
            status: "Present"
        });
        recIdx = records.length - 1;
    }

    const rec = records[recIdx];
    const fieldMap = {
        MORNING_AM: { inKey: "morningAmIn", outKey: "morningAmOut", label: "Morning (AM)" },
        MORNING_PM: { inKey: "morningPmIn", outKey: "morningPmOut", label: "Morning (PM)" },
        AFTERNOON_AM: { inKey: "afternoonAmIn", outKey: "afternoonAmOut", label: "Afternoon (AM)" },
        AFTERNOON_PM: { inKey: "afternoonPmIn", outKey: "afternoonPmOut", label: "Afternoon (PM)" }
    };

    const cfg = fieldMap[slot] || fieldMap.MORNING_AM;
    rec[cfg.inKey] = rec[cfg.inKey] || "--";
    rec[cfg.outKey] = rec[cfg.outKey] || "--";

    if (actionType === "TIME_IN") {
        if (rec[cfg.inKey] !== "--") {
            return { ok: false, message: `Already Timed In for ${cfg.label} today.` };
        }
        rec[cfg.inKey] = nowTime;
        if (slot.startsWith("MORNING")) {
            rec.amTimeIn = nowTime;
        } else {
            rec.pmTimeIn = nowTime;
        }
        records[recIdx] = rec;
        DB.saveAttendance(records);
        return {
            ok: true,
            message: `Successful Time In (${cfg.label}) for ${emp.name} at ${nowTime}`
        };
    }

    if (actionType === "TIME_OUT") {
        if (rec[cfg.inKey] === "--") {
            return { ok: false, message: `Time In required first for ${cfg.label}.` };
        }
        if (rec[cfg.outKey] !== "--") {
            return { ok: false, message: `Already Timed Out for ${cfg.label} today.` };
        }
        rec[cfg.outKey] = nowTime;
        if (slot.startsWith("MORNING")) {
            rec.amTimeOut = nowTime;
        } else {
            rec.pmTimeOut = nowTime;
        }
        records[recIdx] = rec;
        DB.saveAttendance(records);
        return {
            ok: true,
            message: `Successful Time Out (${cfg.label}) for ${emp.name} at ${nowTime}`
        };
    }

    return { ok: false, message: "Invalid action." };
}

// ==========================================
// GLOBAL INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const currentDateEl = document.getElementById("currentDate");
    if (currentDateEl && !currentDateEl.textContent.trim()) {
        currentDateEl.textContent = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    bindPasswordEye("toggleRegPass", "empPass");
    bindPasswordEye("toggleKioskPass", "kioskPass");

    const regForm = document.getElementById("regForm");
    if (regForm) {
        if (!document.getElementById("regStatusMsg")) {
            const noticeDiv = document.createElement("div");
            noticeDiv.id = "regStatusMsg";
            noticeDiv.style.display = "none";
            regForm.appendChild(noticeDiv);
        }

        regForm.addEventListener("submit", handleEmployeeFormSubmit);
        renderEmployeeTable();
    }
});

window.checkAuth = checkAuth;
window.isLoggedIn = isLoggedIn;
window.loginAdmin = loginAdmin;
window.logout = logout;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.resetForm = resetForm;
window.recordMorningAfternoonAttendance = recordMorningAfternoonAttendance;
window.showInlineNotice = showInlineNotice;
window.getTodayISO = getTodayISO;
window.getCurrentMonthISO = getCurrentMonthISO;
window.setPasswordEyeState = setPasswordEyeState;
