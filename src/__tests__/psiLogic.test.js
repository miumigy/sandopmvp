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

    it('should calculate inventory correctly with production lead time', () => {
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, mockLogisticsPlan);

        // Month 1: 
        // Start Inv: 50
        // Production Arrival: 0 (from M0, which is 0)
        // Available: 50
        // Sales Demand: 100
        // Sold: 50 (limited by available)
        // End Inv: 0
        expect(result.inventory[0]).toBe(0);
        expect(result.monthlySoldQty[0]).toBe(50);

        // Month 2:
        // Start Inv: 0
        // Production Arrival: 100 (from M1 production)
        // Available: 100
        // Sales Demand: 100
        // Sold: 100
        // End Inv: 0
        expect(result.inventory[1]).toBe(0);
        expect(result.monthlySoldQty[1]).toBe(100);
    });

    it('should calculate opportunity loss', () => {
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, mockLogisticsPlan);

        // Month 1: 
        // Available: 50
        // Sales Demand: 100
        // Loss: 100 - 50 = 50
        expect(result.opportunityLoss[0]).toBe(50);

        // Month 2:
        // Available: 100
        // Sales Demand: 100
        // Loss: 0
        expect(result.opportunityLoss[1]).toBe(0);
    });

    it('should calculate storage cost with overflow', () => {
        // Create a scenario with high inventory
        const highInvLogistics = { ...mockLogisticsPlan, initialInventory: 300, maxCapacity: 200 };
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, highInvLogistics);

        // Month 1:
        // Start: 300
        // Prod Arrival: 0
        // Available: 300
        // Sales: 100
        // End Inv: 200
        // Storage Cost: Fixed (100) + Overflow ((200 - 200) * 2) = 100
        expect(result.storageCost[0]).toBe(100);

        // Let's try a case where end inv > max capacity
        // M1 Production: 100. M2 Arrival: 100.
        // M2 Start: 200. Available: 300. Sales: 100. End: 200. Still no overflow.

        // Let's force overflow in M1 by reducing sales
        const lowSalesPlan = mockSalesPlan.map(s => ({ ...s, quantity: 0 }));
        const resultOverflow = calculatePSI(lowSalesPlan, mockProductionPlan, highInvLogistics);

        // Month 1:
        // Start: 300
        // Available: 300
        // Sales: 0
        // End Inv: 300
        // Overflow: 300 - 200 = 100
        // Cost: 100 (Fixed) + 100 * 2 (Overflow) = 300
        expect(resultOverflow.storageCost[0]).toBe(300);
    });

    it('should calculate financial metrics (profit)', () => {
        const result = calculatePSI(mockSalesPlan, mockProductionPlan, mockLogisticsPlan);

        // Month 1:
        // Sold: 50
        // Sales Amount: 50 * 10 = 500
        expect(result.monthlySalesAmount[0]).toBe(500);

        // Production Cost: 100 (produced in M1) * 5 = 500
        expect(result.monthlyProductionCost[0]).toBe(500);

        // Storage Cost: 100 (Fixed)
        expect(result.monthlyLogisticsCost[0]).toBe(100);

        // Profit: 500 (Sales) - 500 (Prod) - 100 (Logistics) = -100
        expect(result.monthlyProfit[0]).toBe(-100);
    });
});
