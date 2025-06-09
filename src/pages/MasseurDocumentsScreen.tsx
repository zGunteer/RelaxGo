import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Check, 
  X, 
  AlertCircle,
  Globe,
  User,
  Send,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface DocumentState {
  certificatCalificare: boolean;
  carteIdentitate: boolean;
  formaLegala: boolean;
  asigurare: boolean;
  cazierJudiciar: boolean;
  pozaEchipament: boolean;
}

const DocumentUploadItem = ({ 
  label, 
  name, 
  isUploaded, 
  onUpload 
}: { 
  label: string; 
  name: string; 
  isUploaded: boolean; 
  onUpload: (name: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center mr-3",
          isUploaded ? "bg-green-100" : "bg-gray-100"
        )}>
          {isUploaded ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
        </div>
        <span className="text-gray-800">{label}</span>
      </div>
      <Button
        type="button"
        variant={isUploaded ? "outline" : "default"}
        size="sm"
        className={isUploaded ? "text-green-600 border-green-200" : ""}
        onClick={() => onUpload(name)}
      >
        {isUploaded ? (
          <>
            <Check className="mr-1 h-4 w-4" />
            Uploaded
          </>
        ) : (
          <>
            <Upload className="mr-1 h-4 w-4" />
            Upload
          </>
        )}
      </Button>
    </div>
  );
};

const MasseurDocumentsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser } = useAuth();
  
  // Get application data passed from signup screen
  const applicationData = location.state?.applicationData;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    languages: ''
  });

  const [documents, setDocuments] = useState<DocumentState>({
    certificatCalificare: false,
    carteIdentitate: false,
    formaLegala: false,
    asigurare: false,
    cazierJudiciar: false,
    pozaEchipament: false
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    languages: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect if no application data
  useEffect(() => {
    console.log("MasseurDocumentsScreen mounted");
    console.log("Full location object:", location);
    console.log("Location state:", location.state);
    console.log("Application data received:", applicationData);
    console.log("Type of applicationData:", typeof applicationData);
    console.log("Is applicationData truthy?", !!applicationData);
    
    // Add a small delay to ensure state is properly set
    const checkData = setTimeout(() => {
      console.log("Delayed check - applicationData:", applicationData);
      
      setDataLoading(false);
      
      if (!applicationData) {
        console.log("No application data found, redirecting to signup");
        toast.error("No application data found. Please start from the beginning.");
        navigate('/masseur-signup');
      } else {
        console.log("Application data found, staying on documents screen");
      }
    }, 100);

    return () => clearTimeout(checkData);
  }, [applicationData, navigate, location.state]);

  // Show loading while checking for application data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading application data...</span>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDocumentUpload = (name: string) => {
    // Simply mark the document as uploaded without showing a toast
    setDocuments(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      phone: '',
      languages: ''
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      valid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    }

    if (!formData.languages.trim()) {
      newErrors.languages = 'Please specify at least one language';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const allDocumentsUploaded = () => {
    return Object.values(documents).every(value => value === true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== STARTING FORM SUBMISSION ===");
    
    if (!authUser) {
      console.error("No authenticated user found");
      toast.error("Authentication Error", { description: "You must be logged in." });
      navigate('/auth');
      return;
    }

    if (!applicationData) {
      console.error("No application data found");
      toast.error("No application data found");
      return;
    }
    
    console.log("Application data received:", applicationData);
    console.log("Form data:", formData);
    console.log("Documents:", documents);
    
    if (!validateForm() || !allDocumentsUploaded()) {
      if (!allDocumentsUploaded()) {
        console.error("Not all documents uploaded");
        toast.error('Please upload all required documents');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("=== PREPARING DATABASE INSERT ===");
      
      // Get massage type names from IDs
      const { data: massageTypesData } = await supabase
        .from('massage_types')
        .select('id, name')
        .in('id', applicationData.selectedTypeIds);
      
      const massageTypeNames = massageTypesData?.map(type => type.name) || [];
      
      // 1. Prepare data for masseuses table with all information
      const masseuseData = {
        masseuse_id: authUser.id, 
        bio: applicationData.bio,
        location_lat: applicationData.latitude,
        location_long: applicationData.longitude,
        address: applicationData.address,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        massage_types: massageTypeNames,
        is_available: false,
        status: 'pending',
        documents: {
          ...documents,
          languages: formData.languages
        }
      };

      console.log("Masseur data to insert:", masseuseData);

      // 2. Insert into masseuses table
      console.log("=== INSERTING INTO MASSEUSES TABLE ===");
      const { data: insertedData, error: masseuseError } = await supabase
        .from('masseuses')
        .insert([masseuseData])
        .select(); 

      console.log("Insert result:", { data: insertedData, error: masseuseError });

      if (masseuseError) {
        console.error("Masseur insert error:", masseuseError);
        if (masseuseError.code === '23505') { 
          toast.error("Application Failed", { description: "Masseur application already exists for this user." });
        } else {
          toast.error("Application Failed", { description: `Error saving application: ${masseuseError.message}` });
        }
        throw masseuseError;
      }

      console.log("=== MASSEUR INSERTED SUCCESSFULLY ===");

      // 3. Also insert into masseuse_massage_types for backward compatibility
      const typesToInsert = applicationData.selectedTypeIds.map((typeId: number) => ({
        masseuse_id: authUser.id,
        massage_type_id: typeId,
      }));

      if (typesToInsert.length > 0) {
        await supabase
          .from('masseuse_massage_types')
          .insert(typesToInsert);
      }

      console.log("=== APPLICATION SUBMISSION COMPLETE ===");

      toast.success("Application Submitted", { 
        description: "Your masseur application has been submitted for review." 
      });
      
      navigate('/masseur-status');
      
    } catch (err) {
      console.error("=== APPLICATION SUBMISSION ERROR ===", err);
      toast.error("Submission failed", { description: "Please try again." });
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-lg font-semibold text-gray-900 ml-4">Complete Your Profile</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`${errors.firstName ? 'border-red-500' : ''}`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  type="text"
                  name="phone"
                  placeholder="123-456-7890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Languages Spoken
                </label>
                <Input
                  type="text"
                  name="languages"
                  placeholder="Romanian, English, etc."
                  value={formData.languages}
                  onChange={handleInputChange}
                  className={`${errors.languages ? 'border-red-500' : ''}`}
                />
                {errors.languages && (
                  <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Separate multiple languages with commas</p>
              </div>
            </div>
          </div>
          
          {/* Document Uploads */}
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Required Documents
            </h2>
            <p className="text-sm text-gray-500 mb-4">All documents must be uploaded to submit your application</p>
            
            <div className="space-y-3">
              <DocumentUploadItem 
                label="Certificat de calificare" 
                name="certificatCalificare"
                isUploaded={documents.certificatCalificare}
                onUpload={handleDocumentUpload}
              />
              
              <DocumentUploadItem 
                label="Carte de identitate" 
                name="carteIdentitate"
                isUploaded={documents.carteIdentitate}
                onUpload={handleDocumentUpload}
              />
              
              <DocumentUploadItem 
                label="Forma legală (PFA/PFI/SRL)" 
                name="formaLegala"
                isUploaded={documents.formaLegala}
                onUpload={handleDocumentUpload}
              />
              
              <DocumentUploadItem 
                label="Asigurare de răspundere profesională" 
                name="asigurare"
                isUploaded={documents.asigurare}
                onUpload={handleDocumentUpload}
              />
              
              <DocumentUploadItem 
                label="Certificat de cazier judiciar" 
                name="cazierJudiciar"
                isUploaded={documents.cazierJudiciar}
                onUpload={handleDocumentUpload}
              />
              
              <DocumentUploadItem 
                label="Poză echipament" 
                name="pozaEchipament"
                isUploaded={documents.pozaEchipament}
                onUpload={handleDocumentUpload}
              />
            </div>
          </div>
          
          {/* Submit Button - Fixed at Bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            {!allDocumentsUploaded() && (
              <div className="flex items-center justify-center mb-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">All documents must be uploaded to continue</span>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!allDocumentsUploaded() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasseurDocumentsScreen; 