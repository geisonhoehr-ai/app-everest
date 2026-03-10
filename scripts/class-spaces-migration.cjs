const https = require('https');

const sql = `
-- 1. Add class_id to community_spaces
ALTER TABLE community_spaces
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_community_spaces_class_id ON community_spaces(class_id);

-- 2. Drop old SELECT policy and create new one that filters by class enrollment
DROP POLICY IF EXISTS "spaces_select" ON community_spaces;

CREATE POLICY "spaces_select" ON community_spaces FOR SELECT TO authenticated
USING (
  (space_type IN ('general', 'event') OR class_id IS NULL)
  OR
  (space_type = 'course' AND class_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM student_classes WHERE user_id = auth.uid() AND class_id = community_spaces.class_id)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher'))
  ))
);

-- 3. Also filter posts in course spaces
DROP POLICY IF EXISTS "posts_select" ON community_posts;

CREATE POLICY "posts_select" ON community_posts FOR SELECT TO authenticated
USING (
  (space_id IS NULL)
  OR
  EXISTS (
    SELECT 1 FROM community_spaces cs
    WHERE cs.id = community_posts.space_id
    AND (
      cs.space_type IN ('general', 'event') OR cs.class_id IS NULL
      OR (cs.space_type = 'course' AND cs.class_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM student_classes WHERE user_id = auth.uid() AND class_id = cs.class_id)
        OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher'))
      ))
    )
  )
);

-- 4. Create community spaces for existing classes (skip Degustacao)
INSERT INTO community_spaces (name, slug, description, icon, color, "order", space_type, class_id)
SELECT
  c.name,
  lower(replace(replace(replace(c.name, ' ', '-'), 'ã', 'a'), 'ç', 'c')),
  'Espaco exclusivo da turma ' || c.name,
  'GraduationCap',
  CASE
    WHEN c.name ILIKE '%eaof%' THEN 'emerald'
    WHEN c.name ILIKE '%cadar%' THEN 'orange'
    WHEN c.name ILIKE '%cafar%' THEN 'rose'
    ELSE 'indigo'
  END,
  10 + ROW_NUMBER() OVER (ORDER BY c.name),
  'course',
  c.id
FROM classes c
WHERE c.name NOT ILIKE '%degusta%'
AND NOT EXISTS (
  SELECT 1 FROM community_spaces cs WHERE cs.class_id = c.id
);
`;

const body = JSON.stringify({ query: sql });
const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/hnhzindsfuqnaxosujay/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_c47d0d25e969b5164bc92685507b69858bb8adb9',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Status:', res.statusCode, data.substring(0, 500)));
});
req.on('error', e => console.error(e));
req.write(body);
req.end();
