const  { fetchJson, period2Long, getIssueData, 
    menuActiveToggle 
} = await import(`/js/m_utilites.js?t=${window.TH_TOKEN}`);
const { pushFilesToGitHub } = await import(`/js/m_github_api.js?t=${window.TH_TOKEN}`);
const { removeAllChildren } = await import(`/js/m_page_manipulation.js?t=${window.TH_TOKEN}`);


const dialogWindow = document.getElementById('article-modal');
const closeModalButton = document.getElementById('close-modal');
const btnAddIssue = document.querySelector('.btn-add-issue');

export function showAddIssueDialog(){
    dialogWindow.classList.remove('hidden');
    btnAddIssue.classList.add('turning-ring'); // Add turning ring to show loading process

    loadQuill()
        .then(async ()=>{

            await populatePeriodSelector();
            menuActiveToggle();
            issueEditorPreparation()
        })
        .then(()=>{
            btnAddIssue.classList.remove('turning-ring'); // Remove turning ring
        })
}

closeModalButton.addEventListener('click', () => {
    clearTheForm();
    dialogWindow.classList.add('hidden');
});

// Load Quill editor library
function loadQuill() {
    return new Promise((resolve, reject) => {
        // Check if Quill is already loaded
        if (window.Quill) {
            resolve(window.Quill);
            return;
        }

        // Load Quill CSS
        const quillCssId = 'quill-css';
        if (!document.getElementById(quillCssId)) {
            const link = document.createElement('link');
            link.id = quillCssId;
            link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Load Quill JS
        const quillJsId = 'quill-js';
        if (!document.getElementById(quillJsId)) {
            const script = document.createElement('script');
            script.id = quillJsId;
            script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
            script.onload = checkQuillReady;
            script.onerror = () => reject(new Error("Failed to load Quill script"));
            document.head.appendChild(script);
        } else {
            checkQuillReady();
        }

        // Check if Quill object is ready
        function checkQuillReady() {
            const interval = setInterval(() => {
                if (window.Quill) {
                    clearInterval(interval);
                    const icons = Quill.import('ui/icons');
                    icons['bold'] = '<b>G</b>';
                    icons['underline'] = '<u>U</u>';
                    resolve(window.Quill);
                }
            }, 50); // check every 50ms
        }
    });
}

function mainImageInputHandler(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.querySelector('#form-main-image');
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function fileJournalInputHandler(event) {
    const file = event.target.files[0];
    console.log(file);
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const dataUrl = e.target.result;
            const base64String = dataUrl.split(',')[1];

            const binaryData = atob(base64String);
            const byteArray = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
                byteArray[i] = binaryData.charCodeAt(i);
            }

            event.target.fileData = {
                name: fileName,
                type: file.type,
                byteArray: byteArray,
                extension: fileExtension,
            };
            // console.log("fileJournalInput", fileJournalInput.fileData);
        };
        reader.readAsDataURL(file);
    }
}

