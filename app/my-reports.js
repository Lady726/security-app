// app/my-reports.js
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { supabase } from '../src/config/supabase';

const CATEGORY_COLORS = {
  robo: '#FF3B30',
  asalto: '#FF9500',
  vandalismo: '#FFCC00',
  sospechoso: '#007AFF',
  otro: '#8E8E93',
};

const CATEGORY_LABELS = {
  robo: 'Robo',
  asalto: 'Asalto',
  vandalismo: 'Vandalismo',
  sospechoso: 'Sospechoso',
  otro: 'Otro',
};

export default function MyReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateReportStatus } = useReports();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          report_images (
            id,
            image_url
          ),
          likes (count),
          reviews (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyReports(data || []);
    } catch (error) {
      console.error('Error fetching my reports:', error);
      Alert.alert('Error', 'No se pudieron cargar tus reportes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyReports();
    setRefreshing(false);
  };

  const handleDeleteReport = (reportId) => {
    Alert.alert(
      'Eliminar Reporte',
      '¿Estás seguro que deseas eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId);

              if (error) throw error;

              setMyReports(myReports.filter((r) => r.id !== reportId));
              Alert.alert('Éxito', 'Reporte eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el reporte');
            }
          },
        },
      ]
    );
  };

  const handleChangeStatus = (reportId, currentStatus) => {
    const statusOptions = [
      { label: 'Pendiente', value: 'pending' },
      { label: 'En revisión', value: 'reviewing' },
      { label: 'Resuelto', value: 'resolved' },
      { label: 'Rechazado', value: 'rejected' },
    ];

    const buttons = statusOptions
      .filter((option) => option.value !== currentStatus)
      .map((option) => ({
        text: option.label,
        onPress: async () => {
          try {
            const { error } = await updateReportStatus(reportId, option.value);

            if (error) throw error;

            // Actualizar el reporte en la lista local
            setMyReports(
              myReports.map((r) =>
                r.id === reportId ? { ...r, status: option.value } : r
              )
            );

            Alert.alert('Éxito', `Estado actualizado a: ${option.label}`);
          } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado');
          }
        },
      }));

    buttons.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Cambiar Estado', 'Selecciona el nuevo estado:', buttons);
  };

  const getFilteredReports = () => {
    if (selectedTab === 'all') {
      return myReports;
    } else if (selectedTab === 'pending') {
      return myReports.filter((r) => !r.is_approved && r.status !== 'rejected');
    } else if (selectedTab === 'approved') {
      return myReports.filter((r) => r.is_approved);
    } else if (selectedTab === 'rejected') {
      return myReports.filter((r) => r.status === 'rejected');
    }
    return myReports;
  };

  const getStatusBadge = (report) => {
    if (report.is_approved) {
      return { label: 'Aprobado', color: '#34C759', icon: 'checkmark-circle' };
    } else if (report.status === 'resolved') {
      return { label: 'Resuelto', color: '#34C759', icon: 'checkmark-done-circle' };
    } else if (report.status === 'rejected') {
      return { label: 'Rechazado', color: '#FF3B30', icon: 'close-circle' };
    } else if (report.status === 'reviewing') {
      return { label: 'En revisión', color: '#FF9500', icon: 'time' };
    } else {
      return { label: 'Pendiente', color: '#8E8E93', icon: 'hourglass' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReportItem = ({ item }) => {
    const statusBadge = getStatusBadge(item);
    const categoryColor = CATEGORY_COLORS[item.category] || '#8E8E93';
    const categoryLabel = CATEGORY_LABELS[item.category] || item.category;

    return (
      <View style={styles.reportCard}>
        {/* Imagen */}
        {item.report_images && item.report_images.length > 0 ? (
          <Image
            source={{ uri: item.report_images[0].image_url }}
            style={styles.reportImage}
          />
        ) : (
          <View style={[styles.reportImagePlaceholder, { backgroundColor: categoryColor }]}>
            <Ionicons name="image-outline" size={48} color="#fff" />
          </View>
        )}

        {/* Badge de estado */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
          <Ionicons name={statusBadge.icon} size={14} color="#fff" />
          <Text style={styles.statusText}>{statusBadge.label}</Text>
        </View>

        {/* Contenido */}
        <View style={styles.reportContent}>
          <View style={styles.reportHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>

          <Text style={styles.reportTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.reportDescription} numberOfLines={3}>
            {item.description}
          </Text>

          {item.address && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}

          {/* Estadísticas */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={16} color="#FF3B30" />
              <Text style={styles.statText}>{item.likes?.[0]?.count || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={16} color="#007AFF" />
              <Text style={styles.statText}>{item.reviews?.[0]?.count || 0}</Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.statusButton]}
              onPress={() => handleChangeStatus(item.id, item.status)}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#007AFF" />
              <Text style={styles.statusButtonText}>Cambiar Estado</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteReport(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        {selectedTab === 'all'
          ? 'No tienes reportes'
          : selectedTab === 'pending'
          ? 'No tienes reportes pendientes'
          : selectedTab === 'approved'
          ? 'No tienes reportes aprobados'
          : 'No tienes reportes rechazados'}
      </Text>
      <Text style={styles.emptyStateText}>
        Crea tu primer reporte para ayudar a mantener segura tu comunidad
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/create-report')}
      >
        <Text style={styles.createButtonText}>Crear Reporte</Text>
      </TouchableOpacity>
    </View>
  );

  const tabs = [
    { key: 'all', label: 'Todos', count: myReports.length },
    {
      key: 'pending',
      label: 'Pendientes',
      count: myReports.filter((r) => !r.is_approved && r.status !== 'rejected').length,
    },
    {
      key: 'approved',
      label: 'Aprobados',
      count: myReports.filter((r) => r.is_approved).length,
    },
    {
      key: 'rejected',
      label: 'Rechazados',
      count: myReports.filter((r) => r.status === 'rejected').length,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  const filteredReports = getFilteredReports();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Reportes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                selectedTab === tab.key && styles.countBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  selectedTab === tab.key && styles.countTextActive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredReports.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: '#007AFF',
  },
  countText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  countTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  reportImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  reportContent: {
    padding: 15,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusButton: {
    backgroundColor: '#E3F2FD',
  },
  statusButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});