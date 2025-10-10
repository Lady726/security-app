// src/screens/admin/AdminDashboardScreen.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Panel de Administración</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={32} color="#007AFF" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Reportes Totales</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={32} color="#FF9500" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={32} color="#34C759" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Usuarios</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={32} color="#FF3B30" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Zonas Críticas</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// src/screens/admin/ModerateReportsScreen.js
export function ModerateReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moderar Reportes</Text>
      <Text style={styles.subtitle}>Esta funcionalidad estará disponible pronto</Text>
    </View>
  );
}

// src/screens/admin/UsersManagementScreen.js
export function UsersManagementScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administrar Usuarios</Text>
      <Text style={styles.subtitle}>Esta funcionalidad estará disponible pronto</Text>
    </View>
  );
}

// src/screens/admin/StatisticsScreen.js
export function StatisticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>
      <Text style={styles.subtitle}>Esta funcionalidad estará disponible pronto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});