
import { useState } from 'react';
import { NewProductionRequest } from '@/types/production';

export const useProductionForm = () => {
  const [formData, setFormData] = useState<NewProductionRequest>({
    product_id: '',
    branch_id: '',
    quantity_requested: 0,
    production_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (field: keyof NewProductionRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      branch_id: '',
      quantity_requested: 0,
      production_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const isFormValid = () => {
    return (
      formData.product_id && 
      formData.branch_id && 
      formData.quantity_requested > 0 &&
      formData.production_date
    );
  };

  return {
    formData,
    handleChange,
    resetForm,
    isFormValid
  };
};
