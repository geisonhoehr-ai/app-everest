import { supabase } from '@/lib/supabase/client'

export const sendPasswordResetEmail = async (email: string) => {
  const redirectUrl = `${window.location.origin}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })
  return { error }
}

export const updateUserPassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  return { error }
}
