// src/hooks/useReports.js
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: 'is_approved=eq.true' },
        (payload) => {
          console.log('📡 Cambio en reportes:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Cargar el reporte completo con sus relaciones
            fetchSingleReport(payload.new.id).then((report) => {
              if (report) {
                setReports((prev) => [report, ...prev]);
              }
            });
          } else if (payload.eventType === 'UPDATE') {
            // Si un reporte fue aprobado, agregarlo a la lista
            if (payload.new.is_approved && !payload.old.is_approved) {
              fetchSingleReport(payload.new.id).then((report) => {
                if (report) {
                  setReports((prev) => [report, ...prev]);
                }
              });
            } else {
              // Actualizar reporte existente
              setReports((prev) =>
                prev.map((report) =>
                  report.id === payload.new.id ? { ...report, ...payload.new } : report
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setReports((prev) =>
              prev.filter((report) => report.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSingleReport = async (reportId) => {
    try {
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
        .eq('id', reportId)
        .eq('is_approved', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching single report:', error);
      return null;
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching reports...');
      
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
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching reports:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} approved reports`);
      console.log('📊 Sample report:', data?.[0]);
      
      setReports(data || []);
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            ...reportData,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating report:', error);
      return { data: null, error };
    }
  };

  const updateReport = async (reportId, updates) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating report:', error);
      return { data: null, error };
    }
  };

  const deleteReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { error };
    }
  };

  const uploadReportImage = async (reportId, uri) => {
    try {
      console.log('=== INICIO SUBIDA ===');
      console.log('Report ID:', reportId);
      console.log('URI:', uri);
      
      // Determinar extensión y tipo MIME
      const fileExt = uri.split('.').pop().toLowerCase();
      const mimeType = fileExt === 'png' ? 'image/png' : 
                       fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' :
                       fileExt === 'gif' ? 'image/gif' : 
                       fileExt === 'webp' ? 'image/webp' : 'image/jpeg';
      
      console.log('Extensión:', fileExt, 'MIME:', mimeType);
      
      // Nombre único del archivo
      const timestamp = Date.now();
      const fileName = `${reportId}/${timestamp}.${fileExt}`;
      console.log('Nombre archivo:', fileName);
      
      // Método alternativo: usar XMLHttpRequest para leer el archivo
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          resolve(xhr.response);
        };
        xhr.onerror = function() {
          reject(new Error('Error al leer el archivo'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });
      
      console.log('Blob creado:', blob.size, 'bytes');
      
      // Convertir blob a ArrayBuffer y luego a Uint8Array
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      
      const bytes = new Uint8Array(arrayBuffer);
      console.log('Bytes creados:', bytes.length);
      
      // Subir a Storage
      const { data, error } = await supabase.storage
        .from('report-images')
        .upload(fileName, bytes, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) {
        console.error('ERROR STORAGE:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('STORAGE OK:', data);
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('report-images')
        .getPublicUrl(fileName);
      
      console.log('URL:', publicUrl);
      
      // Guardar en DB
      const { data: dbData, error: dbError } = await supabase
        .from('report_images')
        .insert({ report_id: reportId, image_url: publicUrl })
        .select()
        .single();
      
      if (dbError) {
        console.error('ERROR DB:', JSON.stringify(dbError, null, 2));
        throw dbError;
      }
      
      console.log('DB OK:', dbData);
      console.log('=== FIN SUBIDA EXITOSA ===');
      
      return { data: dbData, error: null };
    } catch (error) {
      console.error('=== ERROR COMPLETO ===');
      console.error(error.message || error);
      return { data: null, error };
    }
  };

  const toggleLike = async (reportId) => {
    try {
      // Verificar si ya existe un like
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Eliminar like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        return { liked: false, error: null };
      } else {
        // Agregar like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              report_id: reportId,
              user_id: user.id,
            },
          ]);

        if (error) throw error;
        return { liked: true, error: null };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return { liked: null, error };
    }
  };

  const addReview = async (reportId, comment, rating = null) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            report_id: reportId,
            user_id: user.id,
            comment,
            rating,
          },
        ])
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error adding review:', error);
      return { data: null, error };
    }
  };

  const getReportReviews = async (reportId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { data: null, error };
    }
  };

  return {
    reports,
    loading,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    uploadReportImage,
    toggleLike,
    addReview,
    getReportReviews,
  };
};

