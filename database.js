
// ==========================================
// DIGITAL ATTENDANCE SYSTEM - DATABASE
// ==========================================

const DB = {
    // EMPLOYEES
    getEmployees() {
        try {
            const data = localStorage.getItem("das_employees");

            if (data === null) {
                const defaults = [
                    {
                        id: "EMP001",
                        name: "Juan Dela Cruz",
                        position: "Instructor",
                        department: "Faculty",
                        password: "123"
                    },
                    {
                        id: "EMP002",
                        name: "Maria Santos",
                        position: "Staff Admin",
                        department: "Staff",
                        password: "123"
                    }
                ];

                this.saveEmployees(defaults);
                return defaults;
            }

            return JSON.parse(data) || [];
        } catch (error) {
            console.error("Error loading employees:", error);
            return [];
        }
    },

    saveEmployees(employees) {
        try {
            localStorage.setItem(
                "das_employees",
                JSON.stringify(employees)
            );
            return true;
        } catch (error) {
            console.error("Error saving employees:", error);
            return false;
        }
    },

    // ATTENDANCE
    getAttendance() {
        try {
            const data = localStorage.getItem("das_attendance");

            if (data === null) {
                const defaults = [
                    {
                        id: "EMP001",
                        name: "Juan Dela Cruz",
                        date: new Date().toLocaleDateString("en-CA"),
                        timeIn: "07:55 AM",
                        timeOut: "05:00 PM",
                        status: "Present"
                    }
                ];

                this.saveAttendance(defaults);
                return defaults;
            }

            return JSON.parse(data) || [];
        } catch (error) {
            console.error("Error loading attendance:", error);
            return [];
        }
    },

    saveAttendance(records) {
        try {
            localStorage.setItem(
                "das_attendance",
                JSON.stringify(records)
            );
            return true;
        } catch (error) {
            console.error("Error saving attendance:", error);
            return false;
        }
    },

    // CHECK DATABASE
    isLoaded() {
        return (
            localStorage.getItem("das_employees") !== null &&
            localStorage.getItem("das_attendance") !== null
        );
    },

    // CLEAR DATABASE - USE ONLY WHEN NECESSARY
    clearDatabase() {
        localStorage.removeItem("das_employees");
        localStorage.removeItem("das_attendance");
    }
};

// Make DB accessible to other JavaScript files
window.DB = DB;

console.log("Digital Attendance System Database Loaded Successfully!");
