
-- Add foreign key constraints for user_branches table
ALTER TABLE user_branches 
ADD CONSTRAINT fk_user_branches_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_branches 
ADD CONSTRAINT fk_user_branches_branch_id 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- Add foreign key constraints for other tables that need them
ALTER TABLE production_requests 
ADD CONSTRAINT fk_production_requests_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE production_requests 
ADD CONSTRAINT fk_production_requests_branch_id 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

ALTER TABLE production_requests 
ADD CONSTRAINT fk_production_requests_requested_by 
FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE production_requests 
ADD CONSTRAINT fk_production_requests_produced_by 
FOREIGN KEY (produced_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE production_batches 
ADD CONSTRAINT fk_production_batches_production_request_id 
FOREIGN KEY (production_request_id) REFERENCES production_requests(id) ON DELETE CASCADE;

ALTER TABLE production_batches 
ADD CONSTRAINT fk_production_batches_produced_by 
FOREIGN KEY (produced_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_branch_id 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_cashier_id 
FOREIGN KEY (cashier_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE transaction_items 
ADD CONSTRAINT fk_transaction_items_transaction_id 
FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;

ALTER TABLE transaction_items 
ADD CONSTRAINT fk_transaction_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_branch_id 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
