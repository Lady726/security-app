// app/report-details/[id].js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useReports } from '../../hooks/useReports';
import { supabase } from '../../src/config/supabase';

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

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toggleLike, addReview, getReportReviews } = useReports();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchReportDetails();
    fetchReviews();
    checkIfLiked();
  }, [id]);

  const fetchReportDetails = async () => {
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
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setReport(data);

      // Contar likes
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('report_id', id);

      setLikesCount(likesCount || 0);
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'No se pudo cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await getReportReviews(id);
      if (error) throw error;
      setReviews(data || []);
      setReviewsCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('report_id', id)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // No existe like, está bien
      setIsLiked(false);
    }
  };

  const handleLike = async () => {
    try {
      const { liked, error } = await toggleLike(id);
      if (error) throw error;

      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'No se pudo dar like');
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    try {
      setSubmittingComment(true);
      const { data, error } = await addReview(id, comment.trim());
      
      if (error) throw error;

      // Agregar el comentario a la lista
      setReviews([data, ...reviews]);
      setReviewsCount(prev => prev + 1);
      setComment('');
      
      Alert.alert('Éxito', 'Comentario agregado');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'No se pudo agregar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `Hace ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        {item.profiles?.avatar_url ? (
          <Image
            source={{ uri: item.profiles.avatar_url }}
            style={styles.reviewAvatar}
          />
        ) : (
          <View style={styles.reviewAvatarPlaceholder}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.reviewHeaderText}>
          <Text style={styles.reviewAuthor}>
            {item.profiles?.full_name || 'Usuario'}
          </Text>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Reporte no encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[report.category] || '#8E8E93';
  const categoryLabel = CATEGORY_LABELS[report.category] || report.category;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header con botón de volver */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Reporte</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Galería de imágenes */}
        {report.report_images && report.report_images.length > 0 ? (
          <View style={styles.imageGallery}>
            <Image
              source={{ uri: report.report_images[selectedImageIndex].image_url }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            {report.report_images.length > 1 && (
              <View style={styles.imageThumbnails}>
                {report.report_images.map((img, index) => (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      source={{ uri: img.image_url }}
                      style={[
                        styles.thumbnail,
                        selectedImageIndex === index && styles.thumbnailActive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.noImagePlaceholder, { backgroundColor: categoryColor }]}>
            <Ionicons name="image-outline" size={64} color="#fff" />
          </View>
        )}

        {/* Información del reporte */}
        <View style={styles.content}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>

          <Text style={styles.title}>{report.title}</Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="person-circle-outline" size={18} color="#666" />
              <Text style={styles.metaText}>
                {report.profiles?.full_name || 'Usuario'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.metaText}>{formatDate(report.created_at)}</Text>
            </View>
          </View>

          <Text style={styles.description}>{report.description}</Text>

          {report.address && (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Ubicación</Text>
                <Text style={styles.locationText}>{report.address}</Text>
                <Text style={styles.coordinates}>
                  {parseFloat(report.latitude).toFixed(6)}, {parseFloat(report.longitude).toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonLiked]}
              onPress={handleLike}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#FF3B30' : '#666'}
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              <Text style={styles.actionText}>
                {reviewsCount} {reviewsCount === 1 ? 'Comentario' : 'Comentarios'}
              </Text>
            </View>
          </View>

          {/* Sección de comentarios */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comentarios ({reviewsCount})
            </Text>

            {/* Input para agregar comentario */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Escribe un comentario..."
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  (!comment.trim() || submittingComment) && styles.commentSubmitButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!comment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Lista de comentarios */}
            {reviews.length > 0 ? (
              <FlatList
                data={reviews}
                keyExtractor={(item) => item.id}
                renderItem={renderReview}
                scrollEnabled={false}
                style={styles.reviewsList}
              />
            ) : (
              <View style={styles.noComments}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.noCommentsText}>
                  No hay comentarios aún
                </Text>
                <Text style={styles.noCommentsSubtext}>
                  Sé el primero en comentar
                </Text>
              </View>
            )}
          </View>
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
  headerBackButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    backgroundColor: '#000',
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  imageThumbnails: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  locationCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonLiked: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  actionTextLiked: {
    color: '#FF3B30',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 50,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commentSubmitButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});