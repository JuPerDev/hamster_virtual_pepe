import React, { useState, Suspense } from 'react';
import { StyleSheet, View, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { useHamsterState } from './hooks/useHamsterState';
import { useAudio } from './hooks/useAudio';
import { HamsterModel } from './components/HamsterScene';
import { StatsBars } from './components/StatsBars';
import { ActionButtons } from './components/ActionButtons';
import { ChatBubble } from './components/ChatBubble';

export default function App() {
  const { state, updateState, updateStats, isLoaded } = useHamsterState();
  const { playAudio, sayCategory, sayInline } = useAudio(state.isSoundOn, (spk) => updateState({ isSpeaking: spk }));

  const [chatVisible, setChatVisible] = useState(false);
  const [chatText, setChatText] = useState('');

  if (!isLoaded) return null;

  const handleAction = (action: string) => {
    if (state.currentAction && state.currentAction !== 'sleeping') return;

    if (action === 'feed') {
      if (state.stats.hunger >= 100) {
        sayInline('Ya estoy llenito, chicas');
        showChat('¡Ya estoy llenito, chicas! 🐹');
        return;
      }
      updateState({ currentAction: 'eating' });
      updateStats({ hunger: 25, happiness: 5, cleanliness: -3 });
      const text = sayCategory('eating');
      showChat(text);
      setTimeout(() => updateState({ currentAction: null }), 2500);
    } 
    else if (action === 'play') {
      if (state.stats.energy < 10) {
        sayInline('Chicas, estoy muy cansadito');
        showChat('Chicas, estoy muy cansadito... 😴');
        return;
      }
      updateState({ currentAction: 'bounce' });
      updateStats({ energy: -15, happiness: 10, hunger: -5 });
      const text = sayCategory('playing');
      showChat(text);
      setTimeout(() => updateState({ currentAction: null }), 1500);
    }
    else if (action === 'sleep') {
      updateState({ currentAction: 'sleeping' });
      const text = sayCategory('sleeping');
      showChat(text);
      // Wake up handled by user or timer
    }
    else if (action === 'clean') {
      if (state.stats.cleanliness >= 100) {
        sayInline('Chicas, ya estoy limpiecito');
        showChat('¡Chicas, ya estoy limpiecito! ✨');
        return;
      }
      updateState({ currentAction: 'cleaning' });
      updateStats({ cleanliness: 30, happiness: 5 });
      const text = sayCategory('clean');
      showChat(text);
      setTimeout(() => updateState({ currentAction: null }), 2000);
    }
    else if (action === 'pet') {
      updateState({ currentAction: 'petted' });
      updateStats({ happiness: 15 });
      const text = sayCategory('petted');
      showChat(text);
      setTimeout(() => updateState({ currentAction: null }), 2000);
    }
    else if (action === 'talk') {
      let category = 'idle';
      if (state.stats.hunger < 25) category = 'hungry';
      else if (state.stats.energy < 25) category = 'tired';
      else if (state.stats.cleanliness < 25) category = 'dirty';
      else if (state.stats.happiness < 25) category = 'sad';
      else if (state.stats.happiness > 70) category = 'happy';
      
      updateState({ currentAction: 'bounce' });
      const text = sayCategory(category);
      showChat(text);
      setTimeout(() => updateState({ currentAction: null }), 1500);
    }
  };

  const showChat = (text: string) => {
    setChatText(text);
    setChatVisible(true);
    setTimeout(() => setChatVisible(false), 4000);
  };

  const handleSendChat = (text: string) => {
    // Basic fallback response since AI is removed
    setChatVisible(true);
    setChatText('¡Squeak! No entiendo muy bien, pero te quiero mucho 💕');
    setTimeout(() => setChatVisible(false), 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mi Hámster Virtual</Text>
          <Text style={styles.name}>{state.name}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => updateState({ isSoundOn: !state.isSoundOn })} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>{state.isSoundOn ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.badges}>
        <View style={styles.badge}>
          <Text>{state.mood === 'Feliz' ? '😊' : state.mood === 'Normal' ? '🙂' : '😴'} {state.mood}</Text>
        </View>
      </View>

      {/* 3D Scene */}
      <View style={styles.sceneContainer}>
        <Suspense fallback={<View style={styles.loading}><Text>Cargando 3D...</Text></View>}>
          <Canvas camera={{ position: [0, 0.18, 4.6], fov: 28 }}>
            <HamsterModel currentAction={state.currentAction} />
          </Canvas>
        </Suspense>
        
        {state.currentAction === 'sleeping' && (
          <View style={styles.zzzContainer}>
            <Text style={styles.zzzText}>Zzz</Text>
          </View>
        )}
      </View>

      <View style={styles.chatOverlay}>
        <ChatBubble 
          text={chatText} 
          isThinking={false}
          visible={chatVisible}
          onSend={handleSendChat}
        />
      </View>

      <StatsBars stats={state.stats} />
      
      <ActionButtons 
        onFeed={() => handleAction('feed')}
        onPlay={() => handleAction('play')}
        onSleep={() => handleAction('sleep')}
        onClean={() => handleAction('clean')}
        onPet={() => handleAction('pet')}
        onTalk={() => handleAction('talk')}
        disabled={!!state.currentAction && state.currentAction !== 'sleeping'}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffebd6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5a2b',
  },
  name: {
    fontSize: 16,
    color: '#a0522d',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    fontSize: 20,
  },
  badges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sceneContainer: {
    flex: 1,
    position: 'relative',
    marginTop: -20,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatOverlay: {
    position: 'absolute',
    bottom: 240,
    width: '100%',
  },
  zzzContainer: {
    position: 'absolute',
    top: '30%',
    right: '30%',
  },
  zzzText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#66ccff',
    textShadowColor: 'white',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  }
});
