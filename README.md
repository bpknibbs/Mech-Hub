# Mech Hub - Plant Room Management System

A comprehensive plant room management system for tracking maintenance, assets, and compliance.

## Features

### 🏢 Plant Room Management
- Track multiple plant room locations
- Manage different types of facilities (Fresh Water, Gas Heat Generating, Community Halls)
- Support for both domestic and non-domestic classifications
- Photo documentation and location mapping

### ⚙️ Asset Management
- Comprehensive equipment tracking
- QR code generation for quick asset access
- Maintenance scheduling based on frequency
- Operational status monitoring
- Technical specifications and service history

### 📋 Task Management
- Automated PPM (Planned Preventive Maintenance) task generation
- Task assignment and tracking
- Priority-based task management
- Overdue task alerts and notifications
- Integration with form submissions

### 🔧 Automated Task Generation
- **Daily automation** runs automatically to generate tasks based on:
  - Asset service frequencies (Daily, Weekly, Monthly, Quarterly, Annually)
  - Last service dates
  - LGSR (Landlord Gas Safety Record) schedules for gas plant rooms
- Smart assignment based on engineer skills and availability
- Automatic notifications for new task assignments

### 📝 Forms & Compliance
- Dynamic form templates for different asset types
- Comprehensive LGSR forms (Domestic and Non-Domestic)
- Digital signatures and photo capture
- PDF generation and email distribution
- Compliance tracking and reporting

### 👥 Team Management
- Engineer profiles with skills and roles
- Task assignment based on expertise
- Availability and leave management
- Role-based access control

### 📊 Reporting & Analytics
- Compliance dashboards
- Performance metrics
- Overdue task tracking
- Asset utilization reports
- Real-time system health monitoring

### 🔔 Notifications
- Real-time task assignments
- Overdue task alerts
- System notifications
- Email integration for critical updates

### 📱 Mobile-First Design
- Responsive design for field engineers
- Touch-optimized interfaces
- QR code scanning for quick asset access
- Offline-capable service worker

## Automated Systems

### Daily Task Automation
The system automatically runs daily automation to:

1. **Check Asset Service Schedules**
   - Reviews all operational assets
   - Compares last service date with frequency requirements
   - Generates PPM tasks when service is due or overdue

2. **LGSR Schedule Management**
   - Monitors gas-related plant rooms
   - Tracks domestic vs non-domestic classifications
   - Generates LGSR inspection tasks annually

3. **Smart Task Assignment**
   - Matches tasks to engineers based on skills
   - Considers workload and availability
   - Sends automatic notifications to assigned engineers

4. **Overdue Task Alerts**
   - Identifies overdue tasks
   - Sends escalation notifications
   - Tracks compliance metrics

### Notification System
- **Push Notifications**: Browser-based notifications for immediate alerts
- **Email Notifications**: Automated emails for task assignments and updates
- **In-App Notifications**: Real-time notification center with unread counts

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI Framework**: Tailwind CSS with custom design system
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Base64 encoding for photos and signatures
- **PDF Generation**: HTML-to-PDF conversion for reports
- **QR Codes**: Dynamic QR code generation for assets
- **Notifications**: Web Push API + Email (Resend integration)

## Database Schema

### Core Tables
- **plant_rooms**: Location and facility information
- **assets**: Equipment and machinery tracking
- **tasks**: Maintenance task management
- **team**: Engineer profiles and roles
- **logs**: Daily observations and incident reports
- **form_templates**: Dynamic form configurations
- **form_submissions**: Completed maintenance forms
- **notifications**: System notification tracking
- **parts_requests**: Parts ordering and inventory
- **availability**: Engineer leave and availability

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- User authentication required for all operations
- Audit trails for data changes

## Setup Instructions

1. **Database Setup**
   - Connect to Supabase using the "Connect to Supabase" button
   - Database schema is automatically managed through migrations
   - Seed data can be imported for demo purposes

2. **User Management**
   - Create user accounts through the auth system
   - Add team members in the Team Management section
   - Link user accounts to team profiles by email matching

3. **Configuration**
   - Set up plant rooms and asset inventories
   - Configure form templates for different asset types
   - Establish maintenance frequencies for assets

4. **Daily Automation**
   - The system automatically generates tasks daily
   - No manual configuration required
   - Monitor automation results in the dashboard

## Usage Workflow

1. **Initial Setup**
   - Add plant room locations
   - Register assets with service frequencies
   - Create team member profiles
   - Set up form templates

2. **Daily Operations**
   - System automatically generates maintenance tasks
   - Engineers receive notifications for new assignments
   - Complete tasks using mobile-friendly forms
   - Submit digital forms with signatures and photos

3. **Compliance Management**
   - LGSR tasks automatically scheduled annually
   - PDF reports generated and emailed to stakeholders
   - Compliance tracking and audit trails maintained

4. **Monitoring & Reporting**
   - Dashboard provides real-time system overview
   - Reports show compliance metrics and trends
   - Overdue tasks highlighted for immediate attention

## API Integration

### Edge Functions
- **daily-task-automation**: Automated task generation
- **generate-pdf-email**: PDF creation and email distribution
- **send-notifications**: Notification delivery system

### External Services
- **Resend**: Email delivery service
- **Google Maps**: Location services for plant rooms
- **QR Code Libraries**: Dynamic QR code generation

## Mobile Support

The application is optimized for mobile devices with:
- Touch-friendly interfaces
- Camera integration for photo capture
- QR code scanning capabilities
- Offline service worker support
- Progressive Web App (PWA) features

## Security & Compliance

- **Data Protection**: All sensitive data encrypted at rest
- **Access Control**: Role-based permissions system
- **Audit Trails**: Complete history of all changes
- **Compliance Tracking**: Automated LGSR and maintenance schedules
- **Backup Systems**: Automated database backups through Supabase

This system provides a complete solution for plant room management, combining automated workflows with manual oversight to ensure compliance and operational efficiency.