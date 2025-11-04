-- Create super admin user: Paresh Bagi (paresh@sjinnovation.com)
-- This uses Supabase's proper auth structure

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'paresh@sjinnovation.com';
  
  IF new_user_id IS NULL THEN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users with proper structure
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      role,
      aud
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'paresh@sjinnovation.com',
      crypt('User@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Paresh","last_name":"Bagi"}'::jsonb,
      now(),
      now(),
      '',
      'authenticated',
      'authenticated'
    );
    
    -- Insert identity with provider_id
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at,
      email
    ) VALUES (
      new_user_id::text,
      new_user_id,
      jsonb_build_object(
        'sub', new_user_id::text,
        'email', 'paresh@sjinnovation.com',
        'email_verified', true,
        'provider', 'email'
      ),
      'email',
      now(),
      now(),
      now(),
      'paresh@sjinnovation.com'
    );
  END IF;
  
  -- Create or update profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new_user_id,
    'paresh@sjinnovation.com',
    'Paresh Bagi'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  
  -- Remove existing role if any
  DELETE FROM public.user_roles WHERE user_id = new_user_id;
  
  -- Assign super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'super_admin'::app_role);
  
  RAISE NOTICE 'Successfully created super admin user: Paresh Bagi (%) with ID: %', 'paresh@sjinnovation.com', new_user_id;
END $$;