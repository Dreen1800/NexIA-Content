-- Add is_main column to instagram_profiles table
ALTER TABLE instagram_profiles 
ADD COLUMN is_main BOOLEAN DEFAULT FALSE;

-- Add unique constraint to ensure only one main profile per user
CREATE UNIQUE INDEX idx_instagram_profiles_main_user 
ON instagram_profiles (user_id) 
WHERE is_main = TRUE;

-- Create a function to ensure only one main profile per user
CREATE OR REPLACE FUNCTION ensure_single_main_instagram_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this profile as main, unset all other main profiles for this user
  IF NEW.is_main = TRUE THEN
    UPDATE instagram_profiles 
    SET is_main = FALSE 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_main = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically enforce single main profile
CREATE TRIGGER trigger_ensure_single_main_instagram_profile
  BEFORE INSERT OR UPDATE ON instagram_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_main_instagram_profile(); 