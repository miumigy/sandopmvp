import { calculatePSI } from '../lib/psiLogic';

describe('calculatePSI', () => {
    const mockSalesPlan = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        quantity: 100,
        price: 10,
    }));

    const mockProductionPlan = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        quantity: 100,
        cost: 5,
    }));

    const mockLogisticsPlan = {
        initialInventory: 50,
        maxCapacity: 200,
        fixedCost: 100,
        overflowCost: 2,
    };

    it('should calculate inventory correctly', () => {
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, mockLogisticsPlan);
        // Initial 50. Month 1: +0 (prod delay) - 100 (sales) = -50? No, logic handles shortage.
        // Let's check logic: available = startInventory (50). sold = min(50, 100) = 50. end = 0.
        expect(result.inventory[0]).toBe(0);

        // Month 2: Start 0. Prod arrives (from M1) = 100. Available 100. Sales 100. End 0.
        expect(result.inventory[1]).toBe(0);
    });

    it('should calculate opportunity loss', () => {
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, mockLogisticsPlan);
        // Month 1: Available 50. Sales 100. Loss 50.
        expect(result.opportunityLoss[0]).toBe(50);
    });

    it('should calculate financial metrics', () => {
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, mockLogisticsPlan);
        // Month 1: Sold 50 * Price 10 = 500.
        expect(result.monthlySalesAmount[0]).toBe(500);

        // Month 1: Prod 100 * Cost 5 = 500.
        expect(result.monthlyProductionCost[0]).toBe(500);

        // Month 1: Storage. End Inv 0. Fixed 100. Overflow 0. Total 100.
        expect(result.monthlyLogisticsCost[0]).toBe(100);

        // Month 1: Profit = 500 - 500 - 100 = -100.
        expect(result.monthlyProfit[0]).toBe(-100);
    });
});
