import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AutoFillPage from './AutoFillPage';

// Optionally, group fields by keywords (simple heuristic)
function groupFields(fields) {
  const groups = {
    'Applicant Info': [],
    'Address': [],
    'Plant Info': [],
    'Vendor Info': [],
    'Other': []
  };
  fields.forEach(f => {
    const lower = f.toLowerCase();
    if (lower.includes('address')) groups['Address'].push(f);
    else if (lower.includes('vendor')) groups['Vendor Info'].push(f);
    else if (lower.includes('plant') || lower.includes('capacity') || lower.includes('module') || lower.includes('inverter') || lower.includes('voltage')) groups['Plant Info'].push(f);
    else if (lower.includes('name') || lower.includes('applicant') || lower.includes('mobile') || lower.includes('email') || lower.includes('service number')) groups['Applicant Info'].push(f);
    else groups['Other'].push(f);
  });
  return groups;
}

const defaultFieldValues = {
  efficiency: "22.7",
  ProjectModel: "CAPEX",
  NameofVendor: "Mahalakshmi Power Systems",
  DoorNo: "8-4-21/4",
  Street: "1",
  "City/Village": "Karmanghat",
  Mandal: "Saroornagar",
  Phone: "9989944422",
  Mobile: "8121999982",
  EmailIDOfVendor: "mahalakshmipowersystems@gmail.com",
  Inputvoltage: "360 d.c.V",
  Outputvoltage: "230 a.c.V",
  GridSupply: "YES",
  DetailsOfProtective: "Earthing And Lightening Arrester",
  VoltageLevel: "230",
  Discom: "TGSPDCL",
  FullAddressOfVendor: "8-4-21/4,Kharmanghat, Hyderabad, Telangana 500079"
};


