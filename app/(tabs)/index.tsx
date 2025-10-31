import { Image } from 'expo-image';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MusicPlayer, Musica } from '@/components/music-player';

export default function HomeScreen() {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProx, setLoadingProx] = useState(false);
  const [index, setIndex] = useState(0);
  const [musicaAtual, setMusicaAtual] = useState<Musica | null>(null);

  // Busca músicas da Deezer
  const fetchMusica = async (add = false) => {
    try {
      if (!add) setLoading(true);

      const res = await fetch(`https://api.deezer.com/chart/0/tracks?index=${add ? index : 0}`);
      const data = await res.json();

      if (add) setMusicas(prev => [...prev, ...data.data]);
      else setMusicas(data.data);

      setIndex(prev => prev + 25);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    } finally {
      if (add) setLoadingProx(false);
      else setLoading(false);
    }
  };

  // Carrega ao abrir
  useEffect(() => {
    fetchMusica();
  }, []);

  // Carrega mais músicas
  const loadMusicas = async () => {
    setLoadingProx(true);
    await fetchMusica(true);
  };

  // Formata duração
  const fmtDuracao = (duracao: number) => {
    const minutes = Math.floor(duracao / 60);
    const seconds = duracao % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Próxima música automática
  const tocarProxima = () => {
    if (!musicaAtual || musicas.length === 0) return;
    const i = musicas.findIndex(t => t.id === musicaAtual.id);
    const proxIndex = (i + 1) % musicas.length;
    setMusicaAtual(musicas[proxIndex]);
  };

  // Exibe carregando
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </ThemedView>
    );
  }

  // Renderiza item
  const renderMusicas = ({ item }: { item: Musica }) => {
    const isTemp = musicaAtual?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.musicaItem, isTemp && styles.tempMusica]}
        onPress={() => setMusicaAtual(item)}
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
        data={musicas}
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

      {/* Player reutilizável */}
      <MusicPlayer musica={musicaAtual} onNext={tocarProxima} />
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
  },
});
