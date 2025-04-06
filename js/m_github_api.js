import { dataStore } from "/js/m_data_store.js";

const GITHUB_OWNER = 'terrehumaine',
    GITHUB_REPO = 'terre-humaine',
    GITHUB_BRANCH = 'main'; // ветка по умолчанию
    // GITHUB_TOKEN = window.localStorage.getItem("githubKey");
    

export async function pushFilesToGitHub({
    files,         // массив объектов { path, file } или { path, content, type? }
    commitMessage = 'Submit files via REST API' // сообщение коммита
}) {
    for (const item of files) {
        let fileObject;

        // Преобразуем входные данные в File объект
        if (item.file instanceof File) {
            fileObject = item.file; // Уже File объект из input
        } else if (item.content !== undefined) {
            // Определяем MIME-тип на основе расширения файла или явно указанного type
            const fileName = item.path.split('/').pop() || 'file';
            const extension = fileName.split('.').pop().toLowerCase();
            const mimeType = item.type || getMimeTypeFromExtension(extension);

            // Если content — строка или объект, преобразуем в зависимости от типа
            let contentData;
            if (typeof item.content === 'string' || item.content instanceof ArrayBuffer || item.content instanceof Blob) {
                contentData = item.content;
            } else {
                contentData = JSON.stringify(item.content); // Для JSON-объектов
            }

            const blob = new Blob([contentData], { type: mimeType });
            fileObject = new File([blob], fileName);
        } else {
            throw new Error('Каждый элемент должен содержать либо file, либо content');
        }

        // Получаем base64 содержимого нового файла
        const newBase64Content = await readFileAsBase64(fileObject);

        // Проверяем текущее состояние файла в репозитории
        const existingFile = await getFile(item.path);

        if (existingFile) {
            const normalizedExistingContent = normalizeBase64(existingFile.content);
            if (normalizedExistingContent === newBase64Content) {
                console.log(`Файл ${item.path} не изменился, пропускаем коммит`);
                continue;
            }
        }

        // Если файл новый или изменился, отправляем его
        const sha = existingFile ? existingFile.sha : null;
        await updateFile(item.path, newBase64Content, commitMessage, sha);
        console.log(`Файл ${item.path} успешно обновлен или создан`);
    }
}
  
function normalizeBase64(base64) {
    try {
        const binary = atob(base64.replace(/[\r\n\s]/g, ''));
        return btoa(binary);
    } catch (e) {
        throw new Error('Ошибка нормализации base64: ' + e.message);
    }
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function getFile(path) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${GITHUB_BRANCH}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `token ${dataStore.githubKey}`,
        }
    });
    if (response.status === 404) {
        return null; // файл не существует
    }
    if (!response.ok) {
        throw new Error(`Не удалось получить файл: ${response.statusText}`);
    }
    const data = await response.json();
    return {
        sha: data.sha,
        content: data.content 
      };
}

async function updateFile(path, base64Content, commitMessage, sha = null) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`;
    const body = {
        message: commitMessage,
        content: base64Content,
        branch: GITHUB_BRANCH
    };
    if (sha) {
        body.sha = sha; // добавляем SHA для обновления существующего файла
    }
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${dataStore.githubKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Не удалось обновить файл: ${response.statusText}`);
    }
    return response.json();
}

function getMimeTypeFromExtension(extension) {
    const mimeTypes = {
      'txt': 'text/plain',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf': 'application/pdf',
      // Добавьте другие типы по необходимости
    };
    return mimeTypes[extension] || 'application/octet-stream'; // По умолчанию бинарный тип
  }