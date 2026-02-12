import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    nome: string
    email?: string | null
    telefone_whatsapp: string
    avatar?: string | null
    timezone?: string
    dailySummaryTime?: string
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    isPremium?: boolean // Freemium Status
}

interface AppState {
    user: User | null
    setUser: (user: User | null) => void
    logout: () => void
    isAuthenticated: boolean
    theme: 'dark' | 'light'
    toggleTheme: () => void
    _hasHydrated: boolean
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            theme: 'dark',
            _hasHydrated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            logout: () => set({ user: null, isAuthenticated: false }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
        }),
        {
            name: 'taskflow-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                theme: state.theme,
            }),
        }
    )
)

// Subscribe ahead of time for future hydrations
useStore.persist.onFinishHydration(() => {
    useStore.setState({ _hasHydrated: true })
})

// If hydration already ran synchronously before the subscription above, catch it now
if (useStore.persist.hasHydrated()) {
    useStore.setState({ _hasHydrated: true })
}
