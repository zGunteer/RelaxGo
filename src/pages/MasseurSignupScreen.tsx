import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, CheckCircle2, Loader2, MapPin, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import PlacesAutocomplete from '@/components/PlacesAutocomplete';

// Interface for massage types fetched from DB
interface MassageType {
  id: number; // int4 in DB
  name: string;
  description: string | null;
}

const MasseurSignupScreen = () => {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [formData, setFormData] = useState({
    bio: '',
    address: '', // Changed from latitude/longitude to address
    latitude: 0, // Store as number, will be set by PlacesAutocomplete
    longitude: 0, // Store as number, will be set by PlacesAutocomplete
    termsAccepted: false
  });
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<number>>(new Set()); // State for selected type IDs
  const [availableTypes, setAvailableTypes] = useState<MassageType[]>([]); // State for available types
  const [errors, setErrors] = useState({
    bio: '',
    address: '', // Changed from latitude/longitude to address
    selectedTypes: '', // Error for type selection
    termsAccepted: ''
  });
  const [typesLoading, setTypesLoading] = useState(true);
  const [checkingExistingApplication, setCheckingExistingApplication] = useState(true);

  // Fetch available massage types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      setTypesLoading(true);
      const { data, error } = await supabase
        .from('massage_types')
        .select('id, name, description')
        .order('name'); // Order alphabetically

      if (error) {
        console.error("Error fetching massage types:", error);
        toast.error("Could not load massage types", { description: error.message });
      } else {
        setAvailableTypes(data || []);
      }
      setTypesLoading(false);
    };

    fetchTypes();
  }, []);

  // Check for existing application on mount
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!authUser) {
        setCheckingExistingApplication(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('masseuses')
          .select('status')
          .eq('masseuse_id', authUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No application found - user can proceed with signup
            console.log("No existing application found, allowing signup");
            setCheckingExistingApplication(false);
          } else {
            console.error('Error checking existing application:', error);
            setCheckingExistingApplication(false);
          }
        } else {
          // Application exists - redirect based on status
          console.log("Existing application found with status:", data.status);
          
          if (data.status === 'pending') {
            toast.info("Application Found", { 
              description: "You already have a pending application. Redirecting to status page." 
            });
            navigate('/masseur-status');
          } else if (data.status === 'approved') {
            toast.info("Application Approved", { 
              description: "Your application is already approved. Redirecting to dashboard." 
            });
            navigate('/masseur-dashboard');
          } else if (data.status === 'rejected') {
            toast.info("Previous Application Rejected", { 
              description: "Your previous application was rejected. You can submit a new one." 
            });
            setCheckingExistingApplication(false);
          }
        }
      } catch (err) {
        console.error('Error checking application status:', err);
        setCheckingExistingApplication(false);
      }
    };

    checkExistingApplication();
  }, [authUser, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceSelect = (place: { address: string; lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      address: place.address,
      latitude: place.lat,
      longitude: place.lng
    }));
    // Clear address error when place is selected
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, termsAccepted: checked }));
    if (errors.termsAccepted) {
      setErrors(prev => ({ ...prev, termsAccepted: '' }));
    }
  };

  // Handle massage type selection change
  const handleTypeSelectChange = (typeId: number) => {
    setSelectedTypeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
    // Clear error if user selects at least one type
    if (errors.selectedTypes) {
       setErrors(prev => ({ ...prev, selectedTypes: '' }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      bio: '',
      address: '',
      selectedTypes: '',
      termsAccepted: ''
    };

    // Bio validation
    if (!formData.bio) {
      newErrors.bio = 'Bio is required';
      valid = false;
    } else if (formData.bio.length < 50) {
       newErrors.bio = 'Bio must be at least 50 characters';
       valid = false;
    }
    
    // Address validation
    if (!formData.address || formData.latitude === 0 || formData.longitude === 0) {
      newErrors.address = 'Please select a valid address from the dropdown';
      valid = false;
    }

    // Massage Type selection validation
    if (selectedTypeIds.size === 0) {
      newErrors.selectedTypes = 'Please select at least one massage type you offer';
      valid = false;
    }

    // Terms acceptance
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms to continue';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authUser) {
        toast.error("Authentication Error", { description: "You must be logged in." });
        navigate('/auth');
        return;
    }
    
    console.log("Form data before validation:", {
      bio: formData.bio,
      bioLength: formData.bio.length,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      selectedTypeIds: Array.from(selectedTypeIds),
      termsAccepted: formData.termsAccepted
    });
    
    if (validateForm()) {
      // Instead of submitting to database, pass data to documents screen
      const applicationData = {
        bio: formData.bio,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        selectedTypeIds: Array.from(selectedTypeIds),
        termsAccepted: formData.termsAccepted
      };

      console.log("About to navigate with application data:", applicationData);

      toast.success("Profile Information Saved", { 
        description: "Please proceed to upload your documents." 
      });
      
      try {
        // Navigate to documents screen with application data
        console.log("Calling navigate to /masseur-documents");
        navigate('/masseur-documents', { 
          state: { applicationData } 
        });
        console.log("Navigate call completed");
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Navigation failed", { description: "Please try again." });
      }
    } else {
      console.log("Validation failed with errors:", errors);
      toast.error("Please fix the validation errors before continuing");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Become a Masseur</h1>
      </div>

      {/* Show loading while checking existing application */}
      {checkingExistingApplication ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Checking existing application...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Form */}
          <div className="flex-1 p-4">
            <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-medium text-gray-900">Your Masseur Profile</h2>
                  <p className="text-sm text-gray-500">Provide details about your services and location.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg p-5 shadow-sm space-y-6">
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Tell clients about yourself, your experience, and your massage style (minimum 50 characters)."
                  value={formData.bio}
                  onChange={handleInputChange}
                  className={`block w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.bio ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Address</label>
                <PlacesAutocomplete
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Start typing your address..."
                  error={errors.address}
                  defaultValue={formData.address}
                />
                <p className="mt-1 text-xs text-gray-500">Search and select your address from the dropdown suggestions.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Massage Types Offered</label>
                {typesLoading ? (
                  <div className="flex items-center text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading types...
                  </div>
                ) : availableTypes.length === 0 ? (
                  <p className="text-sm text-gray-500">No massage types found.</p>
                ) : (
                  <div className="space-y-2">
                    {availableTypes.map((type) => (
                      <div key={type.id} className="flex items-center">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={selectedTypeIds.has(type.id)}
                          onCheckedChange={() => handleTypeSelectChange(type.id)}
                        />
                        <label htmlFor={`type-${type.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                          {type.name}
                          {type.description && <span className="text-xs text-gray-500 ml-1">- {type.description}</span>}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {errors.selectedTypes && <p className="mt-1 text-sm text-red-600">{errors.selectedTypes}</p>}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <Checkbox 
                    id="terms" 
                    checked={formData.termsAccepted}
                    onCheckedChange={handleCheckboxChange}
                    className={`${errors.termsAccepted ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the <button type="button" className="text-blue-600 hover:underline underline bg-transparent border-none p-0 cursor-pointer">Terms of Service</button> and <button type="button" className="text-blue-600 hover:underline underline bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
                  </label>
                  {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={typesLoading}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Continue to Document Upload
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default MasseurSignupScreen; 