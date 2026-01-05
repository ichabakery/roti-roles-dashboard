
import { useState, useCallback, useMemo } from 'react';

export interface UseBulkSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

export interface UseBulkSelectionReturn<T> {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  selectedCount: number;
  selectedItems: T[];
  hasSelection: boolean;
}

export function useBulkSelection<T>({
  items,
  getItemId
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => 
    new Set(items.map(item => getItemId(item))), 
    [items, getItemId]
  );

  const isSelected = useCallback((id: string) => 
    selectedIds.has(id), 
    [selectedIds]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(() => 
    items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const isPartiallySelected = useMemo(() => 
    selectedIds.size > 0 && selectedIds.size < items.length,
    [selectedIds.size, items.length]
  );

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, deselectAll, selectAll]);

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const hasSelection = selectedIds.size > 0;

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isAllSelected,
    isPartiallySelected,
    selectedCount: selectedIds.size,
    selectedItems,
    hasSelection
  };
}
