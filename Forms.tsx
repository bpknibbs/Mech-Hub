import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import { useAuth } from './src/contexts/AuthContext';
import { createDefaultTemplates } from './src/utils/defaultFormTemplates';
import { createDomesticLgsrTemplate } from './src/utils/domesticLgsrTemplate';
import { createNonDomesticLgsrTemplate } from './src/utils/nonDomesticLgsrTemplate';
import {
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface FormTemplate {
  id: string;
  form_template_id: string;
  asset_type: string;
  title: string;
  fields: FormField[];
  created_at: string;
  updated_at: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
  required: boolean;
  options?: string[];
}

interface FormSubmission {
  id: string;
  form_submission_id: string;
  task_id?: string;
  asset_id?: string;
  engineer_id?: string;
  submission_date: string;
  responses: any;
  photos?: string[];
  engineer_signature?: string;
  client_signature?: string;
  emailed_to?: string[];
  status: string;
  assets?: {
    "Asset Name": string;
    "Asset ID": string;
    "Asset Type": string;
  };
  team?: {
    "Name": string;
    "Email": string;
  };
  form_templates?: {
    title: string;
    fields: FormField[];
  };
}

const Forms: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'submissions'>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [defaultTemplateResult, setDefaultTemplateResult] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailingSubmission, setEmailingSubmission] = useState<FormSubmission | null>(null);
  const [creatingDomesticLgsr, setCreatingDomesticLgsr] = useState(false);
  const [domesticLgsrResult, setDomesticLgsrResult] = useState<string>('');
  const [creatingNonDomesticLgsr, setCreatingNonDomesticLgsr] = useState(false);
  const [nonDomesticLgsrResult, setNonDomesticLgsrResult] = useState<string>('');
  
  const [newTemplate, setNewTemplate] = useState({
    form_template_id: '',
    asset_type: '',
    title: '',
    fields: [] as FormField[]
  });

  const isAdmin = userProfile?.Role === 'Admin';
  const canCreateTemplates = isAdmin || userProfile?.Role === 'Access All';

  useEffect(() => {
    fetchTemplates();
    fetchSubmissions();
  }, [userProfile]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // Verify Supabase connection first
      const { error: healthError } = await supabase
        .from('form_submissions')
        .select('count', { count: 'exact', head: true });

      if (healthError) {
        console.error('Supabase connection error:', healthError);
        throw new Error(`Database connection failed: ${healthError.message}`);
      }

      const { data, error } = await supabase
        .from('form_submissions')
        .select(`
          *,
          assets("Asset Name"),
          team("Name")
        `)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // More specific error handling
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - check Supabase project status and internet connection');
        // Retry after a delay
        setTimeout(() => {
          console.log('Retrying submission fetch...');
          fetchSubmissions();
        }, 5000);
      }
    }
  };

  const handleSendEmail = (submission: FormSubmission) => {
    setEmailingSubmission(submission);
    setEmailAddress('');
    setShowEmailModal(true);
  };

  const submitEmailRequest = async () => {
    if (!emailingSubmission || !emailAddress) return;

    try {
      setSendingEmail(emailingSubmission.id);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_SUPABASE_JWT`, // Use a real JWT token here, not anon key
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: emailingSubmission.id,
          emailAddress: emailAddress
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`PDF generated successfully!\n\nNote: This is a demo system. To receive actual emails, you need to configure an email service provider like Resend or SendGrid.\n\nThe PDF has been logged in the system.`);
        setShowEmailModal(false);
        setEmailingSubmission(null);
        setEmailAddress('');
        fetchSubmissions(); // Refresh to show updated email history
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleCreateDomesticLgsr = async () => {
    setCreatingDomesticLgsr(true);
    setDomesticLgsrResult('Creating comprehensive domestic LGSR template...');
    try {
      const result = await createDomesticLgsrTemplate();
      if (result.success) {
        setDomesticLgsrResult('Domestic LGSR template created successfully!');
        fetchTemplates();
      } else {
        setDomesticLgsrResult(`Error: ${result.error}`);
      }
      setTimeout(() => setDomesticLgsrResult(''), 5000);
    } catch (error) {
      setDomesticLgsrResult('Error creating domestic LGSR template');
      setTimeout(() => setDomesticLgsrResult(''), 5000);
    } finally {
      setCreatingDomesticLgsr(false);
    }
  };

  const handleCreateNonDomesticLgsr = async () => {
    setCreatingNonDomesticLgsr(true);
    setNonDomesticLgsrResult('Creating comprehensive non-domestic LGSR template...');
    try {
      const result = await createNonDomesticLgsrTemplate();
      if (result.success) {
        setNonDomesticLgsrResult('Non-domestic LGSR template created successfully!');
        fetchTemplates();
      } else {
        setNonDomesticLgsrResult(`Error: ${result.error}`);
      }
      setTimeout(() => setNonDomesticLgsrResult(''), 5000);
    } catch (error) {
      setNonDomesticLgsrResult('Error creating non-domestic LGSR template');
      setTimeout(() => setNonDomesticLgsrResult(''), 5000);
    } finally {
      setCreatingNonDomesticLgsr(false);
    }
  };
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('form_templates')
        .insert([newTemplate]);

      if (error) throw error;

      setNewTemplate({
        form_template_id: '',
        asset_type: '',
        title: '',
        fields: []
      });
      setShowTemplateForm(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      form_template_id: template.form_template_id,
      asset_type: template.asset_type,
      title: template.title,
      fields: template.fields
    });
    setShowTemplateForm(true);
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('form_templates')
        .update({
          asset_type: newTemplate.asset_type,
          title: newTemplate.title,
          fields: newTemplate.fields,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      setNewTemplate({
        form_template_id: '',
        asset_type: '',
        title: '',
        fields: []
      });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleCreateDefaults = async () => {
    setCreatingDefaults(true);
    setDefaultTemplateResult('Creating default templates...');
    try {
      const result = await createDefaultTemplates();
      if (result.created > 0) {
        setDefaultTemplateResult(`Created ${result.created} default templates successfully!`);
        fetchTemplates();
      } else {
        if (result.errors.length > 0) {
          setDefaultTemplateResult(`Error: ${result.errors.join(', ')}`);
        } else {
          setDefaultTemplateResult('All default templates already exist');
        }
      }
      if (result.errors.length > 0) {
        setDefaultTemplateResult(`Errors occurred: ${result.errors.join(', ')}`);
      }
      setTimeout(() => setDefaultTemplateResult(''), 5000);
    } catch (error) {
      setDefaultTemplateResult('Error creating default templates');
      setTimeout(() => setDefaultTemplateResult(''), 5000);
    } finally {
      setCreatingDefaults(false);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: '',
      type: 'text',
      required: false,
      options: []
    };
    setNewTemplate({
      ...newTemplate,
      fields: [...newTemplate.fields, newField]
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  };

  const removeField = (fieldId: string) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.filter(field => field.id !== fieldId)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-success-100 text-success-800';
      case 'Submitted':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Modern Header with Gradient Background */}
      <div className="mb-12">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm mr-4">
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
                Forms
              </h1>
              <p className="mt-2 text-white text-opacity-90 text-lg">
                Manage form templates and submissions
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-accent-400 rounded-full mr-2"></div>
                  {templates.length} Templates
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                  {submissions.length} Submissions
                </span>
              </div>
            </div>
            {canCreateTemplates && (
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateNonDomesticLgsr}
                  disabled={creatingNonDomesticLgsr}
                  className="inline-flex items-center px-4 py-2 border border-white border-opacity-30 rounded-2xl text-sm font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50"
                >
                  {creatingNonDomesticLgsr ? 'Creating...' : 'Non-Domestic LGSR'}
                </button>
                <button
                  onClick={handleCreateDomesticLgsr}
                  disabled={creatingDomesticLgsr}
                  className="inline-flex items-center px-4 py-2 border border-white border-opacity-30 rounded-2xl text-sm font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50"
                >
                  {creatingDomesticLgsr ? 'Creating...' : 'Domestic LGSR'}
                </button>
                <button
                  onClick={handleCreateDefaults}
                  disabled={creatingDefaults}
                  className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-sm font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50"
                >
                  {creatingDefaults ? 'Creating...' : 'Create Defaults'}
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setNewTemplate({
                      form_template_id: '',
                      asset_type: '',
                      title: '',
                      fields: []
                    });
                    setShowTemplateForm(true);
                  }}
                  className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
                >
                  <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
                  Create Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Default Templates Creation Result */}
      {defaultTemplateResult && (
        <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
            <p className="text-sm text-success-700">{defaultTemplateResult}</p>
          </div>
        </div>
      )}

      {/* Domestic LGSR Creation Result */}
      {domesticLgsrResult && (
        <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
            <p className="text-sm text-success-700">{domesticLgsrResult}</p>
          </div>
        </div>
      )}

      {/* Non-Domestic LGSR Creation Result */}
      {nonDomesticLgsrResult && (
        <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
            <p className="text-sm text-success-700">{nonDomesticLgsrResult}</p>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-secondary-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`${
              activeTab === 'templates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`${
              activeTab === 'submissions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Submissions
          </button>
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-secondary-200 hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-2" />
                    <h3 className="text-lg font-medium text-secondary-900">
                      {template.title}
                    </h3>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {template.asset_type}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-secondary-600">
                    {template.fields.length} fields
                  </div>
                  <div className="text-xs text-secondary-500">
                    Created: {format(new Date(template.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-secondary-500">
                    ID: {template.form_template_id}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                  >
                    <EyeIcon className="w-4 h-4 inline mr-1" />
                    View
                  </button>
                  {canCreateTemplates && (
                    <>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="px-3 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-2 border border-error-300 rounded-md text-sm font-medium text-error-700 hover:bg-error-50 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">No form templates</h3>
              <p className="mt-1 text-sm text-secondary-500">
                Get started by creating a form template.
              </p>
              <div className="mt-6">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={handleCreateDefaults}
                    disabled={creatingDefaults}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors disabled:opacity-50"
                  >
                    {creatingDefaults ? 'Creating...' : 'Create Default Templates'}
                  </button>
                  <button
                    onClick={handleCreateDomesticLgsr}
                    disabled={creatingDomesticLgsr}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                  >
                    {creatingDomesticLgsr ? 'Creating...' : 'Create Domestic LGSR'}
                  </button>
                  <button
                    onClick={handleCreateNonDomesticLgsr}
                    disabled={creatingNonDomesticLgsr}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors disabled:opacity-50"
                  >
                    {creatingNonDomesticLgsr ? 'Creating...' : 'Create Non-Domestic LGSR'}
                  </button>
                  {canCreateTemplates && (
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setNewTemplate({
                        form_template_id: '',
                        asset_type: '',
                        title: '',
                        fields: []
                      });
                      setShowTemplateForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Create Template
                  </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg border border-secondary-200 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-secondary-900">
                      Form Submission
                    </h3>
                    <p className="text-sm text-secondary-600">
                      {submission.assets?.["Asset Name"] || 'General Form'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                  <span className="text-sm text-secondary-500">
                    {submission.form_submission_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-secondary-700">Submitted by:</span>
                  <p className="text-secondary-600">{submission.team?.["Name"] || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Date:</span>
                  <p className="text-secondary-600">{format(new Date(submission.submission_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Responses:</span>
                  <p className="text-secondary-600">{Object.keys(submission.responses || {}).length} fields</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setSelectedSubmission(submission)}
                  className="flex-1 px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <EyeIcon className="w-4 h-4 inline mr-1" />
                  View Details
                </button>
                <button
                  onClick={() => handleSendEmail(submission)}
                  className="px-3 py-2 border border-accent-300 rounded-md text-sm font-medium text-accent-700 hover:bg-accent-50 transition-colors"
                >
                  <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                  Email PDF
                </button>
              </div>
            </div>
          ))}

          {submissions.length === 0 && (
            <div className="text-center py-12">
              <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">No form submissions</h3>
              <p className="mt-1 text-sm text-secondary-500">
                Submissions will appear here when forms are completed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              <button
                onClick={() => {
                  setShowTemplateForm(false);
                  setEditingTemplate(null);
                }}
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    value={newTemplate.form_template_id}
                    onChange={(e) => setNewTemplate({...newTemplate, form_template_id: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-secondary-50 disabled:text-secondary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Asset Type
                  </label>
                  <select
                    required
                    value={newTemplate.asset_type}
                    onChange={(e) => setNewTemplate({...newTemplate, asset_type: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select Asset Type</option>
                    <option value="Pump">Pump</option>
                    <option value="Boiler">Boiler</option>
                    <option value="Chiller">Chiller</option>
                    <option value="Generator">Generator</option>
                    <option value="Air Handler">Air Handler</option>
                    <option value="Fire Panel">Fire Panel</option>
                    <option value="Sprinkler System">Sprinkler System</option>
                    <option value="Water Tank">Water Tank</option>
                    <option value="General">General</option>
                    <option value="PPM">PPM</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-secondary-900">Form Fields</h4>
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center px-3 py-1 border border-primary-300 rounded-md text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Field
                  </button>
                </div>

                <div className="space-y-4">
                  {newTemplate.fields.map((field) => (
                    <div key={`field-${field.id}`} className="border border-secondary-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Field Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                            className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="select">Select</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="radio">Radio</option>
                            <option value="photo">Photo</option>
                            <option value="signature">Signature</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-secondary-700">Required</span>
                          </label>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="px-3 py-2 border border-error-300 rounded-md text-sm font-medium text-error-700 hover:bg-error-50 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {field.type === 'select' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Options (one per line)
                          </label>
                          <textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                            rows={3}
                            className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Template Preview</h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-secondary-900">{selectedTemplate.title}</h4>
                <p className="text-sm text-secondary-600">Asset Type: {selectedTemplate.asset_type}</p>
              </div>
              
              <div className="space-y-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={`preview-${field.id}`}>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      {field.label} {field.required && <span className="text-error-500">*</span>}
                    </label>
                    {field.type === 'textarea' && (
                      <textarea
                        disabled
                        rows={3}
                        className="w-full rounded-md border-secondary-300 shadow-sm bg-secondary-50"
                      />
                    )}
                    {field.type === 'select' && (
                      <select disabled className="w-full rounded-md border-secondary-300 shadow-sm bg-secondary-50">
                        <option>Select an option...</option>
                        {field.options?.map((option, i) => (
                          <option key={`${field.id}-preview-${i}`} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'checkbox' && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          disabled
                          className="rounded border-secondary-300 text-primary-600"
                        />
                        <span className="ml-2 text-sm text-secondary-700">{field.label}</span>
                      </label>
                    )}
                    {(['text', 'number', 'date'].includes(field.type)) && (
                      <input
                        type={field.type}
                        disabled
                        className="w-full rounded-md border-secondary-300 shadow-sm bg-secondary-50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Form Submission Details</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Submission Header */}
            <div className="bg-secondary-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-secondary-700">Submission ID:</span>
                  <p className="text-secondary-900 font-mono">{selectedSubmission.form_submission_id}</p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Asset:</span>
                  <p className="text-secondary-900">{selectedSubmission.assets?.["Asset Name"] || 'General'}</p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Engineer:</span>
                  <p className="text-secondary-900">{selectedSubmission.team?.["Name"] || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Date:</span>
                  <p className="text-secondary-900">{format(new Date(selectedSubmission.submission_date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Form Responses */}
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-medium text-secondary-900">Form Responses</h4>
              {selectedSubmission.responses && Object.keys(selectedSubmission.responses).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.responses).map(([fieldId, value]) => (
                    <div key={fieldId} className="border-b border-secondary-200 pb-3">
                      <div className="font-medium text-secondary-700 capitalize mb-1">
                        {fieldId.replace(/_/g, ' ')}
                      </div>
                      <div className="text-secondary-900">
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                         typeof value === 'string' && value.startsWith('data:image') ? (
                          <img src={value} alt="Form photo" className="w-32 h-24 object-cover rounded border" />
                        ) : (
                          String(value) || 'No response'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500">No responses recorded</p>
              )}
            </div>

            {/* Photos */}
            {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-secondary-900 mb-3">Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedSubmission.photos.map((photo, index) => (
                    <img 
                      key={index} 
                      src={photo} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {selectedSubmission.engineer_signature && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Engineer Signature</h4>
                  <img 
                    src={selectedSubmission.engineer_signature} 
                    alt="Engineer Signature"
                    className="w-full h-20 border rounded"
                  />
                </div>
              )}
              {selectedSubmission.client_signature && (
                <div>
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Client Signature</h4>
                  <img 
                    src={selectedSubmission.client_signature} 
                    alt="Client Signature"
                    className="w-full h-20 border rounded"
                  />
                </div>
              )}
            </div>

            {/* Email History */}
            {selectedSubmission.emailed_to && selectedSubmission.emailed_to.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">Email History</h4>
                <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 text-success-600 mr-2" />
                    <span className="text-sm text-success-700">
                      Sent to: {selectedSubmission.emailed_to.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleSendEmail(selectedSubmission)}
                className="px-4 py-2 border border-accent-300 rounded-md text-sm font-medium text-accent-700 hover:bg-accent-50 transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                Email PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Send Form as PDF</h3>
            <p className="text-sm text-secondary-600 mb-4">
              Send form submission "{emailingSubmission.form_submission_id}" as PDF via email
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailingSubmission(null);
                }}
                className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEmailRequest}
                disabled={!emailAddress || sendingEmail === emailingSubmission.id}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {sendingEmail === emailingSubmission.id ? 'Sending...' : 'Send PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forms;