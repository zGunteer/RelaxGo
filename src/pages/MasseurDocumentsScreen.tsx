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
  Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const initialFormData = location.state?.initialFormData || {};
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    languages: '',
    ...initialFormData
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
    languages: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm() && allDocumentsUploaded()) {
      // Navigate to the status screen instead of showing a toast
      navigate('/masseur-status');
    } else if (!allDocumentsUploaded()) {
      toast.error('Please upload all required documents');
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
              disabled={!allDocumentsUploaded()}
            >
              <Send className="mr-2 h-5 w-5" />
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasseurDocumentsScreen; 