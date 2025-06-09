import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { addMasseurRole, removeMasseurRole } from '@/services/MasseurService';

interface MasseurApplication {
  masseuse_id: string;
  bio: string;
  location_lat: number;
  location_long: number;
  address: string;
  first_name: string;
  last_name: string;
  phone: string;
  massage_types: string[];
  status: 'pending' | 'approved' | 'rejected';
}

const AdminMasseurApplicationsScreen = () => {
  const navigate = useNavigate();
  const { authUser, userProfile } = useAuth();
  const [applications, setApplications] = useState<MasseurApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<MasseurApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApplication, setSelectedApplication] = useState<MasseurApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Wait for user profile to load
  useEffect(() => {
    if (userProfile !== undefined) {
      setProfileLoading(false);
    }
  }, [userProfile]);

  // Check if user is admin only after profile is loaded  
  useEffect(() => {
    if (!profileLoading && userProfile) {
      const userRoles = userProfile.roles || (userProfile.role ? [userProfile.role] : ['client']);
      const isAdmin = userRoles.includes('admin');
      
      if (!isAdmin) {
        navigate('/unauthorized');
      }
    }
  }, [profileLoading, userProfile, navigate]);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('masseuses')
          .select(`
            masseuse_id,
            bio,
            location_lat,
            location_long,
            address,
            first_name,
            last_name,
            phone,
            massage_types,
            status
          `)
          .order('masseuse_id', { ascending: false });

        if (error) {
          console.error('Error fetching applications:', error);
          toast.error('Error loading applications', { description: error.message });
        } else {
          setApplications(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error('An unexpected error occurred while loading applications.');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      const userRoles = userProfile.roles || (userProfile.role ? [userProfile.role] : ['client']);
      const isAdmin = userRoles.includes('admin');
      
      if (isAdmin) {
        fetchApplications();
      } else {
        // If userProfile is loaded but not admin, stop loading
        setLoading(false);
      }
    }
  }, [userProfile]);

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.first_name && app.first_name.toLowerCase().includes(lowercasedTerm)) ||
        (app.last_name && app.last_name.toLowerCase().includes(lowercasedTerm)) ||
        (app.phone && app.phone.includes(lowercasedTerm)) ||
        (app.bio && app.bio.toLowerCase().includes(lowercasedTerm))
      );
    }

    setFilteredApplications(filtered);
  }, [applications, statusFilter, searchTerm]);

  const handleApproval = async (masseuseId: string, approve: boolean) => {
    setActionLoading(masseuseId);
    try {
      const newStatus = approve ? 'approved' : 'rejected';
      
      // Update masseur application status
      const { error: statusError } = await supabase
        .from('masseuses')
        .update({ status: newStatus })
        .eq('masseuse_id', masseuseId);

      if (statusError) throw statusError;

      // Update user roles based on approval/rejection
      if (approve) {
        // Add masseur role to user
        const roleSuccess = await addMasseurRole(masseuseId);
        if (!roleSuccess) {
          toast.warning('Application approved, but adding masseur role failed.');
        }
      } else {
        // Remove masseur role from user (in case they were previously approved)
        const roleSuccess = await removeMasseurRole(masseuseId);
        if (!roleSuccess) {
          console.warn('Failed to remove masseur role, but this may be expected if user didn\'t have the role.');
        }
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.masseuse_id === masseuseId ? { ...app, status: newStatus } : app
      ));

      toast.success(`Application has been ${newStatus}${approve ? ' and masseur role added' : ''}.`);
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application', { description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const FilterButton = ({ value, label }: { value: 'all' | 'pending' | 'approved' | 'rejected', label: string }) => (
    <Button
      variant={statusFilter === value ? 'default' : 'outline'}
      size="sm"
      onClick={() => setStatusFilter(value)}
      className="capitalize"
    >
      {label}
    </Button>
  );

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span className="text-lg">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white px-4 py-4 flex items-center border-b border-gray-200 sticky top-0 z-10">
        <Button onClick={() => navigate(-1)} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900 ml-4">Masseur Applications</h1>
      </header>

      <main className="flex-1">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, phone, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <FilterButton value="all" label="All" />
              <FilterButton value="pending" label="Pending" />
              <FilterButton value="approved" label="Approved" />
              <FilterButton value="rejected" label="Rejected" />
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-800">No applications found</h3>
              <p className="text-gray-500 mt-1">There are no applications matching your current filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((app) => (
                <Card key={app.masseuse_id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">
                        {app.first_name} {app.last_name}
                      </CardTitle>
                      <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{app.phone}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{app.bio}</p>
                    <div className="flex items-center justify-end gap-2">
                       <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                             <Eye className="mr-2 h-4 w-4" />
                             View Details
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-3xl">
                           <DialogHeader>
                             <DialogTitle>Application Details</DialogTitle>
                           </DialogHeader>
                           {selectedApplication && (
                            <div className="space-y-4 py-4 text-sm">
                               <h3 className="text-lg font-semibold">{selectedApplication.first_name} {selectedApplication.last_name}</h3>
                               <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                               <p><strong>Bio:</strong> {selectedApplication.bio}</p>
                               <p><strong>Address:</strong> {selectedApplication.address}</p>
                               <div>
                                 <strong>Massage Types:</strong>
                                 <ul className="list-disc list-inside pl-4 mt-1">
                                   {selectedApplication.massage_types.map((mt, i) => (
                                    <li key={i}>{mt}</li>
                                   ))}
                                 </ul>
                               </div>
                             </div>
                           )}
                         </DialogContent>
                       </Dialog>

                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300"
                            onClick={() => handleApproval(app.masseuse_id, false)}
                            disabled={actionLoading === app.masseuse_id}
                          >
                            <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", { hidden: actionLoading !== app.masseuse_id })} />
                            <XCircle className={cn("mr-2 h-4 w-4", { hidden: actionLoading === app.masseuse_id })} />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproval(app.masseuse_id, true)}
                            disabled={actionLoading === app.masseuse_id}
                          >
                            <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", { hidden: actionLoading !== app.masseuse_id })} />
                            <CheckCircle className={cn("mr-2 h-4 w-4", { hidden: actionLoading === app.masseuse_id })} />
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminMasseurApplicationsScreen; 