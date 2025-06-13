import React from 'react';
import { Video, TrendingUp, Heart, MessageCircle, Eye } from 'lucide-react';
import { getProxiedImageUrl } from '../services/instagramService';

interface Post {
    id: string;
    profile_id: string;
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

interface InstagramTopPostsProps {
    posts: Post[];
}

const InstagramTopPosts: React.FC<InstagramTopPostsProps> = ({ posts }) => {
    console.log('InstagramTopPosts - Posts recebidos:', posts);
    console.log('InstagramTopPosts - Total de posts:', posts.length);

    // Verificar dados de todas as publicações
    posts.forEach((post, index) => {
        console.log(`Post ${index + 1}:`, {
            id: post.id,
            caption: post.caption?.substring(0, 50),
            video_view_count: post.video_view_count,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            is_video: post.is_video
        });
    });

    // Ordenar todas as publicações por número de curtidas
    const topPosts = posts
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 10);

    console.log('InstagramTopPosts - Top 10 posts:', topPosts);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views.toString();
    };

    const getProxiedImage = (url: string) => {
        return getProxiedImageUrl(url);
    };

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-purple-50 mb-6">
                    <Heart className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Nenhum post encontrado</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Não há posts carregados para este perfil.
                </p>
            </div>
        );
    }

    if (topPosts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-purple-50 mb-6">
                    <Heart className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Nenhuma publicação encontrada</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Não há publicações disponíveis para exibir o ranking.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                        Total de posts: {posts.length}
                    </span>
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center">
                    <Heart className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="font-medium text-gray-800">Top 10 Publicações por Curtidas</h3>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {topPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        {/* Posição */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${index < 3
                            ? index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                            : 'bg-purple-600'
                            }`}>
                            {index + 1}
                        </div>

                        {/* Miniatura da publicação */}
                        <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                            <img
                                src={getProxiedImage(post.display_url)}
                                alt={post.caption?.substring(0, 20) || 'Publicação do Instagram'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkg0NFY0Mkg0NFY0NEgyMFYyMloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                                }}
                                loading="lazy"
                            />
                            {post.is_video && (
                                <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full p-1">
                                    <Video className="w-3 h-3" />
                                </div>
                            )}
                        </div>

                        {/* Informações da publicação */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 line-clamp-2 mb-1">
                                {post.caption?.substring(0, 60) || 'Sem legenda'}...
                            </p>
                            <div className="text-xs text-gray-500">
                                {formatDate(post.timestamp)}
                            </div>
                        </div>

                        {/* Métricas */}
                        <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center text-sm font-medium text-purple-600">
                                <Heart className="w-4 h-4 mr-1" />
                                {post.likes_count.toLocaleString()}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <div className="flex items-center">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {post.comments_count.toLocaleString()}
                                </div>
                                {post.is_video && post.video_view_count && post.video_view_count > 0 && (
                                    <div className="flex items-center">
                                        <Eye className="w-3 h-3 mr-1" />
                                        {formatViews(post.video_view_count)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-100">
                Publicações ordenadas por número de curtidas
            </div>
        </div>
    );
};

export default InstagramTopPosts; 