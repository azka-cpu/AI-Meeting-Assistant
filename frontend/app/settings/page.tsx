
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Toggle from '@/components/ui/toggle';
import Avatar from '@/components/ui/avatar';
import Tabs from '@/components/ui/tabs';
import { authApi, profileApi, FullProfile, Preferences } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();

    const [profile, setProfile] = useState<FullProfile>({
        id: '',
        name: '',
        email: '',
        job_title: '',
        company: '',
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [profileErr, setProfileErr] = useState('');

    const [prefs, setPrefs] = useState<Preferences>({
        notify_email: true,
        notify_reminders: true,
        notify_weekly_digest: false,
        notify_product_updates: true,
        pref_language: 'en',
        pref_timezone: 'UTC',
    });
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsMsg, setPrefsMsg] = useState('');

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordErr, setPasswordErr] = useState('');

    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        authApi.me().then((data) => {
            setProfile((prev) => ({ ...prev, ...data }));
        }).catch(() => { });

        profileApi.getPreferences().then(setPrefs).catch(() => { });
    }, []);

    const handleSaveProfile = async () => {
        setProfileSaving(true);
        setProfileMsg('');
        setProfileErr('');
        try {
            const updated = await profileApi.updateProfile({
                name: profile.name,
                email: profile.email,
                job_title: profile.job_title || '',
                company: profile.company || '',
            });
            setProfile((prev) => ({ ...prev, ...updated }));
            setProfileMsg('Profile updated successfully.');
            setTimeout(() => setProfileMsg(''), 3000);
        } catch (err: unknown) {
            setProfileErr(err instanceof Error ? err.message : 'Failed to update profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const updatePreference = async (patch: Partial<Preferences>) => {
        const previous = prefs;
        setPrefs((prev) => ({ ...prev, ...patch }));
        setPrefsSaving(true);
        setPrefsMsg('');
        try {
            const updated = await profileApi.updatePreferences(patch);
            setPrefs(updated);
            setPrefsMsg('Saved');
            setTimeout(() => setPrefsMsg(''), 1500);
        } catch (err) {
            setPrefs(previous);
            console.error('Failed to save preference:', err);
        } finally {
            setPrefsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordErr('');
        setPasswordMsg('');

        if (passwordData.newPassword.length < 8) {
            setPasswordErr('New password must be at least 8 characters.');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordErr('New passwords do not match.');
            return;
        }

        setPasswordSaving(true);
        try {
            await profileApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setPasswordMsg('Password updated successfully.');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordMsg(''), 3000);
        } catch (err: unknown) {
            setPasswordErr(err instanceof Error ? err.message : 'Failed to change password.');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setDeleting(true);
        try {
            await profileApi.deleteAccount();
            authApi.logout();
            router.push('/login');
        } catch (err) {
            console.error('Failed to delete account:', err);
            setDeleting(false);
        }
    };

    return (
        <>
            <Header title="Settings" subtitle="Manage your account and preferences" />

            <main className="p-8 max-w-4xl">
                <Tabs
                    tabs={[
                        { label: 'Profile', value: 'profile' },
                        { label: 'Notifications', value: 'notifications' },
                        { label: 'Preferences', value: 'preferences' },
                        { label: 'Security', value: 'security' },
                    ]}
                    defaultValue="profile"
                >
                    {/* Profile Tab */}
                    <Tabs.Content value="profile">
                        <Card>
                            <h3 className="text-lg font-bold text-slate-900 mb-6">
                                Profile Information
                            </h3>

                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                                <Avatar name={profile.name} size="xl" />
                                <div>
                                    <p className="font-medium text-slate-900">{profile.name || 'Your name'}</p>
                                    <p className="text-sm text-slate-500">{profile.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Full Name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                                <Input
                                    label="Job Title"
                                    value={profile.job_title || ''}
                                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                                />
                                <Input
                                    label="Company"
                                    value={profile.company || ''}
                                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                />

                                {profileErr && <p className="text-sm text-red-500">{profileErr}</p>}
                                {profileMsg && <p className="text-sm text-emerald-600">{profileMsg}</p>}

                                <div className="flex justify-end pt-2">
                                    <Button variant="primary" onClick={handleSaveProfile} loading={profileSaving}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </Tabs.Content>

                    {/* Notifications Tab */}
                    <Tabs.Content value="notifications">
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Notification Preferences
                                </h3>
                                {prefsMsg && <span className="text-xs text-emerald-600">{prefsMsg}</span>}
                            </div>

                            <div className="space-y-6">
                                <ToggleRow
                                    title="Email Notifications"
                                    desc="Receive email updates about your meetings"
                                    checked={prefs.notify_email}
                                    onChange={(v) => updatePreference({ notify_email: v })}
                                    disabled={prefsSaving}
                                />
                                <ToggleRow
                                    title="Meeting Reminders"
                                    desc="Get reminded before your scheduled meetings"
                                    checked={prefs.notify_reminders}
                                    onChange={(v) => updatePreference({ notify_reminders: v })}
                                    disabled={prefsSaving}
                                />
                                <ToggleRow
                                    title="Weekly Digest"
                                    desc="Receive a weekly summary of your meetings"
                                    checked={prefs.notify_weekly_digest}
                                    onChange={(v) => updatePreference({ notify_weekly_digest: v })}
                                    disabled={prefsSaving}
                                />
                                <ToggleRow
                                    title="Product Updates"
                                    desc="Learn about new features and improvements"
                                    checked={prefs.notify_product_updates}
                                    onChange={(v) => updatePreference({ notify_product_updates: v })}
                                    disabled={prefsSaving}
                                    last
                                />
                            </div>
                        </Card>
                    </Tabs.Content>

                    {/* Preferences Tab */}
                    <Tabs.Content value="preferences">
                        <Card>
                            <h3 className="text-lg font-bold text-slate-900 mb-6">
                                General Preferences
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Language
                                    </label>
                                    <select
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={prefs.pref_language}
                                        onChange={(e) => updatePreference({ pref_language: e.target.value })}
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Saved to your account, but the interface itself is only
                                        available in English right now — translation isn&apos;t
                                        built yet.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Timezone
                                    </label>
                                    <select
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={prefs.pref_timezone}
                                        onChange={(e) => updatePreference({ pref_timezone: e.target.value })}
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="EST">Eastern (EST)</option>
                                        <option value="CST">Central (CST)</option>
                                        <option value="PST">Pacific (PST)</option>
                                    </select>
                                </div>
                            </div>
                        </Card>
                    </Tabs.Content>

                    {/* Security Tab */}
                    <Tabs.Content value="security">
                        <Card>
                            <h3 className="text-lg font-bold text-slate-900 mb-6">
                                Change Password
                            </h3>

                            <div className="space-y-4">
                                <Input
                                    type="password"
                                    label="Current Password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                    }
                                />
                                <Input
                                    type="password"
                                    label="New Password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    helperText="At least 8 characters"
                                />
                                <Input
                                    type="password"
                                    label="Confirm New Password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                />

                                {passwordErr && <p className="text-sm text-red-500">{passwordErr}</p>}
                                {passwordMsg && <p className="text-sm text-emerald-600">{passwordMsg}</p>}

                                <div className="flex justify-end pt-2">
                                    <Button variant="primary" onClick={handleChangePassword} loading={passwordSaving}>
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card className="mt-6 border-red-200 bg-red-50/40">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
                            </div>
                            <p className="text-slate-600 mb-4 text-sm">
                                Deleting your account permanently removes it along with every
                                meeting you created, their transcripts, and summaries. This
                                cannot be undone.
                            </p>

                            {!showDeleteConfirm ? (
                                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                                    Delete Account
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700">
                                        Type <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                                    </p>
                                    <Input
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="DELETE"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="danger"
                                            disabled={deleteConfirmText !== 'DELETE'}
                                            loading={deleting}
                                            onClick={handleDeleteAccount}
                                        >
                                            Permanently Delete My Account
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Tabs.Content>
                </Tabs>
            </main>
        </>
    );
}

function ToggleRow({
    title,
    desc,
    checked,
    onChange,
    disabled = false,
    last = false,
}: {
    title: string;
    desc: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    last?: boolean;
}) {
    return (
        <div className={`flex items-center justify-between ${last ? '' : 'pb-4 border-b border-slate-100'}`}>
            <div>
                <p className="font-medium text-slate-900">{title}</p>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
            <Toggle checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
        </div>
    );
}
