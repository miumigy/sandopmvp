// Dual database configuration: SQLite for local dev, PostgreSQL for production
const USE_SQLITE = !process.env.DATABASE_URL;

let db, query, pool;

if (USE_SQLITE) {
    // SQLite configuration for local development
    const Database = require('better-sqlite3');
    const dbPath = process.env.DB_FILENAME || 'sop_local.db';
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Wrapper to make SQLite queries async-compatible
    query = async (text, params = []) => {
        const stmt = db.prepare(text);
        const isSelect = text.trim().toUpperCase().startsWith('SELECT');
        const isReturning = text.toUpperCase().includes('RETURNING');

        if (isSelect || isReturning) {
            const rows = stmt.all(...params);
            return { rows };
        } else {
            const result = stmt.run(...params);
            return { rows: [] };
        }
    };
} else {
    // PostgreSQL configuration for production
    const { Pool } = require('pg');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    query = async (text, params) => {
        return await pool.query(text, params);
    };
}

// Initialize tables
const initDb = async () => {
    if (USE_SQLITE) {
        // SQLite schema
        db.exec(`
            CREATE TABLE IF NOT EXISTS scenarios(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS sales_plan(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id INTEGER REFERENCES scenarios(id),
                month INTEGER,
                quantity INTEGER,
                price REAL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS production_plan(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id INTEGER REFERENCES scenarios(id),
                month INTEGER,
                quantity INTEGER,
                cost REAL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS financial_plan(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id INTEGER REFERENCES scenarios(id),
                month INTEGER,
                budget REAL,
                salesbudget REAL,
                productionbudget REAL,
                logisticsbudget REAL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS logistics_plan(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id INTEGER REFERENCES scenarios(id),
                initialInventory INTEGER,
                maxCapacity INTEGER,
                fixedCost REAL,
                overflowCost REAL
            );
        `);
    } else {
        // PostgreSQL schema
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
                    salesbudget DECIMAL,
                    productionbudget DECIMAL,
                    logisticsbudget DECIMAL
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
    }
};

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
                quantity: (i >= 3 && i <= 7) ? 50 : 200,
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
                salesbudget: 20000,
                productionbudget: 12000,
                logisticsbudget: 2000,
            }));
            for (const row of finData) {
                await query(
                    "INSERT INTO financial_plan (scenario_id, month, budget, salesbudget, productionbudget, logisticsbudget) VALUES ($1, $2, $3, $4, $5, $6)",
                    [row.scenario_id, row.month, row.budget, row.salesbudget, row.productionbudget, row.logisticsbudget]
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

seedData();

export { query };

export const getScenarios = async () => {
    const res = await query("SELECT * FROM scenarios");
    return res.rows;
};

export const createScenario = async (name) => {
    const res = await query("INSERT INTO scenarios (name) VALUES ($1) RETURNING *", [name]);
    return res.rows[0];
};

export const cloneScenario = async (sourceId, newName) => {
    if (USE_SQLITE) {
        // SQLite transaction
        db.exec("BEGIN");
        try {
            const newScenarioRes = await query("INSERT INTO scenarios (name) VALUES ($1) RETURNING *", [newName]);
            const newScenario = newScenarioRes.rows[0];
            const targetId = newScenario.id;

            await query(`
                INSERT INTO sales_plan(scenario_id, month, quantity, price)
                SELECT $1, month, quantity, price FROM sales_plan WHERE scenario_id = $2
            `, [targetId, sourceId]);

            await query(`
                INSERT INTO production_plan(scenario_id, month, quantity, cost)
                SELECT $1, month, quantity, cost FROM production_plan WHERE scenario_id = $2
            `, [targetId, sourceId]);

            await query(`
                INSERT INTO financial_plan(scenario_id, month, budget, salesbudget, productionbudget, logisticsbudget)
                SELECT $1, month, budget, salesbudget, productionbudget, logisticsbudget FROM financial_plan WHERE scenario_id = $2
            `, [targetId, sourceId]);

            await query(`
                INSERT INTO logistics_plan(scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost)
                SELECT $1, initialInventory, maxCapacity, fixedCost, overflowCost FROM logistics_plan WHERE scenario_id = $2
            `, [targetId, sourceId]);

            db.exec("COMMIT");
            return newScenario;
        } catch (e) {
            db.exec("ROLLBACK");
            throw e;
        }
    } else {
        // PostgreSQL transaction
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
                INSERT INTO financial_plan(scenario_id, month, budget, salesbudget, productionbudget, logisticsbudget)
                SELECT $1::INTEGER, month, budget, salesbudget, productionbudget, logisticsbudget FROM financial_plan WHERE scenario_id = $2::INTEGER
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
    }
};

export const getSalesPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM sales_plan WHERE scenario_id = $1 ORDER BY month", [scenarioId]);
    return res.rows;
};

export const saveSalesPlan = async (scenarioId, plan) => {
    if (USE_SQLITE) {
        db.exec("BEGIN");
        try {
            for (const row of plan) {
                await query("DELETE FROM sales_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
                await query(
                    "INSERT INTO sales_plan (scenario_id, month, quantity, price) VALUES ($1, $2, $3, $4)",
                    [scenarioId, row.month, row.quantity, row.price]
                );
            }
            db.exec("COMMIT");
        } catch (e) {
            db.exec("ROLLBACK");
            throw e;
        }
    } else {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
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
    }
};

export const getProductionPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM production_plan WHERE scenario_id = $1 ORDER BY month", [scenarioId]);
    return res.rows;
};

export const saveProductionPlan = async (scenarioId, plan) => {
    if (USE_SQLITE) {
        db.exec("BEGIN");
        try {
            for (const row of plan) {
                await query("DELETE FROM production_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
                await query(
                    "INSERT INTO production_plan (scenario_id, month, quantity, cost) VALUES ($1, $2, $3, $4)",
                    [scenarioId, row.month, row.quantity, row.cost]
                );
            }
            db.exec("COMMIT");
        } catch (e) {
            db.exec("ROLLBACK");
            throw e;
        }
    } else {
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
    }
};

export const getFinancialPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM financial_plan WHERE scenario_id = $1 ORDER BY month", [scenarioId]);
    return res.rows;
};

export const saveFinancialPlan = async (scenarioId, plan) => {
    if (USE_SQLITE) {
        db.exec("BEGIN");
        try {
            for (const row of plan) {
                await query("DELETE FROM financial_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
                await query(
                    "INSERT INTO financial_plan (scenario_id, month, budget, salesbudget, productionbudget, logisticsbudget) VALUES ($1, $2, $3, $4, $5, $6)",
                    [scenarioId, row.month, row.budget, row.salesbudget, row.productionbudget, row.logisticsbudget]
                );
            }
            db.exec("COMMIT");
        } catch (e) {
            db.exec("ROLLBACK");
            throw e;
        }
    } else {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            for (const row of plan) {
                await client.query("DELETE FROM financial_plan WHERE scenario_id = $1 AND month = $2", [scenarioId, row.month]);
                await client.query(
                    "INSERT INTO financial_plan (scenario_id, month, budget, salesbudget, productionbudget, logisticsbudget) VALUES ($1, $2, $3, $4, $5, $6)",
                    [scenarioId, row.month, row.budget, row.salesbudget, row.productionbudget, row.logisticsbudget]
                );
            }
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }
};

export const getLogisticsPlan = async (scenarioId) => {
    const res = await query("SELECT * FROM logistics_plan WHERE scenario_id = $1", [scenarioId]);
    return res.rows[0];
};

export const saveLogisticsPlan = async (scenarioId, plan) => {
    if (USE_SQLITE) {
        db.exec("BEGIN");
        try {
            await query("DELETE FROM logistics_plan WHERE scenario_id = $1", [scenarioId]);
            await query(
                "INSERT INTO logistics_plan (scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES ($1, $2, $3, $4, $5)",
                [scenarioId, plan.initialInventory, plan.maxCapacity, plan.fixedCost, plan.overflowCost]
            );
            db.exec("COMMIT");
        } catch (e) {
            db.exec("ROLLBACK");
            throw e;
        }
    } else {
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
    }
};
