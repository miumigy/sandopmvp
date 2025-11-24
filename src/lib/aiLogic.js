export const generateProposal = (salesPlan, productionPlan, logisticsPlan, psiResults) => {
    const proposals = [];

    // Check for Opportunity Loss
    psiResults.opportunityLoss.forEach((loss, index) => {
        if (loss > 0) {
            // Suggest increasing production in previous month
            // But wait, production takes 1 month. So to fix Month i, we need production in Month i-1.
            const targetMonth = index - 1;
            if (targetMonth >= 0) {
                proposals.push({
                    type: "PRODUCTION_INCREASE",
                    month: targetMonth + 1, // Display as 1-indexed
                    message: `Month ${index + 1} has an opportunity loss of ${loss}. Increase production in Month ${targetMonth + 1} by ${loss}.`,
                    impact: "Reduces opportunity loss, increases revenue."
                });
            } else {
                proposals.push({
                    type: "INITIAL_INVENTORY",
                    month: 1,
                    message: `Month 1 has an opportunity loss of ${loss}. Increase initial inventory if possible.`,
                    impact: "Reduces opportunity loss."
                });
            }
        }
    });

    // Check for Inventory Overflow
    psiResults.inventory.forEach((inv, index) => {
        if (inv > logisticsPlan.maxCapacity) {
            const excess = inv - logisticsPlan.maxCapacity;
            proposals.push({
                type: "PRODUCTION_DECREASE",
                month: index, // If we decrease production in Month i-1, it affects Month i. 
                // Actually, if inventory is high in Month i, it means we had too much available.
                // Reducing production in Month i-1 helps.
                message: `Month ${index + 1} inventory exceeds capacity by ${excess}. Consider reducing production in previous months.`,
                impact: "Reduces storage costs."
            });
        }
    });

    return proposals;
};
