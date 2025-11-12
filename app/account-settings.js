// app/account-settings.js
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../src/config/supabase';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estados para cambiar contraseña
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para eliminar cuenta
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);

      // Actualizar contraseña
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert(
        'Éxito',
        'Contraseña actualizada correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              setChangingPassword(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'eliminar') {
      Alert.alert('Error', 'Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    Alert.alert(
      '⚠️ Advertencia Final',
      'Esta acción es IRREVERSIBLE. Se eliminarán todos tus datos:\n\n' +
        '• Perfil de usuario\n' +
        '• Todos tus reportes\n' +
        '• Comentarios y likes\n' +
        '• Imágenes subidas\n\n' +
        '¿Estás absolutamente seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setDeleteConfirmation(''),
        },
        {
          text: 'Eliminar mi cuenta',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);

      // 1. Eliminar todos los reportes del usuario
      const { error: reportsError } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', user.id);

      if (reportsError) throw reportsError;

      // 2. Eliminar perfil (esto eliminará todo lo relacionado por CASCADE)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Eliminar usuario de autenticación
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      // Si falla la eliminación de auth, al menos cerramos sesión
      if (authError) {
        console.error('Error deleting auth user:', authError);
      }

      Alert.alert(
        'Cuenta Eliminada',
        'Tu cuenta ha sido eliminada permanentemente. Esperamos verte de nuevo en el futuro.',
        [
          {
            text: 'OK',
            onPress: () => signOut(),
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al eliminar tu cuenta. Por favor contacta a soporte.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Cuenta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Información de la cuenta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>{profile?.full_name || 'No especificado'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Miembro desde</Text>
                <Text style={styles.infoValue}>
                  {new Date(user?.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Cambiar Contraseña */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setChangingPassword(!changingPassword)}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
              </View>
              <Ionicons
                name={changingPassword ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {changingPassword && (
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.hint}>
                  La contraseña debe tener al menos 6 caracteres
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Actualizar Contraseña</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Zona de Peligro */}
          <View style={styles.dangerZone}>
            <View style={styles.dangerHeader}>
              <Ionicons name="warning-outline" size={24} color="#FF3B30" />
              <Text style={styles.dangerTitle}>Zona de Peligro</Text>
            </View>

            <TouchableOpacity
              style={styles.dangerSectionHeader}
              onPress={() => setDeletingAccount(!deletingAccount)}
            >
              <Text style={styles.dangerSectionTitle}>Eliminar Cuenta</Text>
              <Ionicons
                name={deletingAccount ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#FF3B30"
              />
            </TouchableOpacity>

            {deletingAccount && (
              <View style={styles.deleteContainer}>
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={40} color="#FF3B30" />
                  <Text style={styles.warningTitle}>¡Advertencia!</Text>
                  <Text style={styles.warningText}>
                    Esta acción es permanente e irreversible. Se eliminarán:
                  </Text>
                  <View style={styles.warningList}>
                    <Text style={styles.warningItem}>• Tu perfil de usuario</Text>
                    <Text style={styles.warningItem}>• Todos tus reportes</Text>
                    <Text style={styles.warningItem}>• Tus comentarios y likes</Text>
                    <Text style={styles.warningItem}>• Todas las imágenes que subiste</Text>
                  </View>
                </View>

                <Text style={styles.confirmationLabel}>
                  Para confirmar, escribe <Text style={styles.boldText}>ELIMINAR</Text> en el campo:
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Escribe ELIMINAR"
                  value={deleteConfirmation}
                  onChangeText={setDeleteConfirmation}
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deleteConfirmation.toLowerCase() !== 'eliminar' && styles.deleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={loading || deleteConfirmation.toLowerCase() !== 'eliminar'}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.deleteButtonText}>Eliminar mi Cuenta Permanentemente</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  formContainer: {
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    marginLeft: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFE0E0',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
  },
  dangerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dangerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  deleteContainer: {
    marginTop: 16,
  },
  warningBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  warningList: {
    alignSelf: 'stretch',
    marginLeft: 20,
  },
  warningItem: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 6,
    fontWeight: '500',
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: '700',
    color: '#FF3B30',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#FFB3B3',
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
