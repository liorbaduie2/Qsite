//my-app/lib/permissions.ts

export async function getUserPermissions(userId: string) {
  const response = await fetch('/api/permissions/get-user-permissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get user permissions')
  }
  
  const result = await response.json()
  return result.data
}

export async function canUserLogin(userId: string) {
  const response = await fetch('/api/permissions/can-user-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to check user login status')
  }
  
  const result = await response.json()
  return result.data
}

export async function suspendUser(targetUserId: string, hours: number, reason: string) {
  // Get the current user's session token
  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createClientComponentClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch('/api/permissions/suspend-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ 
      targetUserId, 
      hours, 
      reason 
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to suspend user')
  }
  
  const result = await response.json()
  return result.data
}

export async function deductReputation(targetUserId: string, amount: number, reason: string) {
  // Get the current user's session token
  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createClientComponentClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch('/api/permissions/deduct-reputation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ 
      targetUserId, 
      amount, 
      reason 
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to deduct reputation')
  }
  
  const result = await response.json()
  return result.data
}

export async function getUserRoleHebrew(userId: string) {
  const response = await fetch('/api/permissions/get-user-role-hebrew', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get user role')
  }
  
  const result = await response.json()
  return result.data
}