// components/MusicPlayer.tsx
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useAudioPlayer, useAudioPlayerStatus, AudioSource } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export interface Musica {
  id: number;
  title: string;
  artist: { name: string };
  album: { cover_medium: string };
  duration: number;
}

interface MusicPlayerProps {
  musica?: Musica | null;
  onNext?: () => void;
}

export function MusicPlayer({ musica, onNext }: MusicPlayerProps) {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (status.didJustFinish && onNext) onNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (musica) playMusica(musica);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musica]);

  const playMusica = async (musica: Musica) => {
    try {
      const res = await fetch(`https://api.deezer.com/track/${musica.id}`);
      const data = await res.json();
      if (!data.preview) throw new Error('Preview não disponível');

      player.replace(data.preview as AudioSource);
      player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao reproduzir música:', error);
    }
  };

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  if (!musica) return null;

  return (
    <ThemedView style={styles.player}>
      <Image source={{ uri: musica.album.cover_medium }} style={styles.playerCover} />
      <ThemedView style={styles.playerInfo}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {musica.title}
        </ThemedText>
        <ThemedText>{musica.artist.name}</ThemedText>
      </ThemedView>
      <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
        <FontAwesome
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  playerCover: { width: 40, height: 40, borderRadius: 4 },
  playerInfo: { flex: 1, marginLeft: 12 },
  playButton: {
    padding: 10,
    backgroundColor: '#1DB954',
    borderRadius: 20,
    marginLeft: 12,
  },
});