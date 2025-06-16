-- Create print_requests table
CREATE TABLE IF NOT EXISTS public.print_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id TEXT NOT NULL,
  note_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  printed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'printed', 'error')),
  device_id TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.print_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to create print requests
CREATE POLICY "Allow users to create print requests" ON public.print_requests
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy to allow users to view only their own print requests
CREATE POLICY "Allow users to read their print requests" ON public.print_requests
  FOR SELECT 
  TO authenticated 
  USING (created_by = auth.uid());

-- Policy to allow users to update only their own print requests
CREATE POLICY "Allow users to update their print requests" ON public.print_requests
  FOR UPDATE 
  TO authenticated 
  USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_print_requests_status ON public.print_requests(status);
CREATE INDEX IF NOT EXISTS idx_print_requests_created_by ON public.print_requests(created_by);

-- Enable realtime subscriptions for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_requests; 