-- Seed: Default Public Context Sets
-- Description: Sample context sets for common domains (Technology, Medical, Business)

-- Note: user_id is NULL for public contexts (accessible to all users)

-- ============================================================================
-- TECHNOLOGY & IT CONTEXT SET
-- ============================================================================

INSERT INTO context_sets (id, user_id, name, description, text, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'Technology & IT',
  'Common technology and IT terms for software development, cloud computing, and DevOps',
  'This context includes terminology for software development, cloud platforms, DevOps practices, programming languages, and modern IT infrastructure. Useful for technical meetings, developer discussions, and IT consultations.',
  true
);

-- Technology terms
INSERT INTO context_set_terms (context_set_id, term, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'AWS', 0),
('00000000-0000-0000-0000-000000000001', 'Azure', 1),
('00000000-0000-0000-0000-000000000001', 'GCP', 2),
('00000000-0000-0000-0000-000000000001', 'Docker', 3),
('00000000-0000-0000-0000-000000000001', 'Kubernetes', 4),
('00000000-0000-0000-0000-000000000001', 'microservices', 5),
('00000000-0000-0000-0000-000000000001', 'API', 6),
('00000000-0000-0000-0000-000000000001', 'REST', 7),
('00000000-0000-0000-0000-000000000001', 'GraphQL', 8),
('00000000-0000-0000-0000-000000000001', 'CI/CD', 9),
('00000000-0000-0000-0000-000000000001', 'DevOps', 10),
('00000000-0000-0000-0000-000000000001', 'React', 11),
('00000000-0000-0000-0000-000000000001', 'Next.js', 12),
('00000000-0000-0000-0000-000000000001', 'Node.js', 13),
('00000000-0000-0000-0000-000000000001', 'TypeScript', 14),
('00000000-0000-0000-0000-000000000001', 'JavaScript', 15),
('00000000-0000-0000-0000-000000000001', 'PostgreSQL', 16),
('00000000-0000-0000-0000-000000000001', 'MongoDB', 17),
('00000000-0000-0000-0000-000000000001', 'Redis', 18),
('00000000-0000-0000-0000-000000000001', 'Supabase', 19),
('00000000-0000-0000-0000-000000000001', 'Git', 20),
('00000000-0000-0000-0000-000000000001', 'GitHub', 21),
('00000000-0000-0000-0000-000000000001', 'GitLab', 22),
('00000000-0000-0000-0000-000000000001', 'Jira', 23),
('00000000-0000-0000-0000-000000000001', 'Agile', 24),
('00000000-0000-0000-0000-000000000001', 'Scrum', 25),
('00000000-0000-0000-0000-000000000001', 'Sprint', 26);

-- Technology general metadata
INSERT INTO context_set_general (context_set_id, key, value) VALUES
('00000000-0000-0000-0000-000000000001', 'domain', 'Technology'),
('00000000-0000-0000-0000-000000000001', 'topic', 'Software Development and IT Infrastructure'),
('00000000-0000-0000-0000-000000000001', 'industry', 'Information Technology');

-- ============================================================================
-- BUSINESS & CORPORATE CONTEXT SET
-- ============================================================================

INSERT INTO context_sets (id, user_id, name, description, text, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'Business & Corporate',
  'Business terminology for meetings, presentations, and corporate communications',
  'This context covers general business and corporate terminology including finance, strategy, management, and organizational topics. Ideal for business meetings, presentations, and executive discussions.',
  true
);

-- Business terms
INSERT INTO context_set_terms (context_set_id, term, sort_order) VALUES
('00000000-0000-0000-0000-000000000002', 'CEO', 0),
('00000000-0000-0000-0000-000000000002', 'CFO', 1),
('00000000-0000-0000-0000-000000000002', 'CTO', 2),
('00000000-0000-0000-0000-000000000002', 'stakeholder', 3),
('00000000-0000-0000-0000-000000000002', 'shareholder', 4),
('00000000-0000-0000-0000-000000000002', 'ROI', 5),
('00000000-0000-0000-0000-000000000002', 'KPI', 6),
('00000000-0000-0000-0000-000000000002', 'revenue', 7),
('00000000-0000-0000-0000-000000000002', 'profit margin', 8),
('00000000-0000-0000-0000-000000000002', 'quarterly report', 9),
('00000000-0000-0000-0000-000000000002', 'fiscal year', 10),
('00000000-0000-0000-0000-000000000002', 'budget', 11),
('00000000-0000-0000-0000-000000000002', 'forecast', 12),
('00000000-0000-0000-0000-000000000002', 'strategic planning', 13),
('00000000-0000-0000-0000-000000000002', 'market share', 14),
('00000000-0000-0000-0000-000000000002', 'competitive advantage', 15),
('00000000-0000-0000-0000-000000000002', 'value proposition', 16),
('00000000-0000-0000-0000-000000000002', 'due diligence', 17),
('00000000-0000-0000-0000-000000000002', 'merger and acquisition', 18),
('00000000-0000-0000-0000-000000000002', 'IPO', 19);

