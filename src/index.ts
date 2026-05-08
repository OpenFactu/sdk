import React from 'react';

// ── Hook Context (lo que recibe un hook al ejecutarse) ──

export interface HookContext {
  tenantId: string;
  db: any;
  data: any;
  user?: any;
  [key: string]: any;
}

export type HookHandler = (ctx: HookContext) => Promise<void> | void;

// ── Plugin Context (lo que recibe init()) ──

export interface PluginContext {
  app: any;
  migration: {
    addCustomField: (opts: {
      pluginId: string;
      tableName: CoreTableName | string;
      fieldName: string;
      type: 'TEXT' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'JSONB';
      label: string;
    }) => Promise<void>;
    createTable: (opts: {
      pluginId: string;
      tableName: string;
      columns: Array<{
        name: string;
        type: 'TEXT' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'JSONB' | 'UUID' | 'TIMESTAMP';
        primaryKey?: boolean;
        nullable?: boolean;
        default?: string;
      }>;
    }) => Promise<void>;
  };
  hooks: {
    register: (event: string, handler: HookHandler) => void;
  };
  documents: {
    onBeforeCreate: (tableName: string, handler: HookHandler) => void;
    onAfterCreate: (tableName: string, handler: HookHandler) => void;
  };
  factuApi: FactuApi;
}

// ─────────────────────────────────────────────────────────────────
// FactuApi — superficie completa expuesta a plugins
// ─────────────────────────────────────────────────────────────────

/** Tipo de documento de negocio. */
export type DocType = 'SINV' | 'PINV' | 'SO' | 'PO' | 'SDN' | 'PDN';

/** Origen de un asiento contable. */
export type JournalSource =
  | 'manual'
  | 'sales_invoice'
  | 'purchase_invoice'
  | 'payment'
  | 'payroll'
  | 'period_close'
  | 'period_open'
  | 'reversal';

export interface JournalLineInput {
  accountId: string;
  debit?: number | string;
  credit?: number | string;
  description?: string | null;
  costCenterId?: string | null;
  profitCenterId?: string | null;
  internalOrderId?: string | null;
  partnerId?: string | null;
  taxId?: string | null;
  currency?: string;
  exchangeRate?: number | string;
}

export interface JournalEntry {
  id: string;
  date: Date | string;
  periodId: string;
  description: string | null;
  source: JournalSource;
  sourceDocumentId: string | null;
  addLine(line: JournalLineInput): JournalEntry;
  readonly lines: readonly JournalLineInput[];
  save(db: any, userId?: string | null): Promise<{ id: string }>;
}

export interface DiLine {
  itemId: string;
  quantity: number;
  price: number;
  taxGroupId: string;
  warehouseId?: string;
  zoneId?: string;
  uomId?: string;
  uomFactor?: number;
  batchDetails?: Array<{
    batchNum: string;
    quantity: number;
    expiryDate?: Date;
    zoneId?: string;
  }>;
  pluginData?: Record<string, any>;
  costCenterId?: string | null;
  profitCenterId?: string | null;
  internalOrderId?: string | null;
  [key: string]: any;
}

export interface DiDocument {
  readonly id: string;
  readonly docType: DocType;
  partnerId: string;
  seriesId: string;
  periodId: string;
  date: Date | string;
  warehouseId?: string;
  billToAddress?: string;
  shipToAddress?: string;
  deliveryDate?: Date | string;
  orderId?: string;
  customFields: Record<string, any>;
  addLine(line: DiLine): DiDocument;
  readonly lines: readonly DiLine[];
  save(tenantId: string, db: any, user: any): Promise<{ id: string; docNum: number }>;
}

export interface PeriodClosePreview {
  period: any;
  blockers: string[];
  regularizationLines: JournalLineInput[];
  resultAmount: number;
  nextPeriodCode: string;
  nextPeriodStart: string;
  nextPeriodEnd: string;
  openingLines: JournalLineInput[];
}

export interface FactuApiTransaction {
  readonly tenantId: string;
  readonly db: any;
  readonly user: any;

