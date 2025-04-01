const GITHUB_OWNER = 'terrehumaine',
    GITHUB_REPO = 'terre-humaine';

async function fetchJson(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching JSON:', error);
      throw error;
    }
};

function getIssueData(folder){
    return fetchJson(`articles/${folder}/issue.json`);
}

function getUrlParam(parameter) {
    const url = window.location.href;
    const urlObject = new URL(url);
    return urlObject.searchParams.get(parameter);
}

function period2Long(period){
    const months = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const [yyyy, mm] = period.split('-');
    return `${months[mm*1]} ${yyyy}`;
}



function createSecondaryArticle(data) {
    const article = document.createElement("div");
    article.className = "pl-4";

    const title = document.createElement("h4");
    title.className = "border-t-2 border-b-2 border-black text-center mb-3 font-bold";
    title.innerText = data.title;
    
    const body = document.createElement("div");
    body.className = "";
    
    // Function to safely truncate HTML content
    function truncateHTML(html, maxWords) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        function countWords(node) {
            let count = 0;
            const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
            while (walk.nextNode()) {
                count += walk.currentNode.nodeValue.trim().split(/\s+/).filter(Boolean).length;
            }
            return count;
        }
        
        function truncateNode(node, wordsLeft) {
            if (wordsLeft <= 0) return 0;
            
            const childNodes = Array.from(node.childNodes);
            for (let i = 0; i < childNodes.length; i++) {
                const child = childNodes[i];
                
                if (child.nodeType === Node.TEXT_NODE) {
                    const words = child.nodeValue.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= wordsLeft) {
                        wordsLeft -= words.length;
                    } else {
                        child.nodeValue = words.slice(0, wordsLeft).join(' ');
                        wordsLeft = 0;
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    wordsLeft = truncateNode(child, wordsLeft);
                }
                
                if (wordsLeft <= 0) {
                    // Remove remaining siblings
                    while (child.nextSibling) {
                        node.removeChild(child.nextSibling);
                    }
                    break;
                }
            }
            return wordsLeft;
        }
        
        const totalWords = countWords(div);
        if (totalWords <= maxWords) {
            return { html: div.innerHTML, isTruncated: false };
        }
        
        const truncatedDiv = div.cloneNode(true);
        truncateNode(truncatedDiv, maxWords);
        return { html: truncatedDiv.innerHTML, isTruncated: true };
    }
    
    // Get the full HTML content
    const fullContent = data.html;
    
    // Get truncated version (first 150 words)
    const { html: shortContent, isTruncated } = truncateHTML(fullContent, 150);
    
    // Create short and full content containers
    const shortTextDiv = document.createElement('div');
    shortTextDiv.innerHTML = shortContent;
    shortTextDiv.className = 'short-content';
    
    const fullTextDiv = document.createElement('div');
    fullTextDiv.innerHTML = fullContent;
    fullTextDiv.className = 'full-content hidden';
    
    // Create "Lire plus" button (only if content was truncated)
    const readMoreBtn = document.createElement('span');
    if (isTruncated) {
        readMoreBtn.innerHTML = '... <strong>Lire plus</strong>';
        readMoreBtn.className = 'read-more-btn cursor-pointer text-blue-600 hover:underline';
    } else {
        readMoreBtn.className = 'hidden';
    }
    
    // Create "Lire moins" button
    const readLessBtn = document.createElement('span');
    readLessBtn.innerHTML = '<strong>Lire moins</strong>';
    readLessBtn.className = 'read-less-btn cursor-pointer text-blue-600 hover:underline hidden';
    
    // Add click event listeners
    readMoreBtn.addEventListener('click', () => {
        shortTextDiv.classList.add('hidden');
        fullTextDiv.classList.remove('hidden');
        readMoreBtn.classList.add('hidden');
        readLessBtn.classList.remove('hidden');
    });
    
    readLessBtn.addEventListener('click', () => {
        shortTextDiv.classList.remove('hidden');
        fullTextDiv.classList.add('hidden');
        readMoreBtn.classList.remove('hidden');
        readLessBtn.classList.add('hidden');
    });

    // Append all elements
    body.appendChild(shortTextDiv);
    body.appendChild(readMoreBtn);
    body.appendChild(fullTextDiv);
    body.appendChild(readLessBtn);

    const author = document.createElement("p");
    author.className = "text-sm text-gray-600 text-right";
    author.innerText = data.author || '';

    article.append(title, body, author);
    return article;
}
  
