-- Cleanup spam families owned by bot u_moxyhd0l_huhin7 (admin@gmail.com)
-- 2397 families: 2396 NAME_* + 1 "PEPEK"
-- Manual cascade child tables (D1 may not auto-enforce ON DELETE CASCADE)

DELETE FROM canvas_positions WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM family_collaborators WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM members WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM marriages WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM stories WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM invites WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM biographies WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM events WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM posts WHERE family_id IN (SELECT id FROM families WHERE owner_id='u_moxyhd0l_huhin7');
DELETE FROM families WHERE owner_id='u_moxyhd0l_huhin7';
