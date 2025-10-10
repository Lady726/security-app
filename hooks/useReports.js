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
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReports((prev) =>
              prev.map((report) =>
                report.id === payload.new.id ? payload.new : report
              )
            );
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

  const fetchReports = async () => {
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
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
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
      
      // Determinar extensión del archivo
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
      
  // Leer la URI como ArrayBuffer (React Native no tiene response.blob())
const response = await fetch(uri);
const arrayBuffer = await response.arrayBuffer(); // ✅ disponible en RN
const finalBody = arrayBuffer; // Supabase acepta ArrayBuffer directamente

// Subir a Supabase Storage
const { data, error } = await supabase.storage
  .from('report-images')
  .upload(fileName, finalBody, {
    contentType: mimeType,
    cacheControl: '3600',
    upsert: false,
  });

      
      if (error) {
        console.error('ERROR STORAGE:', JSON.stringify(error, null, 2));
        
        // Si el error es de archivo duplicado, intentar con otro nombre
        if (error.message && error.message.includes('already exists')) {
          const newFileName = `${reportId}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          console.log('Intentando con nuevo nombre:', newFileName);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('report-images')
            .upload(newFileName, finalBlob, {
              contentType: mimeType,
              cacheControl: '3600',
              upsert: false,
            });
          
          if (retryError) throw retryError;
          
          // Actualizar fileName para obtener la URL correcta
          Object.assign(data || {}, retryData);
          fileName = newFileName;
        } else {
          throw error;
        }
      }
      
      console.log('STORAGE OK:', data);
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('report-images')
        .getPublicUrl(fileName);
      
      console.log('URL pública:', publicUrl);
      
      // Guardar referencia en la base de datos
      const { data: dbData, error: dbError } = await supabase
        .from('report_images')
        .insert({ 
          report_id: reportId, 
          image_url: publicUrl 
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('ERROR DB:', JSON.stringify(dbError, null, 2));
        
        // Si hubo error en DB, intentar eliminar el archivo de storage
        await supabase.storage
          .from('report-images')
          .remove([fileName]);
        
        throw dbError;
      }
      
      console.log('DB OK:', dbData);
      console.log('=== FIN SUBIDA EXITOSA ===');
      
      return { data: dbData, error: null };
    } catch (error) {
      console.error('=== ERROR COMPLETO ===');
      console.error('Mensaje:', error.message || 'Error desconocido');
      console.error('Detalles:', error);
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