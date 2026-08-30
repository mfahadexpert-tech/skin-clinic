/**
 * ==============================================================================
 * SkinLab AI - Supabase Frontend Client Configuration
 * ==============================================================================
 * Configures the Supabase JavaScript client for real-time channel subscriptions.
 * Supports environment variables or local fallback.
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = (SUPABASE_URL && SUPABASE_URL !== 'https://placeholder-project.supabase.co')
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => supabase !== null;
