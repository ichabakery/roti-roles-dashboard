
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBranchManagement = () => {
  const { toast } = useToast();

  const ensureBranchesExist = async () => {
    try {
      console.log('Checking if branches exist...');
      
      // Check if branches exist
      const { data: existingBranches, error: fetchError } = await supabase
        .from('branches')
        .select('*');

      if (fetchError) {
        console.error('Error checking branches:', fetchError);
        return;
      }

      console.log('Existing branches:', existingBranches);

      // If no branches exist, create default ones
      if (!existingBranches || existingBranches.length === 0) {
        console.log('No branches found, creating default branches...');
        
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
      } else {
        console.log('Branches already exist:', existingBranches.length, 'branches found');
      }
    } catch (error) {
      console.error('Error in ensureBranchesExist:', error);
    }
  };

  const linkUserToBranch = async (userId: string, branchId: string) => {
    try {
      console.log('Linking user to branch:', userId, '->', branchId);
      
      // Check if link already exists
      const { data: existingLink, error: checkError } = await supabase
        .from('user_branches')
        .select('*')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing link:', checkError);
        return false;
      }

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
        
        console.log('User successfully linked to branch');
      } else {
        console.log('User already linked to this branch');
      }
      
      return true;
    } catch (error) {
      console.error('Error in linkUserToBranch:', error);
      return false;
    }
  };

  const getUserBranches = async (userId: string) => {
    try {
      console.log('Getting branches for user:', userId);
      
      const { data: userBranches, error } = await supabase
        .from('user_branches')
        .select(`
          branch_id,
          branches:branch_id (
            id,
            name,
            address,
            phone
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user branches:', error);
        return [];
      }

      console.log('User branches found:', userBranches);
      return userBranches || [];
    } catch (error) {
      console.error('Error in getUserBranches:', error);
      return [];
    }
  };

  return {
    ensureBranchesExist,
    linkUserToBranch,
    getUserBranches
  };
};
