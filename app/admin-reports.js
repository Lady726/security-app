// app/admin-reports.js
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ReportCard from '../src/components/ReportCard';
import { useAdmin } from '../hooks/useAdmin';

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all', icon: 'list', color: '#666' },
  { label: 'Pendientes', value: 'pending_approval', icon: 'time', color: '#FF9500' },
  { label: 'Aprobados', value: 'reviewing', icon: 'checkmark-circle', color: '#34C759' },
  { label: 'Rechazados', value: 'rejected', icon: 'close-circle', color: '#FF3B30' },
  { label: 'Resueltos', value: 'resolved', icon: 'checkmark-done', color: '#007AFF' },
];

export default function AdminReportsScreen() {
  const router = useRouter();
  const { allReports, stats, loading, fetchAllReports, approveReport, rejectReport, isAdmin } = useAdmin();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Verificar que el usuario sea admin
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={60} color="#FF3B30" />
          <Text style={styles.errorTitle}>Acceso Denegado</Text>
          <Text style={styles.errorText}>
            No tienes permisos para acceder a esta sección
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllReports();
    setRefreshing(false);
  };

  const handleApprove = (reportId) => {
    Alert.alert(
      'Aprobar Reporte',
      '¿Estás seguro que deseas aprobar este reporte? Será visible para todos los usuarios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: async () => {
            const { error } = await approveReport(reportId);
            if (error) {
              Alert.alert('Error', 'No se pudo aprobar el reporte');
            } else {
              Alert.alert('Éxito', 'Reporte aprobado correctamente');
            }
          },
        },
      ]
    );
  };

  const handleReject = (reportId) => {
    Alert.prompt(
      'Rechazar Reporte',
      'Ingresa la razón del rechazo (opcional):',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async (reason) => {
            const { error } = await rejectReport(reportId, reason);
            if (error) {
              Alert.alert('Error', 'No se pudo rechazar el reporte');
            } else {
              Alert.alert('Éxito', 'Reporte rechazado');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleReportPress = (report) => {
    // Navegar a detalles con opciones de admin
    router.push({
      pathname: '/report-details/[id]',
      params: { id: report.id, isAdmin: 'true' },
    });
  };

  const handleReportLongPress = (report) => {
    const isPendingApproval = !report.is_approved && report.status === 'pending';

    const options = [
      {
        text: 'Ver Detalles',
        onPress: () => handleReportPress(report),
      },
    ];

    if (isPendingApproval) {
      options.push(
        {
          text: 'Aprobar',
          onPress: () => handleApprove(report.id),
        },
        {
          text: 'Rechazar',
          onPress: () => handleReject(report.id),
          style: 'destructive',
        }
      );
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    Alert.alert('Opciones de Administrador', 'Selecciona una acción:', options);
  };

  // Filtrar reportes
  const filteredReports = allReports.filter((report) => {
    // Filtro por estado
    let matchesStatus = true;
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'pending_approval') {
        matchesStatus = !report.is_approved && report.status === 'pending';
      } else {
        matchesStatus = report.status === selectedFilter;
      }
    }

    // Filtro por búsqueda
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch =
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.category.toLowerCase().includes(query);
    }

    return matchesStatus && matchesSearch;
  });

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats?.total || 0}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={[styles.statCard, { borderColor: '#FF9500' }]}>
        <Text style={[styles.statNumber, { color: '#FF9500' }]}>
          {stats?.pending || 0}
        </Text>
        <Text style={styles.statLabel}>Pendientes</Text>
      </View>
      <View style={[styles.statCard, { borderColor: '#34C759' }]}>
        <Text style={[styles.statNumber, { color: '#34C759' }]}>
          {stats?.approved || 0}
        </Text>
        <Text style={styles.statLabel}>Aprobados</Text>
      </View>
      <View style={[styles.statCard, { borderColor: '#FF3B30' }]}>
        <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
          {stats?.rejected || 0}
        </Text>
        <Text style={styles.statLabel}>Rechazados</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Administración</Text>
          <Text style={styles.headerSubtitle}>Panel de Control</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {renderStatsCard()}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar reportes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              selectedFilter === filter.value && styles.filterChipActive,
              { borderColor: filter.color },
            ]}
            onPress={() => setSelectedFilter(filter.value)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={selectedFilter === filter.value ? '#fff' : filter.color}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reportCardContainer}>
              <ReportCard
                report={item}
                onPress={() => handleReportPress(item)}
                onLongPress={() => handleReportLongPress(item)}
              />
              {!item.is_approved && item.status === 'pending' && (
                <View style={styles.actionsBar}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Aprobar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay reportes</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Intenta con otra búsqueda'
                  : 'Los reportes aparecerán aquí'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  reportCardContainer: {
    marginBottom: 15,
  },
  actionsBar: {
    flexDirection: 'row',
    marginTop: -10,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
