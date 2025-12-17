import React, { useState } from 'react';

const initialState = {
  discom: null,      // National Portal Screenshot
  netMeter: null,   // NETMETERING REGISTRATION
  location: null,   // Location Screenshot
  pvModule: null,   // Panel Label Photo
  inverter: null,   // Inverter Screenshot
};

export default function AutoFillPage() {
  const [images, setImages] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleFileChange = (e, key) => {
    setImages({ ...images, [key]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if at least one image is uploaded
    const hasAnyImage = Object.values(images).some(img => img !== null);
    if (!hasAnyImage) {
      setError('Please upload at least one image to extract fields.');
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);
    setPdfUrl(null);
    const formData = new FormData();
    
    // Only append images that are actually selected
    if (images.discom) formData.append('discom', images.discom);
    if (images.netMeter) formData.append('netMeter', images.netMeter);
    if (images.location) formData.append('location', images.location);
    if (images.pvModule) formData.append('pvModule', images.pvModule);
    if (images.inverter) formData.append('inverter', images.inverter);
    
    try {
      const res = await fetch('/api/gemini-autofill', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to process images');
      const data = await res.json();
      setResult(data);
      // Save to localStorage and redirect to main page
      localStorage.setItem('formData', JSON.stringify(data));
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setLoading(true);
    setError("");
    setPdfUrl(null);
    try {
      const data = new URLSearchParams();
      Object.entries(result).forEach(([key, value]) => data.append(key, value));
      const res = await fetch('/api/fill-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-yellow-100 py-10">
      <div className="w-full max-w-xl p-8 rounded-3xl shadow-2xl bg-white/90 border border-yellow-200 backdrop-blur-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Auto-Fill PDF from Images</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-medium mb-1">1. National Portal Screenshot <span className="text-gray-500 text-sm">(Optional)</span></label>
            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'discom')} />
          </div>
          <div>
            <label className="block font-medium mb-1">2. NET METERING SCREENSHOT FROM TGSPDCL <span className="text-gray-500 text-sm">(Optional)</span></label>
            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'netMeter')} />
          </div>
          <div>
            <label className="block font-medium mb-1">3. Location Screenshot <span className="text-gray-500 text-sm">(Optional)</span></label>
            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'location')} />
          </div>
          <div>
            <label className="block font-medium mb-1">4. Panel Label Photo <span className="text-gray-500 text-sm">(Optional)</span></label>
            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'pvModule')} />
          </div>
          <div>
            <label className="block font-medium mb-1">5. Inverter Screenshot <span className="text-gray-500 text-sm">(Optional)</span></label>
            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'inverter')} />
          </div>
          <div className="text-sm text-gray-600 text-center italic">
            * Upload at least one image to extract fields
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-yellow-500 text-white font-bold text-lg shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? 'Processing...' : 'Extract Fields'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        {result && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-bold mb-2 text-blue-700">Extracted Fields:</h3>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            <button onClick={handleDownloadPdf} className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? 'Generating PDF...' : 'Download Filled PDF'}
            </button>
            {pdfUrl && (
              <div className="mt-4 text-center">
                <a href={pdfUrl} download className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg transition">
                  Click here if your PDF did not download automatically
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 