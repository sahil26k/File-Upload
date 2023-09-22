import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function FileUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [savedFilesData, setSavedFilesData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSavedFilesData();
  }, []);

  const loadSavedFilesData = async () => {
    try {
      const response = await axios.get('https://file-upload-api-zeta.vercel.app/saved-files');
      setSavedFilesData(response.data);
    } catch (error) {
      console.error('Error fetching saved files data:', error);
    }
  };

  const handleFileChange = (files) => {
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage(`File '${file.name}' is above 2MB and cannot be uploaded.`);
        return;
      }
    }
    setErrorMessage('');
    setSelectedFiles((prevSelectedFiles) => [...prevSelectedFiles, ...files]);
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('files', file);

    try {
      const response = await axios.post('https://file-upload-api-zeta.vercel.app/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSavedFilesData((prevSavedFilesData) => [
        ...prevSavedFilesData,
        {
          filename: file.name,
          length: (file.size / 1024).toFixed(2),
          uploadDate: new Date().toString(),
        },
      ]);

      setSelectedFiles((prevSelectedFiles) => prevSelectedFiles.filter((f) => f !== file));
    } catch (error) {
      console.error(`Error uploading file '${file.name}':`, error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileChange,
    multiple: true,
  });

  const handleDownloadFile = async (filename) => {
    try {
      const response = await axios.get(`https://file-upload-api-zeta.vercel.app/download/${filename}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading file '${filename}':`, error);
    }
  };

  return (
    <div>
      <h1 className="heading">File Upload App</h1>
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop some files here, or click to select files</p>
        <div className="button1">
          <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
            Upload file
          </Button>
        </div>
      </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="box-wrap table-wrap">
        <h2 className="heading">Selected Files</h2>
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Size (KB)</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedFiles.map((file, index) => (
              <tr key={index}>
                <td>{file.name}</td>
                <td>{(file.size / 1024).toFixed(2)}</td>
                <td>{new Date().toString()}</td>
                <td>
                  <Button variant="contained" onClick={() => handleUploadFile(file)}>Upload</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="box-wrap table-wrap">
        <h2 className="heading">Saved Files</h2>
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Size (KB)</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {savedFilesData.map((file, index) => (
              <tr key={index}>
                <td>{file.filename}</td>
                <td>{(file.length / 1024).toFixed(2)}</td>
                <td>{file.uploadDate}</td>
                <td>
                  <Button variant="contained" onClick={() => handleDownloadFile(file.filename)}>Download</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FileUpload;
