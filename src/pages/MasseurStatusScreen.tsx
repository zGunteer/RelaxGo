import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface MasseurApplication {
  status: 'pending' | 'approved' | 'rejected';
  bio: string;
  location_lat: number;
  location_long: number;
}

const MasseurStatusScreen = () => {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [application, setApplication] = useState<MasseurApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (!authUser) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('masseuses')
          .select('status, bio, location_lat, location_long')
          .eq('masseuse_id', authUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No application found
            setApplication(null);
          } else {
            console.error('Error fetching application:', error);
            toast.error('Error loading application status');
          }
        } else {
          setApplication(data);
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error('Error loading application status');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStatus();
  }, [authUser, navigate]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: 'Application Under Review',
          description: 'Your masseur application is being reviewed by our admin team. We\'ll notify you once a decision is made.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: 'Application Approved!',
          description: 'Congratulations! Your masseur application has been approved. You can now access the masseur dashboard.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: 'Application Rejected',
          description: 'Unfortunately, your masseur application was not approved at this time. You can submit a new application if you\'d like to try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
          title: 'Unknown Status',
          description: 'There was an issue loading your application status.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading application status...</span>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 ml-4">Masseur Application</h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-sm max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Application Found</h2>
            <p className="text-gray-600 mb-6">
              You haven't submitted a masseur application yet. Would you like to apply to become a masseur?
            </p>
            <Button 
              onClick={() => navigate('/masseur-signup')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply to Become a Masseur
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate('/home')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Application Status</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className={`bg-white rounded-lg p-8 shadow-sm border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
          <div className="text-center">
            <div className="mb-4">
              {statusInfo.icon}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
              {statusInfo.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {statusInfo.description}
            </p>

            {application.status === 'approved' && (
              <Button 
                onClick={() => navigate('/masseur-dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white mb-4"
              >
                Go to Masseur Dashboard
              </Button>
            )}

            {application.status === 'rejected' && (
              <Button 
                onClick={() => navigate('/masseur-signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white mb-4"
              >
                Submit New Application
              </Button>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <p className="text-sm text-gray-600 mt-1">{application.bio}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="text-sm text-gray-600 mt-1">
                {application.location_lat.toFixed(6)}, {application.location_long.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasseurStatusScreen; 