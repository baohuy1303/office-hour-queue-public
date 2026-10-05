// Alerts for the moment a TA calls a student: a notification, a chime, a buzz, and a
// flashing tab title. Browsers only allow notifications and sound after the person agrees
// or clicks, so prepareAlerts() must run during a click (we call it on "Join the queue").

let audio: AudioContext | null = null

export function prepareAlerts() {
  // Sound: an AudioContext started during a click is allowed to play later.
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // No Web Audio support: skip the chime.
  }

  // Notifications: ask once. The service worker is what lets Android show them.
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission()
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Without a service worker, desktop browsers can still show notifications directly.
    })
  }
}

export function alertCalled(courseCode: string) {
  void showNotification(courseCode)
  playChime()
  navigator.vibrate?.([200, 100, 200])
  flashTitle()
}

async function showNotification(courseCode: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  // Name the course, since a student can be in more than one queue at once.
  const title = `You're up in ${courseCode}`
  const options = { body: 'A TA is ready for you. Head over now.', tag: 'ohq-called' }
  // Android only shows notifications through a service worker. Desktop browsers allow either way.
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  if (registration) await registration.showNotification(title, options)
  else new Notification(title, options)
}

// Two short notes, like a doorbell.
function playChime() {
  if (!audio) return
  const context = audio
  const notes = [880, 660]
  notes.forEach((frequency, index) => {
    const start = context.currentTime + index * 0.25
    const oscillator = context.createOscillator()
    const volume = context.createGain()
    oscillator.frequency.value = frequency
    volume.gain.setValueAtTime(0.0001, start)
    volume.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.4)
    oscillator.connect(volume).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.45)
  })
}

// If the tab is in the background, flash its title until the student comes back to it.
function flashTitle() {
  if (!document.hidden) return
  const original = document.title
  let showAlert = true
  const timer = window.setInterval(() => {
    document.title = showAlert ? `Your turn · ${original}` : original
    showAlert = !showAlert
  }, 1000)

  document.addEventListener('visibilitychange', function stop() {
    if (document.hidden) return
    window.clearInterval(timer)
    document.title = original
    document.removeEventListener('visibilitychange', stop)
  })
}