function issueEditorPreparation() {
    const wholeForm = document.querySelector('.form-main-article');
    // return if the form is already prepared
    if (wholeForm.classList.contains('form-is-prepared')) {
        return;
    }

    // Prepare the form
    const mainImageInput = document.querySelector('#form-main-image-input');
    mainImageInput.addEventListener('change', mainImageInputHandler);

    const fileJournalInput = document.querySelector('#file-journal');
    fileJournalInput.addEventListener('change', fileJournalInputHandler);

    const submitIssueButton = document.querySelector('.submit-issue');    
    submitIssueButton.addEventListener('click', async () => {
        const formData = await getFormData();
        console.log(formData);
        // Decide whether it is existing or new issue
        const formPeriod = formData.period;

        const filesToPush = [];
        // Prepare img1.jpg
        const mainImageBase64 = formData.article?.imageBase64;
        if(mainImageBase64) {
            const mainImagePath = `articles/${formPeriod}/img1.jpg`;
            const mainImageType = 'image/jpeg';
            const mainImageFile = {
                path: mainImagePath,
                content: mainImageBase64,
                type: mainImageType
            };
            filesToPush.push(mainImageFile);
            delete formData.article.imageBase64; 
        }

        // Prepare issue.json
        const issueJsonPath = `articles/${formPeriod}/issue.json`;
        const issueJsonContent = JSON.stringify(formData, null, 4);
        const issueJsonType = 'application/json';
        const issueJsonFile = { 
            path: issueJsonPath, 
            content: issueJsonContent, 
            type: issueJsonType 
        };
        filesToPush.push(issueJsonFile);

        // prepare issueFile
        // Prepare docx/pdf
        const fileJournalInput = document.querySelector('#file-journal');
        const fileData = fileJournalInput.fileData;
        let fileName = null
        if(fileData) {
            fileName = `Terre Humaine - ${formPeriod}.${fileData.extension}`
            const filePath = `archive/${fileName}`;
            const fileType = fileData.type;
            const journalFile = {
                path: filePath,
                content: fileData.byteArray,
                type: fileType
            };
            filesToPush.push(journalFile);
            delete formData.fileData; 
        }

        // Prepare archive.json
        const archiveData = await fetchJson(`archive.json?t=${window.TH_TOKEN}`);
        const lastIssue = archiveData[0];
        const existingPeriod = archiveData.find(d => d.period === formPeriod);
        
        console.log(existingPeriod);
        // const status = existingPeriod.status
        if (!existingPeriod) {
            const archiveJsonPath = 'archive.json';
            const newIssue = {
                period: formPeriod,
                issueNumber: lastIssue.issueNumber + 1,
                status: 'draft',
                file: fileData? fileName : null
            };
            const archiveDataNew = JSON.stringify([newIssue, ...archiveData], null, 4);
            const archiveJsonType = 'application/json';
            const archiveJsonFile = { 
                path: archiveJsonPath, 
                content: archiveDataNew, 
                type: archiveJsonType 
            };
            filesToPush.push(archiveJsonFile);
        }



        console.log({filesToPush: JSON.stringify(filesToPush, null, 4)});    
        // Push files to GitHub
        pushFilesToGitHub({ files: filesToPush, commitMessage: 'Submitting/editing new issue' })
            .then(() => {
                console.log('Files pushed successfully');
                clearTheForm();
                dialogWindow.classList.add('hidden');
            })
            .catch(error => {
                console.error('Error pushing files:', error);
            });
    });

    const addSecondaryButton = document.getElementById('add-secondary');
    addSecondaryButton.addEventListener('click', () => {
        addSecondaryArticle();
    });

    const mainEditor = new Quill('#main-editor', {
        modules: {
            toolbar: [
                // [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                ['link'],
            ],
        },
        placeholder: 'Votre texte principal ici',
        theme: 'snow'
    });


    wholeForm.classList.add('form-is-prepared');

    function addSecondaryArticle() {
        const secondaryArticle = document.createElement('div');
        secondaryArticle.classList.add('secondary-article', 'mb-4');
        
        const titleInput = document.createElement('input');
        titleInput.type = "text";
        titleInput.placeholder = "Titre";
        titleInput.classList.add('editor-secondary-title', 'w-full', 'border-2', 'border-gray-300', 'mb-2', 'p-2', 'rounded');

        const authorInput = document.createElement('input');
        authorInput.type = "text";
        authorInput.placeholder = "Auteur";
        authorInput.classList.add('editor-secondary-author', 'w-full', 'border-2', 'border-gray-300', 'mb-2', 'p-2', 'rounded');

        const editorContainer = document.createElement('div');
        editorContainer.classList.add('secondary-editor-container');

        const editorDiv = document.createElement('div');
        editorDiv.classList.add('secondary-editor', 'h-32');
        editorContainer.appendChild(editorDiv);

        secondaryArticle.append(titleInput, editorContainer, authorInput);

        const secondaryContainer = document.getElementById('secondary-articles-container');
        secondaryContainer.appendChild(secondaryArticle);

        new Quill(editorDiv, {
            modules: {
                toolbar: [
                    // [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    ['link'],
                ],
            },
            placeholder: 'Votre texte ici',
            theme: 'snow'
        });
    }
}

async function convertToJpeg(base64Image) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 1.0)); // Convert to JPEG format
        };
        img.onerror = () => reject(new Error('Failed to load image for conversion.'));
        img.src = base64Image;
    });
}

async function getFormData() {
    const period = document.getElementById('period-selector').value;
    const mainTitle = document.getElementById('main-title').value;

    const mainArticleImage = document.querySelector('#form-main-image');
    let mainArticleImageBase64 = null;

    // Check if the image URL contains a base64 string
    if (mainArticleImage.src.startsWith('data:image/')) {
        if (!mainArticleImage.src.startsWith('data:image/jpeg')) {
            mainArticleImageBase64 = await convertToJpeg(mainArticleImage.src);
            mainArticleImageBase64 = mainArticleImageBase64.split(',')[1]; // Extract base64 part
        } else {
            mainArticleImageBase64 = mainArticleImage.src.split(',')[1]; // Extract base64 part
        }
    }
    const imageBinaryData = atob(mainArticleImageBase64);
    const imageByteArray = new Uint8Array(imageBinaryData.length);
    for (let i = 0; i < imageBinaryData.length; i++) {
        imageByteArray[i] = imageBinaryData.charCodeAt(i);
    }


    const mainContent = document.querySelector('#main-editor .ql-editor').innerHTML;
    const mainAuthor = document.querySelector('#main-author').value;

    const secondaryArticles = [];
    const secondaryArticleElements = document.querySelectorAll('.secondary-article');
    secondaryArticleElements.forEach((articleElement) => {
        const title = articleElement.querySelector('.editor-secondary-title').value;
        const content = articleElement.querySelector('.secondary-editor .ql-editor').innerHTML;
        const author = articleElement.querySelector('.editor-secondary-author').value;
        secondaryArticles.push({
            title: title,
            html: content,
            author: author
        });
    });

    const mainImageInput = document.querySelector('#form-main-image-input');

    // Create the final object structure
    const articleData = {
        period,
        article: {
            title: mainTitle,
            html: mainContent,
            author: mainAuthor,
            postScriptums: [],
            imageBase64: imageByteArray 
        },
        articlesMineurs: secondaryArticles,
        fileData: mainImageInput.fileData,
    };

    return articleData;
}

