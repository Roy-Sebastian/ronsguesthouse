"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
const dashboard_repository_1 = require("../repositories/dashboard.repository");
async function getDashboardStats(dateStart, dateEnd) {
    const now = new Date();
    // Resolve the period used for income/expense totals and charts
    // If caller supplies a range, use it; otherwise default to all-time for the
    // financial summary and last 6+ months for the chart.
    const filterStart = dateStart ? new Date(dateStart + 'T00:00:00') : undefined;
    const filterEnd = dateEnd ? new Date(dateEnd + 'T23:59:59') : undefined;
    // Dates for current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    // Dates for previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    // General counts
    const [totalGuests, totalRooms, availableRooms, activeStays, activeReservations, pendingReviews, unreadMessages,] = await Promise.all([
        dashboard_repository_1.dashboardRepository.getGuestCount(),
        dashboard_repository_1.dashboardRepository.getRoomCount(),
        dashboard_repository_1.dashboardRepository.getRoomCount({ where: { status: 'available' } }),
        dashboard_repository_1.dashboardRepository.getStayCount({ where: { checkOutAt: null } }),
        dashboard_repository_1.dashboardRepository.getReservationCount({ where: { status: 'confirmed' } }),
        dashboard_repository_1.dashboardRepository.getReviewCount({ where: { status: 'pending' } }),
        dashboard_repository_1.dashboardRepository.getContactMessageCount({ where: { isRead: false } }),
    ]);
    // Current vs Previous Month Data for Stats Cards
    const [reservationsCurrent, reservationsPrevious, guestsCurrent, guestsPrevious, incomeCurrentResult, incomePreviousResult,] = await Promise.all([
        dashboard_repository_1.dashboardRepository.getReservationCount({ where: { checkInDate: { gte: currentMonthStart, lte: currentMonthEnd } } }),
        dashboard_repository_1.dashboardRepository.getReservationCount({ where: { checkInDate: { gte: previousMonthStart, lte: previousMonthEnd } } }),
        dashboard_repository_1.dashboardRepository.getReservationCount({ where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } } }), // Just a metric
        dashboard_repository_1.dashboardRepository.getReservationCount({ where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
        dashboard_repository_1.dashboardRepository.aggregateIncome({ where: { incomeDate: { gte: currentMonthStart, lte: currentMonthEnd } }, _sum: { amount: true } }),
        dashboard_repository_1.dashboardRepository.aggregateIncome({ where: { incomeDate: { gte: previousMonthStart, lte: previousMonthEnd } }, _sum: { amount: true } }),
    ]);
    const calcPercentChange = (curr, prev) => {
        if (prev === 0)
            return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };
    const totalReservationsCurrent = reservationsCurrent;
    const totalReservationsChange = calcPercentChange(reservationsCurrent, reservationsPrevious);
    const totalIncomeCurrent = Number(incomeCurrentResult._sum?.amount || 0);
    const totalIncomePrevious = Number(incomePreviousResult._sum?.amount || 0);
    const totalIncomeChange = calcPercentChange(totalIncomeCurrent, totalIncomePrevious);
    // We are using reservations within a month as a proxy for "Total Tamu" or we could sum numGuests. 
    // For simplicity, let's keep it based on guests checked-in/reserved.
    const totalGuestsCurrent = guestsCurrent;
    const totalGuestsChange = calcPercentChange(guestsCurrent, guestsPrevious);
    // Occupancy rate calculation (Active stays / Total rooms)
    const occupancyRateCurrent = totalRooms > 0 ? (activeStays / totalRooms) * 100 : 0;
    // A bit complex to get exact historical occupancy rate without historical daily logs. So we'll assign 0% change or estimate it.
    const occupancyRateChange = 0;
    // Incomes and Expenses for Graph and Stats
    // When a period filter is active, limit queries to that window.
    const incomeWhere = filterStart || filterEnd
        ? {
            ...(filterStart ? { incomeDate: { gte: filterStart, ...(filterEnd ? { lte: filterEnd } : {}) } } : {}),
            ...(filterEnd && !filterStart ? { incomeDate: { lte: filterEnd } } : {}),
        }
        : undefined;
    const expenseWhere = filterStart || filterEnd
        ? {
            ...(filterStart ? { expenseDate: { gte: filterStart, ...(filterEnd ? { lte: filterEnd } : {}) } } : {}),
            ...(filterEnd && !filterStart ? { expenseDate: { lte: filterEnd } } : {}),
        }
        : undefined;
    const [incomes, expenses] = await Promise.all([
        dashboard_repository_1.dashboardRepository.getIncomes({
            where: incomeWhere,
            select: { amount: true, incomeDate: true, description: true, sourceType: true },
            orderBy: { incomeDate: 'asc' },
        }),
        dashboard_repository_1.dashboardRepository.getExpenses({
            where: expenseWhere,
            select: { amount: true, expenseDate: true, description: true, category: true },
            orderBy: { expenseDate: 'asc' },
        }),
    ]);
    const monthlyIncomeMap = {};
    const monthlyExpenseMap = {};
    let minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 5);
    if (incomes.length > 0 && incomes[0].incomeDate < minDate)
        minDate = new Date(incomes[0].incomeDate);
    if (expenses.length > 0 && expenses[0].expenseDate < minDate)
        minDate = new Date(expenses[0].expenseDate);
    minDate.setDate(1);
    minDate.setHours(0, 0, 0, 0);
    let maxDate = new Date();
    if (incomes.length > 0 && incomes[incomes.length - 1].incomeDate > maxDate) {
        maxDate = new Date(incomes[incomes.length - 1].incomeDate);
    }
    if (expenses.length > 0 && expenses[expenses.length - 1].expenseDate > maxDate) {
        maxDate = new Date(expenses[expenses.length - 1].expenseDate);
    }
    maxDate.setDate(28);
    let current = new Date(minDate);
    while (current <= maxDate ||
        (current.getFullYear() === maxDate.getFullYear() && current.getMonth() === maxDate.getMonth())) {
        // English labels to match the image: JAN, FEB, MAR...
        // But image also has mix of Bahasa and English (APRIL, MAY, JUNE)
        // We can just use standard short format in English and uppercase it later in frontend, or keep short id-ID.
        const label = current.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        monthlyIncomeMap[label] = 0;
        monthlyExpenseMap[label] = 0;
        current.setMonth(current.getMonth() + 1);
    }
    incomes.forEach((inc) => {
        const label = inc.incomeDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (label in monthlyIncomeMap)
            monthlyIncomeMap[label] += Number(inc.amount);
    });
    expenses.forEach((exp) => {
        const label = exp.expenseDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (label in monthlyExpenseMap)
            monthlyExpenseMap[label] += Number(exp.amount);
    });
    const monthlyIncome = Object.entries(monthlyIncomeMap).map(([month, income]) => ({ month, income }));
    const monthlyExpenses = Object.entries(monthlyExpenseMap).map(([month, expense]) => ({ month, expense }));
    // Pie chart Income Statistics: Group by the actual Income table's categories
    const incomeCategoryMap = {};
    let totalCalculatedIncome = 0;
    incomes.forEach((r) => {
        let category = 'Pendapatan Lainnya';
        if (r.sourceType === 'RESERVATION') {
            category = 'Sistem Reservasi';
        }
        else if (r.description) {
            const descBase = r.description.split(' - ')[0];
            category = descBase === 'Lainnya' ? 'Lainnya (Manual)' : descBase;
        }
        const amount = Number(r.amount);
        if (!incomeCategoryMap[category])
            incomeCategoryMap[category] = 0;
        incomeCategoryMap[category] += amount;
        totalCalculatedIncome += amount;
    });
    // Convert to percentages
    const incomeStatistics = Object.entries(incomeCategoryMap).map(([name, amount]) => ({
        name,
        percentage: totalCalculatedIncome > 0 ? Math.round((amount / totalCalculatedIncome) * 100) : 0,
    })).sort((a, b) => b.percentage - a.percentage);
    // All-time totals for reports page
    const totalIncome = totalCalculatedIncome;
    const totalExpense = expenses.reduce((s, r) => s + Number(r.amount), 0);
    const netProfit = totalIncome - totalExpense;
    // Recent combined transactions for reports page
    const recentTransactions = [
        ...incomes.map((inc) => ({
            date: inc.incomeDate,
            type: 'INCOME',
            description: inc.description || 'Pendapatan',
            amount: Number(inc.amount),
        })),
        ...expenses.map((exp) => ({
            date: exp.expenseDate,
            type: 'EXPENSE',
            description: exp.description || exp.category || 'Pengeluaran',
            amount: Number(exp.amount),
        })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    // Table Data (Recent Reservations)
    const recentReservations = await dashboard_repository_1.dashboardRepository.getReservations({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            guest: { select: { fullName: true } },
            room: { select: { roomNumber: true, roomType: true } },
            user: { select: { name: true } },
        }
    });
    return {
        // Legacy metrics just in case
        totalRooms,
        availableRooms,
        activeStays,
        activeReservations,
        pendingReviews,
        unreadMessages,
        monthlyIncome,
        monthlyExpenses,
        // New Metrics for new Dashboard
        totalReservationsCurrent,
        totalReservationsChange,
        occupancyRateCurrent,
        occupancyRateChange,
        totalIncomeCurrent,
        totalIncomeChange,
        totalGuestsCurrent,
        totalGuestsChange,
        incomeStatistics,
        recentReservations,
        // Financial summary for reports
        totalIncome,
        totalExpense,
        netProfit,
        monthlyRevenue: totalIncomeCurrent,
        recentTransactions,
    };
}
