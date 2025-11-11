// src/components/MapMarker.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

const CATEGORY_ICONS = {
  robo: 'account-cash',
  asalto: 'alert-octagon',
  vandalismo: 'hammer-wrench',
  sospechoso: 'account-alert',
  otro: 'alert-circle',
};

const CATEGORY_COLORS = {
  robo: '#FF3B30',
  asalto: '#FF9500',
  vandalismo: '#FFCC00',
  sospechoso: '#007AFF',
  otro: '#8E8E93',
};

export default function MapMarker({ report, onPress }) {
  const iconName = CATEGORY_ICONS[report.category] || 'alert-circle';
  const color = CATEGORY_COLORS[report.category] || '#8E8E93';

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(report.latitude),
        longitude: parseFloat(report.longitude),
      }}
      onPress={onPress}
    >
      <View style={[styles.markerContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={iconName} size={24} color="#fff" />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
