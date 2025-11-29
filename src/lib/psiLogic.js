export const calculatePSI = (salesPlan, productionPlan, logisticsPlan) => {
    const months = 12;
    const inventory = [];
    const opportunityLoss = [];
    const storageCost = [];

    // Financial Metrics
    const monthlySalesAmount = [];
    const monthlyProductionCost = [];
    const monthlyLogisticsCost = [];
    const monthlyProfit = [];

    // Ensure initialInventory is a number
    let currentInventory = Number(logisticsPlan.initialInventory || 0);
    console.log(`[PSI Calc] Initial Inventory: ${currentInventory} (Type: ${typeof currentInventory})`);

    for (let i = 0; i < months; i++) {
        const productionArrival = i > 0 ? (productionPlan[i - 1]?.quantity || 0) : 0;

        const startInventory = i === 0 ? currentInventory : inventory[i - 1];

        let available = startInventory;
        if (i > 0) {
            available += productionPlan[i - 1]?.quantity || 0;
        }

        const salesQty = salesPlan[i]?.quantity || 0;
        const salesPrice = salesPlan[i]?.price || 0;
        const productionQty = productionPlan[i]?.quantity || 0;
        const productionUnitCost = productionPlan[i]?.cost || 0;

        let sold = 0;
        let loss = 0;

        if (available >= salesQty) {
            sold = salesQty;
            loss = 0;
        } else {
            sold = available;
            loss = salesQty - available;
        }

        const endInventory = available - sold;
        inventory.push(endInventory);
        opportunityLoss.push(loss);

        // Logistics Cost Calculation
        const maxCap = logisticsPlan.maxCapacity || 0;
        const fixedCost = logisticsPlan.fixedCost || 0;
        const overflowCostPerUnit = logisticsPlan.overflowCost || 0;

        let monthlyStorage = fixedCost;
        if (endInventory > maxCap) {
            monthlyStorage += (endInventory - maxCap) * overflowCostPerUnit;
        }
        storageCost.push(monthlyStorage);
        monthlyLogisticsCost.push(monthlyStorage);

        // Financials
        const salesAmount = sold * salesPrice;
        monthlySalesAmount.push(salesAmount);

        const prodCost = productionQty * productionUnitCost;
        monthlyProductionCost.push(prodCost);

        const profit = salesAmount - prodCost - monthlyStorage;
        monthlyProfit.push(profit);
    }

    return {
        inventory,
        opportunityLoss,
        storageCost,
        monthlySalesAmount,
        monthlyProductionCost,
        monthlyLogisticsCost,
        monthlyProfit,
    };
};
