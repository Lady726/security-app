// src/screens/user/MapScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useReports } from '../../hooks/useReports';
import MapMarker from '../../components/MapMarker';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([
    'robo',
    'asalto',
    'vandalismo',
    'sospechoso',
    'otro',
  ]);

  const { reports, loading: reportsLoading } = useReports();

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Necesitamos permisos de ubicación para mostrar el mapa');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const centerOnUser = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      mapRef.current?.animateToRegion(newRegion, 1000);
      setLocation(newRegion);
    } catch (error) {
      console.error('Error centering on user:', error);
    }
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const filteredReports = reports.filter((report) =>
    selectedCategories.includes(report.category)
  );

  const getCategoryLabel = (category) => {
    const labels = {
      robo: 'Robo',
      asalto: 'Asalto',
      vandalismo: 'Vandalismo',
      sospechoso: 'Sospechoso',
      otro: 'Otro',
    };
    return labels[category] || category;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={64} color="#999" />
        <Text style={styles.errorText}>No se pudo obtener la ubicación</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getLocationPermission}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
      >
        {filteredReports.map((report) => (
          <MapMarker
            key={report.id}
            report={report}
            onPress={() => setSelectedReport(report)}
          />
        ))}
      </MapView>

      {/* Botón de centrar en usuario */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#007AFF" />
      </TouchableOpacity>

      {/* Botón de filtros */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <MaterialCommunityIcons name="filter-variant" size={24} color="#007AFF" />
        <Text style={styles.filterButtonText}>Filtros</Text>
      </TouchableOpacity>

      {/* Panel de filtros */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Categorías</Text>
          {['robo', 'asalto', 'vandalismo', 'sospechoso', 'otro'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterItem,
                selectedCategories.includes(category) && styles.filterItemActive,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text
                style={[
                  styles.filterItemText,
                  selectedCategories.includes(category) &&
                    styles.filterItemTextActive,
                ]}
              >
                {getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modal de detalles del reporte */}
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedReport(null)}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedReport?.report_images &&
                selectedReport.report_images.length > 0 && (
                  <Image
                    source={{ uri: selectedReport.report_images[0].image_url }}
                    style={styles.reportImage}
                    resizeMode="cover"
                  />
                )}

              <View style={styles.reportDetails}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {getCategoryLabel(selectedReport?.category)}
                  </Text>
                </View>

                <Text style={styles.reportTitle}>{selectedReport?.title}</Text>

                <View style={styles.reportMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-circle-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      {selectedReport?.profiles?.full_name || 'Usuario'}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      {selectedReport && formatDate(selectedReport.created_at)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reportDescription}>
                  {selectedReport?.description}
                </Text>

                {selectedReport?.address && (
                  <View style={styles.addressContainer}>
                    <Ionicons name="location-outline" size={20} color="#007AFF" />
                    <Text style={styles.addressText}>{selectedReport.address}</Text>
                  </View>
                )}

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart-outline" size={20} color="#FF3B30" />
                    <Text style={styles.statText}>
                      {selectedReport?.likes?.[0]?.count || 0}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
                    <Text style={styles.statText}>
                      {selectedReport?.reviews?.[0]?.count || 0}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => {
                    setSelectedReport(null);
                    navigation.navigate('ReportDetails', { reportId: selectedReport.id });
                  }}
                >
                  <Text style={styles.viewDetailsButtonText}>Ver detalles completos</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Botón flotante para crear reporte */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('CreateReport')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButtonText: {
    marginLeft: 5,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterPanel: {
    position: 'absolute',
    top: 170,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 150,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
  },
  filterItemActive: {
    backgroundColor: '#007AFF',
  },
  filterItemText: {
    fontSize: 14,
    color: '#666',
  },
  filterItemTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  reportDetails: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  reportDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 15,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },