// screens/SearchScreen.tsx
import { Image } from 'expo-image';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MusicPlayer, Musica } from '@/components/music-player';

export default function SearchScreen() {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [musicaAtual, setMusicaAtual] = useState<Musica | null>(null);

  const searchMusicas = async (text: string) => {
    setQuery(text);
    if (!text) {
      setMusicas([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      setMusicas(data.data);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
      Alert.alert('Erro', 'Não foi possível buscar músicas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fmtDuracao = (duracao: number) => {
    const minutes = Math.floor(duracao / 60);
    const seconds = duracao % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar músicas..."
        placeholderTextColor="#FFF"
        value={query}
        onChangeText={searchMusicas}
      />

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </ThemedView>
      ) : (
        <FlatList
          data={musicas}
          renderItem={renderMusicas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingTop: 100, paddingBottom: 60, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator
        />
      )}

      <MusicPlayer musica={musicaAtual} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    height: 40,
    backgroundColor: '#1DB954',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#fff',
    zIndex: 10,
  },
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
  tempMusica: { borderRadius: 8 },
  tempMusicaText: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
});
