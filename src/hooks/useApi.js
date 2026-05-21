import { useState, useCallback } from 'react'

/**
 * Wraps an async API call with loading / error state.
 * Usage:
 *   const { loading, error, run } = useApi()
 *   await run(() => bannersAPI.create(data))
 */
export function useApi() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const run = useCallback(async (fn) => {
        setLoading(true)
        setError(null)
        try {
            const result = await fn()
            return result
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Something went wrong'
            setError(msg)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return { loading, error, run }
}
