import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ActionButtonsProps {
  onFeed: () => void;
  onPlay: () => void;
  onSleep: () => void;
  onClean: () => void;
  onPet: () => void;
  onTalk: () => void;
  disabled: boolean;
}

export function ActionButtons({ onFeed, onPlay, onSleep, onClean, onPet, onTalk, disabled }: ActionButtonsProps) {
  const renderBtn = (label: string, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: color }, disabled && styles.disabledBtn]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderBtn('Alimentar', '🌻', '#ffd27f', onFeed)}
      {renderBtn('Jugar', '🎾', '#ff9999', onPlay)}
      {renderBtn('Dormir', '🛏️', '#99ccff', onSleep)}
      {renderBtn('Limpiar', '🛁', '#80ffdf', onClean)}
      {renderBtn('Acariciar', '🤗', '#ffb3e6', onPet)}
      {renderBtn('Hablar', '💬', '#e6ccff', onTalk)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 110,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a3f35',
  }
});
