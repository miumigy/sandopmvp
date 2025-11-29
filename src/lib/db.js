import { Pool } from "pg";

// Use connection string from env or default to local
// Note: For local dev without env, this might fail if not configured.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Helper for single query
export const query = async (text, params) => {
    return await pool.query(text, params);
};

// Initialize tables
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(`
            CREATE TABLE IF NOT EXISTS scenarios(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_plan(
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id),
    month INTEGER,
    quantity INTEGER,
    price DECIMAL
);
`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS production_plan(
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id),
    month INTEGER,
    quantity INTEGER,
    cost DECIMAL
);
`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS financial_plan(
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id),
    month INTEGER,
    budget DECIMAL,
    salesBudget DECIMAL,
    productionBudget DECIMAL,
    logisticsBudget DECIMAL
);
`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS logistics_plan(
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id),
    initialInventory INTEGER,
    maxCapacity INTEGER,
    fixedCost DECIMAL,
    overflowCost DECIMAL
);
`);

        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

// Seed Data if empty
// Seed Data if empty
const seedData = async () => {
    try {
        await initDb();

        // Check for Base Plan
        const scenarioRes = await query("SELECT id FROM scenarios WHERE name = $1", ["Base Plan"]);
        let defaultScenarioId;

        if (scenarioRes.rows.length === 0) {
            // Create Default Scenario if not exists
            const insertScenario = await query("INSERT INTO scenarios (name) VALUES ($1) RETURNING id", ["Base Plan"]);
            defaultScenarioId = insertScenario.rows[0].id;
        } else {
            defaultScenarioId = scenarioRes.rows[0].id;
        }

        // Seed Sales Plan
        const salesCount = await query("SELECT COUNT(*) as count FROM sales_plan WHERE scenario_id = $1", [defaultScenarioId]);
        if (parseInt(salesCount.rows[0].count) === 0) {
            const salesData = Array.from({ length: 12 }, (_, i) => ({
                scenario_id: defaultScenarioId,
                month: i + 1,
                quantity: (i >= 3 && i <= 7) ? 50 : 200, // Summer slump (M4-M8)
                price: 100,
            }));
            for (const row of salesData) {
                await query(
                    "INSERT INTO sales_plan (scenario_id, month, quantity, price) VALUES ($1, $2, $3, $4)",
                    [row.scenario_id, row.month, row.quantity, row.price]
                );
            }
        }

        // Seed Production Plan
        const prodCount = await query("SELECT COUNT(*) as count FROM production_plan WHERE scenario_id = $1", [defaultScenarioId]);
        if (parseInt(prodCount.rows[0].count) === 0) {
            const prodData = Array.from({ length: 12 }, (_, i) => ({
                scenario_id: defaultScenarioId,
                month: i + 1,
                quantity: 200,
                cost: 60,
            }));
            for (const row of prodData) {
                await query(
                    "INSERT INTO production_plan (scenario_id, month, quantity, cost) VALUES ($1, $2, $3, $4)",
                    [row.scenario_id, row.month, row.quantity, row.cost]
                );
            }
        }

        // Seed Financial Plan
        const finCount = await query("SELECT COUNT(*) as count FROM financial_plan WHERE scenario_id = $1", [defaultScenarioId]);
        if (parseInt(finCount.rows[0].count) === 0) {
            const finData = Array.from({ length: 12 }, (_, i) => ({
                scenario_id: defaultScenarioId,
                month: i + 1,
                budget: 10000,
                salesBudget: 20000,
                productionBudget: 12000,
                logisticsBudget: 2000,
            }));
            for (const row of finData) {
                await query(
                    "INSERT INTO financial_plan (scenario_id, month, budget, salesBudget, productionBudget, logisticsBudget) VALUES ($1, $2, $3, $4, $5, $6)",
                    [row.scenario_id, row.month, row.budget, row.salesBudget, row.productionBudget, row.logisticsBudget]
                );
            }
        }

        // Seed Logistics Plan
        const logCount = await query("SELECT COUNT(*) as count FROM logistics_plan WHERE scenario_id = $1", [defaultScenarioId]);
        if (parseInt(logCount.rows[0].count) === 0) {
            await query(
                "INSERT INTO logistics_plan (scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES ($1, $2, $3, $4, $5)",
                [defaultScenarioId, 100, 300, 1000, 20]
            );
        }
    } catch (error) {
        console.error("Seeding error:", error);
    }
};

// Initialize DB on module load (might be risky in serverless, but okay for long-running container)
// For Next.js API routes, it's better to call this lazily or ensure it handles concurrency.
// We'll call it once.
seedData();

export const getScenarios = async () => {
    const res = await query("SELECT * FROM scenarios");
    return res.rows;
};

export const createScenario = async (name) => {
    const res = await query("INSERT INTO scenarios (name) VALUES ($1) RETURNING *", [name]);
    return res.rows[0];
};

export const cloneScenario = async (sourceId, newName) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const newScenarioRes = await client.query("INSERT INTO scenarios (name) VALUES ($1) RETURNING *", [newName]);
        const newScenario = newScenarioRes.rows[0];
        const targetId = newScenario.id;

        await client.query(`
            INSERT INTO sales_plan(scenario_id, month, quantity, price)
            SELECT $1::INTEGER, month, quantity, price FROM sales_plan WHERE scenario_id = $2::INTEGER
    `, [targetId, sourceId]);

        await client.query(`
            INSERT INTO production_plan(scenario_id, month, quantity, cost)
            SELECT $1::INTEGER, month, quantity, cost FROM production_plan WHERE scenario_id = $2::INTEGER
    `, [targetId, sourceId]);

        await client.query(`
            INSERT INTO financial_plan(scenario_id, month, budget, salesBudget, productionBudget, logisticsBudget)
            SELECT $1::INTEGER, month, budget, salesBudget, productionBudget, logisticsBudget FROM financial_plan WHERE scenario_id = $2::INTEGER
    `, [targetId, sourceId]);

        await client.query(`
            INSERT INTO logistics_plan(scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost)
            SELECT $1::INTEGER, initialInventory, maxCapacity, fixedCost, overflowCost FROM logistics_plan WHERE scenario_id = $2::INTEGER
    `, [targetId, sourceId]);

        await client.query("COMMIT");
        return newScenario;
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

export const getSalesPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM sales_plan WHERE scenario_id = $1 ORDER BY month", [scenarioId]);
    return res.rows;
};

export const saveSalesPlan = async (scenarioId, plan) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Delete existing for this scenario
        // Optimization: Delete all and re-insert is simplest for MVP
        // But to avoid deleting everything if we only send partial updates...
        // The frontend sends the whole plan.

        // We can't easily delete *all* for the scenario if we want to support partial updates, 
        // but here we assume 'plan' contains the full 12 months or the relevant months.
        // Let's delete by (scenario_id, month) for each item to be safe.

        for (const row of plan) {
            await client.query("DELETE FROM sales_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
            await client.query(
                "INSERT INTO sales_plan (scenario_id, month, quantity, price) VALUES ($1, $2, $3, $4)",
                [scenarioId, row.month, row.quantity, row.price]
            );
        }
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

export const getProductionPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM production_plan WHERE scenario_id = $1 ORDER BY month", [scenarioId]);
    return res.rows;
};

export const saveProductionPlan = async (scenarioId, plan) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const row of plan) {
            await client.query("DELETE FROM production_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
            await client.query(
                "INSERT INTO production_plan (scenario_id, month, quantity, cost) VALUES ($1, $2, $3, $4)",
                [scenarioId, row.month, row.quantity, row.cost]
            );
        }
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

export const getFinancialPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM financial_plan WHERE scenario_id = $1 ORDER BY month", [scenarioId]);
    return res.rows;
};

export const saveFinancialPlan = async (scenarioId, plan) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const row of plan) {
            await client.query("DELETE FROM financial_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
            await client.query(
                "INSERT INTO financial_plan (scenario_id, month, budget, salesBudget, productionBudget, logisticsBudget) VALUES ($1, $2, $3, $4, $5, $6)",
                [scenarioId, row.month, row.budget, row.salesBudget, row.productionBudget, row.logisticsBudget]
            );
        }
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

export const getLogisticsPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM logistics_plan WHERE scenario_id = $1", [scenarioId]);
    return res.rows[0];
};

export const saveLogisticsPlan = async (scenarioId, plan) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM logistics_plan WHERE scenario_id = $1", [scenarioId]);
        await client.query(
            "INSERT INTO logistics_plan (scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES ($1, $2, $3, $4, $5)",
            [scenarioId, plan.initialInventory, plan.maxCapacity, plan.fixedCost, plan.overflowCost]
        );
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};
