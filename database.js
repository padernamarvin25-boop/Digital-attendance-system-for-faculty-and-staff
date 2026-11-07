// LocalStorage Database Wrapper
const DB = {
  getEmployees() {
    return JSON.parse(localStorage.getItem('das_employees')) || [
      { id: 'EMP001', name: 'Juan Dela Cruz', position: 'Instructor', department: 'Faculty', password: '123' },
      { id: 'EMP002', name: 'Maria Santos', position: 'Staff Admin', department: 'Staff', password: '123' }
    ];
  },
  saveEmployees(employees) {
    localStorage.setItem('das_employees', JSON.stringify(employees));
  },
  getAttendance() {
    return JSON.parse(localStorage.getItem('das_attendance')) || [
      { id: 'EMP001', name: 'Juan Dela Cruz', date: new Date().toISOString().split('T')[0], timeIn: '07:55 AM', timeOut: '05:00 PM', status: 'Present' }
    ];
  },
  saveAttendance(records) {
    localStorage.setItem('das_attendance', JSON.stringify(records));
  }
};
