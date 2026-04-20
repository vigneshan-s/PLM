import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import SlideOver from '../../components/ui/SlideOver';
import { UploadCloud, File as FileIcon, Search, Filter, MoreHorizontal, FileText, Settings, Download, Lock, Loader, Unlock } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../../store';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function FileManagement() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetPart, setTargetPart] = useState('');
  const [uploading, setUploading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { fetchFiles, files, isLoading, partsList, fetchPartsList, uploadFile, checkoutFile, checkinFile } = useAppStore();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    fetchFiles();
    fetchPartsList();
  }, [fetchFiles, fetchPartsList]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (!targetPart) return toast.error('Please select a Target Component first!');
      if (!acceptedFiles.length) return;

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('partId', targetPart);

      setUploading(true);
      const toastId = toast.loading(`Uploading ${file.name}...`);

      const res = await uploadFile(formData);

      setUploading(false);
      if (res.success) {
        toast.success('File uploaded and linked successfully!', { id: toastId });
        setTargetPart('');
      } else {
        toast.error(res.error || 'Upload failed', { id: toastId });
      }
    }
  });

  // Real download using server-served /uploads/ route
  const handleDownload = (file) => {
    const baseURL = import.meta.env.DEV ? 'http://localhost:4000' : '';
    const url = `${baseURL}${file.url}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${file.fileName}`);
  };

  const handleCheckout = async () => {
    if (!selectedFile) return;
    setCheckingOut(true);
    const res = await checkoutFile(selectedFile.id);
    setCheckingOut(false);
    if (res.success) {
      toast.success(`"${selectedFile.fileName}" checked out to you.`);
      setSelectedFile(res.data); // update slide with fresh data
    } else {
      toast.error(res.error || 'Checkout failed');
    }
  };

  const handleCheckin = async () => {
    if (!selectedFile) return;
    setCheckingOut(true);
    const res = await checkinFile(selectedFile.id);
    setCheckingOut(false);
    if (res.success) {
      toast.success(`"${selectedFile.fileName}" checked back in.`);
      setSelectedFile(res.data);
    } else {
      toast.error(res.error || 'Check-in failed');
    }
  };

  const filteredFiles = files?.filter(f =>
    !searchQuery ||
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.part?.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMyCheckout = selectedFile?.lockedById === user?.id;
  const isCheckedOut = !!selectedFile?.lockedById;

  return (
    <AppShell title="Files & Assets">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-1">Document Vault</h1>
          <p className="text-subtle">Secure CAD, drawings, and spec-sheet management.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (!targetPart) {
            toast.error('Please select a Target Component first!');
            return;
          }
          open();
        }}>
          <UploadCloud size={16} /> Upload New File
        </button>
      </div>

      <div className="flex-start mb-4" style={{ gap: 12 }}>
        <label className="field-label m-0" style={{ flexShrink: 0 }}>Target Component:</label>
        <select className="field-input m-0" value={targetPart} onChange={e => setTargetPart(e.target.value)} style={{ padding: '8px 12px', width: 300 }}>
          <option value="">-- Choose Part Database Link --</option>
          {partsList?.map(p => <option key={p.id} value={p.id}>{p.partNumber} ({p.name})</option>)}
        </select>
      </div>

      <div {...getRootProps()} className="paper animate-enter" style={{ padding: 40, border: isDragActive ? '2px dashed var(--primary)' : '2px dashed var(--border)', background: isDragActive ? 'var(--primary-50)' : 'var(--bg-app)', textAlign: 'center', cursor: 'pointer', marginBottom: 32, transition: 'all 0.2s', opacity: uploading ? 0.5 : 1, pointerEvents: uploading ? 'none' : 'auto' }}>
        <input {...getInputProps()} />
        {uploading ? (
           <Loader className="animate-spin" size={40} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        ) : (
           <UploadCloud size={40} color={isDragActive ? 'var(--primary)' : 'var(--border-strong)'} style={{ margin: '0 auto 16px' }} />
        )}
        <h3 className="heading-3" style={{ color: isDragActive ? 'var(--primary-dark)' : 'var(--text-secondary)' }}>{uploading ? 'Processing and encrypting...' : 'Drag & drop CAD files or PDFs here'}</h3>
        <p className="text-subtle mt-2">Maximum file size 50MB. SolidWorks, STEP, PDF supported.</p>
      </div>

      <div className="paper p-0">
        <div className="flex-between" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-bar" style={{ width: 300, background: 'var(--bg-app)' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by file name or part..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
            <Filter size={16} /> {searchQuery ? 'Clear Filter' : 'Filters'}
          </button>
        </div>

        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Part Association</th>
                <th>Version</th>
                <th>Status</th>
                <th>Size</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading Document Vault from Database...</td></tr>
              ) : filteredFiles?.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No files match your search.' : 'Vault is empty. Upload CAD files to begin.'}
                </td></tr>
              ) : filteredFiles?.map(f => (
                <tr key={f.id} className="data-table-row-hoverable" onClick={() => setSelectedFile(f)}>
                  <td>
                    <div className="flex-start" style={{ gap: 12 }}>
                      <FileIcon size={16} color={f.fileName.endsWith('.pdf') ? '#ef4444' : '#3b82f6'} />
                      <span style={{ fontWeight: 600 }}>{f.fileName}</span>
                      {f.lockedById && <Lock size={12} color="var(--warning)" />}
                    </div>
                  </td>
                  <td className="text-mono">{f.part.partNumber}</td>
                  <td><span className="badge badge-outline">v{f.version}</span></td>
                  <td><span className={`badge ${f.lockedById ? 'badge-amber' : 'badge-green'}`}>{f.lockedById ? 'Checked Out' : 'Available'}</span></td>
                  <td className="text-subtle">{(f.sizeBytes / 1024 / 1024).toFixed(1)} MB</td>
                  <td>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDownload(f); }} title="Download">
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SlideOver
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        title={selectedFile?.fileName}
      >
        {selectedFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* File Header */}
            <div className="paper bg-app" style={{ border: 'none', display: 'flex', gap: 16, alignItems: 'center', padding: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} color="var(--text-secondary)" />
              </div>
              <div>
                <h4 className="heading-3">{selectedFile.part.partNumber}</h4>
                <div className="flex-start text-subtle text-mono" style={{ fontSize: 11, gap: 12, marginTop: 4 }}>
                  <span>Rev {selectedFile.part.currentRev}</span>
                  <span>v{selectedFile.version}</span>
                  <span>{(selectedFile.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => handleDownload(selectedFile)}
              >
                <Download size={16} /> Download
              </button>

              {isCheckedOut ? (
                isMyCheckout ? (
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={handleCheckin}
                    disabled={checkingOut}
                  >
                    {checkingOut ? <Loader size={14} className="animate-spin" /> : <Unlock size={16} />}
                    {checkingOut ? 'Checking In...' : 'Check In'}
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled style={{ flex: 1, opacity: 0.5 }}>
                    <Lock size={16} /> Locked by {selectedFile.lockedBy?.name || 'User'}
                  </button>
                )
              ) : (
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? <Loader size={14} className="animate-spin" /> : <Settings size={16} />}
                  {checkingOut ? 'Checking Out...' : 'Check Out'}
                </button>
              )}
            </div>

            {/* Version History */}
            <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <h4 className="heading-3 mb-4">Version History</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...Array(parseInt(selectedFile.version) || 1)].map((_, i, arr) => {
                  const ver = arr.length - i;
                  const isCurrent = ver === arr.length;
                  return (
                    <div key={i} className="flex-between">
                      <div className="flex-start" style={{ gap: 12 }}>
                        <span className={`badge ${isCurrent ? 'badge-green' : 'badge-outline'}`}>v{ver}.0</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600 }}>{isCurrent ? 'Current Version' : 'Previous baseline'}</p>
                          <p className="text-subtle text-mono" style={{ fontSize: 10 }}>2026-03-{28 - i} by System</p>
                        </div>
                      </div>
                      <button
                        className="icon-btn"
                        title="Download this version"
                        onClick={() => handleDownload({ url: selectedFile.url, fileName: `v${ver}_${selectedFile.fileName}` })}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  );
}
