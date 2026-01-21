'use client'
import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from './config'

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
