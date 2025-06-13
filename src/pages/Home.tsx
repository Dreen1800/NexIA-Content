import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannelStore } from '../stores/channelStore';
import { useInstagramStore } from '../stores/instagramStore';
import ChannelHeader from '../components/ChannelHeader';
import InstagramProfile from '../components/InstagramProfile';
import InstagramTopPosts from '../components/InstagramTopVideos';
import EngagementChart from '../components/EngagementChart';
import ViewsDurationChart from '../components/ViewsDurationChart';
import { AlertCircle, Loader, Home as HomeIcon, Settings, Instagram } from 'lucide-react';

const Home = () => {
  const { getMainChannel, currentChannel, currentAnalysis, fetchChannelAnalysis, isLoading, error } = useChannelStore();
  const { profiles, posts, allPostsForEngagement, fetchProfiles, fetchPosts, fetchAllPostsForEngagement, getMainProfile, isLoading: instagramLoading } = useInstagramStore();
  const navigate = useNavigate();
  const [noMainChannel, setNoMainChannel] = useState(false);
  const [mainProfile, setMainProfile] = useState<any>(null);

  useEffect(() => {
    const loadMainChannel = async () => {
      const mainChannel = await getMainChannel();
      if (mainChannel) {
        fetchChannelAnalysis(mainChannel.channel_id);
      } else {
        setNoMainChannel(true);
      }
    };

    loadMainChannel();
    fetchProfiles(); // Carregar perfis do Instagram
  }, [getMainChannel, fetchChannelAnalysis, fetchProfiles]);

  // Buscar o perfil principal do Instagram
  useEffect(() => {
    const loadMainProfile = async () => {
      const profile = await getMainProfile();
      setMainProfile(profile);
    };

    loadMainProfile();
  }, [getMainProfile, profiles]);

  // Buscar posts do perfil principal quando ele estiver carregado
  useEffect(() => {
    if (mainProfile?.id) {
      fetchPosts(mainProfile.id); // Para exibição na lista
      fetchAllPostsForEngagement(mainProfile.id); // Para cálculo de engajamento
    }
  }, [mainProfile, fetchPosts, fetchAllPostsForEngagement]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col justify-center items-center h-64 bg-white shadow-lg rounded-xl p-8">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-gray-700 text-lg">Carregando dados do canal principal...</p>
        </div>
      </div>
    );
  }

  if (noMainChannel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <HomeIcon className="w-8 h-8 text-purple-600 mr-3" />
            Início
          </h1>
          <p className="text-gray-600 mt-1">
            Acompanhe as métricas do seu canal principal
          </p>
        </div>

        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-purple-50 mb-6">
            <Settings className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Nenhum canal principal definido</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Vá até o Dashboard e defina um canal como principal para visualizar suas métricas aqui.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-5 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none transition-all duration-200 shadow-md"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-red-600 mb-2 font-medium">Erro ao carregar o canal principal</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentChannel || !currentAnalysis) {
    return null;
  }

  // Mapear perfil do Instagram para o formato do componente
  const mapProfileToProps = (profile: any) => {
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
      created_at: profile.createdAt || new Date().toISOString()
    };
  };

  // Mapear posts do Instagram para o formato do componente InstagramTopVideos
  const mapPostsToTopVideos = (posts: any[]) => {
    console.log('Home - Posts recebidos para mapeamento:', posts);
    return posts.map(post => ({
      id: post.id,
      profile_id: post.profile_id,
      instagram_id: post.instagram_id,
      short_code: post.shortCode,
      type: post.type,
      url: post.url,
      caption: post.caption,
      timestamp: post.timestamp,
      likes_count: post.likesCount || 0,
      comments_count: post.commentsCount || 0,
      video_view_count: post.videoViewCount,
      display_url: post.displayUrl,
      is_video: post.isVideo
    }));
  };

  // Mapear posts para o formato usado pelo InstagramProfile
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

  const mappedPosts = mapPostsToTopVideos(posts);

  console.log('Home - Perfis carregados:', profiles.length);
  console.log('Home - Posts carregados:', posts.length);
  console.log('Home - Posts mapeados:', mappedPosts.length);
  console.log('Home - Perfil principal:', mainProfile);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <HomeIcon className="w-8 h-8 text-purple-600 mr-3" />
          Início
        </h1>
        <p className="text-gray-600 mt-1">
          Acompanhe as métricas do seu canal principal
        </p>
      </div>

      <ChannelHeader
        channel={currentChannel}
        analysisDate={currentAnalysis.analysis_date}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-800">Engajamento por Vídeo</h3>
          </div>
          <div className="p-4">
            <EngagementChart videos={currentAnalysis.videos} />
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-800">Visualizações x Duração</h3>
          </div>
          <div className="p-4">
            <ViewsDurationChart videos={currentAnalysis.videos} />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Perfil Favorito do Instagram</h2>
        </div>

        <div className="p-6">
          {instagramLoading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader className="w-8 h-8 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Carregando perfil do Instagram...</p>
            </div>
          ) : mainProfile ? (
            <div className="space-y-6">
              <InstagramProfile
                profile={mapProfileToProps(mainProfile)}
                posts={mapPostsForEngagement(allPostsForEngagement)}
              />

              {/* Top 10 Vídeos por Engajamento */}
              <div className="border-t border-gray-100 pt-6">
                <InstagramTopPosts posts={mappedPosts} />
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-purple-50 mb-6">
                <Instagram className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Nenhum perfil favorito do Instagram definido</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Vá até Instagram Analytics para adicionar perfis e definir um como favorito. O perfil favorito será exibido aqui na página inicial.
              </p>
              <button
                onClick={() => navigate('/instagram-analytics')}
                className="inline-flex items-center px-5 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none transition-all duration-200 shadow-md"
              >
                <Instagram className="w-4 h-4 mr-2" />
                Ir para Instagram Analytics
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;