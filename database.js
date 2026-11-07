const STORAGE_KEYS = {
  employees: "attendance_employees",
  records: "attendance_records",
  admin: "attendance_admin"
};

const Database = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? [];
    } catch {
      return [];
    }
  },

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getEmployees() {
    return this.get(STORAGE_KEYS.employees);
  },

  saveEmployees(employees) {
    this.save(STORAGE_KEYS.employees, employees);
  },

  getRecords() {
    return this.get(STORAGE_KEYS.records);
  },

  saveRecords(records) {
    this.save(STORAGE_KEYS.records, records);
  }
};

window.Database = Database;
window.STORAGE_KEYS = STORAGE_KEYS;

