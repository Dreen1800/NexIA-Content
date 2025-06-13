import React, { useState, useEffect } from 'react';
import { Instagram, Users, Award, Image, Calendar, TrendingUp, BarChart, Heart, MessageCircle, Share2, Activity, Shield, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { getProxiedImageUrl } from '../services/instagramService';

interface Post {
    id: string;
    profile_id: string;
    instagram_id: string;
    shortCode: string;
    type: string;
    url: string;
    caption: string;
    timestamp: string;
    likesCount: number;
    commentsCount: number;
    videoViewCount?: number;
    displayUrl: string;
    isVideo: boolean;
    hashtags?: string[];
    mentions?: string[];
    productType?: string;
    isCommentsDisabled?: boolean;
}

interface InstagramProfileProps {
    profile: {
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
    };
    posts?: Post[]; // Posts reais para cálculo preciso de engajamento
}

// Funções utilitárias para cálculo de saúde do perfil
export const calculateRealEngagementRate = (posts: Post[], followersCount: number): number => {
    console.log(`[calculateRealEngagementRate] Iniciando cálculo com ${posts.length} posts e ${followersCount} seguidores`);

    // Validações robustas
    if (!posts || posts.length === 0) {
        console.log(`[calculateRealEngagementRate] Nenhum post encontrado`);
        return 0;
    }

    if (!followersCount || followersCount <= 0 || isNaN(followersCount)) {
        console.log(`[calculateRealEngagementRate] Número de seguidores inválido: ${followersCount}`);
        return 0;
    }

    // Calcular média de engajamento dos últimos posts
    const totalEngagement = posts.reduce((sum, post, index) => {
        const likes = post.likesCount || 0;
        const comments = post.commentsCount || 0;

        if (index < 3) {
            console.log(`[calculateRealEngagementRate] Post ${index + 1}: likes=${likes}, comments=${comments}`);
        }

        // Validar se os números são válidos
        if (isNaN(likes) || isNaN(comments)) {
            console.log(`[calculateRealEngagementRate] Valores inválidos no post ${index + 1}: likes=${likes}, comments=${comments}`);
            return sum;
        }

        return sum + likes + comments;
    }, 0);

    console.log(`[calculateRealEngagementRate] Engajamento total: ${totalEngagement}`);

    if (totalEngagement === 0) {
        console.log(`[calculateRealEngagementRate] Engajamento total é zero`);
        return 0;
    }

    const avgEngagementPerPost = totalEngagement / posts.length;
    const engagementRate = (avgEngagementPerPost / followersCount) * 100;

    console.log(`[calculateRealEngagementRate] Média por post: ${avgEngagementPerPost}, Taxa: ${engagementRate}%`);

    // Verificar se o resultado é válido
    if (isNaN(engagementRate)) {
        console.log(`[calculateRealEngagementRate] Taxa de engajamento inválida: ${engagementRate}`);
        return 0;
    }

    return engagementRate;
};

export const getProfileHealthRating = (engagementRate: number, followersCount: number, followsCount: number, postsCount: number) => {
    // Classificação baseada na taxa de engajamento
    let engagementScore = 0;
    let engagementLabel = '';
    let engagementColor = '';
    let engagementDescription = '';

    if (engagementRate >= 6) {
        engagementScore = 100;
        engagementLabel = 'Muito Alta';
        engagementColor = 'bg-purple-500';
        engagementDescription = 'Top 25% dos perfis no Instagram';
    } else if (engagementRate >= 3) {
        engagementScore = 80;
        engagementLabel = 'Alta';
        engagementColor = 'bg-green-500';
        engagementDescription = 'Público altamente engajado';
    } else if (engagementRate >= 1) {
        engagementScore = 60;
        engagementLabel = 'Boa';
        engagementColor = 'bg-blue-500';
        engagementDescription = 'Taxa considerada boa';
    } else {
        engagementScore = 30;
        engagementLabel = 'Baixa';
        engagementColor = 'bg-yellow-500';
        engagementDescription = 'Pode ser melhorada';
    }

    // Fatores adicionais para saúde do perfil
    const followRatio = followersCount / (followsCount || 1);
    const followRatioScore = Math.min(30, followRatio * 2); // Máximo 30 pontos

    const postsScore = Math.min(20, postsCount / 5); // Máximo 20 pontos

    const totalScore = Math.min(100, engagementScore * 0.6 + followRatioScore * 0.3 + postsScore * 0.1);

    return {
        score: Math.round(totalScore),
        engagementRate,
        engagementLabel,
        engagementColor,
        engagementDescription,
        followRatio,
        factors: {
            engagement: engagementScore,
            followRatio: followRatioScore,
            posts: postsScore
        }
    };
};

const InstagramProfile: React.FC<InstagramProfileProps> = ({ profile, posts = [] }) => {
    const [imgError, setImgError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Animation effect on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Function to handle image loading errors
    const handleImageError = () => {
        console.error(`Failed to load profile image from URL: ${profile.profile_pic_url}`);
        setImgError(true);
    };

    // Get proxied image URL
    const proxiedProfileImageUrl = getProxiedImageUrl(profile.profile_pic_url);

    // Debug: Verificar quantos posts estão sendo usados
    console.log(`[InstagramProfile] Perfil: @${profile.username}, Posts recebidos: ${posts.length}, Seguidores: ${profile.followers_count}`);
    console.log(`[InstagramProfile] Primeiros 3 posts:`, posts.slice(0, 3));

    // Calcular taxa de engajamento real baseada nos posts
    const realEngagementRate = calculateRealEngagementRate(posts, profile.followers_count);
    console.log(`[InstagramProfile] Taxa calculada: ${realEngagementRate}%`);

    // Calcular saúde do perfil
    const healthData = getProfileHealthRating(
        realEngagementRate,
        profile.followers_count,
        profile.follows_count,
        profile.posts_count
    );

    // Estimativa de curtidas baseada na taxa real
    const estimatedAvgLikes = posts.length > 0
        ? posts.reduce((sum, post) => sum + post.likesCount, 0) / posts.length
        : profile.followers_count * (realEngagementRate / 100);

    // Format large numbers with k/m suffix
    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Ícone para saúde do perfil
    const getHealthIcon = (score: number) => {
        if (score >= 80) return <Shield className="h-4 w-4 text-green-500" />;
        if (score >= 60) return <CheckCircle className="h-4 w-4 text-blue-500" />;
        if (score >= 40) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    };

    return (
        <div className={`overflow-visible transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Estrutura simplificada para impedir sobreposição */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                {/* Cabeçalho com efeito de blur */}
                <div className="h-32 w-full bg-[#9e46d3] rounded-t-xl relative overflow-hidden">
                    {/* Textura e efeitos do background */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>

                    {/* Elementos decorativos */}
                    <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md"></div>
                    <div className="absolute top-12 right-20 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md"></div>
                </div>

                {/* Container para foto + informações */}
                <div className="flex flex-col px-6">
                    {/* Foto de perfil em container separado */}
                    <div className="flex justify-start -mt-14 mb-4 relative">
                        <div className="p-1 rounded-full bg-[#9e46d3] shadow-xl">
                            {!imgError && profile.profile_pic_url ? (
                                <img
                                    src={proxiedProfileImageUrl}
                                    alt={profile.username}
                                    className="w-28 h-28 rounded-full border-2 border-white object-cover"
                                    onError={handleImageError}
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    loading="eager"
                                    fetchPriority="high"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                                    <Instagram className="h-14 w-14 text-[#9e46d3]/60" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informação do perfil */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                        <div className="transition-all duration-300 hover:translate-x-1">
                            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                            <div className="flex items-center text-gray-600 mt-1">
                                <Instagram className="h-4 w-4 mr-1" />
                                <span className="text-[#9e46d3] font-medium">@{profile.username}</span>
                            </div>

                            {profile.is_business_account && profile.business_category_name && (
                                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#9e46d3]/10 text-[#9e46d3] backdrop-blur-sm shadow-sm">
                                    <Award className="mr-1.5 h-3.5 w-3.5" />
                                    {profile.business_category_name}
                                </div>
                            )}
                        </div>

                        {/* Estatísticas com animações hover */}
                        <div className="flex mt-6 md:mt-0 space-x-8 text-center">
                            <div className="flex flex-col items-center group transition-all duration-300 hover:-translate-y-1">
                                <div className="text-2xl font-bold text-gray-900 group-hover:text-[#9e46d3] transition-colors">
                                    {formatNumber(profile.followers_count)}
                                </div>
                                <div className="text-xs font-medium text-gray-500">Seguidores</div>
                            </div>
                            <div className="flex flex-col items-center group transition-all duration-300 hover:-translate-y-1">
                                <div className="text-2xl font-bold text-gray-900 group-hover:text-[#9e46d3] transition-colors">
                                    {formatNumber(profile.follows_count)}
                                </div>
                                <div className="text-xs font-medium text-gray-500">Seguindo</div>
                            </div>
                            <div className="flex flex-col items-center group transition-all duration-300 hover:-translate-y-1">
                                <div className="text-2xl font-bold text-gray-900 group-hover:text-[#9e46d3] transition-colors">
                                    {formatNumber(profile.posts_count)}
                                </div>
                                <div className="text-xs font-medium text-gray-500">Publicações</div>
                            </div>
                        </div>
                    </div>

                    {/* Bio com animação sutil */}
                    {profile.biography && (
                        <div className="mb-6 bg-gray-50 rounded-lg p-4 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md border border-gray-100">
                            <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{profile.biography}</p>
                        </div>
                    )}

                    {/* Cards de métricas com efeito de glassmorphism */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        {/* Card de Taxa de Engajamento */}
                        <div className="rounded-xl p-5 backdrop-blur-md bg-white border border-[#9e46d3]/20 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <div className="p-2 bg-[#9e46d3]/10 rounded-full mr-3 group-hover:bg-[#9e46d3] group-hover:text-white transition-colors">
                                        <TrendingUp className="h-4 w-4 text-[#9e46d3] group-hover:text-white" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#9e46d3]">Taxa de Engajamento</h3>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${healthData.engagementColor}`}>
                                    {healthData.engagementLabel}
                                </div>
                            </div>
                            <div className="flex items-end">
                                <span className="text-2xl font-bold text-gray-900">{realEngagementRate.toFixed(2)}%</span>
                                <span className="text-xs text-gray-500 ml-2 mb-1">dos seguidores</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-1000 ease-in-out ${healthData.engagementColor.replace('bg-', 'bg-')}`}
                                    style={{ width: `${Math.min(100, realEngagementRate * 10)}%` }}>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <div className="flex items-center text-xs text-gray-500">
                                    <Heart className="h-3 w-3 mr-1 text-[#9e46d3]" />
                                    <span>~{Math.round(estimatedAvgLikes).toLocaleString()} interações por post</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    {healthData.engagementDescription}
                                </div>
                            </div>
                        </div>

                        {/* Card de Saúde do Perfil */}
                        <div className="rounded-xl p-5 backdrop-blur-md bg-white border border-[#9e46d3]/20 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <div className="p-2 bg-[#9e46d3]/10 rounded-full mr-3 group-hover:bg-[#9e46d3] group-hover:text-white transition-colors">
                                        <Activity className="h-4 w-4 text-[#9e46d3] group-hover:text-white" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#9e46d3]">Saúde do Perfil</h3>
                                </div>
                                {getHealthIcon(healthData.score)}
                            </div>
                            <div className="flex items-end">
                                <span className="text-2xl font-bold text-gray-900">{healthData.score}</span>
                                <span className="text-xs text-gray-500 ml-2 mb-1">/ 100</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
                                <div className="bg-[#9e46d3] h-2 rounded-full transition-all duration-1000 ease-in-out"
                                    style={{ width: `${healthData.score}%` }}>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <div className="flex items-center text-xs text-gray-500">
                                    <Users className="h-3 w-3 mr-1 text-[#9e46d3]" />
                                    <span>Proporção: {healthData.followRatio.toFixed(1)} seguidores/seguindo</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    Baseado em engajamento ({Math.round(healthData.factors.engagement)}), proporção ({Math.round(healthData.factors.followRatio)}) e atividade ({Math.round(healthData.factors.posts)})
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicadores de qualidade */}
                    <div className="mb-6 bg-gradient-to-r from-[#9e46d3]/5 to-blue-50 rounded-xl p-4 border border-[#9e46d3]/10">
                        <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                            <BarChart className="h-4 w-4 mr-2 text-[#9e46d3]" />
                            Resumo da Análise
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500">Engajamento</div>
                                <div className={`text-sm font-medium ${healthData.engagementColor.replace('bg-', 'text-')}`}>
                                    {healthData.engagementLabel}
                                </div>
                                <div className="text-xs text-gray-600">{realEngagementRate.toFixed(2)}%</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500">Proporção F/S</div>
                                <div className="text-sm font-medium text-blue-600">
                                    {healthData.followRatio.toFixed(1)}x
                                </div>
                                <div className="text-xs text-gray-600">
                                    {healthData.followRatio >= 10 ? 'Excelente' :
                                        healthData.followRatio >= 5 ? 'Boa' :
                                            healthData.followRatio >= 2 ? 'Regular' : 'Baixa'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500">Posts Analisados</div>
                                <div className="text-sm font-medium text-green-600">
                                    {posts.length}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {posts.length >= 20 ? 'Amostra Grande' :
                                        posts.length >= 10 ? 'Amostra Boa' :
                                            posts.length >= 5 ? 'Amostra Pequena' : 'Dados Limitados'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé com timestamp */}
                    <div className="flex items-center justify-between pb-6">
                        <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Analisado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {posts.length > 0 && (
                            <div className="text-xs text-gray-500">
                                Baseado em {posts.length} posts reais
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstagramProfile;