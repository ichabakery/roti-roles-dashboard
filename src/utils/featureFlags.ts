/**
 * Feature Flags for Simple Inventory V1
 * These flags allow safe rollout and rollback of inventory features
 */

export const FEATURE_FLAGS = {
  // Main feature flag for Simple Inventory V1
  INVENTORY_SIMPLE_V1: process.env.INVENTORY_SIMPLE_V1 === 'true' || true, // Default true for development
  
  // Allow negative stock override with supervisor approval
  ALLOW_NEGATIVE_STOCK_OVERRIDE: process.env.ALLOW_NEGATIVE_STOCK_OVERRIDE === 'true' || false,
  
  // Demo mode with sample data
  DEMO_MODE: process.env.DEMO_MODE === 'true' || false,
} as const;

/**
 * Check if Simple Inventory V1 features should be enabled
 */
export const isInventoryV1Enabled = () => FEATURE_FLAGS.INVENTORY_SIMPLE_V1;

/**
 * Check if negative stock override is allowed
 */
export const isNegativeStockOverrideAllowed = () => FEATURE_FLAGS.ALLOW_NEGATIVE_STOCK_OVERRIDE;

/**
 * Check if demo mode is enabled
 */
export const isDemoModeEnabled = () => FEATURE_FLAGS.DEMO_MODE;

/**
 * Get fallback values for inventory settings
 */
export const INVENTORY_DEFAULTS = {
  UOM: 'pcs',
  REORDER_POINT: 30,
  LEAD_TIME_DAYS: 2,
  SHELF_LIFE_DAYS: 3,
} as const;