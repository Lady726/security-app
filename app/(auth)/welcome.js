// app/(auth)/welcome.js
import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
          </View>

          <Text style={styles.title}>Bienvenido a{'\n'}Seguridad Ciudadana</Text>
          <Text style={styles.subtitle}>
            Tu plataforma para reportar y consultar incidentes de seguridad en tu comunidad
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Reporta incidentes en tiempo real</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="map" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Consulta el mapa de seguridad</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Colabora con tu comunidad</Text>
            </View>
          </View>

          <View style={styles.privacyBox}>
            <Ionicons name="lock-closed" size={32} color="#4CAF50" />
            <Text style={styles.privacyTitle}>Tu Privacidad es Importante</Text>
            <Text style={styles.privacyText}>
              Protegemos tus datos personales con los más altos estándares de seguridad.
              Solo usamos tu información para mejorar la seguridad de tu comunidad.
            </Text>
            <Link href="/(auth)/habeas-data" asChild>
              <TouchableOpacity style={styles.privacyLink}>
                <Text style={styles.privacyLinkText}>Leer Política de Privacidad</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            </Link>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryButtonText}>Comenzar</Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Ya tengo una cuenta</Text>
            </TouchableOpacity>
          </Link>

          <Text style={styles.disclaimer}>
            Al continuar, aceptas nuestra{' '}
            <Link href="/(auth)/habeas-data" asChild>
              <Text style={styles.disclaimerLink}>política de privacidad</Text>
            </Link>
            {' '}y el tratamiento de tus datos personales
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  privacyBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 10,
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 5,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
});
