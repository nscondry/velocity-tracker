class DateUtils {
  constructor() {
    this.weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  /**
   * Get the Monday of a given week
   */
  getMondayOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  /**
   * Get the Sunday of a given week
   */
  getSundayOfWeek(date) {
    const monday = this.getMondayOfWeek(new Date(date));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  }

  /**
   * Get the first day of a given month
   */
  getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the last day of a given month
   */
  getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate 8 weeks of Monday-Sunday date ranges
   * Returns array of { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
   */
  generateWeeklyRanges(numWeeks = 8) {
    const ranges = [];
    const today = new Date();
    
    // Start from the most recent Sunday
    const lastSunday = this.getSundayOfWeek(today);
    
    for (let i = numWeeks - 1; i >= 0; i--) {
      const weekEnd = new Date(lastSunday);
      weekEnd.setDate(lastSunday.getDate() - (i * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      
      ranges.push({
        from: this.formatDate(weekStart),
        to: this.formatDate(weekEnd),
        weekNumber: numWeeks - i,
        startDate: weekStart,
        endDate: weekEnd
      });
    }
    
    return ranges;
  }

  /**
   * Generate monthly date ranges (1st to last day of each month)
   * Returns array of { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
   */
  generateMonthlyRanges(numMonths = 6) {
    const ranges = [];
    const today = new Date();
    
    // Start from the current month
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    for (let i = numMonths - 1; i >= 0; i--) {
      const monthStart = new Date(currentMonth);
      monthStart.setMonth(currentMonth.getMonth() - i);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1, 0); // Last day of the month
      
      ranges.push({
        from: this.formatDate(monthStart),
        to: this.formatDate(monthEnd),
        monthNumber: numMonths - i,
        monthName: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: monthStart,
        endDate: monthEnd
      });
    }
    
    return ranges;
  }

  /**
   * Get a human-readable description of the date range
   */
  getDateRangeDescription(range) {
    const start = new Date(range.from);
    const end = new Date(range.to);
    
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${startStr} - ${endStr}`;
  }

  /**
   * Get a human-readable description of the monthly range
   */
  getMonthlyRangeDescription(range) {
    return range.monthName;
  }

  /**
   * Validate that a date string is in YYYY-MM-DD format
   */
  isValidDateString(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  /**
   * Get current week number (1-52)
   */
  getWeekNumber(date = new Date()) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

export default DateUtils; 