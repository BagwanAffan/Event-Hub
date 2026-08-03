export type UserRole = 'student' | 'organizer' | 'volunteer' | 'admin';
export type OrganizerStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'pending' | 'pending_payment' | 'payment_under_review' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'under_review' | 'approved' | 'verified' | 'rejected' | 'refunded' | 'not_required';
export type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'not_present';
export type TaskStatus = 'assigned' | 'accepted' | 'pending' | 'completed' | 'cancelled';
export type VolunteerAttendanceStatus = 'pending' | 'present' | 'absent';
export type AttendanceStatus = 'pending_checkout' | 'present' | 'checked_in' | 'absent' | 'late';
export type CertificateType = 'participation' | 'winner' | 'runner_up' | 'volunteer';
export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'announcement';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RegistrationType = 'individual' | 'team';
export type EventType = 'online' | 'offline' | 'hybrid';
export type TeamStatus = 'forming' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
export type TeamMemberStatus = 'invited' | 'accepted' | 'rejected' | 'removed';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  profile_picture: string | null;
  role: UserRole;
  college: string | null;
  department: string | null;
  year: string | null;
  status: string;
  organizer_status?: OrganizerStatus | null;
  approval_status?: OrganizerStatus | null;
  verification_status?: OrganizerStatus | 'unsubmitted' | null;
  approved_by?: string | null;
  approved_at?: string | null;
  verification_docs?: string[];
  organization?: string | null;
  club_name?: string | null;
  designation?: string | null;
  position?: string | null;
  organization_type?: string | null;
  faculty_advisor_name?: string | null;
  experience?: string | null;
  is_soft_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizerVerification {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  profile_picture?: string | null;
  organization_name: string;
  organization_type: string;
  designation: string;
  faculty_advisor_name?: string | null;
  college: string;
  department: string;
  city: string;
  state: string;
  country: string;
  years_experience: string;
  prev_events: string;
  approx_participants: string;
  categories_managed: string[];
  govt_id_url: string;
  college_id_url: string;
  auth_letter_url?: string | null;
  club_cert_url?: string | null;
  supporting_doc_url?: string | null;
  verification_status: OrganizerStatus | 'unsubmitted';
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  short_description: string;
  description: string;
  category: string;
  event_type: EventType;
  venue: string | null;
  building: string | null;
  room: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  registration_fee: number;
  registration_mode: string;
  max_participants: number | null;
  max_teams: number | null;
  max_team_size: number | null;
  poster_url: string | null;
  banner_url: string | null;
  status: EventStatus;
  payment_instructions: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tags: string[];
  created_by: string;
  need_volunteers?: boolean;
  volunteers_needed?: number | null;
  volunteer_roles?: string[];
  reporting_location?: string | null;
  reporting_time?: string | null;
  shift_start_time?: string | null;
  shift_end_time?: string | null;
  volunteer_instructions?: string | null;
  is_disabled?: boolean;
  is_featured?: boolean;
  is_soft_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  team_id: string | null;
  registration_type: RegistrationType;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  qr_generated: boolean;
  qr_token: string | null;
  phone: string | null;
  department: string | null;
  year: string | null;
  prn: string | null;
  special_requirements: string | null;
  emergency_contact: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  team_name: string;
  leader_id: string;
  invite_code: string;
  status: TeamStatus;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  status: TeamMemberStatus;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_reference: string | null;
  screenshot_url: string | null;
  remarks: string | null;
  organizer_remarks: string | null;
  status: PaymentStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  event_id: string;
  user_id: string;
  application_status: VolunteerStatus;
  skills: string[] | string;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerTask {
  id: string;
  event_id: string;
  volunteer_id: string | null;
  title: string;
  description: string;
  location: string | null;
  priority: TaskPriority;
  start_time: string | null;
  end_time: string | null;
  status: TaskStatus;
  accepted_at: string | null;
  attendance_status: VolunteerAttendanceStatus;
  attendance_marked_at: string | null;
  checklist: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  registration_id: string;
  user_id: string;
  volunteer_id: string | null;
  check_in_time: string;
  check_out_time?: string | null;
  checked_in_by?: string | null;
  checked_out_by?: string | null;
  attendance_status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  event_id: string;
  user_id: string;
  registration_id: string;
  certificate_type: CertificateType;
  verification_id: string;
  certificate_url: string;
  generated_by: string;
  generated_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  message: string;
  audience: string;
  pinned: boolean;
  created_by: string;
  created_at: string;
}

export interface EventFaq {
  id: string;
  event_id: string;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
}

export interface EventGallery {
  id: string;
  event_id: string;
  image_url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  feedback: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AiHistory {
  id: string;
  user_id: string;
  feature: string;
  prompt: string;
  response: string;
  created_at: string;
}
