const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads') });
require('dotenv').config();
const { GoogleGenAI, createUserContent } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TEMPLATE_PATH = path.join(__dirname, 'pdf', 'EditCut.pdf');
const FIELD_LIST_PATH = path.join(__dirname, 'pdf_fields.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Remove the temporary model listing code for deployment

const prompts = {
  discom: `For each of the following, extract the value from the field with the given label in the image and return as JSON:
- "Full Name of Premises Owner Person" → "Nameoftheapplicant"
- "Mobile" → "MobileNumber"
- "Email" → "Email"
- "Address of Premises for installation" → "AddressOfInstallation"
- "Pincode" → "PinCode"
- "State" → "State"
- "District" → "District"
- "Consumer Account Number (CA No.)" → "UscNumber"

Return as:
{
  "Nameoftheapplicant": "",
  "MobileNumber": "",
  "Email": "",
  "AddressOfInstallation": "",
  "PinCode": "",
  "State": "",
  "District": "",
  "UscNumber": ""
}
If a value is missing, return "".`,
  netMeter: `For each of the following, extract the value from the field with the given label in the image and return as JSON:
- "Registration Number" → "NetMeterRegistrationNumber"
- "Registration Date" → "RegistrationDate"
- "Name" → "Nameoftheapplicant"
- "Service No" → "ServiceNumber"
- "Category" → "cat"
- "Category" → "CategoryInDiscom"
- "Existing Load" → "LoadinkW"
- "Proposed Solar Capacity" → "TotalPlantCapacity"

Return as:
{
  "NetMeterRegistrationNumber": "",
  "RegistrationDate": "",
  "Nameoftheapplicant": "",
  "ServiceNumber": "",
  "cat": "",
  "CategoryInDiscom": "",
  "LoadinkW": "",
  "TotalPlantCapacity": ""
}
If a value is missing, return "".`,
  location: `Extract the following fields from this image and return as JSON:\n{\n  "Latitude": "",\n  "Longitude": ""\n}\nIf a value is missing, return "".`,
  pvModule: `Extract the following fields from this image and return as JSON:\n{\n  "PVMake": "",\n  "PVSerialnumber": "",\n  "Typeofmodule": "",\n  "Capacityofeachmodule": "",\n  "Numberofmodules": "",\n  "Totalcapacity": ""\n}\nIf a value is missing, return "".`,
  inverter: `For each of the following, extract the value from the field with the given label in the image and return as JSON:
- "Make" → "InverterMake"
- "Model" → "InverterModel"
- "Serial No." → "InverterSerialnumber"
- "Capacity" → "InverterCapacity"
- "Input Voltage" → "Inputvoltage"
- "Output Voltage" → "Outputvoltage"

Return as:
{
  "InverterMake": "",
  "InverterModel": "",
  "InverterSerialnumber": "",
  "InverterCapacity": "",
  "Inputvoltage": "",
  "Outputvoltage": ""
}
If a value is missing, return "".`
};

async function callGeminiWithRetries(imageBase64, prompt, mimeType, maxRetries = 5) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      console.log("[Gemini DEBUG] Sending to Gemini:", { prompt, mimeType, base64: imageBase64.slice(0, 30) + "..." });
      const userContent = [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ];
      const response = await ai.models.generateContent({
        model: "models/gemini-flash-lite-latest", // Best for free tier: optimized for cost and quota
        contents: userContent,
      });
      console.log("[Gemini DEBUG] Raw response:", JSON.stringify(response, null, 2));
      if (!response.candidates || response.candidates.length === 0) {
        console.error("[Gemini ERROR] No candidates found in Gemini response or response is undefined.");
        return null;
      }
      const text = response.candidates[0].content.parts[0].text;
      try {
        return JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      } catch (jsonParseError) {
        console.error("[Gemini ERROR] Failed to parse JSON from response text:", jsonParseError);
        console.error("[Gemini ERROR] Raw text from Gemini:", text);
        return null;
      }
    } catch (error) {
      // Retry on 503/model overload
      if (
        (error.status === 503 || (error.message && error.message.includes("overloaded"))) &&
        retries < maxRetries - 1
      ) {
        retries++;
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 500;
        console.warn(`[Retry] Gemini call failed (503). Retrying in ${delay / 1000}s... (Attempt ${retries}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error("[Gemini ERROR] Final attempt failed or non-retryable error:", error);
        return null;
      }
    }
  }
  console.error("[Gemini ERROR] Gemini call failed after multiple retries.");
  return null;
}

// Utility: Sanitize text to remove/replace non-ASCII characters
function sanitizeText(str) {
  if (!str) return '';
  // Replace common Greek Mu with 'M', and remove other non-ASCII
  return str.replace(/[\u039C\u03BC]/g, 'M').replace(/[^\x00-\x7F]/g, '');
}

// Helper to try loading a Unicode font
async function tryEmbedUnicodeFont(pdfDoc) {
  const fontPath = path.join(__dirname, 'pdf', 'NotoSans-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    const fontBytes = fs.readFileSync(fontPath);
    return await pdfDoc.embedFont(fontBytes);
  }
  return null;
}

// Updated inverter prompt with explicit field labels (adjust as per your image)
prompts.inverter = `For each of the following, extract the value from the field with the given label in the image and return as JSON:
- "Make" → "InverterMake"
- "Model" → "InverterModel"
- "Serial No." → "InverterSerialnumber"
- "Capacity" → "InverterCapacity"
- "Input Voltage" → "Inputvoltage"
- "Output Voltage" → "Outputvoltage"

Return as:
{
  "InverterMake": "",
  "InverterModel": "",
  "InverterSerialnumber": "",
  "InverterCapacity": "",
  "Inputvoltage": "",
  "Outputvoltage": ""
}
If a value is missing, return "".`;

app.post('/api/fill-pdf', async (req, res) => {
  try {
    console.log('Received body:', req.body); // Debug: log incoming data
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(404).json({ error: 'Template PDF not found' });
    }
    const existingPdfBytes = fs.readFileSync(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    const fieldNames = JSON.parse(fs.readFileSync(FIELD_LIST_PATH, 'utf8'));
    // Try to embed Unicode font
    let unicodeFont = await tryEmbedUnicodeFont(pdfDoc);
    // Fill only fields that exist in the PDF and are present in the request body
    for (const fieldName of fieldNames) {
      if (req.body[fieldName] !== undefined && req.body[fieldName] !== null && req.body[fieldName] !== '') {
        let value = req.body[fieldName];
        if (!unicodeFont) value = sanitizeText(value);
        try {
          const textField = form.getTextField(fieldName);
          if (unicodeFont) textField.updateAppearances(unicodeFont);
          textField.setText(value);
        } catch (e) {
          console.error(`Error setting field '${fieldName}' with value '${value}':`, e.stack || e);
        }
      }
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Filled_Solar_Subsidy.pdf');
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Failed to generate PDF:', err.stack || err);
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
});

app.post('/api/gemini-autofill', upload.fields([
  { name: 'discom', maxCount: 1 },
  { name: 'netMeter', maxCount: 1 },
  { name: 'location', maxCount: 1 },
  { name: 'pvModule', maxCount: 1 },
  { name: 'inverter', maxCount: 1 },
]), async (req, res) => {
  try {
    const fileToBase64 = (file) => {
      if (!file) return '';
      const data = fs.readFileSync(file.path);
      return data.toString('base64');
    };
    const fileMimeType = (file) => file?.mimetype || 'image/jpeg';
    const images = {
      discom: req.files['discom']?.[0],
      netMeter: req.files['netMeter']?.[0],
      location: req.files['location']?.[0],
      pvModule: req.files['pvModule']?.[0],
      inverter: req.files['inverter']?.[0],
    };
    const results = {};
    for (const [key, file] of Object.entries(images)) {
      if (file) {
        const base64 = fileToBase64(file);
        const prompt = prompts[key];
        const mimeType = fileMimeType(file);
        results[key] = await callGeminiWithRetries(base64, prompt, mimeType);
      } else {
        results[key] = {};
      }
    }
    // Merge all fields into one object
    const merged = Object.assign({}, ...Object.values(results));
    // If CategoryInDiscom is missing but cat is present, set it
    if (!merged.CategoryInDiscom && merged.cat) {
      merged.CategoryInDiscom = merged.cat;
    }
    res.json(merged);
  } catch (err) {
    console.error("Unhandled error in /api/gemini-autofill:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

app.post('/api/gemini-autofill-pdf', upload.fields([
  { name: 'discom', maxCount: 1 },
  { name: 'netMeter', maxCount: 1 },
  { name: 'location', maxCount: 1 },
  { name: 'pvModule', maxCount: 1 },
  { name: 'inverter', maxCount: 1 },
]), async (req, res) => {
  try {
    const fileToBase64 = (file) => {
      if (!file) return '';
      const data = fs.readFileSync(file.path);
      return data.toString('base64');
    };
    const fileMimeType = (file) => file?.mimetype || 'image/jpeg';
    const images = {
      discom: req.files['discom']?.[0],
      netMeter: req.files['netMeter']?.[0],
      location: req.files['location']?.[0],
      pvModule: req.files['pvModule']?.[0],
      inverter: req.files['inverter']?.[0],
    };
    const results = {};
    for (const [key, file] of Object.entries(images)) {
      if (file) {
        const base64 = fileToBase64(file);
        const prompt = prompts[key];
        const mimeType = fileMimeType(file);
        results[key] = await callGeminiWithRetries(base64, prompt, mimeType);
      } else {
        results[key] = {};
      }
    }
    // Merge all fields into one object
    const merged = Object.assign({}, ...Object.values(results));
    // If CategoryInDiscom is missing but cat is present, set it
    if (!merged.CategoryInDiscom && merged.cat) {
      merged.CategoryInDiscom = merged.cat;
    }

    // Fill PDF using merged fields (same as /api/fill-pdf)
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(404).json({ error: 'Template PDF not found' });
    }
    const existingPdfBytes = fs.readFileSync(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    const fieldNames = JSON.parse(fs.readFileSync(FIELD_LIST_PATH, 'utf8'));
    let unicodeFont = await tryEmbedUnicodeFont(pdfDoc);
    for (const fieldName of fieldNames) {
      if (merged[fieldName] !== undefined && merged[fieldName] !== null && merged[fieldName] !== '') {
        let value = merged[fieldName];
        if (!unicodeFont) value = sanitizeText(value);
        try {
          const textField = form.getTextField(fieldName);
          if (unicodeFont) textField.updateAppearances(unicodeFont);
          textField.setText(value);
        } catch (e) {
          // Not a text field, ignore
        }
      }
    }
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Filled_Solar_Subsidy.pdf');
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: 'Failed to process images and generate PDF', details: err.message });
  }
});

// Utility route to list all PDF form field names (from JSON)
app.get('/api/list-pdf-fields', async (req, res) => {
  try {
    const fieldNames = JSON.parse(fs.readFileSync(FIELD_LIST_PATH, 'utf8'));
    res.json({ fields: fieldNames });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list PDF fields', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
