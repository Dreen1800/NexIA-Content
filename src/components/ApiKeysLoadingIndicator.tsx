import { useEffect, useState } from 'react';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeysLoadingIndicatorProps {
    isComplete: boolean;
}

const ApiKeysLoadingIndicator = ({ isComplete }: ApiKeysLoadingIndicatorProps) => {
    const [show, setShow] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (!isComplete) {
            // Mostra o indicador após 500ms para evitar flashes desnecessários
            const timer = setTimeout(() => {
                setShow(true);
            }, 500);

            return () => clearTimeout(timer);
        } else if (show) {
            // Quando completar, mostra o sucesso por 2 segundos e depois esconde
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShow(false);
                setShowSuccess(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isComplete, show]);

    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg shadow-md text-sm font-medium
                transition-all duration-300 ease-in-out
                ${showSuccess
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }
            `}>
                {showSuccess ? (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Chaves de API carregadas!</span>
                    </>
                ) : (
                    <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Carregando chaves de API...</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default ApiKeysLoadingIndicator; 