  // ── Factory de documentos ──
  salesInvoice(): DiDocument;
  purchaseInvoice(): DiDocument;
  salesOrder(): DiDocument;
  purchaseOrder(): DiDocument;
  salesDeliveryNote(): DiDocument;
  purchaseDeliveryNote(): DiDocument;
  create(docType: DocType): DiDocument;
  save(doc: DiDocument): Promise<{ id: string; docNum: number }>;

  // ── Consultas de maestros ──
  getPartner(idOrCode: string): Promise<any | null>;
  getPartners(): Promise<any[]>;
  getItem(idOrCode: string): Promise<any | null>;
  getItems(): Promise<any[]>;
  getCategories(): Promise<any[]>;
  getWarehouses(): Promise<any[]>;
  getSeries(docType?: string): Promise<any[]>;
  getTaxGroups(): Promise<any[]>;
  getCurrencies(): Promise<any[]>;
  getPaymentMethods(): Promise<any[]>;
  getPaymentTerms(): Promise<any[]>;
  getDocumentTypes(): Promise<any[]>;
  getOpenPeriods(): Promise<any[]>;
  getPeriods(): Promise<any[]>;

  // ── Plan contable / analítica ──
  getChartOfAccounts(): Promise<any[]>;
  getAccount(idOrCode: string): Promise<any | null>;
  getCostCenter(idOrCode: string): Promise<any | null>;
  getProfitCenter(idOrCode: string): Promise<any | null>;
  getInternalOrder(idOrCode: string): Promise<any | null>;
  getDimensionRule(accountId: string): Promise<any | null>;

  // ── Asientos contables ──
  journalEntry(): JournalEntry;
  postJournalEntry(entryId: string): Promise<void>;
  reverseJournalEntry(entryId: string, description?: string): Promise<{ reversalId: string }>;
  resolveAccount(kind: string, key?: string | null): Promise<string | null>;
  createEntryFromSalesInvoice(invoice: any, lines?: any[]): Promise<{ id: string } | null>;
  createEntryFromPurchaseInvoice(invoice: any, lines?: any[]): Promise<{ id: string } | null>;
  createEntryFromPayment(
    payment: any,
    invoice: { id: string; partnerId: string; periodId: string; docNum?: number },
    direction: 'sales' | 'purchase',
  ): Promise<{ id: string } | null>;

  // ── Cierre de período ──
  previewPeriodClose(periodId: string): Promise<PeriodClosePreview>;
  closePeriod(periodId: string): Promise<{
    regularizationEntryId: string | null;
    nextPeriodId: string;
    openingEntryId: string | null;
  }>;

  // ── Pagos ──
  registerPayment(opts: {
    invoiceId: string;
    direction: 'sales' | 'purchase';
    amount: number;
    date?: Date | string;
    reference: string;
    paymentMethodId?: string | null;
    notes?: string | null;
  }): Promise<{ id: string; journalEntryId: string | null }>;

  // ── RRHH ──
  getEmployees(): Promise<any[]>;
  getEmployee(idOrCode: string): Promise<any | null>;
  getDepartment(idOrCode: string): Promise<any | null>;
  approvePayroll(payrollId: string, periodId?: string): Promise<{ id: string } | null>;

