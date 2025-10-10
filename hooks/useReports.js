// src/hooks/useReports.js
import { useEffect, useState } from 'react';
import { supabase } from '../src/config/supabase';
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
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${reportId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('report-images')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('report_images')
        .insert([
          {
            report_id: reportId,
            image_url: publicUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error uploading image:', error);
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