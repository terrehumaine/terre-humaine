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


/* 
    <div class="border-l-4 border-gray-300 pl-4">
        <h4 class="font-bold">Titre de la citation</h4>
        <p class="italic my-2">"Texte de la citation..."</p>
        <p class="text-sm text-gray-600">- Auteur</p>
    </div>
*/
function createSecondaryArticle(data){
    const article = document.createElement("div");
    article.className = "border-l-4 border-gray-300 pl-4";

    const title = document.createElement("h4");
    title.className = "font-bold";
    title.innerText = data.title;
    
    const body = document.createElement("div");
    body.className = "";
    body.innerHTML = data.html;

    const author = document.createElement("p");
    author.className = "text-sm text-gray-600"
    author.innerText;

    article.append(title, body, author);
    return article;
}
  


const dataStore = {};

const urlPeriod = getUrlParam('period');

const getDataJob = (new Promise((resolve, refect)=>{
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


document.addEventListener('DOMContentLoaded', function() {
    //wait for dataStore
    getDataJob
        .then(()=>{
            const data = dataStore.currentIssue;

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
                ps.innerText = d;
                mainArticlePostscriptums.append(ps);
            });
        
            
            const secondaryArticlesContainer = document.querySelector('.secondary-articles');
            secondaryArticlesContainer.innerHTML = '';
            const secondaryArticles = data.articlesMineurs.map(createSecondaryArticle);
            secondaryArticlesContainer.append(...secondaryArticles);
        })

});