  // ── RRHH avanzado ──
  getContracts(opts?: { employeeId?: string; activeOnly?: boolean }): Promise<any[]>;
  getPayrollConcepts(opts?: { activeOnly?: boolean }): Promise<any[]>;
  getPayrolls(opts?: { employeeId?: string; year?: number; month?: number }): Promise<any[]>;
  getPayroll(id: string): Promise<any | null>;
  addPayrollLine(
    payrollId: string,
    line: {
      conceptId?: string | null;
      concept: string;
      type: 'earning' | 'deduction' | 'employer_cost';
      quantity?: number | null;
      rate?: number | null;
      baseAmount?: number | null;
      amount: number;
      accountId?: string | null;
    },
  ): Promise<any>;
  getTimeclockEntries(opts?: {
    employeeId?: string;
    from?: Date | string;
    to?: Date | string;
    kind?: 'in' | 'out' | 'break_start' | 'break_end';
  }): Promise<any[]>;
  addTimeclockEntry(entry: {
    employeeId: string;
    kind: 'in' | 'out' | 'break_start' | 'break_end';
    at?: Date | string;
    source?: 'web' | 'kiosk' | 'admin';
    notes?: string;
  }): Promise<any>;
  getShiftAssignments(opts?: { employeeId?: string; from?: string; to?: string }): Promise<any[]>;
  getShiftTemplates(): Promise<any[]>;
  getIncidentTypes(): Promise<any[]>;
  getIncidents(opts?: {
    employeeId?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'covered';
    from?: Date | string;
    to?: Date | string;
  }): Promise<any[]>;
  getCollectiveAgreements(): Promise<any[]>;
  getEvaluations(opts?: { cycleId?: string; employeeId?: string }): Promise<any[]>;
  getObjectives(opts?: { employeeId?: string; status?: string }): Promise<any[]>;
  getCommissionRules(): Promise<any[]>;
  getCommissionAccruals(opts?: {
    employeeId?: string;
    status?: 'pending' | 'paid' | 'cancelled';
    year?: number;
    month?: number;
  }): Promise<any[]>;

  // ── Tareas y Proyectos ──
  getTasks(opts?: {
    assigneeId?: string;
    status?: string;
    projectId?: string;
  }): Promise<any[]>;
  createTask(task: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    internalOrderId?: string;
    departmentId?: string;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
  }): Promise<any>;
  updateTask(id: string, patch: Record<string, any>): Promise<any>;
  getGantt(opts?: { from?: string; to?: string; projectId?: string }): Promise<{
    tasks: any[];
    dependencies: any[];
  }>;
}

export interface FactuApi {
  create(docType: DocType): DiDocument;
  salesInvoice(): DiDocument;
  purchaseInvoice(): DiDocument;
  salesOrder(): DiDocument;
  purchaseOrder(): DiDocument;
  salesDeliveryNote(): DiDocument;
  purchaseDeliveryNote(): DiDocument;
  /** Ejecuta un callback en una transacción atómica. */
  transaction<T>(
    tenantId: string,
    db: any,
    user: any,
    fn: (tx: FactuApiTransaction) => Promise<T>,
  ): Promise<T>;
  /** Acceso sin transacción explícita. */
  connect(tenantId: string, db: any, user: any): FactuApiTransaction;
  getTenants(): Promise<any[]>;
  getTenant(tenantId: string): Promise<any | null>;
  getTenantByName(name: string): Promise<any | null>;
  getTenantDb(tenantId: string): Promise<any>;
  login(emailOrUsername: string, password: string): Promise<{
    user: any;
    tenants: Array<{ tenantId: string; tenantName: string; role: string; permissions: any }>;
    token: string;
  }>;
  session(
    emailOrUsername: string,
    password: string,
    tenantName?: string,
  ): Promise<{
    tenantId: string;
    tenantName: string;
    db: any;
    user: any;
    token: string;
    api: FactuApiTransaction;
  }>;
  disconnect(): Promise<void>;
}

export type PluginInit = (context: PluginContext) => void | Promise<void>;

// ── Manifest ──

export interface PluginRoute {
  path: string;
  title: string;
  type: 'table' | 'form' | 'custom' | 'dashboard';
  icon?: string;
  config?: any;
}

/** @deprecated Usa `modules` o `subTabs` en `ui`. Se mantiene por compatibilidad. */
export interface PluginMenuItem {
  label: string;
  path: string;
  icon: string;
}

/**
 * Sub-tab inyectada dentro de un módulo del navbar (core o de otro plugin).
 * Aparece como pestaña horizontal en la topbar cuando el módulo está activo.
 */
export interface PluginSubTab {
  /** ID del módulo donde inyectar (core: home, inventory, sales, purchases, accounting, plugins, settings, o el id de un módulo de otro plugin). */
  moduleId: string;
  label: string;
  path: string;
  /** Nombre de un icono de lucide-react. Opcional. */
  icon?: string;
}

