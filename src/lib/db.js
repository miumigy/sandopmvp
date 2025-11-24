import Database from "better-sqlite3";
import path from "path";

const dbFilename = process.env.DB_FILENAME || "sop_v3.db";
const dbPath = path.join(process.cwd(), dbFilename);
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sales_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER,
    month INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );

  CREATE TABLE IF NOT EXISTS production_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER,
    month INTEGER,
    quantity INTEGER,
    cost REAL,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );

  CREATE TABLE IF NOT EXISTS financial_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER,
    month INTEGER,
    budget REAL,
    salesBudget REAL,
    productionBudget REAL,
    logisticsBudget REAL,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );

  CREATE TABLE IF NOT EXISTS logistics_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER,
    initialInventory INTEGER,
    maxCapacity INTEGER,
    fixedCost REAL,
    overflowCost REAL,
    FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
  );
`);

// Seed Data if empty
const seedData = () => {
    const scenarioCount = db.prepare("SELECT COUNT(*) as count FROM scenarios").get().count;

    if (scenarioCount === 0) {
        // Create Default Scenario
        const insertScenario = db.prepare("INSERT INTO scenarios (name) VALUES (@name)");
        const info = insertScenario.run({ name: "Base Plan" });
        const defaultScenarioId = info.lastInsertRowid;

        // Seed Sales Plan
        const insertSales = db.prepare("INSERT INTO sales_plan (scenario_id, month, quantity, price) VALUES (@scenario_id, @month, @quantity, @price)");
        const insertManySales = db.transaction((data) => {
            for (const row of data) insertSales.run(row);
        });
        const salesData = Array.from({ length: 12 }, (_, i) => ({
            scenario_id: defaultScenarioId,
            month: i + 1,
            quantity: (i >= 3 && i <= 7) ? 50 : 200, // Summer slump (M4-M8)
            price: 100,
        }));
        insertManySales(salesData);

        // Seed Production Plan
        const insertProd = db.prepare("INSERT INTO production_plan (scenario_id, month, quantity, cost) VALUES (@scenario_id, @month, @quantity, @cost)");
        const insertManyProd = db.transaction((data) => {
            for (const row of data) insertProd.run(row);
        });
        const prodData = Array.from({ length: 12 }, (_, i) => ({
            scenario_id: defaultScenarioId,
            month: i + 1,
            quantity: 200,
            cost: 60,
        }));
        insertManyProd(prodData);

        // Seed Financial Plan
        const insertFin = db.prepare("INSERT INTO financial_plan (scenario_id, month, budget, salesBudget, productionBudget, logisticsBudget) VALUES (@scenario_id, @month, @budget, @salesBudget, @productionBudget, @logisticsBudget)");
        const insertManyFin = db.transaction((data) => {
            for (const row of data) insertFin.run(row);
        });
        const finData = Array.from({ length: 12 }, (_, i) => ({
            scenario_id: defaultScenarioId,
            month: i + 1,
            budget: 10000,
            salesBudget: 20000,
            productionBudget: 12000,
            logisticsBudget: 2000,
        }));
        insertManyFin(finData);

        // Seed Logistics Plan
        const insertLog = db.prepare("INSERT INTO logistics_plan (scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES (@scenario_id, @initialInventory, @maxCapacity, @fixedCost, @overflowCost)");
        insertLog.run({
            scenario_id: defaultScenarioId,
            initialInventory: 100,
            maxCapacity: 300,
            fixedCost: 1000,
            overflowCost: 20,
        });
    }
};

seedData();

export const getScenarios = () => {
    return db.prepare("SELECT * FROM scenarios").all();
};

export const createScenario = (name) => {
    const stmt = db.prepare("INSERT INTO scenarios (name) VALUES (?)");
    const info = stmt.run(name);
    return { id: info.lastInsertRowid, name };
};

// Clone a scenario (copy all data from sourceId to new scenario)
export const cloneScenario = (sourceId, newName) => {
    const newScenario = createScenario(newName);
    const targetId = newScenario.id;

    const copySales = db.prepare(`
        INSERT INTO sales_plan (scenario_id, month, quantity, price)
        SELECT ?, month, quantity, price FROM sales_plan WHERE scenario_id = ?
    `);

    const copyProd = db.prepare(`
        INSERT INTO production_plan (scenario_id, month, quantity, cost)
        SELECT ?, month, quantity, cost FROM production_plan WHERE scenario_id = ?
    `);

    const copyFin = db.prepare(`
        INSERT INTO financial_plan (scenario_id, month, budget, salesBudget, productionBudget, logisticsBudget)
        SELECT ?, month, budget, salesBudget, productionBudget, logisticsBudget FROM financial_plan WHERE scenario_id = ?
    `);

    const copyLog = db.prepare(`
        INSERT INTO logistics_plan (scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost)
        SELECT ?, initialInventory, maxCapacity, fixedCost, overflowCost FROM logistics_plan WHERE scenario_id = ?
    `);

    const transaction = db.transaction(() => {
        copySales.run(targetId, sourceId);
        copyProd.run(targetId, sourceId);
        copyFin.run(targetId, sourceId);
        copyLog.run(targetId, sourceId);
    });

    transaction();
    return newScenario;
};

export const getSalesPlan = (scenarioId) => {
    const stmt = db.prepare("SELECT * FROM sales_plan WHERE scenario_id = ? ORDER BY month");
    return stmt.all(scenarioId);
};

export const saveSalesPlan = (scenarioId, plan) => {
    // Delete existing for this scenario and month to avoid duplicates or complex upserts with ID
    // Or better: use INSERT OR REPLACE if we had a unique constraint on (scenario_id, month).
    // Let's add a unique index or just delete and re-insert for simplicity in this MVP.
    // Actually, let's use a transaction to delete and insert.

    const deleteStmt = db.prepare("DELETE FROM sales_plan WHERE scenario_id = ? AND month = ?");
    const insertStmt = db.prepare("INSERT INTO sales_plan (scenario_id, month, quantity, price) VALUES (@scenario_id, @month, @quantity, @price)");

    const saveTransaction = db.transaction((planItems) => {
        for (const row of planItems) {
            deleteStmt.run(scenarioId, row.month);
            insertStmt.run({ ...row, scenario_id: scenarioId });
        }
    });

    saveTransaction(plan);
};

export const getProductionPlan = (scenarioId) => {
    const stmt = db.prepare("SELECT * FROM production_plan WHERE scenario_id = ? ORDER BY month");
    return stmt.all(scenarioId);
};

export const saveProductionPlan = (scenarioId, plan) => {
    const deleteStmt = db.prepare("DELETE FROM production_plan WHERE scenario_id = ? AND month = ?");
    const insertStmt = db.prepare("INSERT INTO production_plan (scenario_id, month, quantity, cost) VALUES (@scenario_id, @month, @quantity, @cost)");

    const saveTransaction = db.transaction((planItems) => {
        for (const row of planItems) {
            deleteStmt.run(scenarioId, row.month);
            insertStmt.run({ ...row, scenario_id: scenarioId });
        }
    });

    saveTransaction(plan);
};

export const getFinancialPlan = (scenarioId) => {
    const stmt = db.prepare("SELECT * FROM financial_plan WHERE scenario_id = ? ORDER BY month");
    return stmt.all(scenarioId);
};

export const saveFinancialPlan = (scenarioId, plan) => {
    const deleteStmt = db.prepare("DELETE FROM financial_plan WHERE scenario_id = ? AND month = ?");
    const insertStmt = db.prepare("INSERT INTO financial_plan (scenario_id, month, budget, salesBudget, productionBudget, logisticsBudget) VALUES (@scenario_id, @month, @budget, @salesBudget, @productionBudget, @logisticsBudget)");

    const saveTransaction = db.transaction((planItems) => {
        for (const row of planItems) {
            deleteStmt.run(scenarioId, row.month);
            insertStmt.run({ ...row, scenario_id: scenarioId });
        }
    });

    saveTransaction(plan);
};

export const getLogisticsPlan = (scenarioId) => {
    const stmt = db.prepare("SELECT * FROM logistics_plan WHERE scenario_id = ?");
    return stmt.get(scenarioId);
};

export const saveLogisticsPlan = (scenarioId, plan) => {
    // Logistics plan is usually single row per scenario
    const deleteStmt = db.prepare("DELETE FROM logistics_plan WHERE scenario_id = ?");
    const insertStmt = db.prepare("INSERT INTO logistics_plan (scenario_id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES (@scenario_id, @initialInventory, @maxCapacity, @fixedCost, @overflowCost)");

    const saveTransaction = db.transaction(() => {
        deleteStmt.run(scenarioId);
        insertStmt.run({ ...plan, scenario_id: scenarioId });
    });

    saveTransaction();
};