-- Business general metadata
INSERT INTO context_set_general (context_set_id, key, value) VALUES
('00000000-0000-0000-0000-000000000002', 'domain', 'Business'),
('00000000-0000-0000-0000-000000000002', 'topic', 'Corporate Management and Strategy'),
('00000000-0000-0000-0000-000000000002', 'industry', 'General Business');

-- ============================================================================
-- MEDICAL & HEALTHCARE CONTEXT SET
-- ============================================================================

INSERT INTO context_sets (id, user_id, name, description, text, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'Medical & Healthcare',
  'Medical terminology for healthcare consultations and clinical discussions',
  'This context includes common medical terms, medications, conditions, and healthcare practices. Suitable for doctor-patient consultations, medical conferences, and healthcare discussions.',
  true
);

-- Medical terms
INSERT INTO context_set_terms (context_set_id, term, sort_order) VALUES
('00000000-0000-0000-0000-000000000003', 'hypertension', 0),
('00000000-0000-0000-0000-000000000003', 'diabetes', 1),
('00000000-0000-0000-0000-000000000003', 'prescription', 2),
('00000000-0000-0000-0000-000000000003', 'diagnosis', 3),
('00000000-0000-0000-0000-000000000003', 'prognosis', 4),
('00000000-0000-0000-0000-000000000003', 'symptom', 5),
('00000000-0000-0000-0000-000000000003', 'medication', 6),
('00000000-0000-0000-0000-000000000003', 'treatment', 7),
('00000000-0000-0000-0000-000000000003', 'therapy', 8),
('00000000-0000-0000-0000-000000000003', 'cardiology', 9),
('00000000-0000-0000-0000-000000000003', 'neurology', 10),
('00000000-0000-0000-0000-000000000003', 'oncology', 11),
('00000000-0000-0000-0000-000000000003', 'MRI', 12),
('00000000-0000-0000-0000-000000000003', 'CT scan', 13),
('00000000-0000-0000-0000-000000000003', 'X-ray', 14),
('00000000-0000-0000-0000-000000000003', 'ultrasound', 15),
('00000000-0000-0000-0000-000000000003', 'blood pressure', 16),
('00000000-0000-0000-0000-000000000003', 'cholesterol', 17),
('00000000-0000-0000-0000-000000000003', 'glucose', 18),
('00000000-0000-0000-0000-000000000003', 'antibiotic', 19);

-- Medical general metadata
INSERT INTO context_set_general (context_set_id, key, value) VALUES
('00000000-0000-0000-0000-000000000003', 'domain', 'Healthcare'),
('00000000-0000-0000-0000-000000000003', 'topic', 'Medical Consultation and Treatment'),
('00000000-0000-0000-0000-000000000003', 'industry', 'Healthcare');

-- Medical translation terms (example: preserve medical abbreviations)
INSERT INTO context_set_translation_terms (context_set_id, source, target, sort_order) VALUES
('00000000-0000-0000-0000-000000000003', 'MRI', 'MRI', 0),
('00000000-0000-0000-0000-000000000003', 'CT scan', 'CT scan', 1),
('00000000-0000-0000-0000-000000000003', 'ICU', 'ICU', 2),
('00000000-0000-0000-0000-000000000003', 'ER', 'ER', 3);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- You can verify seed data with:
-- SELECT cs.name, COUNT(DISTINCT t.id) as term_count, COUNT(DISTINCT g.id) as general_count
-- FROM context_sets cs
-- LEFT JOIN context_set_terms t ON cs.id = t.context_set_id
-- LEFT JOIN context_set_general g ON cs.id = g.context_set_id
-- WHERE cs.is_public = true
-- GROUP BY cs.id, cs.name;
