import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stats } from '../types';

interface StatsBarsProps {
  stats: Stats;
}

export function StatsBars({ stats }: StatsBarsProps) {
  const renderBar = (label: string, icon: string, value: number, color: string) => {
    const isWarning = value < 25;
    return (
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.barWrapper, isWarning && styles.warningWrapper]}>
          <View style={[styles.bar, { width: `${value}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.value}>{Math.round(value)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderBar('Hambre', '🌻', stats.hunger, '#ffb84d')}
      {renderBar('Felicidad', '💖', stats.happiness, '#ff80df')}
      {renderBar('Energía', '⚡', stats.energy, '#66ccff')}
      {renderBar('Limpieza', '✨', stats.cleanliness, '#4dffdb')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
    width: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a3f35',
    width: 65,
  },
  barWrapper: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  warningWrapper: {
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a3f35',
    width: 24,
    textAlign: 'right',
  }
});
