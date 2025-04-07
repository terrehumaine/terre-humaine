const { period2Long } = await import(`/js/m_utilites.js?t=${new Date().getTime()}`);

export function issue2Page(data){
    const issuePeriod = document.querySelector('.issue-period');
    issuePeriod.innerText = period2Long(data.period);
    const issueNumber = document.querySelector('.issue-number');
    issueNumber.innerText = data.issueNumber;
    
    const mainArticleImage = document.querySelector('.article-image');
    mainArticleImage.src = `/articles/${data.period}/img1.jpg`
    
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
