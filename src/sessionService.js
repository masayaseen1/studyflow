
import { supabase } from './supabase'

export async function getSessions() {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addSession(session) {
  const { data: userData, error: authError } =
    await supabase.auth.getUser()

  if (authError) throw authError
  if (!userData.user) throw new Error('Please sign in first.')

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userData.user.id,
      subject: session.subject,
      session_date: session.date,
      duration: Number(session.duration),
      status: session.status
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSession(id, session) {
  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      subject: session.subject,
      session_date: session.date,
      duration: Number(session.duration),
      status: session.status
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSession(id) {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function changeSessionStatus(id, status) {
  const { data, error } = await supabase
    .from('study_sessions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
