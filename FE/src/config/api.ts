/** Opt in to the isolated demo explicitly; normal development and production use BE. */
export const isMockApi = import.meta.env.DEV && import.meta.env.VITE_API_MODE === 'mock';
