# S&OP MVP Design Documentation

This document provides comprehensive design diagrams for the S&OP MVP application.

## Entity-Relationship Diagram (Database Schema)

```mermaid
erDiagram
    scenarios ||--o{ sales_plan : has
    scenarios ||--o{ production_plan : has
    scenarios ||--o{ financial_plan : has
    scenarios ||--o{ logistics_plan : has
    
    scenarios {
        int id PK
        string name
    }
    
    sales_plan {
        int id PK
        int scenario_id FK
        int month
        int quantity
        decimal price
    }
    
    production_plan {
        int id PK
        int scenario_id FK
        int month
        int quantity
        decimal cost
    }
    
    financial_plan {
        int id PK
        int scenario_id FK
        int month
        decimal budget
        decimal salesbudget
        decimal productionbudget
        decimal logisticsbudget
    }
    
    logistics_plan {
        int id PK
        int scenario_id FK
        int initialInventory
        int maxCapacity
        decimal fixedCost
        decimal overflowCost
    }
```

## Sequence Diagram: Data Loading and PSI Calculation

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant SOPContext
    participant API
    participant DB
    participant PSILogic

    User->>Dashboard: Access Dashboard
    Dashboard->>SOPContext: useSOP()
    SOPContext->>API: GET /api/data?scenarioId=1
    API->>DB: getSalesPlan(scenarioId)
    DB-->>API: salesPlan[]
    API->>DB: getProductionPlan(scenarioId)
    DB-->>API: productionPlan[]
    API->>DB: getFinancialPlan(scenarioId)
    DB-->>API: financialPlan[]
    API->>DB: getLogisticsPlan(scenarioId)
    DB-->>API: logisticsPlan{}
    API-->>SOPContext: {salesPlan, productionPlan, financialPlan, logisticsPlan}
    SOPContext->>PSILogic: calculatePSI(salesPlan, productionPlan, logisticsPlan)
    PSILogic-->>SOPContext: psiResults
    SOPContext-->>Dashboard: {plans, psiResults, aiProposals}
    Dashboard->>User: Render Dashboard with Charts
```

## Sequence Diagram: Scenario Management

```mermaid
sequenceDiagram
    participant User
    participant ScenarioSelector
    participant SOPContext
    participant API
    participant DB

    User->>ScenarioSelector: Click "Clone Scenario"
    ScenarioSelector->>User: Prompt for new name
    User->>ScenarioSelector: Enter "Optimistic Plan"
    ScenarioSelector->>SOPContext: cloneScenario(sourceId, "Optimistic Plan")
    SOPContext->>API: POST /api/data {action: "clone", sourceId, name}
    API->>DB: cloneScenario(sourceId, name)
    DB->>DB: BEGIN TRANSACTION
    DB->>DB: INSERT new scenario
    DB->>DB: COPY sales_plan
    DB->>DB: COPY production_plan
    DB->>DB: COPY financial_plan
    DB->>DB: COPY logistics_plan
    DB->>DB: COMMIT
    DB-->>API: newScenario
    API-->>SOPContext: {scenario: newScenario}
    SOPContext->>SOPContext: setCurrentScenario(newScenario.id)
    SOPContext->>API: GET /api/data?scenarioId=newScenario.id
    API->>DB: Load all plans for new scenario
    DB-->>API: plans data
    API-->>SOPContext: plans
    SOPContext-->>ScenarioSelector: Update scenarios list
    ScenarioSelector->>User: Show "Optimistic Plan" as selected
```

## Sequence Diagram: Plan Update

```mermaid
sequenceDiagram
    participant User
    participant SalesPage
    participant SOPContext
    participant API
    participant DB
    participant PSILogic

    User->>SalesPage: Edit sales quantity (M1: 200 → 250)
    SalesPage->>SOPContext: updateSalesPlan(updatedPlan)
    SOPContext->>SOPContext: setSalesPlan(updatedPlan)
    SOPContext->>PSILogic: calculatePSI(updatedPlan, productionPlan, logisticsPlan)
    PSILogic-->>SOPContext: newPsiResults
    SOPContext->>SOPContext: setPsiResults(newPsiResults)
    SOPContext-->>SalesPage: Re-render with updated data
    User->>SalesPage: Click "Save"
    SalesPage->>SOPContext: savePlans()
    SOPContext->>API: POST /api/data {scenarioId, salesPlan}
    API->>DB: saveSalesPlan(scenarioId, salesPlan)
    DB->>DB: BEGIN TRANSACTION
    DB->>DB: DELETE existing sales_plan for scenario
    DB->>DB: INSERT new sales_plan rows
    DB->>DB: COMMIT
    DB-->>API: Success
    API-->>SOPContext: {success: true}
    SOPContext-->>SalesPage: Show success message
