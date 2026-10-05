import { useToast } from './components/toast'

// Copies text to the clipboard and confirms with a toast: copy(joinCode, 'join code').
export function useCopy() {
  const toast = useToast()
  return (text: string, what: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast(`Copied the ${what}`),
      () => toast(`Couldn't copy · select the ${what} and copy it yourself`),
    )
}