/**
 * Módulo top-level registrado por un plugin. Aparece como icono nuevo en el sidebar.
 */
export interface PluginModule {
  id: string;
  label: string;
  /** Nombre de un icono de lucide-react (ej: "Tag", "Briefcase"). */
  icon: string;
  /** Sub-tabs propios de este módulo. */
  subTabs?: Array<Omit<PluginSubTab, 'moduleId'>>;
}

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  logo?: string;
  ui?: {
    routes?: PluginRoute[];
    /** @deprecated Usa `modules` o `subTabs`. */
    menuItems?: PluginMenuItem[];
    /** Módulos top-level (icono nuevo en el sidebar). */
    modules?: PluginModule[];
    /** Sub-tabs inyectados en módulos existentes. */
    subTabs?: PluginSubTab[];
  };
}

// ── Tablas del ERP ──

export type CoreTableName =
  | 'SalesInvoice' | 'SalesOrder' | 'SalesDeliveryNote'
  | 'PurchaseInvoice' | 'PurchaseOrder' | 'PurchaseDeliveryNote'
  | 'SalesInvoiceLine' | 'SalesOrderLine' | 'SalesDeliveryNoteLine'
  | 'PurchaseInvoiceLine' | 'PurchaseOrderLine' | 'PurchaseDeliveryNoteLine'
  | 'BusinessPartner' | 'Item' | 'Warehouse' | 'WarehouseZone'
  | 'Category' | 'UnitOfMeasure' | 'AccountingPeriod' | 'DocumentSeries'
  // Contabilidad avanzada
  | 'ChartOfAccount' | 'CostCenter' | 'ProfitCenter' | 'InternalOrder' | 'DimensionRule'
  | 'JournalEntry' | 'JournalEntryLine' | 'AccountMapping'
  // RRHH
  | 'Employee' | 'Department' | 'Position' | 'Contract'
  | 'Payroll' | 'PayrollLine' | 'Leave';

// ── Hooks disponibles ──

export type DocumentType =
  | 'salesInvoice' | 'purchaseInvoice'
  | 'salesOrder' | 'purchaseOrder'
  | 'salesDeliveryNote' | 'purchaseDeliveryNote';

export type HookEvent =
  | `${DocumentType}.${'beforeCreate' | 'afterCreate' | 'posted'}`
  | `${'items' | 'partners'}.list.afterFetch`
  | `journalEntry.${'posted' | 'reversed'}`
  | `payroll.approved`
  | `period.${'closed' | 'opened'}`
  | `payment.${'created' | 'deleted'}`
  | `shipment.${'created' | 'packed' | 'dispatched' | 'delivered' | 'received' | 'exception'}`
  | `picking.${'started' | 'taskUpdated' | 'completed'}`
  | `route.${'started' | 'completed' | 'stopVisited'}`;

/**
 * Contexto que reciben los handlers de `<entity>.list.afterFetch`.
 * El plugin puede mutar `rows` o devolver un array nuevo.
 */
export interface ListFetchContext<T = any> extends HookContext {
  entity: 'items' | 'partners' | string;
  filters: Record<string, any>;
  rows: T[];
}

// ── UI Components (tipos para IntelliSense) ──

export type OpenFactuComponent<P = {}> = React.FC<P>;

export interface UIComponents {
  Button: React.FC<any>;
  Card: React.FC<any>;
  Table: React.FC<any>;
  Badge: React.FC<any>;
  Input: React.FC<any>;
  Loader: React.FC<any>;
  Modal: React.FC<any>;
  useToast: () => {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

// ── Re-exports para compatibilidad ──

/** @deprecated Usa PluginContext */
export type PluginServerContext = PluginContext;
/** @deprecated Usa PluginInit */
export type PluginInitFunction = PluginInit;
/** @deprecated Usa PluginManifest */
export type OpenFactuPluginManifest = PluginManifest;
export type FieldType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'JSONB';
export interface InjectedField {
  pluginId: string;
  tableName: CoreTableName | string;
  fieldName: string;
  fieldType: FieldType;
  label: string;
}