```

## Use Case Diagram

```mermaid
graph TD
    User((User))
    
    subgraph "S&OP MVP System"
        UC1[View Dashboard]
        UC2[Manage Scenarios]
        UC3[Edit Sales Plan]
        UC4[Edit Production Plan]
        UC5[Edit Financial Plan]
        UC6[Edit Logistics Plan]
        UC7[View PSI Analysis]
        UC8[Review AI Proposals]
        UC9[Clone Scenario]
        UC10[Switch Scenario]
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    
    UC2 --> UC9
    UC2 --> UC10
    
    UC1 -.includes.-> UC7
    UC3 -.triggers.-> UC7
    UC4 -.triggers.-> UC7
    UC6 -.triggers.-> UC7
```

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        Dashboard[Dashboard Page]
        SalesPage[Sales Plan Page]
        ProdPage[Production Plan Page]
        FinPage[Financial Plan Page]
        LogPage[Logistics Plan Page]
        
        SOPContext[SOPContext Provider]
        ScenarioSelector[Scenario Selector]
        KPICard[KPI Card Component]
        InputTable[Input Table Component]
    end
    
    subgraph "API Layer"
        DataAPI["API: /api/data Route"]
    end
    
    subgraph "Business Logic"
        PSILogic[PSI Calculation Logic]
        AILogic[AI Proposal Logic]
    end
    
    subgraph "Data Layer"
        DBModule[Database Module]
        SQLite[(SQLite - Local)]
        PostgreSQL[(PostgreSQL - Production)]
    end
    
    Dashboard --> SOPContext
    SalesPage --> SOPContext
    ProdPage --> SOPContext
    FinPage --> SOPContext
    LogPage --> SOPContext
    
    Dashboard --> KPICard
    SalesPage --> InputTable
    
    ScenarioSelector --> SOPContext
    
    SOPContext --> DataAPI
    SOPContext --> PSILogic
    SOPContext --> AILogic
    
    DataAPI --> DBModule
    DBModule --> SQLite
    DBModule --> PostgreSQL
```

## Data Flow: PSI Calculation

```mermaid
flowchart LR
    A[Sales Plan] --> D[PSI Logic]
    B[Production Plan] --> D
    C[Logistics Plan] --> D
    
    D --> E[Monthly Sold Qty]
    D --> F[Inventory Levels]
    D --> G[Opportunity Loss]
    D --> H[Storage Costs]
    D --> I[Financial Metrics]
    
    E --> J[Dashboard Charts]
    F --> J
    G --> J
    H --> J
    I --> J
    
    I --> K[AI Proposal Engine]
    F --> K
    G --> K
    
    K --> L[Optimization Suggestions]
```

## Key Design Decisions

### 1. Dual Database Support
- **Local Development**: SQLite for zero-configuration setup
- **Production**: PostgreSQL for scalability and reliability
- **Implementation**: Environment-based switching via `DATABASE_URL`

### 2. Scenario Isolation
- Each scenario has independent plan data
- Cloning creates deep copies of all plan tables
- Transactions ensure data consistency during cloning

### 3. Real-time PSI Calculation
- Calculations performed client-side for instant feedback
- No server round-trip needed for plan updates
- Results cached in React context

### 4. Type Safety
- Explicit `Number()` conversion for PostgreSQL DECIMAL types
- Prevents string concatenation bugs in calculations
- Ensures consistent behavior across databases

### 5. API Design
- Single `/api/data` endpoint with action-based routing
- RESTful GET for reads, POST for writes
- Scenario ID as query parameter for data isolation
