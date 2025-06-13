import React, { useState, useEffect } from 'react';
import { Instagram, Plus, Trash2, AlertCircle, Search, User, ArrowRight, X, Loader, Star, Heart, MessageCircle, Eye, Video, Calendar, ExternalLink, Image, TrendingUp, Clock, Share2 } from 'lucide-react';
import { useInstagramStore } from '../stores/instagramStore';
import { useSupabaseAdmin } from '../hooks/useSupabaseAdmin';
import InstagramProfile from '../components/InstagramProfile';
import InstagramPosts, { Post } from '../components/InstagramPosts';
import InstagramProfileModal from '../components/InstagramProfileModal';
import { getProxiedImageUrl } from '../services/instagramService';

// Define interface for store profile to component props mapping
interface ProfileProps {
    id: string;
    instagram_id: string;
    username: string;
    full_name: string;
    biography: string;
    followers_count: number;
    follows_count: number;
    posts_count: number;
    profile_pic_url: string;
    is_business_account: boolean;
    business_category_name?: string;
    created_at: string;
    is_main: boolean;
}

interface PostProps {
    id: string;
    instagram_id: string;
    short_code: string;
    type: string;
    url: string;
    caption: string;
    timestamp: string;
    likes_count: number;
    comments_count: number;
    video_view_count?: number;
    display_url: string;
    is_video: boolean;
}

