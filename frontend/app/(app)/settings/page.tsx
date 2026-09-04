'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Toggle from '@/components/ui/toggle';
import Avatar from '@/components/ui/avatar';
import Tabs from '@/components/ui/tabs';

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    fullName: 'Sarah Khan',
    email: 'sarah@example.com',
    jobTitle: 'Product Manager',
    company: 'Acme Inc',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    meetingReminders: true,
    weeklyDigest: false,
    productUpdates: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    theme: 'dark',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  return (
    <>
      <Header
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <main className="p-8 max-w-4xl">
        <Tabs
          tabs={[
            { label: 'Profile', value: 'profile', icon: '👤' },
            { label: 'Notifications', value: 'notifications', icon: '🔔' },
            { label: 'Preferences', value: 'preferences', icon: '⚙️' },
            { label: 'Security', value: 'security', icon: '🔒' },
          ]}
          defaultValue="profile"
        >
          {/* Profile Tab */}
          <Tabs.Content value="profile">
            <Card>
              <h3 className="text-xl font-bold text-white mb-6">
                Profile Information
              </h3>

              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700">
                <Avatar name="SK" size="xl" />
                <div>
                  <Button variant="secondary" size="md" className="mb-2">
                    Change Photo
                  </Button>
                  <p className="text-sm text-slate-500">
                    JPG, PNG or GIF (max. 2MB)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />

                <Input
                  label="Job Title"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                />

                <Input
                  label="Company"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="primary">Save Changes</Button>
                </div>
              </div>
            </Card>
          </Tabs.Content>

          {/* Notifications Tab */}
          <Tabs.Content value="notifications">
            <Card>
              <h3 className="text-xl font-bold text-white mb-6">
                Notification Preferences
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <p className="font-medium text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-slate-400">
                      Receive email updates about your meetings
                    </p>
                  </div>
                  <Toggle
                    checked={notifications.emailNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, emailNotifications: e.target.checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <p className="font-medium text-white">
                      Meeting Reminders
                    </p>
                    <p className="text-sm text-slate-400">
                      Get reminded before your scheduled meetings
                    </p>
                  </div>
                  <Toggle
                    checked={notifications.meetingReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, meetingReminders: e.target.checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <p className="font-medium text-white">
                      Weekly Digest
                    </p>
                    <p className="text-sm text-slate-400">
                      Receive a weekly summary of your meetings
                    </p>
                  </div>
                  <Toggle
                    checked={notifications.weeklyDigest}
                    onChange={(e) =>
                      setNotifications({ ...notifications, weeklyDigest: e.target.checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Product Updates
                    </p>
                    <p className="text-sm text-slate-400">
                      Learn about new features and improvements
                    </p>
                  </div>
                  <Toggle
                    checked={notifications.productUpdates}
                    onChange={(e) =>
                      setNotifications({ ...notifications, productUpdates: e.target.checked })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="primary">Save Preferences</Button>
                </div>
              </div>
            </Card>
          </Tabs.Content>

          {/* Preferences Tab */}
          <Tabs.Content value="preferences">
            <Card>
              <h3 className="text-xl font-bold text-white mb-6">
                General Preferences
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Language
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Timezone
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern (EST)</option>
                    <option value="CST">Central (CST)</option>
                    <option value="PST">Pacific (PST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Theme
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="primary">Save Preferences</Button>
                </div>
              </div>
            </Card>
          </Tabs.Content>

          {/* Security Tab */}
          <Tabs.Content value="security">
            <Card>
              <h3 className="text-xl font-bold text-white mb-6">
                Change Password
              </h3>

              <div className="space-y-4">
                <Input
                  type="password"
                  label="Current Password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />

                <Input
                  type="password"
                  label="New Password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  helperText="At least 8 characters"
                />

                <Input
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="primary">Update Password</Button>
                </div>
              </div>
            </Card>

            <Card className="mt-6 border-red-700/50 bg-red-900/5">
              <h3 className="text-xl font-bold text-red-400 mb-4">
                Danger Zone
              </h3>
              <p className="text-slate-400 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger">Delete Account</Button>
            </Card>
          </Tabs.Content>
        </Tabs>
      </main>
    </>
  );
}