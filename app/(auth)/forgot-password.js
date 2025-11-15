// app/(auth)/forgot-password.js
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../src/config/supabase';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1); // 1: email, 2: código y nueva contraseña
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    // Enviar OTP usando signInWithOtp
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false,
      }
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo enviar el código. Verifica que el email esté registrado.');
    } else {
      Alert.alert(
        'Código enviado',
        'Te hemos enviado un código de 6 dígitos a tu correo electrónico.',
        [
          {
            text: 'OK',
            onPress: () => setStep(2),
          },
        ]
      );
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    // Verificar el OTP y obtener la sesión
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otpCode,
      type: 'email'
    });

    if (error) {
      setLoading(false);
      Alert.alert('Error', 'Código inválido o expirado. Por favor verifica el código.');
      return;
    }

    // Ahora que tenemos sesión válida, actualizamos la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    setLoading(false);

    if (updateError) {
      Alert.alert('Error', 'No se pudo actualizar la contraseña. Por favor intenta nuevamente.');
    } else {
      Alert.alert(
        'Contraseña actualizada',
        'Tu contraseña ha sido actualizada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Recuperar Contraseña</Text>

          <Text style={styles.subtitle}>
            {step === 1
              ? 'Ingresa tu correo electrónico para recibir un código de verificación'
              : 'Ingresa el código de 6 dígitos y tu nueva contraseña'
            }
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={step === 1 && !loading}
          />

          {step === 2 && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Código de 6 dígitos"
                placeholderTextColor="#999"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={step === 1 ? handleSendOTP : handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {step === 1 ? 'Enviar código' : 'Restablecer contraseña'}
              </Text>
            )}
          </TouchableOpacity>

          {step === 2 && (
            <TouchableOpacity
              onPress={() => {
                setStep(1);
                setOtpCode('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              disabled={loading}
            >
              <Text style={styles.linkText}>¿No recibiste el código? Reenviar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.linkText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
    padding: 20,
    minHeight: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
