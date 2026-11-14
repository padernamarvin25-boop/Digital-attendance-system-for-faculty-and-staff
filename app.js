
// ==========================================
// DIGITAL ATTENDANCE SYSTEM - APP.JS
// GLOBAL APPLICATION FUNCTIONS
// ==========================================

// LOCAL DATE - avoids UTC date errors
function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ==========================================
// NOTIFICATION SYSTEM
// No OK button required
// ==========================================

function showNotification(message, type = "success") {
    let notification = document.getElementById("dasNotification");

    if (!notification) {
        notification = document.createElement("div");
        notification.id = "dasNotification";
        document.body.appendChild(notification);
    }

    const icons = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    const colors = {
        success: "#198754",
        error: "#dc3545",
        warning: "#ffc107",
        info: "#0d6efd"
    };

    notification.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}"></i>
        <span>${escapeAppHTML(message)}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 25px;
        right: 25px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 350px;
        padding: 15px 20px;
        color: white;
        background: ${colors[type] || colors.info};
        border-radius: 9px;
        box-shadow: 0 5px 20px rgba(0,0,0,.18);
        font-size: 14px;
        font-weight: 600;
        animation: dasSlideIn .3s ease;
    `;

    clearTimeout(window.dasNotificationTimer);

    window.dasNotificationTimer = setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = ".3s";

        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeAppHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

function checkAuth() {
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
        window.location.replace("login.html");
        return false;
    }

    return true;
}

function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.replace("login.html");
}

// ==========================================
// BACK BUTTON
// Automatically added to admin pages
// ==========================================

function addBackButton() {
    const currentPage = window.location.pathname.split("/").pop();

    const excludedPages = [
        "login.html",
        "index.html",
        "timein.html"
    ];

    if (excludedPages.includes(currentPage)) return;

    const topbar = document.querySelector(".topbar");

    if (!topbar || document.getElementById("dasBackButton")) return;

    const backButton = document.createElement("button");

    backButton.id = "dasBackButton";
    backButton.type = "button";
    backButton.innerHTML = `
        <i class="fa-solid fa-arrow-left"></i> Back
    `;

    backButton.style.cssText = `
        padding: 9px 16px;
        border: 1px solid #0d6efd;
        background: white;
        color: #0d6efd;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        margin-right: 12px;
    `;

    backButton.addEventListener("click", () => {
        if (document.referrer &&
            new URL(document.referrer).origin === location.origin &&
            history.length > 1) {
            history.back();
        } else {
            window.location.href = "dashboard.html";
        }
    });

    topbar.insertBefore(backButton, topbar.firstChild);
}

// ==========================================
// CURRENT DATE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const dateElement = document.getElementById("currentDate");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );
    }

    addBackButton();

});

// ==========================================
// GLOBAL DATABASE CHECK
// ==========================================

function databaseReady() {
    return (
        typeof DB !== "undefined" &&
        typeof DB.getEmployees === "function" &&
        typeof DB.getAttendance === "function"
    );
}

console.log("DAS Application Loaded Successfully!");
