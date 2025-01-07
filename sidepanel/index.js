import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory
} from '../node_modules/@google/generative-ai/dist/index.mjs';

// Important! Do not expose your API in your extension code. You have to
// options:
//
// 1. Let users provide their own API key.
// 2. Manage API keys in your own server and proxy all calls to the Gemini
// API through your own server, where you can implement additional security
// measures such as authentification.
//
// It is only OK to put your API key into this file if you're the only
// user of your extension or for testing.

let genAI = null;
let model = null;

const buttonPrompt = document.body.querySelector('#button-prompt');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const uploadButton = document.getElementById('uploadBtn');
const deleteButton = document.getElementById('deleteBtn');
const copyButton = document.getElementById('copyBtn');
const coverLetterSection = document.querySelector('#coverLetterSection')
const coverLetterText = document.getElementById('coverLetterText');
const downloadLink = document.getElementById('clDownloadLink');
const applyChanges = document.getElementById("editButton");

// Event listeners
uploadButton.addEventListener('click', uploadResume);
deleteButton.addEventListener('click', deleteResume);
buttonPrompt.addEventListener('click', generateCoverLetter);
copyButton.addEventListener('click', copyToClipboard);
applyChanges.addEventListener('click', editCoverLetter);

hide(coverLetterSection)

console.log("Script Started");

document.addEventListener('DOMContentLoaded', () => {
  checkResume();

  // Add an event listener to the file input to display the filename when it changes
  const resumeInput = document.getElementById('resumeInput');
  const selectedFilename = document.getElementById('selectedFilename');

  resumeInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      selectedFilename.value = file.name;
    } else {
      selectedFilename.value = '';
    }
  });
});

function editCoverLetter() {
  hide(coverLetterSection)
  show(elementLoading)
  showCoverLetter(coverLetterText.value);
}

function base64ToBlob(base64, mime) {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];
  const sliceSize = 512;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mime });
}

function copyToClipboard() {
  console.log("copy button pressed!")
  try {
    const coverLetter = coverLetterText.value; // Get the current value from the textarea
    navigator.clipboard.writeText(coverLetter);
    alert('Cover letter copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy cover letter to clipboard:', error);
    alert('Failed to copy cover letter. Please try again.');
  }
}

async function showCoverLetter(coverLetter) {
  const payload = {
    "cover-letter": coverLetter
  }

  const response = await fetch('http://127.0.0.1:5000/api/cover_letter_blob', { // Replace with your backend URL
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.log(response);
    downloadLink.href = "#";
    console.error(`Server responded with status ${response.status}`);
  } else {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    show(downloadLink);
  }

  hide(elementLoading);
  show(coverLetterSection);

  coverLetterText.value = coverLetter;
}

function checkResume() {
  console.log("check resume called");
  console.log(coverLetterSection);
  console.log(copyButton);
  chrome.storage.local.get(['resume'], (result) => {
    console.log("check resume called");
    if (result.resume) {
      // Resume exists, display it
      document.getElementById('resumeSection').style.display = 'block';
      document.getElementById('uploadSection').style.display = 'none';
      
      // Create a download link
      const blob = base64ToBlob(result.resume.data, result.resume.mime);
      const url = URL.createObjectURL(blob);
      const resumeDownloadLink = document.getElementById('downloadLink');
      resumeDownloadLink.href = url;
      resumeDownloadLink.download = result.resume.filename || 'resume.pdf';
      
    } else {
      // No resume found, show upload section
      document.getElementById('resumeSection').style.display = 'none';
      document.getElementById('uploadSection').style.display = 'block';
    }
  });
}

// Function to upload a resume
function uploadResume() {
  const fileInput = document.getElementById('resumeInput');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file to upload.');
    return;
  }
  
  const reader = new FileReader();
  reader.readAsDataURL(file);
  
  reader.onload = function(e) {
    const base64 = e.target.result;
    const mime = file.type;
    const filename = file.name;
    
    // Save to chrome.storage.local
    chrome.storage.local.set({ 
      resume: { 
        data: base64, 
        mime: mime,
        filename: filename
      } 
    }, async () => {
      const resumeText = await getResumeInfo();
      console.log("Resume Text");
      console.log(resumeText)
      chrome.storage.local.set({
        resumeData: {
          text: resumeText
        }
      }, () => {
        alert('Resume uploaded successfully!');
        checkResume();
      })
    });
  };
  
  reader.onerror = function() {
    alert('Error reading file.');
  };
}

// Function to delete the saved resume
function deleteResume() {
  if (confirm('Are you sure you want to delete your saved resume?')) {
    chrome.storage.local.remove('resume', () => {
      chrome.storage.local.remove('resumeData', () => {
        alert('Resume deleted successfully.');
        checkResume();
      })
    });
  }
}
  

async function initModel(generationConfig) {
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ];

  const api_key_response = await fetch('http://127.0.0.1:5000/api/get_key', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
  });

  const data = await api_key_response.json();

  const apiKey = data.key;

  console.log("API KEY:", apiKey);

  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig
  });

  console.log("Testing model");
  const result = await model.generateContent("Hello");
  console.log(result.response.text());
  return model;
}

async function runPrompt(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}

async function generateCoverLetter() {
  showLoading();
  hide(coverLetterSection)
  console.log("Button Clicked")

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`Key: ${key}, Value: ${value}`);
  }

  try {
    chrome.storage.local.get(['resumeData'], async (result) => {
      if (result["resumeData"]["text"]) {
        const resumeInfo = result["resumeData"]["text"];
        const jobReqs = await getJobRequirements();
        if (jobReqs && resumeInfo) {
          const coverLetter = await getCoverLetter(jobReqs, resumeInfo);
          showCoverLetter(coverLetter);
        } else {
          var message = ""
          if (!resumeInfo) {
            message = "Error handling resume, please try deleting and uploading again"
          } else {
            message = "Error getting job description, please refresh the tab and try again"
          }
          showError(message)
        }
      } else {
        showError("Please upload resume to generate tailored cover letter")
      }
    })
  } catch (error) {
    showError(error);
  }
}

async function getJobRequirements() {
  try {
    const jobReqs = await getReqs();
    console.log("to Ret:");
    console.log(jobReqs);
    return jobReqs;
  } catch (error) {
    console.error("Failed to get job requirements:", error);
    return "";
  }
}

// Helper function to promisify chrome.tabs.query
function queryTabs(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tabs);
    });
  });
}

// Helper function to promisify chrome.tabs.sendMessage
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function queryLocalStorageResume() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['resume'], async (result) => {
      if (result.resume) {
        resolve(result);
      } else {
        reject(new Error("Failed to query resume"))
      }
    }) 
  })
}

