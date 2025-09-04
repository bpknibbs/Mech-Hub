import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  PlusIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  "Engineer ID": string;
  "Name": string;
  "Email": string;
  "Phone Number"?: string;
  "Role": string;
  "Skills": string[];
  user_id?: string;
}

const Team: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    engineerId: '',
    name: '',
    email: '',
    phoneNumber: '',
    Role: 'Engineer',
    skills: [] as string[]
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    
    try {
      const { error } = await supabase
        .from('team')
        .insert([{
          "Engineer ID": newMember.engineerId,
          "Name": newMember.name,
          "Email": newMember.email,
          "Phone Number": newMember.phoneNumber || null,
          "Role": newMember.Role,
          "Skills": newMember.skills
        }]);

      if (error) throw error;

      setSuccess('Team member added successfully!');
      setNewMember({
        engineerId: '',
        name: '',
        email: '',
        phoneNumber: '',
        Role: 'Engineer',
        skills: []
      });
      setShowAddForm(false);
      fetchTeamMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(`Error adding team member: ${error.message || error}`);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setNewMember({
      engineerId: member["Engineer ID"],
      name: member["Name"],
      email: member["Email"],
      phoneNumber: member["Phone Number"] || '',
      Role: member["Role"],
      skills: member["Skills"] || []
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!editingMember) return;

    
    try {
      const { error } = await supabase
        .from('team')
        .update({
          "Name": newMember.name,
          "Email": newMember.email,
          "Phone Number": newMember.phoneNumber || null,
          "Role": newMember.Role,
          "Skills": newMember.skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingMember.id);


      if (error) throw error;

      setSuccess('Team member updated successfully!');
      setNewMember({
        engineerId: '',
        name: '',
        email: '',
        phoneNumber: '',
        Role: 'Engineer',
        skills: []
      });
      setShowEditForm(false);
      setEditingMember(null);
      fetchTeamMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(`Error updating team member: ${error.message || error}`);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('team')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setSuccess('Team member deleted successfully!');
      fetchTeamMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      setError(`Error deleting team member: ${error.message || error}`);
    }
  };

  const handleSkillsChange = (skill: string, checked: boolean) => {
    const currentSkills = newMember.skills;
    if (checked) {
      setNewMember({
        ...newMember,
        skills: [...currentSkills, skill]
      });
    } else {
      setNewMember({
        ...newMember,
        skills: currentSkills.filter(s => s !== skill)
      });
    }
  };

  const availableSkills = [
    'HVAC',
    'Electrical',
    'Plumbing',
    'Fire Safety',
    'Mechanical',
    'Boiler Maintenance',
    'Generator Maintenance',
    'Water Treatment',
    'BMS Systems',
    'Lift Maintenance'
  ];

  const availableRoles = [
    'Engineer',
    'Admin',
    'Manager',
    'Viewer',
    'Supervisor',
    'Technician',
    'Access All'
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-error-100 text-error-800';
      case 'Access All':
        return 'bg-purple-100 text-purple-800';
      case 'Engineer':
        return 'bg-primary-100 text-primary-800';
      case 'Manager':
        return 'bg-accent-100 text-accent-800';
      case 'Viewer':
        return 'bg-secondary-100 text-secondary-800';
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
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                Team Management
              </h1>
              <p className="mt-2 text-white text-opacity-90 text-lg">
                Manage team members, roles, and permissions
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-white text-opacity-70">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-accent-400 rounded-full mr-2"></div>
                  {teamMembers.length} Team Members
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-success-400 rounded-full mr-2"></div>
                  Active System
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 rounded-2xl text-lg font-bold text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
            >
              <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
              Add Team Member
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
            <p className="text-sm text-success-700">{success}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-error-400 mr-3" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add Team Member Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add New Team Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-error-50 border border-error-200 rounded-md p-3">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Engineer ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.engineerId}
                    onChange={(e) => setNewMember({...newMember, engineerId: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newMember.phoneNumber}
                    onChange={(e) => setNewMember({...newMember, phoneNumber: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Role
                </label>
                <select
                  value={newMember.Role}
                  onChange={(e) => setNewMember({...newMember, Role: e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Skills
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSkills.map((skill) => (
                    <label key={skill} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.skills.includes(skill)}
                        onChange={(e) => handleSkillsChange(skill, e.target.checked)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-secondary-700">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Add Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Team Member</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="bg-error-50 border border-error-200 rounded-md p-3">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Engineer ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={newMember.engineerId}
                    className="w-full rounded-md border-secondary-300 shadow-sm bg-secondary-50 text-secondary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newMember.phoneNumber}
                    onChange={(e) => setNewMember({...newMember, phoneNumber: e.target.value})}
                    className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Role
                </label>
                <select
                  value={newMember.Role}
                  onChange={(e) => setNewMember({...newMember, Role: e.target.value})}
                  className="w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Skills
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSkills.map((skill) => (
                    <label key={skill} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMember.skills.includes(skill)}
                        onChange={(e) => handleSkillsChange(skill, e.target.checked)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-secondary-700">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Update Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="group bg-white overflow-hidden shadow-xl rounded-2xl border border-secondary-200 hover:shadow-2xl hover:-translate-y-3 hover:border-primary-300 transition-all duration-500 relative"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-accent-50/20 pointer-events-none"></div>
            
            {/* Header with role color */}
            <div className={`relative px-6 py-4 ${getRoleColor(member["Role"])}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center text-white">
                  <div className="bg-white bg-opacity-25 p-3 rounded-xl mr-3 backdrop-blur-sm shadow-lg border border-white border-opacity-30">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {member["Name"]}
                    </h3>
                    <p className="text-white text-opacity-80 text-sm font-medium">{member["Engineer ID"]}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white bg-opacity-25 text-white backdrop-blur-sm shadow-lg border border-white border-opacity-30`}>
                  {member["Role"]}
                </span>
              </div>
            </div>
            
            <div className="relative px-6 py-6">
              
              <div className="space-y-4 mb-6">
                {/* Contact Info */}
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-200">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-primary-600 mr-3" />
                      <span className="text-secondary-900 font-medium">{member["Email"]}</span>
                    </div>
                    {member["Phone Number"] && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-accent-600 mr-3" />
                        <span className="text-secondary-900 font-medium">{member["Phone Number"]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {member["Skills"] && member["Skills"].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full mr-3 shadow-lg"></div>
                    <h4 className="text-sm font-bold text-secondary-700 uppercase tracking-wide">Skills & Expertise</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member["Skills"].map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 shadow-md border border-accent-300 hover:from-accent-200 hover:to-accent-300 transition-all duration-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-secondary-500 mb-6 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg p-3 border border-secondary-200">
                Member since signup
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-primary-300 text-primary-800 rounded-xl text-sm font-bold hover:from-primary-200 hover:to-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  <PencilIcon className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="px-4 py-3 bg-gradient-to-r from-error-100 to-error-200 border-2 border-error-300 rounded-xl text-sm font-bold text-error-800 hover:from-error-200 hover:to-error-300 focus:outline-none focus:ring-4 focus:ring-error-300 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-24">
          <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl p-16 max-w-lg mx-auto shadow-2xl border border-primary-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-accent-100/30"></div>
            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 inline-block mb-8 shadow-xl">
              <UserGroupIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="relative text-2xl font-bold text-secondary-900 mb-4">No team members</h3>
            <p className="relative text-secondary-600 mb-10 leading-relaxed text-lg">
            Get started by adding a team member.
          </p>
          <div className="mt-6">
            <div className="relative">
              <button
              onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-8 py-4 border border-transparent shadow-2xl text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-300 transform hover:scale-110 hover:shadow-3xl"
            >
                <PlusIcon className="-ml-1 mr-3 h-6 w-6" />
              Add Team Member
            </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Team;