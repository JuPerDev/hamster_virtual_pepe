import { useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

const soundsMap: Record<string, any> = {
  'idle_1': require('../sounds/idle_1.mp3'),
  'idle_2': require('../sounds/idle_2.mp3'),
  'idle_3': require('../sounds/idle_3.mp3'),
  'idle_4': require('../sounds/idle_4.mp3'),
  'idle_5': require('../sounds/idle_5.mp3'),
  'idle_6': require('../sounds/idle_6.mp3'),
  'idle_7': require('../sounds/idle_7.mp3'),
  'idle_8': require('../sounds/idle_8.mp3'),
  'idle_9': require('../sounds/idle_9.mp3'),
  'hungry_1': require('../sounds/hungry_1.mp3'),
  'hungry_2': require('../sounds/hungry_2.mp3'),
  'hungry_3': require('../sounds/hungry_3.mp3'),
  'hungry_4': require('../sounds/hungry_4.mp3'),
  'hungry_5': require('../sounds/hungry_5.mp3'),
  'happy_1': require('../sounds/happy_1.mp3'),
  'happy_2': require('../sounds/happy_2.mp3'),
  'happy_3': require('../sounds/happy_3.mp3'),
  'happy_4': require('../sounds/happy_4.mp3'),
  'happy_5': require('../sounds/happy_5.mp3'),
  'sad_1': require('../sounds/sad_1.mp3'),
  'sad_2': require('../sounds/sad_2.mp3'),
  'sad_3': require('../sounds/sad_3.mp3'),
  'sad_4': require('../sounds/sad_4.mp3'),
  'sad_5': require('../sounds/sad_5.mp3'),
  'tired_1': require('../sounds/tired_1.mp3'),
  'tired_2': require('../sounds/tired_2.mp3'),
  'tired_3': require('../sounds/tired_3.mp3'),
  'tired_4': require('../sounds/tired_4.mp3'),
  'tired_5': require('../sounds/tired_5.mp3'),
  'dirty_1': require('../sounds/dirty_1.mp3'),
  'dirty_2': require('../sounds/dirty_2.mp3'),
  'dirty_3': require('../sounds/dirty_3.mp3'),
  'dirty_4': require('../sounds/dirty_4.mp3'),
  'eating_1': require('../sounds/eating_1.mp3'),
  'eating_2': require('../sounds/eating_2.mp3'),
  'eating_3': require('../sounds/eating_3.mp3'),
  'eating_4': require('../sounds/eating_4.mp3'),
  'eating_5': require('../sounds/eating_5.mp3'),
  'playing_1': require('../sounds/playing_1.mp3'),
  'playing_2': require('../sounds/playing_2.mp3'),
  'playing_3': require('../sounds/playing_3.mp3'),
  'playing_4': require('../sounds/playing_4.mp3'),
  'playing_5': require('../sounds/playing_5.mp3'),
  'sleeping_1': require('../sounds/sleeping_1.mp3'),
  'sleeping_2': require('../sounds/sleeping_2.mp3'),
  'sleeping_3': require('../sounds/sleeping_3.mp3'),
  'petted_1': require('../sounds/petted_1.mp3'),
  'petted_2': require('../sounds/petted_2.mp3'),
  'petted_3': require('../sounds/petted_3.mp3'),
  'petted_4': require('../sounds/patted_4.mp3'), // typo originial mantenido
  'petted_5': require('../sounds/patted_5.mp3'), // typo originial mantenido
  'clean_1': require('../sounds/clean_1.mp3'),
  'clean_2': require('../sounds/clean_2.mp3'),
  'clean_3': require('../sounds/clean_3.mp3'),
  'clean_4': require('../sounds/clean_4.mp3'),
  'ballCatch_1': require('../sounds/ballCatch_1.mp3'),
  'ballCatch_2': require('../sounds/ballCatch_2.mp3'),
  'ballCatch_3': require('../sounds/ballCatch_3.mp3'),
  'ballCatch_4': require('../sounds/ballCatch_4.mp3'),
  'ballCatch_5': require('../sounds/ballCatch_5.mp3'),
  'ballCatch_6': require('../sounds/ballCatch_6.mp3'),
  'ballMiss_1': require('../sounds/ballMiss_1.mp3'),
  'ballMiss_2': require('../sounds/ballMiss_2.mp3'),
  'ballMiss_3': require('../sounds/ballMiss_3.mp3'),
  'inline_full': require('../sounds/inline_full.mp3'),
  'inline_tired': require('../sounds/inline_tired.mp3'),
  'inline_awake': require('../sounds/inline_awake.mp3'),
  'inline_clean': require('../sounds/inline_clean.mp3'),
  'inline_ai_on': require('../sounds/inline_ai_on.mp3'),
  'inline_amnesia': require('../sounds/inline_amnesia.mp3')
};

const categoryLengths: Record<string, number> = {
  idle: 9, hungry: 5, happy: 5, sad: 5, tired: 5, dirty: 4,
  eating: 5, playing: 5, sleeping: 3, petted: 5, clean: 4,
  ballCatch: 6, ballMiss: 3
};

export const phrases: Record<string, string[]> = {
    idle: [
      '¡Squeak squeak, Abby! 🐹',
      '*se rasca la orejita* ¿Qué hacen hoy, chicas?',
      'Hmm... Abby, Pascal, ¿jugamos?',
      '*mueve los bigotitos* ¡Las extrañaba!',
      '¡Me gusta estar con ustedes!',
      '*corre en su rueda* ¡Miren, Abby! ¡Soy rápido!',
      '¿Tienes semillitas, Pascal? 🌻',
      '*se acicala el pelito* Quiero verme bonito para Abby y Pascal',
      '¡Squeak! ¡Pepe! ¡Mi humano favorito! 🐹',
    ],
    hungry: [
      '¡Abby, tengo hambreeee! 🥺',
      'Pascal, ¿me das una semillita?',
      'Mi pancita hace ruidos... ¡Abby, ayuda! 🌻',
      '*mira a Pascal con ojitos tristes*',
      '¡Chicas, comidaaaa por favoooor!',
    ],
    happy: [
      '¡SQUEAK! ¡Estoy feliz con Abby y Pascal! ✨',
      '¡Son las mejores humanas! 💖',
      '*da vueltas de alegría* ¡Las quiero, chicas!',
      '¡Te quiero mucho, Abby! 🐹💕',
      '¡Wiiii! ¡Pascal, la vida es bella!',
    ],
    sad: [
      '*squeak triste* Abby, ven... 😢',
      'Me siento solito sin ustedes...',
      'Pascal, ¿puedes jugar conmigo?',
      '*se esconde en la viruta* Las extraño...',
      'Abby, Pascal, necesito cariñito... 🥺',
    ],
    tired: [
      '*bosteza*... Abby, tengo sueñito 😴',
      'Mis ojitos se cierran, Pascal...',
      'Chicas, ¿puedo dormir un ratito?',
      '*se hace bolita al lado de Abby*',
      'Zzz... digo... ¡estoy despierto, Pascal! ...casi',
    ],
    dirty: [
      '¡Abby, necesito un bañito! 🛁',
      '*huele algo raro* Pascal, ¿soy yo?',
      '¡Chicas, quiero estar limpiecito!',
      'Mi pelito necesita cepillado, Abby...',
    ],
    eating: [
      '¡Ñom ñom ñom! ¡Gracias, Abby! 🌻',
      '*guarda en los cachetes* ¡Pascal, mira cuánto guardo!',
      '¡Está delicioso, chicas!',
      '¡Más semillitas, Abby! ¡Ñom!',
      '*mastica feliz mirando a Pascal*',
    ],
    playing: [
      '¡WIIII! ¡Qué divertido, Abby! 🎉',
      '*corre por todos lados* ¡Pascal, mírame!',
      '¡Atrápame si puedes, chicas!',
      '¡Me encanta jugar con ustedes!',
      '*da piruetas para Abby y Pascal*',
    ],
    sleeping: [
      'Zzz... Abby... semillitas... Zzz...',
      '*ronquido suavecito al lado de Pascal*',
      'Zzz... Abby y Pascal son... mis mejores... Zzz...',
    ],
    petted: [
      '¡Squeeeak! ¡Cariñitos de Abby! 💕',
      '*se derrite de amor con Pascal*',
      '¡Más por favor, chicas! ✨',
      '*ronronea en las manos de Abby*',
      '¡Me encantan las caricias de Pascal!',
    ],
    clean: [
      '¡Estoy reluciente, Abby! ✨',
      '*se sacude feliz para Pascal*',
      '¡Qué fresquito! ¡Gracias, chicas! 🛁',
      '¡Limpiecito y contento con Abby y Pascal!',
    ],
    ballCatch: [
      '¡La atrapé, Abby! ¡Otra vez! 🎾',
      '¡WIIII! ¡Pascal, tíramela otra vez!',
      '¡Squeak! ¡Soy muy rápido, chicas! ⚡',
      '*atrapa la pelota* ¡Abby, viste eso!',
      '¡Esa fue genial, Pascal! ¡Más! 🐹',
      '¡Me encanta este juego con ustedes! 🎉',
    ],
    ballMiss: [
      '¡Casi la atrapo, Abby! Otra vez... 😅',
      '¡Uy! Se me escapó, Pascal 🙈',
      '*corre detrás de la pelota* ¡Espérenme, chicas!',
    ],
  };

export function useAudio(isSoundOn: boolean, setSpeaking: (val: boolean) => void) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playAudio = useCallback(async (key: string) => {
    if (!isSoundOn) return;
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const file = soundsMap[key];
      if (!file) return;

      const { sound: newSound } = await Audio.Sound.createAsync(file);
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSpeaking(false);
        }
      });

      setSpeaking(true);
      await newSound.playAsync();
    } catch (e) {
      console.warn("Error playing audio", e);
      setSpeaking(false);
    }
  }, [isSoundOn, sound, setSpeaking]);

  const sayCategory = useCallback((category: string) => {
    const length = categoryLengths[category] || 5;
    const index = Math.floor(Math.random() * length);
    const key = `${category}_${index + 1}`;
    playAudio(key);
    
    const textList = phrases[category] || phrases.idle;
    const textIndex = Math.min(index, textList.length - 1);
    return textList[textIndex];
  }, [playAudio]);

  const sayInline = useCallback((text: string) => {
    const map: Record<string, string> = {
      'Ya estoy llenito, chicas': 'inline_full',
      'Chicas, estoy muy cansadito': 'inline_tired',
      'Abby, Pascal, desperté con energía': 'inline_awake',
      'Chicas, ya estoy limpiecito': 'inline_clean',
      'Abby, Pascal, ahora puedo pensar y recordar': 'inline_ai_on',
      '¿Abby? ¿Pascal? ¿Dónde estoy?': 'inline_amnesia'
    };
    const key = map[text];
    if (key) playAudio(key);
  }, [playAudio]);

  return { playAudio, sayCategory, sayInline };
}
