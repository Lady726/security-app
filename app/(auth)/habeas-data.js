// app/(auth)/habeas-data.js
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HabeasDataScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Habeas Data y Privacidad</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Política de Tratamiento de Datos Personales</Text>
        <Text style={styles.date}>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introducción</Text>
          <Text style={styles.paragraph}>
            La aplicación Seguridad Ciudadana respeta su privacidad y está comprometida con la protección
            de sus datos personales. Esta política describe cómo recopilamos, usamos y protegemos su información
            personal de acuerdo con las leyes de protección de datos aplicables.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Datos que Recopilamos</Text>
          <Text style={styles.paragraph}>
            Recopilamos los siguientes tipos de información:
          </Text>
          <Text style={styles.bulletPoint}>• Nombre completo</Text>
          <Text style={styles.bulletPoint}>• Correo electrónico</Text>
          <Text style={styles.bulletPoint}>• Ubicación geográfica (para reportes)</Text>
          <Text style={styles.bulletPoint}>• Fotografías relacionadas con reportes de seguridad</Text>
          <Text style={styles.bulletPoint}>• Información de uso de la aplicación</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Uso de la Información</Text>
          <Text style={styles.paragraph}>
            Utilizamos sus datos personales para:
          </Text>
          <Text style={styles.bulletPoint}>• Gestionar su cuenta de usuario</Text>
          <Text style={styles.bulletPoint}>• Procesar y dar seguimiento a reportes de seguridad</Text>
          <Text style={styles.bulletPoint}>• Mejorar nuestros servicios</Text>
          <Text style={styles.bulletPoint}>• Comunicarnos con usted sobre actualizaciones importantes</Text>
          <Text style={styles.bulletPoint}>• Compartir información relevante con autoridades competentes cuando sea necesario</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Protección de Datos</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos personales
            contra acceso no autorizado, alteración, divulgación o destrucción. Sus datos son almacenados de forma
            segura utilizando tecnologías de cifrado.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Sus Derechos</Text>
          <Text style={styles.paragraph}>
            Usted tiene derecho a:
          </Text>
          <Text style={styles.bulletPoint}>• Acceder a sus datos personales</Text>
          <Text style={styles.bulletPoint}>• Rectificar datos inexactos o incompletos</Text>
          <Text style={styles.bulletPoint}>• Solicitar la eliminación de sus datos</Text>
          <Text style={styles.bulletPoint}>• Oponerse al tratamiento de sus datos</Text>
          <Text style={styles.bulletPoint}>• Solicitar la portabilidad de sus datos</Text>
          <Text style={styles.bulletPoint}>• Revocar su consentimiento en cualquier momento</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Compartición de Datos</Text>
          <Text style={styles.paragraph}>
            Sus datos pueden ser compartidos con:
          </Text>
          <Text style={styles.bulletPoint}>• Autoridades policiales y de seguridad (cuando sea relevante para reportes)</Text>
          <Text style={styles.bulletPoint}>• Proveedores de servicios técnicos (bajo estrictos acuerdos de confidencialidad)</Text>
          <Text style={styles.bulletPoint}>• Autoridades legales cuando sea requerido por ley</Text>
          <Text style={styles.paragraph}>
            Nunca vendemos ni compartimos sus datos personales con fines comerciales.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Retención de Datos</Text>
          <Text style={styles.paragraph}>
            Conservamos sus datos personales solo durante el tiempo necesario para cumplir con los propósitos
            descritos en esta política, o según lo requiera la ley.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cambios a esta Política</Text>
          <Text style={styles.paragraph}>
            Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios significativos
            a través de la aplicación o por correo electrónico.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contacto</Text>
          <Text style={styles.paragraph}>
            Si tiene preguntas sobre esta política o desea ejercer sus derechos, puede contactarnos a través
            de la sección de perfil en la aplicación o enviando un correo a privacidad@seguridadciudadana.app
          </Text>
        </View>

        <View style={styles.acceptanceBox}>
          <Ionicons name="shield-checkmark" size={48} color="#007AFF" />
          <Text style={styles.acceptanceText}>
            Al usar esta aplicación, usted acepta el tratamiento de sus datos personales de acuerdo con esta política.
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginLeft: 15,
    marginBottom: 5,
  },
  acceptanceBox: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  acceptanceText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
});
