import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useEffect, useEffectEvent, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

// Keeps a live SignalR connection to the API and calls onChange whenever something changes.
// Pass a course's slug to hear about that course only, or null to hear about every course
// (the directory). It also calls onChange after (re)connecting, to catch up on anything
// missed while offline. Returns false while the connection is down.
export function useQueueEvents(courseSlug: string | null, onChange: () => void) {
  const [connected, setConnected] = useState(true)
  // Lets the connection call the latest onChange without reconnecting when it changes.
  const notifyChange = useEffectEvent(onChange)

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/queue`)
      // After a dropped connection, retry right away, then every 5 seconds, forever.
      .withAutomaticReconnect({ nextRetryDelayInMilliseconds: (retry) => (retry.previousRetryCount === 0 ? 0 : 5000) })
      .configureLogging(LogLevel.Warning)
      .build()

    // Tell the server what this page wants to hear about. A new connection starts with no
    // groups, so this runs after every connect and reconnect.
    function watch() {
      return courseSlug === null ? connection.invoke('WatchDirectory') : connection.invoke('WatchCourse', courseSlug)
    }

    connection.on('QueueChanged', () => notifyChange())
    connection.onreconnecting(() => setConnected(false))
    connection.onreconnected(() => {
      watch()
        .then(() => {
          setConnected(true)
          notifyChange()
        })
        .catch(() => {
          // Couldn't rejoin the group. The next dropped connection will try again.
        })
    })

    // The very first connection doesn't retry by itself, so keep trying every 5 seconds.
    let stopped = false
    let retryTimer: number | undefined
    function start() {
      connection
        .start()
        .then(watch)
        .then(() => {
          setConnected(true)
          notifyChange()
        })
        .catch(() => {
          if (stopped) return
          setConnected(false)
          // stop() first, in case we connected but couldn't join the group.
          connection.stop().finally(() => {
            if (!stopped) retryTimer = window.setTimeout(start, 5000)
          })
        })
    }
    start()

    return () => {
      stopped = true
      window.clearTimeout(retryTimer)
      connection.stop()
    }
  }, [courseSlug])

  return connected
}
