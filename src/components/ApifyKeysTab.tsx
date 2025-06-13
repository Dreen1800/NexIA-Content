import { useState, useEffect } from 'react';
import { useApifyKeyStore } from '../stores/apifyKeyStore';
import { PlusCircle, Trash2, Check, AlertCircle, Info } from 'lucide-react';

export default function ApifyKeysTab() {
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [formError, setFormError] = useState('');

    const {
        apifyKeys,
        currentKey,
        isLoading,
        error,
        fetchApifyKeys,
        addApifyKey,
        updateApifyKey,
        deleteApifyKey
    } = useApifyKeyStore();

    // As chaves são carregadas automaticamente pelo useApiKeysLoader no App.tsx
    // Só recarrega se não houver chaves carregadas ou se houver erro
    useEffect(() => {
        if (apifyKeys.length === 0 && !isLoading && !error) {
            fetchApifyKeys();
        }
    }, [apifyKeys.length, isLoading, error, fetchApifyKeys]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newKeyName.trim() || !newKeyValue.trim()) {
            setFormError('Por favor, insira um nome e uma chave API');
            return;
        }

        try {
            await addApifyKey(newKeyName, newKeyValue);
            setNewKeyName('');
            setNewKeyValue('');
            setShowAddForm(false);
            setFormError('');
        } catch (err) {
            console.error('Error adding API key:', err);
        }
    };

    const handleSetActive = async (id: string) => {
        try {
            await updateApifyKey(id, { is_active: true });
        } catch (err) {
            console.error('Error setting active key:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta chave API?')) {
            try {
                await deleteApifyKey(id);
            } catch (err) {
                console.error('Error deleting API key:', err);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Chaves da API Apify</h3>

                <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Adicionar Chave
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {isLoading && (
                    <div className="flex justify-center items-center py-4">
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-gray-600">Carregando...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Erro ao carregar chaves da API</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showAddForm && (
                    <div className="p-4 border-b border-gray-200">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="key-name" className="block text-sm font-medium text-gray-700">
                                    Nome da Chave
                                </label>
                                <input
                                    type="text"
                                    id="key-name"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white text-gray-900"
                                    placeholder="ex: Minha Chave Apify"
                                />
                            </div>

                            <div>
                                <label htmlFor="key-value" className="block text-sm font-medium text-gray-700">
                                    Chave da API
                                </label>
                                <input
                                    type="text"
                                    id="key-value"
                                    value={newKeyValue}
                                    onChange={(e) => setNewKeyValue(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white text-gray-900"
                                    placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                />
                            </div>

                            {formError && (
                                <div className="text-sm text-red-600">{formError}</div>
                            )}

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewKeyName('');
                                        setNewKeyValue('');
                                        setFormError('');
                                    }}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Adicionando...' : 'Adicionar Chave'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {apifyKeys.length === 0 && !isLoading ? (
                    <div className="p-6 text-center text-gray-500">
                        <Info className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p>Nenhuma chave da API Apify foi adicionada ainda. Adicione uma chave para começar a usar as análises do Instagram.</p>
                        <p className="text-sm mt-2">
                            Você pode obter seu token da API Apify no <a href="https://console.apify.com/account/integrations" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-medium">Console Apify</a>
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {apifyKeys.map((key) => (
                            <li key={key.id} className="px-4 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800">{key.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {key.api_key.slice(0, 10)}...{key.api_key.slice(-4)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {key.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Check className="mr-1 h-3 w-3" />
                                                Ativa
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSetActive(key.id)}
                                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                            >
                                                Definir como ativa
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(key.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Sobre as Chaves da API Apify</h4>
                <p className="mt-1 text-sm text-gray-600">
                    As chaves da API Apify são usadas para acessar as funcionalidades de scraping do Instagram. A chave é armazenada com segurança e usada apenas para sua conta.
                </p>
                <div className="mt-2 text-sm">
                    <a href="https://apify.com/apify/instagram-scraper" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-500 font-medium">
                        Saiba mais sobre o Apify Instagram Scraper
                    </a>
                </div>
            </div>
        </div>
    );
} 