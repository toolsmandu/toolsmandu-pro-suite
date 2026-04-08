
-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1;

-- Add ticket_number and order_id columns
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ticket_number INTEGER NOT NULL DEFAULT nextval('ticket_number_seq'),
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Add unique constraint on ticket_number
ALTER TABLE public.tickets ADD CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number);
