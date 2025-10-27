import { Image } from 'expo-image';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, AudioSource } from 'expo-audio';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface com nomes corretos da API Deezer
interface Musica {
  id: number;
  title: string;
  artist: { name: string };
  album: { cover_medium: string };
  duration: number;
}

export default function HomeScreen() {
  const [musica, setMusica] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProx, setLoadingProx] = useState(false);
  const [index, setIndex] = useState(0);
  const [tempMusica, setTempMusica] = useState<Musica | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  // Quando uma música termina, avança para a próxima
  useEffect(() => {
    if (status.didJustFinish) {
      const i = musica.findIndex(t => t.id === tempMusica?.id);
      const proxIndex = (i + 1) % musica.length;
      playMusica(musica[proxIndex]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Carrega as primeiras músicas
  useEffect(() => {
    fetchMusica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca músicas da Deezer
  const fetchMusica = async (add = false) => {
    try {
      if (!add) setLoading(true);

      const res = await fetch(`https://api.deezer.com/chart/0/tracks?index=${add ? index : 0}`);
      const data = await res.json();

      if (add) setMusica(prev => [...prev, ...data.data]);
      else setMusica(data.data);

      setIndex(prev => prev + 25);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    } finally {
      if (add) setLoadingProx(false);
      else setLoading(false);
    }
  };

  // Carrega mais músicas
  const loadMusicas = async () => {
    setLoadingProx(true);
    await fetchMusica(true);
  };

  // Formata duração em mm:ss
  const fmtDuracao = (duracao: number) => {
    const minutes = Math.floor(duracao / 60);
    const seconds = duracao % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Reproduz a música selecionada
  const playMusica = async (musica: Musica) => {
    try {
      // Tenta pegar do cache
      const cache = await AsyncStorage.getItem(`musica_${musica.id}`);
      let prevUrl = cache;

      if (!prevUrl) {
        // Busca detalhes na API
        const res = await fetch(`https://api.deezer.com/track/${musica.id}`);
        const musicaData = await res.json();

        if (!musicaData.preview) throw new Error('Preview não disponível');

        prevUrl = musicaData.preview;
        await AsyncStorage.setItem(`musica_${musica.id}`, prevUrl!);
      }

      player.replace(prevUrl as AudioSource);
      player.play();
      setTempMusica(musica);
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao reproduzir a música:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir esta música. Tente outra.', [{ text: 'OK' }]);
    }
  };

  // Alterna entre play e pause
  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  // Exibe carregando
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </ThemedView>
    );
  }

  // Renderiza cada música
  const renderMusicas = ({ item }: { item: Musica }) => {
    const isTemp = tempMusica?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.musicaItem, isTemp && styles.tempMusica]}
        onPress={() => playMusica(item)}
      >
        <Image source={{ uri: item.album.cover_medium }} style={styles.albumCover} />
        <ThemedView style={styles.musicaInfo}>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={1}
            style={isTemp && styles.tempMusicaText}
          >
            {item.title}
          </ThemedText>
          <ThemedText style={isTemp && styles.tempMusicaText}>
            {item.artist.name}
          </ThemedText>
        </ThemedView>
        <ThemedText style={[styles.duracao, isTemp && styles.tempMusicaText]}>
          {fmtDuracao(item.duration)}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={musica}
        renderItem={renderMusicas}
        keyExtractor={(item) => item.id.toString()}
        style={styles.musicaList}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 60, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator
      />

      {/* Botão "Carregar mais" */}
      <TouchableOpacity
        style={styles.loadProxButton}
        onPress={loadMusicas}
        disabled={loadingProx}
      >
        {loadingProx ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.loadProxText}>Carregar mais músicas</ThemedText>
        )}
      </TouchableOpacity>

      {tempMusica && (
        <ThemedView style={styles.player}>
          <Image source={{ uri: tempMusica.album.cover_medium }} style={styles.playerCover} />
          <ThemedView style={styles.playerInfo}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {tempMusica.title}
            </ThemedText>
            <ThemedText>{tempMusica.artist.name}</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
            <FontAwesome
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  musicaList: { flex: 1, paddingHorizontal: 16 },
  musicaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  albumCover: { width: 50, height: 50, borderRadius: 4 },
  musicaInfo: { flex: 1, marginLeft: 12 },
  duracao: { marginLeft: 8, color: '#b3b3b3' },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  playerCover: { width: 40, height: 40, borderRadius: 4 },
  playerInfo: { flex: 1, marginLeft: 12 },
  playButton: {
    padding: 10,
    backgroundColor: '#1DB954',
    borderRadius: 20,
    marginLeft: 12,
  },
  loadProxButton: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loadProxText: { color: '#fff', fontWeight: 'bold' },
  tempMusica: { borderRadius: 8 },
  tempMusicaText: {
    color: '#1DB954',
    fontWeight: 'bold',
  }
});