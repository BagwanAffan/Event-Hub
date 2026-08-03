'use client';

import { UnifiedSettingsView } from '@/components/shared/unified-settings-view';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const supabase = createClient();

  const handleAdminPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw error;
    }
    toast.success('Admin password updated successfully! 🔒');
  };

  return <UnifiedSettingsView role="admin" customPasswordHandler={handleAdminPassword} />;
}
