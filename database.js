// ==========================================
// DIGITAL ATTENDANCE SYSTEM - DATABASE
// ==========================================

const DB = {
    getEmployees() {
        try {
            const raw = localStorage.getItem("das_employees");
            if (raw === null) {
                const defaults = [
                    {
                        id: "EMP001",
                        name: "Juan Dela Cruz",
                        position: "Faculty",
                        department: "BSIT",
                        password: "123"
                    },
                    {
                        id: "EMP002",
                        name: "Maria Santos",
                        position: "Staff",
                        department: "BSBA",
                        password: "123"
                    }
                ];
                this.saveEmployees(defaults);
                return defaults;
            }
            return JSON.parse(raw) || [];
        } catch (err) {
            console.error("Error loading employees:", err);
            return [];
        }
    },

    saveEmployees(employees) {
        try {
            localStorage.setItem("das_employees", JSON.stringify(employees));
            return true;
        } catch (err) {
            console.error("Error saving employees:", err);
            return false;
        }
    },

    getAttendance() {
        try {
            const raw = localStorage.getItem("das_attendance");
            if (raw === null) {
                const today = new Date().toLocaleDateString("en-CA");
                const defaults = [
                    {
                        recordId: "ATT-1001",
                        id: "EMP001",
                        employeeId: "EMP001",
                        name: "Juan Dela Cruz",
                        employeeName: "Juan Dela Cruz",
                        department: "BSIT",
                        position: "Faculty",
                        date: today,
                        amTimeIn: "07:55 AM",
                        amTimeOut: "12:00 PM",
                        pmTimeIn: "01:00 PM",
                        pmTimeOut: "05:00 PM",
                        timeIn: "07:55 AM",
                        timeOut: "05:00 PM",
                        status: "Present"
                    }
                ];
                this.saveAttendance(defaults);
                return defaults;
            }
            return JSON.parse(raw) || [];
        } catch (err) {
            console.error("Error loading attendance:", err);
            return [];
        }
    },

    saveAttendance(records) {
        try {
            localStorage.setItem("das_attendance", JSON.stringify(records));
            return true;
        } catch (err) {
            console.error("Error saving attendance:", err);
            return false;
        }
    },

    isLoaded() {
        return (
            localStorage.getItem("das_employees") !== null &&
            localStorage.getItem("das_attendance") !== null
        );
    },

    clearDatabase() {
        localStorage.removeItem("das_employees");
        localStorage.removeItem("das_attendance");
    }
};

window.DB = DB;
