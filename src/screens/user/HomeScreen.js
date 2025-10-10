// src/screens/user/HomeScreen.js
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

export default function HomeScreen({ navigation }) {
  const { reports, loading, fetchReports, toggleLike } = useReports();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [userLikes, setUserLikes] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const fetchUserLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('report_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserLikes(data.map((like) => like.report_id));
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    await fetchUserLikes();
    setRefreshing(false);
  };

  const handleLike = async (reportId) => {
    const { liked, error } = await toggleLike(reportId);
    if (!error) {
      if (liked) {
        setUserLikes([...userLikes, reportId]);
      } else {
        setUserLikes(userLikes.filter((id) => id !== reportId));
      }
    }
  };

  const getFilteredReports = () => {
    if (selectedFilter === 'all') {
      return reports;
    }
    return reports.filter((report) => report.category === selectedFilter);
  };

  const filters = [
    { value: 'all', label: 'Todos', icon: 'apps' },
    { value: 'robo', label: 'Robo', icon: 'wallet-outline' },
    { value: 'asalto', label: 'Asalto', icon: 'alert-circle-outline' },
    { value: 'vandalismo', label: 'Vandalismo', icon: 'hammer-outline' },
    { value: 'sospechoso', label: 'Sospechoso', icon: 'eye-outline' },
  ];

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No hay reportes</Text>
      <Text style={styles.emptyStateText}>
        Sé el primero en reportar un incidente en tu zona
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={() => navigation.navigate('CreateReport')}
      >
        <Text style={styles.createFirstButtonText}>Crear Reporte</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>¡Hola!</Text>
        <Text style={styles.subtitle}>Mantente informado sobre tu zona</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === item.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(item.value)}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={selectedFilter === item.value ? '#fff' : '#007AFF'}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === item.value && styles.filterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (loading && reports.length === 0) {
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
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() =>
              navigation.navigate('ReportDetails', { reportId: item.id })
            }
            onLike={handleLike}
            isLiked={userLikes.includes(item.id)}
          />
        )}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderFilters()}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{reports.length}</Text>
                <Text style={styles.statLabel}>Reportes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {reports.filter((r) => r.category === 'robo').length}
                </Text>
                <Text style={styles.statLabel}>Robos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {reports.filter((r) => r.category === 'asalto').length}
                </Text>
                <Text style={styles.statLabel}>Asaltos</Text>
              </View>
            </View>
          </>
        }
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
  listContent: {
    padding: 15,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  filtersContainer: {
    marginBottom: 15,
  },
  filtersList: {
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  filterButtonTextActive: {
    color: '#fff',
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
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});