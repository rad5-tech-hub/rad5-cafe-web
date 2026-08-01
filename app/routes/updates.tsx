import React, { useState, useEffect, useRef } from 'react';
import { api } from '~/lib/api';
import { storage } from '~/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { GlassPanel } from '~/components/ui/glass-panel';
import { Icon } from '~/components/ui/icon';
import { SheetField } from '~/components/ui/action-sheet-modal';
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
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
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
        showToast({ type: 'warning', title: 'Only .apk files are accepted.' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.apk') || file.type === 'application/vnd.android.package-archive') {
        setSelectedFile(file);
      } else {
        showToast({ type: 'warning', title: 'Only .apk files are accepted.' });
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
        showToast({ type: 'error', title: 'Upload failed', message: error.message });
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setApkLink(downloadUrl);
        setUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        showToast({ type: 'success', title: 'APK uploaded successfully' });
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!version.trim() || !versionCode || !apkLink.trim()) {
      showToast({ type: 'warning', title: 'Version, version code, and APK link are required.' });
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
        showToast({ type: 'success', title: 'App version updated' });
        setCurrentVersion(res.data || { version: version.trim(), versionCode: Number(versionCode), apkLink: apkLink.trim(), releaseNotes: releaseNotes.trim(), forceUpdate });
      } else {
        showToast({ type: 'error', title: 'Failed to update version', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update version', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="w-8 h-8 rounded-full border-2 border-tint border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">App updates</h1>
          <p className="text-text-secondary text-xs mt-1">Manage version info and distribute APK releases to users.</p>
        </div>
        {currentVersion && (
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-tint-a text-tint">v{currentVersion.version}</span>
        )}
      </div>

      {currentVersion && (
        <GlassPanel radius="lg">
          <div className="flex items-center gap-2 mb-3.5">
            <Icon name="smartphone" size={17} className="text-tint" />
            <span className="text-sm font-bold">Current published version</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-text-secondary text-xs">Version</span>
              <p className="font-bold">{currentVersion.version}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Version code</span>
              <p className="font-bold">{currentVersion.versionCode}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Force update</span>
              <p className="font-bold">{currentVersion.forceUpdate ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">APK link</span>
              <a href={currentVersion.apkLink} target="_blank" rel="noopener noreferrer" className="font-bold text-tint hover:underline truncate block max-w-[200px]">View APK</a>
            </div>
          </div>
          {currentVersion.releaseNotes && (
            <div className="mt-3">
              <span className="text-text-secondary text-xs">Release notes</span>
              <p className="text-sm mt-0.5">{currentVersion.releaseNotes}</p>
            </div>
          )}
        </GlassPanel>
      )}

      <GlassPanel radius="lg">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center gap-2 mb-3.5">
            <Icon name="edit" size={17} className="text-tint" />
            <span className="text-sm font-bold">{currentVersion ? 'Update version' : 'Publish version'}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3">
            <SheetField label="Version" value={version} onChange={setVersion} placeholder="e.g. 1.2.0" required />
            <SheetField label="Version code" value={versionCode} onChange={setVersionCode} type="number" placeholder="e.g. 3" required />
          </div>

          <div className="mt-3.5">
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">Release notes</label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="What's new in this release..."
              rows={3}
              className="w-full px-3.5 py-3 rounded-[11px] border border-border bg-card text-[14px] outline-none transition-all focus:border-tint focus:shadow-[0_0_0_3px_var(--tint-b)] resize-y placeholder:text-text-secondary"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none mt-3.5">
            <input
              type="checkbox"
              checked={forceUpdate}
              onChange={(e) => setForceUpdate(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-tint cursor-pointer"
            />
            <span className="text-sm font-semibold">Force update (users must update before using the app)</span>
          </label>

          <div className="border-t border-border pt-4 mt-4">
            <span className="text-sm font-bold">APK file</span>
            <p className="text-xs text-text-secondary mt-0.5 mb-3">Upload an APK to Firebase Storage. The download URL will be set automatically.</p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                dragActive ? 'border-tint bg-tint-a scale-[1.01]' : 'border-border hover:border-tint/50 hover:bg-tint-a'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".apk,application/vnd.android.package-archive" className="hidden" onChange={handleFileChange} />
              <div className="w-12 h-12 rounded-full bg-tint-a grid place-items-center">
                <Icon name="upload" size={22} className="text-tint" />
              </div>
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-bold">{selectedFile.name}</span>
                  <span className="text-xs text-text-secondary">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  {!uploading && (
                    <div className="flex gap-2 mt-1">
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleUpload(); }} className="px-3.5 py-2 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint transition-colors flex items-center gap-1.5">
                        <Icon name="upload" size={13} />
                        Upload to storage
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer text-text-secondary hover:text-text-main transition-colors">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold">Drag & drop your APK here, or click to browse</span>
                  <span className="text-xs text-text-secondary">.apk files only</span>
                </>
              )}

              {uploading && (
                <div className="w-full max-w-xs flex flex-col gap-2 mt-2">
                  <div className="w-full bg-tint-a rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-tint rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-xs text-text-secondary text-center">{uploadProgress}% uploaded</span>
                </div>
              )}
            </div>
          </div>

          {apkLink ? (
            <div className="flex items-center gap-2 p-3 rounded-xl mt-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Icon name="check" size={15} className="text-ok" />
              <span className="text-sm font-medium">APK uploaded and download URL set.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl mt-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Icon name="alert-triangle" size={15} className="text-warn" />
              <span className="text-sm font-medium">Upload an APK file before publishing.</span>
            </div>
          )}

          <div className="flex gap-2.5 mt-4">
            <button type="submit" disabled={saving || uploading} className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-sm font-bold cursor-pointer hover:bg-tint disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : currentVersion ? 'Update version' : 'Publish version'}
            </button>
            {currentVersion?.apkLink && (
              <button type="button" onClick={() => window.open(currentVersion.apkLink, '_blank')} className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex items-center gap-1.5">
                <Icon name="smartphone" size={15} />
                Download current APK
              </button>
            )}
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