function MainPageContent({
  fieldsLoading, error, fieldNames, defaultFieldValues, customFields, form, handleChange, handleMakeCustom, handleSubmit, loading, pdfUrl
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-blue-50 to-yellow-200 py-10">
      <div className="w-full max-w-4xl p-8 rounded-3xl shadow-2xl bg-white/90 border border-yellow-200 backdrop-blur-md">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-yellow-600 tracking-tight drop-shadow-lg">
          <span className="inline-block align-middle mr-2">☀️</span>
          Solar Subsidy PDF Form Filler
        </h1>
        <div className="flex justify-center mb-8">
          <button
            onClick={() => navigate('/auto-fill')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-400 via-blue-400 to-blue-600 hover:from-green-500 hover:to-blue-700 text-white font-bold text-lg shadow-lg transition"
          >
            Auto Generate (Image Upload)
          </button>
        </div>
        {fieldsLoading ? (
          <div className="text-center text-lg text-gray-500">Loading PDF fields...</div>
        ) : error ? (
          <div className="text-center text-red-600 font-semibold mb-4">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {fieldNames.map((field) => {
                const isDefault = defaultFieldValues[field] !== undefined && !customFields[field];
                return (
                  <div key={field} className="relative group">
                    <input
                      id={field}
                      name={field}
                      placeholder=" "
                      value={form[field] || ''}
                      onChange={handleChange}
                      required={field !== 'text_72wyml'}
                      type='text'
                      readOnly={isDefault}
                      onFocus={() => isDefault && handleMakeCustom(field)}
                      className={
                        `peer block w-full px-3 py-3 rounded-lg border transition placeholder-transparent ` +
                        (isDefault
                          ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                          : 'bg-yellow-50 text-gray-900 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm')
                      }
                    />
                    <label
                      htmlFor={field}
                      className={
                        `absolute left-3 transition-all duration-200 bg-white px-1 ` +
                        (
                          (form[field] && form[field] !== '')
                            ? '-top-5 text-sm text-yellow-600'
                            : 'top-3 text-base text-gray-500 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-yellow-600'
                        ) +
                        (customFields[field] ? ' text-blue-700' : '')
                      }
                    >
                      {field}
                      {customFields[field] && <span className="ml-2 text-xs text-blue-500">(Custom)</span>}
                    </label>
                    {isDefault && (
                      <button
                        type="button"
                        className="absolute right-2 top-2 text-xs text-blue-600 underline opacity-80 group-hover:opacity-100"
                        onClick={() => handleMakeCustom(field)}
                        tabIndex={-1}
                      >
                        Customize?
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              id="auto-submit-btn"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold text-lg shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Generating PDF..." : "Generate PDF"}
            </button>
          </form>
        )}
        {pdfUrl && (
          <div className="mt-8 text-center animate-fadein">
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-96 border rounded-xl mb-4 shadow-lg bg-white"
            />
            <a
              href={pdfUrl}
              download
              className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg transition"
            >
              Download Filled PDF
            </a>
          </div>
        )}
      </div>
      <footer className="mt-8 text-gray-500 text-sm text-center">
        Made with <span className="text-yellow-400">☀️</span> for Solar Subsidy Automation
      </footer>
    </div>
  );
}

function App() {
  const [fieldNames, setFieldNames] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customFields, setCustomFields] = useState({});

  useEffect(() => {
    async function fetchFields() {
      setFieldsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/list-pdf-fields');
        if (!res.ok) {
          // Try to parse error details if available
          let errorMsg = 'Failed to fetch PDF fields';
          try {
            const errorData = await res.json();
            if (errorData.error && errorData.error.message) {
              errorMsg = errorData.error.message;
              // Check for quota/limit error
              if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('limit')) {
                errorMsg += ' Please wait a minute and try again, or come back tomorrow if you have reached the daily limit.';
              }
            }
          } catch (e) { /* ignore JSON parse errors */ }
          throw new Error(errorMsg);
        }
        const data = await res.json();
        setFieldNames(data.fields);
        // Set default values for fields if present, else empty
        const initialForm = {};
        const initialCustom = {};
        data.fields.forEach(f => {
          initialForm[f] = defaultFieldValues[f] || '';
          initialCustom[f] = false;
        });
        setForm(initialForm);
        setCustomFields(initialCustom);
      } catch (err) {
        setError('Error: ' + err.message);
      } finally {
        setFieldsLoading(false);
      }
    }
    fetchFields();
  }, []);

  useEffect(() => {
    // Only run after fields are loaded
    if (!fieldsLoading && fieldNames.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const newForm = { ...form };
      let hasParams = false;
      // 1. Check URL params
      fieldNames.forEach(f => {
        if (params.has(f)) {
          newForm[f] = params.get(f);
          hasParams = true;
        }
      });
      // 2. If no URL params, check localStorage
      if (!hasParams) {
        try {
          const stored = localStorage.getItem('formData');
          if (stored) {
            const parsed = JSON.parse(stored);
            fieldNames.forEach(f => {
              if (parsed[f]) {
                newForm[f] = parsed[f];
                hasParams = true;
              }
            });
          }
        } catch (e) { /* ignore */ }
      }
      if (hasParams) {
        setForm(newForm);
        // Auto-submit the form to generate PDF preview
        setTimeout(() => {
          document.getElementById('auto-submit-btn')?.click();
        }, 500); // Wait for form state to update
      }
    }
    // eslint-disable-next-line
  }, [fieldsLoading, fieldNames]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setCustomFields({ ...customFields, [e.target.name]: true });
  };

  const handleMakeCustom = (field) => {
    setCustomFields({ ...customFields, [field]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPdfUrl(null);
    setError(null);
    try {
      const data = new URLSearchParams();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
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
    <Router>
      <Routes>
        <Route path="/" element={
          <MainPageContent
            fieldsLoading={fieldsLoading}
            error={error}
            fieldNames={fieldNames}
            defaultFieldValues={defaultFieldValues}
            customFields={customFields}
            form={form}
            handleChange={handleChange}
            handleMakeCustom={handleMakeCustom}
            handleSubmit={handleSubmit}
            loading={loading}
            pdfUrl={pdfUrl}
          />
        } />
        <Route path="/auto-fill" element={<AutoFillPage />} />
      </Routes>
    </Router>
  );
}

export default App;
