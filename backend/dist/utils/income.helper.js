"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPaidTransactionIncomeForAddOn = exports.appendAddOnToIncomeDescription = exports.buildIncomeDescriptionWithAddOns = void 0;
const addon_utils_1 = require("./addon.utils");
const buildIncomeDescriptionWithAddOns = (baseDescription, noteSource) => {
    const addOnLines = (0, addon_utils_1.extractAddOnLines)(noteSource);
    return addOnLines.length > 0
        ? `${baseDescription}\n${addOnLines.join('\n')}`
        : baseDescription;
};
exports.buildIncomeDescriptionWithAddOns = buildIncomeDescriptionWithAddOns;
const appendAddOnToIncomeDescription = (currentDescription, addOnLogLine, fallbackBase = 'Pembayaran Reservasi / Kamar') => {
    const base = String(currentDescription || '').trim() || fallbackBase;
    return (0, addon_utils_1.appendLine)(base, addOnLogLine);
};
exports.appendAddOnToIncomeDescription = appendAddOnToIncomeDescription;
const syncPaidTransactionIncomeForAddOn = async ({ tx, transactionId, amountIncrement, addOnLogLine, userId = null, paymentDate, }) => {
    const linkedIncome = await tx.income.findUnique({
        where: { transactionId },
    });
    if (linkedIncome) {
        await tx.income.update({
            where: { id: linkedIncome.id },
            data: {
                amount: { increment: amountIncrement },
                description: (0, exports.appendAddOnToIncomeDescription)(linkedIncome.description, addOnLogLine),
            },
        });
        return;
    }
    await tx.income.create({
        data: {
            transactionId,
            amount: amountIncrement,
            description: (0, exports.appendAddOnToIncomeDescription)('Tambahan Add-On', addOnLogLine),
            userId,
            incomeDate: paymentDate || new Date(),
        },
    });
};
exports.syncPaidTransactionIncomeForAddOn = syncPaidTransactionIncomeForAddOn;
