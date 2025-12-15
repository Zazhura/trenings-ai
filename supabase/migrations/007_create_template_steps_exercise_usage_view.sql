-- Create a function to count exercise usage in templates
-- This helps show "In use" count for exercises
-- Note: For MVP, we'll compute this in application code for simplicity
-- This function can be used if needed for more complex queries
CREATE OR REPLACE FUNCTION get_exercise_usage(exercise_id_param UUID)
RETURNS TABLE(template_count BIGINT, step_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT t.id)::BIGINT as template_count,
    (
      SELECT COUNT(*)::BIGINT
      FROM templates t2,
      LATERAL jsonb_array_elements(t2.blocks) AS block,
      LATERAL jsonb_array_elements(block->'steps') AS step
      WHERE (step->>'exercise_id')::UUID = exercise_id_param
    ) as step_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

