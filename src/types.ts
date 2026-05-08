export type DocType = 'SINV' | 'PINV' | 'SO' | 'PO' | 'SDN' | 'PDN';

export interface ConnectionConfig {
  /** URL base del servidor OpenFactu (ej. 'http://localhost:3000') */
  baseUrl: string;
  /** Token JWT de autenticación */
  token: string;
  /** ID del tenant (empresa) */
  tenantId: string;
  /** Timeout en ms para las peticiones (default: 30000) */
  timeout?: number;
}

export interface DocumentLine {
  itemId: string;
  quantity: number;
  price: number;
  taxGroupId?: string;
  warehouseId?: string;
  zoneId?: string;
  uomId?: string;
  uomFactor?: number;
  batchDetails?: Array<{
    batchNum: string;
    quantity: number;
    expiryDate?: string;
    zoneId?: string;
  }>;
  pluginData?: Record<string, any>;
}

export interface DocumentCreateParams {
  partnerId: string;
  seriesId: string;
  periodId: string;
  date?: string | Date;
  warehouseId?: string;
  billToAddress?: string;
  shipToAddress?: string;
  deliveryDate?: string | Date;
  orderId?: string;
  lines: DocumentLine[];
  customFields?: Record<string, any>;
}

export interface DocumentResponse {
  success: boolean;
  id: string;
  docNum: number;
  docType: DocType;
  label: string;
}

/** Fila devuelta por Documents.list() */
export interface DocumentListItem {
  id: string;
  docNum: number;
  seriesPrefix?: string | null;
  periodCode?: string | null;
  date: string;
  partnerId: string;
  total: number;
  status: string;
  subtotal?: number;
  taxTotal?: number;
  paymentStatus?: string;
  amountPaid?: number;
  isLocked?: boolean;
  dueDate?: string | null;
  baseDocCode?: string | null;
}

/** Detalle completo devuelto por Documents.get() */
export interface DocumentDetail {
  id: string;
  docNum: number;
  seriesId: string;
  periodId: string;
  partnerId: string;
  date: string;
  status: string;
  billToAddress?: string | null;
  shipToAddress?: string | null;
  warehouseId?: string | null;
  internalOrderId?: string | null;
  deliveryDate?: string | null;
  orderId?: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  paymentStatus?: string;
  amountPaid?: number;
  isLocked?: boolean;
  dueDate?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  lines?: DocumentLineDetail[];
}

export interface DocumentLineDetail {
  id: string;
  lineNum: number;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  quantity: number;
  deliveredQty?: number;
  receivedQty?: number;
  price: number;
  taxGroupId?: string | null;
  lineTotal: number;
  warehouseId?: string | null;
  zoneId?: string | null;
  uomId?: string | null;
  uomFactor?: number;
  description?: string | null;
  discountRate?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  withholdingRate?: number;
  withholdingAmount?: number;
  costCenterId?: string | null;
  profitCenterId?: string | null;
  internalOrderId?: string | null;
  pluginData?: Record<string, any>;
}

export interface PartnerAddress {
  id: string;
  partnerId: string;
  name: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  subRegionId?: string | null;
  localityId?: string | null;
  type: string;
  isDefault: boolean;
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  nif?: string | null;
  foreignName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  groupId?: string | null;
  priceListId?: string | null;
  countryCode?: string | null;
  defaultDocumentTypeId?: string | null;
  defaultPaymentMethodId?: string | null;
  defaultPaymentTermId?: string | null;
  defaultWithholdingRate?: number | null;
  iban?: string | null;
  bankName?: string | null;
  bankSwift?: string | null;
  addresses?: PartnerAddress[];
}

export interface PartnerCreateParams {
  name: string;
  code?: string;
  nif?: string;
  foreignName?: string;
  phone?: string;
  email?: string;
  website?: string;
  groupId?: string;
  priceListId?: string;
  countryCode?: string;
  defaultDocumentTypeId?: string;
  defaultPaymentMethodId?: string;
  defaultPaymentTermId?: string;
  defaultWithholdingRate?: number;
  iban?: string;
  bankName?: string;
  bankSwift?: string;
  addresses?: Omit<PartnerAddress, 'id' | 'partnerId'>[];
}

export interface PartnerUpdateParams extends Partial<PartnerCreateParams> {}

export interface Item {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  uomId: string;
  uomCode?: string | null;
  uomName?: string | null;
  categoryId?: string | null;
  taxGroupId?: string | null;
  manageBy: 'N' | 'B' | 'S';
  basePrice: number;
  stock: number;
  minStock: number;
  defaultWarehouseId?: string | null;
  defaultZoneId?: string | null;
  kind: 'product' | 'box';
  boxLengthMm?: number | null;
  boxWidthMm?: number | null;
  boxHeightMm?: number | null;
  boxMaxWeightKg?: number | null;
  boxTareWeightKg?: number | null;
  createdAt?: string;
  updatedAt?: string;
  /** Campos custom (`p_*`) inyectados por la API */
  [customField: `p_${string}`]: any;
}

export interface ItemCreateParams {
  name: string;
  uomId: string;
  code?: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  taxGroupId?: string;
  manageBy?: 'N' | 'B' | 'S';
  basePrice?: number;
  stock?: number;
  minStock?: number;
  defaultWarehouseId?: string;
  defaultZoneId?: string;
  kind?: 'product' | 'box';
  boxLengthMm?: number;
  boxWidthMm?: number;
  boxHeightMm?: number;
  boxMaxWeightKg?: number;
  boxTareWeightKg?: number;
  /** Campos custom (`p_*`) */
  [customField: `p_${string}`]: any;
}

export interface ItemUpdateParams extends Partial<ItemCreateParams> {}

export interface ItemBatch {
  id: string;
  batchNum: string;
  itemId: string;
  quantity: number;
  expiryDate?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  zoneName?: string | null;
  type: 'B' | 'S';
}

export interface ItemStock {
  warehouseStock: Array<{
    warehouseId: string;
    warehouseName?: string | null;
    stock: number;
  }>;
  zoneStock: Array<{
    warehouseId: string;
    zoneId: string;
    zoneName?: string | null;
    stock: number;
  }>;
  batches: Array<{
    id: string;
    batchNum: string;
    itemId: string;
    quantity: number;
    expiryDate?: string | null;
    zoneId?: string | null;
    zoneName?: string | null;
    warehouseName?: string | null;
  }>;
}

export interface ItemUom {
  id?: string;
  uomId: string;
  code?: string | null;
  name?: string | null;
  factor: string;
  isBase: boolean;
}

export interface ApiError {
  error: string;
}
