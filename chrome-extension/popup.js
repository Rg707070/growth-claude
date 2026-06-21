const statusEl = document.getElementById('status')
const loginEl = document.getElementById('login')
const loggedinEl = document.getElementById('loggedin')
const whoEl = document.getElementById('who')

async function render() {
  const { growthSession } = await chrome.storage.local.get('growthSession')
  if (growthSession && growthSession.user) {
    loginEl.style.display = 'none'
    loggedinEl.style.display = 'block'
    whoEl.textContent = growthSession.user.email || 'Signed in'
  } else {
    loginEl.style.display = 'block'
    loggedinEl.style.display = 'none'
  }
}

document.getElementById('signin').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  if (!email || !password) return
  statusEl.textContent = 'Signing in…'
  statusEl.className = 'status'
  try {
    const session = await window.GrowthSupabase.signIn(email, password)
    await chrome.storage.local.set({ growthSession: session })
    statusEl.textContent = 'Signed in. Open Google Calendar.'
    statusEl.className = 'status ok'
    render()
  } catch {
    statusEl.textContent = 'Sign in failed. Check email/password.'
    statusEl.className = 'status err'
  }
})

document.getElementById('signout').addEventListener('click', async () => {
  await chrome.storage.local.remove('growthSession')
  statusEl.textContent = 'Signed out.'
  statusEl.className = 'status'
  render()
})

render()