function clearTheForm() {
    const mainArticleImage = document.querySelector('#form-main-image');
    mainArticleImage.src = `/img/empty-pic.jpg`;
    document.querySelector('#form-main-image-input').value = ''; 
    document.getElementById('main-title').value = '';
    document.querySelector('#main-editor .ql-editor').innerHTML = '';
    document.getElementById('main-author').value = '';
    const secondaryContainer = document.getElementById('secondary-articles-container');
    
    removeAllChildren(secondaryContainer);
}

function populatePeriodSelector() {
    return fetchJson(`/archive.json?t=${window.TH_TOKEN}`)
        .then(data => {
            const periodSelector = document.getElementById('period-selector');
            
            // Clear the dropdown list
            removeAllChildren(periodSelector);

            // Populate the dropdown with existing periods
            const periods = data.map(d => d.period);

            // Determine the next period
            const lastPeriod = periods[0];
            const [lastYear, lastMonth] = lastPeriod.split('-').map(Number);
            const nextMonth = lastMonth === 12 ? 1 : lastMonth + 1;
            const nextYear = lastMonth === 12 ? lastYear + 1 : lastYear;
            const nextPeriod = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

            // Populate the dropdown with the next period at the beginning
            [nextPeriod, ...periods].forEach(period => {
                const option = document.createElement('option');
                option.value = period;
                option.textContent = period2Long(period);
                periodSelector.appendChild(option);
            });

            // Add event listener to load issue data on selection
            periodSelector.addEventListener('change', (event) => {
                const selectedPeriod = event.target.value;
                
                const selectedIssue = data.find(d => d.period === selectedPeriod);
                // Clear the fields of the form
                clearTheForm();

                if (sefillFormWithIssueDatalectedIssue) { // If the selected period already exists
                    getIssueData(selectedPeriod) // TODO: if it is not existing, just finish without error
                        .then(issueData => {
                            issueData.file = selectedIssue.file; 
                            fillFormWithIssueData(issueData);
                        })
                        .catch(error => console.error('Error loading issue data:', error));
                }
            });
        })
        .catch(error => console.error('Error populating period selector:', error));
}

function fillFormWithIssueData(issueData) {
    // Setup the pic
    const mainArticleImage = document.querySelector('#form-main-image');
    mainArticleImage.src = `articles/${issueData.period}/img1.jpg`;
    // Fill the main article fields
    document.getElementById('main-title').value = issueData.article.title || '';
    document.querySelector('#main-editor .ql-editor').innerHTML = issueData.article.html || '';
    document.getElementById('main-author').value = issueData.article.author || '';
    document.querySelector('.issue-file-name').innerHTML = issueData.file? `(${issueData.file })`: '';

    // Clear and populate secondary articles
    const secondaryContainer = document.getElementById('secondary-articles-container');
    secondaryContainer.innerHTML = '';
    issueData.articlesMineurs.forEach(article => {
        const secondaryArticle = document.createElement('div');
        secondaryArticle.classList.add('secondary-article', 'mb-4');
        
        const titleInput = document.createElement('input');
        titleInput.type = "text";
        titleInput.placeholder = "Titre";
        titleInput.classList.add('editor-secondary-title', 'w-full', 'border-2', 'border-gray-300', 'mb-2', 'p-2', 'rounded');
        titleInput.value = article.title || '';

        const authorInput = document.createElement('input');
        authorInput.type = "text";
        authorInput.placeholder = "Auteur";
        authorInput.classList.add('editor-secondary-author', 'w-full', 'border-2', 'border-gray-300', 'mb-2', 'p-2', 'rounded');
        authorInput.value = article.author || '';

        const editorContainer = document.createElement('div');
        editorContainer.classList.add('secondary-editor-container');

        const editorDiv = document.createElement('div');
        editorDiv.classList.add('secondary-editor', 'h-32');
        editorContainer.appendChild(editorDiv);

        secondaryArticle.append(titleInput, editorContainer, authorInput);
        secondaryContainer.appendChild(secondaryArticle);

        const quill = new Quill(editorDiv, {
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    ['link'],
                ],
            },
            placeholder: 'Votre texte ici',
            theme: 'snow'
        });

        quill.root.innerHTML = article.html || '';
    });
}