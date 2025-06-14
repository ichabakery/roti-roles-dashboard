
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBranchManagement = () => {
  const { toast } = useToast();

  const ensureBranchesExist = async () => {
    try {
      // Check if branches exist
      const { data: existingBranches, error: fetchError } = await supabase
        .from('branches')
        .select('*');

      if (fetchError) {
        console.error('Error checking branches:', fetchError);
        return;
      }

      // If no branches exist, create default ones
      if (!existingBranches || existingBranches.length === 0) {
        const defaultBranches = [
          {
            name: 'Cabang Utama',
            address: 'Jl. Raya Utama No. 123',
            phone: '021-1234567'
          },
          {
            name: 'Cabang Selatan',
            address: 'Jl. Selatan Raya No. 456',
            phone: '021-7654321'
          }
        ];

        const { error: insertError } = await supabase
          .from('branches')
          .insert(defaultBranches);

        if (insertError) {
          console.error('Error creating default branches:', insertError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Gagal membuat cabang default",
          });
        } else {
          console.log('Default branches created successfully');
        }
      }
    } catch (error) {
      console.error('Error in ensureBranchesExist:', error);
    }
  };

  const linkUserToBranch = async (userId: string, branchId: string) => {
    try {
      // Check if link already exists
      const { data: existingLink } = await supabase
        .from('user_branches')
        .select('*')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .single();

      if (!existingLink) {
        const { error } = await supabase
          .from('user_branches')
          .insert({
            user_id: userId,
            branch_id: branchId
          });

        if (error) {
          console.error('Error linking user to branch:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error in linkUserToBranch:', error);
      return false;
    }
  };

  return {
    ensureBranchesExist,
    linkUserToBranch
  };
};
