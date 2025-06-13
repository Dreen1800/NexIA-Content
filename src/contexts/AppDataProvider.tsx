import React, { createContext, useContext, ReactNode } from 'react';
import { useApiKeysLoader } from '../hooks/useApiKeysLoader';

interface AppDataContextType {
    isApiKeysLoaded: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProviderProps {
    children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
    const { isInitialLoadComplete } = useApiKeysLoader();

    const value: AppDataContextType = {
        isApiKeysLoaded: isInitialLoadComplete,
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = (): AppDataContextType => {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
}; 