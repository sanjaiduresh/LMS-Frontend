import React, { useState } from 'react';
import axios from 'axios';
import { BULK_UPLOAD_URL } from '../api';
import '../styles/BulkUpload.css';
const BulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setMessage('');
      } else {
        setMessage('Please select an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${BULK_UPLOAD_URL}/api/users/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(res.data.message || 'Upload successful');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setMessage('');
    const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-header">
        <span className="bulk-upload-icon">📄</span>
        <h3 className="bulk-upload-title">Bulk Import Users</h3>
        <p className="bulk-upload-subtitle">Upload Excel file to import multiple users</p>
      </div>

      <div 
        className={`bulk-upload-dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="bulk-upload-drop-content">
              <span className="bulk-upload-drop-icon">📁</span>
              <p className="bulk-upload-drop-text">
                Drag and drop your Excel file here, or{' '}
                <label htmlFor="bulk-upload-input" className="bulk-upload-browse-link">
                  browse
                </label>
              </p>
              <p className="bulk-upload-drop-hint">Supports .xlsx and .xls files</p>
            </div>
            <input
              id="bulk-upload-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="bulk-upload-input"
            />
          </>
        ) : (
          <div className="bulk-upload-file-preview">
            <div className="bulk-upload-file-info">
              <span className="bulk-upload-file-icon">📊</span>
              <div className="bulk-upload-file-details">
                <p className="bulk-upload-file-name">{file.name}</p>
                <p className="bulk-upload-file-size">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button 
              className="bulk-upload-remove-btn" 
              onClick={removeFile}
              type="button"
            >
              ✖
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`bulk-upload-message ${message.includes('successful') ? 'success' : 'error'}`}>
          <span className="bulk-upload-message-icon">
            {message.includes('successful') ? '✅' : '⚠️'}
          </span>
          {message}
        </div>
      )}

      <div className="bulk-upload-actions">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`bulk-upload-btn ${!file || isUploading ? 'disabled' : ''}`}
        >
          {isUploading ? (
            <>
              <span className="bulk-upload-spinner">⟳</span>
              Uploading...
            </>
          ) : (
            <>
              <span>📤</span>
              Upload File
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BulkUpload;