export default function InstagramAnalytics() {
    const { isSuperAdmin } = useSupabaseAdmin();
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAppearing, setIsAppearing] = useState(false);
    const [isSettingMain, setIsSettingMain] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const {
        profiles,
        currentProfile,
        posts,
        allPostsForEngagement,
        fetchProfiles,
        setCurrentProfile,
        fetchPosts,
        resetPosts,
        loadMorePosts,
        hasMorePosts,
        checkActiveScrapingJobs,
        deleteProfile,
        setMainProfile,
        isLoading,
        error,
        fetchUserJobs
    } = useInstagramStore();

    useEffect(() => {
        fetchProfiles();
        fetchUserJobs();
        // Check for active jobs on load
        checkActiveScrapingJobs();

        // Animation effect on mount
        setTimeout(() => {
            setIsAppearing(true);
        }, 100);
    }, [fetchProfiles, fetchUserJobs, checkActiveScrapingJobs]);

    const handleProfileSelect = async (profile: any) => {
        await setCurrentProfile(profile); // Busca todos os posts para engajamento
        resetPosts(); // Limpa os posts anteriores
        fetchPosts(profile.id); // Carrega a primeira página para exibição
    };

    const handleImgError = (id: string) => {
        setImgErrors(prev => ({
            ...prev,
            [id]: true
        }));
    };

    // Add the handleOpenProfileModal function
    const handleOpenProfileModal = () => {
        setIsProfileModalOpen(true);
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    // Delete profile functions
    const handleDeleteClick = (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation(); // Prevent profile selection when clicking delete
        setProfileToDelete(profileId);
    };

    const handleCancelDelete = () => {
        setProfileToDelete(null);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (!profileToDelete) return;

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await deleteProfile(profileToDelete);
            setProfileToDelete(null);
        } catch (err: any) {
            setDeleteError(err.message || 'Erro ao excluir perfil');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSetMainProfile = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation(); // Prevent profile selection when clicking star
        setIsSettingMain(profileId);
        try {
            await setMainProfile(profileId);
        } catch (error) {
            console.error('Erro ao definir perfil principal:', error);
        } finally {
            setIsSettingMain(null);
        }
    };

    // Modal handlers
    const handlePostClick = (post: Post) => {
        setSelectedPost(post);
    };

    const closeModal = () => {
        setSelectedPost(null);
    };

    // Helper functions para o modal
    const getPostImage = (url: string) => {
        return getProxiedImageUrl(url);
    };

    const calculatePostEngagement = (post: Post) => {
        if (post.is_video && post.video_view_count) {
            return ((post.likes_count + post.comments_count) / post.video_view_count) * 100;
        }
        return post.likes_count + post.comments_count;
    };

    const getPerformanceRating = (post: Post) => {
        const engagement = calculatePostEngagement(post);

        if (post.is_video && post.video_view_count) {
            if (engagement > 15) return { label: 'Excelente', color: 'bg-[#9e46d3]' };
            if (engagement > 10) return { label: 'Bom', color: 'bg-blue-500' };
            if (engagement > 5) return { label: 'Médio', color: 'bg-yellow-500' };
            return { label: 'Baixo', color: 'bg-gray-400' };
        } else {
            if (engagement > 1000) return { label: 'Viral', color: 'bg-[#9e46d3]' };
            if (engagement > 500) return { label: 'Excelente', color: 'bg-green-500' };
            if (engagement > 200) return { label: 'Bom', color: 'bg-blue-500' };
            if (engagement > 100) return { label: 'Médio', color: 'bg-yellow-500' };
            return { label: 'Baixo', color: 'bg-gray-400' };
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hoje';
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} atrás`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'mês' : 'meses'} atrás`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} ${years === 1 ? 'ano' : 'anos'} atrás`;
        }
    };

    // Map store data to component props
    const mapProfileToProps = (profile: any): ProfileProps => {
        return {
            id: profile.id,
            instagram_id: profile.instagram_id,
            username: profile.username,
            full_name: profile.fullName || '',
            biography: profile.biography || '',
            followers_count: profile.followersCount || 0,
            follows_count: profile.followsCount || 0,
            posts_count: profile.postsCount || 0,
            profile_pic_url: profile.profilePicUrl || '',
            is_business_account: profile.isBusinessAccount || false,
            business_category_name: profile.businessCategoryName,
            created_at: profile.createdAt || new Date().toISOString(),
            is_main: profile.isMain || false
        };
    };

    const mapPostsToProps = (posts: any[]): PostProps[] => {
        return posts.map(post => ({
            id: post.id,
            instagram_id: post.instagram_id,
            short_code: post.shortCode || '',
            type: post.type || 'Image',
            url: post.url || '',
            caption: post.caption || '',
            timestamp: post.timestamp || new Date().toISOString(),
            likes_count: post.likesCount || 0,
            comments_count: post.commentsCount || 0,
            video_view_count: post.videoViewCount,
            display_url: post.displayUrl || '',
            is_video: post.isVideo || false
        }));
    };

    // Função específica para mapear posts para o InstagramProfile (usa interface diferente)
    const mapPostsForEngagement = (posts: any[]) => {
        return posts.map(post => ({
            id: post.id,
            profile_id: post.profile_id,
            instagram_id: post.instagram_id,
            shortCode: post.shortCode || '',
            type: post.type || 'Image',
            url: post.url || '',
            caption: post.caption || '',
            timestamp: post.timestamp || new Date().toISOString(),
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            videoViewCount: post.videoViewCount,
            displayUrl: post.displayUrl || '',
            isVideo: post.isVideo || false,
            hashtags: post.hashtags,
            mentions: post.mentions,
            productType: post.productType,
            isCommentsDisabled: post.isCommentsDisabled
        }));
    };

    // Filter profiles based on search term
    const filteredProfiles = profiles.filter(profile =>
        profile.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`container mx-auto p-4 md:p-6 transition-all duration-500 ease-out ${isAppearing ? 'opacity-100' : 'opacity-0'}`}>
            {profiles.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 transform transition-all duration-500 hover:shadow-lg">
                    <div className="text-center py-10 text-gray-500">
                        <div className="bg-[#9e46d3]/10 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
                            <Instagram className="h-10 w-10 text-[#9e46d3]" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-800 mb-2">Nenhum perfil analisado</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            {isSuperAdmin
                                ? "Clique no botão abaixo para adicionar um perfil do Instagram para análise e acompanhamento."
                                : "Aguarde enquanto os administradores configuram os perfis do Instagram para análise."
                            }
                        </p>
                        {isSuperAdmin && (
                            <button
                                onClick={handleOpenProfileModal}
                                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl shadow-sm text-white bg-[#9e46d3] hover:bg-[#8a3dbd] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9e46d3]"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Adicionar Perfil do Instagram
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-lg">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center">
                                        <div className="bg-[#9e46d3]/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                                            <User className="h-4 w-4 text-[#9e46d3]" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-800">Perfis Salvos</h2>
                                    </div>
                                    {isSuperAdmin && (
                                        <button
                                            onClick={handleOpenProfileModal}
                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-[#9e46d3] hover:bg-[#8a3dbd] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9e46d3]"
                                            title="Adicionar novo perfil do Instagram"
                                        >
                                            <Plus className="h-4 w-4 mr-1.5" />
                                            Adicionar
                                        </button>
                                    )}
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-[#9e46d3] focus:border-[#9e46d3] text-sm"
                                        placeholder="Buscar perfis..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="mx-6 mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-lg flex items-start">
                                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-500" />
                                    <div>
                                        <div className="font-medium">Erro:</div>
                                        <div>{error}</div>
                                        <div className="mt-2 text-xs text-red-500">
                                            Se o problema persistir, verifique o console do navegador para obter mais detalhes
                                            ou entre em contato com o suporte.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#9e46d3]"></div>
                                </div>
                            ) : (
                                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    {filteredProfiles.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500">
                                            <p>Nenhum perfil encontrado</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {filteredProfiles.map((profile) => (
                                                <div
                                                    key={profile.id}
                                                    className={`flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${currentProfile?.id === profile.id ? 'bg-[#9e46d3]/5 hover:bg-[#9e46d3]/10' : ''
                                                        }`}
                                                    onClick={() => handleProfileSelect(profile)}
                                                >
                                                    {currentProfile?.id === profile.id && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#9e46d3]"></div>
                                                    )}

                                                    <div className="relative mr-3">
                                                        {profile.profilePicUrl && !imgErrors[profile.id] ? (
                                                            <div className={`${currentProfile?.id === profile.id ? 'ring-2 ring-[#9e46d3]' : 'ring-1 ring-gray-200'} rounded-full`}>
                                                                <img
                                                                    src={profile.profilePicUrl}
                                                                    alt={profile.username}
                                                                    className="w-12 h-12 rounded-full object-cover"
                                                                    onError={() => handleImgError(profile.id)}
                                                                    referrerPolicy="no-referrer"
                                                                    crossOrigin="anonymous"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ${currentProfile?.id === profile.id ? 'ring-2 ring-[#9e46d3]' : 'ring-1 ring-gray-200'
                                                                }`}>
                                                                <Instagram className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">@{profile.username}</div>
                                                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                            <span className="inline-block bg-[#9e46d3]/10 text-[#9e46d3] text-xs px-2 py-0.5 rounded-full">
                                                                {profile.followersCount.toLocaleString()} seguidores
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {currentProfile?.id === profile.id && (
                                                            <div className="h-6 w-6 rounded-full bg-[#9e46d3]/10 flex items-center justify-center">
                                                                <ArrowRight className="h-3.5 w-3.5 text-[#9e46d3]" />
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => handleSetMainProfile(e, profile.id)}
                                                            disabled={isSettingMain === profile.id || profile.isMain}
                                                            className={`p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${profile.isMain
                                                                ? 'text-amber-500 bg-amber-50 opacity-100 cursor-default'
                                                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                                                                }`}
                                                            title={profile.isMain ? 'Perfil Principal' : 'Definir como Principal'}
                                                        >
                                                            <Star className={`h-4 w-4 ${profile.isMain ? 'fill-amber-500' : ''}`} />
                                                        </button>

                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, profile.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Excluir perfil"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        {currentProfile ? (
                            <div className="space-y-8">
                                <InstagramProfile
                                    profile={mapProfileToProps(currentProfile)}
                                    posts={mapPostsForEngagement(allPostsForEngagement)}
                                />
                                <InstagramPosts
                                    posts={mapPostsToProps(posts)}
                                    hasMorePosts={hasMorePosts}
                                    onLoadMore={() => currentProfile && loadMorePosts(currentProfile.id)}
                                    isLoading={isLoading}
                                    onPostClick={handlePostClick}
                                />
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center transform transition-all duration-500 hover:shadow-lg">
                                <div className="text-center py-10">
                                    <div className="bg-gray-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
                                        <Instagram className="h-10 w-10 text-[#9e46d3]/40" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">Selecione um perfil</h3>
                                    <p className="text-gray-500">Escolha um perfil na lista à esquerda para visualizar os detalhes e análises.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {profileToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto transition-all duration-300">
                    <div
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center text-red-600">
                                <div className="bg-red-100 p-2 rounded-lg mr-3">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-medium">Excluir Perfil</h3>
                            </div>
                            <button
                                onClick={handleCancelDelete}
                                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="mb-5 text-gray-600">
                            Tem certeza de que deseja excluir este perfil? Esta ação não pode ser desfeita, e todos os dados associados serão removidos permanentemente.
                        </p>

                        {deleteError && (
                            <div className="mb-5 p-4 text-sm text-red-600 bg-red-50 rounded-lg flex items-start">
                                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-medium">Falha ao excluir:</div>
                                    <div>{deleteError}</div>
                                    <div className="mt-2 text-xs">
                                        Verifique se você tem permissões para excluir este perfil.
                                        Mais detalhes estão disponíveis no console do navegador.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9e46d3]"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader className="animate-spin h-4 w-4 mr-2" />
                                        Excluindo...
                                    </>
                                ) : (
                                    'Excluir Perfil'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal dos Posts */}
            {selectedPost && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4"
                    onClick={closeModal}
                >
                    {/* Backdrop com gradiente suave */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 animate-in fade-in duration-300" />

                    {/* Container do modal */}
                    <div
                        className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botão fechar fixo */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white/90 hover:bg-white rounded-full p-2 transition-all duration-200 shadow-lg backdrop-blur-sm"
                            aria-label="Fechar modal"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Layout responsivo */}
                        <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
                            {/* Seção da imagem */}
                            <div className="lg:w-3/5 bg-black relative flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
                                <img
                                    src={getPostImage(selectedPost.display_url)}
                                    alt={selectedPost.caption?.substring(0, 20) || 'Publicação do Instagram'}
                                    className="w-full h-full object-contain max-h-[400px] lg:max-h-[600px]"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                />

                                {/* Badges sobre a imagem */}
                                <div className="absolute top-4 left-4">
                                    <div className="flex items-center space-x-2">
                                        {/* Badge de tempo */}
                                        <div className="flex items-center bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs">
                                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                                            {formatTimeAgo(selectedPost.timestamp)}
                                        </div>

                                        {/* Badge de performance */}
                                        <div className={`px-2.5 py-1.5 rounded-full text-xs font-medium text-white ${getPerformanceRating(selectedPost).color} shadow-lg`}>
                                            {getPerformanceRating(selectedPost).label}
                                        </div>
                                    </div>
                                </div>

                                {/* Ícone de vídeo */}
                                {selectedPost.is_video && (
                                    <div className="absolute bottom-4 right-4">
                                        <div className="bg-[#9e46d3] text-white h-10 w-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                                            <Video className="h-5 w-5" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Seção de informações */}
                            <div className="lg:w-2/5 flex flex-col bg-white">
                                {/* Header */}
                                <div className="p-4 lg:p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                                            {selectedPost.is_video ? '🎥 Vídeo' : '📸 Foto'}
                                        </h3>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(selectedPost.timestamp)}
                                        </div>
                                    </div>
                                </div>

                                {/* Conteúdo scrollável */}
                                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                                    {/* Métricas de engajamento */}
                                    <div className="bg-gradient-to-r from-[#9e46d3]/5 to-purple-500/5 p-4 rounded-xl border border-[#9e46d3]/10">
                                        <div className="flex items-center mb-3">
                                            <div className="p-2 rounded-full bg-[#9e46d3]/10 mr-3">
                                                <TrendingUp className="h-4 w-4 text-[#9e46d3]" />
                                            </div>
                                            <h4 className="text-sm font-semibold text-[#9e46d3]">Métricas de Engajamento</h4>
                                        </div>
                                        <div className="flex items-end mb-3">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {selectedPost.is_video && selectedPost.video_view_count
                                                    ? `${calculatePostEngagement(selectedPost).toFixed(2)}%`
                                                    : calculatePostEngagement(selectedPost).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2 mb-1">
                                                {selectedPost.is_video && selectedPost.video_view_count
                                                    ? 'taxa de engajamento'
                                                    : 'interações totais'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-[#9e46d3] to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${Math.min(100, selectedPost.is_video && selectedPost.video_view_count
                                                        ? calculatePostEngagement(selectedPost) * 3
                                                        : Math.min(100, (calculatePostEngagement(selectedPost) / 1000) * 100))}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Estatísticas */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <div className="flex items-center mb-2">
                                                <Heart className="h-4 w-4 text-red-500 mr-2" />
                                                <span className="text-xs font-medium text-red-600">Curtidas</span>
                                            </div>
                                            <div className="text-xl font-bold text-gray-900">{selectedPost.likes_count.toLocaleString()}</div>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center mb-2">
                                                <MessageCircle className="h-4 w-4 text-blue-500 mr-2" />
                                                <span className="text-xs font-medium text-blue-600">Comentários</span>
                                            </div>
                                            <div className="text-xl font-bold text-gray-900">{selectedPost.comments_count.toLocaleString()}</div>
                                        </div>

                                        {selectedPost.video_view_count && (
                                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 col-span-2">
                                                <div className="flex items-center mb-2">
                                                    <Eye className="h-4 w-4 text-green-500 mr-2" />
                                                    <span className="text-xs font-medium text-green-600">Visualizações</span>
                                                </div>
                                                <div className="text-xl font-bold text-gray-900">{selectedPost.video_view_count.toLocaleString()}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Legenda */}
                                    {selectedPost.caption && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                <span className="w-2 h-2 bg-[#9e46d3] rounded-full mr-2" />
                                                Legenda
                                            </h4>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
                                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                                                    {selectedPost.caption}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer com ações */}
                                <div className="p-4 lg:p-6 border-t border-gray-100 bg-gray-50">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <a
                                            href={selectedPost.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#9e46d3] to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Ver no Instagram
                                        </a>

                                        <button
                                            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(selectedPost.url);
                                                alert('✅ Link copiado!');
                                            }}
                                            aria-label="Copiar link"
                                        >
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Copiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal component */}
            <InstagramProfileModal isOpen={isProfileModalOpen} onClose={handleCloseProfileModal} />
        </div>
    );
}