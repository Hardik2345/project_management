/*
  # Seed Initial Data for Tech It! Platform

  1. Sample Data
    - Create sample profiles (users)
    - Create sample clients
    - Create sample projects with team assignments
    - Create sample tasks
    - Create sample time entries
    - Create sample notifications

  2. Notes
    - This data is for development and testing
    - Replace with real data in production
    - User IDs will need to match actual auth.users entries
*/

-- Insert sample clients
INSERT INTO clients (id, name, email, company, hourly_rate, is_active) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'John Smith', 'john@acmecorp.com', 'Acme Corporation', 150.00, true),
  ('c2222222-2222-2222-2222-222222222222', 'Lisa Davis', 'lisa@techstartup.com', 'Tech Startup Inc', 125.00, true),
  ('c3333333-3333-3333-3333-333333333333', 'Robert Kim', 'robert@ecommerce.com', 'E-commerce Solutions', 175.00, true);

-- Note: Profiles will be created automatically when users sign up through Supabase Auth
-- The following is just for reference of the expected structure

-- Sample projects (will be created after users sign up)
-- INSERT INTO projects (id, name, description, client_id, owner_id, priority, status, deadline, monthly_hour_allocation, tags) VALUES
--   ('p1111111-1111-1111-1111-111111111111', 'Website Redesign', 'Complete redesign of the company website with new branding and improved UX', 'c1111111-1111-1111-1111-111111111111', 'user-id-here', 'high', 'in_progress', '2024-12-15', 80, ARRAY['UX', 'Design', 'Development']);

-- Create a function to initialize user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'team_member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();