function issue2Page(data){
    const issuePeriod = document.querySelector('.issue-period');
    issuePeriod.innerText = period2Long(data.period);
    const issueNumber = document.querySelector('.issue-number');
    issueNumber.innerText = data.issueNumber;
    
    const mainArticleImage = document.querySelector('.article-image');
    mainArticleImage.src = `articles/${data.period}/img1.jpg`
    
    const mainArticleTitle = document.querySelector('.article-title');
    mainArticleTitle.innerText  = data.article.title;

    const mainArticle = document.querySelector('.article-main-text');
    mainArticle.innerHTML = data.article.html;
    const mainArticleAuthor = document.querySelector('.article-author');
    mainArticleAuthor.innerText = data.article.author;
    const mainArticlePostscriptums = document.querySelector('.article-postscriptums');
    mainArticlePostscriptums.innerHTML = '';
    data.article.postScriptums.forEach((d, i)=>{
        const ps = document.createElement("p");
        ps.className = "text-sm text-gray-700";
        ps.innerHTML = `<b>${'P'.repeat(i+1)}.S.</b> ${d}`;
        mainArticlePostscriptums.append(ps);
    });

    
    const secondaryArticlesContainer = document.querySelector('.secondary-articles');
    secondaryArticlesContainer.innerHTML = '';
    const secondaryArticles = data.articlesMineurs.map(createSecondaryArticle);
    secondaryArticlesContainer.append(...secondaryArticles);
}

function fillArchiveList(data){
    const archiveContainer = document.querySelector('.th-archives');
    data.forEach(d=>{
        const li = document.createElement("li");
        li.className = 'h_over:';
        const tagName = d.fileOnly?"i":"a";
        li.innerHTML = `<${tagName} href="/?period=${d.period}" class="${d.fileOnly?'':'underline text-blue-600'}">
                ${period2Long(d.period)} - n°${d.issueNumber}
            </${tagName}> 
            (<a href="/archive/${d.file}" target="_blank" class="underline text-blue-600">télécharger</a>)`;
        archiveContainer.append(li);
    })
    // <li class="hover:text-blue-600"><a href="#">Février 2024 - n°340</a></li>
}

// function observeElementResize(element, callback){
//     // call it anyway before event is arrived
//     callback();
//     const el = document.querySelector(element);
//     window.addEventListener('resize', callback);
//     const observer = new ResizeObserver(callback);
//     observer.observe(el);
// }


const dataStore = {};

const getDataJob = (new Promise((resolve, refect)=>{
    const urlPeriod = getUrlParam('period');
    if(urlPeriod){
        resolve(urlPeriod);
        return ;
    }

    // receiving last issue
    fetchJson('current.json')
        .then(data=>{
            dataStore.currentNumber = data.numero;
            dataStore.currentFolder = data.period;
            resolve(data.period);
        });
}))
    .then(getIssueData)
    .then(data=>{
        dataStore.currentIssue = data;
    });

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
function issueEditorPreparation() {
    const addButton = document.querySelector('.btn-add-issue');
    const optionsButton = document.querySelector('.btn-options');
    const modal = document.getElementById('article-modal');
    const closeModalButton = document.getElementById('close-modal');
    const submitIssueButton = document.querySelector('.submit-issue');
    const addSecondaryButton = document.getElementById('add-secondary');
    const secondaryContainer = document.getElementById('secondary-articles-container');
    
    addButton.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
        menuActiveToggle();
    });

    optionsButton.addEventListener('click', (e) => {
        e.preventDefault();
        constructOptions();
        menuActiveToggle();
    });

    closeModalButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    submitIssueButton.addEventListener('click', () => {
        const data = getFormData();
        console.log(data);
    });

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

    // function updateElementTopHeight(element, varName){
    //     const height = element.offsetHeight;
    // }
    // const modalTitle = document.querySelector('.main-title-container');
    // observeElementResize(modalTitle, callback);

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
    function getFormData() {
        // Assume you have textarea and editor for main article and secondary articles
        const mainTitle = document.getElementById('main-title').value;
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
    
        // Create the final object structure
        const articleData = {
            article: {
                title: mainTitle,
                html: mainContent,
                author: mainAuthor,
                postScriptums: []
            },
            articlesMineurs: secondaryArticles
        };
    
        return articleData;
    }
}
/* ======== Options ========= */
function constructOptions() {
    const scriptId = 'options-js';

    // Check if the script is already loaded
    if (document.getElementById(scriptId)) {
        // Assume there's a function in /options.js called `showOptions` to display the settings window
        if (typeof showOptions === 'function') {
            showOptions();
        } else {
            console.error('Function showOptions is not defined.');
        }
        return;
    }

    // Script not loaded yet, load it
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = '/options.js?t=' + Math.random();
    script.onload = function() {
        if (typeof showOptions === 'function') {
            showOptions();
        } else {
            console.error('Function showOptions is not defined.');
        }
    };
    script.onerror = function() {
        console.error('Failed to load /options.js');
    };

    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('main.js: DOMContentLoaded');
    //wait for dataStore
    getDataJob
        .then(()=>{
            const data = dataStore.currentIssue;
            issue2Page(data);

        });

    fetchJson('archive.json')
        .then(fillArchiveList);

    loadQuill() 
        .then(issueEditorPreparation);

});
