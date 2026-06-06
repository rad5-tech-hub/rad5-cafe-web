import React, { useState, useEffect, useRef } from 'react';
import { api } from '~/lib/api';
import { storage } from '~/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { useToast } from '~/context/toast-context';

export function meta() {
  return [
    { title: "App Updates - RAD5 Café" },
    { name: "description", content: "Manage app version and distribute APK releases." },
  ];
}

export default function AppUpdates() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [currentVersion, setCurrentVersion] = useState<any>(null);

  const [version, setVersion] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [apkLink, setApkLink] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    api.version.get()
      .then((res) => {
        if (res.success && res.data) {
          const v = res.data;
          setCurrentVersion(v);
          setVersion(v.version || '');
          setVersionCode(String(v.versionCode ?? ''));
          setApkLink(v.apkLink || '');
          setReleaseNotes(v.releaseNotes || '');
          setForceUpdate(!!v.forceUpdate);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.apk') || file.type === 'application/vnd.android.package-archive') {
        setSelectedFile(file);
      } else {
        showToast('Only .apk files are accepted.', 'warning');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.apk') || file.type === 'application/vnd.android.package-archive') {
        setSelectedFile(file);
      } else {
        showToast('Only .apk files are accepted.', 'warning');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    const fileName = `app/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (error) => {
        setUploading(false);
        showToast(error.message || 'Upload failed.', 'error');
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setApkLink(downloadUrl);
        setUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        showToast('APK uploaded successfully.', 'success');
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!version.trim() || !versionCode || !apkLink.trim()) {
      showToast('Version, version code, and APK link are required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await api.version.update({
        version: version.trim(),
        versionCode: Number(versionCode),
        apkLink: apkLink.trim(),
        releaseNotes: releaseNotes.trim(),
        forceUpdate,
      });

      if (res.success) {
        showToast('App version updated successfully.', 'success');
        setCurrentVersion(res.data || {
          version: version.trim(),
          versionCode: Number(versionCode),
          apkLink: apkLink.trim(),
          releaseNotes: releaseNotes.trim(),
          forceUpdate,
        });
      } else {
        showToast(res.message || 'Failed to update version.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update version.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin h-8 w-8 text-tint" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">App Updates</h1>
          <p className="text-text-secondary text-xs mt-1">
            Manage version info and distribute APK releases to users.
          </p>
        </div>
        {currentVersion && (
          <Badge label={`v${currentVersion.version}`} variant="info" />
        )}
      </div>

      {currentVersion && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="smartphone" size={18} className="text-tint" />
            <span className="text-sm font-bold text-text-main">Current Published Version</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-text-secondary text-xs">Version</span>
              <p className="font-bold text-text-main">{currentVersion.version}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Version Code</span>
              <p className="font-bold text-text-main">{currentVersion.versionCode}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Force Update</span>
              <p className="font-bold text-text-main">{currentVersion.forceUpdate ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">APK Link</span>
              <a
                href={currentVersion.apkLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-tint hover:underline truncate block max-w-[200px]"
              >
                View APK
              </a>
            </div>
          </div>
          {currentVersion.releaseNotes && (
            <div>
              <span className="text-text-secondary text-xs">Release Notes</span>
              <p className="text-sm text-text-main mt-0.5">{currentVersion.releaseNotes}</p>
            </div>
          )}
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Icon name="edit" size={18} className="text-tint" />
            <span className="text-sm font-bold text-text-main">
              {currentVersion ? 'Update Version' : 'Publish Version'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Version"
              placeholder="e.g. 1.2.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
            />
            <Input
              label="Version Code"
              placeholder="e.g. 3"
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main select-none">Release Notes</label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="What's new in this release..."
              rows={3}
              className="bg-bg-element border text-text-main text-base outline-none transition-colors duration-200 w-full placeholder:text-text-secondary border-border focus:border-tint resize-y"
              style={{
                borderWidth: '1.5px',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
              }}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceUpdate}
              onChange={(e) => setForceUpdate(e.target.checked)}
              className="w-4 h-4 rounded border-border text-tint focus:ring-tint accent-tint cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-main">Force update (users must update before using the app)</span>
          </label>

          <div className="border-t border-border/50 pt-4">
            <span className="text-sm font-bold text-text-main">APK File</span>
            <p className="text-xs text-text-secondary mt-0.5 mb-3">
              Upload an APK to Firebase Storage. The download URL will be set automatically.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-tint bg-tint/5 scale-[1.01]'
                  : 'border-border hover:border-tint/50 hover:bg-bg-element'
              }`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-tint/10 flex items-center justify-center">
                <Icon name="upload" size={24} className="text-tint" />
              </div>
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-text-main">{selectedFile.name}</span>
                  <span className="text-xs text-text-secondary">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  {!uploading && (
                    <div className="flex gap-2 mt-1">
                      <Button type="button" variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleUpload(); }}>
                        <Icon name="upload" size={14} className="mr-1" />
                        Upload to Storage
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold text-text-main">
                    Drag & drop your APK here, or click to browse
                  </span>
                  <span className="text-xs text-text-secondary">.apk files only</span>
                </>
              )}

              {uploading && (
                <div className="w-full max-w-xs flex flex-col gap-2 mt-2">
                  <div className="w-full bg-bg-element rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-tint rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary text-center">{uploadProgress}% uploaded</span>
                </div>
              )}
            </div>
          </div>

          {apkLink && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/8 border border-success/15 text-sm">
              <Icon name="check" size={16} className="text-success" />
              <span className="text-text-main font-medium">APK uploaded and download URL set.</span>
            </div>
          )}

          {!apkLink && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/8 border border-warning/15 text-sm">
              <Icon name="alert-triangle" size={16} className="text-warning" />
              <span className="text-text-main font-medium">Upload an APK file before publishing.</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" size="md" disabled={saving || uploading}>
              {saving ? 'Saving...' : currentVersion ? 'Update Version' : 'Publish Version'}
            </Button>
            {currentVersion?.apkLink && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => window.open(currentVersion.apkLink, '_blank')}
              >
                <Icon name="smartphone" size={16} className="mr-1.5" />
                Download Current APK
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
