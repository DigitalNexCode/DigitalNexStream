/*
          # Create New User Trigger
          This migration automates the creation of a user profile in the `public.profiles` table whenever a new user is added to the `auth.users` table. It ensures that every authenticated user has a corresponding profile record.

          ## Query Description:
          This operation is safe and foundational for user management. It creates a new function `handle_new_user` and a trigger `on_auth_user_created`. The trigger fires after a new user is inserted into `auth.users`, calling the function to populate the `profiles` table with the user's ID, email, and display name (from the sign-up metadata). This automates profile creation and keeps user data consistent. There is no risk to existing data.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the trigger and function)

          ## Structure Details:
          - Creates function: `public.handle_new_user()`
          - Creates trigger: `on_auth_user_created` on `auth.users` table.

          ## Security Implications:
          - RLS Status: Not directly modified, but this trigger is essential for RLS policies on `profiles` that rely on `auth.uid()`.
          - Policy Changes: No
          - Auth Requirements: The trigger runs with the permissions of the user who defined it (SECURITY DEFINER), ensuring it can write to the `public.profiles` table.

          ## Performance Impact:
          - Indexes: None
          - Triggers: Adds one trigger to `auth.users`.
          - Estimated Impact: Negligible. The performance impact is minimal, as the trigger only fires on new user creation, which is an infrequent event.
          */
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists, to prevent errors on re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
