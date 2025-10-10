// src/screens/user/MyReportsScreen.js
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ReportCard from '../../components/ReportCard';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useReports } from '../../hooks/useReports';

export default function MyReportsScreen({ navigation }) {
  const { user } = useAuth();
  const { deleteReport } = useReports();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, pending, approved, rejected

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
            const { error } = await deleteReport(reportId);
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar el reporte');
            } else {
              setMyReports(myReports.filter((r) => r.id !== reportId));
              Alert.alert('Éxito', 'Reporte eliminado correctamente');
            }
          },
        },
      ]
    );
  };

  const getFilteredReports = () => {
    if (selectedTab === 'all') {
      return myReports;
    } else if (selectedTab === 'pending') {
      return myReports.filter((r) => r.status === 'pending' && !r.is_approved);
    } else if (selectedTab === 'approved') {
      return myReports.filter((r) => r.is_approved);
    } else if (selectedTab === 'rejected') {
      return myReports.filter((r) => r.status === 'rejected');
    }
    return myReports;
  };

  const getStatusBadge = (report) => {
    if (report.is_approved) {
      return { label: 'Aprobado', color: '#34C759' };
    } else if (report.status === 'rejected') {
      return { label: 'Rechazado', color: '#FF3B30' };
    } else if (report.status === 'reviewing') {
      return { label: 'En revisión', color: '#FF9500' };
    } else {
      return { label: 'Pendiente', color: '#8E8E93' };
    }
  };

  const renderReportItem = ({ item }) => {
    const statusBadge = getStatusBadge(item);

    return (
      <View style={styles.reportWrapper}>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
          <Text style={styles.statusText}>{statusBadge.label}</Text>
        </View>
        <ReportCard
          report={item}
          onPress={() => navigation.navigate('ReportDetails', { reportId: item.id })}
        />
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() =>
              navigation.navigate('EditReport', { reportId: item.id })
            }
          >
            <Ionicons name="pencil" size={18} color="#007AFF" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteReport(item.id)}
          >
            <Ionicons name="trash" size={18} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
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
        onPress={() => navigation.navigate('CreateReport')}
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
      count: myReports.filter((r) => r.status === 'pending' && !r.is_approved).length,
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
    paddingTop: 10,
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
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: '#007AFF',
  },
  countText: {
    fontSize: 12,
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
  reportWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -10,
    marginBottom: 10,
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
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  editButtonText: {
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