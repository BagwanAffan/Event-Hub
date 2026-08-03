'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Users,
  Search,
  Eye,
  UserX,
  UserCheck,
  KeyRound,
  Trash2,
  Heart,
  ClipboardList,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '@/services/admin-service';
import { Profile } from '@/types/database.types';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // View Profile Modal State
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userHistory, setUserHistory] = useState<{
    registrations: any[];
    volunteerApplications: any[];
    createdEvents: any[];
  }>({ registrations: [], volunteerApplications: [], createdEvents: [] });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Direct Reset Password Modal State
  const [resetUser, setResetUser] = useState<Profile | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        role: roleFilter,
        status: statusFilter,
        search,
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user: Profile) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setProcessingId(user.id);
    try {
      await adminService.toggleUserStatus(user.id, nextStatus);
      toast.success(`User "${user.full_name}" is now ${nextStatus}.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSoftDelete = async (user: Profile) => {
    if (!confirm(`Are you sure you want to soft delete user "${user.full_name}"?`)) return;
    setProcessingId(user.id);
    try {
      await adminService.softDeleteUser(user.id);
      toast.warning(`User "${user.full_name}" soft deleted.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to soft delete user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenResetModal = (user: Profile) => {
    setResetUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsResetOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetting(true);
    try {
      await adminService.resetUserPasswordDirect(resetUser.id, newPassword);
      toast.success(`Password for "${resetUser.full_name}" reset directly! 🔒`);
      setIsResetOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset user password');
    } finally {
      setResetting(false);
    }
  };

  const handleViewProfile = async (user: Profile) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
    try {
      const history = await adminService.getUserHistory(user.id);
      setUserHistory(history);
    } catch {
      setUserHistory({ registrations: [], volunteerApplications: [], createdEvents: [] });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">User Management Portal</h1>
          <p className="text-muted-foreground text-sm">Oversight for Students, Organizers, Volunteers, and Admins across campus</p>
        </div>
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 text-xs font-bold">
          {users.length} Users Found
        </Badge>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Role:</span>
                <Select value={roleFilter} onValueChange={(val) => val && setRoleFilter(val)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="organizer">Organizers</SelectItem>
                    <SelectItem value="volunteer">Volunteers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="secondary" size="sm" className="shrink-0 font-semibold">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Directory Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#007C46]" /> All Platform Users
          </CardTitle>
          <CardDescription className="text-xs">Direct password resets, activation toggles, and profile inspection</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!loading && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                  <TableHead className="font-bold text-xs uppercase">User Profile</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Role</TableHead>
                  <TableHead className="font-bold text-xs uppercase">College & Dept</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.profile_picture || ''} />
                          <AvatarFallback className="bg-[#01424E] text-[#7CEAAB] font-bold text-xs">
                            {u.full_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-[#01424E] dark:text-teal-100">{u.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize font-bold text-[10px] ${
                        u.role === 'admin' ? 'bg-indigo-600 text-white' :
                        u.role === 'organizer' ? 'bg-purple-600 text-white' :
                        u.role === 'volunteer' ? 'bg-pink-600 text-white' :
                        'bg-[#007C46] text-white'
                      }`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{u.department || u.club_name || 'General'}</div>
                      <div className="text-[11px] text-muted-foreground">{u.college || 'Apex Institute'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize font-bold text-[10px] ${
                        u.status === 'active' ? 'bg-[#edfcf6] text-[#007C46] border border-[#41B177]' :
                        'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      }`}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProfile(u)}
                        className="h-8 text-xs font-semibold"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5 text-[#01424E]" /> History
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResetModal(u)}
                        className="h-8 text-xs text-amber-600 hover:bg-amber-50"
                        title="Direct password reset"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {u.role !== 'admin' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId === u.id}
                            onClick={() => handleToggleStatus(u)}
                            className={`h-8 text-xs ${u.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-[#007C46]'}`}
                          >
                            {u.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId === u.id}
                            onClick={() => handleSoftDelete(u)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50"
                            title="Soft delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No matching user profiles found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile & Activity History Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <Users className="h-5 w-5 text-[#007C46]" /> User Profile & Activity Records
            </DialogTitle>
            <DialogDescription>Full registration and participation history</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={selectedUser.profile_picture || ''} />
                  <AvatarFallback className="bg-[#01424E] text-[#7CEAAB] font-bold">
                    {selectedUser.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm text-[#01424E] dark:text-teal-100">{selectedUser.full_name}</h4>
                  <p className="text-muted-foreground">{selectedUser.email} • {selectedUser.phone || 'No phone'}</p>
                </div>
              </div>

              {/* Event Registrations */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#01424E] dark:text-teal-100 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-[#007C46]" /> Event Registrations ({userHistory.registrations.length})
                </h4>
                {userHistory.registrations.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {userHistory.registrations.map((reg) => (
                      <div key={reg.id} className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{reg.events?.title || 'Campus Event'}</p>
                          <p className="text-[10px] text-muted-foreground">Registered on {new Date(reg.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className="capitalize text-[10px] bg-[#007C46] text-white">{reg.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-3 border rounded-lg">No event registrations logged.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Reset Password Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <KeyRound className="h-5 w-5 text-amber-600" /> Direct Password Reset
            </DialogTitle>
            <DialogDescription>
              Directly set a new password for <strong>{resetUser?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmResetPassword} className="space-y-4 py-2 text-xs">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">New Password *</Label>
              <Input
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Confirm New Password *</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={resetting} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold">
                {resetting ? 'Updating Password...' : 'Save New Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
