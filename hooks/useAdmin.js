// hooks/useAdmin.js
import { useEffect, useState } from 'react';
import { supabase } from '../src/config/supabase';
import { useAuth } from './useAuth';

export const useAdmin = () => {
  const [allReports, setAllReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchAllReports();
      fetchStats();
    }
  }, [isAdmin]);

  // Obtener todos los reportes (sin filtro de aprobación)
  const fetchAllReports = async () => {
    try {
      setLoading(true);
      console.log('📥 Admin: Fetching all reports...');

      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          ),
          report_images (
            id,
            image_url
          ),
          likes (count),
          reviews (count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Admin: Error fetching reports:', error);
        throw error;
      }

      console.log(`✅ Admin: Fetched ${data?.length || 0} reports`);
      setAllReports(data || []);
    } catch (error) {
      console.error('❌ Admin: Error fetching all reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status, is_approved');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(r => !r.is_approved && r.status === 'pending').length,
        approved: data.filter(r => r.is_approved).length,
        rejected: data.filter(r => r.status === 'rejected').length,
        reviewing: data.filter(r => r.status === 'reviewing').length,
        resolved: data.filter(r => r.status === 'resolved').length,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Aprobar un reporte
  const approveReport = async (reportId) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          is_approved: true,
          status: 'reviewing',
          approved_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, ...data } : report
        )
      );

      await fetchStats();
      return { data, error: null };
    } catch (error) {
      console.error('Error approving report:', error);
      return { data: null, error };
    }
  };

  // Rechazar un reporte
  const rejectReport = async (reportId, reason = null) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          is_approved: false,
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, ...data } : report
        )
      );

      await fetchStats();
      return { data, error: null };
    } catch (error) {
      console.error('Error rejecting report:', error);
      return { data: null, error };
    }
  };

  // Cambiar estado de un reporte
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, ...data } : report
        )
      );

      await fetchStats();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating report status:', error);
      return { data: null, error };
    }
  };

  // Actualizar cualquier campo de un reporte
  const updateReport = async (reportId, updates) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setAllReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, ...data } : report
        )
      );

      return { data, error: null };
    } catch (error) {
      console.error('Error updating report:', error);
      return { data: null, error };
    }
  };

  // Eliminar un reporte (admin)
  const deleteReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Actualizar lista local
      setAllReports(prev => prev.filter(report => report.id !== reportId));

      await fetchStats();
      return { error: null };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { error };
    }
  };

  // Filtrar reportes por estado
  const filterReportsByStatus = (status) => {
    if (!status || status === 'all') {
      return allReports;
    }

    if (status === 'pending_approval') {
      return allReports.filter(r => !r.is_approved && r.status === 'pending');
    }

    return allReports.filter(r => r.status === status);
  };

  return {
    allReports,
    stats,
    loading,
    isAdmin,
    fetchAllReports,
    approveReport,
    rejectReport,
    updateReportStatus,
    updateReport,
    deleteReport,
    filterReportsByStatus,
  };
};
