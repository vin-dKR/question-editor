import { useState, useEffect, useCallback } from 'react';

const useUnsavedChanges = (initialData = null) => {
    const [data, setData] = useState(initialData);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [originalData, setOriginalData] = useState(initialData);

    // Update data and track changes
    const updateData = useCallback((newData) => {
        setData(newData);
        setHasUnsavedChanges(true);
    }, []);

    // Save changes
    const saveChanges = useCallback((savedData) => {
        setData(savedData);
        setOriginalData(savedData);
        setHasUnsavedChanges(false);
    }, []);

    // Reset to original data
    const resetChanges = useCallback(() => {
        setData(originalData);
        setHasUnsavedChanges(false);
    }, [originalData]);

    // Warn before leaving if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    return {
        data,
        hasUnsavedChanges,
        updateData,
        saveChanges,
        resetChanges,
        setOriginalData
    };
};

export default useUnsavedChanges; 