async function getResumeInfo() {
  try {
    const result = await queryLocalStorageResume();

    const resumeData = result.resume.data;
    const mime = result.resume.mime;
    const filename = result.resume.filename;
        
    // Create a JSON payload
    const payload = {
      filename: filename,
      data: resumeData
    };

    // Send the POST request to the backend API
    const response = await fetch('http://127.0.0.1:5000/api/parse_pdf', { // Replace with your backend URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.log(response)
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const responseData = await response.json();

    return responseData.parsed_text;

  } catch (error) {
    showError(error);
    throw error; // Propagate the error to be caught in getJobRequirements
  }
}

async function getReqs() {
  try {
    // Query the active tab in the current window
    const tabs = await queryTabs({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tabs found.");
    }

    const activeTab = tabs[0];

    // Send a message to the active tab and wait for the response
    const response = await sendMessageToTab(activeTab.id, { type: "GEN_COVER_LETTER" });

    if (!response || !response.prompt) {
      throw new Error("Invalid response from content script.");
    }

    const prompt = response.prompt;

    console.log("Prompt:");
    console.log(prompt);

    // Initialize the model with the generation configuration
    const generationConfig = {
      temperature: 0
    };

    model = await initModel(generationConfig);

    console.log(model)

    const jobReqs = await runPrompt(prompt);

    console.log("Job Reqs:");
    console.log(jobReqs);

    return jobReqs;
  } catch (error) {
    showError(error);
    throw error; // Propagate the error to be caught in getJobRequirements
  }
}

async function getCoverLetter(jobReqs, resumeInfo) {
  const coverLetterPrompt = `You are a professional cover letter writer. Your task is to create a compelling, tailored cover letter for a job applicant based on the information provided. Follow these instructions carefully:
    1. Format:
      - Create a one-page cover letter.
      - It should have AT LEAST 70 and AT MOST 80 characters per line (including space)
      - It should have AT MOST 46 lines including blank lines for formatting
      - Use a professional tone throughout.
      - Do not include actual contact information or dates.
      - Do not mention job listing platform you found the job on, you don't have that information.
      - Do not mention the job ID

    2. Structure:
      - Opening paragraph
      - Body paragraphs
      - Closing paragraph

    3. Opening paragraph:
      - Begin with "Dear Hiring Manager,"
      - State the specific position being applied for.
      - Express genuine enthusiasm for the role and company.
      - Do not mention a referral.

    4. Body paragraph(s):
      - Focus on 2-3 key qualifications that align with the required qualifications.
      - Provide specific examples of the applicant's impact in past roles.
      - Use numbers and percentages to quantify achievements when possible.
      - Demonstrate understanding of the company's mission and values based solely on the job description.
      - Explain how the applicant can add value to the company.

    5. Closing paragraph:
      - Reiterate interest in the position and company.
      - Include a call to action by requesting an interview.
      - Thank the employer for their consideration.

    6. General guidelines:
      - Tailor the letter to the specific job and company mentioned in the job description.
      - Show, don't tell: Use specific examples to illustrate skills and experiences.
      - Convey enthusiasm for the role and industry.
      - Avoid clichés and generic statements.
      - Focus on the employer's needs rather than what the applicant hopes to gain.
      - Do not include any grammatical or spelling errors.

    7. Do not:
      - Use phrases like "To whom it may concern" or "Dear Sir/Madam".
      - Repeat information verbatim from the resume.
      - Include personal information not relevant to the job.
      - Exceed one page in length.

    When writing the cover letter, you will be provided with:
    1. The job description
    2. The applicant's relevant skills and experiences
    3. The applicant's notable achievements

    It is very important that you following the formatting guidelines below:
      - It should have AT LEAST 70 and AT MOST 80 characters per line (including space)
      - It should have AT MOST 46 lines including blank lines for formatting
      - If a adding a word to a line makes it over 80 characters, create a new line
      - You should use a newline character to seperate each line.
    
    Use this information to create a unique, engaging cover letter that highlights the applicant's qualifications and enthusiasm for the role. Remember, the goal is to complement the resume by providing additional context and personality, making a strong case for why the applicant is ideal for the position.
    Below is the provided job description and requirements in a json string format\n\n: ${jobReqs}.\n\n
    Below is the user's reusme\n\n${resumeInfo}`;

    const generationConfig = {
      temperature: 0
    };

    model = await initModel(generationConfig);

    console.log(model)
  
    const coverLetter = await runPrompt(coverLetterPrompt);

    return coverLetter;
}



function showLoading() {
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  // Make sure to preserve line breaks in the response
  elementResponse.textContent = '';
  const paragraphs = response.split(/\r?\n/);
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    // Don't add a new line after the final paragraph
    if (i < paragraphs.length - 1) {
      elementResponse.appendChild(document.createElement('BR'));
    }
  }
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute('hidden');
}

function hide(element) {
  element.setAttribute('hidden', '');
}
