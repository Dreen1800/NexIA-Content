import React from 'react';
import { Activity, Shield, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { calculateRealEngagementRate, getProfileHealthRating } from './InstagramProfile';

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

interface ProfileHealthIndicatorProps {
    followersCount: number;
    followsCount: number;
    postsCount: number;
    posts?: Post[];
    variant?: 'compact' | 'detailed';
    className?: string;
}

const ProfileHealthIndicator: React.FC<ProfileHealthIndicatorProps> = ({
    followersCount,
    followsCount,
    postsCount,
    posts = [],
    variant = 'compact',
    className = ''
}) => {
    // Calcular taxa de engajamento real baseada nos posts
    const realEngagementRate = calculateRealEngagementRate(posts, followersCount);

    // Calcular saúde do perfil
    const healthData = getProfileHealthRating(
        realEngagementRate,
        followersCount,
        followsCount,
        postsCount
    );

    // Ícone para saúde do perfil
    const getHealthIcon = (score: number) => {
        if (score >= 80) return <Shield className="h-4 w-4 text-green-500" />;
        if (score >= 60) return <CheckCircle className="h-4 w-4 text-blue-500" />;
        if (score >= 40) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (variant === 'compact') {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className="p-1.5 bg-[#9e46d3]/10 rounded-full mr-2">
                            <Activity className="h-4 w-4 text-[#9e46d3]" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-800">Saúde do Perfil</h3>
                    </div>
                    {getHealthIcon(healthData.score)}
                </div>

                <div className="space-y-3">
                    {/* Score geral */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Score Geral</span>
                        <span className={`text-lg font-bold ${getScoreColor(healthData.score)}`}>
                            {healthData.score}/100
                        </span>
                    </div>

                    {/* Taxa de engajamento */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Engajamento</span>
                        <div className="flex items-center">
                            <span className={`text-sm font-medium ${healthData.engagementColor.replace('bg-', 'text-')}`}>
                                {realEngagementRate.toFixed(2)}%
                            </span>
                            <div className={`ml-2 px-2 py-0.5 rounded-full text-xs text-white ${healthData.engagementColor}`}>
                                {healthData.engagementLabel}
                            </div>
                        </div>
                    </div>

                    {/* Proporção */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Proporção F/S</span>
                        <span className="text-sm font-medium text-blue-600">
                            {healthData.followRatio.toFixed(1)}x
                        </span>
                    </div>

                    {/* Barra de progresso */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-[#9e46d3] h-2 rounded-full transition-all duration-1000 ease-in-out"
                            style={{ width: `${healthData.score}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="p-2 bg-[#9e46d3]/10 rounded-full mr-3">
                        <Activity className="h-5 w-5 text-[#9e46d3]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Análise de Saúde do Perfil</h3>
                </div>
                {getHealthIcon(healthData.score)}
            </div>

            {/* Score principal */}
            <div className="text-center mb-6">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(healthData.score)}`}>
                    {healthData.score}
                </div>
                <div className="text-gray-500 text-sm">Score de Saúde (0-100)</div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden">
                    <div
                        className="bg-[#9e46d3] h-3 rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: `${healthData.score}%` }}
                    />
                </div>
            </div>

            {/* Métricas detalhadas */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gradient-to-br from-[#9e46d3]/5 to-purple-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="h-4 w-4 text-[#9e46d3] mr-1" />
                        <span className="text-sm font-medium text-gray-700">Engajamento</span>
                    </div>
                    <div className={`text-xl font-bold ${healthData.engagementColor.replace('bg-', 'text-')}`}>
                        {realEngagementRate.toFixed(2)}%
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full text-white ${healthData.engagementColor} mt-1`}>
                        {healthData.engagementLabel}
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                        <Users className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm font-medium text-gray-700">Proporção F/S</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                        {healthData.followRatio.toFixed(1)}x
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        {healthData.followRatio >= 10 ? 'Excelente' :
                            healthData.followRatio >= 5 ? 'Boa' :
                                healthData.followRatio >= 2 ? 'Regular' : 'Baixa'}
                    </div>
                </div>
            </div>

            {/* Breakdown dos fatores */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Breakdown da Pontuação</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Engajamento (60%)</span>
                        <span className="text-sm font-medium">{Math.round(healthData.factors.engagement)} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Proporção Seguidores (30%)</span>
                        <span className="text-sm font-medium">{Math.round(healthData.factors.followRatio)} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Atividade de Posts (10%)</span>
                        <span className="text-sm font-medium">{Math.round(healthData.factors.posts)} pts</span>
                    </div>
                </div>
            </div>

            {/* Descrição e recomendações */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">
                    <strong>Análise:</strong> {healthData.engagementDescription}
                </div>
                {posts.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                        Baseado em análise de {posts.length} posts reais
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileHealthIndicator; 